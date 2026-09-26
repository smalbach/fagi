// Narrador: mira a Fagi cada frame y anota una línea SOLO cuando algo cambia.
// Así la consola se lee, en vez de llenarse con 60 líneas por segundo.
//
// Guarda claves y datos, nunca frases: la consola las traduce al pintarlas, de
// modo que cambiar de idioma reescribe también el histórico ya anotado.

import { MEMORY, BRAIN } from './config.js';

const MIN_SCORE = BRAIN.minScore;
import { t } from './i18n.js';

const MAX_LINES = 80;

// Etiqueta de color de cada suceso. El texto de la etiqueta sale del idioma.
export const TAG_COLOR = {
  explore: '#7f869a',
  seekFood: '#5bd97e',
  seekWater: '#3d8fd9',
  drink: '#4cc9f0',
  track: '#e8a33d',
  memory: '#b57bff',
  pheromone: '#c9a227',
  carry: '#c9a227',
  toNest: '#c9a227',
  rest: '#7f869a',
  pantry: '#c9a227',
  eat: '#e8a33d',
  pick: '#e8a33d',
  nest: '#c9a227',
  learn: '#b57bff',
  spot: '#8a90a2',
  done: '#7f869a',
  dead: '#d95b7e',
  eatCarried: '#e8a33d',
  searchWaterNearHome: '#3d8fd9',
  api: '#4cc9f0',
  rethink: '#f0c75e',
};

export function createNarrator() {
  return {
    lines: [],
    prev: { action: null, drinking: false, meal: 0, drink: 0, water: 0,
            picked: 0, stored: 0, pantry: 0, alive: true,
            stages: {}, trusted: {}, rule: 0, peril: 0, rethink: 0, leg: 0 },
    seq: 0,
  };
}

function push(nar, fagi, tag, text, detail = null) {
  nar.lines.push({ id: ++nar.seq, t: fagi.age, tag, text, detail });
  if (nar.lines.length > MAX_LINES) nar.lines.shift();
}

const flecha = (antes, despues) => (despues - antes >= 0 ? '↑' : '↓');

// Traduce la lista de sensaciones ("hambre +25 · velocidad ×0.60") a un único
// texto ya resuelto: log.ruleSub solo tiene que insertarlo, sin saber de
// sensaciones ni de idiomas.
function porQue(because) {
  return (because ?? []).map((s) => t(`sense.${s.sense}`, { v: s.v })).join(' · ');
}

export function narrate(nar, fagi) {
  const th = fagi.thought;
  if (!th) return nar.lines;
  const p = nar.prev;

  // Muerte.
  if (p.alive && !fagi.alive) {
    push(nar, fagi, 'dead',
      { key: 'log.died', params: { cause: { key: `cause.${fagi.cause}` } } },
      { key: 'log.diedSub', params: { age: { dur: fagi.age }, eaten: fagi.eaten } });
  }
  p.alive = fagi.alive;
  if (!fagi.alive) return nar.lines;

  // Bocado: qué comió, cómo le sentó y qué aprendió de ello.
  if (fagi.lastMeal && fagi.lastMeal.n !== p.meal) {
    const m = fagi.lastMeal;
    push(nar, fagi, 'eat',
      { key: 'log.ate', params: { what: { key: `type.${m.type}` } } },
      { key: 'log.ateSub', params: {
        hunger: `${Math.round(m.hungerAfter)}%`,
        arrow: flecha(m.beliefBefore, m.beliefAfter),
        before: m.beliefBefore.toFixed(2), after: m.beliefAfter.toFixed(2),
      } });
    p.meal = m.n;
  }

  // Carga un punto en vez de comérselo.
  if ((fagi.picked ?? 0) !== p.picked) {
    push(nar, fagi, 'pick',
      { key: 'log.pick', params: { what: { key: `type.${fagi.carrying?.type ?? 'nectar'}` } } },
      { key: 'log.pickSub' });
    p.picked = fagi.picked ?? 0;
  }

  // Lo deja en la despensa.
  if (fagi.lastDeposit && fagi.lastDeposit.n !== p.stored) {
    const d = fagi.lastDeposit;
    push(nar, fagi, 'nest',
      { key: 'log.store', params: { what: { key: `type.${d.type}` } } },
      { key: 'log.storeSub', params: { what: { key: `type.${d.type}` }, total: d.total } });
    p.stored = d.n;
  }

  // Tira de despensa.
  if (fagi.lastPantry && fagi.lastPantry.n !== p.pantry) {
    push(nar, fagi, 'nest', { key: 'log.pantry' },
      { key: 'log.pantrySub', params: { what: { key: `type.${fagi.lastPantry.type}` } } });
    p.pantry = fagi.lastPantry.n;
  }

  // Un recuerdo se consolida o deja de merecer confianza.
  for (const [key, r] of Object.entries(fagi.brain.facts)) {
    const antes = p.stages[key];
    if (antes !== 'larga' && r.stage === 'larga') {
      push(nar, fagi, 'learn',
        { key: 'log.consolidated', params: { what: { key: `type.${key}` } } },
        { key: 'log.consolidatedSub' });
    }
    p.stages[key] = r.stage;

    const fiable = r.confidence >= MEMORY.minConfidence;
    if (p.trusted[key] && !fiable && r.tries > 0) {
      push(nar, fagi, 'explore',
        { key: 'log.forgot', params: { what: { key: `type.${key}` } } },
        { key: 'log.forgotSub' });
    }
    p.trusted[key] = fiable;
  }

  // Escribe, revisa o retira una regla: la experiencia se convirtió en código.
  if (fagi.brain.lastRule && fagi.brain.lastRule.n !== p.rule) {
    const r = fagi.brain.lastRule;
    const logKey = { nueva: 'log.rule', revisada: 'log.ruleRevised', retirada: 'log.ruleRetired' }[r.kind];
    push(nar, fagi, 'learn',
      { key: logKey, params: { rule: r.id, what: { key: `type.${r.key}` } } },
      { key: 'log.ruleSub', params: { because: porQue(r.because) } });
    p.rule = r.n;
  }

  // Un bocado que parecía llevadero acabó sentando peor de lo que se notó al
  // probarlo: la creencia se corrige aparte, más tarde.
  if (fagi.lastEpisode?.correction && fagi.lastEpisode.n !== p.peril) {
    push(nar, fagi, 'learn',
      { key: 'log.peril', params: { what: { key: `type.${fagi.lastEpisode.key}` } } },
      { key: 'log.perilSub' });
    p.peril = fagi.lastEpisode.n;
  }

  // Descubre una fuente de agua: la memoriza aunque no vaya a ella.
  if ((fagi.waterFound ?? 0) !== p.water) {
    push(nar, fagi, 'spot', { key: 'log.spotWater' }, { key: 'log.spotWaterSub' });
    p.water = fagi.waterFound ?? 0;
  }

  // Bebe por primera vez con sed: descubre para qué sirve el agua.
  if (fagi.lastDrink && fagi.lastDrink.n !== p.drink) {
    const d = fagi.lastDrink;
    push(nar, fagi, 'learn', { key: 'log.tryWater' },
      { key: 'log.tryWaterSub', params: {
        thirst: `${Math.round(d.thirst)}%`,
        arrow: flecha(d.beliefBefore, d.beliefAfter),
        before: d.beliefBefore.toFixed(2), after: d.beliefAfter.toFixed(2),
      } });
    p.drink = d.n;
  }

  // Empieza y termina de beber.
  if (fagi.drinking !== p.drinking) {
    const sed = { key: 'log.thirstIs', params: { thirst: `${Math.round(th.thirstU * 100)}%` } };
    if (fagi.drinking) push(nar, fagi, 'drink', { key: 'log.reachWater' }, sed);
    else push(nar, fagi, 'done', { key: 'log.leaveWater' }, sed);
    p.drinking = fagi.drinking;
  }

  // Algo nuevo entró en lo que percibe: qué hizo con ello.
  if (fagi.rethink && fagi.rethink.n !== p.rethink) {
    p.rethink = fagi.rethink.n;
    const linea = rethinkLine(fagi.rethink, th);
    if (linea) {
      push(nar, fagi, 'rethink', linea.text, linea.detail);
      p.action = th.action;   // el cambio ya queda contado aquí
    }
  }

  // Vuelve a explorar y decide entre el tramo que dejó a medias y uno nuevo.
  if (fagi.legChoice && fagi.legChoice.n !== p.leg) {
    p.leg = fagi.legChoice.n;
    const l = legLine(fagi.legChoice);
    push(nar, fagi, 'rethink', l.text, l.detail);
    if (th.action === 'explore') p.action = th.action;
  }

  // Cambio de decisión.
  if (th.action !== p.action) {
    push(nar, fagi, th.action, { key: `action.${th.action}` }, th.reason);
    p.action = th.action;
  }

  return nar.lines;
}

// La línea de una reconsideración: qué vio, dónde, y si siguió o cambió.
// Lo que no le hace falta ni cambia nada no se escribe: la consola se llenaría
// de cada charco y cada árbol que cruza por delante.
export function rethinkLine(r, th) {
  const base = {
    what: { key: `type.${r.what}` },
    more: r.count > 1 ? { key: 'log.rethinkMore', params: { n: r.count - 1 } } : '',
    side: { key: `side.${r.side}` },
  };
  if (r.changed && r.forNew) {
    return { text: { key: 'log.rethinkFor', params: base }, detail: th?.reason ?? null };
  }
  if (r.why === 'notNeeded') return null;
  if (r.changed) {
    // Cambió de plan en el mismo momento, pero no por lo nuevo: lo nuevo no
    // le vale y lo que pasa a hacer viene de otra parte (la sed que sube...).
    return {
      text: { key: 'log.rethinkSwitch', params: { ...base, to: { key: `action.${r.to}` } } },
      detail: rethinkWhy(r),
    };
  }
  return {
    text: { key: 'log.rethinkKeep', params: { ...base, action: { key: `action.${r.to}` } } },
    detail: rethinkWhy(r),
  };
}

export function rethinkWhy(r) {
  if (!r.why) return null;
  return { key: `rethink.${r.why}`, params: {
    score: r.score != null ? r.score.toFixed(2) : '–',
    current: r.current != null ? r.current.toFixed(2) : '–',
    min: MIN_SCORE.toFixed(2),
    stick: BRAIN.stickiness.toFixed(2),
    action: { key: `action.${r.to}` },
  } };
}

// Retomar el tramo viejo o trazar otro: cuál ganó y por cuánto.
export function legLine(c) {
  const f = (v) => (v == null ? '–' : v.toFixed(2));
  return c.resumed
    ? { text: { key: 'log.legResume' }, detail: { key: 'log.legResumeSub', params: { score: f(c.score), rival: f(c.rival) } } }
    : { text: { key: 'log.legNew' }, detail: { key: 'log.legNewSub', params: { score: f(c.score), rival: f(c.rival) } } };
}
