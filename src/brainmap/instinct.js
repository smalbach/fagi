// 3. Instinct — the tiers of the survive directive, in order; the
// first one that answers wins.

import { t, tx } from '../i18n.js';
import { habit, HABIT_IDS } from '../habits.js';
import { TAG_COLOR } from '../narrator.js';
import { DIM, PURPLE } from './palette.js';
import { selectOn } from '../decision/select.js';

const TIERS = ['survive', 'endure', 'provide', 'clues', 'explore'];

export function paintInstinct(brushes, fagi, y) {
  const { s, text, width, chip, header } = brushes;
  const { W, pad, lineH } = brushes.measures();
  const th = fagi.thought ?? {};

  // With free-flow selection (SELECT) her lines past the reflexes vote.
  header(3, t(selectOn() ? 'brainmap.sec.instinctVote' : 'brainmap.sec.instinct'), y, W, pad);
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
  y += lineH;
  return paintHabits(brushes, fagi, y);
}

// The thresholds those rungs hang on (habits.js): the ones she has tuned stand
// out, with an arrow for the way they moved, and the last move says why.
function paintHabits(brushes, fagi, y) {
  const { s, text, width, chip } = brushes;
  const { W, pad, lineH } = brushes.measures();
  const habits = fagi.brain.habits;
  if (!habits) return y;
  const items = HABIT_IDS.map((id) => {
    const h = habits[id];
    const moved = h?.rung != null;
    const last = h?.moves?.at(-1);
    const arrow = last ? (last.to > last.from ? ' ↑' : ' ↓') : '';
    return { text: `${t(`habit.short.${id}`)} ${habitText(id, habit(fagi, id))}${arrow}`, color: moved ? PURPLE : DIM };
  });
  // Chips side by side, wrapping: they are a set, not a sequence.
  let x = pad;
  for (const it of items) {
    const w = width(it.text, 9.5) + 10 * s;
    if (x > pad && x + w > W - pad) { x = pad; y += lineH + 2 * s; }
    x += chip(it.text, x, y, it.color, { filled: false }) + 6 * s;
  }
  y += lineH + 2 * s;
  const h = fagi.brain.lastHabit;
  if (h) {
    text(`${t(`habit.${h.id}`)} ${habitText(h.id, h.from)} → ${habitText(h.id, h.to)} · ${tx(h.why)}`, pad, y,
      { size: 9.5, color: DIM, maxW: W - pad * 2 });
    y += lineH;
  }
  return y;
}

const habitText = (id, v) => (id === 'hungerAt' || id === 'thirstAt' ? `${Math.round(v * 100)}%` : String(v));
