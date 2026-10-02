// The silhouettes of the three body parts. They only trace the path: whoever
// uses them decides whether to clip, fill or outline with them.

// The gaster: an egg with the tip at the back, not a circle. The tip is what
// shows which way she is heading when seen from afar.
export function gasterPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-3.4, 0);
  ctx.bezierCurveTo(-4.0, -4.3, -7.2, -6.3, -10.4, -6.1);
  ctx.bezierCurveTo(-13.6, -5.9, -16.0, -3.4, -16.4, 0);
  ctx.bezierCurveTo(-16.0, 3.4, -13.6, 5.9, -10.4, 6.1);
  ctx.bezierCurveTo(-7.2, 6.3, -4.0, 4.3, -3.4, 0);
  ctx.closePath();
}

// The mesosoma: the block the legs come out of. Humped at the front
// —the pronotum— and sloping at the back, where the waist starts.
export function mesosomaPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-1.4, 0);
  ctx.bezierCurveTo(-1.6, -2.6, 0.4, -3.9, 2.4, -3.8);
  ctx.bezierCurveTo(4.2, -3.7, 5.3, -2.6, 5.5, -1.1);
  ctx.bezierCurveTo(5.7, 0, 5.7, 0, 5.5, 1.1);
  ctx.bezierCurveTo(5.3, 2.6, 4.2, 3.7, 2.4, 3.8);
  ctx.bezierCurveTo(0.4, 3.9, -1.6, 2.6, -1.4, 0);
  ctx.closePath();
}

// The head: wide at the back and narrowing toward the mouth. Seen from above,
// it is what tells an ant from a beetle.
export function headPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(5.8, -2.1);
  ctx.bezierCurveTo(5.8, -4.3, 7.2, -5.0, 8.8, -4.9);
  ctx.bezierCurveTo(10.3, -4.8, 11.2, -3.4, 11.4, -1.7);
  ctx.bezierCurveTo(11.6, -0.6, 11.6, 0.6, 11.4, 1.7);
  ctx.bezierCurveTo(11.2, 3.4, 10.3, 4.8, 8.8, 4.9);
  ctx.bezierCurveTo(7.2, 5.0, 5.8, 4.3, 5.8, 2.1);
  ctx.closePath();
}
