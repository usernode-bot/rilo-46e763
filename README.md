# Rilo

A calm, airy first-words tracker for parents: every word, sound and sign a child picks up, in every language spoken at home.

- **Welcome:** the child's name, birth month and year, and the languages at home (English, Spanish, ASL, French or any other), then an optional quick start of common words, sounds and signs.
- **Home:** a large total of everything the child has (words, sounds and signs together), a "+N this week" pill, the cow mascot, Words / Sounds / Signs tiles and the four most recent entries.
- **Log:** live search across words, how the child says or signs them, notes and languages; filter chips for kind, each language in use and Mastered; entries grouped by the child's age in months, each with its mastery glyph.
- **Entry detail:** the word on its language's tint, when it was first noticed and how old the child was, its mastery stage, notes and its journey from stage to stage. Edit opens the add/edit sheet; Delete asks first.
- **Add / edit:** Word, Sound or Sign (the "how" field becomes a gesture description for signs), language, date first noticed, pronunciation, notes and a three-stage mastery picker: Emerging, Practicing, Mastered.
- **Insights:** a running total by month (the current month highlighted, with how many are new), a breakdown by language, mastery counts and three gentle play ideas. Tapping a language or a stage opens the log filtered to it.
- **Profile:** edit the child's name and birth month and year.

## Design

The creator's Rilo canvas: a warm off-white ground, white cards, deep green-black ink, and four soft tints that carry meaning (English sky, Spanish blush, signed languages butter, everything else sage). Bricolage Grotesque for headings and numbers, Figtree for everything else, both self-hosted (Bricolage is copied from its npm package by `npm run build`).

Every icon and illustration is drawn in the **Offset** style: a fine ink line over a pastel shape printed 2px down and to the right, with solid ink dots only for eyes and tiny details. Idle tabs are ink only; the active tab gains its sage shape. Primary buttons carry the same offset as a sage shadow. Mastery is drawn as a seed (emerging), a sprout (practicing) and a flower (mastered). The mascot is a cow with a butter body, soft tan patches and a blush snout. Dark mode follows the Homeroom theme with the same layout and adapted tokens.

## Data

`children`, `languages`, `entries` and `demo_seeds` are private staging tables, every query scoped to the owner. Entries carry `mastery` (`emerging`, `practicing` or `mastered`) and `mastery_history` (each stage and the day it was reached); the older `mastered` boolean is kept in step. Rows from before the three stages were migrated on boot: mastered stays mastered, "still learning" became practicing.

## Preview and development

On staging, `/?demo=1` seeds a demo child with entries at all three stages. `#log`, `#insights`, `#profile` and `#entry-<id>` open screens directly, for example `/?demo=1#insights`.

- `npm ci`
- `npm run build` compiles the app's Tailwind CSS.
- `npm test` checks the record calculations (monthly totals, languages and mastery stages).
- `npm start` runs the authenticated app with the platform database/configuration.

The bridge and native UI kit remain centrally hosted. Homeroom's staging preview is authoritative for the hosted kit and automated UI checks.
