import { TERRAIN } from '../config.js';

// Orilla: lo único del suelo que NO se cuece en el lienzo. El jugador pone y
// quita charcos, y una mancha de humedad sin agua debajo sería mentira, así que
// se pinta cada fotograma pegada a su charco.
export function drawShore(ctx, o, r) {
  const g = ctx.createRadialGradient(o.x, o.y, r * 0.9, o.x, o.y, r * TERRAIN.shore);
  g.addColorStop(0, 'rgba(24,30,28,0.55)');
  g.addColorStop(0.45, 'rgba(30,38,34,0.3)');
  g.addColorStop(1, 'rgba(30,38,34,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(o.x, o.y, r * TERRAIN.shore, 0, Math.PI * 2);
  ctx.fill();
}
