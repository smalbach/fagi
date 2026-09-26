// Sinapsis: lo aprendido visto como conexiones entre neuronas, igual que en un
// cerebro de verdad, donde aprender es crear conexiones nuevas y reforzar o
// debilitar las que ya hay.
//
// Neuronas (ids con prefijo):
//   sense:vista | sense:olfato | sense:memoria   — por dónde entra lo percibido
//   key:<tipo>                                   — el concepto: néctar, agua…
//   feel:<sensación>                             — lo que el cuerpo notó: hambre,
//                                                  sed, velocidad… (interoception.js)
//
// Dos maneras de formarse, como en biología:
//   - Hebb ("las neuronas que se disparan juntas se conectan"): percibir un
//     tipo por un sentido refuerza sentido→concepto mientras dura. Sin uso se
//     debilita y, por debajo de SYNAPSE.prune, se poda.
//   - Aprendizaje por consecuencias: cada vez que brain.learn() aprende de
//     algo que sintió, el concepto se conecta con esa sensación, con signo:
//     positiva si alivió, negativa si dañó. Olvida mucho más despacio.
//
// Los sitios recordados (memory.places) y las reglas escritas (learned/) ya
// son conexiones por sí mismos; el mapa del cerebro los dibuja desde ahí.
//
// Esto NO decide nada: la cuenta sigue en memory.js y brain.js. Es la huella
// de ese aprendizaje con forma de red, para poder verla.

import { FEEL, SYNAPSE } from './config.js';

export function createSynapses() {
  return {};
}

function conexion(syn, a, b, kind, now) {
  const id = `${a}>${b}`;
  let s = syn[id];
  if (!s) s = syn[id] = { a, b, kind, w: 0, born: now, last: now, n: 0 };
  return s;
}

// Hebb: se refuerza mientras las dos se activan juntas (rate por segundo).
export function hebb(syn, a, b, dt, now) {
  const s = conexion(syn, a, b, 'hebb', now);
  s.w += SYNAPSE.hebbRate * dt * (1 - s.w);
  s.last = now;
  s.n += dt;
}

// Lo que una sensación le dice de algo: de -1 (dañó) a +1 (alivió). La misma
// cuenta que interoception.feel(), sensación a sensación.
export function valorDe(x) {
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  if (x.sense === 'hunger') return clamp(-x.v / FEEL.hungerScale);
  if (x.sense === 'thirst') return clamp(-x.v / FEEL.thirstScale);
  if (x.sense === 'peril') return clamp(x.v);
  if (x.v > 0 && FEEL.statSense[x.sense] !== undefined) {
    return clamp(FEEL.effectWeight * FEEL.statSense[x.sense] * Math.log2(x.v));
  }
  return 0;
}

// Aprender de una consecuencia: concepto → sensación, hacia su valor.
export function wire(syn, key, sensations, now) {
  for (const x of sensations ?? []) {
    const v = valorDe(x);
    if (!v) continue;
    const s = conexion(syn, `key:${key}`, `feel:${x.sense}`, 'feel', now);
    s.w += SYNAPSE.learnRate * (v - s.w);
    s.last = now;
    s.n += 1;
  }
}

// El tiempo pasa: lo que no se usa se debilita y lo muy débil se poda.
// Una recién nacida (usada hace nada) no se poda aunque aún sea débil.
export function decaySynapses(syn, dt, now) {
  if (!syn) return;
  for (const [id, s] of Object.entries(syn)) {
    const k = s.kind === 'hebb' ? SYNAPSE.hebbDecay : SYNAPSE.feelDecay;
    s.w -= Math.sign(s.w) * Math.min(Math.abs(s.w), k * dt);
    if (Math.abs(s.w) < SYNAPSE.prune && now - s.last > 1) delete syn[id];
  }
}

// Lo que percibe este frame dispara sus conexiones sentido → concepto.
export function perceiveSynapses(fagi, ctx, dt) {
  const syn = fagi.brain.synapses;
  if (!syn) return;
  const vistos = new Set();
  for (const c of ctx.ranked ?? []) {
    const id = `sense:${c.via}>key:${c.key}`;
    if (vistos.has(id)) continue;
    vistos.add(id);
    hebb(syn, `sense:${c.via}`, `key:${c.key}`, dt, fagi.age);
  }
  if (ctx.visible && !vistos.has('sense:vista>key:agua')) hebb(syn, 'sense:vista', 'key:agua', dt, fagi.age);
}
