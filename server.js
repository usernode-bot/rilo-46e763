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

// API answers are per-person and change on every save: never let a browser
// reuse one (a cached /api/state would show a list edits have already
// moved).
app.use('/api', function (_req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
});

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
 * One page, one state endpoint, five private per-owner tables. Every route
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
// Birth months travel as `YYYY-MM` and are stored as the month's first day,
// so ages count whole calendar months from the month itself. The parent
// picks the month and the year, never the day (the creator's ask).
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
function validMonth(value) {
  if (typeof value !== 'string' || !MONTH_RE.test(value)) return null;
  const d = new Date(value + '-01T00:00:00Z');
  return d.toISOString().slice(0, 7) === value ? value : null;
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
// The same slack, in whole months: the month after the server's current one
// is still allowed as a birth month, so a parent just inside their own next
// month is not rejected.
function latestAllowedMonth(now) {
  return latestAllowedDay(now).slice(0, 7);
}

// One async handler wrapper so a rejected query answers 500 instead of
// hanging the request.
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// The row shape /api/state, /api/entries (POST) and PATCH /api/entries/:id
// all return to the page.
const ENTRY_SELECT = `
  SELECT e.id, e.kind, e.label, e.sounds_like, e.language_id,
         e.category, e.mastered, e.mastery, e.mastery_history,
         e.said_on::text AS said_on, e.note, e.is_demo, e.concept_id,
         l.name AS language_name
  FROM entries e LEFT JOIN languages l ON l.id = e.language_id
  WHERE e.id = $1 AND e.owner_id = $2`;

// The category each first belongs to; it picks the illustration on the
// block (people, animals, food…). The client infers it from the word and
// may send it; the server accepts only this list.
const CATEGORIES = new Set([
  'people', 'animals', 'food', 'transport', 'play',
  'body', 'home', 'outside', 'actions', 'words',
]);
function validCategory(value) {
  return CATEGORIES.has(value) ? value : 'words';
}

// Mastery has three stages (the creator's redesign): emerging (tried it once
// or twice), practicing (uses it with a nudge) and mastered (says it on their
// own). The older boolean `mastered` column is kept in step with it, so a
// request that still sends only `mastered` keeps working.
const MASTERY = new Set(['emerging', 'practicing', 'mastered']);
function validMastery(body) {
  if (MASTERY.has(body.mastery)) return body.mastery;
  return body.mastered === true ? 'mastered' : 'emerging';
}

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
            e.category, e.mastered, e.mastery, e.mastery_history,
            e.said_on::text AS said_on, e.note, e.is_demo, e.concept_id,
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
  const birthMonth = validMonth(req.body.birth_month);
  if (!birthMonth) {
    return res.status(400).json({ error: 'Pick a birth month and year.' });
  }
  if (birthMonth < '1990-01' || birthMonth > latestAllowedMonth(req.now)) {
    return res.status(400).json({ error: 'Pick a month between January 1990 and this one.' });
  }
  // Stored as the month's first day; every age is counted from the month.
  const birthday = birthMonth + '-01';
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
    res.status(400).json({ error: 'Choose Word, Sound or Sign.' });
    return null;
  }
  const label = typeof req.body.label === 'string' ? req.body.label.trim() : '';
  if (label.length < 1 || label.length > 60) {
    res.status(400).json({
      error: kind === 'sound' ? 'Name the animal or thing.' :
        kind === 'sign' ? 'Write the sign.' : 'Write the word.',
    });
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
  // One word may live in several languages on one entry (a concept). The
  // field is absent on a plain add, null means "unlink", and a number names
  // one of this owner's concepts to join.
  let concept;
  if (req.body.concept_id === undefined) concept = undefined;
  else if (req.body.concept_id === null) concept = null;
  else {
    concept = Number(req.body.concept_id);
    if (!Number.isInteger(concept)) {
      res.status(400).json({ error: 'Choose one of your entries to link to.' });
      return null;
    }
    const linked = await pool.query(
      'SELECT kind FROM concepts WHERE id = $1 AND owner_id = $2',
      [concept, ownerId]);
    if (!linked.rows.length) {
      res.status(400).json({ error: 'Choose one of your entries to link to.' });
      return null;
    }
    concept = { id: concept, kind: linked.rows[0].kind };
  }
  return {
    kind, label,
    sounds_like: sounds_like || null,
    note: note || null,
    language_id,
    said_on,
    concept,
    category: validCategory(req.body.category),
    mastery: validMastery(req.body),
  };
}

app.post('/api/entries', wrap(async (req, res) => {
  const ownerId = String(req.user.id);
  const values = await validateEntry(req, res, ownerId);
  if (!values) return;
  // The journey starts on the day it was first noticed, at the stage chosen.
  const history = JSON.stringify([{ level: values.mastery, on: values.said_on }]);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let conceptId;
    if (values.concept) {
      // Joining an existing card: the kinds must agree, so a word never
      // lands on a sound's card.
      if (values.concept.kind !== values.kind) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Link it to an entry of the same type.' });
      }
      conceptId = values.concept.id;
    } else {
      // A first of its own: one concept per entry, until a parent links
      // another language onto it.
      conceptId = (await client.query(
        'INSERT INTO concepts (owner_id, kind) VALUES ($1, $2) RETURNING id',
        [ownerId, values.kind])).rows[0].id;
    }
    const inserted = await client.query(
      `INSERT INTO entries (owner_id, kind, label, sounds_like, language_id, said_on, note,
                            category, mastered, mastery, mastery_history, concept_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
       RETURNING id`,
      [ownerId, values.kind, values.label, values.sounds_like, values.language_id,
       values.said_on, values.note, values.category, values.mastery === 'mastered',
       values.mastery, history, conceptId]);
    const row = await client.query(ENTRY_SELECT, [inserted.rows[0].id, ownerId]);
    await client.query('COMMIT');
    res.status(201).json(row.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

// The quick start onboarding: everything the child already does, tapped in
// one go on the day the family started using Rilo. Each pick is saved as an
// ordinary first dated today (server's today, the same slack as elsewhere),
// with no language and no note — the parent can edit any of them later.
app.post('/api/quick-start', wrap(async (req, res) => {
  const ownerId = String(req.user.id);
  const items = Array.isArray(req.body.items) ? req.body.items : null;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'Choose at least one first to add.' });
  }
  if (items.length > 30) {
    return res.status(400).json({ error: 'Add up to 30 at a time.' });
  }
  const child = await pool.query(
    'SELECT birthday::text AS birthday FROM children WHERE owner_id = $1',
    [ownerId]);
  if (!child.rows.length) {
    return res.status(400).json({ error: "Add your child's name and birthday first." });
  }
  // The birth month may sit one month past the server's today (the same
  // slack the birth month allows), so never save before the birthday.
  const today = serverToday(req.now);
  const saidOn = today < child.rows[0].birthday ? child.rows[0].birthday : today;
  const values = items.map(function (item) {
    if (!item || typeof item !== 'object') return null;
    const kind = item.kind;
    if (kind !== 'word' && kind !== 'sound' && kind !== 'sign') return null;
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    if (label.length < 1 || label.length > 60) return null;
    const sounds_like = typeof item.sounds_like === 'string' ? item.sounds_like.trim() : '';
    if (sounds_like.length > 80) return null;
    return [kind, label, sounds_like || null, validCategory(item.category)];
  });
  if (values.some(function (v) { return v === null; })) {
    return res.status(400).json({ error: 'One of the picks is missing its word, animal or sign.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const rows = [];
    for (const v of values) {
      const concept = await client.query(
        'INSERT INTO concepts (owner_id, kind) VALUES ($1, $2) RETURNING id',
        [ownerId, v[0]]);
      const inserted = await client.query(
        `INSERT INTO entries (owner_id, kind, label, sounds_like, said_on, category,
                              mastered, mastery, mastery_history, concept_id)
         VALUES ($1, $2, $3, $4, $5, $6, false, 'practicing', $7::jsonb, $8)
         RETURNING id`,
        [ownerId, v[0], v[1], v[2], saidOn, v[3],
         JSON.stringify([{ level: 'practicing', on: saidOn }]), concept.rows[0].id]);
      // Same client as the INSERT: the rows are not committed yet, so a
      // pool query would not see them.
      const row = await client.query(ENTRY_SELECT, [inserted.rows[0].id, ownerId]);
      rows.push(row.rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json({ entries: rows });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

app.patch('/api/entries/:id', wrap(async (req, res) => {
  const ownerId = String(req.user.id);
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'First not found.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const owned = await client.query(
      'SELECT mastery, concept_id, kind FROM entries WHERE id = $1 AND owner_id = $2',
      [id, ownerId]);
    if (!owned.rows.length) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'First not found.' });
    }
    const values = await validateEntry(req, res, ownerId);
    if (!values) {
      await client.query('ROLLBACK');
      client.release();
      return;
    }
    // A change of stage is a step on the word's journey, dated today (the
    // request's own "now", so a staging preview's chosen moment rules it).
    // A first never earlier than the day it was first noticed.
    const changed = owned.rows[0].mastery !== values.mastery;
    const today = serverToday(req.now);
    const step = JSON.stringify([{
      level: values.mastery, on: today < values.said_on ? values.said_on : today,
    }]);

    // Which concept this entry belongs to after the edit. Absent keeps it;
    // a number moves it (same kind only); null puts it on a card of its
    // own, unless it is already alone there.
    const current = owned.rows[0].concept_id;
    let conceptId = current;
    let keepKind = owned.rows[0].kind;
    if (values.concept === null && current !== null) {
      const siblings = await client.query(
        'SELECT count(*)::int AS n FROM entries WHERE concept_id = $1 AND owner_id = $2',
        [current, ownerId]);
      // Alone on the card it keeps it; with siblings it gets a card of its own.
      if (siblings.rows.length && siblings.rows[0].n > 1) {
        conceptId = (await client.query(
          'INSERT INTO concepts (owner_id, kind) VALUES ($1, $2) RETURNING id',
          [ownerId, owned.rows[0].kind])).rows[0].id;
      }
    } else if (values.concept && values.concept.id !== current) {
      if (values.concept.kind !== values.kind) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ error: 'Link it to an entry of the same type.' });
      }
      conceptId = values.concept.id;
    }
    // A type change on a shared card moves the entry to a card of its own;
    // alone, the card simply takes the new type.
    if (conceptId !== null && values.kind !== keepKind) {
      const siblings = (await client.query(
        'SELECT count(*)::int AS n FROM entries WHERE concept_id = $1 AND owner_id = $2',
        [conceptId, ownerId])).rows;
      if (siblings.length && siblings[0].n > 1) {
        conceptId = (await client.query(
          'INSERT INTO concepts (owner_id, kind) VALUES ($1, $2) RETURNING id',
          [ownerId, values.kind])).rows[0].id;
      } else {
        await client.query('UPDATE concepts SET kind = $1 WHERE id = $2 AND owner_id = $3',
          [values.kind, conceptId, ownerId]);
      }
    }
    // Leaving a card behind: it goes away when no entry is on it any more.
    const oldConcept = current;
    await client.query(
      `UPDATE entries
       SET kind = $1, label = $2, sounds_like = $3, language_id = $4,
           said_on = $5, note = $6, category = $7, mastered = $8, mastery = $9,
           mastery_history = CASE WHEN $10::boolean
             THEN mastery_history || $11::jsonb ELSE mastery_history END,
           concept_id = $12, updated_at = NOW()
       WHERE id = $13 AND owner_id = $14`,
      [values.kind, values.label, values.sounds_like, values.language_id,
       values.said_on, values.note, values.category, values.mastery === 'mastered',
       values.mastery, changed, step, conceptId, id, ownerId]);
    if (oldConcept != null && oldConcept !== conceptId) {
      await client.query(
        `DELETE FROM concepts c WHERE c.id = $1 AND c.owner_id = $2
         AND NOT EXISTS (SELECT 1 FROM entries WHERE concept_id = c.id)`,
        [oldConcept, ownerId]);
    }
    const row = await client.query(ENTRY_SELECT, [id, ownerId]);
    await client.query('COMMIT');
    res.json(row.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

app.delete('/api/entries/:id', wrap(async (req, res) => {
  const ownerId = String(req.user.id);
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'First not found.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT concept_id FROM entries WHERE id = $1 AND owner_id = $2', [id, ownerId]);
    if (!existing.rows.length) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'First not found.' });
    }
    await client.query('DELETE FROM entries WHERE id = $1 AND owner_id = $2', [id, ownerId]);
    // The card itself goes away once its last language is gone.
    await client.query(
      `DELETE FROM concepts c WHERE c.id = $1 AND c.owner_id = $2
       AND NOT EXISTS (SELECT 1 FROM entries WHERE concept_id = c.id)`,
      [existing.rows[0].concept_id, ownerId]);
    await client.query('COMMIT');
    res.status(204).end();
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
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
  // Added after the first version shipped (the creator's follow-up): every
  // first belongs to a category, whose illustration shows on the block, and
  // carries a mastery toggle for words said only partially so far. Both are
  // idempotent so a database from the first version gains them on boot.
  await pool.query(`
    ALTER TABLE entries ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'words';
    ALTER TABLE entries ADD COLUMN IF NOT EXISTS mastered boolean NOT NULL DEFAULT false;
  `);
  // The three-stage mastery and its journey (the creator's redesign). Rows
  // from before it map their boolean: mastered stays mastered, "still
  // learning" becomes practicing, and the journey starts as that one stage on
  // the day the first was noticed. Both statements are idempotent.
  await pool.query(`
    ALTER TABLE entries ADD COLUMN IF NOT EXISTS mastery text;
    ALTER TABLE entries ADD COLUMN IF NOT EXISTS mastery_history jsonb NOT NULL DEFAULT '[]'::jsonb;
    UPDATE entries SET mastery = CASE WHEN mastered THEN 'mastered' ELSE 'practicing' END
      WHERE mastery IS NULL;
    UPDATE entries
      SET mastery_history = jsonb_build_array(
        jsonb_build_object('level', mastery, 'on', said_on::text))
      WHERE mastery_history = '[]'::jsonb;
  `);
  // One card per word: a concept groups the entries that carry the same
  // word (or sound or sign) in different languages. Mastery stays on each
  // entry, which is already per language; the concept is only the grouping.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS concepts (
      id serial PRIMARY KEY,
      owner_id text NOT NULL,
      kind text NOT NULL CHECK (kind IN ('word','sound','sign')),
      created_at timestamptz NOT NULL DEFAULT NOW()
    );
    ALTER TABLE entries ADD COLUMN IF NOT EXISTS concept_id int
      REFERENCES concepts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS entries_owner_concept
      ON entries (owner_id, concept_id);
  `);
  // Firsts logged separately under exactly the same word and type (say
  // "banana" in English and "banana" in Spanish) are put on one card once,
  // automatically. Runs on every boot and only touches rows still without
  // a concept, so it is idempotent: a parent later unlinks and relinks
  // freely without it ever running again.
  const orphaned = await pool.query(`
    SELECT owner_id, kind, lower(label) AS key, array_agg(id) AS ids
    FROM entries WHERE concept_id IS NULL
    GROUP BY owner_id, kind, lower(label)`);
  for (const group of orphaned.rows) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const created = await client.query(
        'INSERT INTO concepts (owner_id, kind) VALUES ($1, $2) RETURNING id',
        [group.owner_id, group.kind]);
      await client.query(
        'UPDATE entries SET concept_id = $1 WHERE id = ANY($2) AND owner_id = $3',
        [created.rows[0].id, group.ids, group.owner_id]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }
  // All five tables hold personal family data: private, and staged without
  // their rows (see "Public vs private tables" in the platform conventions).
  await pool.query(`COMMENT ON TABLE children IS 'staging:private'`);
  await pool.query(`COMMENT ON TABLE languages IS 'staging:private'`);
  await pool.query(`COMMENT ON TABLE entries IS 'staging:private'`);
  await pool.query(`COMMENT ON TABLE concepts IS 'staging:private'`);
  await pool.query(`COMMENT ON TABLE demo_seeds IS 'staging:private'`);
}

// The 24 demo firsts: kind, label, how it sounds or is signed, language,
// category (which illustration the block shows), whether it is mastered
// already, the age in months it happened at, and the day within that month.
// A row with `link` joins the card of the row whose label it names, so
// "agua" and "water" show as one word in two languages. The date is the
// seeded child's birthday plus the months plus the day,
// capped at today. Older firsts are mastered, the last few months' are
// practicing and the newest are emerging, so all three stages are visible.
const DEMO_ROWS = [
  { kind: 'word',  label: 'agua',     sounds_like: 'awa',     language: 'Spanish', category: 'food',     months: 19, day: 4 },
  { kind: 'word',  label: 'water',    sounds_like: 'wawa',    language: 'English', category: 'food',     months: 14, day: 2, mastered: true, link: 'agua' },
  { kind: 'sound', label: 'duck',     sounds_like: 'kak kak', language: 'English', category: 'animals',  months: 19, day: 2 },
  { kind: 'sign',  label: 'more',     sounds_like: 'Taps fingertips together', language: 'ASL', category: 'actions', months: 19, day: 0 },
  { kind: 'word',  label: 'shoes',    sounds_like: 'choo',    language: 'English', category: 'body',     months: 18, day: 27 },
  { kind: 'sound', label: 'cow',      sounds_like: 'mmmoo',   language: 'English', category: 'animals',  months: 18, day: 21 },
  { kind: 'word',  label: 'gato',     sounds_like: 'tato',    language: 'Spanish', category: 'animals',  months: 18, day: 14 },
  { kind: 'sign',  label: 'milk',     sounds_like: 'Squeezes a fist', language: 'ASL', category: 'food',  months: 18, day: 7 },
  { kind: 'word',  label: 'banana',   sounds_like: 'nana',    language: 'English', category: 'food',     months: 17, day: 29 },
  { kind: 'sign',  label: 'all done', sounds_like: 'Twists both hands', language: 'ASL', category: 'actions', months: 17, day: 20 },
  { kind: 'sound', label: 'dog',      sounds_like: 'wuh wuh', language: 'English', category: 'animals',  months: 17, day: 13 },
  { kind: 'word',  label: 'pelota',   sounds_like: 'lota',    language: 'Spanish', category: 'play',     months: 17, day: 5,
    note: 'Staging demo: rolled the ball to Abuela' },
  { kind: 'sound', label: 'car',      sounds_like: 'vroom',   language: 'English', category: 'transport', months: 16, day: 26 },
  { kind: 'word',  label: 'up',       sounds_like: 'ap',      language: 'English', category: 'actions',  months: 16, day: 24 },
  { kind: 'sound', label: 'sheep',    sounds_like: 'beee',    language: 'Spanish', category: 'animals',  months: 16, day: 15 },
  { kind: 'word',  label: 'abuela',   sounds_like: 'bela',    language: 'Spanish', category: 'people',   months: 16, day: 8 },
  { kind: 'sign',  label: 'eat',      sounds_like: 'Taps fingers to mouth', language: 'ASL', category: 'food', months: 15, day: 22, mastered: true },
  { kind: 'word',  label: 'hola',     sounds_like: 'ola',     language: 'Spanish', category: 'actions',  months: 15, day: 19, mastered: true },
  { kind: 'sound', label: 'cat',      sounds_like: 'ow ow',   language: 'English', category: 'animals',  months: 15, day: 10, mastered: true },
  { kind: 'word',  label: 'ball',     sounds_like: 'ba',      language: 'English', category: 'play',     months: 14, day: 23, mastered: true },
  { kind: 'sound', label: 'owl',      sounds_like: 'hoo hoo', language: 'English', category: 'animals',  months: 14, day: 16, mastered: true },
  { kind: 'word',  label: 'dada',     sounds_like: 'dada',    language: 'English', category: 'people',   months: 13, day: 17, mastered: true },
  { kind: 'sign',  label: 'bye',      sounds_like: 'Opens and closes a hand', language: 'ASL', category: 'actions', months: 12, day: 21, mastered: true },
  { kind: 'word',  label: 'mamá',     sounds_like: 'mama',    language: 'Spanish', category: 'people',   months: 12, day: 9, mastered: true },
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
    const keys = new Map();
    for (const row of DEMO_ROWS) {
      n += 1;
      row.demo_key = 'demo-' + String(n).padStart(2, '0');
      if (!row.link) keys.set(row.label, row);
    }
    // Rows without a link go first, each on a card of its own; a row with
    // `link` joins the card of the row whose label it names.
    for (const row of DEMO_ROWS) {
      const [by, bm, bd] = birthday.split('-').map(Number);
      const at = new Date(Date.UTC(by, bm - 1 + row.months, bd + row.day));
      const saidOn = at.toISOString().slice(0, 10) > todayIso
        ? todayIso : at.toISOString().slice(0, 10);
      // All three stages show: the newest firsts are emerging, the last few
      // months' are practicing, and the oldest are mastered. Each journey
      // starts emerging on the day it was noticed and steps up later.
      const mastery = row.mastered === true ? 'mastered'
        : row.months >= 19 ? 'emerging' : 'practicing';
      const later = (days) => {
        const d = addDays(saidOn, days);
        return d > todayIso ? todayIso : d;
      };
      const journey = [{ level: 'emerging', on: saidOn }];
      if (mastery !== 'emerging') journey.push({ level: 'practicing', on: later(9) });
      if (mastery === 'mastered') journey.push({ level: 'mastered', on: later(30) });
      let conceptId;
      if (row.link) {
        const source = keys.get(row.link);
        if (source && source.concept_id) conceptId = source.concept_id;
      }
      if (!conceptId) {
        conceptId = (await client.query(
          'INSERT INTO concepts (owner_id, kind) VALUES ($1, $2) RETURNING id',
          [ownerId, row.kind])).rows[0].id;
        keys.set(row.label, { ...row, concept_id: conceptId });
      }
      await client.query(
        `INSERT INTO entries
           (owner_id, kind, label, sounds_like, language_id, said_on, note,
            category, mastered, mastery, mastery_history, is_demo, demo_key, concept_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, true, $12, $13)
         ON CONFLICT (owner_id, demo_key) DO NOTHING`,
        [ownerId, row.kind, row.label, row.sounds_like,
         langId[row.language.toLowerCase()] || null, saidOn, row.note || null,
         row.category || 'words', mastery === 'mastered', mastery,
         JSON.stringify(journey), row.demo_key, conceptId]);
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
