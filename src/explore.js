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
// Pero no camina a ciegas hacia esa casilla: la casilla es solo la brújula.
// Lo que decide es lo que tiene delante. Cada tramo va a un punto de su campo
// de visión (waypointInView); al llegar, con lo nuevo que vea, elige el
// siguiente. Y en cada frame, si algo nuevo entra en lo que percibe, las
// reglas de decision.js deciden si el tramo sigue valiendo o no.
//
// La anotación se desvanece sola: un sitio que lleva mucho sin pisar vuelve a
// ser terreno nuevo. Así no explora una vez y se le acaba el mundo.

import { EXPLORE, WORLD, FAGI } from './config.js';
import { segmentBlocked, deepBlocked, waterZone } from './obstacles.js';
import { fearsDeep } from './swim.js';
import { fovOf, viewRangeOf, normalizeAngle } from './vision.js';

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

// Lo que vale un tramo que acaba en (x, y), para la única directiva que hay:
// sobrevivir. Explorar sirve para saber dónde hay comida y agua antes de
// necesitarlas, así que vale lo que le enseñe (lo poco que conoce ese sitio),
// lo que le acerque a la zona que menos conoce (la brújula) y lo que avance de
// una vez; y cuesta lo que tenga que girar para ir, que es tiempo y energía
// que no gasta en avanzar.
function puntuarTramo(fagi, map, x, y, brujula) {
  const dist = Math.hypot(x - fagi.x, y - fagi.y);
  const hacia = Math.atan2(y - fagi.y, x - fagi.x);
  const rumbo = Math.atan2(brujula.y - fagi.y, brujula.x - fagi.x);
  const lejos = Math.hypot(brujula.x - fagi.x, brujula.y - fagi.y) > 1;
  const avance = Math.min(1, dist / viewRangeOf(fagi));
  const giro = Math.abs(normalizeAngle(hacia - fagi.angle)) / Math.PI;
  return -map[celda(x, y)]
    + (lejos ? EXPLORE.compassWeight * Math.cos(normalizeAngle(hacia - rumbo)) : 0)
    + EXPLORE.farWeight * avance
    - EXPLORE.turnWeight * giro;
}

// El siguiente tramo, decidido con lo que tiene: los puntos que ve (sin roca
// de por medio) y, si lo hay, el tramo que dejó a medias (`previo`) cuando
// algo lo apartó. Todos se puntúan igual y gana el que más vale: retomar no es
// una costumbre ni una obligación, es una opción más. Si no ve ningún punto
// libre y no hay tramo viejo (una pared de rocas delante), va la brújula:
// girará hacia ella y ya verá otra cosa.
//
// Devuelve el tramo elegido; `resumed` dice si fue el viejo, y `rival` lo que
// puntuaba la mejor alternativa, para que la consola cuente la comparación.
export function waypointInView(fagi, map, nido, world, previo = null) {
  const brujula = exploreTarget(fagi, map, nido);
  const range = viewRangeOf(fagi);
  const half = fovOf(fagi) / 2;
  const margen = FAGI.radius * 2;
  // Quien ya se hundió una vez no traza tramos que acaben o pasen por el hondo.
  const teme = world && fearsDeep(fagi);

  let mejor = null;
  for (let i = 0; i < EXPLORE.rays; i++) {
    const a = fagi.angle - half + (2 * half * i) / Math.max(1, EXPLORE.rays - 1);
    for (const f of EXPLORE.depths) {
      const x = fagi.x + Math.cos(a) * range * f;
      const y = fagi.y + Math.sin(a) * range * f;
      if (x < margen || y < margen || x > WORLD.width - margen || y > WORLD.height - margen) continue;
      if (world && segmentBlocked(world, fagi.x, fagi.y, x, y)) continue;
      if (teme && (waterZone(world, x, y) || deepBlocked(world, fagi.x, fagi.y, x, y))) continue;
      const puntos = puntuarTramo(fagi, map, x, y, brujula);
      if (!mejor || puntos > mejor.puntos) mejor = { x, y, puntos };
    }
  }

  if (previo) {
    const puntos = puntuarTramo(fagi, map, previo.x, previo.y, brujula);
    if (!mejor || puntos > mejor.puntos) {
      return { x: previo.x, y: previo.y, inView: true, resumed: true, score: puntos, rival: mejor?.puntos ?? null };
    }
    return { x: mejor.x, y: mejor.y, inView: true, resumed: false, score: mejor.puntos, rival: puntos };
  }
  if (!mejor) return { x: brujula.x, y: brujula.y, inView: false };
  return { x: mejor.x, y: mejor.y, inView: true, score: mejor.puntos };
}
