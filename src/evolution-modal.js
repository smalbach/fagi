// The evolution panel: how each colony changes over the years (evolution.js
// records it). One line per colony, coloured by its habitat; a trait at a
// time — an organ's inherited gene or the body it grew into, how many live,
// the lines of conduct they carry. Hover a point in time to read every colony.

import { evolutionOf, ORGANS } from './evolution.js';
import { getLang, onLangChange, t } from './i18n.js';

const L = (en, es) => (getLang() === 'es' ? es : en);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Colour follows the colony's habitat (validated on the panel's surface:
// dataviz validate_palette, dark, all pairs). Without habitats, by nest order.
const HABITAT_COLOR = { cold: '#3987e5', hot: '#d95926', toxic: '#199e70' };
const ORDER_COLOR = ['#3987e5', '#d95926', '#199e70'];
const HABITAT_NAME = {
  cold: () => L('cold hollow', 'hondonada fría'),
  hot: () => L('sun-baked slope', 'ladera soleada'),
  toxic: () => L('poison close by', 'veneno cerca'),
  lean: () => L('poor soil', 'suelo pobre'),
};

const TRAITS = {
  muscle: { name: () => L('Muscle', 'Músculo'), why: () => L('Carrying fruit that weighs home pays for muscle; keeping it costs energy.', 'Cargar al nido fruta que pesa paga el músculo; mantenerlo cuesta energía.') },
  brain: { name: () => L('Brain', 'Cerebro'), why: () => L('A bigger brain remembers more, but costs life and slows breeding: it has to pay for itself.', 'Un cerebro mayor recuerda más, pero cuesta vida y frena la cría: tiene que pagarse solo.') },
  size: { name: () => L('Size', 'Tamaño'), why: () => L('Raised cold an ant grows bigger and keeps her warmth; raised warm, smaller, and her tracheae keep up with the heat.', 'Criada con frío una hormiga crece más grande y conserva el calor; criada con calor, más pequeña, y sus tráqueas aguantan el calor.') },
  gut: { name: () => L('Gut', 'Estómago'), why: () => L('A bigger gut takes more from little food and hard fruit, and costs to keep.', 'Un estómago mayor saca más de poca comida y de fruta dura, y cuesta mantenerlo.') },
  eyes: { name: () => L('Eyes', 'Ojos'), why: () => L('Bigger eyes see farther; they cost little, so they mostly drift.', 'Ojos mayores ven más lejos; cuestan poco, así que mayormente derivan.') },
  antennae: { name: () => L('Antennae', 'Antenas'), why: () => L('Bigger antennae smell farther; like eyes, cheap and mostly drifting.', 'Antenas mayores huelen más lejos; como los ojos, baratas y mayormente a la deriva.') },
  alive: { name: () => L('Population', 'Población'), why: () => L('How many live in each nest: food and winter set it, not the nest\'s ceiling.', 'Cuántas viven en cada nido: lo fijan la comida y el invierno, no el techo del nido.') },
  ownLines: { name: () => L('Learned lines', 'Líneas aprendidas'), why: () => L('Lines of conduct an ant carries that she was not born with: written by herself, inherited from her mother or told by a sister.', 'Líneas de conducta que una hormiga lleva y con las que no nació: escritas por ella, heredadas de su madre o contadas por una hermana.') },
};

const isOrgan = (k) => ORGANS.includes(k);

// A learned line 'from>over' (program.js): she now does `from` before `over`.
// Said with the brain map's words for each line, the code name as a fallback.
function lineText(key) {
  const [from, over] = key.split('>');
  const say = (id) => { const k = `brainmap.rule.${id}`; const s = t(k); return s && s !== k ? s : id; };
  return `${L('first', 'primero')}: <b>${esc(say(from))}</b> · ${L('before', 'antes que')}: ${esc(say(over))}`;
}

export function createEvolutionModal(worldGetter) {
  const none = { open() {}, close() {}, update() {} };
  if (typeof document === 'undefined') return none;
  const overlay = document.getElementById('evolution-overlay');
  const btnOpen = document.getElementById('btn-evolution');
  const btnClose = document.getElementById('btn-evo-close');
  const body = document.getElementById('evolution-body');
  if (!overlay || !btnOpen || !body) return none;

  const state = { trait: 'muscle', view: 'gene', hover: null };
  let lastPaint = 0;
  let lastCount = -1;
  const getWorld = () => (typeof worldGetter === 'function' ? worldGetter() : worldGetter);

  function open() { overlay.hidden = false; paint(true); }
  function close() { overlay.hidden = true; }

  function valueOf(n, trait, view) {
    if (isOrgan(trait)) return n[view]?.[trait] ?? null;
    return n[trait] ?? null;
  }

  function series(samples, trait, view) {
    const ids = [...new Set(samples.flatMap((s) => s.nests.map((n) => n.nest)))];
    return ids.map((id, i) => {
      const last = [...samples].reverse().map((s) => s.nests.find((n) => n.nest === id)).find(Boolean);
      const habitat = last?.habitat ?? null;
      return {
        id,
        habitat,
        color: HABITAT_COLOR[habitat] ?? ORDER_COLOR[i % ORDER_COLOR.length],
        label: habitat ? `${HABITAT_NAME[habitat]?.() ?? habitat}` : `${L('nest', 'nido')} #${id}`,
        points: samples.map((s) => {
          const n = s.nests.find((x) => x.nest === id);
          return { t: s.t, year: s.year, v: n && n.alive ? valueOf(n, trait, view) : (trait === 'alive' && n ? 0 : null), n };
        }),
      };
    });
  }

  const xOf = (p) => (p.year != null ? p.year : p.t / 60);
  const xUnit = (samples) => (samples[0]?.year != null ? L('years', 'años') : L('minutes', 'minutos'));
  const fmt = (v, trait) => (v == null ? '—' : trait === 'alive' ? String(Math.round(v)) : v.toFixed(trait === 'ownLines' ? 2 : 3));

  function chart(ss, samples, trait) {
    const W = 720, H = 280, M = { l: 48, r: 112, t: 14, b: 34 };
    const all = ss.flatMap((s) => s.points.filter((p) => p.v != null));
    if (all.length < 2) return `<div class="evo-empty">${L('Not enough history yet: the panel samples every two minutes of the world.', 'Aún no hay historia suficiente: el panel toma una muestra cada dos minutos del mundo.')}</div>`;
    const xs = all.map(xOf);
    const x0 = Math.min(...xs), x1 = Math.max(...xs, x0 + 1e-6);
    let y0 = Math.min(...all.map((p) => p.v)), y1 = Math.max(...all.map((p) => p.v));
    if (isOrgan(trait)) { y0 = Math.min(y0, 1); y1 = Math.max(y1, 1); }
    if (trait === 'alive' || trait === 'ownLines') y0 = 0;
    const pad = (y1 - y0) * 0.08 || 0.05;
    y0 -= trait === 'alive' || trait === 'ownLines' ? 0 : pad; y1 += pad;
    const X = (v) => M.l + ((v - x0) / (x1 - x0)) * (W - M.l - M.r);
    const Y = (v) => H - M.b - ((v - y0) / (y1 - y0)) * (H - M.t - M.b);
    const ticks = (a, b, n) => { const step = niceStep((b - a) / n); const out = []; for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(6)); return out; };
    const yt = ticks(y0, y1, 4), xt = ticks(x0, x1, 6);
    let svg = `<svg class="evo-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(TRAITS[trait].name())}">`;
    for (const v of yt) svg += `<line class="evo-grid" x1="${M.l}" x2="${W - M.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="evo-tick" x="${M.l - 6}" y="${Y(v) + 4}" text-anchor="end">${+v.toFixed(3)}</text>`;
    for (const v of xt) svg += `<text class="evo-tick" x="${X(v)}" y="${H - M.b + 16}" text-anchor="middle">${+v.toFixed(1)}</text>`;
    svg += `<text class="evo-tick" x="${(M.l + W - M.r) / 2}" y="${H - 4}" text-anchor="middle">${xUnit(samples)}</text>`;
    if (isOrgan(trait)) svg += `<line class="evo-base" x1="${M.l}" x2="${W - M.r}" y1="${Y(1)}" y2="${Y(1)}"/><text class="evo-tick" x="${M.l + 6}" y="${Y(1) - 5}">${L('founders', 'fundadoras')}</text>`;
    // Lines, broken where a colony was empty.
    const ends = [];
    for (const s of ss) {
      let d = '', pen = false, lastP = null;
      for (const p of s.points) {
        if (p.v == null) { pen = false; continue; }
        d += `${pen ? 'L' : 'M'}${X(xOf(p)).toFixed(1)},${Y(p.v).toFixed(1)}`;
        pen = true; lastP = p;
      }
      svg += `<path class="evo-line" d="${d}" stroke="${s.color}"/>`;
      if (lastP) ends.push({ s, y: Y(lastP.v), x: X(xOf(lastP)) });
    }
    // Direct labels at the line ends, nudged apart.
    ends.sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
    for (const e of ends) svg += `<circle cx="${e.x}" cy="${e.s.points.filter((p) => p.v != null).length ? Y(e.s.points.filter((p) => p.v != null).at(-1).v) : e.y}" r="4" fill="${e.s.color}" class="evo-dot"/><text class="evo-end" x="${W - M.r + 8}" y="${e.y + 4}">${esc(e.s.label)}</text>`;
    // Crosshair at the hovered sample.
    if (state.hover != null && samples[state.hover]) {
      const p0 = ss[0].points[state.hover];
      const hx = X(xOf(p0));
      svg += `<line class="evo-cross" x1="${hx}" x2="${hx}" y1="${M.t}" y2="${H - M.b}"/>`;
      for (const s of ss) { const p = s.points[state.hover]; if (p?.v != null) svg += `<circle cx="${hx}" cy="${Y(p.v)}" r="5" fill="${s.color}" class="evo-dot"/>`; }
    }
    svg += `<rect class="evo-hit" x="${M.l}" y="${M.t}" width="${W - M.l - M.r}" height="${H - M.t - M.b}" data-x0="${x0}" data-x1="${x1}" data-ml="${M.l}" data-w="${W - M.l - M.r}" data-vw="${W}"/></svg>`;
    return svg;
  }

  function tooltip(ss, samples, trait) {
    if (state.hover == null || !samples[state.hover]) return '';
    const s0 = samples[state.hover];
    const when = s0.year != null ? `${L('year', 'año')} ${s0.year.toFixed(1)}` : `${Math.round(s0.t / 60)} min`;
    return `<div class="evo-tip"><b>${when}</b>${ss.map((s) => {
      const p = s.points[state.hover];
      return `<div><span class="evo-sw" style="background:${s.color}"></span>${esc(s.label)}: <b>${fmt(p?.v, trait)}</b>${p?.n ? ` · ${p.n.alive} ${L('alive', 'vivas')}` : ''}</div>`;
    }).join('')}</div>`;
  }

  function cards(ss, trait) {
    return ss.map((s) => {
      const pts = s.points.filter((p) => p.v != null);
      const first = pts[0]?.v, now = pts.at(-1)?.v;
      const n = s.points.at(-1)?.n;
      const change = first != null && now != null && trait !== 'alive' && trait !== 'ownLines' && first
        ? `${now >= first ? '+' : ''}${(((now - first) / first) * 100).toFixed(1)} %` : null;
      const lines = (n?.top ?? []).map(([k, share]) => `<li><span class="evo-share">${Math.round(share * 100)} %</span> ${lineText(k)}</li>`).join('');
      return `<div class="evo-card" style="border-top-color:${s.color}">
        <div class="evo-card-head"><span class="evo-sw" style="background:${s.color}"></span><b>${esc(s.label)}</b> <span class="evo-muted">${L('nest', 'nido')} #${s.id}</span></div>
        <div class="evo-card-row">${L('Alive now', 'Vivas ahora')}: <b>${n?.alive ?? 0}</b>${n?.generation != null ? ` · ${L('generation', 'generación')} ${n.generation}` : ''}</div>
        <div class="evo-card-row">${esc(TRAITS[trait].name())}: <b>${fmt(now, trait)}</b>${change ? ` <span class="evo-muted">(${change} ${L('since the start', 'desde el inicio')})</span>` : ''}</div>
        ${lines ? `<div class="evo-card-row evo-muted">${L('Lines most carried', 'Líneas más llevadas')}:</div><ul class="evo-lines">${lines}</ul>` : ''}
      </div>`;
    }).join('');
  }

  function table(ss, samples, trait) {
    const rows = samples.slice(-12).reverse();
    return `<details class="evo-table"><summary>${L('Show as a table', 'Ver como tabla')}</summary><table><thead><tr><th>${xUnit(samples)}</th>${ss.map((s) => `<th>${esc(s.label)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => {
      const i = samples.indexOf(r);
      return `<tr><td>${(r.year != null ? r.year : r.t / 60).toFixed(1)}</td>${ss.map((s) => `<td>${fmt(s.points[i]?.v, trait)}</td>`).join('')}</tr>`;
    }).join('')}</tbody></table></details>`;
  }

  function paint(force = false) {
    if (overlay.hidden) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const log = evolutionOf(getWorld() ?? {});
    const count = log?.samples.length ?? 0;
    if (!force && (now - lastPaint < 1000 || count === lastCount)) return;
    lastPaint = now; lastCount = count;
    const samples = log?.samples ?? [];
    const organsOn = samples.some((s) => s.nests.some((n) => Object.values(n.gene).some((v) => v != null)));
    const traitBtns = Object.entries(TRAITS).map(([k, t]) => `<button type="button" data-trait="${k}" class="${k === state.trait ? 'on' : ''}" ${isOrgan(k) && !organsOn ? 'disabled' : ''}>${esc(t.name())}</button>`).join('');
    const viewBtns = isOrgan(state.trait) ? `<div class="evo-seg" role="radiogroup">
      <button type="button" data-view="gene" class="${state.view === 'gene' ? 'on' : ''}" title="${esc(L('What they were born with: the mean gene, inherited and selected.', 'Con lo que nacieron: el gen medio, heredado y seleccionado.'))}">${L('Inherited (genes)', 'Heredado (genes)')}</button>
      <button type="button" data-view="body" class="${state.view === 'body' ? 'on' : ''}" title="${esc(L('What they grew into: genes plus what each one lived.', 'En lo que se convirtieron: genes más lo que vivió cada una.'))}">${L('Lived (body)', 'Vivido (cuerpo)')}</button></div>` : '';
    if (!samples.length) {
      body.innerHTML = `<div class="evo-empty">${L('No history here. The panel records the live game every two minutes of the world; a replay does not carry it.', 'No hay historia aquí. El panel registra el juego en vivo cada dos minutos del mundo; una repetición no la trae.')}</div>`;
      return;
    }
    const ss = series(samples, state.trait, state.view);
    body.innerHTML = `
      <div class="evo-controls"><div class="evo-traits">${traitBtns}</div>${viewBtns}</div>
      <p class="evo-why">${esc(TRAITS[state.trait].why())}</p>
      <div class="evo-legend">${ss.map((s) => `<span><span class="evo-sw" style="background:${s.color}"></span>${esc(s.label)}</span>`).join('')}</div>
      <div class="evo-plot">${chart(ss, samples, state.trait)}${tooltip(ss, samples, state.trait)}</div>
      <div class="evo-cards">${cards(ss, state.trait)}</div>
      ${table(ss, samples, state.trait)}`;
    // The tooltip sits beside the crosshair, on whichever side has room.
    const cross = body.querySelector('.evo-cross');
    const tip = body.querySelector('.evo-tip');
    if (cross && tip) {
      const svg = cross.ownerSVGElement;
      const box = svg.getBoundingClientRect();
      const vw = svg.viewBox.baseVal.width || 1;
      const px = (Number(cross.getAttribute('x1')) / vw) * box.width;
      const right = px < box.width / 2;
      tip.style.left = right ? `${px + 12}px` : 'auto';
      tip.style.right = right ? 'auto' : `${box.width - px + 12}px`;
    }
  }

  body.addEventListener('click', (e) => {
    const t = e.target.closest('[data-trait]');
    if (t && !t.disabled) { state.trait = t.dataset.trait; state.hover = null; paint(true); return; }
    const v = e.target.closest('[data-view]');
    if (v) { state.view = v.dataset.view; paint(true); }
  });
  body.addEventListener('mousemove', (e) => {
    const hit = e.target.closest('.evo-hit');
    if (!hit) return;
    const svg = hit.ownerSVGElement;
    const box = svg.getBoundingClientRect();
    const vx = ((e.clientX - box.left) / box.width) * Number(hit.dataset.vw);
    const x = Number(hit.dataset.x0) + ((vx - Number(hit.dataset.ml)) / Number(hit.dataset.w)) * (Number(hit.dataset.x1) - Number(hit.dataset.x0));
    const samples = evolutionOf(getWorld() ?? {})?.samples ?? [];
    let best = 0;
    samples.forEach((s, i) => { if (Math.abs(xOf(s) - x) < Math.abs(xOf(samples[best]) - x)) best = i; });
    if (best !== state.hover) { state.hover = best; paint(true); }
  });
  body.addEventListener('mouseleave', () => { if (state.hover != null) { state.hover = null; paint(true); } });

  btnOpen.addEventListener('click', open);
  btnClose?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) close(); });
  onLangChange(() => { if (!overlay.hidden) paint(true); });
  return { open, close, update: paint };
}

function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  const m = raw / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}
