// Step 2's controllers (docs/research/plan-decision-adaptativa.md): who
// answers the decision point (src/decision/point.js) in the battery.
//
//   choice      the learned choice, connected (step 1b): the reference
//   hierarchy   the fixed hierarchy with the choice as it was, unconnected
//               (DECIDE off): Fagi as she is, described only

import { CHOICE, DECIDE } from '../../src/config.js';

export const CONTROLLERS = {
  choice: () => { CHOICE.enabled = 1; DECIDE.enabled = 1; DECIDE.controller = 'choice'; },
  hierarchy: () => { CHOICE.enabled = 1; DECIDE.enabled = 0; },
};

export function setup(name) {
  const s = CONTROLLERS[name];
  if (!s) throw new Error(`unknown controller ${name}`);
  s();
}
