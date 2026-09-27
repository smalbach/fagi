// 1. Feel — the body: hunger, thirst, energy and the effects she's carrying.

import { labelOf, t } from '../i18n.js';
import { GREEN, RED, YELLOW, DIM } from './palette.js';

export function paintFeel(brushes, fagi, y) {
  const { s, text, width, chip, header, bar } = brushes;
  const { W, pad, gap, lineH } = brushes.measures();
  const th = fagi.thought ?? {};

  header(1, t('brainmap.sec.body'), y, W, pad);
  y += 16 * s;
  const meters = [
    ['stat.hunger', th.hungerU ?? 0, RED],
    ['stat.thirst', th.thirstU ?? 0, '#3d8fd9'],
    ['stat.energy', th.energyU ?? 1, GREEN],
  ];
  const wMed = (W - pad * 2 - gap * 2) / 3;
  meters.forEach(([k, v, c], i) => {
    const x = pad + i * (wMed + gap);
    text(t(k).toLowerCase(), x, y, { size: 9.5, color: DIM });
    text(`${Math.round(v * 100)}%`, x + wMed, y, { size: 9.5, align: 'right', bold: true });
    bar(x, y + 8 * s, wMed, 5 * s, v, c);
  });
  y += 28 * s;

  let x = pad;
  const effects = Object.values(fagi.effects ?? {});
  if (fagi.carrying) x += chip(`${t('word.carries')}: ${labelOf(fagi.carrying.type)}`, x, y, '#c9a227') + gap;
  for (const e of effects) {
    const str = `${t(`sense.${e.stat}`, { v: e.mult })} · ${Math.ceil(e.time)}s`;
    if (x + width(str, 9.5) + 10 * s > W - pad) break;
    x += chip(str, x, y, e.color ?? YELLOW) + gap;
  }
  if (x === pad) text(t('brainmap.noEffects'), pad, y, { size: 9.5, color: DIM });
  return y + lineH;
}
