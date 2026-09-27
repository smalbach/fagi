// Trazos sueltos que el dibujo de Fagi repite pieza a pieza: una elipse
// rellena, una raya recta y un arco de elipse. Cada uno pone su color y su
// grosor y pinta; nada más.

export function elipse(ctx, x, y, rx, ry, fill, rot = 0) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

// Un punto redondo: el grano de la quitina se hace a base de ellos.
export function punto(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// Una raya de un punto a otro con el trazo que ya esté puesto.
export function linea(ctx, x0, y0, x1, y1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

// Un tramo de elipse sin rellenar: costuras, suturas y surcos.
export function arco(ctx, x, y, rx, ry, desde, hasta, color, ancho) {
  ctx.strokeStyle = color;
  ctx.lineWidth = ancho;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, desde, hasta);
  ctx.stroke();
}
