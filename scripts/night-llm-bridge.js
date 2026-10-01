#!/usr/bin/env node
// Night LLM Bridge Server: Micro HTTP bridge connecting Fagi's Night Mind
// to local Small Language Models (e.g. Ollama llama3.2:1b, mistral, qwen2.5:1.5b).
//
// Receives: POST /night with { version, night, report, tasted, seen, traits, rules, program, allowed }
// Returns:  { proposals: [...] } strictly adhering to Fagi's declarative grammar.
//
// Usage:
//   node scripts/night-llm-bridge.js [--port 3000] [--ollama http://localhost:11434] [--model llama3.2:1b]
//   node scripts/night-llm-bridge.js --test

import http from 'node:http';

const args = process.argv.slice(2);
function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

export const PORT = Number(getArg('--port', process.env.PORT || '3000'));
export const OLLAMA_URL = getArg('--ollama', process.env.OLLAMA_URL || 'http://localhost:11434');
export const MODEL = getArg('--model', process.env.MODEL || 'llama3.2:1b');

export function buildSystemPrompt() {
  return `You are Fagi's Night Mind — an offline neurosymbolic hypothesis generator for an autonomous artificial life entity.
During the night, Fagi consolidates episodic memories into causal rules and programmatic behavioral adjustments.

You must output ONLY valid JSON in the exact format:
{
  "proposals": [
    ...
  ]
}

Proposal types allowed:
1. Trait Rule:
   {"type": "rule", "when": {"all": ["<trait>"]}, "verdict": "avoid"|"prefer", "why": "<short string>"}
2. Programmatic Reordering:
   {"type": "program", "tier": "endure"|"provide"|"clues"|"explore", "do": "<behavior>", "over": "<line_id>", "why": "<short string>"}
3. Exploration Target:
   {"type": "explore", "look": "<color-shape-smell>"}
4. Doubt Existing Rule:
   {"type": "doubt", "rule": "<rule_id>"}

Rules:
- NEVER invent traits not listed in the input 'traits'.
- NEVER invent behaviors not present in the input 'program'.
- Max 4 proposals total.
- Output pure JSON only, no markdown formatting or extra text.`;
}

export function buildUserPrompt(input) {
  const tastedSummary = (input.tasted || []).map((t) => `${t.look} (traits: ${t.traits.join(', ')}): felt ${t.felt} over ${t.bites} bites`).join('\n');
  const seenSummary = (input.seen || []).map((s) => `${s.look} (traits: ${s.traits.join(', ')})`).join('\n');
  const liveRules = (input.rules || []).map((r) => `${r.id}: if ${JSON.stringify(r.when)} then ${r.verdict}`).join('\n');
  const progLines = (input.program || []).slice(0, 10).map((l) => `${l.id} (${l.tier}) -> ${l.do}`).join('\n');

  return `Daytime Experience Report (Night #${input.night}):
Tasted foods:
${tastedSummary || 'None'}

Seen items:
${seenSummary || 'None'}

Active rules:
${liveRules || 'None'}

Current top program:
${progLines || 'Default innate hierarchy'}

Propose 1-3 hypotheses to improve survival based on this evidence.`;
}

// Fallback neurosymbolic proposer when Ollama is offline/unreachable
export function generateHeuristicProposals(input) {
  const proposals = [];
  const tasted = input.tasted || [];
  const rules = input.rules || [];
  const knownTraits = Object.keys(input.traits || {});

  // 1. Identify toxic traits
  const toxic = tasted.filter((t) => t.felt < -0.2);
  for (const t of toxic) {
    for (const tr of t.traits) {
      if (knownTraits.includes(tr) && !rules.some((r) => r.when?.all?.includes(tr) && r.verdict === 'avoid')) {
        proposals.push({
          type: 'rule',
          when: { all: [tr] },
          verdict: 'avoid',
          why: `heuristic: trait ${tr} correlated with toxic outcome (${t.felt})`,
        });
        break;
      }
    }
  }

  // 2. Propose tactical retreat if daytime crises or rain occurred
  const hasProgram = input.program && input.program.length > 0;
  if (hasProgram && !input.program.some((l) => l.do === 'shelterRetreat' && l.over === 'forage')) {
    proposals.push({
      type: 'program',
      tier: 'endure',
      do: 'shelterRetreat',
      over: 'forage',
      why: 'heuristic: tactical shelter retreat under environmental distress',
    });
  }

  // 3. Propose exploring unseen looks
  if (input.seen && input.seen.length > 0 && proposals.length < 3) {
    proposals.push({
      type: 'explore',
      look: input.seen[0].look,
    });
  }

  return proposals.slice(0, 4);
}

// Query local Ollama instance
export async function queryOllama(input, { url = OLLAMA_URL, model = MODEL } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const prompt = `${buildSystemPrompt()}\n\n${buildUserPrompt(input)}`;
    const res = await fetch(`${url.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        format: 'json',
        stream: false,
        options: { temperature: 0.2 },
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);
    const data = await res.json();
    const parsed = JSON.parse(data.response);
    if (Array.isArray(parsed?.proposals)) {
      return parsed.proposals;
    }
    throw new Error('Invalid JSON structure from Ollama');
  } catch (err) {
    return null; // Fall back to heuristic
  } finally {
    clearTimeout(timeout);
  }
}

// Request handler for the HTTP bridge
export function handleNightRequest(req, res, { ollamaUrl = OLLAMA_URL, model = MODEL } = {}) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return Promise.resolve();
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'fagi-night-llm-bridge', model }));
    return Promise.resolve();
  }

  if (req.method === 'POST' && (req.url === '/night' || req.url === '/')) {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', async () => {
        let input;
        try {
          input = JSON.parse(body);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid JSON' }));
          resolve();
          return;
        }

        // Try Ollama first, fallback to neurosymbolic heuristics
        let proposals = await queryOllama(input, { url: ollamaUrl, model });
        const source = proposals ? 'ollama' : 'heuristic-fallback';
        if (!proposals) {
          proposals = generateHeuristicProposals(input);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ proposals, _source: source }));
        resolve();
      });
    });
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
  return Promise.resolve();
}

// Start HTTP server
export function createBridgeServer({ port = PORT, ollamaUrl = OLLAMA_URL, model = MODEL } = {}) {
  const server = http.createServer((req, res) => handleNightRequest(req, res, { ollamaUrl, model }));
  return server;
}

// Standalone execution
if (process.argv[1]?.endsWith('night-llm-bridge.js')) {
  if (args.includes('--test')) {
    console.log('Testing Night LLM Bridge pipeline with mock input...');
    const mockInput = {
      version: 1,
      night: 1,
      tasted: [{ look: 'red-oval-sour', traits: ['color:red', 'shape:oval', 'smell:sour'], bites: 2, felt: -0.8 }],
      seen: [{ look: 'yellow-round-sweet', traits: ['color:yellow', 'shape:round', 'smell:sweet'] }],
      traits: { 'color:red': { weight: -0.5, met: 2 }, 'smell:sour': { weight: -0.8, met: 2 } },
      rules: [],
      program: [{ id: 'forage', tier: 'explore', do: 'forage' }],
    };

    const proposals = generateHeuristicProposals(mockInput);
    console.log('Heuristic proposals generated:', JSON.stringify(proposals, null, 2));
    if (proposals.length > 0 && proposals[0].verdict === 'avoid') {
      console.log('✔ Bridge self-test passed successfully!');
      process.exit(0);
    } else {
      console.error('✖ Self-test failed');
      process.exit(1);
    }
  }

  const server = createBridgeServer();
  server.listen(PORT, () => {
    console.log(`🌙 Fagi Night LLM Bridge active on http://localhost:${PORT}`);
    console.log(`   Connected to Ollama: ${OLLAMA_URL} (Model: ${MODEL})`);
    console.log(`   (Automatic neurosymbolic heuristic fallback enabled if Ollama is unreachable)`);
  });
}
