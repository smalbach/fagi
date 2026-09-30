// The adaptive judge (docs/research/plan-decision-adaptativa.md, step 3),
// registered at the bite point (src/decision/bite.js). Nothing uses it unless
// DECIDE.eat names it; the game never does.
//
//   'model'        model of consequences, horizon 2, evidence that fades with surprise
//   'model-h1'     ablation: the same, horizon 1 (only what the bite itself does)
//   'model-fixed'  ablation: the same, evidence that never fades
//   'model-v1'     the first version, discarded (a trial bite was a quarter of the evidence,
//                  and a safe ration at home did not count)

import { registerJudge } from '../decision/bite.js';
import { adaptiveJudge } from './policy.js';

registerJudge('model', adaptiveJudge({ horizon: 2, adaptive: true }));
registerJudge('model-h1', adaptiveJudge({ horizon: 1, adaptive: true }));
registerJudge('model-fixed', adaptiveJudge({ horizon: 2, adaptive: false }));
// Version 1, as first run and discarded (research/adaptive-decision/development.md).
registerJudge('model-v1', adaptiveJudge({ horizon: 2, adaptive: true, version: 1 }));

export { adaptiveSummary } from './policy.js';
