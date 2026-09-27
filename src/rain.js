// La lluvia. Cada cierto tiempo cae un chaparrón que dura poco y deja charcos
// en el suelo. Los charcos son agua de verdad (se puede beber de ellos) pero
// poco honda —ahí siempre hace pie— y no duran: el sol los va encogiendo hasta
// secarlos. Quien recuerda un charco tiene que volver a buscar agua cuando
// llega y ya no está (perception.js).
//
// Mientras llueve, además, el agua borra la feromona (pheromone.js) y moja a
// quien esté a la intemperie (swim.js).
//
// Antes de cada chaparrón llega el frente: la presión del aire baja durante
// RAIN.front segundos, se queda baja mientras llueve y se recupera al escampar
// (lluvia.drop: 0 = normal, 1 = lo más baja). Es la señal que Fagi puede
// notar (weather.js); que anuncia agua lo tiene que aprender.

import { RAIN, WORLD, MAPGEN } from './config.js';
import { addObject, removeObject, record } from './world.js';
import { radiusOf } from './obstacles.js';

const between = ({ min, max }) => min + Math.random() * (max - min);

// El primer chaparrón se sortea al primer paso, no al crear el mundo: así crear
// el mundo no gasta azar y el mapa sale igual con la misma semilla.
export function createRain() {
  return { on: false, timer: null, front: 0, drop: 0, left: 0, pending: 0, spawnIn: 0, n: 0 };
}

export const isPuddle = (o) => o.type === 'puddle';

// Un sitio libre para un charco: dentro del mapa y sin pisar otra cosa.
function freeSpot(world, r) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const x = MAPGEN.margin + r + Math.random() * (WORLD.width - 2 * (MAPGEN.margin + r));
    const y = MAPGEN.margin + r + Math.random() * (WORLD.height - 2 * (MAPGEN.margin + r));
    const collides = world.objects.some((o) => Math.hypot(o.x - x, o.y - y) < r + radiusOf(o) + 6);
    if (!collides) return { x, y };
  }
  return null;
}

function newPuddle(world) {
  const [min, max] = RAIN.puddleRadius;
  const r = Math.round(min + Math.random() * (max - min));
  const place = freeSpot(world, r);
  if (place) addObject(world, place.x, place.y, 'puddle', r, 'rain');
}

// Sortea el próximo chaparrón y cuánto se le adelanta el frente.
function next(rain) {
  rain.timer = between(RAIN.every);
  rain.front = Math.min(rain.timer, between(RAIN.front));
}

// Empieza a llover ya (el reloj normal, o el botón de ajustes).
export function startRain(world) {
  const rain = (world.rain ??= createRain());
  if (rain.on) return;
  rain.on = true;
  rain.n += 1;
  rain.left = between(RAIN.duration);
  // Los charcos no salen de golpe: se van formando mientras cae.
  rain.pending = Math.round(between(RAIN.puddles));
  rain.spawnIn = rain.left / (rain.pending + 1);
  record(world, 'rain', { on: true });
}

export function updateRain(world, dt) {
  const rain = (world.rain ??= createRain());

  if (!rain.on) {
    if (rain.timer == null) next(rain);
    rain.timer -= dt;
    // Tras escampar la presión sube poco a poco; al acercarse el frente, baja.
    const front = rain.front > 0 ? Math.max(0, 1 - rain.timer / rain.front) : 0;
    const returns = Math.max(0, rain.drop - dt / Math.max(1e-6, RAIN.recover));
    rain.drop = Math.min(1, Math.max(front, returns));
    if (rain.timer <= 0) startRain(world);
  } else {
    rain.drop = 1;
    rain.left -= dt;
    rain.spawnIn -= dt;
    if (rain.pending > 0 && rain.spawnIn <= 0) {
      newPuddle(world);
      rain.pending -= 1;
      rain.spawnIn = rain.left / (rain.pending + 1);
    }
    if (rain.left <= 0) {
      rain.on = false;
      next(rain);
      record(world, 'rain', { on: false });
    }
  }

  // Lloviendo, los charcos crecen; con el sol, menguan hasta secarse.
  const max = RAIN.puddleRadius[1] * 1.3;
  // `size` lleva la cuenta fina; `r`, lo que se ve y se graba, va en px enteros.
  for (const o of [...world.objects]) {
    if (!isPuddle(o)) continue;
    o.size = (o.size ?? o.r) + (rain.on ? RAIN.grow : -RAIN.evaporate) * dt;
    o.size = Math.min(max, o.size);
    if (o.size < RAIN.minRadius) { removeObject(world, o, 'dried'); continue; }
    const r = Math.round(o.size);
    if (r !== o.r) { o.r = r; record(world, 'obj_resize', { id: o.id, r }); }
  }
}
