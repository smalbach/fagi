# Protocol: things and concepts (phase 6)

Status: **frozen.** Frozen by the git commit that adds this file, pushed to
GitHub before any confirmatory run. The design, the seeds, the outcomes, the
hypotheses and the analysis are the code committed with it
(`research/concepts/`, and `runThingLife` in `scripts/concept-lab.js`):
changing any of it after the run means a new protocol, and this one is
reported anyway.

This is the exit test of phase 6 of `docs/ESPECIFICACION_ENTE_ADAPTATIVO.md`
(§15): *Fagi classifies and uses correctly a family of objects not seen during
tuning, without receiving the real semantic identifier.* The design is §12.8.
The exploratory measurements behind the predictions used lives 1000–1047 and
5000–5095; none of the seeds below was used before.

## What is compared

Every life is the whole organism (`--organism`) with things on the map, 6 wild
fruit species, 2400 s, one map per life (`research/concepts/design.js`).

| condition | what changes |
|---|---|
| `full` | nothing |
| `noConcepts` | `CONCEPT.generalize = 0`: every kind learned on its own, nothing predicted |
| `noVolatility` | `CONCEPT.surprise = 0`: a surprise never makes her doubt or look again |

Two **families** of things:
- `tuned`: shape or texture decides what things afford, the ones used while it
  was built;
- `novel`: **color** decides, never used while it was built. This is the family
  the exit criterion is about.

Two **worlds**:
- `stable`;
- `turn`: when the late kinds sprout (1200 s), another trait decides from then
  on, for the old things too.

At 1200 s, 8 kinds never on the map before sprout, 12 things of them, over the
same deciding values.

## Seeds

**120 lives per condition, family and world.** Life *i* uses Fagi's stream
`16000 + i` and map `700000 + 29i`, for i = 0…119, the same in every condition.
The harness was checked with `--offset 50000`, away from these.

## Outcomes (per life, `scripts/concept-lab.js`)

`classify`
: Looks she never touched whose deciding trait takes a value the map has. The share she believes rightly at the end; no belief counts as wrong.

`precision`
: Of the looks in `classify` she has a belief about, the share she gets right.

`coverage`
: Of the looks in `classify`, the share she has a belief about.

`lateSeen`
: How many late kinds she saw.

`lateRight`
: The share of late kinds she believed rightly the moment she first saw them; no belief counts as wrong. Null if she saw none.

`lateBelieved`
: The share of late kinds she had a belief about when she first saw them.

`lateStings`
: Stings from late kinds.

`lateSapUsed`
: Late sap kinds she first met by sipping, that is, using them before examining them.

`hits`, `misses`
: Predictions for new kinds, scored when she lived them.

`concepts`, `retired`, `revised`
: Concepts alive at the end, retired for failing, and retired because they were remade.

`surprises`
: How many surprises she had.

`kindsKnown`
: How many kinds she knows.

`stings`, `sips`, `novelSips`
: All stings; all sips; sips from a kind she had never touched.

`lifetime`, `alive`, `cause`
: As in the organism evaluation.

## Confirmatory hypotheses

All four are one-sided and predict `a − b > 0`. They are paired by life, or compared with chance, 0.25: four affordances, equally frequent among a map's kinds.

| test | prediction | family, world | outcome | a − b |
|---|---|---|---|---|
| K1 | she names rightly, at first sight, what kinds of a family never seen while tuning afford, better than chance | novel, stable | lateRight | full − 0.25 |
| K2 | concepts spare her the sting of new kinds | novel, stable | lateStings | noConcepts − full |
| K3 | concepts let her drink from new sap kinds before examining them | novel, stable | lateSapUsed | full − noConcepts |
| K4 | after the world turns over, doubting after a surprise leaves her classifying better | novel, turn | classify | full − noVolatility |

K1 is classification, and K2 and K3 are use, which together make the exit
criterion. K4 is about retiring concepts that stop predicting.

Survival bias:
- **`lateRight`** exists only for lives that reach 1200 s and see a late kind.
- **`lateStings`** is lower for whoever dies sooner. If `noConcepts` died
  sooner, the bias would work against K2.

## Analysis

The analysis is exactly `node research/concepts/analyze.js research/results/concepts`, as
committed with this file, after `node research/concepts/run.js --jobs 16`.

- **Each test:** a one-sided sign-flip permutation test on the per-life
  differences (10 000 permutations), with the mean difference, its 95%
  bootstrap interval and dz (`research/stats.js`).
- **Correction:** Holm over the four tests, α = .05. A hypothesis is supported
  when its Holm-adjusted p < .05.
- **Missing values:** no life is excluded. A life without the outcome (for
  example `lateRight` when she saw no late kind) drops out of that test only.
- **Exploratory:** everything else in the report (the tuned family, every
  condition, every outcome) is descriptive, with no correction.

The **exit criterion of phase 6 is met** if K1, K2 and K3 are supported.

## What will be reported

The full report `research/results/concepts/report.md` and the raw pieces,
including every hypothesis that is not supported.
