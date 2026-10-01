import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/world.js';
import { createFagi } from '../src/fagi.js';
import { noteCodeMutation } from '../src/phylogeny.js';
import { createPhylogenyModal } from '../src/phylogeny-modal.js';

test('createPhylogenyModal returns no-op safely when DOM elements are missing', () => {
  const world = createWorld();
  const modal = createPhylogenyModal(() => world);
  assert.equal(typeof modal.open, 'function');
  assert.equal(typeof modal.close, 'function');
  assert.equal(typeof modal.update, 'function');

  // Calling no-op methods should not throw
  modal.open();
  modal.update();
  modal.close();
});

test('createPhylogenyModal paints metrics and node list with mock DOM elements', () => {
  const overlay = { hidden: true, addEventListener() {} };
  const btnOpen = { addEventListener() {} };
  const btnClose = { addEventListener() {} };
  const btnMermaid = { addEventListener() {} };
  const btnJson = { addEventListener() {} };
  const metricsEl = { innerHTML: '' };
  const treeEl = { innerHTML: '' };

  const prevDoc = globalThis.document;
  const prevWindow = globalThis.window;

  globalThis.document = {
    getElementById(id) {
      if (id === 'phylogeny-overlay') return overlay;
      if (id === 'btn-phylogeny') return btnOpen;
      if (id === 'btn-phy-close') return btnClose;
      if (id === 'btn-phy-copy-mermaid') return btnMermaid;
      if (id === 'btn-phy-export-json') return btnJson;
      if (id === 'phylogeny-metrics') return metricsEl;
      if (id === 'phylogeny-tree') return treeEl;
      return null;
    },
  };
  globalThis.window = {
    addEventListener() {},
  };

  try {
    const world = createWorld();
    const fagi = createFagi();
    fagi.id = 1;
    fagi.generation = 0;

    noteCodeMutation(world, fagi, {
      kind: 'written',
      id: 'rest-before-pursue',
      source: 'self',
      why: 'energy conservation',
    });

    const modal = createPhylogenyModal(() => world);

    // Initial state: hidden
    assert.equal(overlay.hidden, true);

    // Open modal
    modal.open();
    assert.equal(overlay.hidden, false);
    assert.ok(metricsEl.innerHTML.includes('Total Innovations'));
    assert.ok(metricsEl.innerHTML.includes('1'));
    assert.ok(treeEl.innerHTML.includes('rest-before-pursue'));
    assert.ok(treeEl.innerHTML.includes('SELF'));

    // Close modal
    modal.close();
    assert.equal(overlay.hidden, true);

    // Update while hidden should not do anything (throttled/skipped)
    metricsEl.innerHTML = 'unchanged';
    modal.update();
    assert.equal(metricsEl.innerHTML, 'unchanged');
  } finally {
    globalThis.document = prevDoc;
    globalThis.window = prevWindow;
  }
});
