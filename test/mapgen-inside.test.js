import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { MAPGEN, COLONIES, WORLD } from '../src/config.js';
import { createWorld, nestsOf } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { radiusOf } from '../src/obstacles.js';
import { rng, withRng } from '../scripts/batch/random.js';

const SEEDS = 40;
const mapOf = (s) => withRng(rng(s * 31 + 7), () => { const w = createWorld(); generateMap(w); return w; });

function withMap({ species, colonies, inside }, fn) {
  const was = { species: MAPGEN.species, inside: MAPGEN.inside, colonies: COLONIES.count };
  MAPGEN.species = species; MAPGEN.inside = inside; COLONIES.count = colonies;
  try { return fn(); } finally {
    MAPGEN.species = was.species; MAPGEN.inside = was.inside; COLONIES.count = was.colonies;
  }
}

// Digests of the maps as they were drawn before MAPGEN.inside existed: every
// preregistered study that drew species maps did so on these.
const BEFORE = { classic: 'e1883d03d2084832', species: '16e73369fc48515f', colonies: '1615a6ac72bbdc5d' };
const KINDS = { classic: [0, 1], species: [6, 1], colonies: [6, 3] };

test('MAPGEN.inside off: the maps are the old ones, number for number', () => {
  for (const [name, [species, colonies]] of Object.entries(KINDS)) {
    withMap({ species, colonies, inside: 0 }, () => {
      const h = createHash('sha256');
      for (let s = 0; s < SEEDS; s++) {
        h.update(mapOf(s).objects.map((o) => `${o.type}:${o.x.toFixed(3)}:${o.y.toFixed(3)}:${o.fruit ?? ''}`).join('|'));
      }
      assert.equal(h.digest('hex').slice(0, 16), BEFORE[name], name);
    });
  }
});

test('MAPGEN.inside on: every tree and pond wholly inside, every species and nest keeps its tree', () => {
  for (const [name, [species, colonies]] of Object.entries(KINDS)) {
    withMap({ species, colonies, inside: 1 }, () => {
      for (let s = 0; s < SEEDS; s++) {
        const w = mapOf(s);
        for (const o of w.objects) {
          const r = radiusOf(o);
          const ok = o.x - r >= 0 && o.x + r <= WORLD.width && o.y - r >= 0 && o.y + r <= WORLD.height;
          assert.ok(ok, `${name} map ${s}: ${o.type} at (${o.x.toFixed(0)}, ${o.y.toFixed(0)}) off the edge`);
        }
        const trees = w.objects.filter((o) => o.type === 'tree');
        const wild = new Set(trees.map((t) => t.fruit).filter((f) => w.species.some((sp) => sp.key === f)));
        assert.equal(wild.size, species, `${name} map ${s}: a species without its tree`);
        assert.equal(nestsOf(w).length, colonies);
        assert.ok(trees.length >= species + (colonies - 1) * MAPGEN.trees + (species ? 0 : MAPGEN.trees),
          `${name} map ${s}: a nest without its tree`);
      }
    });
  }
});
