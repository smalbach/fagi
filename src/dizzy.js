// Dizziness: turn alternation (DIZZY). Insects keep count of how much they
// have turned to one side, and after a lot of it they turn the other way or go
// straight (correcting behaviour, turn alternation: woodlice, beetles, ants).
// It keeps an animal from going round and round, and takes it straight away
// from what blocked it.
//
// Here: she keeps her heading and position over the last `window` s. If in
// that time she has turned a full circle (`turn` rad) one way without getting
// away from where she began (net way under a quarter of the way walked), she is
// dizzy: for `lasts` s she cannot turn further that way (turnTowards goes
// straight, or the other way), and what she was going for, the thing that kept
// her turning, is out of reach to her from here for `shun` s, so she chooses
// something else or comes at it another way. How much turning it takes, and how
// long it lasts, are hers (×0.7–1.3, drawn once).
//
// Nothing here says what is worth doing; it only notices turning that gets her
// nowhere. Before it (2026-10-10), 18 % of her moving time in the research world
// was spent in such loops, most of it at the trunk of a tree, at a puddle by it,
// or following a scent: one cause each, one trait for all.

import { DIZZY } from './config.js';
import { normalizeAngle } from './vision.js';

const EVERY = 0.25;

const own = (fagi) => (fagi.dizzyK ??= 0.7 + 0.6 * Math.random());

// Called every frame, after she has moved.
export function senseTurning(fagi, dt) {
  if (!DIZZY.enabled) return;
  if (fagi.dizzy && fagi.age >= fagi.dizzy.until) fagi.dizzy = null;
  fagi.turnClock = (fagi.turnClock ?? 0) + dt;
  if (fagi.turnClock < EVERY) return;
  fagi.turnClock = 0;
  const log = (fagi.turnLog ??= []);
  log.push({ t: fagi.age, a: fagi.angle, x: fagi.x, y: fagi.y });
  while (log.length && fagi.age - log[0].t > DIZZY.window) log.shift();
  if (fagi.dizzy || log.length < 3) return;
  let turned = 0;
  let walked = 0;
  for (let i = 1; i < log.length; i++) {
    turned += normalizeAngle(log[i].a - log[i - 1].a);
    walked += Math.hypot(log[i].x - log[i - 1].x, log[i].y - log[i - 1].y);
  }
  const net = Math.hypot(fagi.x - log[0].x, fagi.y - log[0].y);
  if (Math.abs(turned) < DIZZY.turn * own(fagi) || net >= walked / 4) return;
  fagi.dizzy = { dir: Math.sign(turned), until: fagi.age + DIZZY.lasts * own(fagi) };
  fagi.dizzyCount = (fagi.dizzyCount ?? 0) + 1;
  // What she was going for kept her turning: from here it is out of reach.
  const shun = (fagi.shun ??= {});
  for (const ref of [fagi.target, fagi.target?.ref]) if (ref) shun[keyOf(ref)] = fagi.age + DIZZY.shun;
  fagi.turnLog = [];
}

// Dizzy, she does not turn further the way she was going round.
export const turnBlocked = (fagi, step) => Boolean(fagi.dizzy) && Math.sign(step) === fagi.dizzy.dir;

// Things are known by where they are: plain data, saved with her as it is.
const keyOf = (ref) => `${Math.round(ref.x)},${Math.round(ref.y)}`;

// A thing she got dizzy going for, not long enough ago.
export function shunned(fagi, ref) {
  if (!ref || !fagi.shun) return false;
  const k = keyOf(ref);
  const until = fagi.shun[k];
  if (until == null) return false;
  if (fagi.age < until) return true;
  delete fagi.shun[k];
  return false;
}
