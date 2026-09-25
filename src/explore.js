// Explorar no es deambular. Deambular es no tener plan; explorar es ir a donde
// todavía no se ha estado, que es la única forma de encontrar comida y agua
// nuevas antes de necesitarlas.
//
// Fagi lleva un mapa basto del mundo: una rejilla de casillas gordas donde
// anota por dónde ha pasado. Para explorar elige UNA casilla —la que menos
// conoce, descontando lo que cuesta llegar— y se va a ella. Elegir destino y no
// rumbo es lo que evita el baile: un rumbo se puede recalcular hacia atrás cada
// segundo y dejarla dando tumbos en el sitio; un destino se mantiene hasta que
// se pisa.
//
// La anotación se desvanece sola: un sitio que lleva mucho sin pisar vuelve a
// ser terreno nuevo. Así no explora una vez y se le acaba el mundo.

import { EXPLORE, WORLD } from './config.js';

const cols = () => Math.ceil(WORLD.width / EXPLORE.cell);
const rows = () => Math.ceil(WORLD.height / EXPLORE.cell);
const diagonal = () => Math.hypot(WORLD.width, WORLD.height);

export function createExploreMap() {
  return new Float32Array(cols() * rows());
}

function celda(x, y) {
  const c = Math.min(cols() - 1, Math.max(0, Math.floor(x / EXPLORE.cell)));
  const r = Math.min(rows() - 1, Math.max(0, Math.floor(y / EXPLORE.cell)));
  return r * cols() + c;
}

// Estar en un sitio lo marca; todo lo demás se despinta despacio.
export function markVisited(map, x, y, dt) {
  for (let k = 0; k < map.length; k++) {
    map[k] = Math.max(0, map[k] - EXPLORE.fade * dt);
  }
  const i = celda(x, y);
  map[i] = Math.min(EXPLORE.visitMax, map[i] + EXPLORE.visitGain * dt);
}

// La casilla a la que merece la pena ir: la que menos conoce, restándole lo que
// cuesta llegar y sumándole un empujón por alejarse del nido, que es de donde
// ya viene todo lo sabido.
export function exploreTarget(fagi, map, nido) {
  const nc = cols();
  const diag = diagonal();
  const dNido = nido ? Math.hypot(nido.x - fagi.x, nido.y - fagi.y) : 0;

  let mejor = null;
  for (let i = 0; i < map.length; i++) {
    const x = ((i % nc) + 0.5) * EXPLORE.cell;
    const y = (Math.floor(i / nc) + 0.5) * EXPLORE.cell;
    if (x > WORLD.width || y > WORLD.height) continue;   // casilla cortada por el borde

    const dist = Math.hypot(x - fagi.x, y - fagi.y);
    let puntos = -map[i] - EXPLORE.distanceWeight * (dist / diag);

    if (nido) {
      const d = Math.hypot(nido.x - x, nido.y - y);
      puntos += EXPLORE.homeBias * (d - dNido) / diag;
    }

    if (!mejor || puntos > mejor.puntos) mejor = { x, y, puntos };
  }
  return mejor ? { x: mejor.x, y: mejor.y } : { x: fagi.x, y: fagi.y };
}
