# Netflix Content Trends: TV Shows vs Movies
**By Shawn Mankotia**

A data analysis dashboard that models and visualizes whether Netflix TV Show additions have trended higher than Movie additions over time. Built with vanilla HTML, CSS, and JavaScript — no framework required.

---

## Research Question

> *Will trends in Netflix TV Shows increase more than trends in Netflix Movies?*

**Answer: Yes.** TV Show additions grew at a CAGR of 20.6% vs 5.5% for Movies between 2010–2021 — roughly 4× faster. TV Shows overtook Movies in volume for the first time in 2021.

---

## Project Structure

```
netflix_files/
├── index.html    — Page structure and layout markup
├── styles.css    — All styling, variables, and responsive rules
├── charts.js     — Trend model: data, regression, Chart.js charts
├── compare.js    — Compare box: search, autocomplete, result cards
├── data.js       — Full 8,807-title dataset from netflix_titles.csv
└── README.md     — This file
```

---

## How to Run

No build step or server required. Just open the project folder and launch the page:

```
open index.html
```

Or serve it locally to avoid any browser file-restriction issues:

```bash
# Python 3
python -m http.server 8000
# then visit http://localhost:8000
```

All dependencies (Chart.js, Google Fonts) are loaded from CDN — an internet connection is required.

---

## Dataset

**Source:** `netflix_titles.csv` (publicly available Netflix catalog dataset)
**Size:** 8,807 titles
**Year range:** 2000–2021

### Columns in the original CSV

| Column | Description |
|---|---|
| `show_id` | Unique title identifier |
| `type` | `Movie` or `TV Show` |
| `title` | Title name |
| `director` | Director(s) |
| `cast` | Lead cast members |
| `country` | Country of production |
| `date_added` | Date added to Netflix |
| `release_year` | Original release year |
| `rating` | Content rating (e.g. TV-MA, PG-13) |
| `duration` | Runtime (minutes) or seasons |
| `listed_in` | Genre tags |
| `description` | Short synopsis |

### What the model actually used

The trend analysis only required two fields:

- **`type`** — to classify each title as Movie or TV Show
- **`release_year`** — to count how many of each type were released per year

All other fields (`director`, `cast`, `description`, etc.) are used only in the **Compare Box** feature for display purposes.

---

## Features

### Trend Dashboard
- **KPI strip** — CAGR for TV Shows (20.6%) and Movies (5.5%), ratio shift, and crossover year
- **Interactive chart** with three views:
  - *Volume* — raw title counts per year with linear regression trend lines
  - *Ratio* — TV Shows per Movie over time
  - *Growth %* — year-over-year percentage change for each type
- **Key findings panel** — three annotated insights on growth divergence, the crossover event, and ratio compression
- **Verdict panel** — model conclusion, composition shift bar chart, and methodology caveats

### Compare Box
- Search any TV Show or Movie title from the full 8,807-title dataset
- Fuzzy search with real-time autocomplete and keyboard navigation (↑ ↓ Enter Escape)
- Side-by-side result cards showing director, year, rating, duration, country, genres, and description
- Trend context footer showing how many titles of each type were added in the selected titles' release years, with a note on which type was trending stronger in that period

---

## Methodology

### Data Preparation
Titles were grouped by `release_year` and `type`, then counted per year. Only years 2010–2021 were used for the regression model due to sparse data before 2010.

### CAGR (Compound Annual Growth Rate)
```
CAGR = (end_value / start_value) ^ (1 / n_years) - 1
```
Computed from 2010 to 2021 (11 years) for both Movies and TV Shows.

### Linear Regression
Ordinary least squares regression applied to the annual count series for each type. Used to derive the slope (titles added per year) and visualize the long-run directional trend.

### TV/Movie Ratio
```
ratio = TV_Show_count / Movie_count   (per year)
```
Tracks the relative composition shift over time. A ratio above 1.0 means TV Shows outnumber Movies that year.

---

## Key Findings

| Metric | Movies | TV Shows |
|---|---|---|
| CAGR 2010–2021 | 5.5% | 20.6% |
| Peak volume | 767 (2017) | 436 (2020) |
| TV/Movie ratio 2010 | — | 0.26 |
| TV/Movie ratio 2021 | — | 1.14 |
| Crossover year | — | 2021 |

---

## Caveats

- The dataset ends in 2021 and the 2021 figures appear incomplete (592 titles vs 1,147 in 2020), which may exaggerate the crossover effect.
- `release_year` is not the same as the year a title was *added* to Netflix. The `date_added` column has significant nulls and was not used.
- Both categories declined sharply in 2020–2021, possibly reflecting COVID-19 production slowdowns.
- The model measures **volume of titles**, not viewership, revenue, or audience preference.

---

## Dependencies

| Library | Version | Purpose |
|---|---|---|
| [Chart.js](https://www.chartjs.org/) | 4.4.1 | Interactive line charts |
| [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue) | — | Display font (Google Fonts) |
| [Space Mono](https://fonts.google.com/specimen/Space+Mono) | — | Body/mono font (Google Fonts) |

No npm, no bundler, no framework. Everything runs in the browser.