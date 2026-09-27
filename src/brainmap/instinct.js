// 3. Instinct — the tiers of the survive directive, in order; the
// first one that answers wins.

import { t } from '../i18n.js';
import { TAG_COLOR } from '../narrator.js';
import { DIM } from './palette.js';

const TIERS = ['survive', 'endure', 'provide', 'clues', 'explore'];

export function paintInstinct(brushes, fagi, y) {
  const { s, text, width, chip, header } = brushes;
  const { W, pad, lineH } = brushes.measures();
  const th = fagi.thought ?? {};

  header(3, t('brainmap.sec.instinct'), y, W, pad);
  y += 17 * s;
  const isActive = th.tier ?? null;
  const iActive = TIERS.indexOf(isActive);
  const actionColor = TAG_COLOR[th.action] ?? '#7f869a';
  const labels = TIERS.map((e, i) => `${i + 1} ${t(`brainmap.tier.${e}`)}`);
  const arrow = width('›', 10);
  const total = labels.reduce((a, e) => a + width(e, 9.5, true) + 10 * s, 0) + arrow * 4 + 8 * s * 4;
  let x = pad;
  let yy = y;
  labels.forEach((e, i) => {
    const w = width(e, 9.5, true) + 10 * s;
    if (total > W - pad * 2 && x + w > W - pad) { x = pad; yy += lineH; }
    chip(e, x, yy, i === iActive ? actionColor : DIM,
      { filled: i === iActive, bold: true, dim: iActive >= 0 && i > iActive });
    x += w;
    if (i < labels.length - 1) { text('›', x + 4 * s + arrow / 2, yy, { color: DIM, align: 'center' }); x += arrow + 8 * s; }
  });
  y = yy + lineH;
  const name = th.rule ? t(`brainmap.rule.${th.rule}`) : '—';
  text(t('brainmap.ruleFired', { rule: name }), pad, y, { size: 9.5, color: DIM, maxW: W - pad * 2 });
  return y + lineH;
}
