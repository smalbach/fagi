// 6. Red neuronal — neuronas en tres capas, como un cerebro de verdad:
// sentidos → conceptos → lo que el cuerpo sintió, los sitios que recuerda y
// las reglas escritas. Cada línea es una sinapsis; su grosor, la fuerza. Las
// que acaban de formarse brillan; por las que están activas ahora corre la señal.

import { specOf, TREE } from '../config.js';
import { labelOf, t } from '../i18n.js';
import { GREEN, RED, PURPLE, TEXT, DIM, SENSE } from './palette.js';
import { intentionKey, weightOf } from './reading.js';

export function paintNetwork(brushes, fagi, y) {
  const { g, s, text, width, chip, header } = brushes;
  const { W, pad, lineH } = brushes.measures();
  const now = fagi.age ?? 0;
  const th = fagi.thought ?? {};
  const syn = Object.values(fagi.brain.synapses ?? {});
  const places = fagi.brain.places ?? {};
  const rules = fagi.brain.rules.list.filter((r) => !r.retired);
  const winner = intentionKey(fagi);

  header(6, t('brainmap.sec.network'), y, W, pad);
  y += 16 * s;

  // Qué neuronas existen: las que tienen alguna conexión o alguna creencia.
  // Antenas y presión solo aparecen cuando ya han conectado con algo.
  const senses = ['sight', 'smell', 'memory'];
  for (const k of ['antennae', 'pressure']) {
    if (syn.some((x) => x.a === `sense:${k}`)) senses.push(k);
  }
  const concepts = new Set(Object.keys(fagi.brain.facts));
  const right = [];   // { id, label, color, kind }
  const seenRight = new Set();
  for (const x of syn) {
    if (x.a.startsWith('key:')) concepts.add(x.a.slice(4));
    if (x.b.startsWith('key:')) concepts.add(x.b.slice(4));
    if (x.b.startsWith('feel:') && !seenRight.has(x.b)) {
      seenRight.add(x.b);
      right.push({ id: x.b, label: t(`brainmap.feel.${x.b.slice(5)}`), color: DIM, kind: 'feel' });
    }
  }
  const placeConcept = (k) => (k === 'foodSource' ? TREE.fruit : k);
  for (const k of Object.keys(places)) {
    concepts.add(placeConcept(k));
    right.push({ id: `place:${k}`, label: t('brainmap.place', { what: labelOf(k === 'foodSource' ? 'tree' : k) }), color: '#e8a33d', kind: 'place' });
  }
  for (const r of rules) {
    concepts.add(r.when.key);
    right.push({ id: `rule:${r.id}`, label: r.id, color: r.verdict === 'avoid' ? RED : GREEN, kind: 'rule' });
  }
  const listC = [...concepts];

  if (!syn.length && !listC.length) {
    text(t('brainmap.noNetwork'), pad, y + 4 * s, { size: 9.5, color: DIM });
    return y + lineH * 1.5;
  }

  const step = 30 * s;
  const n = Math.max(senses.length, listC.length, right.length);
  const tall = n * step;
  const x1 = pad + 62 * s;
  const x2 = W * 0.45;
  const x3 = W - pad - Math.min(130 * s, W * 0.3);
  const yCol = (i, total) => y + (tall - total * step) / 2 + (i + 0.5) * step;

  const pos = {};
  senses.forEach((k, i) => { pos[`sense:${k}`] = { x: x1, y: yCol(i, senses.length) }; });
  listC.forEach((k, i) => { pos[`key:${k}`] = { x: x2, y: yCol(i, listC.length) }; });
  right.forEach((d, i) => { pos[d.id] = { x: x3, y: yCol(i, right.length) }; });

  // Qué está disparando ahora mismo.
  const activeOnes = new Set();
  for (const c of th.ranked ?? []) { activeOnes.add(`sense:${c.via}`); activeOnes.add(`key:${c.key}`); }
  if (fagi.probing) activeOnes.add('sense:antennae');
  if (fagi.pressure > 0) activeOnes.add('sense:pressure');
  if (winner) activeOnes.add(`key:${winner}`);
  const ep = fagi.lastEpisode;
  const feeling = ep && now - (ep.at ?? -99) < 6;
  if (feeling) {
    activeOnes.add(`key:${ep.key}`);
    for (const x of ep.sensations ?? []) activeOnes.add(`feel:${x.sense}`);
  }

  // Todas las conexiones a dibujar, las derivadas incluidas.
  const edges = syn.map((x) => ({ a: x.a, b: x.b, w: x.w, kind: x.kind, born: x.born }));
  for (const [k, p] of Object.entries(places)) {
    edges.push({ a: `key:${placeConcept(k)}`, b: `place:${k}`, w: p.confidence ?? 0.5, kind: 'place', born: p.born ?? -99 });
  }
  for (const r of rules) {
    edges.push({ a: `key:${r.when.key}`, b: `rule:${r.id}`, w: Math.min(1, Math.abs(r.weight ?? 0.6) + 0.3), kind: 'rule', born: r.revisedAt ?? r.learnedAt ?? -99 });
  }

  const edgeColor = (e) => (e.kind === 'hebb' ? '#6fa8dc'
    : e.kind === 'feel' ? (e.w >= 0 ? GREEN : RED)
      : e.kind === 'place' ? '#e8a33d' : PURPLE);
  const curve = (a, b) => {
    const mx = (a.x + b.x) / 2;
    return [a.x, a.y, mx, a.y, mx, b.y, b.x, b.y];
  };
  const point = (c, u) => {
    const [ax, ay, c1x, c1y, c2x, c2y, bx, by] = c;
    const v = 1 - u;
    return [
      v * v * v * ax + 3 * v * v * u * c1x + 3 * v * u * u * c2x + u * u * u * bx,
      v * v * v * ay + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u * u * u * by,
    ];
  };

  let newOne = null;
  const clock = performance.now() / 1000;
  for (const e of edges) {
    const a = pos[e.a];
    const b = pos[e.b];
    if (!a || !b) continue;
    const c = curve(a, b);
    const force = Math.min(1, Math.abs(e.w));
    const age = now - (e.born ?? -99);
    // recién formada: un halo que se apaga en unos segundos
    if (age >= 0 && age < 4) {
      g.beginPath();
      g.moveTo(c[0], c[1]);
      g.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
      g.strokeStyle = '#ffffff';
      g.globalAlpha = 0.5 * (1 - age / 4);
      g.lineWidth = (4 + force * 4) * s;
      g.stroke();
      if (!newOne || age < newOne.age) newOne = { age, c };
    }
    g.beginPath();
    g.moveTo(c[0], c[1]);
    g.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
    g.strokeStyle = edgeColor(e);
    g.globalAlpha = 0.25 + 0.7 * force;
    g.lineWidth = (0.6 + force * 3.2) * s;
    if (e.kind === 'place') g.setLineDash([4 * s, 3 * s]);
    g.stroke();
    g.setLineDash([]);
    g.globalAlpha = 1;
    // la señal que corre por las sinapsis activas
    if (activeOnes.has(e.a) && activeOnes.has(e.b) || (e.a === `key:${winner}` && e.kind !== 'hebb')) {
      for (let k = 0; k < 2; k++) {
        const u = ((clock * (0.5 + force * 0.6)) + k * 0.5 + (e.a.length % 7) / 7) % 1;
        const [px, py] = point(c, u);
        g.beginPath();
        g.arc(px, py, 2.2 * s, 0, Math.PI * 2);
        g.fillStyle = '#ffffff';
        g.fill();
      }
    }
  }

  // Las neuronas, encima de sus conexiones.
  const neuron = (id, color, label, sideOf, ring = null) => {
    const p = pos[id];
    if (!p) return;
    const activeOne = activeOnes.has(id);
    if (activeOne) {
      g.beginPath();
      g.arc(p.x, p.y, 11 * s + Math.sin(clock * 6) * 1.5 * s, 0, Math.PI * 2);
      g.fillStyle = color;
      g.globalAlpha = 0.18;
      g.fill();
      g.globalAlpha = 1;
    }
    g.beginPath();
    g.arc(p.x, p.y, 6.5 * s, 0, Math.PI * 2);
    g.fillStyle = '#161922';
    g.fill();
    g.lineWidth = 2 * s;
    g.strokeStyle = color;
    g.stroke();
    if (ring) {
      g.beginPath();
      g.arc(p.x, p.y, 3 * s, 0, Math.PI * 2);
      g.fillStyle = ring;
      g.fill();
    }
    const lx = sideOf === 'izq' ? p.x - 11 * s : p.x + 11 * s;
    const maxW = sideOf === 'izq' ? p.x - pad - 11 * s : sideOf === 'der' ? W - pad - lx : (x3 - x2) / 2 - 14 * s;
    text(label, lx, sideOf === 'centro' ? p.y - 11 * s : p.y,
      { size: 9, color: activeOne ? TEXT : DIM, align: sideOf === 'izq' ? 'right' : 'left', bold: activeOne, maxW });
  };
  for (const k of senses) neuron(`sense:${k}`, '#6fa8dc', t(`word.${SENSE[k]}`), 'izq');
  for (const k of listC) {
    const r = fagi.brain.facts[k];
    const value = r ? (weightOf(r) > 0.05 ? GREEN : weightOf(r) < -0.05 ? RED : null) : null;
    neuron(`key:${k}`, specOf(k)?.color ?? DIM, labelOf(k), 'centro', value);
  }
  for (const d of right) neuron(d.id, d.kind === 'feel' ? '#c7cbd6' : d.color, d.label, 'der');

  if (newOne) {
    const [px, py] = point(newOne.c, 0.5);
    chip(t('brainmap.newSynapse'), px - 30 * s, py - 12 * s, '#ffffff', { size: 8, filled: true, bold: true });
  }

  y += tall + 12 * s;
  // Leyenda
  const marksOf = [
    ['#6fa8dc', t('brainmap.leg.hebb')],
    [GREEN, t('brainmap.leg.good')],
    [RED, t('brainmap.leg.bad')],
    ['#e8a33d', t('brainmap.leg.place')],
    [PURPLE, t('brainmap.leg.rule')],
  ];
  let x = pad;
  for (const [c, txt] of marksOf) {
    const w = 16 * s + width(txt, 8.5) + 10 * s;
    if (x > pad && x + w > W - pad) { x = pad; y += 13 * s; }
    g.strokeStyle = c;
    g.lineWidth = 2.5 * s;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 12 * s, y); g.stroke();
    text(txt, x + 16 * s, y, { size: 8.5, color: DIM });
    x += w;
  }
  y += 14 * s;
  text(t('brainmap.leg.how'), pad, y, { size: 8.5, color: DIM, maxW: W - pad * 2 });
  return y + lineH;
}
