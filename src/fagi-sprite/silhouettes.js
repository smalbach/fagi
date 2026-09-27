// Las siluetas de las tres piezas del cuerpo. Solo trazan la ruta: quien las
// usa decide si recorta, rellena o perfila con ellas.

// El gáster: un huevo con la punta atrás, no un círculo. La punta es lo que da
// el sentido de la marcha cuando se la ve de lejos.
export function gasterPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-3.4, 0);
  ctx.bezierCurveTo(-4.0, -4.3, -7.2, -6.3, -10.4, -6.1);
  ctx.bezierCurveTo(-13.6, -5.9, -16.0, -3.4, -16.4, 0);
  ctx.bezierCurveTo(-16.0, 3.4, -13.6, 5.9, -10.4, 6.1);
  ctx.bezierCurveTo(-7.2, 6.3, -4.0, 4.3, -3.4, 0);
  ctx.closePath();
}

// El mesosoma: el bloque del que salen las patas. Jorobado por delante
// —el pronoto— y caído por detrás, donde arranca la cintura.
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

// La cabeza: ancha por detrás y estrechada hacia la boca. Vista desde arriba es
// lo que distingue a una hormiga de un escarabajo.
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
