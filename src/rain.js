// La lluvia. Cada cierto tiempo cae un chaparrón que dura poco y deja charcos
// en el suelo. Los charcos son agua de verdad (se puede beber de ellos) pero
// poco honda —ahí siempre hace pie— y no duran: el sol los va encogiendo hasta
// secarlos. Quien recuerda un charco tiene que volver a buscar agua cuando
// llega y ya no está (perception.js).
//
// Mientras llueve, además, el agua borra la feromona (pheromone.js) y moja a
// quien esté a la intemperie (swim.js).

import { RAIN, WORLD, MAPGEN } from './config.js';
import { addObject, removeObject, record } from './world.js';
import { radiusOf } from './obstacles.js';

const entre = ({ min, max }) => min + Math.random() * (max - min);

export function createRain() {
  return { on: false, timer: entre(RAIN.every), left: 0, pending: 0, spawnIn: 0, n: 0 };
}

export const isPuddle = (o) => o.type === 'charco';

// Un sitio libre para un charco: dentro del mapa y sin pisar otra cosa.
function sitioLibre(world, r) {
  for (let intento = 0; intento < 30; intento++) {
    const x = MAPGEN.margin + r + Math.random() * (WORLD.width - 2 * (MAPGEN.margin + r));
    const y = MAPGEN.margin + r + Math.random() * (WORLD.height - 2 * (MAPGEN.margin + r));
    const choca = world.objects.some((o) => Math.hypot(o.x - x, o.y - y) < r + radiusOf(o) + 6);
    if (!choca) return { x, y };
  }
  return null;
}

function nuevoCharco(world) {
  const [min, max] = RAIN.puddleRadius;
  const r = Math.round(min + Math.random() * (max - min));
  const sitio = sitioLibre(world, r);
  if (sitio) addObject(world, sitio.x, sitio.y, 'charco', r, 'rain');
}

// Empieza a llover ya (el reloj normal, o el botón de ajustes).
export function startRain(world) {
  const lluvia = (world.rain ??= createRain());
  if (lluvia.on) return;
  lluvia.on = true;
  lluvia.n += 1;
  lluvia.left = entre(RAIN.duration);
  // Los charcos no salen de golpe: se van formando mientras cae.
  lluvia.pending = Math.round(entre(RAIN.puddles));
  lluvia.spawnIn = lluvia.left / (lluvia.pending + 1);
  record(world, 'rain', { on: true });
}

export function updateRain(world, dt) {
  const lluvia = (world.rain ??= createRain());

  if (!lluvia.on) {
    lluvia.timer -= dt;
    if (lluvia.timer <= 0) startRain(world);
  } else {
    lluvia.left -= dt;
    lluvia.spawnIn -= dt;
    if (lluvia.pending > 0 && lluvia.spawnIn <= 0) {
      nuevoCharco(world);
      lluvia.pending -= 1;
      lluvia.spawnIn = lluvia.left / (lluvia.pending + 1);
    }
    if (lluvia.left <= 0) {
      lluvia.on = false;
      lluvia.timer = entre(RAIN.every);
      record(world, 'rain', { on: false });
    }
  }

  // Lloviendo, los charcos crecen; con el sol, menguan hasta secarse.
  const max = RAIN.puddleRadius[1] * 1.3;
  // `size` lleva la cuenta fina; `r`, lo que se ve y se graba, va en px enteros.
  for (const o of [...world.objects]) {
    if (!isPuddle(o)) continue;
    o.size = (o.size ?? o.r) + (lluvia.on ? RAIN.grow : -RAIN.evaporate) * dt;
    o.size = Math.min(max, o.size);
    if (o.size < RAIN.minRadius) { removeObject(world, o, 'dried'); continue; }
    const r = Math.round(o.size);
    if (r !== o.r) { o.r = r; record(world, 'obj_resize', { id: o.id, r }); }
  }
}
