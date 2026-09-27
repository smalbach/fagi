// 1. Siente — el cuerpo: hambre, sed, energía y los efectos que lleva encima.

import { labelOf, t } from '../i18n.js';
import { VERDE, ROJO, AMARILLO, DIM } from './paleta.js';

export function pintarSiente(pinceles, fagi, y) {
  const { s, texto, ancho, chip, cabecera, barra } = pinceles;
  const { W, pad, gap, lineH } = pinceles.medidas();
  const th = fagi.thought ?? {};

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

  let x = pad;
  const efectos = Object.values(fagi.effects ?? {});
  if (fagi.carrying) x += chip(`${t('word.carries')}: ${labelOf(fagi.carrying.type)}`, x, y, '#c9a227') + gap;
  for (const e of efectos) {
    const str = `${t(`sense.${e.stat}`, { v: e.mult })} · ${Math.ceil(e.time)}s`;
    if (x + ancho(str, 9.5) + 10 * s > W - pad) break;
    x += chip(str, x, y, e.color ?? AMARILLO) + gap;
  }
  if (x === pad) texto(t('brainmap.noEffects'), pad, y, { size: 9.5, color: DIM });
  return y + lineH;
}
