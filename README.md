# Rilo

A baby book for a child's firsts: first words in any language, first
sounds (animals and things — cow, car, ambulance, horn), and first
signs. Every entry keeps what the child said, how they said it, which
language it was in, and shows how old the child was when it happened.
Everything is grouped by age, newest first, as separate tappable module
cards, so the list reads as a growing timeline.

## How it works

- **One screen.** Rilo opens on three cards — Words, Sounds and Signs —
  each showing its count and the latest first; tapping a card opens that
  kind's list, grouped by age newest first, with an **All firsts** button
  back to the cards. **Add a first** (pinned to the bottom) opens a small
  form: kind, the word/animal/sign, how the child says or signs it, a
  language, a date, an optional note, and a mastery toggle (Still learning
  by default — a first word is usually partial, like "wa" for water;
  mastered firsts wear a small yellow badge).
- **Categories and illustrations.** Each first also gets a category —
  people, animals, food, transport, play, body, home, outside, actions
  or words — inferred from the word itself, never asked. Every row's
  block carries a small hand-drawn line illustration of the category
  with a yellow accent, so the timeline reads at a glance.
- **Setup once, then a quick start.** On first use Rilo asks for the
  child's name and birth month (month and year — no full birthday); ages
  are whole months counted from it. Then a quick-start screen offers
  common words, sounds and signs to tap (sounds include car, ambulance
  and horn, not just animals), saving everything the child already does
  dated that day, so nothing has to be typed in one by one. The pencil
  button next to the title edits the name and birth month.
- **Languages are your own.** There is no preset list — add each one you
  use ("New language" in the form) and it stays a choice. A language can
  be attached to any kind of first.
- **Light and dark** looks follow the viewer's Homeroom theme. The brand
  look follows gaiababy.app: warm beige paper, olive ink, a moss green
  action colour, a brand yellow for chosen chips and mastered badges,
  pill buttons, layered tactile cards, and Figtree/Inter type
  (self-hosted in `public/fonts`).

## Data model

All four tables are `staging:private` (personal family data) and scoped
per owner (`owner_id = String(req.user.id)` on every query):

- `children` — one child per person: name, birthday (stored as the birth
  month's first day; the parent picks month and year).
- `languages` — the owner's own language list, unique case-insensitively.
- `entries` — one first: `kind` (`word` | `sound` | `sign`), `label`,
  `sounds_like` (how it sounds or is signed), optional `language_id`,
  `said_on` (a `date`), optional `note`, `category` (inferred on the
  client, validated against a whitelist on the server, default `words`)
  and `mastered` (boolean, default false).
- `demo_seeds` — marks that a viewer's `?demo=1` demo was written, so
  deleted demo rows do not come back.

Schema is created idempotently on boot (`ensureSchema()` before
`app.listen`); the `category` and `mastered` columns are added to
existing databases with `ADD COLUMN IF NOT EXISTS`. `is_demo` is
display-only.

## Demo

On a staging preview, open the app with `?demo=1` to see it populated
with a demo child ("Leo") and 23 firsts in English, Spanish and ASL,
including mastered ones (with the yellow badge) and a car that goes
vroom. It is the real screen: you can add, edit and delete, and those
changes stay. Without `?demo=1` the plain setup screen shows.

## Development

- `npm run build` compiles `styles/tailwind-input.css` to
  `public/tailwind.css` (the Docker/Paketo image build does this too).
- `node server.js` serves the app; `GET /health` reports readiness.
- The design kit and its tokens live in `styles/tailwind-input.css`;
  `CLAUDE.md`'s "## Design" records the look.
