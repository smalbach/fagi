import { startHero } from './hero.js';
import { T } from './strings.js';
import './lab.js';

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

// ---------- things appear as they scroll in ----------
const revealed = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealed.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('main section > *, .stat, .card').forEach((el) => {
  el.classList.add('reveal');
  revealed.observe(el);
});

// ---------- the big numbers count up once ----------
const counted = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    counted.unobserve(e.target);
    const to = Number(e.target.dataset.count), t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / 1100), v = Math.round(to * (1 - (1 - k) ** 3));
      e.target.textContent = document.documentElement.lang === 'en' ? v.toLocaleString('en-US') : v.toLocaleString('es-ES').replace(/\./g, ' ');
      if (k < 1) requestAnimationFrame(tick);
    };
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(tick);
  }
});
document.querySelectorAll('[data-count]').forEach((el) => counted.observe(el));

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
