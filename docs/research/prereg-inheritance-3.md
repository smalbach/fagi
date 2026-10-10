# Preregistration: learning that leaves alone what works (H5)

Written 2026-10-09, before the run, on top of the commit that adds this file, `docs/research/prereg-inheritance-3.json` (the hypotheses in machine form), `scripts/lineage-analysis3.js` (the analysis) and the new settings `PROGRAM.troubleTrials`, `troubleAt`, `troubleHalf` (src/program/watch.js; off by default, so every earlier run is unchanged). Nothing here may change after the run starts; any deviation is reported as such.

## Background

The second study (docs/research/prereg-inheritance-2-results.md) found that inheriting beats learning when part of the program is broken (+11 and +10 points), but with the intact program learning costs 5.3 points and inheriting 9.0 (N1, N2 not supported).

Exploratory pilots on 2026-10-09 (seeds 90000–93095, scratch data, not kept), all with the learning settings of the earlier studies:

- Where the cost comes from (intact, 96 single lives): born 0.729; learn 0.594; trials only, writing nothing (`maxOwn` 0), 0.563; learning on with no trials (`explore` 0) 0.729, identical life by life to born. The cost is the trials, not the lines.
- Trials only after trouble (`troubleTrials` 1: the chance of a trial times how recent her last moment with distress at `troubleAt` of the top was, halving every `troubleHalf` s). Over `troubleAt` 0.4–0.9 and `troubleHalf` 300/900, 96 single lives each, intact and with `dusk` moved last: the best was 0.8 / 300 s — intact 0.688 (vs 0.729 born), dusk 0.438 (vs 0.396 born, 0.385 learning as before), repair written as often as before.
- Lineages (4 populations × 16 × 6, gens 3–5): intact born 0.771, inherit 0.693, inherit with trouble trials 0.734; dusk born 0.448, learn with trouble trials 0.516, inherit 0.568, inherit with trouble trials 0.630. A second mechanism, probation (`PROGRAM.confirm`: a written line reaches the egg only once moments lived after it back it), lost the repair (dusk 0.505, 9 % of daughters inherited it) and is not part of this study.

## Question

With trials only after trouble, is inheriting what was learned no longer costly when nothing is broken, while it still beats learning from scratch when something is?

## Design

- Runner `scripts/lineage-selection.js`, unchanged. World and lineages as in the earlier studies: organism, `TREE.interval` 575, lives of 7200 s, dt 0.05, map seed 4000 + seed; 16 lives × 6 generations per population; 32 populations (0–31) per cell; `--seed0 300000` everywhere (seeds 300000–331095, never used before). Lives pair across cells by population, generation and slot.
- Learning settings in every learning arm: `PROGRAM.judge=1`, `PROGRAM.darkTrials=1`, `PROGRAM.exploreByState=1`. Cells marked `-T` add `PROGRAM.troubleTrials=1`, `PROGRAM.troubleAt=0.8`, `PROGRAM.troubleHalf=300`.
- Cells: `intact` born, learn, inherit; `intact-T` learn, inherit; `dusk` (moved last) learn, inherit; `dusk-T` learn, inherit; `shelter-T` (moved last) learn, inherit. `inherit` draws the mother among the previous generation's survivors.

```bash
L="--set PROGRAM.judge=1 --set PROGRAM.darkTrials=1 --set PROGRAM.exploreByState=1"
T="--set PROGRAM.troubleTrials=1 --set PROGRAM.troubleAt=0.8 --set PROGRAM.troubleHalf=300"
run() { node scripts/lineage-selection.js --arm $2 --pop $3 --seed0 300000 $4 > research/prereg-inheritance-3/$1/$2-$3.json; }
for p in $(seq 0 31); do
  for a in born learn inherit; do run intact $a $p "$L"; done
  for a in learn inherit; do
    run intact-T $a $p "$L $T"
    run dusk $a $p "--sabotage dusk $L"
    run dusk-T $a $p "--sabotage dusk $L $T"
    run shelter-T $a $p "--sabotage shelter $L $T"
  done
done
node scripts/lineage-analysis3.js research/prereg-inheritance-3
```

## Analysis (fixed in scripts/lineage-analysis3.js)

The population is the unit: its survival to 7200 s averaged over the lives of the stated generations, compared population by population. Superiority: one-sided sign-flip permutation (20 000 draws, seed 2027), α 0.05. Non-inferiority: one-sided 95 % t lower bound of the mean difference > −0.05 (the margin of H4, N1 and N2).

## Hypotheses

**H5 (primary)** holds only if both of its parts do (an intersection-union test, each at α 0.05, no correction):

- **H5a:** `intact-T` inherit is not worse than `intact` born by more than 0.05, gens 3–5. (Nothing broken: inheriting no longer costs beyond the margin.)
- **H5b:** `dusk-T` inherit > `dusk-T` learn, gens 3–5. (Something broken: inheriting still beats learning.)

Secondary (each at α 0.05):

- H5c: `intact-T` inherit > `intact` inherit (the filter lowers the cost of inheriting).
- H5d: `intact-T` learn not worse than `intact` born by 0.05, gens 0–5.
- H5e: `shelter-T` inherit > `shelter-T` learn (H5b with the second damage).
- H5f: `dusk-T` inherit not worse than `dusk` inherit by 0.05 (the filter does not lose the repair).
- R4: `intact` born > `intact` inherit (replication of N2's cost on new seeds).

Expectations stated beforehand: H5b, H5c, H5e, R4 supported; H5a uncertain (the pilot's −3.7 points over 4 populations sits close to the margin); H5d uncertain.

## Power

From the second study, the population-level sd of intact inherit − born was about 0.067; for a true cost of 0.035, 32 populations give a lower bound near −0.055: H5a has roughly even odds if the pilot's cost is right, high power if the cost is 0.02 or less. H5b: the pilot gap (+0.11) is the size of R1, which had t 11 with 48 populations.

## Reported regardless of outcome

The full output of `lineage-analysis3.js`, raw lives in research/prereg-inheritance-3/, and the result on the research site.

## What would change the plan

- H5 supported: trials after trouble can be turned on in the game with inheritance; the site reports that the cost of inheriting is fixed within the margin.
- H5a not supported but H5c supported: the filter halves the cost but does not remove it; the game should not inherit learned lines by default.
- H5b not supported: the filter costs the repair; it is not used.
