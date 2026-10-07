const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// The platform signs user-identity tokens with an RSA private key it never
// shares. Containers get only the PUBLIC half, so this app can verify who a
// user is but cannot mint an identity — and neither can any other app.
const JWT_PUBLIC_KEY = (process.env.USERNODE_JWT_PUBLIC_KEY || '')
  .replace(/\\n/g, '\n');

// Tokens are minted for one app: the audience is this app's numeric id, so a
// token issued for a different app is rejected below rather than accepted as
// a valid user.
const APP_AUDIENCE = process.env.USERNODE_APP_ID
  ? 'usernode:app:' + process.env.USERNODE_APP_ID
  : null;

// Visitors with no Homeroom account ("guests") may look around this app at
// its own address, read-only (every public app). The platform marks
// them with a token of their own: ES256, signed by a key of its own (its
// public half is USERNODE_GUEST_JWT_PUBLIC_KEY), this audience, `pur:
// 'guest'`, `guest: true`, and no id or username. Such a visitor is
// `req.guest`, never `req.user`, and every write they try is answered 401
// `account_required`, which the bridge turns into "Make an account to
// continue".
const GUEST_AUDIENCE = APP_AUDIENCE ? APP_AUDIENCE + ':guest' : null;
const GUEST_PUBLIC_KEY = (process.env.USERNODE_GUEST_JWT_PUBLIC_KEY || '')
  .replace(/\\n/g, '\n');

// Paths that stay open without authentication. Add a path here (and add it
// with `app.get`/`app.post` below) if you deliberately want it public.
// Everything else requires a valid platform-issued JWT.
const PUBLIC_API_PATHS = new Set(['/health']);

app.use(express.json());

// The platform's three centrally hosted files — the bridge, the native UI
// kit and the Tailwind runtime — are reachable at these paths on this app's
// OWN origin, so index.html can load them with a RELATIVE path and never
// name the platform's hostname. A hostname baked into an app is what breaks
// every app at once when the platform's domain moves.
//
// In production and on a staging preview the platform's edge answers these
// before the request ever reaches this process (a per-app Ingress rule on
// Kubernetes, the wildcard site's matcher on the docker runtime). This
// handler is what makes the same relative paths work under a plain
// `node server.js`, where there is no edge in front of the app at all.
//
// Registered BEFORE the auth middleware because these three files are
// public: the platform serves them anonymously from any app origin, and a
// login redirect arriving where a <script> was expected is exactly the
// failure a relative path is meant to avoid.
// The platform's origin, at RUNTIME, and ONLY from the variable the platform
// injects. No hostname is written into this file: a baked-in one is what left
// the whole fleet pointing at a domain the platform had moved away from.
// Unset only outside the platform (a plain local `node server.js`) — set
// USERNODE_PLATFORM_ORIGIN there too if you want the hosted assets locally.
const PLATFORM_ORIGIN = (process.env.USERNODE_PLATFORM_ORIGIN || '')
  .replace(/\/+$/, '');

app.get(/^\/usernode-(?:bridge|native|tailwind)\//, async (req, res) => {
  try {
    if (!PLATFORM_ORIGIN) return res.sendStatus(503);
    const upstream = await fetch(PLATFORM_ORIGIN + req.path);
    if (!upstream.ok) return res.sendStatus(upstream.status);
    const type = upstream.headers.get('content-type');
    if (type) res.type(type);
    // max-age=0 with revalidation, never a long TTL: the whole point of
    // central hosting is that a platform-side fix lands on the next load.
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    console.warn('hosted asset fetch failed: ' + err.message);
    return res.sendStatus(502);
  }
});

// "Now" for this request, as a Date: `req.now`, set for every request by
// the middleware below. Read the day and the time through it (and
// `usernode.now()` in the page), never `new Date()` or SQL's NOW(),
// wherever they decide what shows: a reminder, a rota, a deadline.
// Production always gets the real time. A staging preview may be shown as of
// a chosen moment: the platform opens it with `?un-now=<ISO time>`, and the
// page sends `usernode.now()` on as the `x-usernode-now` header. Only a
// staging container reads either. See "Time-dependent features" in the
// platform conventions.
const IS_STAGING = process.env.USERNODE_ENV === 'staging';
const PREVIEW_NOW = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
function requestNow(req) {
  const raw = IS_STAGING ? (req.headers['x-usernode-now'] || req.query['un-now']) : null;
  return typeof raw === 'string' && PREVIEW_NOW.test(raw) ? new Date(raw) : new Date();
}

// Verify platform-issued JWT if one was passed, then enforce auth on
// anything not explicitly marked public. The iframe adds `?token=…`
// on load; the frontend script forwards the token via `x-usernode-token`
// on subsequent fetches.
app.use((req, res, next) => {
  req.now = requestNow(req);
  const token = req.query.token || req.headers['x-usernode-token'];
  if (token && JWT_PUBLIC_KEY && APP_AUDIENCE) {
    try {
      // Pin the algorithm, issuer and audience. Without `algorithms` a
      // caller could hand us an HS256 token signed with the public PEM
      // (which every app knows) and forge any user.
      const claims = jwt.verify(token, JWT_PUBLIC_KEY, {
        algorithms: ['RS256'],
        issuer: 'usernode',
        audience: APP_AUDIENCE,
      });
      // `pur` names what the token is for. Only user-identity tokens
      // authenticate a person here.
      if (claims && claims.pur === 'iframe') req.user = claims;
    } catch {}
  }
  if (!req.user && token && GUEST_PUBLIC_KEY && GUEST_AUDIENCE) {
    try {
      const guest = jwt.verify(token, GUEST_PUBLIC_KEY, {
        algorithms: ['ES256'],
        issuer: 'usernode',
        audience: GUEST_AUDIENCE,
      });
      if (guest && guest.pur === 'guest' && guest.guest === true) req.guest = true;
    } catch {}
  }

  // Static assets (CSS/JS/images) are always served; the API and the HTML
  // shell are gated so direct hits to the staging/prod subdomain don't
  // leak app data to the public internet. A guest may READ: every GET,
  // `/api/*` included, so read routes must not assume req.user (use
  // `req.user ? req.user.id : null`). Every write needs an account.
  if (req.method !== 'GET' || req.path.startsWith('/api/')) {
    if (PUBLIC_API_PATHS.has(req.path)) return next();
    if (!req.user && req.guest) {
      if (req.method === 'GET' || req.method === 'HEAD') return next();
      return res.status(401).json({ error: 'account_required' });
    }
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

/* ── Rilo's API ───────────────────────────────────────────────────────────
 * One page, one state endpoint, four private per-owner tables. Every route
 * below is scoped to `owner_id = String(req.user.id)`: firsts are family
 * data and visible only to the person who logged them (the tables are
 * marked `staging:private` in ensureSchema()).
 */

// Dates travel as plain `YYYY-MM-DD` strings everywhere: Postgres `date`
// columns are cast to text in SELECTs so node-pg never turns them into a
// Date in some zone, and validation round-trips through UTC.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function validDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  const d = new Date(value + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10) === value ? value : null;
}
function serverToday(now) {
  return now.toISOString().slice(0, 10);
}
function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
// "Today" with a day of slack, so a parent whose clock is ahead of the
// server's UTC day is not told their today is in the future.
function latestAllowedDay(now) {
  return addDays(serverToday(now), 1);
}

// One async handler wrapper so a rejected query answers 500 instead of
// hanging the request.
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// The row shape /api/state, /api/entries (POST) and PATCH /api/entries/:id
// all return to the page.
const ENTRY_SELECT = `
  SELECT e.id, e.kind, e.label, e.sounds_like, e.language_id,
         e.said_on::text AS said_on, e.note, e.is_demo,
         l.name AS language_name
  FROM entries e LEFT JOIN languages l ON l.id = e.language_id
  WHERE e.id = $1 AND e.owner_id = $2`;

app.get('/api/state', wrap(async (req, res) => {
  if (!req.user) {
    // A guest looks around: they see the setup screen, never someone's child.
    return res.json({ child: null, languages: [], entries: [] });
  }
  const ownerId = String(req.user.id);
  // The populated first-version demo, on staging and ?demo=1 only.
  if (IS_STAGING && req.query.demo === '1') {
    try {
      await seedDemoFor(ownerId, req.now);
    } catch (err) {
      console.warn('demo seed failed: ' + err.message);
    }
  }
  const child = await pool.query(
    'SELECT name, birthday::text AS birthday, is_demo FROM children WHERE owner_id = $1',
    [ownerId]);
  const languages = await pool.query(
    `SELECT l.id, l.name, l.is_demo,
            (SELECT count(*) FROM entries e
             WHERE e.language_id = l.id AND e.owner_id = $1)::int AS uses
     FROM languages l WHERE l.owner_id = $1
     ORDER BY lower(l.name)`,
    [ownerId]);
  const entries = await pool.query(
    `SELECT e.id, e.kind, e.label, e.sounds_like, e.language_id,
            e.said_on::text AS said_on, e.note, e.is_demo,
            l.name AS language_name
     FROM entries e LEFT JOIN languages l ON l.id = e.language_id
     WHERE e.owner_id = $1
     ORDER BY e.said_on DESC, e.id DESC`,
    [ownerId]);
  res.json({
    child: child.rows[0] || null,
    languages: languages.rows,
    entries: entries.rows,
  });
}));

app.put('/api/child', wrap(async (req, res) => {
  const ownerId = String(req.user.id);
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (name.length < 1 || name.length > 40) {
    return res.status(400).json({ error: 'Add a name between 1 and 40 characters.' });
  }
  const birthday = validDate(req.body.birthday);
  if (!birthday) {
    return res.status(400).json({ error: 'Pick a birthday.' });
  }
  if (birthday < '1990-01-01' || birthday > latestAllowedDay(req.now)) {
    return res.status(400).json({ error: 'Pick a birthday between 1990 and today.' });
  }
  const saved = await pool.query(
    `INSERT INTO children (owner_id, name, birthday)
     VALUES ($1, $2, $3)
     ON CONFLICT (owner_id) DO UPDATE
       SET name = $2, birthday = $3, is_demo = false, updated_at = NOW()
     RETURNING name, birthday::text AS birthday, is_demo`,
    [ownerId, name, birthday]);
  res.json(saved.rows[0]);
}));

app.post('/api/languages', wrap(async (req, res) => {
  const ownerId = String(req.user.id);
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (name.length < 1 || name.length > 30) {
    return res.status(400).json({ error: 'Type a language name between 1 and 30 characters.' });
  }
  const existing = await pool.query(
    'SELECT id, name FROM languages WHERE owner_id = $1 AND lower(name) = lower($2)',
    [ownerId, name]);
  if (existing.rows.length) return res.json(existing.rows[0]);
  const inserted = await pool.query(
    `INSERT INTO languages (owner_id, name) VALUES ($1, $2)
     ON CONFLICT (owner_id, lower(name)) DO NOTHING
     RETURNING id, name`,
    [ownerId, name]);
  if (inserted.rows.length) return res.json(inserted.rows[0]);
  // Lost a race with an identical insert: read the winner.
  const winner = await pool.query(
    'SELECT id, name FROM languages WHERE owner_id = $1 AND lower(name) = lower($2)',
    [ownerId, name]);
  return res.json(winner.rows[0]);
}));

// Validates the fields an add and an edit share, against the child row the
// dates are measured from. Returns { error } (already answered) or the values.
async function validateEntry(req, res, ownerId) {
  const kind = req.body.kind;
  if (kind !== 'word' && kind !== 'sound' && kind !== 'sign') {
    res.status(400).json({ error: 'Choose Word, Animal sound or Sign.' });
    return null;
  }
  const label = typeof req.body.label === 'string' ? req.body.label.trim() : '';
  if (label.length < 1 || label.length > 60) {
    res.status(400).json({ error: 'Write the ' + (kind === 'word' ? 'word' : kind === 'sound' ? 'animal' : 'sign') + '.' });
    return null;
  }
  const sounds_like = typeof req.body.sounds_like === 'string' ? req.body.sounds_like.trim() : '';
  if (sounds_like.length > 80) {
    res.status(400).json({ error: 'Keep how it sounds under 80 characters.' });
    return null;
  }
  const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
  if (note.length > 280) {
    res.status(400).json({ error: 'Keep the note under 280 characters.' });
    return null;
  }
  const said_on = validDate(req.body.said_on);
  if (!said_on) {
    res.status(400).json({ error: 'Pick a date.' });
    return null;
  }
  const child = await pool.query(
    'SELECT birthday::text AS birthday FROM children WHERE owner_id = $1',
    [ownerId]);
  if (!child.rows.length) {
    res.status(400).json({ error: "Add your child's name and birthday first." });
    return null;
  }
  if (said_on < child.rows[0].birthday) {
    res.status(400).json({ error: 'Pick a date on or after the birthday.' });
    return null;
  }
  if (said_on > latestAllowedDay(req.now)) {
    res.status(400).json({ error: 'Pick a date no later than today.' });
    return null;
  }
  let language_id = null;
  if (req.body.language_id != null) {
    language_id = Number(req.body.language_id);
    if (!Number.isInteger(language_id)) {
      res.status(400).json({ error: 'Choose one of your languages.' });
      return null;
    }
    const owned = await pool.query(
      'SELECT 1 FROM languages WHERE id = $1 AND owner_id = $2',
      [language_id, ownerId]);
    if (!owned.rows.length) {
      res.status(400).json({ error: 'Choose one of your languages.' });
      return null;
    }
  }
  return {
    kind, label,
    sounds_like: sounds_like || null,
    note: note || null,
    language_id,
    said_on,
  };
}

app.post('/api/entries', wrap(async (req, res) => {
  const ownerId = String(req.user.id);
  const values = await validateEntry(req, res, ownerId);
  if (!values) return;
  const inserted = await pool.query(
    `INSERT INTO entries (owner_id, kind, label, sounds_like, language_id, said_on, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [ownerId, values.kind, values.label, values.sounds_like, values.language_id,
     values.said_on, values.note]);
  const row = await pool.query(ENTRY_SELECT, [inserted.rows[0].id, ownerId]);
  res.status(201).json(row.rows[0]);
}));

app.patch('/api/entries/:id', wrap(async (req, res) => {
  const ownerId = String(req.user.id);
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'First not found.' });
  const owned = await pool.query(
    'SELECT 1 FROM entries WHERE id = $1 AND owner_id = $2', [id, ownerId]);
  if (!owned.rows.length) return res.status(404).json({ error: 'First not found.' });
  const values = await validateEntry(req, res, ownerId);
  if (!values) return;
  await pool.query(
    `UPDATE entries
     SET kind = $1, label = $2, sounds_like = $3, language_id = $4,
         said_on = $5, note = $6, updated_at = NOW()
     WHERE id = $7 AND owner_id = $8`,
    [values.kind, values.label, values.sounds_like, values.language_id,
     values.said_on, values.note, id, ownerId]);
  const row = await pool.query(ENTRY_SELECT, [id, ownerId]);
  res.json(row.rows[0]);
}));

app.delete('/api/entries/:id', wrap(async (req, res) => {
  const ownerId = String(req.user.id);
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'First not found.' });
  const deleted = await pool.query(
    'DELETE FROM entries WHERE id = $1 AND owner_id = $2', [id, ownerId]);
  if (!deleted.rowCount) return res.status(404).json({ error: 'First not found.' });
  res.status(204).end();
}));

/* ── Schema and demo seed ──────────────────────────────────────────────── */

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS children (
      owner_id text PRIMARY KEY,
      name text NOT NULL,
      birthday date NOT NULL,
      is_demo boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT NOW(),
      updated_at timestamptz NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS languages (
      id serial PRIMARY KEY,
      owner_id text NOT NULL,
      name text NOT NULL,
      is_demo boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS languages_owner_name
      ON languages (owner_id, lower(name));
    CREATE TABLE IF NOT EXISTS entries (
      id serial PRIMARY KEY,
      owner_id text NOT NULL,
      kind text NOT NULL CHECK (kind IN ('word','sound','sign')),
      label text NOT NULL,
      sounds_like text,
      language_id int REFERENCES languages(id) ON DELETE SET NULL,
      said_on date NOT NULL,
      note text,
      is_demo boolean NOT NULL DEFAULT false,
      demo_key text,
      created_at timestamptz NOT NULL DEFAULT NOW(),
      updated_at timestamptz NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS entries_owner_said
      ON entries (owner_id, said_on DESC, id DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS entries_owner_demo_key
      ON entries (owner_id, demo_key);
    CREATE TABLE IF NOT EXISTS demo_seeds (
      owner_id text PRIMARY KEY,
      seeded_at timestamptz NOT NULL DEFAULT NOW()
    );
  `);
  // All four tables hold personal family data: private, and staged without
  // their rows (see "Public vs private tables" in the platform conventions).
  await pool.query(`COMMENT ON TABLE children IS 'staging:private'`);
  await pool.query(`COMMENT ON TABLE languages IS 'staging:private'`);
  await pool.query(`COMMENT ON TABLE entries IS 'staging:private'`);
  await pool.query(`COMMENT ON TABLE demo_seeds IS 'staging:private'`);
}

// The 22 demo firsts: kind, label, how it sounds or is signed, language, the
// age in months it happened at, and the day within that month. The date is
// the seeded child's birthday plus the months plus the day, capped at today.
const DEMO_ROWS = [
  { kind: 'word',  label: 'agua',     sounds_like: 'awa',     language: 'Spanish', months: 19, day: 4 },
  { kind: 'sound', label: 'duck',     sounds_like: 'kak kak', language: 'English', months: 19, day: 2 },
  { kind: 'sign',  label: 'more',     sounds_like: 'Taps fingertips together', language: 'ASL', months: 19, day: 0 },
  { kind: 'word',  label: 'shoes',    sounds_like: 'choo',    language: 'English', months: 18, day: 27 },
  { kind: 'sound', label: 'cow',      sounds_like: 'mmmoo',   language: 'English', months: 18, day: 21 },
  { kind: 'word',  label: 'gato',     sounds_like: 'tato',    language: 'Spanish', months: 18, day: 14 },
  { kind: 'sign',  label: 'milk',     sounds_like: 'Squeezes a fist', language: 'ASL', months: 18, day: 7 },
  { kind: 'word',  label: 'banana',   sounds_like: 'nana',    language: 'English', months: 17, day: 29 },
  { kind: 'sign',  label: 'all done', sounds_like: 'Twists both hands', language: 'ASL', months: 17, day: 20 },
  { kind: 'sound', label: 'dog',      sounds_like: 'wuh wuh', language: 'English', months: 17, day: 13 },
  { kind: 'word',  label: 'pelota',   sounds_like: 'lota',    language: 'Spanish', months: 17, day: 5,
    note: 'Staging demo: rolled the ball to Abuela' },
  { kind: 'word',  label: 'up',       sounds_like: 'ap',      language: 'English', months: 16, day: 24 },
  { kind: 'sound', label: 'sheep',    sounds_like: 'beee',    language: 'Spanish', months: 16, day: 15 },
  { kind: 'word',  label: 'abuela',   sounds_like: 'bela',    language: 'Spanish', months: 16, day: 8 },
  { kind: 'sign',  label: 'eat',      sounds_like: 'Taps fingers to mouth', language: 'ASL', months: 15, day: 22 },
  { kind: 'word',  label: 'hola',     sounds_like: 'ola',     language: 'Spanish', months: 15, day: 19 },
  { kind: 'sound', label: 'cat',      sounds_like: 'ow ow',   language: 'English', months: 15, day: 10 },
  { kind: 'word',  label: 'ball',     sounds_like: 'ba',      language: 'English', months: 14, day: 23 },
  { kind: 'sound', label: 'owl',      sounds_like: 'hoo hoo', language: 'English', months: 14, day: 16 },
  { kind: 'word',  label: 'dada',     sounds_like: 'dada',    language: 'English', months: 13, day: 17 },
  { kind: 'sign',  label: 'bye',      sounds_like: 'Opens and closes a hand', language: 'ASL', months: 12, day: 21 },
  { kind: 'word',  label: 'mamá',     sounds_like: 'mama',    language: 'Spanish', months: 12, day: 9 },
];

// Populates the viewing account's own first-version demo, once per viewer,
// on staging with ?demo=1 only (see "A first version's populated demo" in
// the platform conventions). A viewer's own child, languages and entries
// are kept: the ON CONFLICT clauses change nothing that is already there,
// and demo_seeds marks that the seed was written so rows a viewer deleted
// do not come back.
async function seedDemoFor(ownerId, now) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const marker = await client.query(
      'INSERT INTO demo_seeds (owner_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING owner_id',
      [ownerId]);
    if (!marker.rows.length) {
      await client.query('COMMIT');
      return;
    }
    // An owner with firsts of their own has moved past the demo: leave
    // their list alone. Keep the marker so we do not retry every open.
    const hasEntries = await client.query(
      'SELECT 1 FROM entries WHERE owner_id = $1 LIMIT 1',
      [ownerId]);
    if (hasEntries.rows.length) {
      await client.query('COMMIT');
      return;
    }
    // Leo's birthday: the first day of the month 19 months before now, so
    // today reads 1 year 7 months.
    const todayIso = serverToday(now);
    const demoBirthday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 19, 1)
    ).toISOString().slice(0, 10);
    const child = await client.query(
      `INSERT INTO children (owner_id, name, birthday, is_demo)
       VALUES ($1, 'Leo', $2, true)
       ON CONFLICT (owner_id) DO NOTHING
       RETURNING birthday::text AS birthday`,
      [ownerId, demoBirthday]);
    let birthday;
    if (child.rows.length) {
      birthday = child.rows[0].birthday;
    } else {
      // The viewer already has a child: seed against theirs instead.
      const existing = await client.query(
        'SELECT birthday::text AS birthday FROM children WHERE owner_id = $1',
        [ownerId]);
      birthday = existing.rows[0].birthday;
    }
    const languageNames = ['English', 'Spanish', 'ASL'];
    for (const name of languageNames) {
      await client.query(
        `INSERT INTO languages (owner_id, name, is_demo)
         VALUES ($1, $2, true)
         ON CONFLICT (owner_id, lower(name)) DO NOTHING`,
        [ownerId, name]);
    }
    const langs = await client.query(
      `SELECT id, lower(name) AS key FROM languages
       WHERE owner_id = $1 AND lower(name) = ANY($2)`,
      [ownerId, languageNames.map((n) => n.toLowerCase())]);
    const langId = Object.fromEntries(langs.rows.map((r) => [r.key, r.id]));
    let n = 0;
    for (const row of DEMO_ROWS) {
      n += 1;
      const [by, bm, bd] = birthday.split('-').map(Number);
      const at = new Date(Date.UTC(by, bm - 1 + row.months, bd + row.day));
      const saidOn = at.toISOString().slice(0, 10) > todayIso
        ? todayIso : at.toISOString().slice(0, 10);
      await client.query(
        `INSERT INTO entries
           (owner_id, kind, label, sounds_like, language_id, said_on, note,
            is_demo, demo_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
         ON CONFLICT (owner_id, demo_key) DO NOTHING`,
        [ownerId, row.kind, row.label, row.sounds_like,
         langId[row.language.toLowerCase()] || null, saidOn, row.note || null,
         'demo-' + String(n).padStart(2, '0')]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// The template ships no favicon file; index.html carries an inline SVG
// icon instead. Answer 204 here so anything that still probes
// /favicon.ico (older browsers, direct visits) doesn't fall through to
// the auth-gated catch-all and surface a 401 in the console on every
// fresh load.
app.get('/favicon.ico', (_req, res) => res.status(204).end());

app.use(express.static(path.join(__dirname, 'public')));

// HTML shell: serve the app if authenticated. Unauthenticated top-level
// visits (share links pasted into a browser — Sec-Fetch-Dest: document)
// are sent to the platform's chromeless view of this app, where the shell
// embeds it with a real token so the link just works. Every other
// tokenless case (iframe loads with an expired token, old browsers
// without Sec-Fetch-*) gets the "open in Homeroom" landing page instead
// of a redirect, so the platform shell is never loaded INSIDE its own
// app iframe and stray visits still don't reveal the app.
app.get('*', (req, res) => {
  if (!req.user && !req.guest) {
    // Deep-link pass-through (platform #743): carry the visited
    // path+query into the chromeless view so share links land on the
    // shared screen, not Home. The clean platform route stores `path`
    // as one encoded query value so an inner ?, &, or = survives. The
    // shell decodes and validates it as relative-only before use. The
    // character test keeps the
    // value attribute-safe for the landing anchor below — anything
    // unusual falls back to the bare link.
    const deepPath = /^\/[A-Za-z0-9\-._~!$&()*+,;=:@\/%?]*$/.test(req.originalUrl)
      ? '?path=' + encodeURIComponent(req.originalUrl) : '';
    if (PLATFORM_ORIGIN && req.get('sec-fetch-dest') === 'document') {
      return res.redirect(302, PLATFORM_ORIGIN + '/app/rilo-46e763/full' + deepPath);
    }
    return res.status(401).send(`<!doctype html><meta charset=utf-8><title>Open in Homeroom</title>
<body style="font-family:system-ui;background:#09090b;color:#e4e4e7;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
  <div style="max-width:24rem;padding:2rem;text-align:center">
    <h1 style="font-size:1.25rem;margin:0 0 0.5rem">Open this app inside Homeroom</h1>
    <p style="color:#a1a1aa;font-size:0.9rem;margin:0 0 1.25rem">This page is served via the platform; direct visits aren't authenticated.</p>
    <a href="${PLATFORM_ORIGIN}/app/rilo-46e763/full${deepPath}" style="display:inline-block;padding:0.5rem 1rem;background:#7c3aed;color:white;border-radius:0.5rem;text-decoration:none;font-size:0.9rem">Open in Homeroom</a>
  </div>
</body>`);
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Answers a failed handler with JSON instead of Express's HTML default.
app.use((err, req, res, _next) => {
  console.warn('request failed: ' + (err && err.message));
  if (res.headersSent) return;
  res.status(500).json({ error: 'Something went wrong. Try again.' });
});

// The schema exists before the app takes traffic: routes query these tables
// on the first request.
async function start() {
  await ensureSchema();
  const server = app.listen(port, () => console.log(`Listening on :${port}`));
  // Let Envoy retire idle upstream connections at 60s, with a 15s margin.
  server.keepAliveTimeout = 75_000;

  // Stop accepting connections, drain, close the pool, exit (platform
  // convention 9: the shutdown handler).
  let stopping = false;
  const shutdown = (signal) => {
    if (stopping) return;
    stopping = true;
    console.log(`${signal}: shutting down`);
    const finish = () => {
      pool.end().then(() => process.exit(0)).catch(() => process.exit(0));
    };
    server.close(finish);
    setTimeout(finish, 3000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch(err => { console.error(err); process.exit(1); });
