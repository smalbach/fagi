// Fagi: una hormiga con una sola directiva, sobrevivir.
//
// Este archivo solo la define y ordena su turno. Cada parte vive aparte:
//   needs.js       hambre, sed y energía
//   perception.js  qué ve, qué huele y cómo lo puntúa
//   attention.js   qué de eso es nuevo, y qué decidió con ello
//   decision.js    qué hace con eso
//   movement.js    cómo se mueve
//   explore.js     el mapa basto de por dónde ha pasado
//   synapses.js    lo aprendido como conexiones entre neuronas
//   feeding.js     comer y cargar
//   nest.js        el nido

import { WORLD, ENERGY, PHERO, LEARN } from './config.js';
import { createBrain } from './brain.js';
import { decayMemory } from './memory.js';
import { decaySynapses, perceiveSynapses } from './synapses.js';
import { createEffects, updateEffects } from './effects.js';
import { resolveEpisodes } from './episodes.js';
import { autoSave as saveLearning, save, snapshot } from './learned/store.js';
import { nestOf } from './world.js';
import { dropPheromone } from './pheromone.js';
import { increaseNeeds, resolveVitalFailure, drink, spendEnergy } from './needs.js';
import { perceive } from './perception.js';
import { decide } from './decision.js';
import { createAttention, notice } from './attention.js';
import { updateCortex, resetCortex } from './cortex.js';
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
    episode: null,     // la experiencia abierta (comió o bebe) hasta saber cómo acabó
    lastEpisode: null, // la última cerrada o abierta, para el narrador
    directive: null,   // lo que mandó la API de decisión, mientras siga vigente
    cortex: null,      // el canal con la API de decisión. null = no hay ninguna: decide el instinto
    thought: null,     // razonamiento del último frame, lo leen consola y HUD
    attention: createAttention(),  // qué percibió hace nada: lo que no, es nuevo
    rethink: null,     // la última vez que algo nuevo le hizo replantearse el plan
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
    exploreLegs: 0,       // tramos de exploración trazados: cada uno, una decisión
    exploreResume: false, // vuelve a explorar tras otra cosa: ¿retoma el tramo o traza otro?
    legChoice: null,      // la última vez que decidió entre retomar y trazar uno nuevo
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

    saveIn: LEARN.autosaveEvery,  // cuenta atrás para el próximo guardado recuperable
  };
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
  resolveEpisodes(fagi, dt);     // ¿ya se sabe cómo le sentó lo último que comió?
  decayMemory(fagi.brain, dt);   // la confianza baja sola y los sitios se difuminan
  decaySynapses(fagi.brain.synapses, dt, fagi.age);   // y las conexiones sin uso se debilitan
  markVisited(fagi.explored, fagi.x, fagi.y, dt);  // estar en un sitio es conocerlo
  drink(fagi, world, dt);
  useNest(fagi, world);

  const ctx = perceive(fagi, world);
  perceiveSynapses(fagi, ctx, dt);  // percibir algo refuerza sentido→concepto (Hebb)
  ctx.nuevas = notice(fagi, ctx);   // lo que acaba de entrar: obliga a replantearse el plan
  updateCortex(fagi.cortex, fagi, world, ctx, dt);   // pregunta a la API si toca; nunca espera
  decide(fagi, world, ctx, dt);

  // Se queda quieta bebiendo o descansando; el resto del tiempo, en marcha.
  const parada = (fagi.drinking && fagi.thirst > 0) || fagi.thought.action === 'rest';
  if (!parada) act(fagi, world, dt);

  spendEnergy(fagi, world, dt, !parada);
  markTrail(fagi, world, dt);
  tryPickOrEat(fagi, world);
  increaseNeeds(fagi, dt);

  // Morir guarda ya mismo, sin esperar al próximo turno de autoguardado: lo
  // último que aprendió (incluida la lección de esta misma muerte) no se pierde.
  // Y lo que la API tuviera en vuelo deja de contar: ya no hay a quién dirigir.
  if (resolveVitalFailure(fagi)) { save(snapshot(fagi)); resetCortex(fagi.cortex); }
  else saveLearning(fagi, dt);
}
