// The population explorer: every life of the second inheritance study
// (data/inheritance.json, written by scripts/site-inheritance-data.js), one
// population at a time, in each arm. A row per generation, a dot per life;
// the same column is the same world in every arm. In the inheriting arms a
// thin line joins each daughter to her mother.
import data from './data/inheritance.json';
import { T } from './strings.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const ARMS = ['born', 'learn', 'inheritAny', 'inherit'];
const KEY = { born: 'none', learn: 'verdict', inheritAny: 'rule', inherit: 'evidence' };
const LATE = [3, 4, 5];
const unpack = (v) => ({ mother: (v >> 2) - 1, alive: (v >> 1) & 1, repair: v & 1 });

function pedigree(gens, { arm, inherits }) {
  const W = 440, H = 232, L = 34, R = 10, Tp = 14, B = 10;
  const n = gens[0].length;
  const x = (i) => L + (i + 0.5) * ((W - L - R) / n);
  const y = (g) => Tp + g * ((H - Tp - B) / (gens.length - 0.4));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  gens.forEach((row, g) => {
    s += `<text class="lbl" x="${L - 10}" y="${y(g) + 4}" text-anchor="end">${T.genShort}${g}</text>`;
    if (LATE.includes(g) && g === LATE[0]) s += `<rect x="${L - 4}" y="${y(g) - 13}" width="${W - L - R + 8}" height="${y(5) - y(3) + 26}" fill="var(--surface-2)"/>`;
  });
  if (inherits) {
    gens.forEach((row, g) => {
      if (!g) return;
      row.forEach((v, i) => {
        const { mother } = unpack(v);
        if (mother < 0) return;
        s += `<line x1="${x(mother)}" y1="${y(g - 1) + 6}" x2="${x(i)}" y2="${y(g) - 6}" stroke="var(--rule-strong)" stroke-width="1" opacity=".75"/>`;
      });
    });
  }
  gens.forEach((row, g) => row.forEach((v, i) => {
    const { alive, repair, mother } = unpack(v);
    const tip = `${T.arms[arm]} · ${T.genShort}${g} · ${T.slot} ${i + 1}: ${alive ? T.alive : T.dead}${repair ? ` · ${T.carries}` : ''}${mother >= 0 ? ` · ${T.motherWord} ${mother + 1}` : ''}`;
    if (repair) s += `<circle cx="${x(i)}" cy="${y(g)}" r="8.2" fill="none" stroke="var(--accent)" stroke-width="1.8"/>`;
    s += `<circle cx="${x(i)}" cy="${y(g)}" r="5.2" fill="${alive ? `var(--s-${KEY[arm]})` : 'var(--surface)'}" stroke="${alive ? `var(--s-${KEY[arm]})` : 'var(--rule-strong)'}" stroke-width="1.6"><title>${esc(tip)}</title></circle>`;
  }));
  return `${s}</svg>`;
}

const host = document.getElementById('explorer');
if (host) {
  const state = { damage: 'dusk', pop: null };
  const popInput = document.getElementById('explorer-pop');
  const count = (gens, pick) => LATE.reduce((a, g) => a + gens[g].filter((v) => pick(unpack(v))).length, 0);
  const lateLives = (gens) => LATE.reduce((a, g) => a + gens[g].length, 0);

  // The population whose inherit − learn gap is closest to the study's mean.
  function typical(damage) {
    const d = data.damages[damage].arms;
    const a = d.inherit ?? d.learn, b = d.learn ?? d.born;
    const diffs = a.map((gens, p) => count(gens, (l) => l.alive) - count(b[p], (l) => l.alive));
    const mean = diffs.reduce((s, x) => s + x, 0) / diffs.length;
    return diffs.reduce((best, x, p) => (Math.abs(x - mean) < Math.abs(diffs[best] - mean) ? p : best), 0);
  }

  function draw() {
    const entry = data.damages[state.damage];
    const pops = entry.arms.born.length;
    if (state.pop == null || state.pop >= pops) state.pop = typical(state.damage);
    popInput.max = pops; popInput.value = state.pop + 1;
    document.getElementById('explorer-of').textContent = T.ofPops(pops);
    const arms = ARMS.filter((a) => entry.arms[a]);
    host.innerHTML = arms.map((arm) => {
      const gens = entry.arms[arm][state.pop];
      const alive = count(gens, (l) => l.alive), lives = lateLives(gens), rep = count(gens, (l) => l.repair);
      return `<div class="ped"><h5><i style="background:var(--s-${KEY[arm]})"></i>${esc(T.arms[arm])}<span>${T.pedStats(alive, lives, rep, state.damage === 'intact')}</span></h5>${pedigree(gens, { arm, inherits: arm.startsWith('inherit') })}</div>`;
    }).join('');
    document.getElementById('explorer-note').textContent = T.explorerNote(state.damage);
  }

  document.querySelectorAll('[data-damage]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-damage]').forEach((x) => x.classList.toggle('on', x === b));
    state.damage = b.dataset.damage; state.pop = null; draw();
  }));
  const go = (p) => { const n = data.damages[state.damage].arms.born.length; state.pop = ((p % n) + n) % n; draw(); };
  document.getElementById('explorer-prev').addEventListener('click', () => go(state.pop - 1));
  document.getElementById('explorer-next').addEventListener('click', () => go(state.pop + 1));
  document.getElementById('explorer-dice').addEventListener('click', () => go(Math.floor(Math.random() * data.damages[state.damage].arms.born.length)));
  popInput.addEventListener('change', () => go(Math.max(1, Math.floor(Number(popInput.value) || 1)) - 1));
  draw();
}
