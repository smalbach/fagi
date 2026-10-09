// Her diary of bites (CODE.diary; docs/research/plan-codigo-cultural.md): what
// a judge in code may read of her own past, as plain data. One line per bite,
// whatever judged it: the fruit's look, how much she took, her hunger before
// and after, and whether she had bitten that kind before. Nothing of what the
// fruit really is: only what she saw and felt.

import { CODE } from '../config.js';
import { cuesOf } from './cues.js';

// A fruit's look as a plain object: { key, color, shape, smell }.
export function lookObject(key) {
  const look = { key };
  for (const cue of cuesOf(key)) {
    const i = cue.indexOf(':');
    if (i > 0) look[cue.slice(0, i)] = cue.slice(i + 1);
  }
  return look;
}

export function noteBite(fagi, { key, portion, before, after }) {
  if (!CODE.enabled) return;
  const diary = (fagi.diary ??= []);
  const bitten = (fagi.bitten ??= {});   // kinds bitten, kept past the diary's length
  diary.push({
    ...lookObject(key),
    at: Math.round(fagi.age * 10) / 10,
    portion: Math.round(portion * 100) / 100,
    novel: !bitten[key],
    before: Math.round(before * 10) / 10,
    after: Math.round(after * 10) / 10,
    harmed: after > before,
  });
  bitten[key] = true;
  if (diary.length > CODE.diary) diary.shift();
}
