// El córtex: hace de intermediario con la API de decisión externa sin tocar
// el ritmo del bucle. Nunca se espera a la respuesta — el instinto sigue
// decidiendo mientras tanto — y cuando llega (si llega, y a tiempo) se
// convierte en una directiva con fecha de caducidad que decision.js puede
// consultar como una regla más.

import { BACKEND } from './config.js';
import { observe } from './observation.js';
import { validateIntention } from './backend/index.js';
import { pressing } from './decision.js';

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

// ¿Hay algo que justifique preguntar ahora? Una clave que no había visto, algo
// nuevo en lo que percibe, una experiencia recién cerrada, empezar a apurar,
// llevar mucho explorando sin más, o quedarse sin directiva.
function shouldAsk(cortex, fagi, ctx) {
  let newKey = false;
  for (const c of ctx.ranked) {
    if (!cortex.seenKeys.has(c.key)) { cortex.seenKeys.add(c.key); newKey = true; }
  }
  const newEpisode = Boolean(fagi.lastEpisode) && fagi.lastEpisode.n !== cortex.lastEpisodeN;
  const pressingNow = pressing(ctx);
  const pressingRises = pressingNow && !cortex.wasApremiando;
  const idleTooLong = fagi.thought?.action === 'explore' && cortex.idleFor >= BACKEND.idleAfter;
  const noDirective = !fagi.directive;

  cortex.wasApremiando = pressingNow;
  if (fagi.lastEpisode) cortex.lastEpisodeN = fagi.lastEpisode.n;

  // Algo nuevo en lo que percibe (no solo un tipo nuevo): la directiva vigente
  // se pensó sin eso, así que se vuelve a preguntar con la situación de ahora.
  const hasNews = (ctx.newOnes?.length ?? 0) > 0;

  return newKey || newEpisode || pressingRises || idleTooLong || noDirective || hasNews;
}

export function updateCortex(cortex, fagi, world, ctx, dt) {
  if (!cortex || !cortex.backend || !BACKEND.enabled) return;

  cortex.idleFor = fagi.thought?.action === 'explore' ? cortex.idleFor + dt : 0;

  // La directiva vencida se olvida: mientras no llegue otra, decide el
  // instinto, no una orden caducada.
  if (fagi.directive && fagi.age >= fagi.directive.until) fagi.directive = null;

  const needed = shouldAsk(cortex, fagi, ctx);
  const canAsk = !cortex.inflight && fagi.age - cortex.lastAt >= BACKEND.minInterval;
  if (!needed || !canAsk) return;

  cortex.lastAt = fagi.age;
  cortex.inflight = true;
  cortex.calls += 1;
  const gen = cortex.gen;
  const { observation, refs, byId } = observe(fagi, world, ctx);

  Promise.resolve(cortex.backend.decide(observation, {}))
    .then((response) => applySets(cortex, fagi, gen, response, observation, refs, byId))
    .catch(() => { cortex.inflight = false; });
}

function applySets(cortex, fagi, gen, response, observation, refs, byId) {
  cortex.inflight = false;
  // Llegó tarde: Fagi murió, reinició, o ya va por otra generación. Se tira.
  if (gen !== cortex.gen || !fagi.alive) return;

  const validate = validateIntention(response, observation);
  if (!validate) return;

  const summary = validate.targetId != null ? byId.get(validate.targetId) : null;
  const isNestObj = ['toNest', 'pantry', 'carry'].includes(validate.action);

  fagi.directive = {
    action: validate.action,
    target: validate.targetId != null ? (refs.get(validate.targetId) ?? null) : null,
    targetKind: summary ? summary.kind : (isNestObj ? 'nest' : null),
    trailKey: summary && summary.via === 'smell' ? summary.key : null,
    reason: validate.reason ?? { key: 'reason.api', params: { backend: cortex.backend.name } },
    until: fagi.age + validate.ttl,
    source: cortex.backend.name,
  };
}
