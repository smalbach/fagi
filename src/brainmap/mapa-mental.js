// 7. Mapa mental — lo que recuerda del sitio: por dónde ha pasado (se
// desvanece), dónde cree que están el agua y el árbol (con cuánto puede
// fallar), y su casa.

import { WORLD, EXPLORE } from '../config.js';
import { nestOf } from '../world.js';
import { labelOf, t } from '../i18n.js';
import { DIM } from './paleta.js';

export function pintarMapaMental(pinceles, fagi, mundo, y) {
  const { g, s, texto, caja, cabecera } = pinceles;
  const { W, pad } = pinceles.medidas();
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
