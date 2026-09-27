// "Ask Fagi": click a fruit (or a tree, for the fruit it bears) and a card says
// what she thinks of eating it and why, with the bites behind it
// (learned/explain.js). It stays open and keeps itself current: if she
// learns something while it is open, the answer changes in front of you.

import { TREE } from './config.js';
import { t, tx, onLangChange } from './i18n.js';
import { isTree } from './obstacles.js';
import { explain, lines } from './learned/explain.js';

const REACH = 18;   // world px around the click where a fruit counts as clicked

// The fruit kind under a world point: a fruit on the ground, or what a tree bears.
export function fruitAt(world, x, y) {
  let best = null;
  for (const p of world.points ?? []) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d <= REACH + (p.r ?? 0) && (!best || d < best.d)) best = { d, key: p.type };
  }
  if (best) return best.key;
  const tree = (world.objects ?? []).find((o) => isTree(o) && Math.hypot(o.x - x, o.y - y) <= (o.r ?? 0) + 6);
  return tree ? tree.fruit ?? TREE.fruit : null;
}

export function createAskCard(el) {
  if (!el) return { show() {}, update() {}, hide() {} };
  let key = null;
  let seen = null;   // what the card was last painted from

  function paint(fagi) {
    if (!key) {
      el.innerHTML = `<p>${t('why.nothingThere')}</p>`;
      return;
    }
    const body = lines(explain(fagi, key)).map((l, i) => `<p${i === 0 ? ' class="stance"' : ''}>${tx(l)}</p>`).join('');
    el.innerHTML = `<header><b>${t('why.title', { what: { key: `type.${key}` } })}</b>`
      + `<button type="button" aria-label="${t('why.close')}">×</button></header>${body}`;
    el.querySelector('button').addEventListener('click', hide);
  }

  function show(fagi, world, x, y) {
    key = fruitAt(world, x, y);
    seen = null;
    el.hidden = false;
    update(fagi);
  }

  // Repaints only when what she knows changed (or the language did).
  function update(fagi) {
    if (el.hidden || !fagi) return;
    const version = `${fagi.brain.version ?? 0}:${fagi.brain.rules.seq}`;
    if (seen?.fagi === fagi && seen.version === version) return;
    seen = { fagi, version };
    paint(fagi);
  }

  function hide() {
    el.hidden = true;
    key = null;
  }

  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  onLangChange(() => { seen = null; });
  return { show, update, hide };
}
