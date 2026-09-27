// Los materiales de la roca procedural. Cada piedra saca uno al azar de su
// semilla, y el material decide color, grano, forma y qué le pasa por encima.

export const SILUETA_MAX = 0.99;    // punto más saliente: nunca sobresale del radio

// min      = cuánto se hunde el contorno (bajo = piedra picuda)
// lados    = cuántos vértices, de menos a más (pocos = bloque tallado)
// aplanado = cuánto puede achatarse por un eje
// grano    = [tamaño de celda del ruido fino, octavas, opacidad]
// vetas    = opacidad de las manchas grandes de mineral
// motas    = [cuántas, probabilidad de que brillen]
// grietas  = [mínimo, máximo]
export const MATERIALES = [
  { // Granito: claro, muy moteado de cuarzo, pocas grietas.
    nombre: 'granito',
    tinte: '#6f6a5e', peso: [0.25, 0.3], luzT: 0.38, sombraT: 0.58,
    min: 0.82, lados: [9, 12], aplanado: 0.12,
    grano: [3, 3, 0.34], vetas: 0.22, motas: [30, 0.6], grietas: [0, 2],
  },
  { // Basalto: casi negro, grano cerrado, roto en muchas fracturas.
    nombre: 'basalto',
    tinte: '#2d3138', peso: [0.55, 0.3], luzT: 0.26, sombraT: 0.7,
    min: 0.76, lados: [6, 9], aplanado: 0.2,
    grano: [6, 2, 0.16], vetas: 0.12, motas: [10, 0.15], grietas: [2, 4],
  },
  { // Arenisca: parda y cálida, con los estratos a la vista.
    nombre: 'arenisca',
    tinte: '#8a6a45', peso: [0.45, 0.25], luzT: 0.4, sombraT: 0.5,
    min: 0.86, lados: [11, 14], aplanado: 0.3,
    grano: [2, 3, 0.28], vetas: 0.3, motas: [8, 0.5], grietas: [0, 1],
    estratos: true,
  },
  { // Pizarra: azulada y plana, partida en planos rectos.
    nombre: 'pizarra',
    tinte: '#49556b', peso: [0.5, 0.25], luzT: 0.3, sombraT: 0.66,
    min: 0.7, lados: [5, 7], aplanado: 0.38,
    grano: [8, 2, 0.14], vetas: 0.34, motas: [6, 0.4], grietas: [1, 3],
    lajas: true,
  },
  { // Cuarcita: casi blanca y fría, partida en pocos planos muy marcados.
    nombre: 'cuarcita',
    tinte: '#b9bec9', peso: [0.45, 0.25], luzT: 0.5, sombraT: 0.6,
    min: 0.66, lados: [6, 8], aplanado: 0.25,
    grano: [10, 2, 0.12], vetas: 0.18, motas: [18, 0.85], grietas: [1, 2],
    picos: true, brillo: 0.55,
  },
  { // Conglomerado: pasta oscura con cantos de otras piedras pegados dentro.
    nombre: 'conglomerado',
    tinte: '#5b5248', peso: [0.5, 0.25], luzT: 0.3, sombraT: 0.62,
    min: 0.8, lados: [9, 12], aplanado: 0.18,
    grano: [3, 3, 0.3], vetas: 0.2, motas: [6, 0.3], grietas: [0, 1],
    guijarros: true,
  },
  { // Caliza: pálida, comida de huecos, y le agarra el líquen.
    nombre: 'caliza',
    tinte: '#9a978c', peso: [0.4, 0.3], luzT: 0.42, sombraT: 0.52,
    min: 0.84, lados: [10, 13], aplanado: 0.16,
    grano: [4, 3, 0.24], vetas: 0.26, motas: [14, 0.35], grietas: [0, 2],
    huecos: true, liquen: 0.7,
  },
];
