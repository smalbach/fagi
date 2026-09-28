// Fagi's light and shadow: the world's light seen from inside the body, and
// the shadow she casts on the ground.

const LIGHT = -Math.PI * 0.72;

// The body turns; the world's light does not. Inside the drawing it has to be
// turned the opposite way so the back always shines on the same side of the map.
export function localLight(angle) {
  const a = LIGHT - angle;
  return { x: Math.cos(a), y: Math.sin(a) };
}

// The shadow she casts on the ground: a single blot for the whole body, laid
// out opposite the light. Without it she floats.
export function shadow(ctx, L, alive) {
  ctx.save();
  ctx.translate(-L.x * 2.6, -L.y * 2.6);
  ctx.rotate(0.06);
  const g = ctx.createRadialGradient(-3, 0, 1.5, -3, 0, 15);
  g.addColorStop(0, `rgba(6,8,11,${alive ? 0.42 : 0.3})`);
  g.addColorStop(0.55, 'rgba(6,8,11,0.18)');
  g.addColorStop(1, 'rgba(6,8,11,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(-3, 0, 15, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
