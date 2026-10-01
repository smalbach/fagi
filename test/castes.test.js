import test from 'node:test';
import assert from 'node:assert/strict';
import { CASTES } from '../src/config.js';
import { createWorld } from '../src/world.js';
import { createFagi } from '../src/fagi.js';
import { createColony } from '../src/colony.js';
import {
  createCasteProfile,
  casteOf,
  taskCategoryOf,
  updateCaste,
  summarizeColonyCastes,
} from '../src/castes.js';

test('createCasteProfile initializes normalized affinities', () => {
  const fagi = createFagi();
  const profile = createCasteProfile(fagi);
  const sum = Object.values(profile.affinities).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 0.1, 'affinities approximately sum to 1.0');
  assert.ok(['forager', 'scout', 'nurse', 'patrol'].includes(profile.dominant));
});

test('taskCategoryOf categorizes behaviors accurately', () => {
  const world = createWorld();
  const fagi = createFagi();

  assert.equal(taskCategoryOf('carry', fagi, world), 'forager');
  assert.equal(taskCategoryOf('pursue', fagi, world), 'forager');
  assert.equal(taskCategoryOf('pantry', fagi, world), 'forager');

  assert.equal(taskCategoryOf('explore', fagi, world), 'scout');
  assert.equal(taskCategoryOf('zigzag', fagi, world), 'scout');
  assert.equal(taskCategoryOf('scent', fagi, world), 'patrol');

  assert.equal(taskCategoryOf('sleep', fagi, world), 'nurse');
  assert.equal(taskCategoryOf('huddle', fagi, world), 'nurse');

  assert.equal(taskCategoryOf('patrol', fagi, world), 'patrol');
  assert.equal(taskCategoryOf('shelterRetreat', fagi, world), 'patrol');
});

test('when CASTES.enabled is off, updateCaste does not change profile', () => {
  const world = createWorld();
  const fagi = createFagi();
  const initial = { ...casteOf(fagi).affinities };

  fagi.thought = { action: 'carry' };
  updateCaste(fagi, world, 1.0);

  assert.deepEqual(casteOf(fagi).affinities, initial);
});

test('when CASTES.enabled is on, repeated tasks induce emergent specialization', () => {
  const wasEnabled = CASTES.enabled;
  CASTES.enabled = 1;
  try {
    const world = createWorld();
    const fagi = createFagi();

    // Perform foraging actions repeatedly
    fagi.thought = { action: 'carry' };
    for (let i = 0; i < 20; i++) {
      updateCaste(fagi, world, 0.5);
    }

    const c = casteOf(fagi);
    assert.equal(c.id, 'forager', 'specialized as forager');
    assert.ok(c.affinity > 0.4, 'foraging affinity reinforced');
    assert.equal(c.icon, '🌾');

    // Switch to scouting actions repeatedly
    fagi.thought = { action: 'explore' };
    for (let i = 0; i < 40; i++) {
      updateCaste(fagi, world, 0.5);
    }

    const scoutCaste = casteOf(fagi);
    assert.equal(scoutCaste.id, 'scout', 'switched specialization to scout');
    assert.ok(scoutCaste.affinity > 0.4, 'scouting affinity reinforced');
    assert.equal(scoutCaste.icon, '🔭');
  } finally {
    CASTES.enabled = wasEnabled;
  }
});

test('summarizeColonyCastes tallies caste distributions across colony', () => {
  const wasEnabled = CASTES.enabled;
  CASTES.enabled = 1;
  try {
    const colony = createColony(4);
    const summary = summarizeColonyCastes(colony);
    assert.equal(summary.total, 4);
    const sum = summary.forager + summary.scout + summary.nurse + summary.patrol;
    assert.equal(sum, 4, 'every living ant has a designated caste');
  } finally {
    CASTES.enabled = wasEnabled;
  }
});
