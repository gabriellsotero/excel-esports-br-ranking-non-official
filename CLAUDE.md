# CLAUDE.md — Project Briefing

## What this project is

An **unofficial ranking site** for the Excel eSports Brasil 2026 championship (Excel eSports Brasil by BTG Pactual). Built as a personal project by Gabe Sotero, inspired by the scoring methodology of the Microsoft Excel World Championship (MEWC).

The site is **not affiliated** with the official championship, FMWC, or any of its local chapters.

---

## Current architecture

**Static site, no framework, no build step, no external dependencies.** Split into separate files:

- `index.html` — markup only (links `styles.css` and `app.js`)
- `styles.css` — all styles
- `app.js` — all logic; fetches participant data from `data.json` at runtime
- `data.json` — participant data (produced by the processing script)

- Hosted on **GitHub Pages** (static). Because `app.js` uses `fetch('data.json')`, the site must be served over HTTP (it won't work opened directly via `file://`).
- Planned migration to **Vercel** when dynamic features are introduced

---

## Scoring methodology

- Participants are ranked by total points accumulated across rounds, with **1 discard** (the lowest score is dropped). This will become **2 discards** after round 7.
- Points per round: 1st place = 1,000 pts, 2nd = 999 pts, 3rd = 998 pts, and so on.
- A blank round counts as 0 and **can be the discarded score**.
- Participants with 0 points still receive ranking points (unlike the global MEWC ranking).
- Disqualified participants receive no points.

### Calculated fields per participant

| Field | Description |
|---|---|
| `part` | Number of rounds with any score (non-blank) |
| `descarte` | Sum of the 4 best round scores (1 discard; blanks = 0) |
| `total` | Sum of all round scores (no discard) |
| `media` | Average of non-blank rounds only |

The primary sort column is `descarte` (descending).

---

## Data pipeline (current — manual)

1. Export results to `results.csv` (encoding: ISO-8859-1 / Windows-1252)
2. Run Python processing script to compute metrics and produce UTF-8 JSON
3. Write the JSON to `data.json` (loaded by `app.js` via `fetch`)
4. Commit and push → auto-deploy

### CSV structure

```
#, Class?, Nome, Estado, Rodada 1, Rodada 2, Rodada 3, Rodada 4, Rodada 5
```

- `Class?` column: `?` means the participant is already qualified (★); blank means not qualified
- `Estado`: Brazilian state abbreviation (UF)
- Round columns: integer scores or blank (absent)

---

## Planned evolution

- **Short term:** automate the CSV → JSON pipeline via a GitHub Action — on every push of a new `results.csv`, the action runs the Python processing script and updates `index.html` automatically
- **Medium term:** new features on the site itself, including but not limited to:
  - Ranking by state (UF)
  - Round history with filters and parameters
  - Other views and visualizations to be defined
- **Long term:** the site may evolve into a more complete app depending on how features grow; no decisions made yet

---

## Site features

- Sortable columns (click header to sort, click again to reverse)
- Filters: search by name, state (UF dropdown), classification status (all / qualified ★ / not qualified)
- Optional columns toggled by checkboxes just above the table: "Total sem descarte" and "Média"
- Responsive: on small screens (≤640px), only #, ★, Nome, and Total columns are shown; tapping the Total value expands a detail panel with round-by-round scores and other hidden fields

---

## Conventions and preferences

- **Language:** user (Gabe) communicates in Brazilian Portuguese or English; always respond in whichever language was used in the message
- **Code style:** keep it simple and readable; avoid over-abstraction
- **Commits:** write commit messages in English, concise and descriptive
- **Deployment:** always test locally before pushing; a single `git push` to `main` triggers deploy (GitHub Pages now, Vercel later)
- **Data privacy:** never log or expose participant data beyond what is already public
- **No secrets in code:** API keys, tokens, or credentials must never be hardcoded — use environment variables

---

## Key files

| File | Purpose |
|---|---|
| `index.html` | Page markup; links `styles.css` and `app.js` |
| `styles.css` | All styles |
| `app.js` | All logic; fetches data from `data.json` |
| `data.json` | Participant data consumed by `app.js` |
| `README.md` | Project overview and documentation |
| `CLAUDE.md` | This file — Claude Code session briefing |
| `results.csv` | Raw input data — **local only for now**, not committed to the repo. Will be part of the GitHub Action workflow once the short-term automation is implemented |
