// Los materiales de la roca procedural. Cada piedra saca uno al azar de su
// semilla, y el material decide color, grano, forma y qué le pasa por encima.

export const SILHOUETTE_MAX = 0.99;    // punto más saliente: nunca sobresale del radio

// min      = cuánto se hunde el contorno (bajo = piedra picuda)
// lados    = cuántos vértices, de menos a más (pocos = bloque tallado)
// aplanado = cuánto puede achatarse por un eje
// grano    = [tamaño de celda del ruido fino, octavas, opacidad]
// vetas    = opacidad de las manchas grandes de mineral
// motas    = [cuántas, probabilidad de que brillen]
// grietas  = [mínimo, máximo]
export const MATERIALES = [
  { // Granito: claro, muy moteado de cuarzo, pocas grietas.
    name: 'granito',
    tint: '#6f6a5e', weight: [0.25, 0.3], lightT: 0.38, shadowT: 0.58,
    min: 0.82, sides: [9, 12], flattened: 0.12,
    grain: [3, 3, 0.34], veins: 0.22, specks: [30, 0.6], cracks: [0, 2],
  },
  { // Basalto: casi negro, grano cerrado, roto en muchas fracturas.
    name: 'basalto',
    tint: '#2d3138', weight: [0.55, 0.3], lightT: 0.26, shadowT: 0.7,
    min: 0.76, sides: [6, 9], flattened: 0.2,
    grain: [6, 2, 0.16], veins: 0.12, specks: [10, 0.15], cracks: [2, 4],
  },
  { // Arenisca: parda y cálida, con los estratos a la vista.
    name: 'arenisca',
    tint: '#8a6a45', weight: [0.45, 0.25], lightT: 0.4, shadowT: 0.5,
    min: 0.86, sides: [11, 14], flattened: 0.3,
    grain: [2, 3, 0.28], veins: 0.3, specks: [8, 0.5], cracks: [0, 1],
    strata: true,
  },
  { // Pizarra: azulada y plana, partida en planos rectos.
    name: 'pizarra',
    tint: '#49556b', weight: [0.5, 0.25], lightT: 0.3, shadowT: 0.66,
    min: 0.7, sides: [5, 7], flattened: 0.38,
    grain: [8, 2, 0.14], veins: 0.34, specks: [6, 0.4], cracks: [1, 3],
    slabs: true,
  },
  { // Cuarcita: casi blanca y fría, partida en pocos planos muy marcados.
    name: 'cuarcita',
    tint: '#b9bec9', weight: [0.45, 0.25], lightT: 0.5, shadowT: 0.6,
    min: 0.66, sides: [6, 8], flattened: 0.25,
    grain: [10, 2, 0.12], veins: 0.18, specks: [18, 0.85], cracks: [1, 2],
    picos: true, shine: 0.55,
  },
  { // Conglomerado: pasta oscura con cantos de otras piedras pegados dentro.
    name: 'conglomerado',
    tint: '#5b5248', weight: [0.5, 0.25], lightT: 0.3, shadowT: 0.62,
    min: 0.8, sides: [9, 12], flattened: 0.18,
    grain: [3, 3, 0.3], veins: 0.2, specks: [6, 0.3], cracks: [0, 1],
    pebbles: true,
  },
  { // Caliza: pálida, comida de huecos, y le agarra el líquen.
    name: 'caliza',
    tint: '#9a978c', weight: [0.4, 0.3], lightT: 0.42, shadowT: 0.52,
    min: 0.84, sides: [10, 13], flattened: 0.16,
    grain: [4, 3, 0.24], veins: 0.26, specks: [14, 0.35], cracks: [0, 2],
    gaps: true, lichen: 0.7,
  },
];
