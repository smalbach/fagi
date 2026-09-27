// El viento en la copa: la copa y sus ramas se mueven con él, el tronco no.

// Cuánto se desplaza la copa: una inclinación fija a favor del viento más un
// balanceo lento. Cada árbol lleva su propia fase, así no van todos a la vez.
export function vaiven(wind, ahora, r, semilla, seco) {
  const t = ahora / 1000;
  const fase = ((semilla % 1000) / 1000) * Math.PI * 2;
  // Sin hoja hay menos vela: el árbol seco se mueve mucho menos.
  const hoja = 1 - seco * 0.6;
  const empuje = r * 0.035 * hoja;
  const soplo = r * 0.03 * hoja * Math.sin(t * 0.85 + fase) * (0.7 + 0.3 * Math.sin(t * 2.1 + fase));
  const d = empuje + soplo;
  return { x: Math.cos(wind?.angle ?? 0) * d, y: Math.sin(wind?.angle ?? 0) * d * 0.55 };
}
