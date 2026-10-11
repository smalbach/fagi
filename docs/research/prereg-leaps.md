# Preregistration: rare big leaps in the body (study 5)

**Status: frozen 2026-10-10, before any run on the study's maps (60000–60095).** Committed together with `scripts/leap-analysis.js`, the leap mechanism (`MORPH.jump` in src/config.js, `jumpMorph` in src/morph.js, the line marks in src/generations.js), the leap tracking in `scripts/game-world.js` and the tree fixes the game world needs (below). Nothing below changes after this commit; deviations, if any, are reported as such in the results.

## Why

In nature most variation between parent and young is small, but now and then a mutation in a developmental gene makes a big jump in the body (Goldschmidt's "hopeful monsters", 1940; homeotic and size mutants). Most such jumps are a burden; a few, in the right world, spread. The question here is whether the Fagi world sorts leaps the way nature is said to: by what each leap costs and gives, not by chance.

## The mechanism (MORPH.jump)

With probability `chance` per birth, 1–3 of a newborn's organs (brain, gut, muscle, eyes, antennae, size) move ×1.5–2 (log-uniform) up or down from what she inherited, within `MORPH.range` [0.5, 2]. Each organ costs and gives as any other (`MORPH.tissue`, `MORPH.gain`): more muscle is faster but burns more at rest; more size keeps warmth but needs more fruit; antennae and eyes are cheap tissue. Whoever leaps starts a marked line her young carry on (from either parent), so how far each leap spreads can be followed.

**Control (`sham`):** the same births are marked as leaping, with the same random draws, but nothing in them changes. A sham line spreads only by chance (drift, a nest refounded by her kin), and the pilots show that is a lot: by the fourth year about half the living descend from a sham mark. Every claim below is against it.

## World

The game's world (src/app/organism-on.js: three colonies of up to 30, seasons, the evolving body, fruit that weighs, one fruit every 30 s), 4 years per map, dt 0.1, `scripts/game-world.js`. Trees come and go in it (`TREE.seed`), with the fixes of 2026-10-10: a tree's fruit stored at home seeds near the nest (`TREE.carried`), an old tree leaves its own seedling (`TREE.heirAt` 0.8), never more trees than the map began with (`TREE.room` 0). Without those, the wood drifted from the nests and 5 maps in 16 died out in four years; with them, 0 in 16, the colonies at 53 % of their ceiling, as with trees that never die.

## Arms and maps

Three arms, every map in each, paired by seed (`--seed 60000`, maps 60000–60095, never used):

- `sham`: `MORPH.jump.chance` 0.05, `sham` 1.
- `sym`: chance 0.05, leaps up or down (`up` 0.5).
- `up`: chance 0.05, leaps only up (`up` 1).

96 maps × 3 arms.

```bash
G="node scripts/game-world.js --interval 30 --seeds 96 --seed 60000 --years 4"
$G --set MORPH.jump.chance=0.05 --set MORPH.jump.sham=1 --json research/prereg-leaps/sham.json
$G --set MORPH.jump.chance=0.05 --json research/prereg-leaps/sym.json
$G --set MORPH.jump.chance=0.05 --set MORPH.jump.up=1 --json research/prereg-leaps/up.json
node scripts/leap-analysis.js research/prereg-leaps
```

## Analysis (fixed in scripts/leap-analysis.js)

A line *takes* if its first carrier leaves at least one young. "Costly" leaps include brain, muscle or size; "cheap" leaps are only antennae and/or eyes (classified by what leapt, or in `sham` by what would have). Shares of lines are pooled per arm and compared with a one-sided permutation that swaps the two arms within each map (20 000 draws, seed 2028); within one arm (L6), the labels are permuted within each map. Map-level measures use a one-sided sign-flip permutation on the paired differences; non-inferiority on the difference plus its margin. Holm over the primary family, α 0.05.

## Hypotheses

Primary (Holm over three):

- **L2 (costly leaps are a burden):** in `sym`, lines leaping in brain, muscle or size take less often than the same marks in `sham`.
- **L3 (leaps change the world):** in `up`, the living's mean organ gene at the end of year 4 is higher than in `sham`, map by map.
- **L6 (the world sorts leaps by cost):** in `sym`, lines leaping only in antennae or eyes take more often than lines leaping in brain, muscle or size.

Secondary (each at α 0.05):

- L1: in `sym`, lines take less often than in `sham` (leaps in general are a burden).
- L4: the same in `up`.
- L5: in `up`, costly lines take less often than the same marks in `sham`.
- L7: in `sym`, the population (years 2–4) is not lower than in `sham` by more than 3 Fagis per map.

Pilot (16 maps, seeds 9100–9115, the world above; scratch, not analysed again): L2 0.449 vs 0.539 (p 0.011); L3 +0.025, 13/3 maps (p 0.002); L6 0.778 (18 lines) vs 0.449 (p 0.011); L1 0.508 vs 0.543 (p 0.19); L4 0.404 vs 0.543 (p 0.014); L5 0.319 vs 0.539 (p 0.002); L7 −0.14 Fagis (p 0.052). No map died out in any arm.

## Power

With 96 maps there are about six times the pilot's lines (≈ 600 per arm, ≈ 110 cheap in `sym`): L2's pilot gap (0.09) has a standard error near 0.03 (power ≈ 0.9); L3's sd of the paired difference was 0.03, so a third of the pilot's effect is detected; L6 at half its pilot gap still has power ≈ 0.95. L1's pilot gap (0.035) is below what 96 maps can detect reliably (power ≈ 0.4), which is why it is secondary.

## What would change the plan

- L2 or L6 not supported: the cost of an organ does not decide which leaps take; the leaps' fate is drift.
- L3 not supported: one leap in twenty births does not move the population's body in four years.

## Limits

One world, one rate of leaps, organs only (the individual draw, VARY, has no costs and is left out), four years. Leaps are one event per birth with a fixed size; real big mutations have pleiotropic effects this model does not have.
