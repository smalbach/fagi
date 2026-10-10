// A scripted re-enactment of the game's "neural network" brain-map panel
// (src/brainmap/network.js): senses → concepts → what the body felt, the
// places she remembers and the written rules. It plays one long life, in
// which the network grows large, and her daughter's birth, to show what
// inheriting means. The script is fixed: it illustrates the panel, it is not
// data from an experiment.

const LANG = document.documentElement.lang === 'en' ? 'en' : 'es';
const L = (es, en) => (LANG === 'en' ? en : es);

const W = 520;
const H = 440;
const TOP = 34;      // below the column headings
const BOTTOM = 14;
const X = { sense: 84, key: 236, right: 356 };

// Every neuron the story can use, by column, in the order they are stacked.
// Colors are theme tokens.
const NODES = {
  'sense:sight': { col: 'sense', label: L('vista', 'sight'), color: '--blue' },
  'sense:smell': { col: 'sense', label: L('olfato', 'smell'), color: '--blue' },
  'sense:memory': { col: 'sense', label: L('memoria', 'memory'), color: '--blue' },
  'sense:antennae': { col: 'sense', label: L('antenas', 'antennae'), color: '--blue' },
  'sense:pressure': { col: 'sense', label: L('presión', 'pressure'), color: '--blue' },

  'key:berry': { col: 'key', label: L('baya verde', 'green berry'), color: '--leaf' },
  'key:drop': { col: 'key', label: L('gota roja', 'red drop'), color: '--warn' },
  'key:purple': { col: 'key', label: L('baya morada', 'purple berry'), color: '--violet' },
  'key:crystal': { col: 'key', label: L('cristal azul', 'blue crystal'), color: '--blue' },
  'key:orb': { col: 'key', label: L('orbe amarillo', 'yellow orb'), color: '--accent-2' },
  'key:water': { col: 'key', label: L('agua', 'water'), color: '--blue' },
  'key:puddle': { col: 'key', label: L('charco', 'puddle'), color: '--blue' },
  'key:tree': { col: 'key', label: L('árbol', 'tree'), color: '--leaf' },
  'key:rock': { col: 'key', label: L('roca', 'rock'), color: '--ink-3' },
  'key:rain': { col: 'key', label: L('lluvia', 'rain'), color: '--blue' },
  'key:nest': { col: 'key', label: L('nido', 'nest'), color: '--accent-2' },

  'feel:hunger': { col: 'right', label: L('hambre ↓', 'hunger ↓'), color: '--ink-3' },
  'feel:thirst': { col: 'right', label: L('sed ↓', 'thirst ↓'), color: '--ink-3' },
  'feel:speed': { col: 'right', label: L('velocidad ↓', 'speed ↓'), color: '--ink-3' },
  'feel:energy': { col: 'right', label: L('energía ↓', 'energy ↓'), color: '--ink-3' },
  'feel:temperature': { col: 'right', label: L('frío', 'cold'), color: '--ink-3' },
  'feel:found': { col: 'right', label: L('llevó a comida', 'led to food'), color: '--ink-3' },
  'feel:peril': { col: 'right', label: L('peligro después', 'danger later'), color: '--ink-3' },
  'place:water': { col: 'right', label: L('dónde está el agua', 'where the water is'), color: '--accent-2' },
  'place:tree': { col: 'right', label: L('dónde está el árbol', 'where the tree is'), color: '--accent-2' },
  'place:puddle': { col: 'right', label: L('dónde está el charco', 'where the puddle is'), color: '--accent-2' },
  'place:nest': { col: 'right', label: L('dónde está el nido', 'where the nest is'), color: '--accent-2' },
  'rule:avoid': { col: 'right', label: L('evitar gota roja', 'avoid red drop'), color: '--warn' },
  'rule:sweet': { col: 'right', label: L('olor dulce → comer', 'sweet smell → eat'), color: '--leaf' },
  'rule:shelter': { col: 'right', label: L('refugiarse si llueve', 'shelter from rain'), color: '--leaf' },
  'rule:dusk': { col: 'right', label: L('volver al anochecer', 'return at dusk'), color: '--leaf' },
};
const COLS = { sense: [], key: [], right: [] };
for (const [id, n] of Object.entries(NODES)) COLS[n.col].push(id);
const EDGE_COLOR = { hebb: '--blue', good: '--leaf', bad: '--warn', place: '--accent-2', rule: '--violet' };
const BASE_SENSES = ['sense:sight', 'sense:smell', 'sense:memory'];

// The life, step by step. Early steps are quick; as the network grows each
// step stays longer, so there is time to read it. `link` adds or strengthens a synapse to weight w;
// `on` is what fires during the step; `day` moves her calendar; `inherit`
// starts the next generation.
const STEPS = [
  { sec: 0.8, day: 1, cap: L('Nace sin saber nada. Ve una baya verde: la vista se conecta con un concepto nuevo.', 'She is born knowing nothing. She sees a green berry: sight wires to a new concept.'),
    link: [['sense:sight', 'key:berry', 'hebb', 0.35]], on: ['sense:sight', 'key:berry'] },
  { sec: 0.7, cap: L('La prueba. El hambre baja: primera sinapsis con lo que siente el cuerpo.', 'She tastes it. Hunger drops: her first synapse to what the body feels.'),
    link: [['key:berry', 'feel:hunger', 'good', 0.4]], on: ['key:berry', 'feel:hunger'] },
  { sec: 0.7, cap: L('Huele una gota roja. Huele parecido a comida.', 'She smells a red drop. It smells a lot like food.'),
    link: [['sense:smell', 'key:drop', 'hebb', 0.35]], on: ['sense:smell', 'key:drop'] },
  { sec: 0.8, cap: L('La prueba. Se vuelve lenta: lo anota como daño.', 'She tastes it. She slows down, and records it as harm.'),
    link: [['key:drop', 'feel:speed', 'bad', 0.4]], on: ['key:drop', 'feel:speed'] },
  { sec: 0.9, day: 2, cap: L('Encuentra el agua y recuerda dónde está.', 'She finds the water and remembers where it is.'),
    link: [['sense:sight', 'key:water', 'hebb', 0.5], ['sense:memory', 'key:water', 'hebb', 0.5], ['key:water', 'feel:thirst', 'good', 0.5], ['key:water', 'place:water', 'place', 0.6]],
    on: ['sense:sight', 'sense:memory', 'key:water', 'feel:thirst', 'place:water'] },
  { sec: 1.1, day: 3, cap: L('Prueba más cosas. Una baya morada quita la sed; un cristal azul no hace nada.', 'She tries more things. A purple berry quenches thirst; a blue crystal does nothing.'),
    link: [['sense:sight', 'key:purple', 'hebb', 0.4], ['key:purple', 'feel:thirst', 'good', 0.45], ['sense:sight', 'key:crystal', 'hebb', 0.3], ['sense:smell', 'key:purple', 'hebb', 0.3]],
    on: ['sense:sight', 'key:purple', 'key:crystal', 'feel:thirst'] },
  { sec: 1.3, day: 4, cap: L('Las antenas tocan una roca: aprende qué bloquea el paso.', 'Her antennae touch a rock: she learns what blocks the way.'),
    link: [['sense:antennae', 'key:rock', 'hebb', 0.5], ['sense:pressure', 'key:rock', 'hebb', 0.4], ['key:rock', 'feel:energy', 'bad', 0.3], ['sense:antennae', 'key:crystal', 'hebb', 0.25]],
    on: ['sense:antennae', 'sense:pressure', 'key:rock', 'feel:energy'] },
  { sec: 1.5, day: 5, cap: L('El olor de la baya verde la lleva al árbol. Guarda el lugar.', 'The green berry\'s smell leads her to the tree. She stores the place.'),
    link: [['sense:smell', 'key:berry', 'hebb', 0.5], ['sense:smell', 'key:tree', 'hebb', 0.4], ['sense:memory', 'key:tree', 'hebb', 0.5], ['key:tree', 'feel:found', 'good', 0.55], ['key:tree', 'place:tree', 'place', 0.6]],
    on: ['sense:smell', 'sense:memory', 'key:tree', 'feel:found', 'place:tree'] },
  { sec: 1.8, day: 6, cap: L('Llega la lluvia. Pasa frío y aprende que mojarse trae peligro.', 'Rain comes. She gets cold and learns that getting wet brings danger.'),
    link: [['sense:pressure', 'key:rain', 'hebb', 0.4], ['sense:sight', 'key:rain', 'hebb', 0.3], ['key:rain', 'feel:temperature', 'bad', 0.55], ['key:rain', 'feel:peril', 'bad', 0.4], ['sense:sight', 'key:puddle', 'hebb', 0.4], ['key:puddle', 'feel:thirst', 'good', 0.3], ['key:puddle', 'place:puddle', 'place', 0.45]],
    on: ['sense:pressure', 'key:rain', 'feel:temperature', 'feel:peril', 'key:puddle'] },
  { sec: 2.1, day: 7, cap: L('Un orbe amarillo cansa; la gota roja, además, trae peligro después.', 'A yellow orb tires her; the red drop also brings danger later.'),
    link: [['sense:sight', 'key:orb', 'hebb', 0.35], ['sense:smell', 'key:orb', 'hebb', 0.25], ['key:orb', 'feel:energy', 'bad', 0.45], ['key:drop', 'feel:peril', 'bad', 0.5], ['sense:sight', 'key:drop', 'hebb', 0.4]],
    on: ['sense:sight', 'key:orb', 'feel:energy', 'key:drop', 'feel:peril'] },
  { sec: 2.4, day: 9, cap: L('Cada bocado repetido engrosa su sinapsis: la evidencia se acumula.', 'Each repeated bite thickens its synapse: the evidence piles up.'),
    link: [['sense:sight', 'key:berry', 'hebb', 0.85], ['key:berry', 'feel:hunger', 'good', 0.95], ['key:drop', 'feel:speed', 'bad', 0.9], ['sense:smell', 'key:drop', 'hebb', 0.7], ['key:water', 'feel:thirst', 'good', 0.85], ['key:purple', 'feel:thirst', 'good', 0.7], ['key:tree', 'feel:found', 'good', 0.85], ['key:berry', 'feel:found', 'good', 0.4]],
    on: ['sense:sight', 'sense:smell', 'key:berry', 'key:drop', 'key:water', 'feel:hunger', 'feel:speed', 'feel:thirst'] },
  { sec: 2.7, day: 12, cap: L('Con los días la red se vuelve grande: decenas de sinapsis, cada una con su historia.', 'Over the days the network grows large: dozens of synapses, each with its own history.'),
    link: [['sense:memory', 'key:puddle', 'hebb', 0.45], ['sense:memory', 'key:berry', 'hebb', 0.4], ['sense:memory', 'key:drop', 'hebb', 0.35], ['sense:antennae', 'key:orb', 'hebb', 0.3], ['sense:smell', 'key:water', 'hebb', 0.4], ['sense:pressure', 'key:water', 'hebb', 0.3], ['key:crystal', 'feel:energy', 'bad', 0.15], ['key:rock', 'feel:speed', 'bad', 0.3], ['key:rain', 'feel:energy', 'bad', 0.3], ['key:water', 'feel:found', 'good', 0.3], ['key:orb', 'feel:peril', 'bad', 0.25]],
    on: ['sense:memory', 'sense:antennae', 'sense:smell', 'sense:pressure', 'key:puddle', 'key:orb', 'key:rain'] },
  { sec: 3.0, day: 13, cap: L('De noche, dormida en el nido, convierte la evidencia en reglas.', 'At night, asleep in the nest, she turns the evidence into rules.'),
    link: [['sense:memory', 'key:nest', 'hebb', 0.5], ['key:nest', 'place:nest', 'place', 0.6], ['key:drop', 'rule:avoid', 'rule', 0.9], ['key:berry', 'rule:sweet', 'rule', 0.75], ['key:rain', 'rule:shelter', 'rule', 0.7]],
    on: ['key:drop', 'key:berry', 'key:rain', 'rule:avoid', 'rule:sweet', 'rule:shelter'] },
  { sec: 3.3, day: 15, cap: L('Su programa está dañado: le cuesta volver al nido. Revisa «volver al anochecer»… demasiado tarde para ella.', 'Her program is damaged: getting home is hard. She revises “return at dusk”… too late for her.'),
    link: [['sense:memory', 'key:nest', 'hebb', 0.7], ['key:nest', 'rule:dusk', 'rule', 0.8]], on: ['sense:memory', 'key:nest', 'rule:dusk'] },
  { sec: 3.0, cap: L('Muere. Sus sinapsis se van con ella; sus reglas revisadas, no.', 'She dies. Her synapses go with her; her revised rules do not.'),
    inherit: true },
  { sec: 2.6, day: 1, cap: L('Su hija nace con esas cuatro reglas. Evita la gota roja sin probarla nunca.', 'Her daughter is born with those four rules. She avoids the red drop without ever tasting it.'),
    link: [['sense:smell', 'key:drop', 'hebb', 0.35]], on: ['sense:smell', 'key:drop', 'rule:avoid'] },
  { sec: 2.8, cap: L('Se refugia con la primera lluvia y vuelve al nido al anochecer desde su primer día.', 'She takes shelter at the first rain and heads home at dusk from her very first day.'),
    link: [['sense:pressure', 'key:rain', 'hebb', 0.35], ['sense:memory', 'key:nest', 'hebb', 0.4]], on: ['sense:pressure', 'key:rain', 'rule:shelter', 'sense:memory', 'key:nest', 'rule:dusk'] },
  { sec: 3.2, day: 4, cap: L('Lo demás lo aprende en vida y su red vuelve a crecer. Heredar es empezar con ventaja, no saberlo todo.', 'The rest she learns in life, and her network grows again. Inheriting is a head start, not knowing everything.'),
    link: [['sense:sight', 'key:berry', 'hebb', 0.45], ['key:berry', 'feel:hunger', 'good', 0.5], ['sense:sight', 'key:water', 'hebb', 0.4], ['key:water', 'feel:thirst', 'good', 0.45], ['key:water', 'place:water', 'place', 0.5], ['sense:smell', 'key:berry', 'hebb', 0.35]],
    on: ['sense:sight', 'key:berry', 'feel:hunger', 'key:water', 'feel:thirst'] },
];

export function startBrainSim(canvas, caption, meter) {
  const g = canvas.getContext('2d');
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let colors = {};
  const readColors = () => {
    const cs = getComputedStyle(canvas);
    colors = {};
    for (const k of ['--blue', '--leaf', '--warn', '--accent-2', '--violet', '--ink', '--ink-2', '--ink-3', '--bg', '--mono']) {
      colors[k] = cs.getPropertyValue(k).trim();
    }
  };

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || W;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * (H / W) * dpr);
  };

  // State of the life being played.
  let step = -1;
  let stepStart = 0;
  let gen = 1;
  let day = 1;
  let edges = new Map();   // "a|b" → { a, b, kind, w, target, born, inherited }
  let active = new Set();
  let seen = new Set();    // neurons that exist so far
  const at = new Map();    // id → { x, y, born }: where each neuron is drawn, easing to its slot
  let fade = 1;

  const reset = (now) => {
    step = -1; gen = 1; edges = new Map(); active = new Set();
    seen = new Set(BASE_SENSES);
    at.clear();
    next(now);
  };
  const next = (now) => {
    step += 1;
    if (step >= STEPS.length) { reset(now); return; }
    stepStart = now;
    const s = STEPS[step];
    if (s.inherit) {
      gen += 1;
      for (const [id, e] of edges) {
        if (e.kind === 'rule') { e.inherited = true; e.born = now; } else edges.delete(id);
      }
      seen = new Set(BASE_SENSES);
      for (const e of edges.values()) { seen.add(e.a); seen.add(e.b); }
      for (const id of [...at.keys()]) if (!seen.has(id)) at.delete(id);
    }
    if (s.day) day = s.day;
    for (const [a, b, kind, w] of s.link ?? []) {
      const id = `${a}|${b}`;
      const e = edges.get(id);
      if (e) e.target = w;
      else edges.set(id, { a, b, kind, w: 0, target: w, born: now });
      seen.add(a); seen.add(b);
    }
    active = new Set(s.on ?? []);
    if (caption) caption.textContent = s.cap;
    if (meter) {
      const list = [...edges.values()];
      const syn = list.filter((e) => e.kind !== 'rule').length;
      const rules = list.filter((e) => e.kind === 'rule').length;
      const n = seen.size;
      meter.textContent = L(
        `generación ${gen} · día ${day} · ${n} neuronas · ${syn} sinapsis · ${rules} ${rules === 1 ? 'regla' : 'reglas'}`,
        `generation ${gen} · day ${day} · ${n} neurons · ${syn} ${syn === 1 ? 'synapse' : 'synapses'} · ${rules} ${rules === 1 ? 'rule' : 'rules'}`);
    }
  };

  // Each column spreads its living neurons over the height, as the game's
  // panel does; the more she knows, the closer they sit.
  const layout = (now) => {
    const ease = reduced ? 1 : 0.12;
    for (const [col, ids] of Object.entries(COLS)) {
      const live = ids.filter((id) => seen.has(id));
      const gap = Math.min(col === 'sense' ? 64 : 58, (H - TOP - BOTTOM - 12) / Math.max(1, live.length - 1));
      const top = TOP + 10 + (H - TOP - BOTTOM - 12 - gap * (live.length - 1)) / 2;
      live.forEach((id, i) => {
        const y = top + i * gap;
        const p = at.get(id);
        if (!p) at.set(id, { x: X[col], y, born: now });
        else p.y += (y - p.y) * ease;
      });
    }
  };
  const dense = () => Math.max(...Object.values(COLS).map((ids) => ids.filter((id) => seen.has(id)).length)) > 9;

  const curve = (a, b) => { const mx = (a.x + b.x) / 2; return [a.x, a.y, mx, a.y, mx, b.y, b.x, b.y]; };
  const point = (c, u) => {
    const v = 1 - u;
    return [
      v * v * v * c[0] + 3 * v * v * u * c[2] + 3 * v * u * u * c[4] + u * u * u * c[6],
      v * v * v * c[1] + 3 * v * v * u * c[3] + 3 * v * u * u * c[5] + u * u * u * c[7],
    ];
  };

  const draw = (now) => {
    const t = now / 1000;
    const k = canvas.width / W;
    g.setTransform(k, 0, 0, k, 0, 0);
    g.clearRect(0, 0, W, H);
    const font = colors['--mono'] || 'monospace';
    layout(now);
    const small = dense();
    const r = small ? 5 : 6.5;

    // column headings
    g.font = `10px ${font}`;
    g.fillStyle = colors['--ink-3'];
    g.textAlign = 'center';
    g.fillText(L('SENTIDOS', 'SENSES'), X.sense, 14);
    g.fillText(L('CONCEPTOS', 'CONCEPTS'), X.key, 14);
    g.textAlign = 'left';
    g.fillText(L('CUERPO · LUGARES · REGLAS', 'BODY · PLACES · RULES'), X.right - 8, 14);

    g.globalAlpha = fade;
    for (const e of edges.values()) {
      const a = at.get(e.a);
      const b = at.get(e.b);
      if (!a || !b) continue;
      e.w += (e.target - e.w) * (reduced ? 1 : 0.18);
      const c = curve(a, b);
      const age = (now - e.born) / 1000;
      const color = colors[EDGE_COLOR[e.kind]];
      if (age < 1.2) {
        g.beginPath(); g.moveTo(c[0], c[1]); g.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
        g.strokeStyle = color; g.globalAlpha = fade * 0.25 * (1 - age / 1.2); g.lineWidth = 8; g.stroke();
      }
      g.beginPath(); g.moveTo(c[0], c[1]); g.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
      g.strokeStyle = color;
      g.globalAlpha = fade * (0.25 + 0.65 * e.w);
      g.lineWidth = 0.7 + e.w * 3;
      g.setLineDash(e.kind === 'place' ? [4, 3] : []);
      g.stroke();
      g.setLineDash([]);
      g.globalAlpha = fade;
      if (!reduced && active.has(e.a) && active.has(e.b)) {
        for (let j = 0; j < 2; j++) {
          const [px, py] = point(c, (t * (0.9 + e.w * 0.9) + j * 0.5) % 1);
          g.beginPath(); g.arc(px, py, 2.2, 0, Math.PI * 2);
          g.fillStyle = color; g.fill();
        }
      }
      if (e.inherited) {
        const [px, py] = point(c, 0.5);
        g.font = `9px ${font}`; g.textAlign = 'center';
        g.fillStyle = colors['--violet'];
        g.fillText(L('heredada', 'inherited'), px, py - 6);
      }
    }

    for (const [id, p] of at) {
      const n = NODES[id];
      const on = active.has(id);
      const color = colors[n.color];
      const appear = reduced ? 1 : Math.min(1, (now - p.born) / 200);
      g.globalAlpha = fade * appear;
      if (on) {
        g.beginPath(); g.arc(p.x, p.y, r + 5 + (reduced ? 0 : Math.sin(t * 8) * 1.5), 0, Math.PI * 2);
        g.fillStyle = color; g.globalAlpha = fade * appear * 0.2; g.fill(); g.globalAlpha = fade * appear;
      }
      g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI * 2);
      g.fillStyle = colors['--bg']; g.fill();
      g.lineWidth = 2; g.strokeStyle = color; g.stroke();
      g.font = `${on ? 'bold ' : ''}${small ? 10 : 11}px ${font}`;
      g.fillStyle = on ? colors['--ink'] : colors['--ink-2'];
      if (n.col === 'sense') { g.textAlign = 'right'; g.fillText(n.label, p.x - r - 6, p.y + 4); }
      else if (n.col === 'key') { g.textAlign = 'center'; g.fillText(n.label, p.x, p.y - r - 5); }
      else { g.textAlign = 'left'; g.fillText(n.label, p.x + r + 6, p.y + 4); }
    }
    g.globalAlpha = 1;
  };

  let visible = true;
  let raf = 0;
  const frame = (now) => {
    raf = 0;
    if (!visible) return;
    if (step < 0) reset(now);
    const s = STEPS[step];
    const elapsed = (now - stepStart) / 1000;
    // fade out at the end of the last step and back in at the start of a life
    fade = step === STEPS.length - 1 ? Math.max(0, Math.min(1, (s.sec - elapsed) / 0.6))
      : step === 0 ? Math.min(1, elapsed / 0.2) : 1;
    if (elapsed > s.sec) next(now);
    draw(now);
    raf = requestAnimationFrame(frame);
  };

  readColors();
  resize();
  new ResizeObserver(() => { resize(); if (step >= 0) draw(performance.now()); }).observe(canvas);
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', readColors);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) {
      // replay the current step from its start rather than skip it
      if (step >= 0) stepStart = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }).observe(canvas);
}
