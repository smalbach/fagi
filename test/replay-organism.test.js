// The game as it is played (the whole organism, app/organism-on.js): a
// colony with eggs, seasons, trees that age, things on the map. What the
// replay rebuilds must look like what was seen live.
import test from 'node:test';
import assert from 'node:assert/strict';

import '../src/app/organism-on.js';
import { LIFE, SEASONS, TREE, OBJECT_TYPES } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { createColony } from '../src/colony.js';
import { generateMap } from '../src/mapgen.js';
import { step } from '../src/simulation.js';
import { createWorld } from '../src/world.js';
import { createRecorder } from '../src/recorder/recorder.js';
import { createPlayer } from '../src/recorder/replay.js';
import { invalidEvent } from '../src/recorder/events.js';
import { seasonNow } from '../src/seasons.js';
import { treeAge } from '../src/trees.js';

const isNest = (o) => OBJECT_TYPES[o.type]?.kind === 'nest';

// What can be seen at an instant: the map's things, each tree's age, each
// nest's pantry, lining and eggs, the season, and the sisters' poses.
function photo(world) {
  const objects = [...world.objects].sort((a, b) => a.id - b.id);
  return {
    looks: objects.filter((o) => o.look).map((o) => [o.id, JSON.stringify(o.look)]),
    trees: objects.filter((o) => o.type === 'tree').map((o) => [o.id, Math.round(treeAge(o) * 20)]),
    nests: objects.filter(isNest).map((n) => ({
      id: n.id,
      stock: Object.fromEntries(Object.entries(n.stock ?? {}).filter(([, v]) => v > 0)),
      lining: (n.lining ?? []).length,
      eggs: (n.eggs ?? []).map((e) => e.id),
    })),
    season: world.season?.on ? [world.season.name, world.season.year] : null,
    depth: Math.round((seasonNow().depth ?? 0) * 10),
    // What they do is sampled four times a second: whether it is known, not which.
    sisters: (world.colony?.ants ?? []).filter((s) => s.sister && s.alive).map((s) => [s.id, Boolean(s.thought?.action), s.lifeStage ?? 'adult']).sort((a, b) => a[0] - b[0]),
  };
}

test('a whole-organism session replays as it was seen', () => {
  // Faster than the game, so a short session holds every kind of change.
  Object.assign(SEASONS, { enabled: 1, year: 240 });
  Object.assign(TREE, { life: 200, seed: 1, mature: 40 });
  Object.assign(LIFE, { adultAt: 40, incubation: 30, mateStock: 0 });
  let seed = 7;
  const original = Math.random;
  Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  try {
    const world = createWorld();
    generateMap(world);
    const fagi = createFagi();
    world.colony = createColony(Math.max(LIFE.founders, 4), fagi);
    const events = [];
    const rec = createRecorder(world, { send: (batch) => events.push(...batch) });
    world.rec = rec;
    rec.start({ config: {} });
    const photos = [];
    const instants = [20, 70, 130, 200, 260];
    while (world.time < 270) {
      step(world, fagi, 0.05);
      rec.observe(fagi);
      if (instants.length && world.time >= instants[0]) {
        instants.shift();
        photos.push({ t: world.time, photo: photo(world) });
      }
    }
    rec.end('user', fagi);
    assert.deepEqual(events.map(invalidEvent).filter(Boolean), [], 'every event is valid for the server');
    for (const type of ['tree_time', 'season', 'sisters']) assert.ok(events.some((e) => e.type === type), `records ${type}`);

    const player = createPlayer(events, { checkpointEvery: 40 });
    for (const { t, photo: live } of photos) {
      player.seek(t);
      assert.deepEqual(photo(player.world), live, `t=${t.toFixed(2)}`);
    }
  } finally {
    Math.random = original;
  }
});
