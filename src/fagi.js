// Fagi: an ant with a single directive, survive.
//
// This file only defines her and orders her turn. Each part lives on its own:
//   needs.js       hunger, thirst and energy
//   perception.js  what she sees, what she smells and how she scores it
//   attention.js   what of that is new, and what she decided with it
//   decision.js    what she does with it
//   movement.js    how she moves
//   explore.js     the coarse map of where she has been
//   synapses.js    what's learned as connections between neurons
//   feeding.js     eating and carrying
//   nest.js        the nest

import { WORLD, ENERGY, PHERO, LEARN } from './config.js';
import { createBrain } from './brain.js';
import { decayMemory } from './memory.js';
import { decaySynapses, perceiveSynapses } from './synapses.js';
import { createEffects, updateEffects } from './effects.js';
import { resolveEpisodes, resolveTrail } from './episodes.js';
import { autoSave as saveLearning, save, snapshot } from './learned/store.js';
import { nestOf, stockCount } from './world.js';
import { dropPheromone } from './pheromone.js';
import { increaseNeeds, resolveVitalFailure, drink, spendEnergy } from './needs.js';
import { perceive } from './perception.js';
import { decide } from './decision.js';
import { createAttention, notice } from './attention.js';
import { updateCortex, resetCortex } from './cortex.js';
import { moveToward, explore, trackScent } from './movement.js';
import { createExploreMap, markVisited } from './explore.js';
import { eatCarried, tryPickOrEat } from './feeding.js';
import { useNest } from './nest.js';
import { swim } from './swim.js';
import { senseWeather } from './weather.js';
import { refreshRules } from './learned/synth.js';
import { edibleCount } from './learned/rules.js';
import { observeHabits, deathLesson } from './habits.js';

export function createFagi() {
  return {
    x: WORLD.width / 2,
    y: WORLD.height / 2,
    angle: Math.random() * Math.PI * 2,

    // needs
    hunger: 0,
    thirst: 0,
    energy: ENERGY.max,
    alive: true,
    cause: '',         // what she died of

    // work
    carrying: null,    // the point she's carrying on her back, or null
    resting: false,
    drinking: false,
    swimming: false,   // trapped in deep water, flailing
    dunk: null,        // the stretch she's spent in deep water, until she knows what it cost her
    wet: 0,            // seconds left until she dries after leaving deep water
    probing: false,    // her antennae are over deep water: she moves forward probing
    pressure: 0,       // how much she feels the air pressure has dropped (0-1)
    pressureFalling: false,   // she feels it dropping right now: a front is coming
    rainEp: null,      // the stretch out in the open in the rain, until she judges it
    pheroTimer: 0,

    // head
    brain: createBrain(),
    explored: createExploreMap(),  // where she has been, in fat cells
    effects: createEffects(),
    episode: null,     // the open experience (she ate or is drinking) until she knows how it ended
    lastEpisode: null, // the last one, closed or open, for the narrator
    trailEp: null,     // since when she's been following her trail, until she knows if it led to food
    homeSearched: false, // looking for water, she already went by the nest: now she explores from there
    directive: null,   // what the decision API ordered, while it's still valid
    cortex: null,      // the channel to the decision API. null = there's none: instinct decides
    thought: null,     // reasoning from the last frame, read by the console and HUD
    attention: createAttention(),  // what she perceived just now: whatever she didn't is new
    rethink: null,     // the last time something new made her rethink the plan
    target: null,      // what she's heading for
    targetKind: null,  // 'food' | 'water' | 'nest' | 'scent' | 'phero'
    memory: 0,         // time left insisting on something she lost sight of
    trailKey: null,    // which smell she's tracking
    trailMemory: 0,    // how long she has left searching for a lost trail
    lastScent: null,   // last place where the smell reached her
    castSide: 1,       // which side she sweeps towards when she loses it
    castTimer: 0,

    // walking
    exploreTarget: null,  // the little-known cell she's going to take a look at
    exploreTimer: 0,      // how long she has left insisting on it
    exploreLegs: 0,       // exploration legs plotted: each one, a decision
    exploreResume: false, // back to exploring after something else: does she resume the leg or plot another?
    legChoice: null,      // the last time she chose between resuming and plotting a new one
    stride: 0,         // distance traveled: moves the legs when drawing

    // What she BELIEVES is stored in the nest. It isn't the nest: it's her memory
    // of the last time she was inside. A ration that spoils
    // while she's out, she doesn't find out about until she's back.
    pantry: {},
    pantryAt: null,    // age at which she last checked the pantry

    // counters for the HUD and the console
    age: 0,
    eaten: 0,
    drunk: 0,
    lastMeal: null,
    lastDrink: null,

    saveIn: LEARN.autosaveEvery,  // countdown to the next recoverable save
  };
}

// While carrying she marks the path with her pheromone.
function markTrail(fagi, world, dt) {
  if (!fagi.carrying) return;
  const nestObj = nestOf(world);
  if (!nestObj) return;
  fagi.pheroTimer -= dt;
  if (fagi.pheroTimer > 0) return;
  fagi.pheroTimer = PHERO.every;
  dropPheromone(world, fagi.x, fagi.y, Math.hypot(nestObj.x - fagi.x, nestObj.y - fagi.y));
}

// Carries out the intention that came out of decide().
function act(fagi, world, dt) {
  if (fagi.thought.action === 'eatCarried') eatCarried(fagi);
  else if (fagi.targetKind === 'scent' && fagi.trailKey) trackScent(fagi, world, fagi.trailKey, dt);
  else if (fagi.target) moveToward(fagi, world, fagi.target, dt);
  else explore(fagi, world, dt);
}

// Once per second forgetting becomes visible in the learned code: the
// rule weights are brought up to date and the panel hears about it (brain.version).
function tickLearnedCode(fagi, dt) {
  fagi.codeTick = (fagi.codeTick ?? 1) - dt;
  if (fagi.codeTick > 0) return;
  fagi.codeTick = 1;
  refreshRules(fagi.brain);
  fagi.brain.version = (fagi.brain.version ?? 0) + 1;
}

export function updateFagi(fagi, world, dt) {
  if (!fagi.alive) return;
  fagi.age += dt;

  updateEffects(fagi, dt);
  resolveEpisodes(fagi, dt);     // is it known yet how the last thing she ate agreed with her?
  decayMemory(fagi.brain, dt);   // confidence drops on its own and places blur
  tickLearnedCode(fagi, dt);     // and the learned code reflects it, once per second
  decaySynapses(fagi.brain.synapses, dt, fagi.age);   // and unused connections weaken
  markVisited(fagi.explored, fagi.x, fagi.y, dt);  // being in a place is knowing it
  swim(fagi, world, dt);         // has she gone into deep water? she feels it and learns
  senseWeather(fagi, world, dt); // the pressure she feels, and what the rain teaches her
  drink(fagi, world, dt);
  useNest(fagi, world);

  const ctx = perceive(fagi, world);
  fagi.perceived = ctx;              // for whoever watches her (batch runner, tests)
  perceiveSynapses(fagi, ctx, dt);  // perceiving something strengthens sense→concept (Hebb)
  ctx.newOnes = notice(fagi, ctx);   // what has just come in: forces a rethink of the plan
  updateCortex(fagi.cortex, fagi, world, ctx, dt);   // asks the API if it's time; never waits
  decide(fagi, world, ctx, dt);

  // She stays still drinking or resting; the rest of the time, on the move.
  const stop = !fagi.swimming
    && ((fagi.drinking && fagi.thirst > 0) || fagi.thought.action === 'rest');
  if (!stop) act(fagi, world, dt);

  spendEnergy(fagi, world, dt, !stop);
  markTrail(fagi, world, dt);
  tryPickOrEat(fagi, world);
  resolveTrail(fagi);            // did the trail she was following lead her to food?
  increaseNeeds(fagi, world, dt);
  // What happened to her body tunes her habits: a scare makes her more careful.
  const pantry = { stored: stockCount(fagi.pantry), edible: edibleCount(fagi, fagi.pantry) };
  observeHabits(fagi, pantry);

  // Dying saves right away, without waiting for the next autosave turn: the
  // last thing she learned (including the lesson of this very death) isn't lost.
  // And whatever the API had in flight stops counting: there's no one left to direct.
  if (resolveVitalFailure(fagi)) {
    deathLesson(fagi, fagi.cause, pantry);
    if (!fagi.sister) save(snapshot(fagi));
    resetCortex(fagi.cortex);
  }
  else if (!fagi.sister) saveLearning(fagi, dt);
}
