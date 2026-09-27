// El viento en la copa: la copa y sus ramas se mueven con él, el tronco no.

// Cuánto se desplaza la copa: una inclinación fija a favor del viento más un
// balanceo lento. Cada árbol lleva su propia fase, así no van todos a la vez.
export function swayOf(wind, now, r, seedOf, dry) {
  const t = now / 1000;
  const phase = ((seedOf % 1000) / 1000) * Math.PI * 2;
  // Sin hoja hay menos vela: el árbol seco se mueve mucho menos.
  const leaf = 1 - dry * 0.6;
  const push = r * 0.035 * leaf;
  const breath = r * 0.03 * leaf * Math.sin(t * 0.85 + phase) * (0.7 + 0.3 * Math.sin(t * 2.1 + phase));
  const d = push + breath;
  return { x: Math.cos(wind?.angle ?? 0) * d, y: Math.sin(wind?.angle ?? 0) * d * 0.55 };
}
