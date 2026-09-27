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
import { salirDelAgua, beber, comerCarga, urgencia, irADespensa } from './decision/sobrevivir.js';
import { descansar, refugiarse, anticiparse } from './decision/aguantar.js';
import { acarrear, perseguir } from './decision/proveer.js';
import { insistirEnElOlor, insistirDeMemoria } from './decision/pistas.js';
import { directivaTemprano, directivaSegura } from './decision/directiva.js';
import { explorar } from './decision/explorar.js';

// Exportada: el córtex la usa para saber si una directiva externa puede
// permitirse ignorar la emergencia, o si el instinto tiene que tomar el mando.
export { apremia } from './decision/comun.js';

// Cada regla con su escalón y un nombre: el mapa del cerebro enseña cuál
// contestó (el nombre de la función no sirve, se pierde al minificar).
const REGLAS = [
  // 1. sobrevivir ahora
  ['survive', 'swimOut', salirDelAgua],
  ['survive', 'drink', beber],
  ['survive', 'eatCarried', comerCarga],
  ['survive', 'directiveEarly', directivaTemprano],   // solo contesta con BACKEND.authority === 1, y nunca si apremia sin atenderlo
  ['survive', 'urgency', urgencia],
  ['survive', 'pantry', irADespensa],
  // 2. aguantar
  ['endure', 'rest', descansar],
  ['endure', 'shelter', refugiarse],
  ['endure', 'anticipate', anticiparse],
  // 3. proveer
  ['provide', 'directive', directivaSegura],     // solo contesta con BACKEND.authority === 0 (de fábrica)
  ['provide', 'carry', acarrear],
  ['provide', 'pursue', perseguir],
  // pistas de algo que ya percibió y perdió, de la más fresca a la más vieja
  ['clues', 'scent', insistirEnElOlor],
  ['clues', 'memory', insistirDeMemoria],
];

// Los escalones en orden, para quien quiera dibujar la jerarquía.
export const ESCALONES = ['survive', 'endure', 'provide', 'clues', 'explore'];

export function decide(fagi, world, ctx, dt) {
  // Lo que acaba de entrar en lo que percibe (fagi.js lo mira antes, para que
  // el córtex también se entere). Las reglas deciden igual en cada frame; lo
  // nuevo hace que se anote si ese frame cambió el plan o no.
  const nuevas = ctx.nuevas ?? notice(fagi, ctx);
  const antes = { action: fagi.thought?.action ?? null, target: fagi.target };
  const { intencion, quien } = primeraQueContesta(fagi, world, ctx, dt);
  aplicar(fagi, intencion, antes);
  rethink(fagi, nuevas, antes, intencion, ctx.ranked);
  fagi.thought = pensamiento(fagi, ctx, intencion, quien, nuevas);
}

// Recorre REGLAS en orden; manda la primera que conteste. Si no contesta
// ninguna, explorar.
function primeraQueContesta(fagi, world, ctx, dt) {
  for (const [escalon, nombre, regla] of REGLAS) {
    const intencion = regla(fagi, world, ctx, dt);
    if (intencion) return { intencion, quien: { tier: escalon, rule: nombre } };
  }
  return { intencion: explorar(fagi, world, ctx), quien: { tier: 'explore', rule: 'explore' } };
}

function aplicar(fagi, intencion, antes) {
  // Las claves que la intención no menciona se quedan como estaban: así una
  // regla solo tiene que hablar de lo que le importa.
  if ('target' in intencion) fagi.target = intencion.target;
  if ('targetKind' in intencion) fagi.targetKind = intencion.targetKind;
  if ('trailKey' in intencion) fagi.trailKey = intencion.trailKey;
  if (intencion.action === 'explore') fagi.memory = 0;
  // Vuelve a explorar después de otra cosa: el tramo que dejó a medias no se
  // retoma ni se tira por norma. Al moverse (movement.js/explore) decide entre
  // él y lo que vea ahora, con la misma cuenta.
  if (intencion.action === 'explore' && antes.action !== 'explore') fagi.exploreResume = true;
}

// Lo que el resto (consola, mapa del cerebro, grabación) lee de esta decisión.
function pensamiento(fagi, ctx, intencion, quien, nuevas) {
  return {
    ...ctx,
    seesPoints: ctx.seen.length,
    smellsPoints: ctx.olidos.length,
    seesWater: Boolean(ctx.visible),
    recuerdaAgua: Boolean(ctx.sitioAgua),
    carrying: fagi.carrying?.type ?? null,
    action: intencion.action,
    reason: intencion.reason,
    news: nuevas.map((c) => c.key),
    rethink: fagi.rethink,
    tier: quien.tier,
    rule: quien.rule,
  };
}
