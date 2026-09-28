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

Running (75 lineages per format, seeds 5000–5074, 1800 s lives, inversion
at generation 4). Results will be added here, analysed with
`node research/embodied.js … --confirm` as preregistered.

**Deviation in how it is run, not in what.** The four preregistered
`scripts/batch.js --runs 75` processes were killed at lineage 2 when the
container restarted. They are run instead by `research/game-confirm.js`,
which runs each lineage as its own `--runs 1 --seed 5000+i` process with
the same options and skips lineages already done, so an interruption loses
at most the lineages in progress. A lineage depends only on its seed and the
options (checked: lineage 2 of a two-lineage process and the same seed run
alone come out byte-identical), so the lineages and the analysis are the
same ones.
