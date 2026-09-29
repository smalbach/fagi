// 7. Explore or come back (phase 9, spec §12.11) — her own wiring for the
// question "where do I look for food?": a line from the need to each option
// she has (every site she remembers, and exploring), as thick as the chance
// she would take it now, with what each is worth to her. Two sisters on the
// same map draw different wirings: what they lived made them so.
// Below: how noisy she is when she chooses and why, her last decisions and
// how they went, and the pantry she predicts at home.
//
// Only with SITES, CHOICE or LARDER on; otherwise the section isn't drawn.

import { labelOf, t } from '../i18n.js';
import { GREEN, RED, YELLOW, TEXT, DIM } from './palette.js';
import { choiceView } from '../choice.js';
import { larderView } from '../larder.js';

const valueColor = (v) => (v >= 0.6 ? GREEN : v >= 0.3 ? YELLOW : RED);

export function paintForage(brushes, fagi, y) {
  const view = choiceView(fagi);
  const sites = fagi.brain.sites ?? [];
  const larder = larderView(fagi);
  if (!view && !sites.length && !larder) return y;

  const { g, s, text, header, bar, chip } = brushes;
  const { W, pad, lineH } = brushes.measures();
  header(7, t('brainmap.sec.forage'), y, W, pad);
  y += 16 * s;

  // The wiring: need → options.
  const options = view?.options ?? sites.map((site) => ({ kind: 'site', id: site.id, u: site.value, p: null, site }));
  if (options.length) {
    const step = 26 * s;
    const tall = options.length * step;
    const x1 = pad + 40 * s;
    const x2 = W * 0.42;
    const yNeed = y + tall / 2;
    const plan = view?.plan;
    options.forEach((o, i) => {
      const yo = y + (i + 0.5) * step;
      const chosen = plan && plan.kind === o.kind && (o.kind === 'explore' || plan.id === o.id);
      const value = o.kind === 'site' ? o.site?.value ?? o.u : o.u;
      g.beginPath();
      g.moveTo(x1, yNeed);
      g.bezierCurveTo((x1 + x2) / 2, yNeed, (x1 + x2) / 2, yo, x2, yo);
      g.strokeStyle = chosen ? '#ffffff' : valueColor(value);
      g.globalAlpha = chosen ? 1 : 0.35 + 0.65 * (o.p ?? 0.5);
      g.lineWidth = Math.max(1, (o.p ?? 0.3) * 7 * s);
      g.stroke();
      g.globalAlpha = 1;
      g.beginPath();
      g.arc(x2, yo, 4 * s, 0, Math.PI * 2);
      g.fillStyle = valueColor(value);
      g.fill();
      const name = o.kind === 'explore'
        ? t('brainmap.forage.explore')
        : t('brainmap.forage.site', { id: o.id, what: o.site?.ref ? labelOf('tree') : t('brainmap.forage.ground') });
      const label = o.p != null ? `${name} · ${Math.round(o.p * 100)}%` : name;
      const room = W - pad - 52 * s - (x2 + 8 * s);   // up to the bar
      text(label, x2 + 8 * s, yo - 5 * s, { size: 9.5, color: chosen ? '#ffffff' : TEXT, bold: chosen, maxW: room });
      const bits = [
        t('brainmap.forage.worth', { v: value.toFixed(2) }),
        o.site ? t('brainmap.forage.visits', { n: o.site.visits, empty: o.site.empties }) : null,
      ].filter(Boolean).join(' · ');
      text(bits, x2 + 8 * s, yo + 6 * s, { size: 8.5, color: DIM, maxW: room });
      bar(W - pad - 44 * s, yo - 3 * s, 44 * s, 5 * s, Math.max(0, value), valueColor(value));
    });
    g.beginPath();
    g.arc(x1, yNeed, 6 * s, 0, Math.PI * 2);
    g.fillStyle = '#e8a33d';
    g.fill();
    text(t('brainmap.forage.need'), pad, yNeed - 12 * s, { size: 9, color: '#e8a33d' });
    y += tall + 6 * s;
  }

  if (view) {
    // Her noise, and where it comes from.
    text(t('brainmap.forage.temper', {
      t: view.temperature.toFixed(2),
      innate: (view.innate ?? 1).toFixed(2),
      surprise: Math.round(view.volatility * 100),
    }), pad, y, { size: 9, color: DIM, maxW: W - pad * 2 });
    y += lineH;
    // Her last decisions and how they went.
    let x = pad;
    for (const e of view.recent) {
      const good = e.outcome === 'found' || e.outcome === 'full';
      const bad = e.outcome === 'empty' || e.outcome === 'nothing';
      const str = `${e.chose === 'explore' ? t('brainmap.forage.explore') : `#${e.site}`} → ${t(`brainmap.forage.outcome.${e.outcome.replace(' ', '')}`)}`;
      const w = brushes.width(str, 9) + 14 * s;
      if (x + w > W - pad) { x = pad; y += lineH; }
      x += chip(str, x, y, good ? GREEN : bad ? RED : DIM, { size: 9 }) + 4 * s;
    }
    if (view.recent.length) y += lineH;
  }

  if (larder) {
    text(t('brainmap.forage.larder', { seen: larder.seen, ago: Math.round(larder.ago), predicted: larder.predicted.toFixed(1), cap: larder.capacity }),
      pad, y, { size: 9, color: DIM, maxW: W - pad * 2 });
    y += lineH;
    text(t('brainmap.forage.larderRate', { rate: (larder.rate * 60).toFixed(2) }), pad, y, { size: 9, color: DIM, maxW: W - pad * 2 });
    y += lineH;
    if (!larder.room) { text(t('brainmap.forage.noRoom'), pad, y, { size: 9, color: YELLOW }); y += lineH; }
  }
  return y + 6 * s;
}
