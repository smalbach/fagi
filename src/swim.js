// Deep water. She doesn't swim (like an ant her size): surface tension traps her and she
// flails almost without moving, wearing herself out. That's physics and it always happens to her
// (movement.js slows her down, needs.js charges her the energy, decision.js takes her to
// the nearest shore). What she doesn't know from birth is that deep water is a
// bad idea: she learns it by sinking, just as she learns which fruit disagrees with her.
//
// Each stretch in deep water is an experience: on getting out (or after WATER.sample
// seconds inside, if she's still trapped) she feels what it cost her —moving at a
// flailing pace and the energy she lost— and that lowers the belief 'deep'. When
// it weighs enough, synth.js writes the rule "avoid deep" and from then on
// she goes around it like a rock (fearsDeep). Drinking in the shallows doesn't count: she can stand there.
//
// And three more things about the body, which aren't learned either:
//   · soaked: on leaving deep water, or in the rain outside the nest, the water
//     clings to her and she's slower until she dries (fagi.wet, seconds she has left).
//   · antennae: they notice the water a little before she steps in it, and she moves forward probing
//     while they're over deep water (fagi.probing). It's the signal by which she
//     later recognizes deep water: perceiving it connects antennae→deep (Hebb).

import { WATER, FAGI } from './config.js';
import { learn } from './brain.js';
import { verdict } from './learned/rules.js';
import { waterZone } from './obstacles.js';
import { hebb } from './synapses.js';
import { nestUnder } from './nest.js';

export const DEEP = 'deep';

// Has she learned not to go in yet? The written rule says so, not an instinct.
export function fearsDeep(fagi) {
  return verdict(fagi, 'pursue', DEEP) === 'avoid';
}

function learnFrom(fagi, dunk) {
  // Losing her footing is scary in itself; however long the flailing lasts makes it worse.
  const part = WATER.shock + (1 - WATER.shock) * Math.min(1, dunk.secs / WATER.sample);
  const lost = Math.max(0, dunk.energy - fagi.energy);
  const change = learn(fagi.brain, DEEP, -WATER.lesson * part, fagi.age, [
    { sense: 'speed', v: WATER.swimSpeed },
    { sense: 'energy', v: -Math.round(lost * 100) / 100 },
  ]);
  fagi.dunks = (fagi.dunks ?? 0) + 1;
  fagi.lastDunk = {
    n: fagi.dunks, secs: dunk.secs,
    beliefBefore: change.before.value, beliefAfter: change.after.value,
  };
}

// Called once per frame, before deciding: keeps fagi.swimming up to date and
// closes the experience when it's time.
// Does she have an antenna over deep water? The two tips, a little ahead.
function antennaeInWater(fagi, world) {
  const far = FAGI.radius + WATER.probeReach;
  for (const sideOf of [-0.35, 0.35]) {
    const a = fagi.angle + sideOf;
    if (waterZone(world, fagi.x + Math.cos(a) * far, fagi.y + Math.sin(a) * far)?.deep) return true;
  }
  return false;
}

export function swim(fagi, world, dt) {
  const zone = waterZone(world, fagi.x, fagi.y);
  const deep = Boolean(zone?.deep);
  fagi.swimming = deep;
  // In the rain, outside the nest, she gets soaked just as in deep water.
  fagi.raining = Boolean(world.rain?.on);
  const sheltered = Boolean(nestUnder(fagi, world));
  fagi.wet = deep || (fagi.raining && !sheltered) ? WATER.dryTime : Math.max(0, (fagi.wet ?? 0) - dt);
  fagi.probing = !deep && antennaeInWater(fagi, world);
  if (fagi.probing) {
    fagi.probed = true;
    if (fagi.brain.synapses) hebb(fagi.brain.synapses, 'sense:antennae', `key:${DEEP}`, dt, fagi.age);
  }

  if (deep && !fagi.dunk) fagi.dunk = { secs: 0, energy: fagi.energy };
  const dunk = fagi.dunk;
  if (!dunk) return;
  if (deep) dunk.secs += dt;

  if (!deep || dunk.secs >= WATER.sample) {
    learnFrom(fagi, dunk);
    fagi.dunk = deep ? { secs: 0, energy: fagi.energy } : null;
  }
}
