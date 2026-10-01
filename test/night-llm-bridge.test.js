import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
  handleNightRequest,
  generateHeuristicProposals,
  buildSystemPrompt,
  buildUserPrompt,
} from '../scripts/night-llm-bridge.js';
import { createFagi } from '../src/fagi.js';
import { validateProposal } from '../src/night/index.js';

test('prompts and heuristic proposals conform strictly to Fagi grammar', () => {
  const mockInput = {
    version: 1,
    night: 2,
    tasted: [
      { look: 'red-oval-sour', traits: ['color:red', 'shape:oval', 'smell:sour'], bites: 3, felt: -0.9 },
    ],
    seen: [
      { look: 'yellow-round-sweet', traits: ['color:yellow', 'shape:round', 'smell:sweet'] },
    ],
    traits: { 'color:red': { weight: -0.8, met: 3 }, 'smell:sour': { weight: -0.6, met: 3 } },
    rules: [],
    program: [{ id: 'forage', tier: 'explore', do: 'forage' }],
  };

  const sysPrompt = buildSystemPrompt();
  assert.ok(sysPrompt.includes('Night Mind'));
  assert.ok(sysPrompt.includes('proposals'));

  const userPrompt = buildUserPrompt(mockInput);
  assert.ok(userPrompt.includes('Night #2'));
  assert.ok(userPrompt.includes('red-oval-sour'));

  const proposals = generateHeuristicProposals(mockInput);
  assert.ok(Array.isArray(proposals));
  assert.ok(proposals.length > 0);

  const fagi = createFagi();
  fagi.brain.cues['color:red'] = { w: -0.8, n: 3 };
  for (const p of proposals) {
    if (p.type === 'rule') {
      const v = validateProposal(p, fagi);
      assert.ok(!v.reject, `rule rejected: ${v.reject}`);
    }
  }
});

test('handleNightRequest processes mock HTTP stream and returns JSON proposals', async () => {
  const req = new EventEmitter();
  req.method = 'POST';
  req.url = '/night';

  let responseBody = '';
  let statusCode = 0;
  const headers = {};

  const res = {
    setHeader: (k, v) => { headers[k] = v; },
    writeHead: (code, hdrs) => { statusCode = code; Object.assign(headers, hdrs); },
    end: (chunk) => { if (chunk) responseBody += chunk; },
  };

  const handlePromise = handleNightRequest(req, res, { ollamaUrl: 'http://127.0.0.1:9999' });

  req.emit('data', JSON.stringify({
    version: 1,
    night: 1,
    tasted: [{ look: 'blue-cone-bitter', traits: ['color:blue', 'smell:bitter'], bites: 2, felt: -0.5 }],
    traits: { 'color:blue': { weight: -0.5, met: 2 } },
    rules: [],
    program: [{ id: 'forage', tier: 'explore', do: 'forage' }],
  }));
  req.emit('end');

  await handlePromise;

  assert.equal(statusCode, 200);
  assert.equal(headers['Content-Type'], 'application/json');
  assert.equal(headers['Access-Control-Allow-Origin'], '*');

  const answer = JSON.parse(responseBody);
  assert.ok(Array.isArray(answer.proposals));
  assert.ok(answer.proposals.length > 0);
  assert.equal(answer._source, 'heuristic-fallback');
});

test('handleNightRequest handles health check and 404', async () => {
  // Health
  const reqHealth = new EventEmitter();
  reqHealth.method = 'GET';
  reqHealth.url = '/health';
  let healthBody = '';
  let healthCode = 0;
  const resHealth = {
    setHeader: () => {},
    writeHead: (code) => { healthCode = code; },
    end: (chunk) => { healthBody += chunk; },
  };
  await handleNightRequest(reqHealth, resHealth);
  assert.equal(healthCode, 200);
  assert.equal(JSON.parse(healthBody).status, 'ok');

  // 404
  const req404 = new EventEmitter();
  req404.method = 'GET';
  req404.url = '/unknown';
  let notFoundCode = 0;
  const res404 = {
    setHeader: () => {},
    writeHead: (code) => { notFoundCode = code; },
    end: () => {},
  };
  await handleNightRequest(req404, res404);
  assert.equal(notFoundCode, 404);
});
