// 5. Learn — the last experience: what she tried, what she felt, how it moved the
// belief and which rule she wrote or revised (or how far she is from writing it).

import { specOf, LEARN } from '../config.js';
import { labelOf, t } from '../i18n.js';
import { GREEN, RED, PURPLE, TEXT, DIM } from './palette.js';
import { weightOf, changeOf, sign } from './reading.js';
import { cuesOf } from '../learned/cues.js';

export function paintLearn(brushes, fagi, y) {
  const { s, text, chain, header } = brushes;
  const { W, pad, lineH } = brushes.measures();
  const lastRule = fagi.brain.lastRule;
  const ep = fagi.lastEpisode;

  header(5, t('brainmap.sec.learn'), y, W, pad);
  y += 18 * s;
  if (!ep) {
    text(t('brainmap.noEpisode'), pad, y, { size: 9.5, color: DIM });
    return y + lineH;
  }

  const items = [];
  const color = specOf(ep.key)?.color ?? DIM;
  items.push({ text: t(`brainmap.ep.${ep.action}`, { what: labelOf(ep.key) }), color, bold: true });
  const sens = (ep.sensations ?? []).filter((x) => x.sense !== 'peril' && x.sense !== 'contradiction')
    .map((x) => t(`sense.${x.sense}`, { v: x.sense === 'hunger' || x.sense === 'thirst' ? sign(x.v, 0) : x.v }));
  if (ep.pending && ep.action === 'drink' && !changeOf(ep)) {
    items.push({ text: t('brainmap.pending'), color: DIM });
  } else {
    items.push({ text: sens.length ? t('brainmap.felt', { list: sens.join(', ') }) : t('brainmap.feltNothing'), color: TEXT });
    items.push({ text: t('brainmap.reward', { v: sign(ep.reward ?? 0) }), color: (ep.reward ?? 0) >= 0 ? GREEN : RED, filled: true, bold: true });
    if (ep.correction) items.push({ text: t('brainmap.correction', { v: sign(ep.correction) }), color: RED, filled: true });
    const cb = changeOf(ep);
    if (cb?.before && cb?.after) {
      items.push({
        text: `${t('brainmap.belief', { from: sign(cb.before.value), to: sign(cb.after.value) })} · ${t(`brainmap.kind.${cb.kind}`)} · ${t(`stage.${cb.after.stage}`)}`,
        color: PURPLE,
      });
    }
    if (ep.pending) items.push({ text: t('brainmap.watching'), color: DIM });
    // What it taught about each of its traits (learned/cues.js).
    const traits = cuesOf(ep.key).filter((c) => fagi.brain.cues?.[c]);
    if (traits.length) {
      const list = traits.map((c) => `${labelOf(c)} ${sign(fagi.brain.cues[c].w)}`).join(' · ');
      items.push({ text: t('brainmap.traits', { list }), color: PURPLE });
    }
  }
  // The rule that came out of it, or how far she is from writing it.
  const r = fagi.brain.facts[ep.key];
  const aboutIt = lastRule && (lastRule.key === ep.key || cuesOf(ep.key).includes(lastRule.key));
  if (aboutIt && lastRule.id) {
    items.push({ text: t('brainmap.ruleWritten', { id: lastRule.id, kind: t(`brainmap.rk.${lastRule.kind}`) }),
      color: lastRule.verdict === 'avoid' ? RED : GREEN, filled: lastRule.kind !== 'retired', bold: true });
  } else if (r) {
    const w = weightOf(r);
    const missing = w >= 0 ? LEARN.preferFrom : LEARN.avoidFrom;
    items.push({ text: t('brainmap.noRuleYet', { w: Math.abs(w).toFixed(2), need: missing.toFixed(2) }), color: DIM });
  }
  return chain(items, pad, y, W - pad, lineH + 2 * s) + lineH;
}
