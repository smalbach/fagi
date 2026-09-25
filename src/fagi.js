// Fagi: una hormiga con una sola directiva, sobrevivir.
//
// Este archivo solo la define y ordena su turno. Cada parte vive aparte:
//   needs.js       hambre, sed y energía
//   perception.js  qué ve, qué huele y cómo lo puntúa
//   decision.js    qué hace con eso
//   movement.js    cómo se mueve
//   explore.js     el mapa basto de por dónde ha pasado
//   feeding.js     comer y cargar
//   nest.js        el nido

import { WORLD, ENERGY, PHERO } from './config.js';
import { createBrain } from './brain.js';
import { decayMemory, saveLongTerm } from './memory.js';
import { createEffects, updateEffects } from './effects.js';
import { nestOf } from './world.js';
import { dropPheromone } from './pheromone.js';
import { increaseNeeds, resolveVitalFailure, drink, spendEnergy } from './needs.js';
import { perceive } from './perception.js';
import { decide } from './decision.js';
import { moveToward, explore, trackScent } from './movement.js';
import { createExploreMap, markVisited } from './explore.js';
import { eatCarried, tryPickOrEat } from './feeding.js';
import { useNest } from './nest.js';

export function createFagi() {
  return {
    x: WORLD.width / 2,
    y: WORLD.height / 2,
    angle: Math.random() * Math.PI * 2,

    // necesidades
    hunger: 0,
    thirst: 0,
    energy: ENERGY.max,
    alive: true,
    cause: '',         // de qué murió

    // trabajo
    carrying: null,    // el punto que lleva a cuestas, o null
    resting: false,
    drinking: false,
    pheroTimer: 0,

    // cabeza
    brain: createBrain(),
    explored: createExploreMap(),  // por dónde ha pasado, a casillas gordas
    effects: createEffects(),
    thought: null,     // razonamiento del último frame, lo leen consola y HUD
    target: null,      // a qué va
    targetKind: null,  // 'food' | 'water' | 'nest' | 'scent' | 'phero'
    memory: 0,         // le queda insistiendo en algo que perdió de vista
    trailKey: null,    // qué olor está rastreando
    trailMemory: 0,    // cuánto le queda buscando un rastro perdido
    lastScent: null,   // último sitio donde le llegó el olor
    castSide: 1,       // hacia qué lado barre cuando lo pierde
    castTimer: 0,

    // andares
    exploreTarget: null,  // la casilla poco conocida a la que va a asomarse
    exploreTimer: 0,      // cuánto le queda insistiendo en ella
    stride: 0,         // distancia recorrida: mueve las patas al dibujar

    // Lo que CREE que hay guardado en el nido. No es el nido: es su recuerdo
    // de la última vez que estuvo dentro. Una ración que se echa a perder
    // mientras está fuera no se entera hasta que vuelve.
    pantry: {},
    pantryAt: null,    // edad a la que miró la despensa por última vez

    // contadores para el HUD y la consola
    age: 0,
    eaten: 0,
    drunk: 0,
    lastMeal: null,
    lastDrink: null,
  };
}

// Guardar es caro: basta con hacerlo de vez en cuando y al cerrar la pestaña.
const GUARDAR_CADA = 10;
let guardarEn = GUARDAR_CADA;

function autoSave(fagi, dt) {
  guardarEn -= dt;
  if (guardarEn > 0) return;
  guardarEn = GUARDAR_CADA;
  saveLongTerm(fagi.brain);
}

// Mientras acarrea va marcando el camino con su feromona.
function markTrail(fagi, world, dt) {
  if (!fagi.carrying) return;
  const nido = nestOf(world);
  if (!nido) return;
  fagi.pheroTimer -= dt;
  if (fagi.pheroTimer > 0) return;
  fagi.pheroTimer = PHERO.every;
  dropPheromone(world, fagi.x, fagi.y, Math.hypot(nido.x - fagi.x, nido.y - fagi.y));
}

// Ejecuta la intención que salió de decide().
function act(fagi, world, dt) {
  if (fagi.thought.action === 'eatCarried') eatCarried(fagi);
  else if (fagi.targetKind === 'scent' && fagi.trailKey) trackScent(fagi, world, fagi.trailKey, dt);
  else if (fagi.target) moveToward(fagi, world, fagi.target, dt);
  else explore(fagi, world, dt);
}

export function updateFagi(fagi, world, dt) {
  if (!fagi.alive) return;
  fagi.age += dt;

  updateEffects(fagi, dt);
  decayMemory(fagi.brain, dt);   // la confianza baja sola y los sitios se difuminan
  markVisited(fagi.explored, fagi.x, fagi.y, dt);  // estar en un sitio es conocerlo
  drink(fagi, world, dt);
  useNest(fagi, world);

  decide(fagi, world, perceive(fagi, world), dt);

  // Se queda quieta bebiendo o descansando; el resto del tiempo, en marcha.
  const parada = (fagi.drinking && fagi.thirst > 0) || fagi.thought.action === 'rest';
  if (!parada) act(fagi, world, dt);

  spendEnergy(fagi, world, dt, !parada);
  markTrail(fagi, world, dt);
  tryPickOrEat(fagi, world);
  increaseNeeds(fagi, dt);
  resolveVitalFailure(fagi);
  autoSave(fagi, dt);
}
