# World calibration: where behavior decides the outcome

2026-10-06. Script: `scripts/calibrate-world.js`. Profile: `scripts/profiles/scarce.json`.

## Why

In the default world (`TREE.interval` 8 s) every program survives two hours, including programs broken on purpose. No learning mechanism can show an effect there: survival and food eaten are capped by the world, not by what she does.

## Method

Organism on, varied maps (map seed 4000 + i), lives of 7200 s, `TREE.interval` swept. Variants of her born program, paired by seed:

- `born`: as born
- `noRest`: rest + sleep moved to the end
- `noFood`: carry + pursue moved to the end
- `noClues`: scent + memory + zigzag moved to the end
- `noWarmth`: thermal + shelter + dusk + huddle moved to the end
- `noPantry`: pantry + eatCarried moved to the end
- `learns`: born program with `PROGRAM.learn` and `PROGRAM.watch` on

Coarse sweep: 24 lives per cell. Fine cells: 48 lives each.

## Survival (share alive at 7200 s)

| interval (s) | born | noRest | noFood | noClues | noWarmth | noPantry | learns |
|---|---|---|---|---|---|---|---|
| 300 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| 450 | 0.96 | 0.92 | 0.71 | 0.88 | 0.92 | 1.00 | 1.00 |
| 525 | 0.92 | 0.67 | 0.79 | 0.96 | 0.67 | 0.92 | 1.00 |
| 550 (48) | 0.94 | 0.40 | 0.73 | 0.96 | 0.38 | 0.94 | 0.98 |
| **575 (48)** | **0.75** | **0.40** | **0.48** | 0.69 | **0.38** | 0.77 | **0.58** |
| 590 (48) | 0.44 | 0.35 | 0.29 | 0.44 | 0.33 | 0.44 | 0.38 |
| 600 | 0.33 | 0.25 | 0.21 | 0.29 | 0.29 | 0.33 | 0.29 |
| 675 | 0.04 | 0 | 0 | 0 | 0 | 0.04 | 0 |
| ≥ 750 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Paired against `born` at 575 (lives where the variant died and born lived / the reverse): noRest 17/0, noFood 16/3, noWarmth 18/0, noClues 5/2, noPantry 2/3, learns 9/1.

## Findings

1. Survival is a cliff in food supply: 100 % at 450 s, 0 % at 750 s. Deaths in the window are cold and hunger, both realistic.
2. **575 s is the discriminating world.** Born survives 75 %; breaking rest, warmth or food lines costs 27–37 points. Behavior decides the outcome here.
3. At 590–600 s (born ≈ 40–50 %) the food supply dominates and the variants separate less. Exactly 50 % is not the best test point.
4. **Program learning hurts at 575 s** (58 % vs 75 %, 9 vs 1 discordant lives, sign test p ≈ 0.02). At 550 s it is neutral to slightly positive (98 % vs 94 %, 3 vs 1). Consistent with earlier measurements that exploratory trials cost.
5. `noPantry` is identical to `born` at 550 s to the last digit: the pantry and eatCarried lines never act in these lives.
6. `noClues` barely matters: the lines back each other up.

## Use

```bash
node scripts/batch.js --organism --profile scripts/profiles/scarce.json --world-varies --runs 48 --duration 7200 --jobs 16
```

Any new mechanism should be tested here against `born`, paired by seed, with survival as the primary measure.

## Why program learning hurts here (2026-10-06, exploratory)

Interval 575 s, 48 lives per cell, paired by seed. Diagnosis seeds 1000–1047, replication seeds 2000–2047.

| variant | alive 1000s | alive 2000s | trials/life | lines/life |
|---|---|---|---|---|
| born | 0.75 | 0.71 | 0 | 0 |
| learns (as today) | 0.58 (9/1 worse/better) | 0.58 (8/2) | ~195 | 1.3–1.4 |
| trialsOnly (trials, `maxOwn` 0) | 0.58 (9/1) | – | 191 | 0 |
| trialsByState | 0.71 (5/3) | 0.63 (7/3) | ~62 | 0 |
| learnsByState (`PROGRAM.exploreByState`) | 0.79 (1/3) | 0.67 (6/4) | ~65 | 2.0 |
| learnsByState, horizon 60 s | – | 0.63 (8/4) | 64 | 0.5 |
| learnsByState, horizon 120 s | – | 0.56 (11/4) | 64 | 1.1 |
| crisis (`PROGRAM.crisis`, no trials) | 0.75 (0/0) | – | 0 | 0 |

1. The whole cost is the trials, not the lines: trials without writing cost exactly as much as full learning. The most common trial is `pursue>memory` (leaving a fruit in sight for a remembered place); she eats 9.4 instead of 12 and dies of cold or hunger late in life.
2. Trying less the worse she is (`PROGRAM.exploreByState`: chance × (1 − distress)²) cuts trials by two thirds. Pooled over 96 seeds, learning goes from −15 points to about even with born (0.73 vs 0.73). It stops the harm; it does not make learning help.
3. The lines she writes are mostly `memory-before-pursue` / `memory-before-scent`. They do not raise survival. A longer horizon does not fix it: at 120 s she writes `pursue-before-dusk` (keep foraging as night falls) and cold deaths rise. Distress over a short window cannot see a death that comes hours later.
4. Crisis learning wrote no line here: in every crisis what relieved her already stood before what she was doing.
5. Inheritance (`PROGRAM.inherit`, 16 lineages × 5 generations, exploreByState on): the journal grows from 1.9 to 5.6 revisions and inherited lines act about 1000 s per life, but survival over generations 1–4 is 0.70 vs 0.80 learning without inheritance and 0.77 born (12/6 vs learning, not significant). What accumulates are the same memory-first lines. In this test every mother passed her program on, dead or alive: there was no selection.

Next: the judge, not the explorer, is the bottleneck. Candidates: judge lines by intake per time or by reserves at dusk instead of distress over 15 s, or let selection judge (only mothers that live pass their lines on, as reproduction.js already does in the game).

## Selection as the judge (option B, 2026-10-06, exploratory)

Populations of 16, 6 generations, 4 populations per arm, interval 575 s, lives of 7200 s, `PROGRAM.exploreByState` on in every learning arm. Each daughter lives in her own world; the same world slots are used in every arm. Arms: `born` (no learning), `learn` (no inheritance), `inheritNoSel` (mother drawn from all, dead or alive), `inheritSel` (mother drawn only from survivors).

| gens 3–5 (192 lives) | alive | eaten |
|---|---|---|
| born | 0.82 | 10.7 |
| learn | 0.72 | 10.4 |
| inheritNoSel | 0.71 | 9.8 |
| inheritSel | 0.72 | 10.3 |

Paired: inheritSel vs inheritNoSel 24/23 (p 1.0); inheritSel vs learn 24/25; learn vs born 15 better / 33 worse (p 0.013); inheritSel vs born 13/32 (p 0.007).

1. Selection changed nothing. The lines that pass are the same in both arms: by generation 5 nearly every daughter carries `memory-before-scent` and `memory-before-pursue` (about 50 and 37 of 64). There is no heritable variation for selection to act on: every life rediscovers the same lines, and whether she lives depends mostly on her world.
2. Even with fewer trials, learning still costs about 10 points here (pooled over these 384 learning lives vs born). The earlier "about even" (96 seeds) did not hold at this sample size.
3. The bottleneck is what the learner writes, not who passes it on. Selection can only cull what varies; the judge (distress over 15 s) makes every lineage write the same memory-first lines.

## Changing the judge (option A, 2026-10-06, exploratory)

Two changes, both off by default:

- `PROGRAM.judge` 1 (reserves): a moment costs what it took from her reserves over the horizon — every need added up (not only the worst) plus food on her back or in the pantry she knows. Chasing a fruit costs energy at once, but the fruit counts as food to come.
- `PROGRAM.darkTrials` 1: in the dark, trials only toward endure lines. Before, no trial was allowed in the dark, and `dusk` (going home as the light goes) answers only once it is dark: she could never find out that it beats what she was doing.

Single lives, 48 per cell, interval 575 s. Design seeds 6000–6047, replication 7000–7047.

| | design | replication |
|---|---|---|
| born | 0.77 | 0.75 |
| learns as before | – | 0.65 (5/10) |
| reserves | 0.71 (4/7) | – |
| reserves + darkTrials | 0.79 (5/4) | 0.77 (6/5) |
| dusk moved last, no learning | 0.44 | 0.44 |
| … + reserves | 0.42 (1/2) | – |
| … + reserves + darkTrials | 0.54 (5/0) | 0.52 (4/0) |
| warmth lines moved last, no learning | 0.33 | 0.46 |
| … + reserves + darkTrials | 0.46 (6/0) | 0.42 (0/2) |

(better/worse vs the row without learning, paired by seed)

- Judged by reserves she stops writing memory-first lines (0.3 lines/life vs 1.8) and, with warmth broken, writes `shelter-before-pursue`; with dark trials she writes `dusk-before-pursue`, the real repair.
- With dusk broken, learning repairs part of it in one life: 0.44 → 0.53 pooled, 9 better / 0 worse (p 0.004). Intact, learning no longer costs (0.78 vs 0.76).
- All four warmth lines broken: not replicated.

Lineages (16 × 6 generations × 4 populations, dusk moved last and inherited through the genome base, reserves + darkTrials + exploreByState, survivor-only mothers):

| gen | born | learn | inherit + selection |
|---|---|---|---|
| 0 | 0.45 | 0.48 | 0.48 |
| 1 | 0.44 | 0.48 | 0.55 |
| 3 | 0.47 | 0.53 | 0.55 |
| 5 | 0.53 | 0.58 | 0.63 |

Gens 3–5: learn vs born 12/1 (p 0.003); inherit vs born 20/4 (p 0.002); inherit vs learn 18/13 (p 0.47). By generation 5, 63 of 64 daughters carry `dusk-before-pursue`. First result where what she learns, and what her mothers learned, raises survival. Inheritance adds to learning in trend, not yet significantly. Needs a preregistered run before any claim. Preregistered run: docs/research/prereg-lineage-results.md (H1 supported, inherit 0.60 vs learn 0.49).
