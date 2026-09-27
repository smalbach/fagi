// 6. Red neuronal — neuronas en tres capas, como un cerebro de verdad:
// sentidos → conceptos → lo que el cuerpo sintió, los sitios que recuerda y
// las reglas escritas. Cada línea es una sinapsis; su grosor, la fuerza. Las
// que acaban de formarse brillan; por las que están activas ahora corre la señal.

import { specOf, TREE } from '../config.js';
import { labelOf, t } from '../i18n.js';
import { VERDE, ROJO, MORADO, TEXTO, DIM, SENTIDO } from './paleta.js';
import { claveDeIntencion, pesoDe } from './lectura.js';

export function pintarRed(pinceles, fagi, y) {
  const { g, s, texto, ancho, chip, cabecera } = pinceles;
  const { W, pad, lineH } = pinceles.medidas();
  const ahora = fagi.age ?? 0;
  const th = fagi.thought ?? {};
  const syn = Object.values(fagi.brain.synapses ?? {});
  const places = fagi.brain.places ?? {};
  const reglas = fagi.brain.rules.list.filter((r) => !r.retired);
  const ganadora = claveDeIntencion(fagi);

  cabecera(6, t('brainmap.sec.network'), y, W, pad);
  y += 16 * s;

  // Qué neuronas existen: las que tienen alguna conexión o alguna creencia.
  // Antenas y presión solo aparecen cuando ya han conectado con algo.
  const sentidos = ['vista', 'olfato', 'memoria'];
  for (const k of ['antenas', 'presion']) {
    if (syn.some((x) => x.a === `sense:${k}`)) sentidos.push(k);
  }
  const conceptos = new Set(Object.keys(fagi.brain.facts));
  const derecha = [];   // { id, label, color, kind }
  const vistoDer = new Set();
  for (const x of syn) {
    if (x.a.startsWith('key:')) conceptos.add(x.a.slice(4));
    if (x.b.startsWith('key:')) conceptos.add(x.b.slice(4));
    if (x.b.startsWith('feel:') && !vistoDer.has(x.b)) {
      vistoDer.add(x.b);
      derecha.push({ id: x.b, label: t(`brainmap.feel.${x.b.slice(5)}`), color: DIM, kind: 'feel' });
    }
  }
  const conceptoDeSitio = (k) => (k === 'foodSource' ? TREE.fruit : k);
  for (const k of Object.keys(places)) {
    conceptos.add(conceptoDeSitio(k));
    derecha.push({ id: `place:${k}`, label: t('brainmap.place', { what: labelOf(k === 'foodSource' ? 'arbol' : k) }), color: '#e8a33d', kind: 'place' });
  }
  for (const r of reglas) {
    conceptos.add(r.when.key);
    derecha.push({ id: `rule:${r.id}`, label: r.id, color: r.verdict === 'avoid' ? ROJO : VERDE, kind: 'rule' });
  }
  const listaC = [...conceptos];

  if (!syn.length && !listaC.length) {
    texto(t('brainmap.noNetwork'), pad, y + 4 * s, { size: 9.5, color: DIM });
    return y + lineH * 1.5;
  }

  const paso = 30 * s;
  const n = Math.max(sentidos.length, listaC.length, derecha.length);
  const alto = n * paso;
  const x1 = pad + 62 * s;
  const x2 = W * 0.45;
  const x3 = W - pad - Math.min(130 * s, W * 0.3);
  const yCol = (i, total) => y + (alto - total * paso) / 2 + (i + 0.5) * paso;

  const pos = {};
  sentidos.forEach((k, i) => { pos[`sense:${k}`] = { x: x1, y: yCol(i, sentidos.length) }; });
  listaC.forEach((k, i) => { pos[`key:${k}`] = { x: x2, y: yCol(i, listaC.length) }; });
  derecha.forEach((d, i) => { pos[d.id] = { x: x3, y: yCol(i, derecha.length) }; });

  // Qué está disparando ahora mismo.
  const activas = new Set();
  for (const c of th.ranked ?? []) { activas.add(`sense:${c.via}`); activas.add(`key:${c.key}`); }
  if (fagi.probing) activas.add('sense:antenas');
  if (fagi.pressure > 0) activas.add('sense:presion');
  if (ganadora) activas.add(`key:${ganadora}`);
  const ep = fagi.lastEpisode;
  const sintiendo = ep && ahora - (ep.at ?? -99) < 6;
  if (sintiendo) {
    activas.add(`key:${ep.key}`);
    for (const x of ep.sensations ?? []) activas.add(`feel:${x.sense}`);
  }

  // Todas las conexiones a dibujar, las derivadas incluidas.
  const aristas = syn.map((x) => ({ a: x.a, b: x.b, w: x.w, kind: x.kind, born: x.born }));
  for (const [k, p] of Object.entries(places)) {
    aristas.push({ a: `key:${conceptoDeSitio(k)}`, b: `place:${k}`, w: p.confidence ?? 0.5, kind: 'place', born: p.born ?? -99 });
  }
  for (const r of reglas) {
    aristas.push({ a: `key:${r.when.key}`, b: `rule:${r.id}`, w: Math.min(1, Math.abs(r.weight ?? 0.6) + 0.3), kind: 'rule', born: r.revisedAt ?? r.learnedAt ?? -99 });
  }

  const colorArista = (e) => (e.kind === 'hebb' ? '#6fa8dc'
    : e.kind === 'feel' ? (e.w >= 0 ? VERDE : ROJO)
      : e.kind === 'place' ? '#e8a33d' : MORADO);
  const curva = (a, b) => {
    const mx = (a.x + b.x) / 2;
    return [a.x, a.y, mx, a.y, mx, b.y, b.x, b.y];
  };
  const punto = (c, u) => {
    const [ax, ay, c1x, c1y, c2x, c2y, bx, by] = c;
    const v = 1 - u;
    return [
      v * v * v * ax + 3 * v * v * u * c1x + 3 * v * u * u * c2x + u * u * u * bx,
      v * v * v * ay + 3 * v * v * u * c1y + 3 * v * u * u * c2y + u * u * u * by,
    ];
  };

  let nueva = null;
  const reloj = performance.now() / 1000;
  for (const e of aristas) {
    const a = pos[e.a];
    const b = pos[e.b];
    if (!a || !b) continue;
    const c = curva(a, b);
    const fuerza = Math.min(1, Math.abs(e.w));
    const edad = ahora - (e.born ?? -99);
    // recién formada: un halo que se apaga en unos segundos
    if (edad >= 0 && edad < 4) {
      g.beginPath();
      g.moveTo(c[0], c[1]);
      g.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
      g.strokeStyle = '#ffffff';
      g.globalAlpha = 0.5 * (1 - edad / 4);
      g.lineWidth = (4 + fuerza * 4) * s;
      g.stroke();
      if (!nueva || edad < nueva.edad) nueva = { edad, c };
    }
    g.beginPath();
    g.moveTo(c[0], c[1]);
    g.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
    g.strokeStyle = colorArista(e);
    g.globalAlpha = 0.25 + 0.7 * fuerza;
    g.lineWidth = (0.6 + fuerza * 3.2) * s;
    if (e.kind === 'place') g.setLineDash([4 * s, 3 * s]);
    g.stroke();
    g.setLineDash([]);
    g.globalAlpha = 1;
    // la señal que corre por las sinapsis activas
    if (activas.has(e.a) && activas.has(e.b) || (e.a === `key:${ganadora}` && e.kind !== 'hebb')) {
      for (let k = 0; k < 2; k++) {
        const u = ((reloj * (0.5 + fuerza * 0.6)) + k * 0.5 + (e.a.length % 7) / 7) % 1;
        const [px, py] = punto(c, u);
        g.beginPath();
        g.arc(px, py, 2.2 * s, 0, Math.PI * 2);
        g.fillStyle = '#ffffff';
        g.fill();
      }
    }
  }

  // Las neuronas, encima de sus conexiones.
  const neurona = (id, color, label, lado, anillo = null) => {
    const p = pos[id];
    if (!p) return;
    const activa = activas.has(id);
    if (activa) {
      g.beginPath();
      g.arc(p.x, p.y, 11 * s + Math.sin(reloj * 6) * 1.5 * s, 0, Math.PI * 2);
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
    if (anillo) {
      g.beginPath();
      g.arc(p.x, p.y, 3 * s, 0, Math.PI * 2);
      g.fillStyle = anillo;
      g.fill();
    }
    const lx = lado === 'izq' ? p.x - 11 * s : p.x + 11 * s;
    const maxW = lado === 'izq' ? p.x - pad - 11 * s : lado === 'der' ? W - pad - lx : (x3 - x2) / 2 - 14 * s;
    texto(label, lx, lado === 'centro' ? p.y - 11 * s : p.y,
      { size: 9, color: activa ? TEXTO : DIM, align: lado === 'izq' ? 'right' : 'left', bold: activa, maxW });
  };
  for (const k of sentidos) neurona(`sense:${k}`, '#6fa8dc', t(`word.${SENTIDO[k]}`), 'izq');
  for (const k of listaC) {
    const r = fagi.brain.facts[k];
    const valor = r ? (pesoDe(r) > 0.05 ? VERDE : pesoDe(r) < -0.05 ? ROJO : null) : null;
    neurona(`key:${k}`, specOf(k)?.color ?? DIM, labelOf(k), 'centro', valor);
  }
  for (const d of derecha) neurona(d.id, d.kind === 'feel' ? '#c7cbd6' : d.color, d.label, 'der');

  if (nueva) {
    const [px, py] = punto(nueva.c, 0.5);
    chip(t('brainmap.newSynapse'), px - 30 * s, py - 12 * s, '#ffffff', { size: 8, filled: true, bold: true });
  }

  y += alto + 12 * s;
  // Leyenda
  const marcas = [
    ['#6fa8dc', t('brainmap.leg.hebb')],
    [VERDE, t('brainmap.leg.good')],
    [ROJO, t('brainmap.leg.bad')],
    ['#e8a33d', t('brainmap.leg.place')],
    [MORADO, t('brainmap.leg.rule')],
  ];
  let x = pad;
  for (const [c, txt] of marcas) {
    const w = 16 * s + ancho(txt, 8.5) + 10 * s;
    if (x > pad && x + w > W - pad) { x = pad; y += 13 * s; }
    g.strokeStyle = c;
    g.lineWidth = 2.5 * s;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 12 * s, y); g.stroke();
    texto(txt, x + 16 * s, y, { size: 8.5, color: DIM });
    x += w;
  }
  y += 14 * s;
  texto(t('brainmap.leg.how'), pad, y, { size: 8.5, color: DIM, maxW: W - pad * 2 });
  return y + lineH;
}
