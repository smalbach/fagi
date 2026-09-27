// The rain and the puddles it leaves.
//
// What makes rain seen from above look like rain isn't the streaks, it's
// everything that comes with it:
//
//   · The sky closes in little by little and opens up the same way. What you see
//     doesn't jump from dry to downpour: `level` rises over a few seconds when it
//     starts and falls when it clears up.
//   · Clouds drift by. Slow patches of shadow carried by the wind.
//   · The ground gets wet and takes a while to dry: it darkens and cools in color.
//   · The drops fall TOWARD the camera. There are three layers: the far ones,
//     short and thin; the near ones, long, thick and blurry. They all spread a
//     little from the center of the view (perspective) and lean with the wind.
//   · Every drop that reaches the ground splashes: a dot, a ring that opens and
//     a few droplets that bounce. On water it leaves ripples.
//   · The downpour comes in gusts: denser curtains that sweep across the screen.
//   · Every now and then, a flash of lightning.
//
// Nothing stores particles: every drop, splash and ripple comes from a hash of
// its index and its cycle, so there's no memory that grows and no randomness to use up.
//
// The pieces live in rain-sprite/:
//   · state.js     what is seen (sky, what falls, wet ground), rising and falling smoothly
//   · ground.js    the wet ground, the overcast light and the splashes (world)
//   · puddles.js   the puddles and the drop ripples on water (world)
//   · drops.js     gusts, drops and lightning, in front of the camera (screen)
//   · util.js      hash, cloud noise, tiles, view and wind

export { rainLook, rainLevel, rainFalling } from './rain-sprite/state.js';
export { drawWetGround, drawOvercast, drawSplashes } from './rain-sprite/ground.js';
export { drawRipples, drawPuddle } from './rain-sprite/puddles.js';
export { drawRainDrops } from './rain-sprite/drops.js';
