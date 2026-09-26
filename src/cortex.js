// El córtex: hace de intermediario con la API de decisión externa sin tocar
// el ritmo del bucle. Nunca se espera a la respuesta — el instinto sigue
// decidiendo mientras tanto — y cuando llega (si llega, y a tiempo) se
// convierte en una directiva con fecha de caducidad que decision.js puede
// consultar como una regla más.

import { BACKEND } from './config.js';
import { observe } from './observation.js';
import { validateIntention } from './backend/index.js';
import { apremia } from './decision.js';

export function createCortex(backend) {
  return {
    backend,
    inflight: false,
    gen: 0,           // se sube al morir o reiniciar: invalida una respuesta que llegue tarde
    lastAt: -Infinity,
    seenKeys: new Set(),
    lastEpisodeN: 0,
    idleFor: 0,
    wasApremiando: false,
    calls: 0,          // cuántas veces ha preguntado, para el HUD y los tests
  };
}

// Al morir o reiniciar: lo que esté en vuelo deja de contar.
export function resetCortex(cortex) {
  if (!cortex) return;
  cortex.gen += 1;
  cortex.inflight = false;
  cortex.seenKeys = new Set();
  cortex.lastEpisodeN = 0;
  cortex.idleFor = 0;
  cortex.wasApremiando = false;
}

// ¿Hay algo que justifique preguntar ahora? Una clave que no había visto, una
// experiencia recién cerrada, empezar a apurar, llevar mucho explorando sin
// más, o quedarse sin directiva.
function tocaPreguntar(cortex, fagi, ctx) {
  let claveNueva = false;
  for (const c of ctx.ranked) {
    if (!cortex.seenKeys.has(c.key)) { cortex.seenKeys.add(c.key); claveNueva = true; }
  }
  const episodioNuevo = Boolean(fagi.lastEpisode) && fagi.lastEpisode.n !== cortex.lastEpisodeN;
  const apremiaAhora = apremia(ctx);
  const apremiaSube = apremiaAhora && !cortex.wasApremiando;
  const inactivaMucho = fagi.thought?.action === 'explore' && cortex.idleFor >= BACKEND.idleAfter;
  const sinDirectiva = !fagi.directive;

  cortex.wasApremiando = apremiaAhora;
  if (fagi.lastEpisode) cortex.lastEpisodeN = fagi.lastEpisode.n;

  return claveNueva || episodioNuevo || apremiaSube || inactivaMucho || sinDirectiva;
}

export function updateCortex(cortex, fagi, world, ctx, dt) {
  if (!cortex || !cortex.backend || !BACKEND.enabled) return;

  cortex.idleFor = fagi.thought?.action === 'explore' ? cortex.idleFor + dt : 0;

  // La directiva vencida se olvida: mientras no llegue otra, decide el
  // instinto, no una orden caducada.
  if (fagi.directive && fagi.age >= fagi.directive.until) fagi.directive = null;

  const hazFalta = tocaPreguntar(cortex, fagi, ctx);
  const puedePreguntar = !cortex.inflight && fagi.age - cortex.lastAt >= BACKEND.minInterval;
  if (!hazFalta || !puedePreguntar) return;

  cortex.lastAt = fagi.age;
  cortex.inflight = true;
  cortex.calls += 1;
  const gen = cortex.gen;
  const { observation, refs, byId } = observe(fagi, world, ctx);

  Promise.resolve(cortex.backend.decide(observation, {}))
    .then((respuesta) => aplicar(cortex, fagi, gen, respuesta, observation, refs, byId))
    .catch(() => { cortex.inflight = false; });
}

function aplicar(cortex, fagi, gen, respuesta, observation, refs, byId) {
  cortex.inflight = false;
  // Llegó tarde: Fagi murió, reinició, o ya va por otra generación. Se tira.
  if (gen !== cortex.gen || !fagi.alive) return;

  const valida = validateIntention(respuesta, observation);
  if (!valida) return;

  const resumen = valida.targetId != null ? byId.get(valida.targetId) : null;
  const esNido = ['toNest', 'pantry', 'carry'].includes(valida.action);

  fagi.directive = {
    action: valida.action,
    target: valida.targetId != null ? (refs.get(valida.targetId) ?? null) : null,
    targetKind: resumen ? resumen.kind : (esNido ? 'nest' : null),
    trailKey: resumen && resumen.via === 'olfato' ? resumen.key : null,
    reason: valida.reason ?? { key: 'reason.api', params: { backend: cortex.backend.name } },
    until: fagi.age + valida.ttl,
    source: cortex.backend.name,
  };
}
