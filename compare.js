/* ============================================================
   compare.js — Title compare box: search, autocomplete,
                result cards, trend context
   Depends on: NETFLIX_DB (loaded from data.js)
   Shawn Mankotia, 2026
   ============================================================ */

// DB field index constants. 
// These make the code more readable and maintainable.
const DB_TYPE  = 0;
const DB_TITLE = 1;
const DB_DIR   = 2;
const DB_YEAR  = 3;
const DB_RATE  = 4;
const DB_DUR   = 5;
const DB_GENRE = 6;
const DB_CO    = 7;
const DB_DESC  = 8;

// Pre-filtered indexes for searching.
const tvIndex  = NETFLIX_DB.filter(r => r[DB_TYPE] === 'TV Show');
const movIndex = NETFLIX_DB.filter(r => r[DB_TYPE] === 'Movie');

// State variables to keep track of user selections and autocomplete state.
let selectedShow  = null;
let selectedMovie = null;
let acActiveIdx   = { show: -1, movie: -1 };

// ── Cohort totals (for trend context footer).
// Source: counts derived from release_year + type in CSV
const cohortMovies = {
  2010: 154, 2011: 145, 2012: 173, 2013: 225,
  2014: 264, 2015: 398, 2016: 658, 2017: 767,
  2018: 767, 2019: 633, 2020: 517, 2021: 277
};
const cohortShows = {
  2010: 40,  2011: 40,  2012: 64,  2013: 63,
  2014: 88,  2015: 162, 2016: 244, 2017: 265,
  2018: 380, 2019: 397, 2020: 436, 2021: 315
};

// Search function.
// This is a simple case-insensitive substring search on the title field, with results sorted by match position and limited to top 8.
function fuzzySearch(arr, query, limit = 8) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return arr
    .filter(r => r[DB_TITLE].toLowerCase().includes(q))
    .sort((a, b) => {
      const ai = a[DB_TITLE].toLowerCase().indexOf(q);
      const bi = b[DB_TITLE].toLowerCase().indexOf(q);
      return ai - bi;
    })
    .slice(0, limit);
}

function highlightMatch(title, query) {
  if (!query) return title;
  const idx = title.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return title;
  return (
    title.slice(0, idx) +
    '<b style="color:var(--text)">' + title.slice(idx, idx + query.length) + '</b>' +
    title.slice(idx + query.length)
  );
}

// Autocomplete rendering. 
// This updates the dropdown list under the input fields based on the search results. It also sets up event handlers for selection and hover.
function renderList(listEl, results, type, inputEl) {
  if (!results.length) { listEl.classList.remove('open'); return; }

  listEl.innerHTML = results.map((r, i) =>
    '<div class="ac-item" data-idx="' + i + '"' +
    ' onmousedown="selectItem(event,\'' + type + '\',' + i + ')"' +
    ' onmouseover="hoverItem(\'' + type + '\',' + i + ')">' +
    '<span>' + highlightMatch(r[DB_TITLE], inputEl.value) + '</span>' +
    '<span class="ac-item-year">' + r[DB_YEAR] + '</span>' +
    '</div>'
  ).join('');

  listEl._results = results;
  listEl.classList.add('open');
  acActiveIdx[type] = -1;
}

// Input handler. 
// This is called on every keystroke in the input fields. It updates the autocomplete list based on the current query.
function handleInput(type) {
  const inputEl = document.getElementById(type === 'show' ? 'showInput'  : 'movieInput');
  const listEl  = document.getElementById(type === 'show' ? 'showList'   : 'movieList');
  const arr     = type === 'show' ? tvIndex : movIndex;

  if (type === 'show') selectedShow = null;
  else                 selectedMovie = null;

  updateCompareBtn();
  renderList(listEl, fuzzySearch(arr, inputEl.value), type, inputEl);
}

// Keyboard navigation handler. 
// This allows users to navigate the autocomplete list using arrow keys, select with Enter, and close with Escape.
function handleKey(e, type) {
  const listEl = document.getElementById(type === 'show' ? 'showList' : 'movieList');
  const items  = listEl.querySelectorAll('.ac-item');
  if (!listEl.classList.contains('open') || !items.length) return;

  let idx = acActiveIdx[type];

  if      (e.key === 'ArrowDown')  { idx = Math.min(idx + 1, items.length - 1); }
  else if (e.key === 'ArrowUp')    { idx = Math.max(idx - 1, 0); }
  else if (e.key === 'Enter')      { if (idx >= 0) { e.preventDefault(); selectItem(null, type, idx); } return; }
  else if (e.key === 'Escape')     { listEl.classList.remove('open'); return; }
  else return;

  items.forEach(el => el.classList.remove('ac-selected'));
  if (items[idx]) items[idx].classList.add('ac-selected');
  acActiveIdx[type] = idx;
  e.preventDefault();
}

function hoverItem(type, idx) {
  acActiveIdx[type] = idx;
  const listEl = document.getElementById(type === 'show' ? 'showList' : 'movieList');
  listEl.querySelectorAll('.ac-item').forEach((el, i) => el.classList.toggle('ac-selected', i === idx));
}

// Selection handler. 
// This is called when a user clicks on an autocomplete item or presses Enter. It updates the input field, stores the selected record, and updates the compare button state.
function selectItem(e, type, idx) {
  if (e) e.preventDefault();
  const listEl  = document.getElementById(type === 'show' ? 'showList'  : 'movieList');
  const inputEl = document.getElementById(type === 'show' ? 'showInput' : 'movieInput');
  const record  = listEl._results[idx];
  if (!record) return;

  inputEl.value = record[DB_TITLE];
  listEl.classList.remove('open');

  if (type === 'show') selectedShow  = record;
  else                 selectedMovie = record;

  updateCompareBtn();
}

function updateCompareBtn() {
  document.getElementById('compareBtn').disabled = !(selectedShow && selectedMovie);
}

// Close dropdowns when clicking outside.
document.addEventListener('click', e => {
  ['showList', 'movieList'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.contains(e.target)) el.classList.remove('open');
  });
});

// Result card renderer. 
// This takes a record and renders the information into the result card format, including badges, metadata, genres, and description.
function renderCard(cardEl, record) {
  const genres   = record[DB_GENRE].split(',').map(g => g.trim()).filter(Boolean);
  const isShow   = record[DB_TYPE] === 'TV Show';
  const badgeCls = isShow ? 'badge-show'  : 'badge-movie';
  const badgeTxt = isShow ? 'TV SHOW'     : 'MOVIE';

  cardEl.innerHTML =
    '<div class="result-type-badge ' + badgeCls + '">' + badgeTxt + '</div>' +
    '<div class="result-title">' + record[DB_TITLE] + '</div>' +
    '<div class="result-meta">' +
      (record[DB_DIR] ? 'DIRECTOR <span>' + record[DB_DIR] + '</span><br>' : '') +
      'YEAR <span>' + (record[DB_YEAR] || '—') + '</span> &nbsp;·&nbsp; ' +
      'RATING <span>' + (record[DB_RATE] || '—') + '</span> &nbsp;·&nbsp; ' +
      'DURATION <span>' + (record[DB_DUR] || '—') + '</span>' +
      (record[DB_CO] ? '<br>COUNTRY <span>' + record[DB_CO].split(',')[0] + '</span>' : '') +
    '</div>' +
    '<div>' + genres.map(g => '<span class="result-genre-tag">' + g + '</span>').join('') + '</div>' +
    '<div class="result-desc">' + record[DB_DESC] + (record[DB_DESC].length >= 150 ? '…' : '') + '</div>';
}

// Trend context footer.
function renderTrendContext(show, movie) {
  const sy = parseInt(show[DB_YEAR]);
  const my = parseInt(movie[DB_YEAR]);

  const sTotal = cohortShows[sy]  || '—';
  const mTotal = cohortMovies[my] || '—';

  const sYear = (sy >= 2010 && sy <= 2021) ? sy : null;
  const mYear = (my >= 2010 && my <= 2021) ? my : null;

  let trendNote = '';
  if (sYear && mYear && sYear !== mYear) {
    const sr = cohortShows[sYear]  / cohortMovies[sYear];
    const mr = cohortShows[mYear]  / cohortMovies[mYear];
    const lo = Math.min(sYear, mYear);
    const hi = Math.max(sYear, mYear);
    if (sr > mr) {
      trendNote = 'TV Shows were gaining vs Movies between ' + lo + '→' + hi +
        ' (TV/Movie ratio: ' + Math.min(sr, mr).toFixed(2) + '→' + Math.max(sr, mr).toFixed(2) + ')';
    } else {
      trendNote = 'Movies were stronger vs TV Shows in that period (ratio: ' + sr.toFixed(2) + '→' + mr.toFixed(2) + ')';
    }
  } else if (sYear && mYear) {
    const sr = cohortShows[sYear] / cohortMovies[sYear];
    trendNote = 'Both titles are from the same release year — TV/Movie ratio that year: ' + sr.toFixed(2);
  }

  document.getElementById('trendContext').innerHTML =
    '<div class="trend-stat">' +
      '<div class="trend-stat-label">TV Shows added in ' + (sy || 'N/A') + '</div>' +
      '<div class="trend-stat-val" style="color:var(--teal)">' + sTotal + '</div>' +
    '</div>' +
    '<div class="trend-stat">' +
      '<div class="trend-stat-label">Movies added in ' + (my || 'N/A') + '</div>' +
      '<div class="trend-stat-val" style="color:var(--red)">' + mTotal + '</div>' +
    '</div>' +
    (trendNote
      ? '<div style="font-size:10px;color:var(--muted);flex:1;line-height:1.7;letter-spacing:.5px">' + trendNote + '</div>'
      : '') +
    '<div style="font-size:9px;color:#444;letter-spacing:1px;margin-left:auto">"Year" = release year in dataset</div>';
}

// Main compare trigger.
function runCompare() {
  if (!selectedShow || !selectedMovie) return;

  renderCard(document.getElementById('showCard'),  selectedShow);
  renderCard(document.getElementById('movieCard'), selectedMovie);
  renderTrendContext(selectedShow, selectedMovie);

  const result = document.getElementById('compareResult');
  result.classList.add('visible');
  setTimeout(() => result.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}