// Atención: qué acaba de entrar en lo que percibe.
//
// Fagi decide en cada frame, pero no todo frame trae algo que pensar. Lo que
// importa es lo NUEVO: una fruta que aparece al costado, un olor que le llega,
// un charco al fondo de la vista. Eso le obliga a replantearse el plan: ¿sigue
// con lo que iba a hacer o esto lo cambia? decision.js decide; este módulo
// solo dice qué es nuevo, y después anota qué se decidió con ello
// (fagi.rethink), que es lo que la consola cuenta.
//
// "Nuevo" es no haberlo percibido en los últimos ATTENTION.forget segundos:
// algo que parpadea en el borde del cono no cuenta como nuevo cada vez.

import { ATTENTION, BRAIN, TREE } from './config.js';
import { normalizeAngle } from './vision.js';

export function createAttention() {
  return { lastSeen: new Map() };   // ref -> edad a la que lo percibió por última vez
}

// Lo que percibe ahora mismo por los sentidos (no lo que solo recuerda), con
// la puntuación que ya le puso perception.js si es algo perseguible.
function perceived(ctx) {
  const list = [];
  const already = new Set();
  for (const c of ctx.ranked) {
    if (c.via === 'memory' || already.has(c.ref)) continue;
    already.add(c.ref);
    list.push(c);
  }
  // Ver agua o un árbol es información aunque ahora no le haga falta.
  for (const [ref, key, kind] of [[ctx.visible, 'water', 'water'], [ctx.visibleSource, TREE.fruit, 'food']]) {
    if (ref && !already.has(ref)) { already.add(ref); list.push({ ref, key, kind, via: 'sight', score: null, dist: null }); }
  }
  return list;
}

// Marca lo percibido y devuelve lo que es nuevo.
export function notice(fagi, ctx) {
  const att = (fagi.attention ??= createAttention());
  const now = fagi.age;
  const newOnes = [];
  for (const c of perceived(ctx)) {
    const before = att.lastSeen.get(c.ref);
    if (before === undefined || now - before > ATTENTION.forget) newOnes.push(c);
    att.lastSeen.set(c.ref, now);
  }
  // Lo que hace mucho que no percibe se olvida de la lista: así no crece.
  for (const [ref, t] of att.lastSeen) if (now - t > ATTENTION.forget * 4) att.lastSeen.delete(ref);
  return newOnes;
}

const NOTHING_BETTER = new Set(['explore', 'pheromone', 'memory', 'track']);

// A qué lado le queda algo, visto desde su rumbo.
function sideOf(fagi, ref) {
  const rel = normalizeAngle(Math.atan2(ref.y - fagi.y, ref.x - fagi.x) - fagi.angle);
  if (Math.abs(rel) < 0.35) return 'ahead';
  return rel < 0 ? 'left' : 'right';
}

// Anota qué hizo con lo nuevo: seguir con el plan o cambiarlo, y por qué.
// `antes` es la intención del frame anterior; `intencion` la de este.
export function rethink(fagi, newOnes, before, intent, ranked = []) {
  // Sin plan previo (el primer frame) no hay nada que replantearse.
  if (!newOnes.length || before.action == null) return null;
  const main = newOnes.reduce((m, c) => ((c.score ?? -Infinity) > (m.score ?? -Infinity) ? c : m));
  const changesNow = intent.action !== before.action
    || ('target' in intent && intent.target !== before.target);
  const goesForNew = newOnes.some((c) => c.ref === intent.target);

  // Por qué sigue igual, si sigue: o lo nuevo no merece la pena, o algo más
  // importante lo tiene ocupado.
  let motive = null;
  // Lo que ya perseguía, si sigue con ello: su puntuación es la que ganó.
  const current = ranked.find((r) => r.ref === intent.target) ?? null;
  if (!changesNow || !goesForNew) {
    // Puntuación negativa: ni se lo plantea (agua sin sed, algo que sabe malo).
    if (main.score == null || main.score <= 0) motive = 'notNeeded';
    else if (main.score <= BRAIN.minScore) motive = 'lowScore';
    else if (current && !newOnes.includes(current)) motive = 'better';
    // Puntúa, pero lo que hace es de un escalón más urgente (beber, cargar,
    // descansar, una directiva...), o lo que hace es de los de "sin nada
    // mejor" y aun así no fue a por ello: entonces no le sirve (despensa
    // llena, o aprendió a no perseguirlo).
    else motive = NOTHING_BETTER.has(intent.action) ? 'notUseful' : 'busy';
  }

  fagi.rethink = {
    n: (fagi.rethink?.n ?? 0) + 1,
    what: main.key,
    via: main.via,
    side: sideOf(fagi, main.ref),
    count: newOnes.length,
    score: main.score,
    current: current?.score ?? null,
    from: before.action,
    to: intent.action,
    changed: changesNow,
    forNew: goesForNew,
    why: motive,
  };
  return fagi.rethink;
}
