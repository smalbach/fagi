# Preregistration: inheritance of learning, second study

Written 2026-10-09, before the run, on top of the commit that adds this file, `docs/research/prereg-inheritance-2.json` (the hypotheses in machine form) and `scripts/lineage-analysis2.js` (the analysis). Nothing here may change after the run starts; any deviation is reported as such.

## Background

The first study (docs/research/prereg-lineage-inheritance.md, results in docs/research/prereg-lineage-results.md) found, with `dusk` moved to the end of the born program, inherit 0.602 vs learn 0.493 (H1, +10.9 points), learn > born (+2.2), survivor mothers > any mother (+2.4), and could not rule out a 5-point cost of learning with the intact program (H4, 96 single lives). Three open points:

1. Its unit was the life, but daughters of one population share mothers. Re-analysed with the population as the unit (exploratory, `scripts/lineage-by-population.js`), H1 holds (31 of 32 populations ahead), H2 holds, H3 only narrowly (p 0.043).
2. It used one damage only.
3. H4 was underpowered.

Exploratory pilot on today's code (2026-10-09, seeds 90000–90047, single lives, 48 per cell, same learning settings; scratch data, not kept): with the intact program born 0.65, learn 0.44 (2 better / 12 worse; deaths by hunger 5 → 14). Moving one line of the born program to its end: `shelter` 0.52 (learn 0.56, 4/2, writes `shelter-before-pursue`), `anticipate` 0.40, `sleep` 0.42, `rest` 0.48, `urgency` 0.29 (learning repairs none of those four); `thermal`, `huddle`, `pantry`, `shelterRetreat`, `eatCarried`, `thermalReflex` do not lower survival. The run of 2026-10-06 is reproduced byte for byte by today's code (checked on `inherit-7`).

## Questions

- Does the inheritance gain replicate on new seeds when the population is the unit (R)?
- Does it extend to a second, different damage (G)?
- With nothing to repair, do learning and inheriting cost survival (N)?

## Design

- Runner `scripts/lineage-selection.js`, unchanged. World as in the first study: organism, `TREE.interval` 575, lives of 7200 s, dt 0.05, map seed 4000 + seed; 16 lives × 6 generations per population.
- Learning settings in every learning arm: `PROGRAM.judge=1`, `PROGRAM.darkTrials=1`, `PROGRAM.exploreByState=1`.
- `--seed0 200000` in every condition: seeds 200000–247095, never used before. Lives and populations pair across arms (and across damages) by population, generation and slot.
- Damages and arms:
  - `dusk` (moved last, as before): `born`, `learn`, `inherit`, `inheritAny`; 48 populations (0–47).
  - `shelter` (moved last): the same four arms; 32 populations (0–31).
  - `intact` (no damage): `born`, `learn`, `inherit`; 32 populations (0–31).

```bash
run() { node scripts/lineage-selection.js --arm $2 --pop $3 --seed0 200000 $4 \
  --set PROGRAM.judge=1 --set PROGRAM.darkTrials=1 --set PROGRAM.exploreByState=1 \
  > research/prereg-inheritance-2/$1/$2-$3.json; }
for p in $(seq 0 47); do for a in born learn inherit inheritAny; do run dusk $a $p "--sabotage dusk"; done; done
for p in $(seq 0 31); do for a in born learn inherit inheritAny; do run shelter $a $p "--sabotage shelter"; done; done
for p in $(seq 0 31); do for a in born learn inherit; do run intact $a $p ""; done; done
node scripts/lineage-analysis2.js research/prereg-inheritance-2
```

(Run in parallel; every life is seeded, order does not matter.)

## Analysis (fixed in scripts/lineage-analysis2.js)

Unit: the population. For each population and arm, survival to 7200 s averaged over the lives of the stated generations; the difference between two arms is taken population by population.

- Superiority: one-sided sign-flip permutation test on the population differences (20 000 draws, seed 2026), α 0.05.
- Non-inferiority: one-sided 95 % t lower bound of the mean population difference > −0.05.

## Hypotheses

Primary family (Holm over the two, α 0.05):

- **R1:** `dusk`, `inherit` > `learn`, generations 3–5 (replication of H1).
- **G1:** `shelter`, `inherit` > `learn`, generations 3–5 (generalization).

Secondary (each at α 0.05, no correction):

- R2: `dusk`, `learn` > `born`, gens 3–5. R3: `dusk`, `inherit` > `inheritAny`, gens 3–5 (48 populations to give H3 more power).
- G2: `shelter`, `learn` > `born`, gens 3–5. G3: `shelter`, `inherit` > `inheritAny`, gens 3–5.
- N1: `intact`, `learn` not worse than `born` by 0.05, all generations (0–5).
- N2: `intact`, `inherit` not worse than `born` by 0.05, gens 3–5.

Expectations stated beforehand: R1 and R2 supported; R3 uncertain; G1 uncertain (the shelter repair is smaller and was never run in lineages); N1 likely not supported given the pilot.

## Power

R1: the first study had 31 of 32 populations ahead with a population-level t of 11; 48 populations give power near 1 for an effect half as large. R3: at the first study's effect (+0.024, population sd 0.074) 48 populations give about 0.70. G1 and N have no lineage pilot; their power is unknown and is said so.

## Reported regardless of outcome

The full output of `lineage-analysis2.js`: survival by generation for every damage and arm, lived, eaten, causes of death, lines inherited and own, share carrying the repair line, and every test. Negative results go to this folder's results file and to the research site.

## What would change the plan

- R1 not supported: the H1 effect does not survive new seeds at the population level; the site stops leading with it.
- G1 not supported: the inheritance gain is specific to `dusk`; claims are limited to that damage.
- N1 or N2 not supported: learning (or inheriting) costs survival when nothing is broken; the game should not keep these learning settings on by default without a fix to what is learned, and the site says so.
