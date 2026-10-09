// Two figures from real runs of the lab:
//   - the main cell's curves, generation by generation (data/generations.json,
//     written by scripts/site-data.js);
//   - the lab itself, run live in a worker on a seed the reader picks, with
//     the lifelines of the beliefs that went from ant to ant.
import curves from './data/generations.json';
import { lineChart, lifelines } from './charts.js';
import { T, pct, num } from './strings.js';

const FORMATS = ['none', 'verdict', 'rule', 'evidence'];
const MARK = 6;

const fmtOf = (key) => (key === 'alive' || key === 'acc' ? pct : (v) => num(v));
const maxOf = (key) => (key === 'alive' || key === 'acc' ? 1 : undefined);

// ---------- curves over generations (200 lineages per format) ----------
function drawCurves(key) {
  const host = document.getElementById('curves-chart');
  if (!host) return;
  host.innerHTML = lineChart(
    FORMATS.map((f) => ({ key: f, label: T.formats[f], values: curves.formats[f][key] })),
    { yMax: maxOf(key), yFmt: fmtOf(key), mark: MARK, markLabel: T.change, xLabel: T.generation, width: 900, height: 300 },
  );
  const title = document.getElementById('curves-title');
  if (title) title.textContent = T.curves[key];
}
document.querySelectorAll('[data-curve]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[data-curve]').forEach((x) => x.classList.toggle('on', x === b));
  drawCurves(b.dataset.curve);
}));
drawCurves('alive');

// ---------- the live lab ----------
const form = document.getElementById('lab-form');
if (form) {
  const out = { runs: {}, id: 0, t0: 0 };
  const btn = form.querySelector('button[type=submit]');
  const status = document.getElementById('lab-status');
  let worker = null;

  const lineKey = () => form.querySelector('[data-lab-line].on')?.dataset.labLine ?? 'alive';
  const treeFormat = () => form.querySelector('[data-lab-tree].on')?.dataset.labTree ?? 'rule';

  function drawLab() {
    const key = lineKey();
    const done = FORMATS.filter((f) => out.runs[f]);
    const change = form.change.value;
    document.getElementById('lab-lines').innerHTML = lineChart(
      done.map((f) => ({ key: f, label: T.formats[f], values: out.runs[f].rows.map((r) => r[key]) })),
      { yMax: maxOf(key), yFmt: fmtOf(key), mark: change === 'none' ? null : MARK, markLabel: T.change, xLabel: T.generation, width: 900, height: 280 },
    );
    const f = treeFormat();
    const run = out.runs[f];
    if (run) {
      document.getElementById('lab-tree').innerHTML = lifelines(run.genealogy, {
        mark: change === 'none' ? null : MARK,
        width: 900,
        labels: { change: T.change, carriers: T.carriers, false: T.isFalse, empty: T.empty },
      });
      document.getElementById('lab-tree-note').textContent = T.beliefs(run.genealogy.length, T.formats[f]);
    }
    document.getElementById('lab-summary').innerHTML = done.map((k) => {
      const g = out.runs[k].rows[MARK];
      return `<span><i style="background:var(--s-${k})"></i>${T.summary(T.formats[k], pct(g.alive), num(g.myths))}</span>`;
    }).join('');
  }

  function run() {
    worker?.terminate();
    worker = new Worker(new URL('./lab-worker.js', import.meta.url), { type: 'module' });
    out.runs = {}; out.id += 1; out.t0 = performance.now();
    btn.disabled = true; status.textContent = T.running;
    const seed = Math.max(1, Math.floor(Number(form.seed.value) || 1));
    worker.onmessage = ({ data }) => {
      if (data.id !== out.id) return;
      if (data.done) {
        btn.disabled = false;
        status.textContent = T.ran(Math.round(performance.now() - out.t0));
        return;
      }
      out.runs[data.format] = data;
      drawLab();
    };
    worker.onerror = (e) => { btn.disabled = false; status.textContent = e.message; };
    worker.postMessage({ id: out.id, seed, change: form.change.value, formats: FORMATS });
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
  form.querySelector('#lab-dice').addEventListener('click', () => {
    form.seed.value = 1 + Math.floor(Math.random() * 99999);
    run();
  });
  form.change.addEventListener('change', run);
  form.querySelectorAll('[data-lab-line], [data-lab-tree]').forEach((b) => b.addEventListener('click', () => {
    const attr = 'labLine' in b.dataset ? 'data-lab-line' : 'data-lab-tree';
    form.querySelectorAll(`[${attr}]`).forEach((x) => x.classList.toggle('on', x === b));
    drawLab();
  }));

  // Run once when it first comes into view, not on load.
  const seen = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { seen.disconnect(); run(); }
  }, { rootMargin: '200px' });
  seen.observe(form);
}
