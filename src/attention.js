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
function percibido(ctx) {
  const lista = [];
  const ya = new Set();
  for (const c of ctx.ranked) {
    if (c.via === 'memoria' || ya.has(c.ref)) continue;
    ya.add(c.ref);
    lista.push(c);
  }
  // Ver agua o un árbol es información aunque ahora no le haga falta.
  for (const [ref, key, kind] of [[ctx.visible, 'agua', 'water'], [ctx.visibleSource, TREE.fruit, 'food']]) {
    if (ref && !ya.has(ref)) { ya.add(ref); lista.push({ ref, key, kind, via: 'vista', score: null, dist: null }); }
  }
  return lista;
}

// Marca lo percibido y devuelve lo que es nuevo.
export function notice(fagi, ctx) {
  const att = (fagi.attention ??= createAttention());
  const ahora = fagi.age;
  const nuevas = [];
  for (const c of percibido(ctx)) {
    const antes = att.lastSeen.get(c.ref);
    if (antes === undefined || ahora - antes > ATTENTION.forget) nuevas.push(c);
    att.lastSeen.set(c.ref, ahora);
  }
  // Lo que hace mucho que no percibe se olvida de la lista: así no crece.
  for (const [ref, t] of att.lastSeen) if (ahora - t > ATTENTION.forget * 4) att.lastSeen.delete(ref);
  return nuevas;
}

const SIN_NADA_MEJOR = new Set(['explore', 'pheromone', 'memory', 'track']);

// A qué lado le queda algo, visto desde su rumbo.
function lado(fagi, ref) {
  const rel = normalizeAngle(Math.atan2(ref.y - fagi.y, ref.x - fagi.x) - fagi.angle);
  if (Math.abs(rel) < 0.35) return 'ahead';
  return rel < 0 ? 'left' : 'right';
}

// Anota qué hizo con lo nuevo: seguir con el plan o cambiarlo, y por qué.
// `antes` es la intención del frame anterior; `intencion` la de este.
export function rethink(fagi, nuevas, antes, intencion, ranked = []) {
  // Sin plan previo (el primer frame) no hay nada que replantearse.
  if (!nuevas.length || antes.action == null) return null;
  const principal = nuevas.reduce((m, c) => ((c.score ?? -Infinity) > (m.score ?? -Infinity) ? c : m));
  const cambia = intencion.action !== antes.action
    || ('target' in intencion && intencion.target !== antes.target);
  const vaPorLoNuevo = nuevas.some((c) => c.ref === intencion.target);

  // Por qué sigue igual, si sigue: o lo nuevo no merece la pena, o algo más
  // importante lo tiene ocupado.
  let motivo = null;
  // Lo que ya perseguía, si sigue con ello: su puntuación es la que ganó.
  const actual = ranked.find((r) => r.ref === intencion.target) ?? null;
  if (!cambia || !vaPorLoNuevo) {
    // Puntuación negativa: ni se lo plantea (agua sin sed, algo que sabe malo).
    if (principal.score == null || principal.score <= 0) motivo = 'notNeeded';
    else if (principal.score <= BRAIN.minScore) motivo = 'lowScore';
    else if (actual && !nuevas.includes(actual)) motivo = 'better';
    // Puntúa, pero lo que hace es de un escalón más urgente (beber, cargar,
    // descansar, una directiva...), o lo que hace es de los de "sin nada
    // mejor" y aun así no fue a por ello: entonces no le sirve (despensa
    // llena, o aprendió a no perseguirlo).
    else motivo = SIN_NADA_MEJOR.has(intencion.action) ? 'notUseful' : 'busy';
  }

  fagi.rethink = {
    n: (fagi.rethink?.n ?? 0) + 1,
    what: principal.key,
    via: principal.via,
    side: lado(fagi, principal.ref),
    count: nuevas.length,
    score: principal.score,
    current: actual?.score ?? null,
    from: antes.action,
    to: intencion.action,
    changed: cambia,
    forNew: vaPorLoNuevo,
    why: motivo,
  };
  return fagi.rethink;
}
