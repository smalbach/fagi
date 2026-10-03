// The stomach in two stages (STOMACH; LIBERA phase 4, H6). Without it, a bite
// takes hunger away at once. With it, as in a real animal, a bite first fills
// her stomach, and the stomach empties into her body at STOMACH.rate: hunger
// falls only as it digests. What she feels, though, is the full stomach: her
// appetite is her hunger less what is already in it (× STOMACH.satiety), so
// she can stop eating before the food has reached her, and not keep eating
// until it does (anticipatory satiety; Gibbs & Smith on gut satiety signals).
//
// Only appetite and what she learns from a bite read the felt hunger; what
// harms or kills her is the hunger she really has. A full stomach holds
// STOMACH.capacity hunger points (× her gut with MORPH); what does not fit is
// wasted. Off, nothing here runs and every hunger is the real one.

import { STOMACH, HUNGER } from './config.js';
import { bodyMult } from './biology.js';

export const stomachOn = () => Boolean(STOMACH.enabled);

// The hunger she feels.
export const feltHunger = (fagi) => (stomachOn() ? Math.max(0, fagi.hunger - STOMACH.satiety * (fagi.stomach ?? 0)) : fagi.hunger);
export const feltHungerU = (fagi) => feltHunger(fagi) / HUNGER.max;

// A bite that would take `relief` hunger points away goes into the stomach,
// as much as fits. Returns how much went in.
export function fill(fagi, relief) {
  const room = Math.max(0, STOMACH.capacity * bodyMult(fagi, 'digest') - (fagi.stomach ?? 0));
  const take = Math.min(relief, room);
  fagi.stomach = (fagi.stomach ?? 0) + take;
  fagi.wasted = (fagi.wasted ?? 0) + (relief - take);
  return take;
}

// Once a frame: the stomach empties into her body.
export function digest(fagi, dt) {
  if (!stomachOn() || !fagi.stomach) return;
  const d = Math.min(fagi.stomach, STOMACH.rate * dt);
  fagi.stomach -= d;
  fagi.hunger = Math.max(0, fagi.hunger - d);
}
