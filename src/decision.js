// Qué hace Fagi con lo que percibe.
//
// Hay UNA directiva: sobrevivir. De ella salen las demás, en este orden:
//
//   1. sobrevivir ahora      calmar el hambre y la sed, que son lo que mata
//   2. aguantar              sin fuerzas no se sobrevive luego: descansar
//   3. proveer               lo que no necesita ahora, al nido para después
//   4. explorar              sin necesidad y con la despensa hecha, conocer el
//                            mapa es lo único que prepara las tres anteriores
//
// La lista de reglas de abajo es esa jerarquía escrita en orden. Cada una mira
// la situación y devuelve una intención, o null si no le toca; manda la primera
// que conteste. Añadir una conducta nueva es añadir una función a la lista, en
// el escalón que le corresponda.
//
// Una intención es: { action, reason, target, targetKind, trailKey }
//
// Las reglas viven en decision/, un archivo por escalón (más la directiva de
// la API y lo que comparten todas); aquí solo está el orden y quien lo recorre.

import { notice, rethink } from './attention.js';
import { leaveWater, drink, eatCarriedFood, urgency, goToPantry } from './decision/survive.js';
import { rest, seekShelter, anticipate } from './decision/endure.js';
import { carry, pursue } from './decision/provide.js';
import { persistOnScent, persistFromMemory } from './decision/clues.js';
import { earlyDirective, safeDirective } from './decision/directive.js';
import { exploreRule } from './decision/explore.js';

// Exportada: el córtex la usa para saber si una directiva externa puede
// permitirse ignorar la emergencia, o si el instinto tiene que tomar el mando.
export { pressing } from './decision/common.js';

// Cada regla con su escalón y un nombre: el mapa del cerebro enseña cuál
// contestó (el nombre de la función no sirve, se pierde al minificar).
const RULES = [
  // 1. sobrevivir ahora
  ['survive', 'swimOut', leaveWater],
  ['survive', 'drink', drink],
  ['survive', 'eatCarried', eatCarriedFood],
  ['survive', 'directiveEarly', earlyDirective],   // solo contesta con BACKEND.authority === 1, y nunca si apremia sin atenderlo
  ['survive', 'urgency', urgency],
  ['survive', 'pantry', goToPantry],
  // 2. aguantar
  ['endure', 'rest', rest],
  ['endure', 'shelter', seekShelter],
  ['endure', 'anticipate', anticipate],
  // 3. proveer
  ['provide', 'directive', safeDirective],     // solo contesta con BACKEND.authority === 0 (de fábrica)
  ['provide', 'carry', carry],
  ['provide', 'pursue', pursue],
  // pistas de algo que ya percibió y perdió, de la más fresca a la más vieja
  ['clues', 'scent', persistOnScent],
  ['clues', 'memory', persistFromMemory],
];

// Los escalones en orden, para quien quiera dibujar la jerarquía.
export const TIERS = ['survive', 'endure', 'provide', 'clues', 'explore'];

export function decide(fagi, world, ctx, dt) {
  // Lo que acaba de entrar en lo que percibe (fagi.js lo mira antes, para que
  // el córtex también se entere). Las reglas deciden igual en cada frame; lo
  // nuevo hace que se anote si ese frame cambió el plan o no.
  const newOnes = ctx.newOnes ?? notice(fagi, ctx);
  const before = { action: fagi.thought?.action ?? null, target: fagi.target };
  const { intent, who } = firstToAnswer(fagi, world, ctx, dt);
  applySets(fagi, intent, before);
  rethink(fagi, newOnes, before, intent, ctx.ranked);
  fagi.thought = thought(fagi, ctx, intent, who, newOnes);
}

// Recorre REGLAS en orden; manda la primera que conteste. Si no contesta
// ninguna, explorar.
function firstToAnswer(fagi, world, ctx, dt) {
  for (const [tier, name, rule] of RULES) {
    const intent = rule(fagi, world, ctx, dt);
    if (intent) return { intent, who: { tier: tier, rule: name } };
  }
  return { intent: exploreRule(fagi, world, ctx), who: { tier: 'explore', rule: 'explore' } };
}

function applySets(fagi, intent, before) {
  // Las claves que la intención no menciona se quedan como estaban: así una
  // regla solo tiene que hablar de lo que le importa.
  if ('target' in intent) fagi.target = intent.target;
  if ('targetKind' in intent) fagi.targetKind = intent.targetKind;
  if ('trailKey' in intent) fagi.trailKey = intent.trailKey;
  if (intent.action === 'explore') fagi.memory = 0;
  // Vuelve a explorar después de otra cosa: el tramo que dejó a medias no se
  // retoma ni se tira por norma. Al moverse (movement.js/explore) decide entre
  // él y lo que vea ahora, con la misma cuenta.
  if (intent.action === 'explore' && before.action !== 'explore') fagi.exploreResume = true;
}

// Lo que el resto (consola, mapa del cerebro, grabación) lee de esta decisión.
function thought(fagi, ctx, intent, who, newOnes) {
  return {
    ...ctx,
    seesPoints: ctx.seen.length,
    smellsPoints: ctx.smelledOnes.length,
    seesWater: Boolean(ctx.visible),
    remembersWater: Boolean(ctx.waterPlace),
    carrying: fagi.carrying?.type ?? null,
    action: intent.action,
    reason: intent.reason,
    news: newOnes.map((c) => c.key),
    rethink: fagi.rethink,
    tier: who.tier,
    rule: who.rule,
  };
}
