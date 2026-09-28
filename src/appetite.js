// Appetite: what the body lets her eat, and when.
//
// Without it a bite is instantaneous and nothing she feels stops the next
// one. The autopsies (scripts/autopsy.js) showed where that leads: inside the
// nest, hungry, she ate one stored ration per frame, two or three poison ones
// in the same second, and "died of hunger" with the pantry still stocked. No
// animal eats like that. Three things any gut does:
//
//   handling : a bite takes time; the next one waits APPETITE.handling seconds;
//   malaise  : after a bite that made her feel bad, for APPETITE.malaise
//              seconds she eats nothing she does not already know is good
//              (post-ingestive malaise, the root of learned taste aversion);
//   aversion : a fruit she never tasted that smells like one that made her sick
//              she does not put in her mouth, unless hunger is desperate
//              (APPETITE.desperate). One bad experience is enough, and it sticks
//              to the smell, not to the color or the shape: that is how learned
//              taste aversion works in animals (Garcia & Koelling 1966). The
//              traits taken together (learned/cues.js wariness) can also put her
//              off, as they already do her curiosity;
//   poison   : a death that harmful bites in the last APPETITE.poisonWindow
//              seconds brought about is called what it was, poisoning.
//
// And one thing thirst does: with a moderate thirst and no idea where water
// is, she stops gathering and goes looking for it (decision/provide.js
// `thirstSearch`), instead of waiting until it is critical.
//
// APPETITE.enabled = 0 leaves eating exactly as it was.

import { APPETITE, HUNGER, CUES, CARRY } from './config.js';
import { cuesOf, predict, wariness } from './learned/cues.js';

export const appetiteOn = () => Boolean(APPETITE.enabled);

// Does the thought of eating `key` put her off? What she tasted and found bad
// does; what she never tasted does if it smells like something that made her
// sick, or if its traits together warn her. Always no without appetite.
export function aversive(fagi, key) {
  if (!APPETITE.enabled) return false;
  const r = fagi.brain.facts[key];
  if (r && r.tries > 0) return r.value < 0;
  const traits = CUES.enabled ? cuesOf(key) : [];
  if (!traits.length) return false;
  const smell = traits.find((c) => c.startsWith('smell:'));
  if (smell && (fagi.brain.cues[smell]?.w ?? 0) <= -APPETITE.smellAversion) return true;
  return wariness(predict(fagi.brain.cues, traits)) >= APPETITE.averse;
}

// May she take a bite of `key` right now? Always yes without appetite.
export function canEat(fagi, key) {
  if (!APPETITE.enabled) return true;
  if (fagi.age < (fagi.nextBiteAt ?? 0)) return false;
  const r = fagi.brain.facts[key];
  if (fagi.age < (fagi.malaiseUntil ?? 0)) return Boolean(r && r.tries > 0 && r.value > 0);
  return !aversive(fagi, key) || fagi.hunger / HUNGER.max >= APPETITE.desperate;
}

// Food she can do nothing with right now: she cannot eat it, and she would not
// carry it either (her mandibles are full, or she is hungry and it is food she
// wants, not work). Chasing it would only leave her standing on it.
export function uselessNow(fagi, key) {
  if (!APPETITE.enabled || canEat(fagi, key)) return false;
  return Boolean(fagi.carrying) || fagi.hunger >= CARRY.eatBelow;
}

// After each bite: when the next may come, and whether it left her sick.
// `hungerAdded` is what the bite did to hunger (> 0: it harmed).
export function afterBite(fagi, reward, hungerAdded, key) {
  if (!APPETITE.enabled) return;
  fagi.nextBiteAt = fagi.age + APPETITE.handling;
  if (reward < 0) fagi.malaiseUntil = fagi.age + APPETITE.malaise;
  if (hungerAdded > 0) (fagi.poison ??= []).push({ at: fagi.age, dose: hungerAdded, key });
}

// Is she sick right now (for the HUD and the observation)?
export const nauseous = (fagi) => APPETITE.enabled && fagi.age < (fagi.malaiseUntil ?? 0);

// What she died of, when hunger is what overflowed: poisoning if, without what
// harmful bites added in the last APPETITE.poisonWindow seconds, she would
// not have reached the limit.
export function hungerCause(fagi) {
  if (!APPETITE.enabled) return 'hunger';
  const dose = (fagi.poison ?? []).filter((p) => fagi.age - p.at <= APPETITE.poisonWindow).reduce((a, p) => a + p.dose, 0);
  return dose > 0 && fagi.hunger - dose < HUNGER.max ? 'poison' : 'hunger';
}
