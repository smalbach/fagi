// What each organ of hers is doing right now, and what it is setting off.
//
// Nothing here is computed for the picture: every number is one the
// simulation already keeps on her (needs.js, stomach.js, thermal.js,
// sleep.js, health.js, taste.js, load.js, morph.js, lifecycle.js) or in her
// thought (decision.js). An organ's `level` (0-1) is how hard it is working or
// how loudly it is signalling; `size` is the organ she carries (MORPH) against
// the one in her genes. `drives` names the line of her program it is setting
// off now: the organ whose signal the winning line answers to.

import { HUNGER, THIRST, STOMACH, THERMAL, SLEEP, TASTE, LIFE, HEALTH, ENERGY } from '../config.js';
import { energyMax, bodyMult } from '../biology.js';
import { burden, loadOn } from '../load.js';
import { stomachOn } from '../stomach.js';
import { fertility } from '../lifecycle.js';
import { labelOf } from '../i18n.js';

// The organs, in the order the list shows them. `gene`: the MORPH trait that
// sizes it, if any.
export const ORGANS = [
  { id: 'brain', color: '#b57bff', gene: 'brain' },
  { id: 'eyes', color: '#f0c75e', gene: 'eyes' },
  { id: 'antennae', color: '#e89a4c', gene: 'antennae' },
  { id: 'mouth', color: '#f07a5e' },
  { id: 'crop', color: '#d95b7e', gene: 'gut' },
  { id: 'fat', color: '#8fd93d' },
  { id: 'hemolymph', color: '#3d8fd9' },
  { id: 'muscles', color: '#4cc9b0', gene: 'muscle' },
  { id: 'cuticle', color: '#c9a227' },
  { id: 'tubules', color: '#9fb3c8' },
  { id: 'ovary', color: '#ff8fc7' },
];
export const ORGAN = Object.fromEntries(ORGANS.map((o) => [o.id, o]));

// Which organ each behavior answers to: what has to be signalling for that
// line to act. A function when it depends on her state.
const DRIVER = {
  swimOut: 'cuticle', drink: 'hemolymph', sip: 'hemolymph', thirstSearch: 'hemolymph',
  eatCarried: 'crop', pantry: 'crop',
  urgency: (f, th) => ((th.thirstU ?? 0) > (th.hungerU ?? 0) ? 'hemolymph' : 'crop'),
  directiveEarly: 'brain', directive: 'brain', patrol: 'brain', memory: 'brain', explore: 'brain',
  thermalReflex: 'cuticle', thermal: 'cuticle', huddle: 'cuticle', shelterRetreat: 'cuticle', shelter: 'cuticle', dusk: 'eyes',
  anticipate: 'antennae', scent: 'antennae', zigzag: 'antennae', pheromone: 'antennae',
  rest: 'fat', sleep: 'brain',
  carry: 'mouth', line: 'mouth', taste: 'mouth', probe: 'mouth',
  pursue: (f, th) => ((th.seesPoints ?? 0) > 0 ? 'eyes' : 'antennae'),
  seen: 'eyes', site: 'brain', random: 'brain',
};

export function driverOf(fagi) {
  const th = fagi.thought ?? {};
  const d = DRIVER[th.rule];
  return typeof d === 'function' ? d(fagi, th) : d ?? null;
}

const clamp = (v) => Math.max(0, Math.min(1, v));
const pct = (v) => Math.round(clamp(v) * 100);

// Every organ: { id, color, level, size, gene, text: { key, params }, drives }.
export function readOrgans(fagi) {
  const th = fagi.thought ?? {};
  const hungerU = th.hungerU ?? (fagi.hunger ?? 0) / HUNGER.max;
  const thirstU = th.thirstU ?? (fagi.thirst ?? 0) / THIRST.max;
  const energyU = th.energyU ?? (fagi.energy ?? 0) / energyMax(fagi);
  const asleep = th.action === 'rest' && SLEEP.enabled && (fagi.sleepTime ?? 0) > 0;
  const light = fagi.light ?? 1;
  const driver = driverOf(fagi);
  const out = {};

  // Brain: the line that answered, and how much sleep is pressing.
  out.brain = SLEEP.enabled
    ? { level: asleep ? 0.25 : 0.5 + 0.5 * (fagi.rethink ? 1 : 0), key: 'body.brain.sleep', params: { line: th.line ?? th.rule ?? '—', sleep: pct(fagi.sleepPressure ?? 0) } }
    : { level: 0.5 + 0.5 * (fagi.rethink ? 1 : 0), key: 'body.brain', params: { line: th.line ?? th.rule ?? '—' } };

  const seen = th.seesPoints ?? 0;
  out.eyes = fagi.dark
    ? { level: 0.15 * light + (seen ? 0.3 : 0), key: 'body.eyes.dark', params: { n: seen, light: pct(light) } }
    : { level: seen ? Math.min(1, 0.35 + 0.15 * seen) : 0.12, key: seen ? 'body.eyes' : 'body.eyes.none', params: { n: seen } };

  const smelled = th.smellsPoints ?? 0;
  const tracking = th.action === 'pheromone' || th.action === 'track';
  out.antennae = fagi.pressureFalling
    ? { level: 0.9, key: 'body.antennae.pressure', params: {} }
    : smelled || tracking
      ? { level: Math.min(1, 0.35 + 0.15 * smelled + (tracking ? 0.3 : 0)), key: 'body.antennae', params: { n: smelled } }
      : { level: 0.1, key: 'body.antennae.none', params: {} };

  const chewing = (fagi.nextBiteAt ?? 0) > (fagi.age ?? 0);
  out.mouth = fagi.drinking
    ? { level: 1, key: 'body.mouth.drink', params: {} }
    : chewing
      ? { level: 0.9, key: 'body.mouth.chew', params: { what: labelOf(fagi.lastMeal?.type ?? '') } }
      : fagi.carrying
        ? { level: 0.6, key: 'body.mouth.carry', params: { what: labelOf(fagi.carrying.type), w: (fagi.carrying.weight ?? 1).toFixed(1) } }
        : { level: 0.05, key: 'body.mouth.idle', params: {} };

  if (stomachOn()) {
    const cap = STOMACH.capacity * bodyMult(fagi, 'digest');
    const fill = (fagi.stomach ?? 0) / cap;
    out.crop = { level: Math.max(fill, hungerU), key: fill > 0.01 ? 'body.crop.digest' : 'body.crop.empty', params: { fill: pct(fill), rate: STOMACH.rate.toFixed(1), hunger: pct(hungerU) } };
  } else {
    out.crop = { level: hungerU, key: 'body.crop', params: { hunger: pct(hungerU) } };
  }

  out.fat = { level: 1 - energyU, key: 'body.fat', params: { energy: pct(energyU), tired: Math.round(ENERGY.tired) } };
  out.hemolymph = { level: thirstU, key: fagi.drinking ? 'body.hemolymph.drink' : 'body.hemolymph', params: { thirst: pct(thirstU) } };

  const load = loadOn() ? burden(fagi) : 0;
  out.muscles = fagi.swimming
    ? { level: 1, key: 'body.muscles.swim', params: {} }
    : fagi.moving
      ? { level: Math.min(1, 0.45 + 0.5 * load), key: load > 0 ? 'body.muscles.load' : 'body.muscles', params: { load: (1 + load).toFixed(2) } }
      : { level: 0.05, key: 'body.muscles.still', params: {} };

  if (THERMAL.enabled) {
    const stress = (fagi.thermalStress ?? 0) / THERMAL.maxStress;
    const feel = fagi.thermalFeel;
    out.cuticle = {
      level: Math.max(stress, fagi.wet ? 0.5 : 0, feel ? 0.4 : 0),
      key: feel === 'heat' ? 'body.cuticle.heat' : feel === 'cold' ? 'body.cuticle.cold' : fagi.wet ? 'body.cuticle.wet' : 'body.cuticle',
      params: { temp: (fagi.temperature ?? THERMAL.preferred).toFixed(1), stress: pct(stress) },
    };
  } else {
    out.cuticle = { level: fagi.wet ? 0.5 : 0.05, key: fagi.wet ? 'body.cuticle.wet' : 'body.cuticle.off', params: {} };
  }
  if (HEALTH.enabled && (fagi.health ?? HEALTH.max) < HEALTH.max) {
    out.cuticle.wound = { key: 'body.wound', params: { health: pct((fagi.health ?? HEALTH.max) / HEALTH.max) } };
  }

  out.tubules = TASTE.enabled && TASTE.salt
    ? { level: 1 - (fagi.sodium ?? 1), key: 'body.tubules', params: { sodium: pct(fagi.sodium ?? 1) } }
    : { level: 0.05, key: 'body.tubules.off', params: {} };

  if (!LIFE.enabled || fagi.sex === 'male') {
    out.ovary = { level: 0, key: fagi.sex === 'male' ? 'body.ovary.male' : 'body.ovary.off', params: {}, absent: fagi.sex === 'male' };
  } else if (fagi.lifeStage === 'juvenile') {
    out.ovary = { level: 0.05, key: 'body.ovary.young', params: {} };
  } else {
    const f = fertility(fagi);
    out.ovary = { level: f, key: 'body.ovary', params: { f: pct(f) } };
  }

  return ORGANS.map((o) => {
    const r = out[o.id];
    const size = o.gene && fagi.morph ? fagi.morph[o.gene] ?? 1 : null;
    const gene = o.gene && fagi.genome?.morph ? fagi.genome.morph[o.gene] ?? 1 : null;
    return { ...o, ...r, level: clamp(r.level), size, gene, drives: driver === o.id ? th.line ?? th.rule : null };
  });
}
