// The brain map: how Fagi is thinking RIGHT NOW, step by step, and
// how what she has learned enters into that reckoning.
//
//   1. Feel      — the body: hunger, thirst, energy and the effects she carries.
//   2. Perceive  — what she sees, smells or remembers, with its score broken down
//      and score   (belief + curiosity + need + distance) against the
//                  minimum needed to move.
//      Remember  — the learned memory of each thing: its weight against the
//                  thresholds that turn it into a rule, how much she trusts it, which
//                  stage it's at (short, medium, long) and the written rule if any.
//   3. Instinct  — the tiers of the survive directive, in order; the
//                  first one that answers wins.
//   4. Decide    — the action, its why, and whether something new made her reconsider.
//   5. Learn     — the last experience: what she tried, what she felt, how it moved
//                  the belief and which rule she wrote or revised.
//   6. Network   — the neurons and their synapses, with the signal running now.
//   7. Mental    — what she remembers of the place: where she has been, where she
//      map         thinks the water and the tree are, and her home.
//
// It computes nothing that isn't already computed: it reads fagi.thought (decision.js),
// fagi.brain (memory.js, learned/) and fagi.lastEpisode (episodes.js). The canvas
// height comes from what needs drawing; the panel scrolls.
//
// Only the panel lives here (size, expand, the status line) and the order of
// the sections; each section is painted in its own brainmap/ module, with the
// shared brushes from brainmap/brushes.js.

import { t } from './i18n.js';
import { createBrushes } from './brainmap/brushes.js';
import { paintFeel } from './brainmap/feel.js';
import { paintPerceive } from './brainmap/perceive.js';
import { paintInstinct } from './brainmap/instinct.js';
import { paintDecide } from './brainmap/decide.js';
import { paintLearn } from './brainmap/learn.js';
import { paintNetwork } from './brainmap/network.js';
import { paintMentalMap } from './brainmap/mental-map.js';

export function createBrainMap(canvas, statusEl, expandBtn) {
  if (!canvas) return { update() {} };
  const brushes = createBrushes(canvas);

  // Expand: the whole panel takes up almost the entire screen.
  const pane = canvas.closest('.pane');
  function big(isBig) {
    pane?.classList.toggle('brainmap-big', isBig);
    if (!expandBtn) return;
    expandBtn.dataset.i18n = isBig ? 'brainmap.close' : 'brainmap.expand';   // bindDom re-translates it
    expandBtn.textContent = t(expandBtn.dataset.i18n);
  }
  function closeBig() { if (pane?.classList.contains('brainmap-big')) big(false); }
  expandBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    big(!pane?.classList.contains('brainmap-big'));
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBig(); });

  function state(fagi) {
    if (!statusEl) return;
    const activeOnes = fagi.brain.rules.list.filter((r) => !r.retired);
    const retiredList = fagi.brain.rules.list.filter((r) => r.retired);
    statusEl.textContent = t('brainmap.status', {
      beliefs: Object.keys(fagi.brain.facts).length,
      active: activeOnes.length,
      retired: retiredList.length,
      events: fagi.brain.lastRule?.n ?? 0,
    });
  }

  // The seven sections, one below another: each starts where the previous
  // one ended and returns where it ends. The total is the canvas height.
  function everything(fagi, worldState) {
    brushes.begin();
    let y = 12 * brushes.s;
    y = paintFeel(brushes, fagi, y);
    y = paintPerceive(brushes, fagi, y);
    y = paintInstinct(brushes, fagi, y);
    y = paintDecide(brushes, fagi, y);
    y = paintLearn(brushes, fagi, y);
    y = paintNetwork(brushes, fagi, y);
    return paintMentalMap(brushes, fagi, worldState, y);
  }

  function update(fagi, world = null) {
    state(fagi);
    if (!canvas.getBoundingClientRect().width) return;   // panel collapsed or hidden
    if (brushes.cssW === 0) brushes.adjust(200);
    const tall = everything(fagi, world);
    // The height changed (more beliefs, more neurons): resizing clears the
    // canvas, so it's painted again in the same frame.
    if (brushes.adjust(Math.ceil(tall))) everything(fagi, world);
  }

  return { update };
}
