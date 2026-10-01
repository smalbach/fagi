// Polyethism & Emergent Castes: Dynamic Division of Labor in Colonies.
// (Theraulaz, Bonabeau & Deneubourg model of variable response thresholds)
//
// Specialization emerges without central control:
// - Successful execution of a task reinforces affinity (decreases threshold).
// - Lack of task activity leads to gradual decay toward generalist behavior.
//
// Four behavioral castes:
//   1. Forager   🌾: Food collection, hauling to nest pantry, fruit pursuing.
//   2. Scout     🔭: Horizon exploration, scent plume tracking, sensory probing.
//   3. Nurse     🏠: Nest maintenance, thermal clustering, juvenile rearing.
//   4. Patroller 🛡️: Perimeter defense, trail paving, weather shelter retreats.

import { CASTES } from './config.js';
import { nestUnder } from './nest.js';

export const CASTE_DEFS = {
  forager: {
    id: 'forager',
    name: { en: 'Forager', es: 'Recolectora' },
    color: '#e59a45',
    icon: '🌾',
    actions: ['pursue', 'carry', 'pantry', 'eatCarried'],
    preferredMacros: ['carry', 'pursue', 'pantry'],
  },
  scout: {
    id: 'scout',
    name: { en: 'Scout', es: 'Exploradora' },
    color: '#45a1e5',
    icon: '🔭',
    actions: ['explore', 'zigzag', 'scent', 'taste', 'probe'],
    preferredMacros: ['zigzag', 'explore', 'scent'],
  },
  nurse: {
    id: 'nurse',
    name: { en: 'Nurse', es: 'Nodriza' },
    color: '#9b5de5',
    icon: '🏠',
    actions: ['rest', 'sleep', 'huddle', 'useNest'],
    preferredMacros: ['rest', 'sleep', 'huddle'],
  },
  patrol: {
    id: 'patrol',
    name: { en: 'Patroller', es: 'Patrullera' },
    color: '#52b788',
    icon: '🛡️',
    actions: ['patrol', 'shelterRetreat', 'trackScent'],
    preferredMacros: ['patrol', 'shelterRetreat'],
  },
};

export const CASTE_KEYS = ['forager', 'scout', 'nurse', 'patrol'];

export function createCasteProfile(fagi) {
  // Slight initial variation based on ID / sex
  const seed = (fagi.id ?? 1) % 4;
  const affinities = {
    forager: 0.25,
    scout: 0.25,
    nurse: 0.25,
    patrol: 0.25,
  };
  const key = CASTE_KEYS[seed];
  affinities[key] += 0.05;

  return {
    affinities,
    timeInTask: { forager: 0, scout: 0, nurse: 0, patrol: 0 },
    dominant: key,
    revisionsAsRole: 0,
  };
}

export function casteOf(fagi) {
  const profile = (fagi.casteProfile ??= createCasteProfile(fagi));
  const def = CASTE_DEFS[profile.dominant] ?? CASTE_DEFS.forager;
  return {
    id: profile.dominant,
    name: def.name,
    color: def.color,
    icon: def.icon,
    affinity: profile.affinities[profile.dominant],
    affinities: { ...profile.affinities },
  };
}

// Determines which caste a specific action contributes to
export function taskCategoryOf(action, fagi, world) {
  if (!action) return null;
  if (['carry', 'pantry', 'pursue', 'eatCarried'].includes(action)) return 'forager';
  if (['explore', 'zigzag', 'taste', 'probe'].includes(action)) return 'scout';
  if (['sleep', 'huddle'].includes(action) || (action === 'rest' && world && nestUnder(fagi, world))) return 'nurse';
  if (['patrol', 'shelterRetreat', 'scent'].includes(action)) return 'patrol';
  return null;
}

// Update response thresholds / affinities per simulation frame
export function updateCaste(fagi, world, dt) {
  if (!CASTES.enabled || !fagi.alive) return;
  const profile = (fagi.casteProfile ??= createCasteProfile(fagi));
  const action = fagi.thought?.action;
  const currentTask = taskCategoryOf(action, fagi, world);

  const reinforce = (CASTES.reinforceRate ?? 0.1) * dt;
  const decay = (CASTES.decayRate ?? 0.02) * dt;

  for (const k of CASTE_KEYS) {
    if (k === currentTask) {
      profile.affinities[k] += reinforce;
      profile.timeInTask[k] = (profile.timeInTask[k] ?? 0) + dt;
    } else {
      profile.affinities[k] = Math.max(0.05, profile.affinities[k] - decay);
    }
  }

  // Normalize so affinities sum to 1.0
  const sum = Object.values(profile.affinities).reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (const k of CASTE_KEYS) {
      profile.affinities[k] = Math.round((profile.affinities[k] / sum) * 1000) / 1000;
    }
  }

  // Update dominant caste
  let maxK = profile.dominant;
  let maxV = -Infinity;
  for (const [k, v] of Object.entries(profile.affinities)) {
    if (v > maxV) {
      maxV = v;
      maxK = k;
    }
  }
  profile.dominant = maxK;
}

// Summarize distribution of labor across colony
export function summarizeColonyCastes(colony) {
  const counts = { forager: 0, scout: 0, nurse: 0, patrol: 0 };
  const ants = colony?.ants ?? [];
  let totalAlive = 0;

  for (const f of ants) {
    if (!f.alive) continue;
    totalAlive += 1;
    const c = casteOf(f).id;
    counts[c] = (counts[c] ?? 0) + 1;
  }

  return {
    ...counts,
    total: totalAlive,
  };
}
