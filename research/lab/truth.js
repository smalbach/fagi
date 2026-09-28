// Ground truth: what the lab knows and the ants never read. Everything here
// measures; nothing decides.

import { feedOf, cuesOfTraits, speciesKey } from '../../src/chemistry.js';
import { verdict, traitsMatch } from '../../src/learned/rules.js';

// Is a rule false under this chemistry, over the species of the catalogue it
// covers? An 'avoid' is false when most of what it covers is not poison; a
// 'prefer', when most of it is. A rule that covers nothing in the catalogue
// is neither (null).
export function ruleIsFalse(r, chem, catalogue) {
  const covered = catalogue.filter((traits) => {
    const key = speciesKey(traits);
    return r.when.key ? r.when.key === key : traitsMatch(r, key, cuesOfTraits(traits));
  });
  if (!covered.length) return null;
  const poison = covered.filter((t) => feedOf(chem, t) === 'poison').length;
  const bad = r.verdict === 'avoid' ? covered.length - poison : poison;
  return bad > covered.length / 2;
}

// How well what she would do matches the truth, over the whole catalogue
// (fruit she never met included: that is where reasons and conclusions
// differ). She "avoids" a fruit when her rules forbid pursuing it.
//   hit:  poison she avoids;  miss: poison she does not;
//   fa:   non-poison she avoids (a false alarm: a meal lost).
// Balanced accuracy weighs both kinds of error alike.
export function accuracy(fagi, chem, catalogue) {
  let hit = 0; let miss = 0; let fa = 0; let ok = 0;
  for (const traits of catalogue) {
    const avoids = verdict(fagi, 'pursue', speciesKey(traits)) === 'avoid';
    if (feedOf(chem, traits) === 'poison') { if (avoids) hit++; else miss++; }
    else if (avoids) fa++; else ok++;
  }
  const tpr = hit + miss ? hit / (hit + miss) : 1;
  const tnr = fa + ok ? ok / (fa + ok) : 1;
  return { hit, miss, fa, ok, balanced: (tpr + tnr) / 2 };
}

// Her live rules that are false now, and of those, the ones she did not live.
export function falseRules(fagi, chem, catalogue) {
  const out = { held: 0, false: 0, myths: 0, ids: [] };
  for (const r of fagi.brain.rules.list) {
    if (r.retired) continue;
    out.held += 1;
    if (ruleIsFalse(r, chem, catalogue)) {
      out.false += 1;
      if (r.source && r.source.kind !== 'saw') out.myths += 1;
      out.ids.push(r.origin ?? r.id);
    }
  }
  return out;
}
