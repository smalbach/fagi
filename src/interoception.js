// Interocepción: el cuerpo se siente a sí mismo.
//
// Fagi no sabe si un fruto es bueno o malo. Lo que sí sabe, de nacimiento, es
// cómo se siente su cuerpo: que baje el hambre alivia, que suba duele, ir más
// despacio se nota torpe y ver más lejos se nota bien. De comparar el cuerpo de
// antes con el de después sale la única señal con la que aprende.
//
// Esto es lo innato. Qué cosa del mundo produjo la sensación lo averigua
// probando, y eso es lo aprendido.

import { FEEL } from './config.js';
import { statMult } from './effects.js';

const STATS = ['speed', 'viewRange', 'fovDeg', 'smell', 'hungerRate'];

// Foto del cuerpo en este instante.
export function snapshotBody(fagi) {
  const mults = {};
  for (const s of STATS) mults[s] = statMult(fagi, s);
  // Un stat con efecto activo que no está en la lista también cuenta.
  for (const s of Object.keys(fagi.effects ?? {})) if (!(s in mults)) mults[s] = statMult(fagi, s);
  return { hunger: fagi.hunger, thirst: fagi.thirst, energy: fagi.energy, mults };
}

const clamp1 = (v) => Math.max(-1, Math.min(1, v));

// Qué sintió entre dos fotos del cuerpo. Devuelve la recompensa total, de -1 a
// +1, y la lista de sensaciones que la componen, que es lo que luego explica
// la regla aprendida ("porque hambre +25, velocidad ×0.6").
export function feel(before, after) {
  const sensations = [];
  let total = 0;

  const dHunger = after.hunger - before.hunger;
  if (dHunger !== 0) {
    total += -dHunger / FEEL.hungerScale;
    sensations.push({ sense: 'hunger', v: round(dHunger) });
  }

  const dThirst = after.thirst - before.thirst;
  if (dThirst !== 0) {
    total += -dThirst / FEEL.thirstScale;
    sensations.push({ sense: 'thirst', v: round(dThirst) });
  }

  // Un multiplicador que cambia se nota; uno que se refresca igual, no.
  const stats = new Set([...Object.keys(before.mults ?? {}), ...Object.keys(after.mults ?? {})]);
  for (const s of stats) {
    const a = before.mults?.[s] ?? 1;
    const b = after.mults?.[s] ?? 1;
    if (a === b || a <= 0 || b <= 0) continue;
    const sense = FEEL.statSense[s] ?? 1;
    total += FEEL.effectWeight * sense * Math.log2(b / a);
    sensations.push({ sense: s, v: round(b / a) });
  }

  return { reward: clamp1(total), sensations };
}

function round(v) {
  return Math.round(v * 100) / 100;
}
