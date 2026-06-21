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

- Participants are ranked by total points accumulated across rounds, with **3 discards** (the lowest scores are dropped). Single source of truth: `NUM_DISCARDS` in `process.py`, emitted into `data.json` as `discards` and read by `app.js`.
- Points per round: 1st place = 1,000 pts, 2nd = 999 pts, 3rd = 998 pts, and so on — derived from placement as `pontos = 1001 - Pos.`.
- A blank round counts as 0 and **can be the discarded score**.
- Participants with 0 points still receive ranking points (unlike the global MEWC ranking).
- Disqualified participants receive no points.

### Calculated fields per participant

| Field | Description |
|---|---|
| `part` | Number of rounds with any score (non-blank) |
| `descarte` | Sum of the best `(rounds − NUM_DISCARDS)` round scores (blanks = 0, dropped first) |
| `total` | Sum of all round scores (no discard) |
| `media` | Average of non-blank rounds only |

The primary sort column is `descarte` (descending).

`data.json` is an object: `{ "discards": N, "rounds": N, "participants": [ … ] }`.
The `participants` array holds the per-participant objects above; `discards` and
`rounds` are scoring config emitted by `process.py` and consumed by `app.js`.

---

## Data pipeline (automated)

1. Update the source CSVs (`rankings.csv`, `class.csv`) and push to `main`
2. The **Build data.json** GitHub Action (`.github/workflows/build-data.yml`) runs `process.py`
3. `process.py` pivots the rankings, computes metrics, and writes UTF-8 `data.json`
4. The action commits `data.json` if it changed → GitHub Pages auto-deploys

`process.py` can also be run locally: `python process.py [rankings.csv] [class.csv] [data.json]`.
Both CSVs are committed to the repo (the action needs them). Encoding is auto-detected
per file (UTF-8 or ISO-8859-1) — the two exports have historically differed.

### CSV structure

**`rankings.csv`** — long format, one row per participant per round:

```
Rodada, Pos., Nome, UF
```

- `Rodada`: round label like `Rodada 1` (round count is detected dynamically)
- `Pos.`: placement in that round; points are derived as `pontos = 1001 - Pos.`
- `Nome`: participant name (the pivot key, also matched against `class.csv`)
- `UF`: Brazilian state abbreviation
- A round a participant didn't play simply has no row (becomes `null` in `r[]`)

**`class.csv`** — qualified participants (★), **one name per line, no header.**
A participant is marked `class: true` when their name appears here.

---

## Planned evolution

- **Done:** the CSV → JSON pipeline is automated via the **Build data.json** GitHub Action (runs `process.py` on push of the source CSVs and commits `data.json`)
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
| `data.json` | Participant data consumed by `app.js` (generated — do not edit by hand) |
| `process.py` | Builds `data.json` from the source CSVs |
| `rankings.csv` | Source data: placements per round (long format), committed |
| `class.csv` | Source data: qualified participants (★), one name per line, committed |
| `.github/workflows/build-data.yml` | GitHub Action that regenerates `data.json` on push |
| `README.md` | Project overview and documentation |
| `CLAUDE.md` | This file — Claude Code session briefing |
