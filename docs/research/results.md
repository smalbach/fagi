# Results

The preregistered study ([`preregistration.md`](preregistration.md), frozen in
commit `9d222c3` before any of these runs). Confirmatory results first, exactly
as the frozen analysis prints them; then what is exploratory, labelled as such.

## Main study (lab)

`node research/run.js --design research/designs/main.json` (64 cells × 200
lineages, seeds 1001–1200, 12 800 lineages in 281 s), then
`node research/confirm.js research/results/main`. Full output in
[`research/results/main/confirmatory.md`](../../research/results/main/confirmatory.md).

### Confirmatory: all eleven hypotheses supported

One-trait chemistry, lives of 1800 s, inversion at generation 6, three fruit
met at once, budget 4; one-sided, Holm over eleven. 10 000 permutations put
the smallest attainable p at 0.0001, so every Holm-adjusted p is 0.0011.

| test | a − b | outcome | diff [95% CI] | dz |
|---|---|---|---|---|
| H1 reasons teach better in a steady world | verdict − rule | harmful bites / ant | 0.224 [0.204, 0.247] | 1.46 |
| H2a reasons have fewer survivors at an inversion | verdict − rule | survivors / ant | 0.274 [0.219, 0.329] | 0.68 |
| H2b … fewer than passing nothing on | none − rule | survivors / ant | 0.300 [0.245, 0.356] | 0.73 |
| H3 reasons carry more myths into it | rule − verdict | myths / ant | 0.863 [0.672, 1.048] | 0.63 |
| H4a evidence carries fewer myths than reasons | rule − evidence | myths / ant | 2.000 [1.809, 2.199] | 1.41 |
| H4b evidence has more survivors than reasons | evidence − rule | survivors / ant | 0.150 [0.086, 0.211] | 0.33 |
| H4c evidence teaches better than verdicts | verdict − evidence | harmful bites / ant | 0.253 [0.234, 0.273] | 1.79 |
| H5a the H2a gap is larger at an inversion than a rotation | (verdict − rule) invert − rotate | survivors / ant | 0.265 [0.209, 0.321] | 0.65 |
| H5b … than a shift to another dimension | (verdict − rule) invert − shift | survivors / ant | 0.277 [0.220, 0.333] | 0.68 |
| H6a the H2a gap is larger with 1800 s lives than 900 s | (verdict − rule) 1800 − 900 | survivors / ant | 0.206 [0.147, 0.263] | 0.49 |
| H6b the H3 difference holds with 900 s lives | rule − verdict | myths / ant | 0.771 [0.583, 0.965] | 0.56 |

In plain numbers (means per lineage, same cell):

| format | harmful bites / ant, steady | survivors at the inversion | myths at the inversion |
|---|---|---|---|
| none | 0.66 | 96% | 0.00 |
| verdict | 0.53 | 94% | 1.99 |
| rule | 0.31 | **66%** | 2.85 |
| evidence | **0.28** | 81% | 0.86 |

Reasons are the better teacher while the world holds (40% fewer harmful bites
than verdicts) and the worst inheritance when it inverts: a third of the
generation dies, against 4–6% for every other format, including passing nothing
on. Evidence keeps the teaching advantage, carries 70% fewer myths than reasons
alone and roughly halves the deaths, but does not remove them.

### Exploratory

Tables for every cell in
[`research/results/main/exploratory.md`](../../research/results/main/exploratory.md).
Not preregistered; read as description.

- **The trap needs an inversion.** When the poison rotates to another value or
  shifts to another dimension, reason-lineages carry more myths (1.3–2.5 times
  the verdict-lineages') but nobody dies of them: survivors are 98–100% in
  every format. Only an inversion makes the old reason point exactly at the
  new food, and so refusal becomes starvation.
- **Conjunctive chemistry** (poison = colour AND smell; a one-trait reason is
  too broad): the same pattern, smaller. Reasons still teach best (steady harm
  0.19 against 0.29 for verdicts at 1800 s), and still cost survivors at an
  inversion (80% against 92%; gap 0.13 [0.09, 0.17]), with evidence between
  (85%). In a steady conjunctive world, verdicts carry more false beliefs than
  reasons (0.31 against 0.12).
- **Recovery.** What newborns are taught takes longer to recover after any
  change when reasons are passed on (1.7–2.1 generations against 1.2–1.7
  for verdicts, one-trait chemistry). Evidence does not speed it up.
- **Lives of 900 s** shrink the deaths (rule 87% against verdict 94%) but not
  the myths (H6b): the belief is as wrong, there is just not enough time to
  starve of it.

### Limitation found while reading the results

The catalogue of each lineage is drawn so that every epoch's chemistry has at
least two poisons and two foods (`research/lab/lineage.js`, `makeWorld`). The
world before the change therefore depends on which change comes after it, and
the steady-phase numbers differ between `change` levels (e.g. harm 0.51 for
`none` under rotate against 0.66 under invert). Comparisons between formats
are unaffected: they are paired within the same world. H5a and H5b compare
gaps across different `change` levels, whose worlds differ; since the
verdict − rule survival gap is essentially zero under rotate, shift and no
change at all, the conclusion does not rest on that difference, but the
interaction is not a pure common-random-numbers contrast.

## Game confirmation

75 lineages per format, seeds 5000–5074, 1800 s lives, inversion at
generation 4 (300 lineages in about 40 min on 18 cores, at commit `6c71c7c`),
then `node research/embodied.js none=none.json verdict=verdict.json
rule=rule.json evidence=evidence.json --confirm` as preregistered. Full output
in [`research/results/game-confirm/confirmatory.md`](../../research/results/game-confirm/confirmatory.md).

### Confirmatory: all three hypotheses supported

Two-sided, Holm over three. 10 000 permutations put the smallest attainable
p at 0.0001, so every Holm-adjusted p is 0.0003.

| test | a − b | outcome | n | diff [95% CI] | dz | p (Holm) | lab diff |
|---|---|---|---|---|---|---|---|
| H1 reasons teach better in a steady world | verdict − rule | harmful bites / ant, gens 1–3 | 75 | 0.332 [0.243, 0.411] | 0.91 | 0.0003 | 0.224 |
| H2a reasons have fewer survivors at an inversion | verdict − rule | survivors / ant, gen 4 | 75 | 0.223 [0.133, 0.317] | 0.54 | 0.0003 | 0.274 |
| H3 reasons carry more myths into it | rule − verdict | myths / ant, end of gen 4 | 75 | 0.827 [0.630, 1.027] | 0.92 | 0.0003 | 0.863 |

All three differences go in the direction the lab found, and the survival and
myth gaps are of about the same size (0.22 against 0.27 survivors per ant;
0.83 against 0.86 myths per ant). The steady-state teaching advantage of
reasons is larger in the game (0.33 against 0.22 harmful bites per ant),
from a higher baseline: ants in the game bite more of everything.

In plain numbers (means per lineage):

| format | harmful bites / ant, steady | survivors at the inversion | myths at the inversion |
|---|---|---|---|
| none | 1.95 | 81% | 0.10 |
| verdict | 1.12 | **89%** | 0.59 |
| rule | **0.79** | **67%** | 1.41 |
| evidence | 0.82 | 81% | 0.93 |

The preregistered claim about the model as a whole needed the lab and the game
to agree in direction on H1, H2a and H3. They do: in both, passing on reasons
is the better teacher while the world holds and, when it inverts, leaves
22–27 percentage points fewer survivors than passing on verdicts, and the reason-lineages walk into
the inversion carrying more myths than the verdict-lineages.

### Sensitivity: species trees off the map

Found after the fact (2026-10-07), not preregistered. The species maps were
drawn with no bounds check (`placeFarFrom` in `src/mapgen.js`): in 101 of the
600 maps of this confirmation (16.8%) one wild species' tree lies wholly off
the map, its fruit clamped onto a line along the wall and partly beyond the
reach of the tree's `maxNear` cap. `MAPGEN.inside` (commit `ea9613c`) now
keeps every tree inside; it is off by default, so these maps, and this result,
reproduce number for number.

The 300 lineages were run again at `6c71c7c` and reproduce the table above to
the last digit. With the lineages that met such a map left out, all three
hypotheses still hold (Holm over three, as above):

| test | all | without: any gen feeding the outcome (0–3 / 0–4) | without: measured gens only (1–3 / 4) | only those with one |
|---|---|---|---|---|
| H1 | 0.332, n 75 | 0.304 [0.183, 0.427], n 40, p .0003 | 0.296 [0.190, 0.403], n 47 | 0.364 [0.257, 0.469], n 35 |
| H2a | 0.223, n 75 | 0.210 [0.089, 0.339], n 31, p .0075 | 0.219 [0.121, 0.316], n 64 | 0.233 [0.114, 0.358], n 44 |
| H3 | 0.827, n 75 | 0.992 [0.677, 1.331], n 31, p .0003 | 0.813 [0.594, 1.043], n 64 | 0.710 [0.466, 0.938], n 44 |

Every pair of formats lives in the same maps, so a missing tree weighs on both
sides of each contrast; the lineages that met one show the same differences as
those that did not. Absolute levels (bites, survivors) are not covered by
this check, nor are the other studies on species maps (organism, organism2,
concepts, social, diversity, forage, adaptive decision, caution), where 10–23%
of maps have a tree off the edge and the same paired design applies.

### Exploratory (game)

Not preregistered; every pair of formats and outcome in
[`research/results/game-confirm/summary.md`](../../research/results/game-confirm/summary.md),
Holm within each outcome. Read as description.

- **Passing nothing on is costlier in the game than in the lab.** Untaught
  ants bite about 2.5 times as much harm as rule-taught ones in a steady world,
  and only 81% of them survive the generation of the inversion (96% in the
  lab), against 89% for verdicts. Reasons still leave fewer survivors than
  passing nothing on (none − rule 0.14 [0.05, 0.23]), the direction of the
  lab's H2b, which was not tested in the game.
- **Evidence** sits where it did in the lab, with smaller gaps: as good a
  teacher as reasons in a steady world (rule − evidence −0.04 [−0.11, 0.03])
  and better than verdicts (0.29 [0.20, 0.39]); fewer myths than reasons
  (0.48 [0.20, 0.75], against 2.00 in the lab) and more survivors (0.14
  [0.05, 0.23]), but not more than verdicts (verdict − evidence 0.08
  [0.01, 0.16], Holm p 0.08).
- **After the inversion** (generations 5–7), reason-lineages bite the least
  harm again (0.74, against 1.20 for verdicts): the survivors relearn.

**Deviation in how it is run, not in what.** The four preregistered
`scripts/batch.js --runs 75` processes were killed at lineage 2 when the
container restarted. They are run instead by `research/game-confirm.js`,
which runs each lineage as its own `--runs 1 --seed 5000+i` process with
the same options and skips lineages already done, so an interruption loses
at most the lineages in progress. A lineage depends only on its seed and the
options (checked: lineage 2 of a two-lineage process and the same seed run
alone come out byte-identical), so the lineages and the analysis are the
same ones.
