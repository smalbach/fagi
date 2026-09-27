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

function cellOf(x, y) {
  const c = Math.min(cols() - 1, Math.max(0, Math.floor(x / EXPLORE.cell)));
  const r = Math.min(rows() - 1, Math.max(0, Math.floor(y / EXPLORE.cell)));
  return r * cols() + c;
}

// Estar en un sitio lo marca; todo lo demás se despinta despacio.
export function markVisited(map, x, y, dt) {
  for (let k = 0; k < map.length; k++) {
    map[k] = Math.max(0, map[k] - EXPLORE.fade * dt);
  }
  const i = cellOf(x, y);
  map[i] = Math.min(EXPLORE.visitMax, map[i] + EXPLORE.visitGain * dt);
}

// La casilla a la que merece la pena ir: la que menos conoce, restándole lo que
// cuesta llegar y sumándole un empujón por alejarse del nido, que es de donde
// ya viene todo lo sabido.
export function exploreTarget(fagi, map, nestObj) {
  const nc = cols();
  const diag = diagonal();
  const dNestObj = nestObj ? Math.hypot(nestObj.x - fagi.x, nestObj.y - fagi.y) : 0;

  let best = null;
  for (let i = 0; i < map.length; i++) {
    const x = ((i % nc) + 0.5) * EXPLORE.cell;
    const y = (Math.floor(i / nc) + 0.5) * EXPLORE.cell;
    if (x > WORLD.width || y > WORLD.height) continue;   // casilla cortada por el borde

    const dist = Math.hypot(x - fagi.x, y - fagi.y);
    let points = -map[i] - EXPLORE.distanceWeight * (dist / diag);

    if (nestObj) {
      const d = Math.hypot(nestObj.x - x, nestObj.y - y);
      points += EXPLORE.homeBias * (d - dNestObj) / diag;
    }

    if (!best || points > best.points) best = { x, y, points };
  }
  return best ? { x: best.x, y: best.y } : { x: fagi.x, y: fagi.y };
}

// Lo que vale un tramo que acaba en (x, y), para la única directiva que hay:
// sobrevivir. Explorar sirve para saber dónde hay comida y agua antes de
// necesitarlas, así que vale lo que le enseñe (lo poco que conoce ese sitio),
// lo que le acerque a la zona que menos conoce (la brújula) y lo que avance de
// una vez; y cuesta lo que tenga que girar para ir, que es tiempo y energía
// que no gasta en avanzar.
function scoreLeg(fagi, map, x, y, compassRose) {
  const dist = Math.hypot(x - fagi.x, y - fagi.y);
  const toward = Math.atan2(y - fagi.y, x - fagi.x);
  const headingOf = Math.atan2(compassRose.y - fagi.y, compassRose.x - fagi.x);
  const far = Math.hypot(compassRose.x - fagi.x, compassRose.y - fagi.y) > 1;
  const advanceBy = Math.min(1, dist / viewRangeOf(fagi));
  const giro = Math.abs(normalizeAngle(toward - fagi.angle)) / Math.PI;
  return -map[cellOf(x, y)]
    + (far ? EXPLORE.compassWeight * Math.cos(normalizeAngle(toward - headingOf)) : 0)
    + EXPLORE.farWeight * advanceBy
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
export function waypointInView(fagi, map, nestObj, world, prior = null) {
  const compassRose = exploreTarget(fagi, map, nestObj);
  const range = viewRangeOf(fagi);
  const half = fovOf(fagi) / 2;
  const marginOf = FAGI.radius * 2;
  // Quien ya se hundió una vez no traza tramos que acaben o pasen por el hondo.
  const fears = world && fearsDeep(fagi);

  let best = null;
  for (let i = 0; i < EXPLORE.rays; i++) {
    const a = fagi.angle - half + (2 * half * i) / Math.max(1, EXPLORE.rays - 1);
    for (const f of EXPLORE.depths) {
      const x = fagi.x + Math.cos(a) * range * f;
      const y = fagi.y + Math.sin(a) * range * f;
      if (x < marginOf || y < marginOf || x > WORLD.width - marginOf || y > WORLD.height - marginOf) continue;
      if (world && segmentBlocked(world, fagi.x, fagi.y, x, y)) continue;
      if (fears && (waterZone(world, x, y) || deepBlocked(world, fagi.x, fagi.y, x, y))) continue;
      const points = scoreLeg(fagi, map, x, y, compassRose);
      if (!best || points > best.points) best = { x, y, points };
    }
  }

  if (prior) {
    const points = scoreLeg(fagi, map, prior.x, prior.y, compassRose);
    if (!best || points > best.points) {
      return { x: prior.x, y: prior.y, inView: true, resumed: true, score: points, rival: best?.points ?? null };
    }
    return { x: best.x, y: best.y, inView: true, resumed: false, score: best.points, rival: points };
  }
  if (!best) return { x: compassRose.x, y: compassRose.y, inView: false };
  return { x: best.x, y: best.y, inView: true, score: best.points };
}
