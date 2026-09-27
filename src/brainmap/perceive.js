// 2. Perceive and score · Remember.
//
//   Perceive  — what she sees, smells or remembers, with its score broken down
//    and score  (belief + curiosity + need + distance) against the
//               minimum needed to move.
//   Remember  — the learned memory of each thing: its weight against the
//               thresholds that turn it into a rule, how much she trusts it, which
//               stage it's at (short, medium, long) and the written rule if any.

import { specOf, BRAIN, LEARN } from '../config.js';
import { labelOf, t } from '../i18n.js';
import { GREEN, RED, YELLOW, PURPLE, TEXT, DIM, ROW_BG, SENSE } from './palette.js';
import { intentionKey, ruleOf, weightOf, signo } from './reading.js';

const PART_COLOR = {
  belief: PURPLE, curiosity: YELLOW, need: RED, distance: '#7f869a', smell: '#e8a33d',
};
const PART_KEY = { belief: 'belief', curiosity: 'curiosity', need: 'need', distance: 'distance', smell: 'smell' };
const STAGE_NAMES = ['short', 'medium', 'long'];
const MAX_CANDIDATOS = 6;

export function paintPerceive(brushes, fagi, y) {
  const { s, text, header } = brushes;
  const { W, pad, lineH } = brushes.measures();
  const th = fagi.thought ?? {};

  y += 4 * s;
  // Plenty of width: perceive on the left and memory on the right, joined
  // by lines. Narrow panel: one column, memory below.
  const twoCols = W >= 460;
  const colL = pad;
  const colW = twoCols ? (W - pad * 2 - 22 * s) / 2 : W - pad * 2;
  const colR = twoCols ? W - pad - colW : pad;
  header(2, t('brainmap.sec.perceive'), y, twoCols ? colL + colW + 11 * s : W, pad);
  if (twoCols) text(t('brainmap.sec.memory').toUpperCase(), colR, y, { size: 9, color: DIM, bold: true, maxW: colW });
  y += 12 * s;

  const ranked = (th.ranked ?? []).slice(0, MAX_CANDIDATOS);
  const keysOf = Object.keys(fagi.brain.facts);
  const rowH = 46 * s;
  const rowsL = Math.max(ranked.length, 1);
  const y0 = y;
  // Where memory starts: alongside, or below what's perceived, with its header.
  const y0R = twoCols ? y0 : y0 + rowsL * rowH + 20 * s;
  // Where each column falls: shared by the rows and the lines joining them.
  const grid = { twoCols, colL, colW, colR, rowH, y0, y0R, pad, winner: intentionKey(fagi) };

  const candPos = paintCandidates(brushes, fagi, th, ranked, grid);
  const believedPos = paintBeliefs(brushes, fagi, keysOf, grid);
  join(brushes, candPos, believedPos, grid);

  y = Math.max(y0 + rowsL * rowH, y0R + Math.max(keysOf.length, 1) * rowH) + 9 * s;
  y = legend(brushes, y, colL, W, pad);
  return y + lineH;
}

// What's perceived: one row per candidate, with the sum of its score.
function paintCandidates(brushes, fagi, th, ranked, { colL, colW, rowH, y0, winner }) {
  const { g, s, text, box, chip } = brushes;
  const newOnes = new Set(th.news ?? []);
  const yRow = (i) => y0 + i * rowH;

  // How far a score reaches: the scale shared by all the bars.
  const maxPos = Math.max(2.5, ...ranked.map((c) => Object.values(c.parts ?? {}).reduce((a, v) => a + Math.max(0, v), 0)));
  const maxNeg = Math.max(0.8, ...ranked.map((c) => -Object.values(c.parts ?? {}).reduce((a, v) => a + Math.min(0, v), 0)));

  const candPos = [];
  let winnerMarked = false;
  ranked.forEach((c, i) => {
    const yy = yRow(i);
    const color = specOf(c.key)?.color ?? DIM;
    // Live we know which object she's heading to; in a replay, only its kind.
    const isOwn = c.ref && fagi.target ? c.ref === fagi.target : c.key === winner;
    const wins = !winnerMarked && isOwn && (c.score ?? 0) > BRAIN.minScore;
    if (wins) winnerMarked = true;
    box(colL, yy + 2 * s, colW, rowH - 5 * s, 5 * s, wins ? '#262b38' : ROW_BG, wins ? '#e6e8ee' : null, 1.2);

    // line 1: what it is, whether it's new, how much it scores
    g.beginPath();
    g.arc(colL + 10 * s, yy + 12 * s, 4 * s, 0, Math.PI * 2);
    g.fillStyle = color;
    g.fill();
    let x = colL + 18 * s;
    x += text(labelOf(c.key), x, yy + 12 * s, { bold: wins, maxW: colW * 0.45 }) + 5 * s;
    if (newOnes.has(c.key)) chip(t('brainmap.new'), x, yy + 12 * s, YELLOW, { filled: true, size: 8 });
    const passes = (c.score ?? 0) > BRAIN.minScore;
    text((c.score ?? 0).toFixed(2), colL + colW - 6 * s, yy + 12 * s,
      { align: 'right', bold: true, color: passes ? TEXT : DIM });

    // line 2: the sum, part by part, against the minimum
    const bx = colL + 8 * s;
    const bw = colW - 16 * s;
    const zero = bx + bw * (maxNeg / (maxNeg + maxPos));
    const k = bw / (maxNeg + maxPos);
    const by = yy + 22 * s;
    const bh = 7 * s;
    box(bx, by, bw, bh, 2, '#252934');
    let pos = zero;
    let neg = zero;
    for (const [part, v] of Object.entries(c.parts ?? {})) {
      if (!v) continue;
      const w = Math.abs(v) * k;
      g.fillStyle = PART_COLOR[part] ?? DIM;
      if (v > 0) { g.fillRect(pos, by, w, bh); pos += w; } else { neg -= w; g.fillRect(neg, by, w, bh); }
    }
    g.fillStyle = '#e6e8ee';
    g.fillRect(zero + BRAIN.minScore * k - 0.75, by - 2 * s, 1.5, bh + 4 * s);   // the minimum
    g.fillStyle = '#10131a';
    g.fillRect(zero - 0.5, by, 1, bh);

    // line 3: through which sense and at what distance
    const sense = t(`word.${SENSE[c.via] ?? 'eye'}`);
    text(`${sense} · ${Math.round(c.dist ?? 0)}px`, bx, yy + 36 * s, { size: 9, color: DIM, maxW: bw * 0.5 });
    const parts = Object.entries(c.parts ?? {}).filter(([, v]) => Math.abs(v) >= 0.05)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 2)
      .map(([part, v]) => `${t(`score.${PART_KEY[part] ?? part}`)} ${signo(v, 1)}`).join(' ');
    text(parts, bx + bw, yy + 36 * s, { size: 9, color: DIM, align: 'right', maxW: bw * 0.55 });

    candPos.push({ key: c.key, x: colL + colW, y: yy + rowH / 2, wins, color });
  });
  if (!ranked.length) text(t('brainmap.nothingSeen'), colL + 4 * s, y0 + 14 * s, { size: 9.5, color: DIM, maxW: colW });
  return candPos;
}

// Memory: one row per belief.
function paintBeliefs(brushes, fagi, keysOf, { twoCols, colR, colW, rowH, y0R, winner }) {
  const { g, s, text, width, box, chip } = brushes;
  const yRowR = (i) => y0R + i * rowH;
  const believedPos = {};
  const ep = fagi.lastEpisode;
  keysOf.forEach((key, i) => {
    const r = fagi.brain.facts[key];
    const yy = yRowR(i);
    const color = specOf(key)?.color ?? DIM;
    const used = key === winner;
    const recent = ep && ep.key === key;
    box(colR, yy + 2 * s, colW, rowH - 5 * s, 5 * s, used ? '#262b38' : ROW_BG,
      used ? '#e6e8ee' : recent ? PURPLE : null, used ? 1.2 : 1);

    // line 1: what, and the rule she already wrote about it
    g.beginPath();
    g.arc(colR + 10 * s, yy + 12 * s, 3 + r.confidence * 3 * s, 0, Math.PI * 2);
    g.fillStyle = color;
    g.fill();
    text(labelOf(key), colR + 18 * s, yy + 12 * s, { bold: used, maxW: colW * 0.5 });
    const rule = ruleOf(fagi.brain.rules, key);
    if (rule) {
      const str = t(`brainmap.verdict.${rule.verdict}`);
      const w = width(str, 8, true) + 10 * s;
      chip(str, colR + colW - 5 * s - w, yy + 12 * s, rule.verdict === 'avoid' ? RED : GREEN, { filled: true, size: 8, bold: true });
    } else {
      text(signo(r.value), colR + colW - 6 * s, yy + 12 * s, { size: 9.5, align: 'right', color: DIM });
    }

    // line 2: the weight (what she believes × how much she trusts it) between the two thresholds
    // that turn it into a rule: avoid on the left, prefer on the right.
    const bx = colR + 8 * s;
    const bw = colW - 16 * s;
    const by = yy + 22 * s;
    const bh = 7 * s;
    const half = bx + bw / 2;
    const w = weightOf(r);
    box(bx, by, bw, bh, 2, '#252934');
    g.fillStyle = w >= 0 ? GREEN : RED;
    g.globalAlpha = 0.9;
    if (w >= 0) g.fillRect(half, by, (bw / 2) * Math.min(1, w), bh);
    else g.fillRect(half + (bw / 2) * Math.max(-1, w), by, (bw / 2) * Math.min(1, -w), bh);
    g.globalAlpha = 1;
    // what she believes without discounting doubt: the outline
    g.strokeStyle = r.value >= 0 ? GREEN : RED;
    g.lineWidth = 1;
    g.setLineDash([2, 2]);
    const xv = half + (bw / 2) * r.value;
    g.strokeRect(Math.min(half, xv), by + 0.5, Math.abs(xv - half), bh - 1);
    g.setLineDash([]);
    for (const [threshold, c] of [[-LEARN.avoidFrom, RED], [LEARN.preferFrom, GREEN]]) {
      g.fillStyle = c;
      g.fillRect(half + (bw / 2) * threshold - 0.75, by - 2 * s, 1.5, bh + 4 * s);
    }
    g.fillStyle = '#10131a';
    g.fillRect(half - 0.5, by, 1, bh);

    // line 3: memory stage (short → medium → long) and how much she trusts it
    const iStage = STAGE_NAMES.indexOf(r.stage);
    const segW = 9 * s;
    for (let e = 0; e < 3; e++) {
      box(bx + e * (segW + 2 * s), yy + 33 * s, segW, 5 * s, 1.5, e <= iStage ? PURPLE : '#2e3240');
    }
    text(t(`stage.${r.stage}`), bx + 3 * (segW + 2 * s) + 3 * s, yy + 36 * s, { size: 9, color: PURPLE });
    text(t('brainmap.beliefMeta', { conf: Math.round(r.confidence * 100), tries: r.tries ?? 0, confirms: r.confirms ?? 0 }),
      bx + bw, yy + 36 * s, { size: 9, color: DIM, align: 'right', maxW: bw * 0.62 });

    believedPos[key] = { x: colR, y: yy + rowH / 2 };
  });
  if (!twoCols) text(t('brainmap.sec.memory').toUpperCase(), colR, y0R - 9 * s, { size: 9, color: DIM, bold: true, maxW: colW });
  if (!keysOf.length) text(t('brainmap.noBeliefs'), colR + 4 * s, y0R + 14 * s, { size: 9.5, color: DIM, maxW: colW });
  return believedPos;
}

// What she perceives consults what she believes about that same thing: the line joining them.
// In one column only the winner is joined, along the left margin.
function join(brushes, candPos, believedPos, { twoCols, colL, pad }) {
  const { g } = brushes;
  for (const c of candPos) {
    const d = believedPos[c.key];
    if (!d || (!twoCols && !c.wins)) continue;
    g.beginPath();
    if (twoCols) {
      g.moveTo(c.x, c.y);
      const mx = (c.x + d.x) / 2;
      g.bezierCurveTo(mx, c.y, mx, d.y, d.x, d.y);
    } else {
      g.moveTo(colL, c.y);
      g.bezierCurveTo(colL - pad * 0.8, c.y, colL - pad * 0.8, d.y, colL, d.y);
    }
    g.strokeStyle = c.wins ? '#e6e8ee' : c.color;
    g.lineWidth = c.wins ? 2 : 1;
    g.globalAlpha = c.wins ? 0.9 : 0.35;
    if (c.wins) { g.setLineDash([4, 3]); g.lineDashOffset = -(performance.now() / 45) % 7; }
    g.stroke();
    g.setLineDash([]);
    g.globalAlpha = 1;
  }
}

// The bars' legend, just once, wrapping to a new line if it doesn't fit.
function legend(brushes, y, colL, W, pad) {
  const { g, s, text, width } = brushes;
  const marksOf = [
    ...Object.entries(PART_COLOR).map(([part, c]) => ({ c, txt: t(`score.${PART_KEY[part]}`), box: true })),
    { c: '#e6e8ee', txt: `${t('brainmap.min')} ${BRAIN.minScore}` },
    { c: [RED, GREEN], txt: t('brainmap.thresholds') },
  ];
  let x = colL;
  for (const m of marksOf) {
    const w = 9 * s + width(m.txt, 8.5) + 8 * s + (Array.isArray(m.c) ? 4 * s : 0);
    if (x > colL && x + w > W - pad) { x = colL; y += 13 * s; }
    if (m.box) { g.fillStyle = m.c; g.fillRect(x, y - 3 * s, 7 * s, 6 * s); }
    else for (const [j, c] of [].concat(m.c).entries()) { g.fillStyle = c; g.fillRect(x + j * 4 * s, y - 4 * s, 1.5, 8 * s); }
    text(m.txt, x + 9 * s + (Array.isArray(m.c) ? 4 * s : 0), y, { size: 8.5, color: DIM });
    x += w;
  }
  return y;
}
