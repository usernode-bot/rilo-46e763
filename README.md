# Rilo

A calm, airy first-words tracker for parents: every word, sound and sign a child picks up, in every language spoken at home.

- **Welcome:** the app language (English or Español), the child's name, birth month and year, and the languages at home (English, Spanish, ASL, French or any other), then an optional quick start.
- **Quick start:** a dozen ideas matched to the child's age, about 12, 18, 24 months or 3 years and up, and a **More ideas** button that keeps adding a dozen more until the parent taps **Done**. Ideas are shown in the chosen app language and saved as already learned.
- **Home:** a large total of everything the child has (words, sounds and signs together), a "+N this week" pill, the cow mascot, Words / Sounds / Signs tiles and the four most recent entries.
- **Log:** live search across words, how the child says or signs them, notes and languages; filter chips for kind, each language in use and Mastered; entries grouped by the child's age in months, each with its mastery glyph.
- **Entry detail:** the word on its language's tint, when it was first noticed and how old the child was, its mastery stage, notes and its journey from stage to stage. Edit opens the add/edit sheet; Delete asks first.
- **Add / edit:** Word, Sound or Sign (the "how" field becomes a gesture description for signs), language, date first noticed, pronunciation, notes and a three-stage mastery picker: Emerging, Practicing, Mastered.
- **Insights:** a running total by month or by week, a breakdown by language, mastery counts and three gentle play ideas. Tapping a language or a stage opens the log filtered to it.
- **Profile:** edit the child's name, birth month and year, and the app language. The choice is saved with the child, so it follows the family to any device.

## Design

The creator's Rilo canvas: a warm off-white ground, white cards, deep green-black ink, and four soft tints that carry meaning (English sky, Spanish blush, signed languages butter, everything else sage). Bricolage Grotesque for headings and numbers, Figtree for everything else, both self-hosted (Bricolage is copied from its npm package by `npm run build`).

Every icon and illustration is drawn in the **Offset** style: a fine ink line over a pastel shape printed 2px down and to the right, with solid ink dots only for eyes and tiny details. Idle tabs are ink only; the active tab gains its sage shape. Primary buttons carry the same offset as a sage shadow. Mastery is drawn as a seed (emerging), a sprout (practicing) and a flower (mastered). The mascot is a cow with a butter body, soft tan patches and a blush snout. Dark mode follows the Homeroom theme with the same layout and adapted tokens.

## Data

`children`, `languages`, `entries`, `concepts` and `demo_seeds` are private staging tables, every query scoped to the owner. Entries carry `mastery` (`emerging`, `practicing` or `mastered`) and `mastery_history` (each stage and the day it was reached); the older `mastered` boolean is kept in step. Rows from before the three stages were migrated on boot: mastered stays mastered, "still learning" became practicing. `children.ui_language` is `'en'`, `'es'` or null (English), added forward-only on boot.

All interface copy lives in `public/i18n.js` as `STRINGS.en` and `STRINGS.es` with the same keys, read through `t()` in `public/app.js`. New copy goes in both languages. The same file holds the age-banded idea catalogue (about 12, 18, 24 and 36 months, a dozen per batch) and the Spanish wording for server validation messages.

## Preview and development

On staging, `/?demo=1` seeds a demo child with entries at all three stages. `#log`, `#insights`, `#profile` and `#entry-<id>` open screens directly, for example `/?demo=1#insights`.

- `npm ci`
- `npm run build` compiles the app's Tailwind CSS.
- `npm test` checks the record calculations (monthly totals, languages and mastery stages).
- `npm start` runs the authenticated app with the platform database/configuration.

The bridge and native UI kit remain centrally hosted. Homeroom's staging preview is authoritative for the hosted kit and automated UI checks.
