// The body map: her skeleton and her organs, and what each is setting off
// RIGHT NOW. The brain map (brainmap.js) shows how she thinks; this shows the
// body that feeds that thinking and carries it out.
//
//   1. Body      — the exoskeleton seen from above with the organs inside it,
//                  each glowing as hard as it is working; the organ whose
//                  signal her winning line answers to sends a running signal
//                  to the brain and on to the legs (bodymap/anatomy.js).
//   2. Organs    — one row each: how hard it works, its size against her
//                  genes (MORPH), what it reads now and the line it sets off.
//
// Like the brain map it computes nothing: it reads what the simulation keeps
// (bodymap/organs.js). The mental map pane next to it reuses the brain map's
// own painter (brainmap/mental-map.js).

import { t, tx } from './i18n.js';
import { watchShown, every } from './pane-visibility.js';
import { createBrushes } from './brainmap/brushes.js';
import { paintMentalMap } from './brainmap/mental-map.js';
import { readOrgans } from './bodymap/organs.js';
import { paintAnatomy } from './bodymap/anatomy.js';
import { DIM, TEXT, ROW_BG } from './brainmap/palette.js';

// A canvas pane that can be enlarged, painted by `paint(brushes, ...args, y)`.
function canvasPane(canvas, expandBtn, paint) {
  if (!canvas) return { ready: () => false, paint() {} };
  const brushes = createBrushes(canvas);
  const pane = canvas.closest('.pane');
  function big(isBig) {
    pane?.classList.toggle('brainmap-big', isBig);
    if (!expandBtn) return;
    expandBtn.dataset.i18n = isBig ? 'brainmap.close' : 'brainmap.expand';
    expandBtn.textContent = t(expandBtn.dataset.i18n);
  }
  expandBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    big(!pane?.classList.contains('brainmap-big'));
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pane?.classList.contains('brainmap-big')) big(false); });

  function everything(...args) {
    brushes.begin();
    return paint(brushes, ...args, 12 * brushes.s);
  }
  // Painted only while it can be seen (tab shown, pane open, in sight), and
  // a few times a second.
  const shown = watchShown(canvas.closest('.pane-body') ?? canvas);
  const due = every(66);
  return {
    // Whether it will paint this turn: the caller can skip reading what it shows.
    ready: () => shown() && due(),
    paint(...args) {
      if (brushes.cssW === 0) brushes.adjust(200);
      const tall = everything(...args);
      if (brushes.adjust(Math.ceil(tall))) everything(...args);
    },
  };
}

function paintOrgans(brushes, organs, y) {
  const { s, text, box, bar, header } = brushes;
  const { W, pad, lineH } = brushes.measures();
  header(2, t('body.sec.organs'), y, W, pad);
  y += 16 * s;
  const rowH = lineH * 2.1;
  for (const o of organs) {
    box(pad, y - lineH * 0.55, W - pad * 2, rowH, 5 * s, o.drives ? '#232838' : ROW_BG, o.drives ? o.color : null, 1);
    g(brushes, o.color, pad + 9 * s, y, 4 * s, o.absent ? 0.25 : 0.3 + 0.7 * o.level);
    let x = pad + 18 * s;
    x += text(t(`body.organ.${o.id}`), x, y, { size: 10, bold: true, color: o.absent ? DIM : TEXT }) + 8 * s;
    if (o.size != null) {
      const moved = o.gene != null && Math.abs(o.size - o.gene) > 0.005;
      text(moved ? t('body.sizeMoved', { now: o.size.toFixed(2), gene: o.gene.toFixed(2) }) : t('body.size', { now: o.size.toFixed(2) }), x, y, { size: 9, color: DIM });
    }
    const bw = 70 * s;
    bar(W - pad - bw - 8 * s, y - 2.5 * s, bw, 5 * s, o.level, o.color);
    const y2 = y + lineH * 0.95;
    let line = tx({ key: o.key, params: o.params });
    if (o.wound) line += ` · ${tx(o.wound)}`;
    const drives = o.drives ? `  ▶ ${t('body.drives', { line: o.drives })}` : '';
    text(line, pad + 18 * s, y2, { size: 9, color: DIM, maxW: W - pad * 2 - 26 * s - (drives ? 150 * s : 0) });
    if (drives) text(drives.trim(), W - pad - 8 * s, y2, { size: 9, bold: true, color: o.color, align: 'right', maxW: 150 * s });
    y += rowH + 4 * s;
  }
  return y;
}

function g(brushes, color, x, y, r, alpha) {
  const ctx = brushes.g;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8 * brushes.s * alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function createBodyMap(canvas, statusEl, expandBtn) {
  const pane = canvasPane(canvas, expandBtn, (brushes, fagi, organs, y) => {
    const { W, pad } = brushes.measures();
    brushes.header(1, t('body.sec.body'), y, W, pad);
    y = paintAnatomy(brushes, fagi, organs, y + 8 * brushes.s);
    return paintOrgans(brushes, organs, y + 8 * brushes.s) + 4 * brushes.s;
  });
  return {
    update(fagi) {
      if (!fagi || !pane.ready()) return;
      const organs = readOrgans(fagi);
      if (statusEl) {
        const d = organs.find((o) => o.drives);
        statusEl.textContent = d
          ? t('body.status', { organ: t(`body.organ.${d.id}`), line: d.drives, n: organs.filter((o) => o.level >= 0.5).length })
          : t('body.statusIdle', { n: organs.filter((o) => o.level >= 0.5).length });
      }
      pane.paint(fagi, organs);
    },
  };
}

export function createMentalMapPane(canvas, expandBtn) {
  const pane = canvasPane(canvas, expandBtn, (brushes, fagi, world, y) => paintMentalMap(brushes, fagi, world, y));
  return {
    update(fagi, world) {
      if (pane.ready()) pane.paint(fagi, world);
    },
  };
}
