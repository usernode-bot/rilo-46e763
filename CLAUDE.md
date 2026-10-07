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
animal sounds, and first signs. Each entry keeps the word (or animal, or
sign), how the child says it, an optional language of the parent's own
choosing, and the date — and every entry shows how old the child was,
because the whole point is watching the timeline grow. One screen, one
primary action ("Add a first"); everything browses newest first grouped
by age. Setup asks the child's name and birth month (month and year, not
a full birthday) once, then offers a quick start: tap the common words,
sounds and signs the child already does, and they are saved dated the day
the family started using Rilo. More than one child, audio recordings of
pronunciation, and renaming languages are later scope, not current.

## Design

This app's look, set by the creator to follow the brand feel of
[gaiababy.app](https://gaiababy.app/) (warm green-tinted paper, olive ink,
moss action, a brand yellow accent, soft pill shapes). Every later change
follows it, and updates it when a request changes the look on purpose.

- **Palette** (values live in `styles/tailwind-input.css`): warm green-tinted
  paper (ground `246 247 244` / dark `27 28 24`), white surfaces, raised
  `227 229 216`, ink text `29 29 27`, olive secondary text `90 91 72`. The
  action colour is **moss green** (accent `69 80 43` with `242 242 237` on
  it), and the brand **yellow** (`sun` `254 233 81` with ink text) marks a
  chosen chip — never a primary button. Three block colours, one per kind of
  first: **terracotta** for words (`word`/`word-soft` = `168 68 44` on
  `247 227 219`), **moss green** for animal sounds (`sound`/`sound-soft` =
  `85 98 47` on `228 235 213`), and **slate blue** for signs
  (`sign`/`sign-soft` = `63 94 126` on `222 231 239`). Dark values are in
  the token file, derived from the same hues; every text pair is at 4.5:1 in
  both looks.
- **Signature element:** the **alphabet block** — every first starts with a
  40 px rounded square showing its initial in the rounded face, on its
  kind's soft colour with a thicker bottom edge in the kind's colour, so it
  reads as a wooden toy block. The same three colours appear as small
  squares in the All/Words/Sounds/Signs switch.
- **Type:** Figtree for headings and the blocks (`font-rounded`), Inter for
  body text, both self-hosted variable fonts in `public/fonts`; how a child
  says a word is `.says`, an italic serif inside curly quotes, like a
  handwritten note in a baby book. Scale: `text-title`, `text-heading`,
  `text-body`, `text-small`, nothing in between.
- **Shapes:** pill buttons and chips (`rounded-full`), soft 12–16 px corners
  on fields, lists and blocks.
- Colour comes only from the tokens (`bg-ground`, `bg-surface`,
  `text-fg`, `text-muted`, `border-line`, `bg-accent` with
  `text-on-accent`, `bg-sun` with `text-on-sun`, ...): never a raw hex value
  or a stock palette class.
- Tap targets are at least 44 px; the buttons and fields already are.
- A field's label says what it is; its placeholder, if any, is an example
  that says so ("e.g. 5.0"), never a bare value that could pass for one
  already entered.
- Every screen that loads data has honest loading, empty and error states.
  Never show the empty state while loading or after a failure; an error says
  what failed, what still works, and offers Retry.
- Seed obviously fake staging demo data so the populated screen can be seen
  ("Staging mock data" in the platform conventions).
- No cards in cards, no uppercase eyebrows, no emoji as icons.

The kit is in `styles/tailwind-input.css`: colour tokens with a light and
a dark value (named in `tailwind.config.js`), the two `@font-face` rules,
and components (`btn-primary`, `btn-secondary`, `field`, `list` and
`list-row`, `row-btn`, `seg`, `blk`, `chip`, `says`, `tag`, `bar`, `card`,
`section-label`, `skeleton`, `state-empty`, `state-error`). Re-theme by
changing the token values there, keeping every text pair at 4.5:1 or more in
both looks. The native UI kit's own `--un-*` variables are mapped onto the
tokens (both looks) in the same file.

## App-specific conventions

- All four tables (`children`, `languages`, `entries`, `demo_seeds`) are
  `staging:private` and per owner: every query is scoped to
  `owner_id = String(req.user.id)`; there are no public tables.
- The birthday is asked as **month and year only** (the creator's ask):
  `PUT /api/child` takes `birth_month` (`YYYY-MM`) and stores it as that
  month's first day, so every age counts whole calendar months from the
  month itself. Firsts keep full dates.
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
