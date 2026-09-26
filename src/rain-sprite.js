// La lluvia y los charcos que deja. Poca cosa y directa cada fotograma: un
// charco es una lámina de agua sin fondo que se vea, y la lluvia, trazos
// inclinados con el viento y un velo que apaga la luz.

const LUZ = -Math.PI * 0.72;   // la misma luz que el resto del mundo

// Un charco: agua turbia, más clara hacia el borde, con el reflejo del cielo
// del lado de la luz. Si está lloviendo, las gotas le hacen anillos.
export function drawPuddle(ctx, o, r, lloviendo, ahora) {
  ctx.save();
  const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
  g.addColorStop(0, 'rgba(58,78,84,0.85)');
  g.addColorStop(0.75, 'rgba(78,98,96,0.8)');
  g.addColorStop(1, 'rgba(96,104,88,0.35)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(o.x, o.y, r, r * 0.86, (o.id % 7) * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Reflejo del cielo.
  ctx.fillStyle = 'rgba(200,220,235,0.16)';
  ctx.beginPath();
  ctx.ellipse(o.x + Math.cos(LUZ) * r * 0.35, o.y + Math.sin(LUZ) * r * 0.35, r * 0.45, r * 0.18, LUZ + Math.PI / 2, 0, Math.PI * 2);
  ctx.fill();

  if (lloviendo) {
    ctx.strokeStyle = 'rgba(210,230,240,0.35)';
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 3; i++) {
      const fase = ((ahora / 900 + i / 3 + o.id * 0.37) % 1);
      const a = (o.id * 2.3 + i * 2.1 + Math.floor(ahora / 900 + i / 3)) % (Math.PI * 2);
      const d = r * 0.55 * ((i * 0.37 + o.id * 0.11) % 1);
      ctx.beginPath();
      ctx.arc(o.x + Math.cos(a) * d, o.y + Math.sin(a) * d, 1 + fase * r * 0.3, 0, Math.PI * 2);
      ctx.globalAlpha = 1 - fase;
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Trazos de lluvia sobre todo el mapa, inclinados a favor del viento.
export function drawRain(ctx, world, ahora) {
  const W = world.width;
  const H = world.height;
  const vx = Math.cos(world.wind?.angle ?? 0) * 0.35;
  ctx.save();
  ctx.fillStyle = 'rgba(20,28,40,0.22)';   // el cielo se cierra
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(200,218,236,0.42)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  const t = ahora / 1000;
  for (let i = 0; i < 420; i++) {
    // Cada gota su columna y su fase, repartidas sin azar para que no tiriten.
    const x0 = (i * 97.13) % W;
    const y = ((i * 53.71) % H + t * 520) % H;
    const x = ((x0 + y * vx) % W + W) % W;
    ctx.moveTo(x, y);
    ctx.lineTo(x + vx * 18, y + 18);
  }
  ctx.stroke();
  ctx.restore();
}
