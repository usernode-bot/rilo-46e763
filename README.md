# Rilo

A child's word journal for spoken words, sounds and signs, with a calm editorial interface inspired by the creator's final Home and Insights mockups.

- **Words:** a prominent spoken-word total, Words/Sounds/Signs cards, and recent entries. Each category and See all opens the searchable collection grouped by the child's age.
- **Insights:** new spoken words learned per calendar month, language counts, sounds, signs and explicitly mastered spoken words. Tap a count to view its records. Other languages and unassigned words remain visible. The chart shows the latest 12 months and an accessible table contains the full history, including zero months.
- **Play ideas:** everyday words, sound imitation and simple gestures open optional suggestions and an entry action. This month reports recorded counts, without developmental comparisons or diagnostic claims.
- **Profile:** edit the child's name and birth month/year. The floating bottom navigation gives access to Words, Insights, Add and Profile.
- **Entry forms:** existing add/edit/delete flows retain pronunciation or sign description, language, learned date, note, category inference and the Still learning / Mastered toggle. Existing records are preserved.
- **Setup:** enter name and birth month/year, then optionally select common words, sounds and signs in a quick start.

## Design

White ground, Georgia editorial headings, self-hosted Inter supporting text, navy actions, buttery yellow accents, faint blush/sage/blue cards and black organic line illustrations. Dark mode follows the Homeroom theme using the same layout and adapted tokens. No simulated phone status bar. Forwarded safe-area insets keep the floating navigation above the home indicator.

## Data

The existing Express/pg schema and per-owner authorization are unchanged. `children`, `languages`, `entries` and `demo_seeds` are private staging tables. Languages and mastery already persist on entries; unknown language is shown as Not assigned, and mastery is counted only when explicitly marked. Birth month is stored as its first day; entry dates remain full calendar dates.

## Preview and development

On staging, `/?demo=1` uses the existing demo records. `#insights`, `#profile` and `#log` are real screens that can be opened directly, for example `/?demo=1#insights`.

- `npm ci`
- `npm run build` compiles the app's Tailwind CSS.
- `npm test` checks the record calculations (monthly gaps, language totals and explicit mastery).
- `npm start` runs the authenticated app with the platform database/configuration.

The bridge and native UI kit remain centrally hosted. Homeroom's staging preview is authoritative for the hosted kit and automated UI checks.
