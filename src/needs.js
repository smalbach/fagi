// Los tres medidores que mantienen viva (o no) a Fagi: hambre, sed y energía.

import { HUNGER, THIRST, ENERGY, WATER } from './config.js';
import { statMult } from './effects.js';
import { waterZone } from './obstacles.js';
import { nestUnder } from './nest.js';
import { rememberPlace, waterPlaceKind } from './memory.js';
import { snapshotBody } from './interoception.js';
import { openEpisode, closeOnDeath } from './episodes.js';

// El turno primero permite beber, comer o usar la despensa y solo después
// resuelve si una necesidad llegó al límite. Así tocar el recurso en el último
// instante salva a Fagi en vez de matarla antes de poder usarlo.
export function increaseNeeds(fagi, dt) {
  fagi.hunger += HUNGER.rate * statMult(fagi, 'hungerRate') * dt;
  fagi.thirst += THIRST.rate * dt;
}

export function resolveVitalFailure(fagi) {
  // Si ambas llegan al límite en el mismo turno, informa de la que se pasó más
  // en proporción a su máximo. Evita que el orden del código decida la causa.
  const hungerOverflow = fagi.hunger / HUNGER.max;
  const thirstOverflow = fagi.thirst / THIRST.max;
  if (hungerOverflow < 1 && thirstOverflow < 1) return false;

  fagi.alive = false;
  fagi.cause = thirstOverflow > hungerOverflow ? 'thirst' : 'hunger';
  fagi.hunger = Math.min(fagi.hunger, HUNGER.max);
  fagi.thirst = Math.min(fagi.thirst, THIRST.max);
  // Si murió con un bocado reciente en el cuerpo, ese bocado carga con la culpa.
  closeOnDeath(fagi);
  return true;
}

// Bebe en el vado, donde hace pie. En el hondo no bebe: patalea. El agua no se gasta.
export function drink(fagi, world, dt) {
  const zona = waterZone(world, fagi.x, fagi.y);
  const pool = zona && !zona.deep ? zona.pool : null;
  const empieza = Boolean(pool) && !fagi.drinking;
  fagi.drinking = Boolean(pool);
  if (!pool) return;
  fagi.homeSearched = false;   // encontró agua: la próxima búsqueda vuelve a empezar en casa

  // Empezar a beber abre una experiencia: se juzga tras un rato bebiendo, por
  // lo que le quitó la sed de verdad. Beber sin sed no enseña nada, porque no
  // siente nada.
  if (empieza) {
    const ep = openEpisode(fagi, { action: 'drink', key: 'agua', before: snapshotBody(fagi) });
    ep.thirstAtStart = fagi.thirst;
  }

  // Beber aquí confirma el sitio: vuelve a saber exactamente dónde está.
  rememberPlace(fagi.brain, waterPlaceKind(pool), pool, fagi.age);

  fagi.thirst = Math.max(0, fagi.thirst - THIRST.drinkRate * dt);
  fagi.drunk += dt;
}

// Gasta energía andando y la recupera parada. En el nido descansa mejor.
// En el hondo patalea: gasta el triple y no hay forma de descansar.
export function spendEnergy(fagi, world, dt, moviendose) {
  const enNido = Boolean(nestUnder(fagi, world));

  if (fagi.swimming) {
    fagi.energy -= ENERGY.drain * WATER.swimEffort * dt;
  } else if (moviendose) {
    fagi.energy -= ENERGY.drain * statMult(fagi, 'speed') * dt;
  } else {
    fagi.energy += (enNido ? ENERGY.restNest : ENERGY.restOutside) * dt;
  }
  fagi.energy = Math.max(0, Math.min(ENERGY.max, fagi.energy));
}
