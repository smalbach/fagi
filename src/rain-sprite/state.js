// ── State of what is seen (not of the world): rises and falls smoothly ──────
//
// A single one for all the rain: every layer that gets painted reads it.
//
// `level` is the sky (clouds, dimmed light) and it opens slowly as it clears up.
// `drops` is what falls (drops, splashes, ripples): it rises with the sky, but
// when it clears up it stops almost dead. Otherwise it kept visibly raining for
// a few seconds with the world already dry, and Fagi seemed to leave the nest in the rain.

export const sky = { level: 0, drops: 0, wetness: 0, before: null };

const RISE = 4;        // s for the sky to close in
const LOW = 6;        // s for it to open up
const STOP_SECS = 0.6;      // s for the drops to stop falling
const WETS = 14;       // s until the ground is soaked
const DRY = 60;       // s until the ground is dry

// Once per frame, before painting any rain.
// `now` in ms of the world's clock: a replay seeking jumps it, and then the
// sky is set as it would be by then instead of easing from where it was.
export function rainLook(world, now) {
  const raw = sky.before == null ? 0 : (now - sky.before) / 1000;
  sky.before = now;
  const on = !!world.rain?.on;
  if (raw < 0 || raw > 2) {
    sky.level = on ? 1 : 0;
    sky.drops = sky.level;
    sky.wetness = on ? 1 : 0;
    return sky.level;
  }
  const dt = Math.min(0.1, raw);
  sky.level = on ? Math.min(1, sky.level + dt / RISE) : Math.max(0, sky.level - dt / LOW);
  sky.drops = on ? sky.level : Math.max(0, sky.drops - dt / STOP_SECS);
  sky.wetness = on ? Math.min(1, sky.wetness + dt / WETS) : Math.max(0, sky.wetness - dt / DRY);
  return sky.level;
}

export const rainLevel = () => sky.level;
export const rainFalling = () => sky.drops;
