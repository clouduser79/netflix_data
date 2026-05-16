/* ============================================================
   charts.js — Trend model: line charts & ratio bars
   Shawn Mankotia, 2026
   ============================================================ */

// Raw cohort data (derived from netflix_titles.csv)
// Used for both the line charts and the ratio bars in the verdict panel.
const years  = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021];
const movies = [154,  145,  173,  225,  264,  398,  658,  767,  767,  633,  517,  277];
const shows  = [40,   40,   64,   63,   88,   162,  244,  265,  380,  397,  436,  315];

// Linear regression helper.
// Literally the only time linear regression is useful in life.
function linReg(xs, ys) {
  const n  = xs.length;
  const xm = xs.reduce((a, b) => a + b, 0) / n;
  const ym = ys.reduce((a, b) => a + b, 0) / n;
  const slope =
    xs.reduce((s, x, i) => s + (x - xm) * (ys[i] - ym), 0) /
    xs.reduce((s, x)    => s + (x - xm) ** 2, 0);
  return xs.map(x => slope * (x - xm) + ym);
}

// Trend lines
const mTrend = linReg(years, movies);
const sTrend = linReg(years, shows);

// Derived series.
// Growth rates are calculated as the percentage change from the previous year, with the first year set to 0% growth. 
// Ratios are calculated as the number of TV shows per movie for each year.
const growthM = movies.map((v, i) => i === 0 ? 0 : +((v - movies[i - 1]) / movies[i - 1] * 100).toFixed(1));
const growthS = shows.map((v, i)  => i === 0 ? 0 : +((v - shows[i - 1])  / shows[i - 1]  * 100).toFixed(1));
const ratios  = years.map((_, i)  => +(shows[i] / movies[i]).toFixed(2));

// Chart config definitions.
// Each chart type has its own dataset configuration and y-axis label. 
// They all share the same x-axis (years) and styling conventions for consistency.
const chartConfigs = {
  volume: {
    datasets: [
      {
        label: 'Movies',
        data: movies,
        borderColor: '#E50914',
        backgroundColor: 'rgba(229,9,20,0.12)',
        fill: true, tension: 0.3, pointRadius: 4
      },
      {
        label: 'TV Shows',
        data: shows,
        borderColor: '#00B4D8',
        backgroundColor: 'rgba(0,180,216,0.12)',
        fill: true, tension: 0.3, pointRadius: 4
      },
      {
        label: 'Movie Trend',
        data: mTrend,
        borderColor: 'rgba(229,9,20,0.45)',
        borderDash: [6, 4],
        pointRadius: 0, fill: false
      },
      {
        label: 'TV Trend',
        data: sTrend,
        borderColor: 'rgba(0,180,216,0.45)',
        borderDash: [6, 4],
        pointRadius: 0, fill: false
      },
    ],
    yLabel: 'Titles Added'
  },

  ratio: {
    datasets: [
      {
        label: 'TV/Movie Ratio',
        data: ratios,
        borderColor: '#F5C518',
        backgroundColor: 'rgba(245,197,24,0.15)',
        fill: true, tension: 0.4, pointRadius: 5
      }
    ],
    yLabel: 'TV Shows per Movie'
  },

  growth: {
    datasets: [
      {
        label: 'Movie Growth %',
        data: growthM,
        borderColor: '#E50914',
        backgroundColor: 'rgba(229,9,20,0.1)',
        fill: false, tension: 0.3, pointRadius: 4
      },
      {
        label: 'TV Show Growth %',
        data: growthS,
        borderColor: '#00B4D8',
        backgroundColor: 'rgba(0,180,216,0.1)',
        fill: false, tension: 0.3, pointRadius: 4
      },
    ],
    yLabel: 'YoY Growth (%)'
  }
};

// Chart instance management.
// I kept a reference to the active Chart.js instance so we can destroy it before creating a new one when switching charts.
let activeChart = null;

function buildChart(type) {
  if (activeChart) activeChart.destroy();

  const cfg = chartConfigs[type];
  const ctx = document.getElementById('mainChart').getContext('2d');

  activeChart = new Chart(ctx, {
    type: 'line',
    data: { labels: years, datasets: cfg.datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500, easing: 'easeInOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111',
          borderColor: '#333',
          borderWidth: 1,
          titleColor: '#E8E8E8',
          bodyColor: '#aaa',
          titleFont: { family: 'Space Mono', size: 11 },
          bodyFont:  { family: 'Space Mono', size: 10 }
        }
      },
      scales: {
        x: {
          grid:  { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#666', font: { family: 'Space Mono', size: 10 } }
        },
        y: {
          grid:  { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#666', font: { family: 'Space Mono', size: 10 } },
          title: { display: true, text: cfg.yLabel, color: '#555', font: { family: 'Space Mono', size: 9 } }
        }
      }
    }
  });
}

function switchChart(type, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  buildChart(type);
}

// Ratio bars (verdict panel)
// This is a custom implementation of horizontal bars to visualize the TV-to-movie ratio for selected years.
const ratioSamples = [
  [2010, 154, 40],
  [2013, 225, 63],
  [2015, 398, 162],
  [2017, 767, 265],
  [2019, 633, 397],
  [2021, 277, 315]
];

function buildRatioBars() {
  const container = document.getElementById('ratioBars');
  ratioSamples.forEach(([y, m, s]) => {
    const total = m + s;
    const mp = (m / total * 100).toFixed(0);
    const sp = (s / total * 100).toFixed(0);
    container.innerHTML += `
      <div class="ratio-row">
        <div class="ratio-year">${y}</div>
        <div class="ratio-track">
          <div class="ratio-movie" style="width:${mp}%"></div>
          <div class="ratio-show"  style="width:${sp}%"></div>
        </div>
        <div class="ratio-num">${(s / m).toFixed(2)}</div>
      </div>`;
  });
}

// Init the default chart and ratio bars on page load.
buildChart('volume');
buildRatioBars();