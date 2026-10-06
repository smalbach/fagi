// Her body seen from above, as a diagram: the exoskeleton (head, mesosoma,
// petiole, gaster, six legs, two elbowed antennae) and the organs inside it,
// each glowing as hard as it is working (organs.js). The organ setting off
// what she does now sends a signal, drawn as a running dashed line, to her
// brain, and from the brain to her legs: sense → decide → act.
//
// The parts follow her organs (fagi.morph) the way her sprite does
// (fagi-sprite.js shapeOf): a bigger brain, a bigger head.

import { shapeOf } from '../fagi-sprite.js';
import { t } from '../i18n.js';
import { DIM, TEXT } from '../brainmap/palette.js';

const SHELL = '#3a4050';
const SHELL_FILL = '#181b23';

// Where each organ sits, in body lengths from the waist (petiole), head up.
// Labels go left or right of the body.
const AT = {
  brain: { x: 0, y: -0.37, side: -1 },
  eyes: { x: 0.105, y: -0.39, side: 1 },
  antennae: { x: -0.2, y: -0.6, side: -1 },
  mouth: { x: 0, y: -0.5, side: 1 },
  muscles: { x: 0, y: -0.13, side: -1 },
  hemolymph: { x: 0, y: 0.04, side: -1 },
  crop: { x: 0, y: 0.15, side: 1 },
  fat: { x: -0.11, y: 0.27, side: -1 },
  ovary: { x: 0.05, y: 0.31, side: 1 },
  tubules: { x: 0, y: 0.42, side: 1 },
  cuticle: { x: 0.155, y: 0.22, side: 1 },
};

// Returns where the diagram ends.
export function paintAnatomy(brushes, fagi, organs, y) {
  const { g, s, text } = brushes;
  const { W } = brushes.measures();
  const H = 300 * s;
  const L = Math.min(H * 0.82, W * 0.62);   // a body length, in px
  const cx = W / 2;
  const cy = y + H * 0.52;
  const P = (u, v) => [cx + u * L, cy + v * L];
  const sh = shapeOf(fagi);
  const by = Object.fromEntries(organs.map((o) => [o.id, o]));
  const now = performance.now() / 1000;

  const ellipse = (u, v, rx, ry, fill, stroke, lw = 1.5) => {
    const [x, yy] = P(u, v);
    g.beginPath();
    g.ellipse(x, yy, rx * L, ry * L, 0, 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw * s; g.stroke(); }
  };
  const path = (pts, color, lw, alpha = 1) => {
    g.globalAlpha = alpha;
    g.beginPath();
    pts.forEach(([u, v], i) => { const [x, yy] = P(u, v); if (i) g.lineTo(x, yy); else g.moveTo(x, yy); });
    g.strokeStyle = color;
    g.lineWidth = lw * s;
    g.stroke();
    g.globalAlpha = 1;
  };
  // An organ's glow: its color, as bright and as blurred as it is working.
  const glow = (o, draw) => {
    if (o.absent) return;
    g.save();
    g.shadowColor = o.color;
    g.shadowBlur = (4 + 18 * o.level) * s;
    g.globalAlpha = 0.25 + 0.75 * o.level;
    draw(o.color);
    g.restore();
  };

  // --- the exoskeleton -------------------------------------------------------
  const cut = by.cuticle;
  const shell = cut.level > 0.3 ? cut.color : SHELL;
  const legs = sh.legs;
  // Legs: three pairs from the mesosoma, coxa → femur → tibia.
  const mus = by.muscles;
  const stride = mus.level > 0.3 ? Math.sin(now * 8) * 0.03 : 0;
  [[-0.2, -0.09], [-0.13, 0], [-0.06, 0.1]].forEach(([v, bend], i) => {
    for (const side of [-1, 1]) {
      const sw = (i % 2 ? -1 : 1) * side * stride;
      const knee = [side * 0.17 * legs, v + bend * 0.5 - 0.06 + sw];
      const foot = [side * 0.27 * legs, v + bend + 0.08 + sw];
      path([[side * 0.05, v], knee, foot], shell, 2.4);
      path([[side * 0.05, v], knee, foot], mus.color, 1.2, 0.2 + 0.8 * mus.level);
    }
  });
  // Antennae: scape out, then the elbow and the funiculus.
  const ant = by.antennae;
  const a = sh.antennae;
  for (const side of [-1, 1]) {
    const pts = [[side * 0.05, -0.46], [side * 0.12 * a, -0.56 * a + 0.0], [side * 0.22 * a, -0.62 * a]];
    path(pts, shell, 2);
    glow(ant, (c) => path(pts, c, 1.4));
  }
  // Body segments.
  const head = sh.head;
  ellipse(0, -0.37, 0.12 * head, 0.11 * head, SHELL_FILL, shell);
  ellipse(0, -0.14, 0.07 * sh.thorax, 0.14, SHELL_FILL, shell);
  ellipse(0, 0.04, 0.03, 0.035, SHELL_FILL, shell);
  ellipse(0, 0.26, 0.155 * sh.gaster, 0.19 * sh.gaster, SHELL_FILL, shell);

  // --- the organs inside -----------------------------------------------------
  glow(by.brain, (c) => { ellipse(-0.03 * head, -0.37, 0.04 * head, 0.045 * head, c); ellipse(0.03 * head, -0.37, 0.04 * head, 0.045 * head, c); });
  glow(by.eyes, (c) => { for (const sd of [-1, 1]) ellipse(sd * 0.105 * head, -0.39, 0.025 * sh.eyes, 0.035 * sh.eyes, c); });
  glow(by.mouth, (c) => {
    const open = by.mouth.level > 0.5 ? Math.sin(now * 10) * 0.012 : 0;
    for (const sd of [-1, 1]) path([[sd * 0.04, -0.46], [sd * (0.035 + open), -0.51], [sd * 0.01, -0.53]], c, 2);
  });
  glow(mus, (c) => { ellipse(0, -0.19, 0.045 * sh.thorax, 0.05, c); ellipse(0, -0.09, 0.04 * sh.thorax, 0.045, c); });
  // Hemolymph: the dorsal vessel, from the gaster to the head, beating.
  glow(by.hemolymph, (c) => {
    g.setLineDash([4 * s, 3 * s]);
    g.lineDashOffset = -now * 20 * (0.3 + by.hemolymph.level);
    path([[0, 0.4], [0, 0.04], [0, -0.3]], c, 2.2);
    g.setLineDash([]);
  });
  glow(by.crop, (c) => ellipse(0, 0.15, 0.07 * sh.gaster, 0.055 * sh.gaster * (0.6 + 0.6 * by.crop.level), c));
  glow(by.fat, (c) => { for (const sd of [-1, 1]) ellipse(sd * 0.1 * sh.gaster, 0.27, 0.035, 0.08 * sh.gaster, c); });
  glow(by.ovary, (c) => { for (const sd of [-1, 1]) ellipse(sd * 0.04, 0.3, 0.025, 0.045, c); });
  glow(by.tubules, (c) => {
    for (const sd of [-1, 1]) path([[0, 0.4], [sd * 0.05, 0.37], [sd * 0.08, 0.41], [sd * 0.05, 0.44]], c, 1.4);
  });
  // The cuticle: heat, cold or rain on her shell, as a halo around it.
  if (cut.level > 0.15) {
    g.save();
    g.shadowColor = cut.color;
    g.shadowBlur = 14 * s * cut.level;
    g.globalAlpha = 0.35 + 0.5 * cut.level;
    ellipse(0, 0.26, 0.155 * sh.gaster, 0.19 * sh.gaster, null, cut.color, 1.5);
    ellipse(0, -0.37, 0.12 * head, 0.11 * head, null, cut.color, 1.5);
    g.restore();
  }
  // Wounds: cracks on the shell.
  if (cut.wound) {
    const n = Math.ceil((100 - cut.wound.params.health) / 20);
    for (let i = 0; i < n; i++) {
      const v = 0.12 + i * 0.06;
      path([[0.08 - i * 0.03, v], [0.11 - i * 0.03, v + 0.03], [0.09 - i * 0.03, v + 0.05]], '#ff4d4d', 1.4);
    }
  }

  // --- the signal: what sets her going ---------------------------------------
  const driver = organs.find((o) => o.drives);
  if (driver) {
    const from = P(AT[driver.id].x, AT[driver.id].y);
    const brain = P(0, -0.37);
    const legsAt = P(0.2 * legs, -0.05);
    g.save();
    g.setLineDash([5 * s, 4 * s]);
    g.lineDashOffset = -now * 40;
    g.lineWidth = 2 * s;
    g.strokeStyle = driver.color;
    g.shadowColor = driver.color;
    g.shadowBlur = 8 * s;
    g.beginPath();
    if (driver.id !== 'brain') { g.moveTo(...from); g.lineTo(...brain); } else g.moveTo(...brain);
    g.lineTo(...legsAt);
    g.stroke();
    g.restore();
  }

  // --- labels: each organ, out to its side -----------------------------------
  const left = organs.filter((o) => AT[o.id].side < 0).sort((p, q) => AT[p.id].y - AT[q.id].y);
  const right = organs.filter((o) => AT[o.id].side > 0).sort((p, q) => AT[p.id].y - AT[q.id].y);
  const column = (list, side) => {
    const step = (H - 24 * s) / Math.max(1, list.length);
    list.forEach((o, i) => {
      const ly = y + 14 * s + step * (i + 0.5);
      // Close to the body when the pane is wide, at the edge when it is not.
      const reach = 0.36 * L + 100 * s;
      const lx = side < 0 ? Math.max(8 * s, cx - reach) : Math.min(W - 8 * s, cx + reach);
      const [ox, oy] = P(AT[o.id].x, AT[o.id].y);
      g.globalAlpha = o.absent ? 0.25 : 0.35 + 0.65 * o.level;
      g.beginPath();
      g.moveTo(ox, oy);
      g.lineTo(side < 0 ? lx + 92 * s : lx - 92 * s, ly);
      g.strokeStyle = o.color;
      g.lineWidth = 0.8 * s;
      g.stroke();
      g.globalAlpha = 1;
      const align = side < 0 ? 'left' : 'right';
      text(t(`body.organ.${o.id}`), lx, ly - 6 * s, { size: 9.5, bold: Boolean(o.drives), color: o.drives ? o.color : TEXT, align, maxW: 90 * s });
      text(o.absent ? '—' : `${Math.round(o.level * 100)}%${o.drives ? ' ▶' : ''}`, lx, ly + 6 * s, { size: 9, color: o.drives ? o.color : DIM, align });
    });
  };
  column(left, -1);
  column(right, 1);
  return y + H;
}
