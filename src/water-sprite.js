// The lake. The water used to be a translucent circle with a blue rim; now it's
// a real pond, and what makes it a lake is four things, not the color:
//
//   · The shoreline isn't a circle: it winds. A perfect edge reads as
//     interface, not as water.
//   · It has a bottom. There's dark deep water in the middle and bright shallows
//     hugging the shore, with sand and stones visible beneath the water.
//   · It has mud around it: the earth the water has soaked and Fagi churns up
//     when she wades in, with loose pebbles.
//   · And it moves. The sky's glint shimmers, ripples spread from the center and
//     the reeds on the shore bend with the SAME wind that carries the smells,
//     just like the tree's crown.
//
// The still parts are painted once onto a canvas (bottom, sand, stones, mud) and
// the live parts are drawn on top every frame, which is little: a few
// reflections, three ripples and the reeds. The circle that decides where she
// drinks is still the object's radius: the drawn shore hugs it, it doesn't rule.
//
// The pieces live in water-sprite/:
//   · lake.js        drawLake: picks photo or drawing and caches the canvases
//   · realistic.js   the photographic pond with its reflections
//   · still.js       the still canvas: water, baked waves, rim and mud
//   · bed.js         what shows of the bottom: sand, stones, algae, caustics
//   · surface.js     the water's live parts: light, ripples, glints, rings, specks
//   · reeds.js       the reeds on the shore, bent by the wind
//   · shape.js       the light, the colors and the shoreline profile

export { drawLake } from './water-sprite/lake.js';
