// One episode of step 1: one Fagi alone on her map, up to HORIZON seconds,
// and who decided what she did. Nothing here decides anything: it runs the
// game's own code and watches.
//
// Three random streams, each with its own seed (as scripts/batch): the map,
// the world (wind, fruit, seasons), and Fagi (her own draws, the choice's
// included). Same seeds, same episode.
//
// What "decides" means today. Every frame the fixed hierarchy (decision.js)
// walks its rules and the first to answer wins: that is the rule in control.
// The learned choice (choice.js) proposes nothing on its own; when she needs
// food and sees none it makes a plan — go back to site k, or explore — and
// offers that site to the hierarchy as a candidate. So a plan is the
// proposal, and the rule in control is what was executed. Per plan second
// (only the seconds she is after food, as choice.js counts them) the
// episode records whether the execution followed it:
//   site plan     her target is that site
//   explore plan  the rule in control is 'explore'
// and otherwise which rule held control instead, and for a site plan whether
// the site was among her candidates at all (`unoffered` when it was not).

import * as CONFIG from '../../src/config.js';
import { createWorld, nestOf, stockCount } from '../../src/world.js';
import { generateMap } from '../../src/mapgen.js';
import { createFagi, updateFagi } from '../../src/fagi.js';
import { stepWorld } from '../../src/simulation.js';
import { choiceSummary } from '../../src/choice.js';
import { sitesSummary } from '../../src/sites.js';
import { adaptiveSummary } from '../../src/adaptive-decision/index.js';
import { conductSummary } from '../../src/learned/conduct.js';
import { rng, withRng } from '../../scripts/batch/random.js';
import { HORIZON, DT } from './design.js';

const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
const add = (o, k, v) => { o[k] = (o[k] ?? 0) + v; };

export function set(assignments) {
  for (const [path, value] of Object.entries(assignments)) {
    const [block, key] = path.split('.');
    if (!(block in CONFIG) || !(key in CONFIG[block])) throw new Error(`unknown setting ${path}`);
    CONFIG[block][key] = value;
  }
}

// Every setting block as it stands now, for the manifest.
export function resolvedConfig() {
  const out = {};
  for (const [k, v] of Object.entries(CONFIG)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = JSON.parse(JSON.stringify(v));
  }
  return out;
}

// FNV-1a over a string: the episode's fingerprint.
function fnv(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function needsOf(f) {
  return { hunger: r2(f.hunger / CONFIG.HUNGER.max), thirst: r2(f.thirst / CONFIG.THIRST.max), energy: r2(f.energy) };
}

// `trace`: keep every segment (a stretch with the same rule, action and
// target) with what she felt at its start and what came of it.
// `makeWorld`: builds the map instead of generateMap (under the map's stream);
// `tick(world, fagi)`: after each step, for worlds that change on a schedule.
export function runEpisode({ seed, mapSeed, horizon = HORIZON, dt = DT, trace = false, makeWorld = null, tick = null }) {
  const world = withRng(rng(mapSeed), () => {
    if (makeWorld) return makeWorld();
    const w = createWorld();
    generateMap(w);
    return w;
  });
  const worldRng = rng(seed * 7919);
  const fagiRng = rng(seed);
  const fagi = withRng(fagiRng, () => createFagi());

  const byRule = {};          // tier.rule -> seconds in control
  const byAction = {};        // action -> seconds
  const plan = { site: { secs: 0, followed: 0, unoffered: 0, instead: {} }, explore: { secs: 0, followed: 0, unoffered: 0, instead: {} } };
  const segments = [];
  let decisions = 0;
  let hash = '';
  let seg = null;
  let watched = null;         // the plan being watched and its spent seconds

  const close = (t) => {
    if (!seg) return;
    seg.t1 = r2(t);
    seg.after = needsOf(fagi);
    seg.ate = (fagi.eaten ?? 0) - seg.eaten0;
    seg.stored = (fagi.stored ?? 0) - seg.stored0;
    delete seg.eaten0; delete seg.stored0;
    if (trace) segments.push(seg);
  };

  const steps = Math.ceil(horizon / dt);
  for (let i = 0; i < steps && fagi.alive; i++) {
    withRng(worldRng, () => stepWorld(world, dt));
    withRng(fagiRng, () => updateFagi(fagi, world, dt));
    if (tick) tick(world, fagi);
    const th = fagi.thought;
    if (!th) continue;
    const rule = `${th.tier}.${th.rule}`;
    add(byRule, rule, dt);
    add(byAction, th.action, dt);

    // A new segment when the rule, the action or the target changes.
    const key = `${rule}|${th.action}|${fagi.target?.id ?? fagi.targetKind ?? ''}`;
    if (!seg || seg.key !== key) {
      close(world.time);
      decisions += 1;
      const c = fagi.brain.choice?.plan;
      seg = { key, t0: r2(world.time), rule, action: th.action, targetKind: fagi.targetKind ?? null,
        plan: c ? { kind: c.kind, id: c.id ?? null } : null, before: needsOf(fagi),
        eaten0: fagi.eaten ?? 0, stored0: fagi.stored ?? 0 };
      hash = fnv(`${hash}${seg.t0}${key}`);
    }

    // The plan, proposed; the rule in control, executed.
    const p = fagi.brain.choice?.plan ?? null;
    if (p) {
      const spent = p.spent ?? 0;
      const busy = watched?.p === p ? spent - watched.spent : spent;
      watched = { p, spent };
      if (busy > 0) {
        const w = plan[p.kind];
        w.secs += busy;
        const site = p.kind === 'site' ? (fagi.brain.sites ?? []).find((s) => s.id === p.id) : null;
        const followed = p.kind === 'site' ? Boolean(site) && fagi.target === site : th.rule === 'explore';
        if (followed) w.followed += busy;
        else {
          add(w.instead, rule, busy);
          // A site plan the hierarchy never saw: the site is not among her candidates.
          if (site && !fagi.perceived?.ranked?.some((r) => r.ref === site)) w.unoffered += busy;
        }
      }
    } else watched = null;
  }
  close(world.time);

  const round = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, r2(v)]));
  const lived = Math.min(fagi.age, horizon);
  const out = {
    seed, mapSeed,
    alive: fagi.alive ? 1 : 0, lived: r2(lived), survival: r2(lived / horizon), cause: fagi.alive ? null : fagi.cause || null,
    eaten: fagi.eaten ?? 0, stored: fagi.stored ?? 0, pantryEnd: stockCount(nestOf(world)?.stock ?? fagi.pantry ?? {}),
    decisions, perMinute: r2(decisions / (lived / 60)),
    byRule: round(byRule), byAction: round(byAction),
    plan: {
      site: { secs: r2(plan.site.secs), followed: r2(plan.site.followed), unoffered: r2(plan.site.unoffered), instead: round(plan.site.instead) },
      explore: { secs: r2(plan.explore.secs), followed: r2(plan.explore.followed), instead: round(plan.explore.instead) },
    },
    choice: CONFIG.CHOICE.enabled ? choiceSummary(fagi) : null,
    sites: CONFIG.SITES.enabled ? sitesSummary(fagi) : null,
    fingerprint: fnv(`${hash}|${fagi.age}|${fagi.x}|${fagi.y}|${fagi.eaten}|${fagi.stored}|${fagi.cause}`),
  };
  if (fagi.adaptive) out.adaptive = adaptiveSummary(fagi);
  if (fagi.brain.conduct) out.conduct = conductSummary(fagi);
  if (trace) out.segments = segments;
  return out;
}
