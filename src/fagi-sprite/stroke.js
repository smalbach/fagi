// Loose strokes Fagi's drawing repeats piece by piece: a filled ellipse, a
// straight line and an elliptical arc. Each one sets its color and its width
// and paints; nothing else.

export function ellipse(ctx, x, y, rx, ry, fill, rot = 0) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

// A round dot: the chitin's grain is built out of them.
export function point(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// A line from one point to another with whatever stroke is already set.
export function line(ctx, x0, y0, x1, y1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

// An unfilled stretch of ellipse: seams, sutures and grooves.
export function arc(ctx, x, y, rx, ry, since, until, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, since, until);
  ctx.stroke();
}

// A segment that thickens from `w0` to `w1`: a filled quad with round ends.
export function taper(ctx, x0, y0, x1, y1, w0, w1, fill) {
  const a = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
  const nx = Math.cos(a);
  const ny = Math.sin(a);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2);
  ctx.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
  ctx.arc(x1, y1, w1 / 2, a, a + Math.PI, true);
  ctx.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2);
  ctx.arc(x0, y0, w0 / 2, a + Math.PI, a, true);
  ctx.closePath();
  ctx.fill();
}
