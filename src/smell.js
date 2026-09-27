// Olfato y rastros de olor.
//
// Cada fuente suelta UN hilo de olor que va creciendo con el tiempo: sale a
// favor del viento, pero serpentea, así que acaba recorriendo el mapa tomando
// direcciones distintas. Fagi huele si está cerca de algún tramo del hilo, y
// huele más fuerte cuanto más cerca de la fuente esté ese tramo.

import { specOf, FAGI, PLUME, WORLD, TREE, RAIN } from './config.js';
import { statMult } from './effects.js';
import { distanceTo, normalizeAngle } from './vision.js';
import { radiusOf, isTree, isWater } from './obstacles.js';

// Sensibilidad total de Fagi aplicada al aroma de algo.
export function aromaOf(fagi, key) {
  const aroma = specOf(key)?.aroma ?? 0;
  return aroma * FAGI.smell * statMult(fagi, 'smell');
}

function maxNodes(key) {
  return Math.round((specOf(key)?.aroma ?? 0) * PLUME.nodesPerAroma);
}

function ensureTrail(src, wind) {
  // Si la fuente se ha movido, su rastro viejo ya no vale: el olor sale de
  // donde está ahora, así que el hilo se rehace desde cero.
  const t = src.trail;
  if (t && t.originX === src.x && t.originY === src.y) {
    // Si la fuente cambió de tipo (una fruta que se pudrió), el rastro sigue
    // ahí pero ya es otro olor: se queda con el largo que permita el nuevo.
    if (t.type !== src.type) {
      t.type = src.type;
      const cap = maxNodes(src.type);
      if (t.nodes.length > cap) t.nodes.length = Math.max(1, cap);
    }
    return t;
  }

  src.trail = {
    nodes: [{ x: src.x, y: src.y }],
    dir: wind.angle,
    timer: 0,
    originX: src.x,
    originY: src.y,
    type: src.type,
  };
  return src.trail;
}

// Alarga un hilo: cada tramo se tuerce un poco por su cuenta y el viento
// lo va enderezando. Rebota en los bordes del mapa.
function grow(src, key, wind, dt) {
  const trail = ensureTrail(src, wind);
  const cap = maxNodes(key);

  trail.timer -= dt;
  let guard = 0;
  while (trail.timer <= 0 && trail.nodes.length < cap && guard++ < 20) {
    const towardWind = normalizeAngle(wind.angle - trail.dir);
    trail.dir = normalizeAngle(
      trail.dir + (Math.random() - 0.5) * PLUME.drift + towardWind * PLUME.windPull
    );

    const last = trail.nodes[trail.nodes.length - 1];
    let x = last.x + Math.cos(trail.dir) * PLUME.step;
    let y = last.y + Math.sin(trail.dir) * PLUME.step;

    if (x < 0 || x > WORLD.width) { trail.dir = normalizeAngle(Math.PI - trail.dir); x = last.x; }
    if (y < 0 || y > WORLD.height) { trail.dir = normalizeAngle(-trail.dir); y = last.y; }

    trail.nodes.push({ x, y });
    trail.timer += PLUME.every;
  }
}

// Todas las fuentes que huelen: puntos de comida y charcos.
export function scentSources(world) {
  const out = world.points.map((p) => ({ src: p, key: p.type, extra: 0 }));
  for (const o of world.objects) {
    if (isWater(o)) out.push({ src: o, key: o.type, extra: radiusOf(o) });
    // El árbol anuncia la clase de fruto que produce; la dirección concreta se
    // sigue por gradiente, sin revelar mágicamente dónde está.
    else if (isTree(o)) out.push({ src: o, key: TREE.fruit, extra: radiusOf(o) });
  }
  return out.filter(({ key }) => (specOf(key)?.aroma ?? 0) > 0);
}

// La lluvia arrastra el olor: el hilo se acorta desde la punta hasta quedarse
// en la fuente, en RAIN.washScent segundos si estaba entero. Mientras cae no
// crece; al escampar grow() lo vuelve a tender desde la fuente.
function wash(src, key, dt) {
  const trail = src.trail;
  if (!trail || trail.nodes.length <= 1) return;
  trail.washed = (trail.washed ?? 0) + dt * maxNodes(key) / Math.max(0.1, RAIN.washScent);
  const remove = Math.floor(trail.washed);
  trail.washed -= remove;
  trail.nodes.length = Math.max(1, trail.nodes.length - remove);
  trail.timer = Math.max(trail.timer, 0);
}

// Hace crecer (o lava, si llueve) todos los hilos del mapa. Una vez por frame.
export function updateTrails(world, dt) {
  const rains = world.rain?.on;
  for (const { src, key } of scentSources(world)) {
    if (rains) wash(src, key, dt);
    else grow(src, key, world.wind, dt);
  }
}

// Intensidad que llega desde UNA fuente concreta. Mantener este cálculo separado
// evita atribuir a todos los frutos del mismo tipo la estela de uno solo.
export function scentFromSourceAt(fagi, source, x, y) {
  const sens = FAGI.smell * statMult(fagi, 'smell');
  const r = PLUME.radius * sens;
  const r2 = r * r;
  const { src, extra = 0 } = source;
  if (!src.trail) return 0;

  // Junto a la propia fuente huele sin más, venga de donde venga.
  if (distanceTo({ x, y }, src) - extra <= r) return 1;

  let max = 0;
  const nodes = src.trail.nodes;
  for (let i = 0; i < nodes.length; i++) {
    const dx = nodes[i].x - x;
    const dy = nodes[i].y - y;
    if (dx * dx + dy * dy > r2) continue;
    // Cuanto más lejos de la fuente está el tramo, más diluido va el olor.
    const force = 1 - (i / nodes.length) * PLUME.faint;
    if (force > max) max = force;
  }
  return max;
}

// Intensidad agregada de un TIPO. El rastreo usa el gradiente combinado porque
// Fagi reconoce el olor, pero no conoce la identidad de su fuente a distancia.
export function scentAt(fagi, world, key, x, y) {
  let max = 0;
  for (const source of scentSources(world)) {
    if (source.key !== key) continue;
    max = Math.max(max, scentFromSourceAt(fagi, source, x, y));
  }
  return max;
}

// Qué puntos de comida le llegan por el olfato ahora mismo.
export function smelledPoints(fagi, world) {
  const out = [];
  for (const p of world.points) {
    const force = scentFromSourceAt(fagi, { src: p, extra: 0 }, fagi.x, fagi.y);
    if (force > 0) out.push({ point: p, dist: distanceTo(fagi, p), force });
  }
  return out;
}

// ¿Le llega el olor de este charco?
export function smellsObject(fagi, obj, world) {
  return scentStrengthOfObject(fagi, obj, world) > 0;
}

export function scentStrengthOfObject(fagi, obj, world) {
  const source = scentSources(world).find(({ src }) => src === obj);
  return source ? scentFromSourceAt(fagi, source, fagi.x, fagi.y) : 0;
}
