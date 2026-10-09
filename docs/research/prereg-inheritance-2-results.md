# Results: inheritance of learning, second study

Preregistration: docs/research/prereg-inheritance-2.md (commit e6563e3). Run 2026-10-09 09:09–14:25 on that commit, unchanged, exactly as written: 416 runs, none failed. Raw data and the analysis output: research/prereg-inheritance-2/ (`analysis.txt`). No deviations.

## Survival in generations 3–5

| damage | born | learn | inherit (survivor mothers) | inheritAny (any mother) | populations |
|---|---|---|---|---|---|
| `dusk` moved last | 0.467 | 0.495 | 0.605 | 0.576 | 48 |
| `shelter` moved last | 0.550 | 0.564 | 0.667 | 0.645 | 32 |
| intact | 0.744 | 0.686 | 0.654 | – | 32 |

Share carrying the repair line in generations 3–5: `dusk-before-*` learn 0.66, inherit 0.995; `shelter-before-*` learn 0.47, inherit 0.995.

## Hypotheses (unit: the population)

| | test | populations ahead / behind | diff | p or bound | verdict |
|---|---|---|---|---|---|
| **R1 (primary)** | `dusk`: inherit > learn | 43 / 4 of 48 | +0.110 | p < 0.0001 (Holm α 0.025) | **supported** |
| **G1 (primary)** | `shelter`: inherit > learn | 30 / 1 of 32 | +0.103 | p < 0.0001 (Holm α 0.05) | **supported** |
| R2 | `dusk`: learn > born | 35 / 8 | +0.028 | p < 0.0001 | supported |
| R3 | `dusk`: inherit > inheritAny | 27 / 14 | +0.028 | p 0.013 | supported |
| G2 | `shelter`: learn > born | 16 / 8 | +0.014 | p 0.099 | not supported |
| G3 | `shelter`: inherit > inheritAny | 17 / 7 | +0.021 | p 0.064 | not supported |
| N1 | intact: learn not worse than born by 0.05 (gens 0–5) | 4 / 28 | −0.053 | lower bound −0.067 | **not supported** |
| N2 | intact: inherit not worse than born by 0.05 (gens 3–5) | 2 / 29 | −0.090 | lower bound −0.111 | **not supported** |

## Reading

1. **Inheriting beats learning, again and for a second damage.** On new seeds, with the population as the unit, inheriting a surviving mother's revisions adds 11 points over learning from scratch when `dusk` is broken, and 10 points when `shelter` is broken. With `shelter` broken, learning within one life barely helps (+1.4, not significant): almost all the repair comes from inheritance.
2. **Selection adds a little** with `dusk` (+2.8, replicating H3 of the first study); with `shelter` the same direction (+2.1) is not significant.
3. **With nothing to repair, learning and inheriting cost.** Learning costs 5.3 points (28 of 32 populations worse); inheriting costs 9.0 (29 of 32 worse). The first study's H4 was not decided; here the cost is measured and is larger than the margin. Inheritance amplifies what mothers learned: the repair when the program is broken, the mistakes when it is not.

## Exploratory, after the run: where the cost comes from

Lines inherited by intact daughters (gens 3–5): mostly `memory-before-scent` (775) and `memory-before-pursue` (643), going to a remembered place instead of following a scent or a fruit in sight; a few are lethal (`pursue-before-dusk` 0.31 alive, `pursue-before-anticipate` 0.30). These are the lines the old judge used to write; the reserves judge still writes some when there is nothing to repair. The cost is not only the lines: inheriting daughters that received no line also survive less than their born twins (0.65 vs 0.73), so part of it is the trials themselves. Carrying a line is not random, so these splits are description, not cause. Deaths by cold rise from 252 (born) to 325 (learn) and 365 (inherit).

## Consequences (as preregistered)

- R1 and G1 supported: the site keeps leading with "inheriting beats learning", now replicated and extended to a second damage.
- N1 and N2 not supported: learning, and more so inheriting, cost survival when nothing is broken. The game turns these learning settings on; it should not keep them on by default without a fix to what is learned (for instance, a revision kept only when it beats the born order in her own life, or inheritance only of revisions with evidence of repair). The site says so.

## Limits

- Damages are deliberate (one line moved to the end); one world (one fruit every 575 s); daughters live alone, not in a colony.
- Rewrites stay within the grammar (one behavior in front of another under one condition).
