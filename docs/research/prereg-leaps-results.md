# Results: rare big leaps in the body (study 5)

Preregistration: docs/research/prereg-leaps.md (commit bb8ca2f, pushed to main before any run). Run 2026-10-10/11 from a clean checkout of bb8ca2f: 3 arms × 96 maps × 4 years, maps 60000–60095. Raw data: research/prereg-leaps/{sham,sym,up}.json; analysis output: research/prereg-leaps/analysis.txt (`scripts/leap-analysis.js`, unchanged).

**Deviation (execution only):** the machine slept for most of the first night (the runs used 30 CPU-minutes in their first 10.5 hours); they resumed on waking and finished without restarting. Every map is seeded, so the pause changes nothing in the results.

No map died out in any arm.

## Overview

| arm | lines | take | peak ≥ 5 alive | living from a line at the end | population (years 2–4) | mean organ genes at the end (size/muscle/brain/gut/eyes/antennae) |
|---|---|---|---|---|---|---|
| sham | 712 | 0.618 | 239 | 58.3 % | 54.9 | 1.003/1.029/0.979/1.000/1.002/1.001 |
| sym | 734 | 0.466 | 175 | 46.1 % | 54.1 | 0.985/1.044/0.962/1.014/1.010/1.015 |
| up | 720 | 0.410 | 166 | 43.9 % | 54.1 | 1.010/1.080/1.002/1.030/1.035/1.034 |

A line *takes* if its first carrier leaves at least one young.

## Hypotheses

| | hypothesis | result | p | verdict |
|---|---|---|---|---|
| **L2** (primary) | sym: costly leaps (brain, muscle, size) take less often than the same marks in sham | 0.400 (527 lines) vs 0.605 (529) | < 0.0001 | **supported** |
| **L3** (primary) | up: the living's mean organ gene at the end is higher than in sham | +0.032, 88 of 96 maps | < 0.0001 | **supported** |
| **L6** (primary) | sym: cheap leaps (antennae, eyes only) take more often than costly ones | 0.695 (118) vs 0.400 (527) | < 0.0001 | **supported** |
| L1 | sym: leaps take less often than sham marks | 0.466 vs 0.618 | < 0.0001 | supported |
| L4 | up: leaps take less often than sham marks | 0.410 vs 0.618 | < 0.0001 | supported |
| L5 | up: costly leaps take less often than sham marks | 0.356 vs 0.605 | < 0.0001 | supported |
| L7 | sym: population not lower than sham by more than 3 per map | −0.82 Fagis, 44/52 maps | 0.0008 | supported |

Holm over L2, L3, L6; the rest each at α 0.05.

## What it means

- **Most leaps are a burden**, as in nature: a sham mark's first carrier leaves young 62 % of the time, a real leap's 47 % (41 % when leaps only grow organs).
- **The world sorts leaps by what they cost.** Leaps in brain, muscle or size take 40 % of the time against 60 % for the same births unchanged; leaps only in antennae or eyes (cheap tissue) take 70 %.
- **Leaps change the world's bodies.** With leaps only upward, the population's organs end bigger in 88 of 96 maps (muscle 1.08 against 1.03, antennae and eyes 1.03–1.04 against 1.00), without costing population.
- **Drift is large.** By the fourth year 58 % of the living descend from a sham mark: a lineage spreading says little by itself; only the comparison with the sham does.

## Exploratory (not preregistered): single-organ leaps in `sym`

Share that take, by organ and direction (lines with one organ leapt; n in brackets). Small cells, read as hints:

| | up | down |
|---|---|---|
| size | **0.00 (12)** | 0.50 (26) |
| muscle | **0.79 (19)** | 0.28 (18) |
| brain | 0.33 (18) | 0.59 (17) |
| gut | 0.57 (21) | 0.55 (22) |
| eyes | 0.72 (25) | 0.67 (27) |
| antennae | 0.79 (29) | 0.60 (15) |

Sham single-organ marks take 0.47–0.79 (mean 0.62) with no pattern. A body twice as large never left young (it burns too much); twice the muscle mostly did (faster, and strength to carry); a bigger brain mostly did not (costly tissue, shorter life). The biggest lines (27–28 alive at once, a whole nest) started from leaps in muscle and gut together, or in muscle alone.

## Limits

One world, one rate of leaps (5 % of births), organs only, four years. Leaps here are clean jumps in one to three organs; real large mutations have side effects this model does not have. "Takes" measures only the first carrier's first young; how far each line goes is described, not tested.
