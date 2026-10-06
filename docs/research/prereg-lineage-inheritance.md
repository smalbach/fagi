# Preregistration: does inherited learning add to learning in life?

Written 2026-10-06, before the run, on top of commit 20b9727. Nothing in this document may change after the run starts; any deviation is reported as such.

## Background (exploratory, docs/research/world-calibration.md)

In a world with one fruit every 575 s, her born program survives about 75 % of two-hour lives, and moving `dusk` (going home as the light goes) to the end of her program drops that to about 44 %. With the reserves judge (`PROGRAM.judge` 1), safe night trials (`PROGRAM.darkTrials` 1) and state-dependent exploration (`PROGRAM.exploreByState` 1), she writes `dusk-before-pursue` and recovers part of the loss within one life (0.44 → 0.53, 9/0 paired). In a pilot of 4 populations × 16 × 6 generations with `dusk` sabotaged, generations 3–5 gave born 0.50, learn 0.56, inherit with selection 0.58: learn vs born 12/1, inherit vs learn 18/13 (p 0.24, underpowered).

## Question

Does a daughter that carries her surviving mother's evidence-backed program revisions survive more than one that learns the same way from scratch?

## Design

- Code: commit 20b9727 plus `scripts/lineage-analysis.js` and this file (the preregistration commit). No code change between this commit and the run.
- Runner: `scripts/lineage-selection.js`, analysis: `scripts/lineage-analysis.js`.
- World: organism, `TREE.interval` 575, lives of 7200 s, dt 0.05, map seed 4000 + seed.
- Sabotage: `dusk` moved to the end of the born program in generation 0 (and in every generation for `born` and `learn`); in inheriting arms the daughters receive it through the genome base.
- Learning settings in every learning arm: `PROGRAM.judge=1`, `PROGRAM.darkTrials=1`, `PROGRAM.exploreByState=1`; all other parameters at their defaults.
- Arms: `born`, `learn`, `inherit` (mother drawn from the previous generation's survivors), `inheritAny` (mother drawn from all).
- 32 populations (`--pop 0` … `31`) × 16 lives × 6 generations per arm, `--seed0 20000`. Seeds 20000–51095, never used before. Lives pair across arms by (population, generation, slot).

```bash
for arm in born learn inherit inheritAny; do for p in $(seq 0 31); do
  node scripts/lineage-selection.js --arm $arm --pop $p --seed0 20000 --sabotage dusk \
    --set PROGRAM.judge=1 --set PROGRAM.darkTrials=1 --set PROGRAM.exploreByState=1 \
    > research/prereg-lineage/$arm-$p.json
done; done
for s in 60000 60016 60032 60048 60064 60080; do
  node scripts/calibrate-world.js --interval 575 --runs 16 --seed $s --only born,reservesNight --json \
    > research/prereg-lineage/h4-$s.json
done
node scripts/lineage-analysis.js research/prereg-lineage
```

(Run in parallel; order does not matter, every life is seeded.)

## Hypotheses

All on survival to 7200 s in generations 3–5 (1536 paired lives per comparison), one-sided exact sign test on discordant pairs, α = 0.05.

- **H1 (primary):** `inherit` > `learn`.
- **H2:** `learn` > `born` (replication of the pilot).
- **H3:** `inherit` > `inheritAny` (selection adds to inheritance). Expected small; an earlier test with the old judge found none.
- **H4:** with the intact program, single lives (96, seeds 60000–60095), learning (`reservesNight` variant of `calibrate-world.js`) is not worse than born by more than 0.05: one-sided 95 % lower bound of the paired difference > −0.05.

Only H1 is primary; H2–H4 are reported without correction and called secondary.

## Power

Pilot: 16 % of inherit/learn pairs discordant, split 58/42. With 32 populations about 250 discordant pairs are expected; power for a 58/42 split at one-sided α 0.05 is about 0.8.

## Reported regardless of outcome

Survival by generation for every arm; lived, eaten and causes of death; share of lives carrying any `dusk-before-*` line; the output of `lineage-analysis.js` in full. Negative results go into docs/research/world-calibration.md and the research site.

## What would change the plan

- H1 not supported: inheritance does not add measurably to learning in life here; the next step is a world where the born order is not optimal without sabotage, not more inheritance machinery.
- H2 not supported: the pilot effect was noise; the exploratory claims in world-calibration.md are withdrawn.
- H4 not supported: the new learning settings cost survival when there is nothing to repair and stay off in the game.
