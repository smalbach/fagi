// El agua honda. Una hormiga no nada: la tensión superficial la atrapa y
// patalea casi sin avanzar, gastando fuerzas. Eso es física y le pasa siempre
// (movement.js la frena, needs.js le cobra la energía, decision.js la saca a
// la orilla más cercana). Lo que no sabe de nacimiento es que el hondo es
// mala idea: lo aprende hundiéndose, como aprende qué fruto le sienta mal.
//
// Cada rato en el hondo es una experiencia: al salir (o tras WATER.sample
// segundos dentro, si sigue atrapada) siente lo que le costó —ir a paso de
// pataleo y la energía que se le fue— y eso baja la creencia 'hondo'. Cuando
// pesa lo bastante, synth.js escribe la regla "evitar hondo" y desde entonces
// lo rodea como a una roca (fearsDeep). Beber en el vado no cuenta: ahí hace pie.
//
// Y tres cosas más del cuerpo, que tampoco se aprenden:
//   · empapada: al salir del hondo, o bajo la lluvia fuera del nido, el agua
//     se le pega y va más lenta hasta secarse (fagi.wet, segundos que le quedan).
//   · antenas: notan el agua un poco antes de pisarla, y avanza tanteando
//     mientras las tenga sobre el hondo (fagi.probing). Es la señal con la que
//     luego reconoce el hondo: percibirla conecta antenas→hondo (Hebb).

import { WATER, FAGI } from './config.js';
import { learn } from './brain.js';
import { verdict } from './learned/rules.js';
import { waterZone } from './obstacles.js';
import { hebb } from './synapses.js';
import { nestUnder } from './nest.js';

export const DEEP = 'hondo';

// ¿Ya aprendió a no meterse? Lo dice la regla escrita, no un instinto.
export function fearsDeep(fagi) {
  return verdict(fagi, 'pursue', DEEP) === 'avoid';
}

function aprender(fagi, dunk) {
  // Perder pie asusta ya de por sí; lo que dure el pataleo lo empeora.
  const parte = WATER.shock + (1 - WATER.shock) * Math.min(1, dunk.secs / WATER.sample);
  const perdida = Math.max(0, dunk.energy - fagi.energy);
  const cambio = learn(fagi.brain, DEEP, -WATER.lesson * parte, fagi.age, [
    { sense: 'speed', v: WATER.swimSpeed },
    { sense: 'energy', v: -Math.round(perdida * 100) / 100 },
  ]);
  fagi.dunks = (fagi.dunks ?? 0) + 1;
  fagi.lastDunk = {
    n: fagi.dunks, secs: dunk.secs,
    beliefBefore: cambio.before.value, beliefAfter: cambio.after.value,
  };
}

// Se llama una vez por frame, antes de decidir: deja fagi.swimming al día y
// cierra la experiencia cuando toca.
// ¿Tiene alguna antena sobre el hondo? Las dos puntas, un poco por delante.
function antenasEnElAgua(fagi, world) {
  const lejos = FAGI.radius + WATER.probeReach;
  for (const lado of [-0.35, 0.35]) {
    const a = fagi.angle + lado;
    if (waterZone(world, fagi.x + Math.cos(a) * lejos, fagi.y + Math.sin(a) * lejos)?.deep) return true;
  }
  return false;
}

export function swim(fagi, world, dt) {
  const zona = waterZone(world, fagi.x, fagi.y);
  const hondo = Boolean(zona?.deep);
  fagi.swimming = hondo;
  // Bajo la lluvia, fuera del nido, se empapa igual que en el hondo.
  fagi.raining = Boolean(world.rain?.on);
  const aCubierto = Boolean(nestUnder(fagi, world));
  fagi.wet = hondo || (fagi.raining && !aCubierto) ? WATER.dryTime : Math.max(0, (fagi.wet ?? 0) - dt);
  fagi.probing = !hondo && antenasEnElAgua(fagi, world);
  if (fagi.probing) {
    fagi.probed = true;
    if (fagi.brain.synapses) hebb(fagi.brain.synapses, 'sense:antenas', `key:${DEEP}`, dt, fagi.age);
  }

  if (hondo && !fagi.dunk) fagi.dunk = { secs: 0, energy: fagi.energy };
  const dunk = fagi.dunk;
  if (!dunk) return;
  if (hondo) dunk.secs += dt;

  if (!hondo || dunk.secs >= WATER.sample) {
    aprender(fagi, dunk);
    fagi.dunk = hondo ? { secs: 0, energy: fagi.energy } : null;
  }
}
