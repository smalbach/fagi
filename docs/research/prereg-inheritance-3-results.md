# Results: learning that leaves alone what works (H5)

Preregistration: docs/research/prereg-inheritance-3.md (commit 21ad7ec). Run 2026-10-09 17:18–23:51 on that commit, unchanged: 352 runs, none failed. Raw data and the analysis output: research/prereg-inheritance-3/ (`analysis.txt`).

**Deviation in execution.** At 22:47 the process handing out the runs was killed by the session (signal), together with the 17 runs it had started; 6 had not started. Those 40 runs (all in populations 28–31) were relaunched unchanged from the same command list; every life is seeded, so a relaunched run is the run it replaces. A control run in the same batch (study 2, `dusk/inherit-3`, seed0 200000) came out byte-identical to the stored one, so the new settings change nothing while off.

## Survival in generations 3–5

| | born | learn | inherit |
|---|---|---|---|
| intact | 0.758 | 0.681 | 0.671 |
| intact, trials after trouble | – | 0.714 | 0.712 |
| `dusk` moved last | – | 0.490 | 0.576 |
| `dusk`, trials after trouble | – | 0.503 | 0.639 |
| `shelter` moved last, trials after trouble | – | 0.580 | 0.689 |

## Hypotheses (unit: the population, 32 per cell)

| | test | populations ahead / behind | diff | p or bound | verdict |
|---|---|---|---|---|---|
| **H5a (primary)** | intact: inherit with filter not worse than born by 0.05 | 4 / 24 | −0.046 | lower bound −0.065 | **not supported** |
| **H5b (primary)** | `dusk`, filter: inherit > learn | 28 / 1 | +0.137 | p < 0.0001 | **supported** |
| **H5** | both parts | | | | **not supported** |
| H5c | intact: inherit with filter > inherit without | 22 / 9 | +0.042 | p 0.0012 | supported |
| H5d | intact: learn with filter not worse than born by 0.05 (gens 0–5) | 3 / 28 | −0.048 | lower bound −0.059 | not supported |
| H5e | `shelter`, filter: inherit > learn | 30 / 0 | +0.109 | p < 0.0001 | supported |
| H5f | `dusk`: inherit with filter not worse than without by 0.05 | 24 / 5 | +0.064 | lower bound +0.035 | supported |
| R4 | intact: born > inherit (N2 on new seeds) | 28 / 3 | +0.087 | p < 0.0001 | supported |

## Reading

1. **The filter halves the cost but does not remove it.** Trying other lines only after a near-lethal moment takes the cost of inheriting with the intact program from 8.7 points to 4.6 (and of learning from 7.7 to 4.8). The estimate sits inside the 5-point margin, but the bound does not (−6.5): H5a, and so H5, is not supported.
2. **With something broken, the filter helps.** Inheriting still beats learning by 13.7 points with `dusk` and 10.9 with `shelter`, and inheriting with the filter beats inheriting without it by 6.4 points: fewer wasted trials, the same repair (99 % of daughters carry it).
3. **The cost of inheriting replicates** on new seeds (R4: 8.7 points, 28 of 32 populations).
4. What remains is the trials made after trouble: with the intact program a scarce world still brings near-lethal moments (hunger, cold), and each one opens trials that cost food. The remaining cost is not in the inherited lines (with the filter, 0.97 per daughter, against 1.11 without).

## Consequences (as preregistered)

H5a not supported, H5c supported: the filter halves the cost but does not remove it; the game should not inherit learned lines by default. The filter is still better than no filter in every cell measured, so if the game keeps learning on, it should be with the filter.

## Limits

As in the earlier studies: deliberate damages, one world (575 s), daughters alone, rewrites within the grammar. The filter's two numbers (0.8, 300 s) were chosen in a pilot on other seeds; other values were not tested here.
