// El mapa del cerebro: cómo está pensando Fagi AHORA MISMO, paso a paso, y
// cómo lo que ha aprendido entra en esa cuenta.
//
//   1. Siente    — el cuerpo: hambre, sed, energía y los efectos que lleva.
//   2. Percibe   — lo que ve, huele o recuerda, con su puntuación desglosada
//      y puntúa    (creencia + curiosidad + necesidad + distancia) frente al
//                  mínimo que hace falta para moverse.
//      Recuerda  — la memoria aprendida de cada cosa: su peso frente a los
//                  umbrales que la convierten en regla, cuánto se fía, en qué
//                  etapa está (corta, media, larga) y la regla escrita si la hay.
//   3. Instinto  — los escalones de la directiva de sobrevivir, en orden; el
//                  primero que contesta manda.
//   4. Decide    — la acción, su porqué, y si algo nuevo le hizo replantearse.
//   5. Aprende   — la última experiencia: qué probó, qué sintió, cómo movió
//                  la creencia y qué regla escribió o revisó.
//
// No calcula nada que no esté ya calculado: lee fagi.thought (decision.js),
// fagi.brain (memory.js, learned/) y fagi.lastEpisode (episodes.js). El alto
// del lienzo sale de lo que hay que dibujar; el panel hace scroll.

import { specOf, BRAIN, LEARN, MEMORY, WORLD, EXPLORE, TREE } from './config.js';
import { nestOf } from './world.js';
import { labelOf, t, tx } from './i18n.js';
import { TAG_COLOR, rethinkLine, legLine } from './narrator.js';

const VERDE = '#8fd93d';
const ROJO = '#d95b7e';
const AMARILLO = '#f0c75e';
const MORADO = '#b57bff';
const MUTED = '#3a3f4d';
const TEXTO = '#d9dce4';
const DIM = '#7d8396';
const FONDO_FILA = '#1b1e27';

const SENTIDO = { vista: 'eye', olfato: 'nose', memoria: 'memory' };
const COLOR_PARTE = {
  creencia: MORADO, curiosidad: AMARILLO, necesidad: ROJO, distancia: '#7f869a', olfato: '#e8a33d',
};
const CLAVE_PARTE = { creencia: 'belief', curiosidad: 'curiosity', necesidad: 'need', distancia: 'distance', olfato: 'smell' };
const ESCALONES = ['survive', 'endure', 'provide', 'clues', 'explore'];
const ETAPAS = ['corta', 'media', 'larga'];
const MAX_CANDIDATOS = 6;

// La clave detrás de lo que Fagi está haciendo ahora, si hay alguna: la de su
// objetivo actual (comida o agua), o si no, la del rastro que sigue de olfato.
function claveDeIntencion(fagi) {
  if (fagi.target?.type && (fagi.targetKind === 'food' || fagi.targetKind === 'water')) return fagi.target.type;
  if (fagi.targetKind === 'water') return 'agua';
  if (fagi.trailKey) return fagi.trailKey;
  return null;
}

function reglaDe(rules, key) {
  const vivas = rules.list.filter((r) => !r.retired && !rules.quarantined?.has(r.id) && r.when.key === key);
  return vivas.find((r) => r.verdict === 'avoid') ?? vivas.find((r) => r.verdict === 'prefer') ?? null;
}

// Lo mismo que memory.weight, sin crear la creencia si no existe.
function pesoDe(r) {
  return r.value * (MEMORY.floor + (1 - MEMORY.floor) * r.confidence);
}

// El cambio de creencia de un episodio: en vivo cuelga de ep.cambio; en una
// repetición viene ya aplanado (recorder.js).
function cambioDe(ep) {
  if (ep.cambio) return ep.cambio;
  if (ep.kind) return { kind: ep.kind, before: ep.before, after: ep.after };
  return null;
}

function signo(v, d = 2) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(d)}`;
}

export function createBrainMap(canvas, statusEl, expandBtn) {
  if (!canvas) return { update() {} };
  const g = canvas.getContext('2d');
  let cssW = 0;
  let cssH = 0;
  let dpr = 1;

  // El ancho lo pone el panel; el alto, lo que haya que dibujar.
  function ajustar(alto) {
    const ancho = canvas.getBoundingClientRect().width;
    if (ancho === cssW && alto === cssH) return false;
    cssW = ancho;
    cssH = alto;
    canvas.style.height = `${alto}px`;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    return true;
  }

  // Ampliar: el panel entero pasa a ocupar casi toda la pantalla.
  const pane = canvas.closest('.pane');
  function grande(si) {
    pane?.classList.toggle('brainmap-big', si);
    if (!expandBtn) return;
    expandBtn.dataset.i18n = si ? 'brainmap.close' : 'brainmap.expand';   // bindDom lo retraduce
    expandBtn.textContent = t(expandBtn.dataset.i18n);
  }
  function cerrarGrande() { if (pane?.classList.contains('brainmap-big')) grande(false); }
  expandBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    grande(!pane?.classList.contains('brainmap-big'));
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarGrande(); });

  function estado(fagi) {
    if (!statusEl) return;
    const activas = fagi.brain.rules.list.filter((r) => !r.retired);
    const retiradas = fagi.brain.rules.list.filter((r) => r.retired);
    statusEl.textContent = t('brainmap.status', {
      beliefs: Object.keys(fagi.brain.facts).length,
      active: activas.length,
      retired: retiradas.length,
      events: fagi.brain.lastRule?.n ?? 0,
    });
  }

  let mundo = null;
  const todo = (fagi) => pintarMapaMental(fagi, pintarRed(fagi, pintar(fagi)));

  function update(fagi, world = null) {
    mundo = world;
    estado(fagi);
    if (!canvas.getBoundingClientRect().width) return;   // panel plegado u oculto
    if (cssW === 0) ajustar(200);
    const alto = todo(fagi);
    // El alto cambió (más creencias, más neuronas): redimensionar borra el
    // lienzo, así que se vuelve a pintar en el mismo fotograma.
    if (ajustar(Math.ceil(alto))) todo(fagi);
  }

  // ---------- pinceles ----------
  let s = 1;   // escala de letra: el panel ampliado se lee de lejos
  const font = (px, bold = false) => `${bold ? '600 ' : ''}${(px * s).toFixed(1)}px ui-monospace, SFMono-Regular, Menlo, monospace`;

  function texto(str, x, y, { size = 10.5, color = TEXTO, align = 'left', bold = false, maxW = 0 } = {}) {
    g.font = font(size, bold);
    g.fillStyle = color;
    g.textAlign = align;
    g.textBaseline = 'middle';
    let txt = String(str ?? '');
    if (maxW > 0 && g.measureText(txt).width > maxW) {
      while (txt.length > 1 && g.measureText(`${txt}…`).width > maxW) txt = txt.slice(0, -1);
      txt += '…';
    }
    g.fillText(txt, x, y);
    return g.measureText(txt).width;
  }

  function ancho(str, size = 10.5, bold = false) {
    g.font = font(size, bold);
    return g.measureText(String(str)).width;
  }

  function caja(x, y, w, h, r, fill, stroke, lw = 1) {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  }

  // Una etiqueta con fondo. Devuelve su ancho.
  function chip(str, x, y, color, { filled = false, size = 9.5, bold = false, dim = false } = {}) {
    const w = ancho(str, size, bold) + 10 * s;
    const h = 15 * s;
    g.globalAlpha = dim ? 0.45 : 1;
    caja(x, y - h / 2, w, h, 4 * s, filled ? color : '#20242e', filled ? null : color, 1);
    texto(str, x + 5 * s, y, { size, color: filled ? '#10131a' : color, bold });
    g.globalAlpha = 1;
    return w;
  }

  // Varias etiquetas unidas por flechas, saltando de línea si no caben.
  function cadena(items, x0, y0, maxX, lineH) {
    let x = x0;
    let y = y0;
    items.forEach((it, i) => {
      const w = ancho(it.text, 9.5, it.bold) + 10 * s;
      const flecha = i > 0 ? ancho(' → ', 9.5) : 0;
      if (i > 0 && x + flecha + w > maxX) { x = x0; y += lineH; }
      else if (i > 0) { texto('→', x + flecha / 2, y, { color: DIM, align: 'center' }); x += flecha; }
      x += chip(it.text, x, y, it.color, { filled: it.filled, bold: it.bold });
    });
    return y;
  }

  function cabecera(n, titulo, y, W, pad) {
    texto(`${n} · ${titulo.toUpperCase()}`, pad, y, { size: 9, color: DIM, bold: true });
    const w = ancho(`${n} · ${titulo.toUpperCase()}`, 9, true);
    g.beginPath();
    g.moveTo(pad + w + 6 * s, y);
    g.lineTo(W - pad, y);
    g.strokeStyle = '#262a35';
    g.lineWidth = 1;
    g.stroke();
  }

  function barra(x, y, w, h, frac, color) {
    caja(x, y, w, h, h / 2, '#2a2e3a');
    if (frac > 0) caja(x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2, color);
  }

  // ---------- el dibujo ----------
  function pintar(fagi) {
    const W = cssW;
    s = Math.max(0.95, Math.min(1.6, W / 380));
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, cssH);
    g.lineCap = 'round';

    const th = fagi.thought ?? {};
    const pad = 10 * s;
    const gap = 6 * s;
    const lineH = 19 * s;
    let y = 12 * s;

    // ===== 1. siente =====
    cabecera(1, t('brainmap.sec.body'), y, W, pad);
    y += 16 * s;
    const medidores = [
      ['stat.hunger', th.hungerU ?? 0, ROJO],
      ['stat.thirst', th.thirstU ?? 0, '#3d8fd9'],
      ['stat.energy', th.energyU ?? 1, VERDE],
    ];
    const wMed = (W - pad * 2 - gap * 2) / 3;
    medidores.forEach(([k, v, c], i) => {
      const x = pad + i * (wMed + gap);
      texto(t(k).toLowerCase(), x, y, { size: 9.5, color: DIM });
      texto(`${Math.round(v * 100)}%`, x + wMed, y, { size: 9.5, align: 'right', bold: true });
      barra(x, y + 8 * s, wMed, 5 * s, v, c);
    });
    y += 28 * s;
    {
      let x = pad;
      const efectos = Object.values(fagi.effects ?? {});
      if (fagi.carrying) x += chip(`${t('word.carries')}: ${labelOf(fagi.carrying.type)}`, x, y, '#c9a227') + gap;
      for (const e of efectos) {
        const str = `${t(`sense.${e.stat}`, { v: e.mult })} · ${Math.ceil(e.time)}s`;
        if (x + ancho(str, 9.5) + 10 * s > W - pad) break;
        x += chip(str, x, y, e.color ?? AMARILLO) + gap;
      }
      if (x === pad) texto(t('brainmap.noEffects'), pad, y, { size: 9.5, color: DIM });
      y += lineH;
    }

    // ===== 2. percibe y puntúa · recuerda =====
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
    const ganadora = claveDeIntencion(fagi);
    const nuevas = new Set(th.news ?? []);
    const rowH = 46 * s;
    const filasL = Math.max(ranked.length, 1);
    const y0 = y;
    const yFila = (i) => y0 + i * rowH;
    // Dónde empieza la memoria: al lado, o debajo de lo percibido con su cabecera.
    const y0R = dosCol ? y0 : y0 + filasL * rowH + 20 * s;
    const yFilaR = (i) => y0R + i * rowH;

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
        .map(([p, v]) => `${t(`score.${CLAVE_PARTE[p] ?? p}`)} ${signo(v, 1)}`).join(' ');
      texto(partes, bx + bw, yy + 36 * s, { size: 9, color: DIM, align: 'right', maxW: bw * 0.55 });

      posCand.push({ key: c.key, x: colL + colW, y: yy + rowH / 2, gana, color });
    });
    if (!ranked.length) texto(t('brainmap.nothingSeen'), colL + 4 * s, y0 + 14 * s, { size: 9.5, color: DIM, maxW: colW });

    // Memoria: una fila por creencia.
    const posCree = {};
    const lastRule = fagi.brain.lastRule;
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

    // Lo que percibe consulta lo que cree de eso mismo: la línea que los une.
    // En una columna solo se une el ganador, por el margen izquierdo.
    for (const p of posCand) {
      const d = posCree[p.key];
      if (!d || (!dosCol && !p.gana)) continue;
      g.beginPath();
      if (dosCol) {
        g.moveTo(p.x, p.y);
        const mx = (p.x + d.x) / 2;
        g.bezierCurveTo(mx, p.y, mx, d.y, d.x, d.y);
      } else {
        g.moveTo(colL, p.y);
        g.bezierCurveTo(colL - pad * 0.8, p.y, colL - pad * 0.8, d.y, colL, d.y);
      }
      g.strokeStyle = p.gana ? '#e6e8ee' : p.color;
      g.lineWidth = p.gana ? 2 : 1;
      g.globalAlpha = p.gana ? 0.9 : 0.35;
      if (p.gana) { g.setLineDash([4, 3]); g.lineDashOffset = -(performance.now() / 45) % 7; }
      g.stroke();
      g.setLineDash([]);
      g.globalAlpha = 1;
    }

    y = Math.max(y0 + filasL * rowH, y0R + Math.max(claves.length, 1) * rowH) + 9 * s;
    // Leyenda de las barras, una sola vez, saltando de línea si no cabe.
    {
      const marcas = [
        ...Object.entries(COLOR_PARTE).map(([p, c]) => ({ c, txt: t(`score.${CLAVE_PARTE[p]}`), caja: true })),
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
    }
    y += lineH;

    // ===== 3. instinto =====
    cabecera(3, t('brainmap.sec.instinct'), y, W, pad);
    y += 17 * s;
    {
      const activo = th.tier ?? null;
      const iActivo = ESCALONES.indexOf(activo);
      const colorAccion = TAG_COLOR[th.action] ?? '#7f869a';
      const etiquetas = ESCALONES.map((e, i) => `${i + 1} ${t(`brainmap.tier.${e}`)}`);
      const flecha = ancho('›', 10);
      const total = etiquetas.reduce((a, e) => a + ancho(e, 9.5, true) + 10 * s, 0) + flecha * 4 + 8 * s * 4;
      let x = pad;
      let yy = y;
      etiquetas.forEach((e, i) => {
        const w = ancho(e, 9.5, true) + 10 * s;
        if (total > W - pad * 2 && x + w > W - pad) { x = pad; yy += lineH; }
        chip(e, x, yy, i === iActivo ? colorAccion : DIM,
          { filled: i === iActivo, bold: true, dim: iActivo >= 0 && i > iActivo });
        x += w;
        if (i < etiquetas.length - 1) { texto('›', x + 4 * s + flecha / 2, yy, { color: DIM, align: 'center' }); x += flecha + 8 * s; }
      });
      y = yy + lineH;
      const nombre = th.rule ? t(`brainmap.rule.${th.rule}`) : '—';
      texto(t('brainmap.ruleFired', { rule: nombre }), pad, y, { size: 9.5, color: DIM, maxW: W - pad * 2 });
      y += lineH;
    }

    // ===== 4. decide =====
    cabecera(4, t('brainmap.sec.decide'), y, W, pad);
    y += 18 * s;
    {
      const colorAccion = TAG_COLOR[th.action] ?? '#7f869a';
      let x = pad;
      x += chip(t(`tag.${th.action ?? 'explore'}`), x, y, colorAccion, { filled: true, bold: true }) + gap;
      x += texto(t(`action.${th.action ?? 'explore'}`), x, y, { bold: true, size: 11, maxW: W - pad - x }) + gap;
      if (fagi.directive && x < W - pad - 40 * s) chip(t('brainmap.api'), x, y, '#4cc9f0');
      y += lineH;
      texto(tx(th.reason), pad, y, { size: 9.5, color: TEXTO, maxW: W - pad * 2 });
      y += lineH * 0.9;

      const r = th.rethink ?? fagi.rethink;
      const linea = r ? rethinkLine(r, th) : null;
      if (linea) {
        const xx = pad + chip(t('tag.rethink'), pad, y, AMARILLO, { size: 8.5 }) + gap;
        texto(tx(linea.text), xx, y, { size: 9.5, color: TEXTO, maxW: W - pad - xx });
        y += lineH * 0.85;
        texto(tx(linea.detail), xx, y, { size: 9, color: DIM, maxW: W - pad - xx });
      } else {
        texto(t('brainmap.noNews'), pad, y, { size: 9.5, color: DIM });
        y += lineH * 0.85;
      }
      y += lineH * 0.9;
      if (th.action === 'explore' && fagi.legChoice) {
        const l = legLine(fagi.legChoice);
        texto(`${t('word.leg')} ${fagi.exploreLegs ?? ''} · ${tx(l.text)} · ${tx(l.detail)}`, pad, y,
          { size: 9, color: DIM, maxW: W - pad * 2 });
      } else if (th.action === 'explore') {
        texto(`${t('word.leg')} ${fagi.exploreLegs ?? 0}`, pad, y, { size: 9, color: DIM });
      }
      y += lineH;
    }

    // ===== 5. aprende =====
    cabecera(5, t('brainmap.sec.learn'), y, W, pad);
    y += 18 * s;
    if (!ep) {
      texto(t('brainmap.noEpisode'), pad, y, { size: 9.5, color: DIM });
      y += lineH;
    } else {
      const items = [];
      const color = specOf(ep.key)?.color ?? DIM;
      items.push({ text: t(`brainmap.ep.${ep.action}`, { what: labelOf(ep.key) }), color, bold: true });
      const sens = (ep.sensations ?? []).filter((x) => x.sense !== 'peril' && x.sense !== 'contradiccion')
        .map((x) => t(`sense.${x.sense}`, { v: x.sense === 'hunger' || x.sense === 'thirst' ? signo(x.v, 0) : x.v }));
      if (ep.pending && ep.action === 'drink' && !cambioDe(ep)) {
        items.push({ text: t('brainmap.pending'), color: DIM });
      } else {
        items.push({ text: sens.length ? t('brainmap.felt', { list: sens.join(', ') }) : t('brainmap.feltNothing'), color: TEXTO });
        items.push({ text: t('brainmap.reward', { v: signo(ep.reward ?? 0) }), color: (ep.reward ?? 0) >= 0 ? VERDE : ROJO, filled: true, bold: true });
        if (ep.correction) items.push({ text: t('brainmap.correction', { v: signo(ep.correction) }), color: ROJO, filled: true });
        const cb = cambioDe(ep);
        if (cb?.before && cb?.after) {
          items.push({
            text: `${t('brainmap.belief', { from: signo(cb.before.value), to: signo(cb.after.value) })} · ${t(`brainmap.kind.${cb.kind}`)} · ${t(`stage.${cb.after.stage}`)}`,
            color: MORADO,
          });
        }
        if (ep.pending) items.push({ text: t('brainmap.watching'), color: DIM });
      }
      // La regla que salió de ahí, o cuánto le falta para escribirla.
      const r = fagi.brain.facts[ep.key];
      if (lastRule?.key === ep.key && lastRule.id) {
        items.push({ text: t('brainmap.ruleWritten', { id: lastRule.id, kind: t(`brainmap.rk.${lastRule.kind}`) }),
          color: lastRule.verdict === 'avoid' ? ROJO : VERDE, filled: lastRule.kind !== 'retirada', bold: true });
      } else if (r) {
        const w = pesoDe(r);
        const falta = w >= 0 ? LEARN.preferFrom : LEARN.avoidFrom;
        items.push({ text: t('brainmap.noRuleYet', { w: Math.abs(w).toFixed(2), need: falta.toFixed(2) }), color: DIM });
      }
      y = cadena(items, pad, y, W - pad, lineH + 2 * s) + lineH;
    }

    return y;
  }


  // ===== 6. red neuronal =====
  // Neuronas en tres capas, como un cerebro de verdad: sentidos → conceptos →
  // lo que el cuerpo sintió, los sitios que recuerda y las reglas escritas.
  // Cada línea es una sinapsis; su grosor, la fuerza. Las que acaban de
  // formarse brillan; por las que están activas ahora corre la señal.
  function pintarRed(fagi, y) {
    const W = cssW;
    const pad = 10 * s;
    const lineH = 19 * s;
    const ahora = fagi.age ?? 0;
    const th = fagi.thought ?? {};
    const syn = Object.values(fagi.brain.synapses ?? {});
    const places = fagi.brain.places ?? {};
    const reglas = fagi.brain.rules.list.filter((r) => !r.retired);
    const ganadora = claveDeIntencion(fagi);

    cabecera(6, t('brainmap.sec.network'), y, W, pad);
    y += 16 * s;

    // Qué neuronas existen: las que tienen alguna conexión o alguna creencia.
    const sentidos = ['vista', 'olfato', 'memoria'];
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

  // ===== 7. mapa mental =====
  // Lo que recuerda del sitio: por dónde ha pasado (se desvanece), dónde cree
  // que están el agua y el árbol (con cuánto puede fallar), y su casa.
  function pintarMapaMental(fagi, y) {
    const W = cssW;
    const pad = 10 * s;
    cabecera(7, t('brainmap.sec.mental'), y, W, pad);
    y += 12 * s;
    const maxH = 240 * s;
    let mw = W - pad * 2;
    let mh = mw * (WORLD.height / WORLD.width);
    if (mh > maxH) { mh = maxH; mw = mh * (WORLD.width / WORLD.height); }
    const mx = pad + (W - pad * 2 - mw) / 2;
    const k = mw / WORLD.width;
    const X = (v) => mx + v * k;
    const Y = (v) => y + v * k;

    caja(mx, y, mw, mh, 4 * s, '#0e1015', '#262a35');
    // casillas conocidas
    const ex = fagi.explored;
    if (ex) {
      const cols = Math.ceil(WORLD.width / EXPLORE.cell);
      for (let i = 0; i < ex.length; i++) {
        if (ex[i] <= 0) continue;
        const cx = (i % cols) * EXPLORE.cell;
        const cy = Math.floor(i / cols) * EXPLORE.cell;
        g.fillStyle = `rgba(143,217,61,${(0.08 + 0.3 * Math.min(1, ex[i] / EXPLORE.visitMax)).toFixed(3)})`;
        g.fillRect(X(cx), Y(cy), Math.min(EXPLORE.cell, WORLD.width - cx) * k, Math.min(EXPLORE.cell, WORLD.height - cy) * k);
      }
    }
    // casa
    const nido = mundo ? nestOf(mundo) : null;
    if (nido) {
      g.beginPath();
      g.arc(X(nido.x), Y(nido.y), 5 * s, 0, Math.PI * 2);
      g.fillStyle = '#c9a227';
      g.fill();
      texto(labelOf('nido'), X(nido.x) + 8 * s, Y(nido.y), { size: 8.5, color: '#c9a227' });
    }
    // sitios recordados: dónde cree que están y cuánto puede fallar
    for (const [kind, p] of Object.entries(fagi.brain.places ?? {})) {
      const color = kind === 'agua' || kind === 'charco' ? '#3d8fd9' : '#5bd97e';
      const conf = p.confidence ?? 0.5;
      g.globalAlpha = 0.35 + 0.65 * conf;
      g.beginPath();
      g.arc(X(p.x), Y(p.y), Math.max(3 * s, (p.error ?? 0) * k), 0, Math.PI * 2);
      g.strokeStyle = color;
      g.lineWidth = 1;
      g.setLineDash([3, 3]);
      g.stroke();
      g.setLineDash([]);
      g.beginPath();
      g.arc(X(p.x), Y(p.y), 4 * s, 0, Math.PI * 2);
      g.fillStyle = color;
      g.fill();
      g.globalAlpha = 1;
      texto(`${labelOf(kind === 'foodSource' ? 'arbol' : kind)} ${Math.round(conf * 100)}% · ±${Math.round(p.error ?? 0)}px`,
        X(p.x) + 7 * s, Y(p.y) - 8 * s, { size: 8.5, color });
    }
    // a dónde va a asomarse
    if (fagi.exploreTarget && (fagi.thought?.action === 'explore')) {
      g.strokeStyle = '#e6e8ee';
      g.setLineDash([3, 3]);
      g.beginPath();
      g.moveTo(X(fagi.x), Y(fagi.y));
      g.lineTo(X(fagi.exploreTarget.x), Y(fagi.exploreTarget.y));
      g.stroke();
      g.setLineDash([]);
    }
    // Fagi
    g.save();
    g.translate(X(fagi.x), Y(fagi.y));
    g.rotate(fagi.angle ?? 0);
    g.beginPath();
    g.moveTo(7 * s, 0);
    g.lineTo(-4 * s, 4 * s);
    g.lineTo(-4 * s, -4 * s);
    g.closePath();
    g.fillStyle = '#ffffff';
    g.fill();
    g.restore();

    y += mh + 12 * s;
    texto(t('brainmap.mentalHint'), pad, y, { size: 8.5, color: DIM, maxW: W - pad * 2 });
    return y + 14 * s;
  }

  return { update };
}
