// The ground. It's painted ONCE onto a world-sized canvas and afterwards only
// stamped: that way it can carry relief, patches of earth and moss, grain,
// pebbles and tufts without costing anything per frame.
//
// There's no "ground texture": there's terrain. Two noise fields —height and
// moisture— decide both the color and the light of each patch, and the details
// are sown where they belong: tufts where it's moist, pebbles and cracks where
// the earth is dry.
//
// The light is the same as the rock's and the nest's: top left. That's what
// makes the three things look like they're from the same place.
//
// At the end everything is veiled toward the background color: the ground is
// the stage, not the star, and Fagi and the points must still read on top of it.
//
// The pieces live in terrain/:
//   · ground.js    the world's baked canvas and the order it's painted in
//   · relief.js    noise fields, terrain color and light, grain and clearings
//   · details.js   pebbles, tufts, leaves, moss, roots and cracks
//   · near.js      what gets added when zooming in: zoom grain and close-up detail
//   · shore.js     the damp patch around each puddle
//   · palette.js   the light and colors they all share

export { drawTerrain } from './terrain/ground.js';
export { drawZoomGrain, drawNearDetail } from './terrain/near.js';
export { drawShore } from './terrain/shore.js';
