// The silhouettes of the three body parts. They only trace the path: whoever
// uses them decides whether to clip, fill or outline with them.

// A closed, smooth outline through `top` (the left half, front to back, y < 0)
// and its mirror: an ant is symmetric, and drawing one half keeps it so.
// Catmull-Rom through the points, so no corner shows unless two points meet.
function mirrored(ctx, top) {
  const pts = [...top, ...top.slice(1, -1).reverse().map(([x, y]) => [x, -y])];
  const n = pts.length;
  const at = (i) => pts[(i + n) % n];
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const [x0, y0] = at(i - 1);
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    const [x3, y3] = at(i + 2);
    ctx.bezierCurveTo(
      x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6,
      x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6,
      x2, y2
    );
  }
  ctx.closePath();
}

// The gaster: a long egg with the tip at the back, not a ball. The tip is what
// shows which way she is heading when seen from afar.
export function gasterPath(ctx) {
  mirrored(ctx, [
    [-3.4, 0],
    [-3.6, -1.3],
    [-4.5, -2.8],
    [-6.1, -4.2],
    [-9.0, -4.9],
    [-12.1, -4.4],
    [-14.4, -2.8],
    [-15.7, 0],
  ]);
}
export const GASTER = { x: -9.6, rx: 6.2, ry: 4.9 };

// The mesosoma: the long, slender block the legs come out of. Seen from above
// it is not one oval but three plates in a row —pronotum, mesonotum,
// propodeum— each narrower than the one before, pinched where they meet.
export function mesosomaPath(ctx) {
  mirrored(ctx, [
    [5.8, 0],
    [5.6, -1.3],
    [4.8, -2.35],   // pronotum: the shoulders
    [3.7, -2.3],
    [3.0, -1.85],   // promesonotal suture
    [2.1, -1.85],   // mesonotum
    [1.1, -1.5],
    [0.5, -1.2],    // metanotal groove
    [-0.4, -1.35],  // propodeum
    [-1.3, -1.1],
    [-1.7, 0],
  ]);
}
export const MESOSOMA_PLATES = [
  { x: 4.4, rx: 1.7, ry: 2.4 },
  { x: 2.0, rx: 1.2, ry: 1.9 },
  { x: -0.6, rx: 1.3, ry: 1.4 },
];

// Where the mesosoma's plates meet, from front to back.
export const MESOSOMA_SUTURES = [[3.0, 1.6], [0.5, 1.0]];

// The head: rounded at the back, with a shallow notch in the middle of its
// rear edge, and narrowing toward the mouth. Seen from above, it is what tells
// an ant from a beetle.
export function headPath(ctx) {
  mirrored(ctx, [
    [11.8, 0],
    [11.6, -1.6],
    [11.0, -3.0],
    [9.8, -3.9],
    [8.2, -4.05],
    [6.9, -3.5],
    [6.1, -2.3],
    [5.9, -0.9],
    [6.25, 0],      // the notch at the back of the head
  ]);
}
export const HEAD = { x: 8.8, rx: 3.3, ry: 4.0 };
