// Wind in the crown: the crown and its branches move with it, the trunk does not.

// How far the crown shifts: a fixed lean downwind plus a slow sway. Each tree
// has its own phase, so they do not all move in unison.
export function swayOf(wind, now, r, seedOf, dry) {
  const t = now / 1000;
  const phase = ((seedOf % 1000) / 1000) * Math.PI * 2;
  // Without leaves there is less sail: a dry tree moves much less.
  const leaf = 1 - dry * 0.6;
  const push = r * 0.035 * leaf;
  const breath = r * 0.03 * leaf * Math.sin(t * 0.85 + phase) * (0.7 + 0.3 * Math.sin(t * 2.1 + phase));
  const d = push + breath;
  return { x: Math.cos(wind?.angle ?? 0) * d, y: Math.sin(wind?.angle ?? 0) * d * 0.55 };
}
