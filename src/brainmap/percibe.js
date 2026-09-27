// 2. Percibe y puntúa · Recuerda.
//
//   Percibe   — lo que ve, huele o recuerda, con su puntuación desglosada
//     y puntúa  (creencia + curiosidad + necesidad + distancia) frente al
//               mínimo que hace falta para moverse.
//   Recuerda  — la memoria aprendida de cada cosa: su peso frente a los
//               umbrales que la convierten en regla, cuánto se fía, en qué
//               etapa está (corta, media, larga) y la regla escrita si la hay.

import { specOf, BRAIN, LEARN } from '../config.js';
import { labelOf, t } from '../i18n.js';
import { VERDE, ROJO, AMARILLO, MORADO, TEXTO, DIM, FONDO_FILA, SENTIDO } from './paleta.js';
import { claveDeIntencion, reglaDe, pesoDe, signo } from './lectura.js';

const COLOR_PARTE = {
  creencia: MORADO, curiosidad: AMARILLO, necesidad: ROJO, distancia: '#7f869a', olfato: '#e8a33d',
};
const CLAVE_PARTE = { creencia: 'belief', curiosidad: 'curiosity', necesidad: 'need', distancia: 'distance', olfato: 'smell' };
const ETAPAS = ['corta', 'media', 'larga'];
const MAX_CANDIDATOS = 6;

export function pintarPercibe(pinceles, fagi, y) {
  const { s, texto, cabecera } = pinceles;
  const { W, pad, lineH } = pinceles.medidas();
  const th = fagi.thought ?? {};

  y += 4 * s;
  // Ancho de sobra: percibe a la izquierda y memoria a la derecha, unidas
  // por líneas. Panel estrecho: una columna, la memoria debajo.
  const dosCol = W >= 460;
  const colL = pad;
  const colW = dosCol ? (W - pad * 2 - 22 * s) / 2 : W - pad * 2;
  const colR = dosCol ? W - pad - colW : pad;
  cabecera(2, t('brainmap.sec.perceive'), y, dosCol ? colL + colW + 11 * s : W, pad);
  if (dosCol) texto(t('brainmap.sec.memory').toUpperCase(), colR, y, { size: 9, color: DIM, bold: true, maxW: colW });
  y += 12 * s;

  const ranked = (th.ranked ?? []).slice(0, MAX_CANDIDATOS);
  const claves = Object.keys(fagi.brain.facts);
  const rowH = 46 * s;
  const filasL = Math.max(ranked.length, 1);
  const y0 = y;
  // Dónde empieza la memoria: al lado, o debajo de lo percibido con su cabecera.
  const y0R = dosCol ? y0 : y0 + filasL * rowH + 20 * s;
  // Dónde cae cada columna: lo comparten las filas y las líneas que las unen.
  const rejilla = { dosCol, colL, colW, colR, rowH, y0, y0R, pad, ganadora: claveDeIntencion(fagi) };

  const posCand = pintarCandidatos(pinceles, fagi, th, ranked, rejilla);
  const posCree = pintarCreencias(pinceles, fagi, claves, rejilla);
  unir(pinceles, posCand, posCree, rejilla);

  y = Math.max(y0 + filasL * rowH, y0R + Math.max(claves.length, 1) * rowH) + 9 * s;
  y = leyenda(pinceles, y, colL, W, pad);
  return y + lineH;
}

// Lo percibido: una fila por candidato, con la suma de su puntuación.
function pintarCandidatos(pinceles, fagi, th, ranked, { colL, colW, rowH, y0, ganadora }) {
  const { g, s, texto, caja, chip } = pinceles;
  const nuevas = new Set(th.news ?? []);
  const yFila = (i) => y0 + i * rowH;

  // Hasta dónde llega una puntuación: la escala común a todas las barras.
  const maxPos = Math.max(2.5, ...ranked.map((c) => Object.values(c.parts ?? {}).reduce((a, v) => a + Math.max(0, v), 0)));
  const maxNeg = Math.max(0.8, ...ranked.map((c) => -Object.values(c.parts ?? {}).reduce((a, v) => a + Math.min(0, v), 0)));

  const posCand = [];
  let ganadorMarcado = false;
  ranked.forEach((c, i) => {
    const yy = yFila(i);
    const color = specOf(c.key)?.color ?? DIM;
    // En vivo se sabe a qué objeto va; en una repetición, solo de qué tipo.
    const esSuyo = c.ref && fagi.target ? c.ref === fagi.target : c.key === ganadora;
    const gana = !ganadorMarcado && esSuyo && (c.score ?? 0) > BRAIN.minScore;
    if (gana) ganadorMarcado = true;
    caja(colL, yy + 2 * s, colW, rowH - 5 * s, 5 * s, gana ? '#262b38' : FONDO_FILA, gana ? '#e6e8ee' : null, 1.2);

    // línea 1: qué es, si es nuevo, cuánto puntúa
    g.beginPath();
    g.arc(colL + 10 * s, yy + 12 * s, 4 * s, 0, Math.PI * 2);
    g.fillStyle = color;
    g.fill();
    let x = colL + 18 * s;
    x += texto(labelOf(c.key), x, yy + 12 * s, { bold: gana, maxW: colW * 0.45 }) + 5 * s;
    if (nuevas.has(c.key)) chip(t('brainmap.new'), x, yy + 12 * s, AMARILLO, { filled: true, size: 8 });
    const pasa = (c.score ?? 0) > BRAIN.minScore;
    texto((c.score ?? 0).toFixed(2), colL + colW - 6 * s, yy + 12 * s,
      { align: 'right', bold: true, color: pasa ? TEXTO : DIM });

    // línea 2: la suma, parte a parte, frente al mínimo
    const bx = colL + 8 * s;
    const bw = colW - 16 * s;
    const cero = bx + bw * (maxNeg / (maxNeg + maxPos));
    const k = bw / (maxNeg + maxPos);
    const by = yy + 22 * s;
    const bh = 7 * s;
    caja(bx, by, bw, bh, 2, '#252934');
    let pos = cero;
    let neg = cero;
    for (const [parte, v] of Object.entries(c.parts ?? {})) {
      if (!v) continue;
      const w = Math.abs(v) * k;
      g.fillStyle = COLOR_PARTE[parte] ?? DIM;
      if (v > 0) { g.fillRect(pos, by, w, bh); pos += w; } else { neg -= w; g.fillRect(neg, by, w, bh); }
    }
    g.fillStyle = '#e6e8ee';
    g.fillRect(cero + BRAIN.minScore * k - 0.75, by - 2 * s, 1.5, bh + 4 * s);   // el mínimo
    g.fillStyle = '#10131a';
    g.fillRect(cero - 0.5, by, 1, bh);

    // línea 3: por qué sentido y a qué distancia
    const sentido = t(`word.${SENTIDO[c.via] ?? 'eye'}`);
    texto(`${sentido} · ${Math.round(c.dist ?? 0)}px`, bx, yy + 36 * s, { size: 9, color: DIM, maxW: bw * 0.5 });
    const partes = Object.entries(c.parts ?? {}).filter(([, v]) => Math.abs(v) >= 0.05)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 2)
      .map(([parte, v]) => `${t(`score.${CLAVE_PARTE[parte] ?? parte}`)} ${signo(v, 1)}`).join(' ');
    texto(partes, bx + bw, yy + 36 * s, { size: 9, color: DIM, align: 'right', maxW: bw * 0.55 });

    posCand.push({ key: c.key, x: colL + colW, y: yy + rowH / 2, gana, color });
  });
  if (!ranked.length) texto(t('brainmap.nothingSeen'), colL + 4 * s, y0 + 14 * s, { size: 9.5, color: DIM, maxW: colW });
  return posCand;
}

// Memoria: una fila por creencia.
function pintarCreencias(pinceles, fagi, claves, { dosCol, colR, colW, rowH, y0R, ganadora }) {
  const { g, s, texto, ancho, caja, chip } = pinceles;
  const yFilaR = (i) => y0R + i * rowH;
  const posCree = {};
  const ep = fagi.lastEpisode;
  claves.forEach((key, i) => {
    const r = fagi.brain.facts[key];
    const yy = yFilaR(i);
    const color = specOf(key)?.color ?? DIM;
    const usada = key === ganadora;
    const reciente = ep && ep.key === key;
    caja(colR, yy + 2 * s, colW, rowH - 5 * s, 5 * s, usada ? '#262b38' : FONDO_FILA,
      usada ? '#e6e8ee' : reciente ? MORADO : null, usada ? 1.2 : 1);

    // línea 1: qué, y la regla que ya escribió sobre ello
    g.beginPath();
    g.arc(colR + 10 * s, yy + 12 * s, 3 + r.confidence * 3 * s, 0, Math.PI * 2);
    g.fillStyle = color;
    g.fill();
    texto(labelOf(key), colR + 18 * s, yy + 12 * s, { bold: usada, maxW: colW * 0.5 });
    const regla = reglaDe(fagi.brain.rules, key);
    if (regla) {
      const str = t(`brainmap.verdict.${regla.verdict}`);
      const w = ancho(str, 8, true) + 10 * s;
      chip(str, colR + colW - 5 * s - w, yy + 12 * s, regla.verdict === 'avoid' ? ROJO : VERDE, { filled: true, size: 8, bold: true });
    } else {
      texto(signo(r.value), colR + colW - 6 * s, yy + 12 * s, { size: 9.5, align: 'right', color: DIM });
    }

    // línea 2: el peso (lo que cree × lo que se fía) entre los dos umbrales
    // que lo convierten en regla: evitar a la izquierda, preferir a la derecha.
    const bx = colR + 8 * s;
    const bw = colW - 16 * s;
    const by = yy + 22 * s;
    const bh = 7 * s;
    const mitad = bx + bw / 2;
    const w = pesoDe(r);
    caja(bx, by, bw, bh, 2, '#252934');
    g.fillStyle = w >= 0 ? VERDE : ROJO;
    g.globalAlpha = 0.9;
    if (w >= 0) g.fillRect(mitad, by, (bw / 2) * Math.min(1, w), bh);
    else g.fillRect(mitad + (bw / 2) * Math.max(-1, w), by, (bw / 2) * Math.min(1, -w), bh);
    g.globalAlpha = 1;
    // lo que cree sin descontar la duda: el contorno
    g.strokeStyle = r.value >= 0 ? VERDE : ROJO;
    g.lineWidth = 1;
    g.setLineDash([2, 2]);
    const xv = mitad + (bw / 2) * r.value;
    g.strokeRect(Math.min(mitad, xv), by + 0.5, Math.abs(xv - mitad), bh - 1);
    g.setLineDash([]);
    for (const [umbral, c] of [[-LEARN.avoidFrom, ROJO], [LEARN.preferFrom, VERDE]]) {
      g.fillStyle = c;
      g.fillRect(mitad + (bw / 2) * umbral - 0.75, by - 2 * s, 1.5, bh + 4 * s);
    }
    g.fillStyle = '#10131a';
    g.fillRect(mitad - 0.5, by, 1, bh);

    // línea 3: etapa de memoria (corta → media → larga) y cuánto se fía
    const iEtapa = ETAPAS.indexOf(r.stage);
    const segW = 9 * s;
    for (let e = 0; e < 3; e++) {
      caja(bx + e * (segW + 2 * s), yy + 33 * s, segW, 5 * s, 1.5, e <= iEtapa ? MORADO : '#2e3240');
    }
    texto(t(`stage.${r.stage}`), bx + 3 * (segW + 2 * s) + 3 * s, yy + 36 * s, { size: 9, color: MORADO });
    texto(t('brainmap.beliefMeta', { conf: Math.round(r.confidence * 100), tries: r.tries ?? 0, confirms: r.confirms ?? 0 }),
      bx + bw, yy + 36 * s, { size: 9, color: DIM, align: 'right', maxW: bw * 0.62 });

    posCree[key] = { x: colR, y: yy + rowH / 2 };
  });
  if (!dosCol) texto(t('brainmap.sec.memory').toUpperCase(), colR, y0R - 9 * s, { size: 9, color: DIM, bold: true, maxW: colW });
  if (!claves.length) texto(t('brainmap.noBeliefs'), colR + 4 * s, y0R + 14 * s, { size: 9.5, color: DIM, maxW: colW });
  return posCree;
}

// Lo que percibe consulta lo que cree de eso mismo: la línea que los une.
// En una columna solo se une el ganador, por el margen izquierdo.
function unir(pinceles, posCand, posCree, { dosCol, colL, pad }) {
  const { g } = pinceles;
  for (const c of posCand) {
    const d = posCree[c.key];
    if (!d || (!dosCol && !c.gana)) continue;
    g.beginPath();
    if (dosCol) {
      g.moveTo(c.x, c.y);
      const mx = (c.x + d.x) / 2;
      g.bezierCurveTo(mx, c.y, mx, d.y, d.x, d.y);
    } else {
      g.moveTo(colL, c.y);
      g.bezierCurveTo(colL - pad * 0.8, c.y, colL - pad * 0.8, d.y, colL, d.y);
    }
    g.strokeStyle = c.gana ? '#e6e8ee' : c.color;
    g.lineWidth = c.gana ? 2 : 1;
    g.globalAlpha = c.gana ? 0.9 : 0.35;
    if (c.gana) { g.setLineDash([4, 3]); g.lineDashOffset = -(performance.now() / 45) % 7; }
    g.stroke();
    g.setLineDash([]);
    g.globalAlpha = 1;
  }
}

// Leyenda de las barras, una sola vez, saltando de línea si no cabe.
function leyenda(pinceles, y, colL, W, pad) {
  const { g, s, texto, ancho } = pinceles;
  const marcas = [
    ...Object.entries(COLOR_PARTE).map(([parte, c]) => ({ c, txt: t(`score.${CLAVE_PARTE[parte]}`), caja: true })),
    { c: '#e6e8ee', txt: `${t('brainmap.min')} ${BRAIN.minScore}` },
    { c: [ROJO, VERDE], txt: t('brainmap.thresholds') },
  ];
  let x = colL;
  for (const m of marcas) {
    const w = 9 * s + ancho(m.txt, 8.5) + 8 * s + (Array.isArray(m.c) ? 4 * s : 0);
    if (x > colL && x + w > W - pad) { x = colL; y += 13 * s; }
    if (m.caja) { g.fillStyle = m.c; g.fillRect(x, y - 3 * s, 7 * s, 6 * s); }
    else for (const [j, c] of [].concat(m.c).entries()) { g.fillStyle = c; g.fillRect(x + j * 4 * s, y - 4 * s, 1.5, 8 * s); }
    texto(m.txt, x + 9 * s + (Array.isArray(m.c) ? 4 * s : 0), y, { size: 8.5, color: DIM });
    x += w;
  }
  return y;
}
