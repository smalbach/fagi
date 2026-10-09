import { startHero } from './hero.js';
import { T, pct, num } from './strings.js';
import { lineChart, groupedBars } from './charts.js';
import './lab.js';
import game from './data/game.json';

// ---------- theme: light, dark, or whatever the system says ----------
const root = document.documentElement;
function readTheme() { try { return localStorage.getItem('fagi-theme'); } catch { return null; } }
function saveTheme(v) { try { v === 'auto' ? localStorage.removeItem('fagi-theme') : localStorage.setItem('fagi-theme', v); } catch { /* private mode */ } }
function applyTheme(v) {
  if (v === 'light' || v === 'dark') root.dataset.theme = v; else delete root.dataset.theme;
  document.querySelectorAll('[data-theme-set]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themeSet === v)));
}
applyTheme(readTheme() ?? 'auto');
document.querySelectorAll('[data-theme-set]').forEach((b) => b.addEventListener('click', () => {
  applyTheme(b.dataset.themeSet);
  saveTheme(b.dataset.themeSet);
}));

// Expose the selected result/metric on each native button group.
function syncSelections() {
  document.querySelectorAll('.seg button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.classList.contains('on')));
  });
}
syncSelections();
document.querySelectorAll('.seg').forEach((group) => {
  group.addEventListener('click', () => queueMicrotask(syncSelections));
});

// ---------- hero ----------
const heroCanvas = document.getElementById('hero-canvas');
if (heroCanvas) startHero(heroCanvas);

// ---------- contents rail: mark the section being read ----------
const links = [...document.querySelectorAll('.toc a')];
const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
const seen = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    links.forEach((a) => a.classList.remove('on'));
    byId.get(e.target.id)?.classList.add('on');
  }
}, { rootMargin: '-30% 0px -65% 0px' });
document.querySelectorAll('main section[id]').forEach((s) => seen.observe(s));

// ---------- the main result as bars ----------
// Means per lineage, copied from docs/research/results.md.
const RESULTS = {
  lab: {
    label: T.labSource,
    harm: { none: 0.66, verdict: 0.53, rule: 0.31, evidence: 0.28 },
    surv: { none: 96, verdict: 94, rule: 66, evidence: 81 },
    myth: { none: 0.00, verdict: 1.99, rule: 2.85, evidence: 0.86 },
  },
  game: {
    label: T.gameSource,
    harm: { none: 1.95, verdict: 1.12, rule: 0.79, evidence: 0.82 },
    surv: { none: 81, verdict: 89, rule: 67, evidence: 81 },
    myth: { none: 0.10, verdict: 0.59, rule: 1.41, evidence: 0.93 },
  },
};
const FORMATS = ['none', 'verdict', 'rule', 'evidence'].map((k) => [k, T.formats[k], T.formatsShort[k]]);
const dec = (v) => (document.documentElement.lang === 'en' ? v.toFixed(2) : v.toFixed(2).replace('.', ','));
const PANELS = [
  ['harm', T.harmTitle, T.less, dec],
  ['surv', T.survTitle, T.more, (v) => `${v}%`],
  ['myth', T.mythTitle, T.less, dec],
];

function bars(values, fmt, max) {
  const w = 260, h = 170, pad = 22, bw = 44, gap = (w - FORMATS.length * bw) / (FORMATS.length + 1);
  let s = `<svg viewBox="0 0 ${w} ${h + pad}" role="img">`;
  for (const f of [0.25, 0.5, 0.75, 1]) {
    const y = h - f * (h - 20);
    s += `<line class="grid" x1="0" x2="${w}" y1="${y}" y2="${y}"/>`;
  }
  s += `<line class="axis" x1="0" x2="${w}" y1="${h}" y2="${h}"/>`;
  FORMATS.forEach(([k, name, short], i) => {
    const v = values[k], bh = Math.max(1.5, (v / max) * (h - 20));
    const x = gap + i * (bw + gap);
    s += `<rect x="${x}" y="${h - bh}" width="${bw}" height="${bh}" rx="3" fill="var(--s-${k})"><title>${name}: ${fmt(v)}</title></rect>`;
    s += `<text class="val" x="${x + bw / 2}" y="${h - bh - 5}" text-anchor="middle">${fmt(v)}</text>`;
    s += `<text class="lbl" x="${x + bw / 2}" y="${h + 15}" text-anchor="middle">${short}</text>`;
  });
  return s + '</svg>';
}

function drawResults(which) {
  const host = document.getElementById('result-charts');
  if (!host) return;
  const r = RESULTS[which];
  host.innerHTML = PANELS.map(([key, title, hint, fmt]) => {
    const max = key === 'surv' ? 100 : Math.max(...Object.values(RESULTS.lab[key]), ...Object.values(RESULTS.game[key]));
    return `<div class="chart"><h5>${title} <span class="muted">· ${hint}</span></h5>${bars(r[key], fmt, max)}</div>`;
  }).join('');
  document.getElementById('result-source').textContent = r.label;
}
document.querySelectorAll('[data-results]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-results]').forEach((x) => x.classList.toggle('on', x === b));
  drawResults(b.dataset.results);
}));
drawResults('lab');

// ---------- inheriting what was learned, by generation ----------
// Share alive at 7200 s, 512 lives per point, copied from docs/research/prereg-lineage-results.md.
// Each arm takes a colour of the formats above: born grey, learn blue, any mother orange, survivors green.
const INHERIT = [
  ['none', 'born', [0.477, 0.426, 0.502, 0.486, 0.479, 0.449]],
  ['verdict', 'learn', [0.508, 0.475, 0.525, 0.500, 0.508, 0.471]],
  ['rule', 'inheritAny', [0.508, 0.527, 0.588, 0.588, 0.605, 0.541]],
  ['evidence', 'inherit', [0.508, 0.516, 0.592, 0.613, 0.617, 0.576]],
];
const inheritHost = document.getElementById('inherit-chart');
if (inheritHost) {
  document.getElementById('inherit-title').textContent = T.inheritTitle;
  inheritHost.innerHTML = lineChart(
    INHERIT.map(([key, arm, values]) => ({ key, label: T.arms[arm], values })),
    { yMax: 0.8, yFmt: pct, xLabel: T.generation },
  );
}

// ---------- second inheritance study (Figure 6b) ----------
// Survival in generations 3-5 per damage, from docs/research/prereg-inheritance-2-results.md
// (the intact program has no "any mother" arm).
const INHERIT2 = [
  ['none', 'born', [0.467, 0.550, 0.744]],
  ['verdict', 'learn', [0.495, 0.564, 0.686]],
  ['rule', 'inheritAny', [0.576, 0.645, null]],
  ['evidence', 'inherit', [0.605, 0.667, 0.654]],
];
const inherit2Host = document.getElementById('inherit2-chart');
if (inherit2Host) {
  document.getElementById('inherit2-title').textContent = T.inherit2Title;
  inherit2Host.innerHTML = groupedBars(
    T.damages.map((label, i) => ({ label, values: INHERIT2.map(([, , v]) => v[i]) })),
    INHERIT2.map(([key, arm]) => ({ key, label: T.arms[arm] })),
    { yMax: 0.8, yFmt: pct },
  );
}

// ---------- information-matched replication (Figure 4) ----------
// Differences between formats, from docs/research/results.md (main study) and
// the replication on research/codigo-cultural: [counting items, matching information].
const COVERAGE = [
  [[0.232, 0.046], [0.224, 0.029]],
  [[0.863, 0.902], [2.000, 2.071]],
];
const coverageHost = document.getElementById('coverage-charts');
if (coverageHost) {
  const series = T.coverageSeries.map((label, i) => ({ key: i ? 'verdict' : 'rule', label }));
  coverageHost.innerHTML = COVERAGE.map((rows, panel) => {
    const groups = rows.map((values, i) => ({ label: T.coverageGroups[panel * 2 + i], values }));
    return `<div class="chart"><h5>${T.coverageTitles[panel]}</h5>${groupedBars(groups, series, { yFmt: (v) => num(v), width: 420, height: 240, yMax: panel ? 2.4 : 0.3 })}</div>`;
  }).join('');
}

// ---------- world calibration (Figure 5) ----------
// Share alive at 7200 s, docs/research/world-calibration.md (survival table).
const CALIB_X = [300, 450, 525, 550, 575, 590, 600, 675, 750];
const CALIB = [
  ['evidence', 'born', [1.00, 0.96, 0.92, 0.94, 0.75, 0.44, 0.33, 0.04, 0]],
  ['verdict', 'noWarmth', [1.00, 0.92, 0.67, 0.38, 0.38, 0.33, 0.29, 0, 0]],
  ['rule', 'noFood', [1.00, 0.71, 0.79, 0.73, 0.48, 0.29, 0.21, 0, 0]],
  ['none', 'learns', [1.00, 1.00, 1.00, 0.98, 0.58, 0.38, 0.29, 0, 0]],
];
const calibHost = document.getElementById('calib-chart');
if (calibHost) {
  document.getElementById('calib-title').textContent = T.calibTitle;
  calibHost.innerHTML = lineChart(
    CALIB.map(([key, v, values]) => ({ key, label: T.calib[v], values })),
    { yMax: 1, yFmt: pct, xTicks: CALIB_X, xLabel: T.calibX, mark: 4, markLabel: T.calibMark },
  );
}

// ---------- the game over 20 years and the transplant (Figures 7 and 8) ----------
// From investigacion/data/game.json (node scripts/site-game-data.js). Habitats
// take the formats' colours: cold blue, hot orange, toxic green.
const HAB_KEY = { cold: 'verdict', hot: 'rule', toxic: 'evidence' };
const evoHost = document.getElementById('evo-chart');
// A year when every map's nest of that habitat stood empty keeps the last value.
const fill = (xs) => xs.map((v, i) => v ?? xs.slice(0, i).reverse().find((u) => u != null) ?? 1);
function drawEvo(gene) {
  const ev = game.evolution;
  const all = ev.habitats.flatMap((h) => ev.genes[gene][h]).filter((v) => v != null);
  // Round ticks: the axis spans whole multiples of 0.2, so its grid falls on tenths.
  const lo = Math.floor(Math.min(1, ...all) * 10) / 10;
  const hi = lo + Math.ceil((Math.max(1, ...all) - lo) / 0.2) * 0.2;
  document.getElementById('evo-title').textContent = T.evoTitle(T.genes[gene]);
  evoHost.innerHTML = lineChart(
    ev.habitats.map((h) => ({ key: HAB_KEY[h] ?? 'none', label: T.habitats[h] ?? h, values: fill(ev.genes[gene][h]) })),
    { yMin: lo, yMax: hi, yFmt: (v) => num(v), xTicks: ev.years, xEvery: 2, xLabel: T.year },
  );
}
if (evoHost) {
  drawEvo('muscle');
  document.querySelectorAll('[data-gene]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-gene]').forEach((x) => x.classList.toggle('on', x === b));
    drawEvo(b.dataset.gene);
  }));
}
const tpHost = document.getElementById('tp-chart');
if (tpHost) {
  const tp = game.transplant;
  document.getElementById('tp-title').textContent = T.tpTitle;
  tpHost.innerHTML = groupedBars(
    tp.habitats.map((h, i) => ({ label: T.habitats[h] ?? h, values: [tp.local[i], tp.foreign[i]] })),
    T.tpSeries.map((label, i) => ({ key: i ? 'none' : 'evidence', label })),
    { yFmt: (v) => num(v) },
  );
}
