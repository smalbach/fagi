# Preregistration: inheritance in the world without walking in circles, what it carries, and what it costs (study 4)

**Status: frozen 2026-10-10, before any run on the study's seeds (400000).** Committed together with `docs/research/prereg-inheritance-4.json`, `scripts/lineage-analysis4.js`, `scripts/gate-pilot.js`, the runner changes (`scripts/lineage-selection.js`: arms `inheritStrip`, `inheritGated`, `oracle`, option `--profile`) and the two world profiles. Nothing below changes after this commit; deviations, if any, are reported as such in the results.

## Why this study

Studies 1–3 ran in a world where a moving Fagi spent about 18 % of her moving time walking in loops (a movement bug the game has since fixed). Their headline, that daughters which inherit their surviving mother's revisions outlive daughters that learn from scratch (+11 points with `dusk` moved last), has to hold without it before it is published. A reader can also fairly answer "of course: they start with the answer"; it is the known result for Lamarckian inheritance in a fixed world (Ackley and Littman 1994; Whitley, Gordon and Mathias 1994; Sasaki and Tokoro 1997, 2000). So this study asks, in the corrected world:

1. **Replication.** Does inheriting still beat learning?
2. **Content and efficiency.** Is the gain the repair line itself, or merely carrying inherited lines? How much of what the damage cost does it win back, against what the designer's own repair reaches?
3. **Cost.** With nothing broken, do learning and inheriting still cost survival, and does inheriting add to learning's cost?

## Worlds (docs/research/world-calibration-2.md)

The scarce world of studies 1–3 with the movement fixes on (`SOURCES.wait`, `DIZZY.enabled`, `PLUME.arrive`, `PHERO.ahead`; loops 1.5 % of moving time), nightly sleep off (with it the `dusk` line stops mattering). Without the loops the world is harsher at the same fruit rate, and its cliff is steep: no single rate shows both repair and cost (where learning repairs the damage born is at its ceiling; where born is off its ceiling the repair fades). So two worlds, one per family:

- **repair** (`scripts/profiles/repair.json`, one fruit every 550 s): damage, repair, content, the oracle.
- **intact** (`scripts/profiles/intact.json`, one fruit every 570 s): the cost with the program intact.

Organism, lives of 7200 s, dt 0.05, map seed 4000 + seed, 16 lives × 6 generations per population, `--seed0 400000` everywhere (never used by a lineage study; the pilots used 500000–700000). Lives pair across arms and cells by population, generation and slot. Learner in every learning arm, set by the profiles: `PROGRAM.judge=1`, `darkTrials=1`, `exploreByState=1`. The third study's trouble-only trials are not added: its H5 was not supported.

## Arms

`scripts/lineage-selection.js`; the four earlier arms are unchanged (checked output-identical on short runs, and `--profile` identical to the same settings given with `--set` on a full pilot population).

- `born`, `learn`, `inherit` as in studies 1–3.
- `inheritStrip`: as `inherit`, but every revision whose id starts with `dusk-before-` is removed at each transmission (`filterProgramGenome`, src/program/genome.js).
- `oracle`: no learning; the damaged program with the designer's repair, `dusk-before-pursue` (the repair line inherited most often in study 2), put in as a born line.

Cells, 48 populations each (0–47):

- `dusk` (repair world, `dusk` moved last): `born`, `learn`, `inherit`, `inheritStrip`, `oracle`.
- `ceiling` (repair world, intact): `born`. The ceiling for recovery and the oracle.
- `intact` (intact world): `born`, `learn`, `inherit`.

432 runs.

```bash
run() { node scripts/lineage-selection.js --arm $2 --pop $3 --seed0 400000 --profile scripts/profiles/$4.json $5 > research/prereg-inheritance-4/$1/$2-$3.json; }
for p in $(seq 0 47); do
  for a in born learn inherit inheritStrip; do run dusk $a $p repair "--sabotage dusk"; done
  run dusk oracle $p repair "--sabotage dusk --oracle dusk-before-pursue"
  run ceiling born $p repair ""
  for a in born learn inherit; do run intact $a $p intact ""; done
done
node scripts/lineage-analysis4.js research/prereg-inheritance-4
```

(Run in parallel; every life is seeded, order does not matter.)

## Dropped after the pilots (2026-10-10, seeds 500000, 8 populations per cell)

- **Evidence-gated inheritance (`inheritGated`; F1, F2 of the earlier draft).** The rule fixed beforehand was: `Z*` is the smallest z (improvement / its standard error) passing at most 20 % of intact mothers' revisions and at least 80 % of `dusk-before-*` repairs; if none, drop the arm. None does (`scripts/gate-pilot.js`): at z 3.5 it passes 68 % of intact revisions and 74 % of repairs, at z 5 23 % and 10 %; the distributions overlap almost entirely (medians 3.83 and 3.72). Evidence strength, as the learner measures it, does not tell repairs from errors. Moreover, in the corrected intact world inheriting no longer adds to learning's cost (pilot: inherit 0.693, learn 0.695), so the gate had nothing left to remove.
- **`shelter` moved last (C2).** In the repair world it costs nothing (born 0.91 against an intact 0.93–0.98; inherit 0.94, learn 0.93): the content test runs on `dusk` only.

## Analysis (fixed in scripts/lineage-analysis4.js)

The population is the unit: survival to 7200 s averaged over the lives of generations 3–5, compared population by population. Every test is a one-sided sign-flip permutation on the paired population differences (20 000 draws, seed 2028), α 0.05: superiority on the difference, non-inferiority on the difference plus the margin. The script also prints the t lower bound; the permutation decides.

**Recovery** (estimate, no test): for arm A, `(A − born_dusk) / (born_ceiling − born_dusk)`, generations 3–5, 95 % bootstrap interval over populations (10 000 resamples, seed 2028), for `learn`, `inherit`, `inheritStrip`, `oracle`.

## Hypotheses

Primary (Holm over the two, α 0.05):

- **R1 (replication):** `dusk`, `inherit` > `learn`. The headline of studies 1–2, in the world without loops.
- **C1 (content):** `dusk`, `inherit` > `inheritStrip`. The gain is the repair, not carrying lines.

Secondary (each at α 0.05):

- **C3:** `dusk` `oracle` not worse than `ceiling` `born` by 0.05. The grammar's repair reaches the ceiling; if not, recovery is read against a ceiling no line reaches.
- **N1:** `intact`, `born` > `learn`. Learning costs survival with the program intact (study 2's N1, here as a test of the cost).
- **N2:** `intact`, `born` > `inherit`. So does inheriting.
- **N3:** `intact`, `inherit` not worse than `learn` by 0.03. Inheriting adds no cost to learning's.

Expectations stated beforehand, from the pilots (8 populations, seeds 500000; scratch, not analysed again): R1 supported (pilot +0.190, 8/0); C1 supported (study 2: 99.5 % of inheriting daughters carried the repair); C3 likely (pilot oracle 0.94); N1, N2 supported (pilot −0.063, −0.065, 7/1 each); N3 uncertain (pilot −0.003 with a lower bound of −0.043 on 8 populations).

## Power

Population-level sd of the paired difference in the pilots: 0.078 (R1), 0.056–0.060 (N1–N3). With 48 populations the standard error is about 0.011 (R1) and 0.008–0.009 (N). R1 at the pilot's effect has power ≈ 1; at a quarter of it (0.05), still ≈ 0.99. N1, N2 at half the pilot's effect (0.03): power ≈ 0.95. N3 with margin 0.03 and a true difference of 0: power ≈ 0.98.

## Reported regardless of outcome

The full output of `lineage-analysis4.js`, the raw lives in research/prereg-inheritance-4/, the pilots and the calibration (docs/research/world-calibration-2.md), and the result on the research site (ES and EN), including how the corrected world changes studies 1–3's numbers.

## What would change the plan

- R1 not supported: the site's headline goes; studies 1–3's result is reported as dependent on the movement bug.
- C1 not supported: the inheritance gain is not (only) the repair; the site stops describing it as "the daughters inherit the fix".
- C3 not supported: recovery is reported against the oracle, not the intact ceiling.
- N1/N2 supported: inheritable learning stays off by default in the game until a learner that does not cost with the program intact exists.

## Limits

Two worlds that differ in one number, deliberate damage (one line moved last), daughters alone, one grammar (one behavior in front of another under one condition), one fixed world per run. The gain measured is a repair of a known damage, not discovery of a better behavior. No changing world (Sasaki and Tokoro); that is the next study.
