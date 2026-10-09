# Rilo — notes for Claude Code

This app runs on **Homeroom**. If you're Claude Code
editing this repo, read the platform conventions before making
changes:

**Platform conventions (authoritative, always current):**
https://app.onhomeroom.com/claude.md

Fetch that URL at the start of each session — it's the single source
of truth for platform-wide behavior (auth model, `USERNODE_ENV`,
public/private tables, "don't `git push`", etc.). The hosted copy is
updated in place when platform rules change, so fetching it gives you
today's rules, not a stale snapshot.

When running inside Homeroom's dev-chat, those same conventions are
already injected into your system prompt, so the fetch is a no-op in
that path — but it's the right reflex when someone runs Claude Code
against this repo locally or from another harness.

## Connector permission prompts

This repo ships `.claude/settings.json`, which allows the **read-only**
Homeroom connector calls (`mcp__homeroom__get_*`,
`…__list_*`, `…__whoami`) so they stop prompting one at a time. Everything
that acts — filing a request, opening or advancing a proposal — still asks.
Claude Code applies those rules only after you accept the
workspace trust dialog, which lists them for review. See `.claude/README.md`
for the whole story, including what to do if you are still being prompted
(usually: your connector is registered under a different name than the rules
assume).

## Check that this checkout is current

You may be working in a fork of this app whose `main` is behind the app's
canonical repository, and nothing in the checkout says so: `git fetch origin`
compares the fork with itself. This matters before you **read** code to answer
a question about how the app behaves now, not only before you edit it.

The canonical repository is named in `.claude/homeroom-canonical-repo`. Check against
it, not against `origin`:

```sh
git fetch "$(cat .claude/homeroom-canonical-repo)" main
git merge-base --is-ancestor FETCH_HEAD HEAD && echo current || echo behind
```

`behind` means this checkout does not contain the canonical `main`. To answer
a question, read the canonical code instead (`git show FETCH_HEAD:<path>`,
`git grep <pattern> FETCH_HEAD`). To change code, start from the exact base
commit your Homeroom work order gives, and never merge or rebase onto the
canonical `main` yourself: which commit a change is diffed against decides
what the group votes on. With the Homeroom connector, `get_checkout_status`
answers the same question.

A session-start hook (`.claude/hooks/homeroom-freshness.sh`, see `.claude/README.md`) runs
this check for you and tells you when you are behind. It is silent offline, so
its silence is not proof the checkout is current. Inside Homeroom's dev-chat
the platform fixes the base commit, and none of this applies.

## Starter template

The screen this app currently ships — the "Starter template" hero with
the app's thumbnail tile and the plain-English note on how the app gets
built (by asking Homeroom bot) — is placeholder content from the
Homeroom starter template, not product intent.

When the user asks for their first real feature, REPLACE the template
screen rather than building alongside it:

- remove the `usernode-starter-notice@1` block in `public/index.html`
  (both sentinel comments and everything between them),
- rewrite `README.md` to describe the actual app.

Keep the `usernode-dev-console@1` forwarder `<script>` when rewriting the
HTML — that block is platform infrastructure, not template content. So is
the bridge `<script>`. The design kit is not placeholder either: build the
real app with it, and fill in "## Design" below.

The screen has a light and a dark look and follows the viewer's Homeroom
theme, switching live when they change it: the theme `<script>` right after
the bridge tag sets a `dark` class on `<html>`. Keep that script, and give
everything you build both looks (the design kit's colour tokens carry both), unless one
fixed look is the point of this app, like a game's own scene; then say so
under "## Design" below. Unless a request asks for one, add
no theme picker: the viewer's Homeroom setting is the control. "The
platform's light/dark theme inside the app frame" in the platform
conventions has the details.

If a rule below this line conflicts with the hosted conventions, the
hosted conventions win. This file is **app-specific** — write down
things about *this* app that belong in the repo: product intent,
data-model quirks, style preferences, opt-in policies (e.g. which
tables you've marked private), etc.

---

## About Rilo

A baby book for one child's firsts: first words in any language, first
sounds (animals and things: cow, car, ambulance, horn), and first signs.
Each entry keeps the word (or animal/thing, or sign), how the child says
it, an optional language of the parent's own choosing, and the date — and
every entry shows how old the child was, because the whole point is
watching the timeline grow. Each entry also carries a **category**
(people, animals, food, transport, play, body, home, outside, actions,
words — inferred from the label, not asked) and a **mastery** stage
(emerging by default, because a first word is usually partial: "wa" for
water; then practicing, then mastered) with the journey between them. One screen, one primary action ("Add a first");
the screen opens on Words, Sounds and Signs cards, each opening its own
list, newest first grouped by age, as separate tappable module cards.
Setup asks the child's name and birth month (month and
year, not a full birthday) once, then offers a quick start: tap the
common words, sounds and signs the child already does, and they are
saved dated the day the family started using Rilo. More than one child,
audio recordings of pronunciation, and renaming languages are later
scope, not current.

## Design

The creator's Rilo canvas (Welcome, Home, Log, Add entry, Entry detail, Insights and an icon set) supersedes the previous editorial look.

- Warm off-white ground (#F6F5F1), white cards, ink #1E2620. Four tints carry meaning: English sky, Spanish blush, signed languages butter, everything else sage (`langTone` in `public/app.js`). Tokens live in `styles/tailwind-input.css` with dark values following the Homeroom theme.
- Bricolage Grotesque (headings, numbers) and Figtree (everything else), both self-hosted in `public/fonts`. Figtree is committed; Bricolage is copied there from its npm package (`@fontsource-variable/bricolage-grotesque`, a devDependency) by `npm run build`, and the Dockerfile copies it into the runtime image. `public/fonts/inter-var-latin.woff2` is no longer used.
- **Offset iconography:** every icon is drawn by `icon()` from `ICONS` in `public/app.js` on a 48-unit grid: a fine ink line (`.oi`, currentColor, about 1.6px on screen at any size) over a pastel shape (`.of-*`) printed 2 units down-right, with solid ink dots (`.od`) only for eyes and tiny details. Idle nav tabs are ink only; the active tab gains its sage shape. Primary buttons carry a 3px sage offset shadow. New icons must follow the same rules.
- The mascot is a cow (`cowShapes`): butter body, tan patches, blush snout. It appears on Welcome and Home and is the logo mark and favicon.
- Mastery is three stages drawn as seed / sprout / flower. Insights shows a running total of all entries by month or by week (last 8 Monday weeks, a Week/Month toggle on the growth card, Month by default; the creator's design), languages across all entries, and mastery counts.
- Custom classes are written outside Tailwind's layers so classes picked from lookups are never tree-shaken. Write class names as whole literals anyway.
- All tap targets are at least 44px; the growth chart has a text label and a full-history table. Navigation respects `--un-safe-inset-bottom`. User-facing copy avoids em dashes.
- Every loaded screen has honest loading/error/empty handling; never show empty data while a load failed. Screens: Home (no hash), `#log`, `#entry-<id>`, `#insights`, `#profile`.

## App-specific conventions

- All four tables (`children`, `languages`, `entries`, `demo_seeds`) are
  `staging:private` and per owner: every query is scoped to
  `owner_id = String(req.user.id)`; there are no public tables.
- The birthday is asked as **month and year only** (the creator's ask):
  `PUT /api/child` takes `birth_month` (`YYYY-MM`) and stores it as that
  month's first day, so every age counts whole calendar months from the
  month itself. Firsts keep full dates.
- Every entry has a **category** and a **mastery** flag (added after v1
  per the creator's follow-up; `ensureSchema()` adds both columns with
  `ADD COLUMN IF NOT EXISTS`). `category` is one of a whitelist in
  `server.js` (`CATEGORIES`: people, animals, food, transport, play,
  body, home, outside, actions, words — anything else falls back to
  `words`); the client infers it from the label (`inferCategory` in
  `public/app.js`: phrase map first, then per-token keyword match,
  Spanish words included) and it is never a field the parent fills in.
- **Mastery has three stages** (the creator's redesign): `mastery` is
  `emerging` (tried it once or twice), `practicing` (uses it with a nudge)
  or `mastered` (says it on their own); new entries start emerging, quick
  starts carry the stage the parent chose per pick (default emerging).
  `mastery_history` (jsonb) lists each stage and the day
  it was reached: a PATCH that changes the stage appends one step dated the
  request's today. The old `mastered` boolean is kept in step and still
  accepted from a request that sends only it. Rows from before the stages
  were migrated in `ensureSchema()` (mastered stays mastered, "still
  learning" became practicing, journey = one step on `said_on`).
- **Quick-start picks are `already_learned`** (the creator's follow-up):
  `entries.already_learned` (boolean, default false) marks rows saved by
  `POST /api/quick-start`. They keep the onboarding day in `said_on` for
  sorting and as the insights baseline month, but screens show "Already
  learned" instead of a date or age (the Log gathers them in a last group),
  and growth counts them only as that first month's baseline, never as new.
  A PATCH that changes `said_on` clears the flag (the entry becomes an
  ordinary dated first). The one-time backfill in `ensureSchema()` flags
  pre-change batches, told apart by their shared `created_at` (quick-start
  inserts run in one transaction); a single-pick batch stays dated. Demo
  rows are never flagged.
- The welcome asks for the **languages at home**; each one picked is
  created with `POST /api/languages` right after the child is saved.
- **Sounds are animals AND things** (the creator's ask: car vroom,
  ambulance wee-o, horn beep beep) — the kind is labelled "Sound", the
  quick-start group is "Sounds", and its prompt asks for "the animal or
  thing". Quick starts are saved as ordinary firsts dated the day the
  family started using Rilo, with the category inferred.
- Dates are Postgres `date` columns and travel as `YYYY-MM-DD` strings
  everywhere (cast to text in SELECTs so node-pg never shifts the day); a
  date is what the parent entered in their own calendar, and the server
  allows up to one day past its UTC "today" as slack (one month of slack
  for a birth month).
- Ages count **whole months** between the birthday and a date
  (`(y2−y1)*12 + (m2−m1) − (d2<d1 ? 1 : 0)`), formatted "Under 1 month",
  "N months", "1 year", "1 year 3 months"…
- `is_demo` (and the `demo_seeds` marker) is display-only: no logic reads
  it. The populated demo exists only on staging with `?demo=1`, written
  once per viewing account by `seedDemoFor()`; a viewer's own child is
  kept, a real save of name/birthday clears `is_demo`, and an account
  that already has entries of its own is never seeded at all.
- One capture identity runs all of dapp.json's checks, so never declare a
  check whose expectation depends on the account being empty — route the
  assertion through `?demo=1` or accept both final screens (see the `/`
  check's selector).
- Avoid adding new dependencies; the app is Express + pg + precompiled
  Tailwind.
