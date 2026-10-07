# Rilo

A baby book for a child's firsts: first words in any language, first
animal sounds, and first signs. Every entry keeps what the child said,
how they said it, which language it was in, and shows how old the child
was when it happened. Everything is grouped by age, newest first, so the
list reads as a growing timeline.

## How it works

- **One screen.** Rilo opens on the child's firsts. A switch at the top
  filters All, Words, Sounds or Signs; **Add a first** (pinned to the
  bottom) opens a small form: kind, the word/animal/sign, how the child
  says or signs it, a language, a date and an optional note.
- **Setup once.** On first use Rilo asks for the child's name and
  birthday; ages are whole months counted from it. The pencil button next
  to the title edits both.
- **Languages are your own.** There is no preset list — add each one you
  use ("New language" in the form) and it stays a choice. A language can
  be attached to any kind of first.
- **Light and dark** looks follow the viewer's Homeroom theme.

## Data model

All four tables are `staging:private` (personal family data) and scoped
per owner (`owner_id = String(req.user.id)` on every query):

- `children` — one child per person: name, birthday.
- `languages` — the owner's own language list, unique case-insensitively.
- `entries` — one first: `kind` (`word` | `sound` | `sign`), `label`,
  `sounds_like` (how it sounds or is signed), optional `language_id`,
  `said_on` (a `date`), optional `note`.
- `demo_seeds` — marks that a viewer's `?demo=1` demo was written, so
  deleted demo rows do not come back.

Schema is created idempotently on boot (`ensureSchema()` before
`app.listen`). `is_demo` is display-only.

## Demo

On a staging preview, open the app with `?demo=1` to see it populated
with a demo child ("Leo") and 22 firsts in English, Spanish and ASL. It
is the real screen: you can add, edit and delete, and those changes
stay. Without `?demo=1` the plain setup screen shows.

## Development

- `npm run build` compiles `styles/tailwind-input.css` to
  `public/tailwind.css` (the Docker/Paketo image build does this too).
- `node server.js` serves the app; `GET /health` reports readiness.
- The design kit and its tokens live in `styles/tailwind-input.css`;
  `CLAUDE.md`'s "## Design" records the look.
