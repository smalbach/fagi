// Episodios: una experiencia desde que empieza hasta que se sabe cómo acabó.
//
// Comer o beber abre un episodio con una foto del cuerpo de antes. Lo que
// siente justo después (interoception.js) enseña de inmediato. Pero un bocado
// también puede sentar mal más tarde: si en los segundos siguientes la
// necesidad que venía a calmar se dispara hasta lo crítico, o si Fagi muere con
// él en el cuerpo, el episodio se cierra con un castigo.
//
// Solo hay un episodio pendiente a la vez. Abrir otro cierra el anterior sin
// más: dos bocados seguidos no pueden cargar los dos con el mismo susto.

import { FEEL, NEEDS, HUNGER, THIRST, PHERO } from './config.js';
import { learn } from './brain.js';
import { snapshotBody, feel } from './interoception.js';

const NEED_OF = { eat: 'hunger', drink: 'thirst' };

// Fracción de una necesidad, leída de un cuerpo cualquiera (el de antes o el
// de ahora): así se puede comparar sin confundir el uno con el otro.
function needU(body, need) {
  return need === 'thirst' ? body.thirst / THIRST.max : body.hunger / HUNGER.max;
}

// learn() ya se ocupa de todo: ajusta la creencia y, si toca, escribe o
// revisa la regla. Aquí solo se le pasan las sensaciones que la explican.
function aprender(fagi, key, reward, sensations) {
  return learn(fagi.brain, key, reward, fagi.age, sensations);
}

// Abre un episodio y enseña de inmediato lo que sintió. `before` es la foto del
// cuerpo antes de comer o de empezar a beber.
export function openEpisode(fagi, { action, key, before }) {
  const anterior = fagi.episode;
  if (anterior) cerrar(fagi, anterior, null);   // el susto, si viene, es del nuevo

  const need = NEED_OF[action] ?? 'hunger';
  const ep = {
    n: (fagi.lastEpisode?.n ?? 0) + 1,
    action, key, need,
    at: fagi.age,
    before,
    // Si YA venía crítica antes del bocado, el mal desenlace no es sorpresa:
    // la interocepción inmediata ya lo enseñó. Solo se castiga en diferido
    // cuando el bocado la deja cruzando el umbral que antes no cruzaba.
    critAt: needU(before, need) >= NEEDS.critical,
    reward: 0,
    sensations: [],
    cambio: null,
    correction: null,
    pending: true,
  };

  // Beber se juzga después, cuando ya haya bebido un rato (o al salir del agua).
  if (action !== 'drink') sentir(fagi, ep);

  fagi.episode = ep;
  fagi.lastEpisode = ep;
  return ep;
}

function sentir(fagi, ep) {
  const after = snapshotBody(fagi);
  const { reward, sensations } = feel(ep.before, after);
  ep.reward = reward;
  ep.sensations = sensations;
  ep.cambio = aprender(fagi, ep.key, reward, sensations);
}

// El tiempo pasa: comprueba si el episodio pendiente ya se puede cerrar.
export function resolveEpisodes(fagi, dt) {
  const ep = fagi.episode;
  if (!ep) return;

  if (ep.action === 'drink') {
    const basta = fagi.age - ep.at >= FEEL.drinkSample || !fagi.drinking;
    if (basta) {
      sentir(fagi, ep);
      fagi.lastDrink = {
        n: ep.n, thirst: ep.before.thirst,
        beliefBefore: ep.cambio.before.value, beliefAfter: ep.cambio.after.value,
        kind: ep.cambio.kind,
      };
      cerrar(fagi, ep, null);
    }
    return;
  }

  if (fagi.age - ep.at < FEEL.window) return;

  // Mal desenlace: venía a calmar una necesidad y acabó crítica en la ventana.
  const ahoraCritica = needU(fagi, ep.need) >= NEEDS.critical;   // fagi = cuerpo AHORA
  const correction = !ep.critAt && ahoraCritica ? -FEEL.perilWeight : null;
  cerrar(fagi, ep, correction);
}

// Seguir su propio rastro también es una experiencia, y se juzga por cómo
// acaba: si en PHERO.learnWindow segundos recoge o come algo, el rastro llevó a
// comida; si no, no llevó a nada. Si lo deja porque algo más urgente manda
// (sed, hambre crítica), no se juzga: no es culpa del rastro.
// Se llama después de actuar, cuando ya se sabe si recogió o comió.
export function resolveTrail(fagi) {
  const comida = (fagi.picked ?? 0) + fagi.eaten;
  const siguiendo = fagi.thought?.action === 'pheromone';
  const ep = fagi.trailEp;

  if (!ep) {
    if (siguiendo) fagi.trailEp = { at: fagi.age, comida };
    return;
  }
  if (comida > ep.comida) {
    aprender(fagi, 'feromona', PHERO.found, [{ sense: 'found', v: 1 }]);
    fagi.trailEp = null;
  } else if (!siguiendo && fagi.thought?.tier === 'survive') {
    fagi.trailEp = null;
  } else if (fagi.age - ep.at >= PHERO.learnWindow) {
    aprender(fagi, 'feromona', PHERO.miss, [{ sense: 'lost', v: -1 }]);
    fagi.trailEp = null;
  }
}

// Morir con un bocado reciente en el cuerpo es la peor lección posible.
export function closeOnDeath(fagi) {
  const ep = fagi.episode;
  if (!ep) return null;
  if (ep.action === 'drink' && ep.cambio === null) sentir(fagi, ep);
  cerrar(fagi, ep, -FEEL.deathPenalty);
  return ep;
}

function cerrar(fagi, ep, correction) {
  if (!ep.pending) return;
  ep.pending = false;
  if (correction !== null && correction !== 0) {
    ep.correction = correction;
    ep.cambio = aprender(fagi, ep.key, correction, [{ sense: 'peril', v: correction }]);
  }
  if (fagi.episode === ep) fagi.episode = null;
}
