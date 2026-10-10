# DRAFT preregistration: what inheritance carries, and how much of the loss it recovers (study 4)

**Status: draft, not frozen.** Three things must happen before this is committed as a preregistration and run: (1) the third study (docs/research/prereg-inheritance-3.md, running on branch `claude/research-main-page-update-6d4504`) reports, because it decides the learning settings below; (2) the gate threshold `Z*` is fixed by the pilot described here, on seeds the study never uses; (3) this file, `docs/research/prereg-inheritance-4.json`, `scripts/lineage-analysis4.js`, `scripts/gate-pilot.js` and the runner changes are committed together. The analysis script is written and checked: on study 2's data, with `learn` standing in for `inheritStrip`, it reproduces R1 and G1 exactly. Until then anything here may change.

## Why this study

The first two studies show that, with one line of the born program moved to its end, daughters that inherit their surviving mother's revisions outlive daughters that learn from scratch (+11 points with `dusk`, +10 with `shelter`). A reader can fairly answer "of course: they start with the answer". It is also the known result for Lamarckian inheritance in a fixed world (Ackley and Littman 1994; Whitley, Gordon and Mathias 1994; Sasaki and Tokoro 1997, 2000). Two questions are not answered by "inherit > learn":

1. **Efficiency and content.** How much of what the damage cost does inheritance win back, against a ceiling? Is the gain the repair line itself, or merely carrying inherited lines (and so trying less)?
2. **Selective inheritance.** With nothing broken, inheriting cost 9 points (study 2, N2), against 5.3 for learning alone. The third study attacks the trials (learning only after trouble). This one asks whether passing on only revisions backed by strong evidence keeps the repair and drops the extra cost of inherited lines.

## Background from the third study's pilots (not ours, cited as context)

The cost of learning with the intact program is the trials, not the lines: trials with nothing written (`maxOwn` 0) cost as much as learning, and learning with no trials is identical to born. Probation (`PROGRAM.confirm`) lost the repair. So a gate on lines can, at best, remove the part of the cost that inheriting adds over learning (study 2: inherit 0.654 vs learn 0.686 intact, gens 3–5), not the cost of learning itself. The hypotheses below are sized to that.

## Design

- Runner `scripts/lineage-selection.js` with three new arms (this branch; the four earlier arms are unchanged, checked output-identical against the previous version on short runs):
  - `oracle`: no learning; the damaged program with the designer's repair put in as a born line (`--oracle dusk-before-pursue` / `shelter-before-pursue`, the repair line inherited most often in study 2).
  - `inheritStrip`: as `inherit`, but every revision whose id starts with `<damaged line>-before-` is removed at each transmission (`filterProgramGenome`, src/program/genome.js).
  - `inheritGated`: as `inherit`, but only revisions whose evidence cleared `Z*` standard errors (improvement / its standard error, as stored in the genome) are passed on; retirements of kept lines pass too.
- World and lineages as in studies 1–3: organism, `TREE.interval` 575, lives of 7200 s, dt 0.05, map seed 4000 + seed; 16 lives × 6 generations per population; `--seed0 400000` everywhere (never used before; the pilot uses 500000). Lives pair across arms and damages by population, generation and slot.
- Learning settings in every learning arm: `PROGRAM.judge=1`, `PROGRAM.darkTrials=1`, `PROGRAM.exploreByState=1`. **Decision point:** if the third study supports H5, add its trouble-trials settings (`troubleTrials=1`, `troubleAt=0.8`, `troubleHalf=300`) to every learning arm, so that this study measures the gate on top of the fixed learner.
- Cells:
  - `dusk` (moved last), populations 0–47: `born`, `learn`, `inherit`, `inheritStrip`, `inheritGated`, `oracle`.
  - `intact`, populations 0–47: `born`, `learn`, `inherit`, `inheritGated`. Intact `born` is also the ceiling for both damages (same seeds).
  - `shelter` (moved last), populations 0–31: `born`, `inherit`, `inheritStrip`, `oracle`.
  - 608 runs.

```bash
L="--set PROGRAM.judge=1 --set PROGRAM.darkTrials=1 --set PROGRAM.exploreByState=1"   # + T if H5 holds
run() { node scripts/lineage-selection.js --arm $2 --pop $3 --seed0 400000 $4 > research/prereg-inheritance-4/$1/$2-$3.json; }
for p in $(seq 0 47); do
  for a in born learn inherit inheritStrip; do run dusk $a $p "--sabotage dusk $L"; done
  run dusk inheritGated $p "--sabotage dusk --gate $ZSTAR $L"
  run dusk oracle $p "--sabotage dusk --oracle dusk-before-pursue"
  for a in born learn inherit; do run intact $a $p "$L"; done
  run intact inheritGated $p "--gate $ZSTAR $L"
done
for p in $(seq 0 31); do
  for a in born inherit inheritStrip; do run shelter $a $p "--sabotage shelter $L"; done
  run shelter oracle $p "--sabotage shelter --oracle shelter-before-pursue"
done
node scripts/lineage-analysis4.js research/prereg-inheritance-4
```

## Pilot that fixes `Z*` (before freezing)

Seeds 500000, 8 populations each of `dusk` and `intact`, arm `inherit` with `--evidence` (each life's revisions with their z, effect and support), read by `scripts/gate-pilot.js`. `Z*` is the smallest z that passes on at most 20 % of the intact mothers' revisions while passing at least 80 % of the dusk mothers' `dusk-before-*` revisions. If no z does both, the gate arm is dropped from the study and the draft says so; points 1 and 3 still run. The pilot's data are scratch and are not analysed again.

## Analysis (fixed in scripts/lineage-analysis4.js)

The population is the unit: survival to 7200 s averaged over the lives of the stated generations, compared population by population. Every test is a one-sided sign-flip permutation on the paired population differences (20 000 draws, seed 2028), α 0.05: superiority on the difference, non-inferiority on the difference plus the margin. (Studies 2 and 3 used the t lower bound for non-inferiority; the script prints it too, but the permutation decides, so that one test gives every p and the intersection F1 can enter Holm with the largest of its parts' p.) If the pilot drops the gate arm, F1 and F2 are reported as dropped and Holm runs over C1 alone.

**Recovery** (estimate, no test): for arm A and damage D, `(A − born_D) / (born_intact − born_D)`, gens 3–5, with a 95 % bootstrap interval over populations (10 000 resamples, seed 2028). Reported for `learn`, `inherit`, `inheritStrip`, `inheritGated`, `oracle`.

Applied after the fact to study 2's data (exploratory, populations 0–31, gens 3–5), the same measure gives with `dusk` broken: learning recovers 0.11 [0.06, 0.15] of what the damage cost, inheriting 0.48 [0.40, 0.56]; with `shelter` broken, inheriting 0.60 [0.50, 0.72]. Inheritance wins back about half the loss; this study measures it on new seeds and against the oracle.

## Hypotheses

Primary (Holm over the two, α 0.05):

- **C1 (content):** `dusk`, `inherit` > `inheritStrip`, gens 3–5. The gain is the repair, not carrying lines.
- **F1 (selective inheritance)**, intersection-union, both at α 0.05:
  - F1a: `intact`, `inheritGated` > `inherit`, gens 3–5 (the gate cuts the extra cost of inherited lines).
  - F1b: `dusk`, `inheritGated` not worse than `inherit` by 0.03, gens 3–5 (the gate keeps the repair).

Secondary (each at α 0.05):

- C2: `shelter`, `inherit` > `inheritStrip` (C1 with the second damage).
- C3: `dusk`, `oracle` not worse than intact `born` by 0.05 (the grammar's repair reaches the ceiling; if not, recovery is measured against a ceiling no line can reach and is read with that in mind).
- F2: `intact`, `inheritGated` not worse than `learn` by 0.025 (the gate removes all of what inheriting adds to learning's cost).

Expectations stated beforehand: C1 and C2 supported (in study 2, 99.5 % of inheriting daughters carried the repair); C3 uncertain; F1a and F1b uncertain until the pilot shows whether evidence strength separates repairs from errors at all; F2 uncertain.

## Power

From study 2 the population-level sd of a difference between arms was about 0.06–0.07. C1: the gap between `inherit` and `learn` was +0.11 (t 11 with 48 populations); stripping the repair should give a gap of that order. F1a: the effect it can reach is the inherit − learn gap with the intact program, about 0.03; with 48 populations (se ≈ 0.009) power is about 0.9 if the gate removes all of it, about 0.5 if half. F1b: margin 0.03 with se ≈ 0.009 gives high power if the gate loses nothing.

## Reported regardless of outcome

The full output of `lineage-analysis4.js`, raw lives in research/prereg-inheritance-4/, the pilot's chosen `Z*` and its distributions, and the result on the research site (ES and EN).

## What would change the plan

- C1 not supported: the inheritance gain is not (only) the repair; the site stops describing it as "the daughters inherit the fix".
- C3 not supported: the site reports recovery against the oracle, not the intact ceiling.
- F1 supported: the gate, possibly with trouble trials, is the candidate default for inheritance in the game.
- F1a not supported: evidence strength does not tell repairs from errors; inheriting stays off in the game unless the third study's fix suffices.

## Limits

One world, deliberate damages, daughters alone, one grammar (one behavior in front of another under one condition). This study does not test a changing world (Sasaki and Tokoro); that is the next one if F1 holds.
