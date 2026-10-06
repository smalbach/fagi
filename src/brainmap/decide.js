// 4. Decide — the action, its why, and whether something new made her reconsider.

import { t, tx } from '../i18n.js';
import { TAG_COLOR, rethinkLine, legLine } from '../narrator.js';
import { YELLOW, TEXT, DIM } from './palette.js';

export function paintDecide(brushes, fagi, y) {
  const { s, text, chip, header } = brushes;
  const { W, pad, gap, lineH } = brushes.measures();
  const th = fagi.thought ?? {};

  header(4, t('brainmap.sec.decide'), y, W, pad);
  y += 18 * s;
  const actionColor = TAG_COLOR[th.action] ?? '#7f869a';
  let x = pad;
  x += chip(t(`tag.${th.action ?? 'explore'}`), x, y, actionColor, { filled: true, bold: true }) + gap;
  x += text(t(`action.${th.action ?? 'explore'}`), x, y, { bold: true, size: 11, maxW: W - pad - x }) + gap;
  if (fagi.directive && x < W - pad - 40 * s) x += chip(t('brainmap.api'), x, y, '#4cc9f0') + gap;
  const lineObj = fagi.brain?.program?.lines?.find((l) => l.id === th.line);
  if (lineObj && lineObj.source !== 'born' && x < W - pad - 55 * s) {
    const chipCol = lineObj.source === 'night' ? '#8f7fd0' : lineObj.source === 'told' ? '#3d8fd9' : '#8fd93d';
    const chipLabel = lineObj.source === 'inherited' ? 'GENOME' : lineObj.source === 'night' ? 'DREAM' : lineObj.source === 'told' ? 'CULTURE' : 'CODE';
    chip(chipLabel, x, y, chipCol, { filled: true, bold: true, size: 8 });
  }
  y += lineH;
  text(tx(th.reason), pad, y, { size: 9.5, color: TEXT, maxW: W - pad * 2 });
  y += lineH * 0.9;

  // Whether something new made her reconsider what she was doing.
  const r = th.rethink ?? fagi.rethink;
  const line = r ? rethinkLine(r, th) : null;
  if (line) {
    const xx = pad + chip(t('tag.rethink'), pad, y, YELLOW, { size: 8.5 }) + gap;
    text(tx(line.text), xx, y, { size: 9.5, color: TEXT, maxW: W - pad - xx });
    y += lineH * 0.85;
    text(tx(line.detail), xx, y, { size: 9, color: DIM, maxW: W - pad - xx });
  } else {
    text(t('brainmap.noNews'), pad, y, { size: 9.5, color: DIM });
    y += lineH * 0.85;
  }
  y += lineH * 0.9;

  // Exploring: which leg she's on and why she chose it.
  if (th.action === 'explore' && fagi.legChoice) {
    const l = legLine(fagi.legChoice);
    text(`${t('word.leg')} ${fagi.exploreLegs ?? ''} · ${tx(l.text)} · ${tx(l.detail)}`, pad, y,
      { size: 9, color: DIM, maxW: W - pad * 2 });
  } else if (th.action === 'explore') {
    text(`${t('word.leg')} ${fagi.exploreLegs ?? 0}`, pad, y, { size: 9, color: DIM });
  }
  return y + lineH;
}
