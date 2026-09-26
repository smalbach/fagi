// La foto que le llega a la API de decisión: solo datos, nunca referencias
// vivas del mundo. Todo lo que ve, huele y cree, en JSON puro — lo mismo que
// ya pinta la consola, empaquetado para que lo lea quien sea, dentro o fuera
// del navegador.
//
// Junto a la foto va `refs`: el mapa id → objeto vivo con el que el córtex
// traduce el `targetId` de la respuesta a algo a lo que de verdad ir. Eso NO
// se manda a la API; es la otra mitad, la que se queda en casa.

import { renderRule } from './learned/dsl.js';
import { verdict } from './learned/rules.js';

const r2 = (v) => Math.round(v * 100) / 100;

function aguaEstado(ctx) {
  if (ctx.visible) return 'sees';
  if (ctx.smellsWater) return 'smells';
  if (ctx.sitioAgua) return 'remembers';
  return 'unknown';
}

export function observe(fagi, world, ctx) {
  // refs: id -> objeto vivo, para mover a Fagi de verdad hacia lo que eligió.
  // byId: id -> el mismo resumen que se mandó, para saber SIN tocar el mundo
  // si lo elegido era comida u agua, y si venía de vista, olfato o memoria.
  const refs = new Map();
  const byId = new Map();
  const candidates = [];
  for (const c of ctx.ranked.slice(0, 8)) {
    const id = c.ref?.id;
    if (id == null) continue;   // sin id no hay forma de que la API lo nombre de vuelta
    refs.set(id, c.ref);
    const resumen = {
      id, key: c.key, kind: c.kind, via: c.via,
      dist: r2(c.dist), score: r2(c.score),
      belief: { value: r2(c.value), confidence: r2(c.confidence), stage: c.stage },
      verdict: c.kind === 'food' ? verdict(fagi, 'pursue', c.key) : null,
    };
    byId.set(id, resumen);
    candidates.push(resumen);
  }

  const beliefs = {};
  for (const [k, r] of Object.entries(fagi.brain.facts)) {
    beliefs[k] = { value: r2(r.value), confidence: r2(r.confidence), stage: r.stage, tries: r.tries };
  }

  const observation = {
    version: 1,
    t: r2(fagi.age),
    needs: { hungerU: r2(ctx.hungerU), thirstU: r2(ctx.thirstU), energyU: r2(ctx.energyU) },
    effects: Object.values(fagi.effects ?? {}).map((e) => ({ stat: e.stat, mult: e.mult, left: r2(e.time) })),
    carrying: fagi.carrying?.type ?? null,
    atNest: Boolean(ctx.enNido),
    nestKnown: Boolean(ctx.nido),
    pantry: { ...fagi.pantry },
    water: aguaEstado(ctx),
    candidates,
    beliefs,
    rules: fagi.brain.rules.list.filter((r) => !r.retired).map(renderRule),
    lastEpisode: fagi.lastEpisode
      ? { key: fagi.lastEpisode.key, action: fagi.lastEpisode.action, reward: r2(fagi.lastEpisode.reward ?? 0) }
      : null,
    instinct: fagi.thought ? { action: fagi.thought.action, reason: fagi.thought.reason } : null,
  };

  return { observation, refs, byId };
}
