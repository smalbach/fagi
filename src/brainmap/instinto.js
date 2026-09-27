// 3. Instinto — los escalones de la directiva de sobrevivir, en orden; el
// primero que contesta manda.

import { t } from '../i18n.js';
import { TAG_COLOR } from '../narrator.js';
import { DIM } from './paleta.js';

const ESCALONES = ['survive', 'endure', 'provide', 'clues', 'explore'];

export function pintarInstinto(pinceles, fagi, y) {
  const { s, texto, ancho, chip, cabecera } = pinceles;
  const { W, pad, lineH } = pinceles.medidas();
  const th = fagi.thought ?? {};

  cabecera(3, t('brainmap.sec.instinct'), y, W, pad);
  y += 17 * s;
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
  return y + lineH;
}
