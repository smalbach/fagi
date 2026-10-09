# Results: does inherited learning add to learning in life?

Preregistration: docs/research/prereg-lineage-inheritance.md (commit 2459b1c). Run 2026-10-06 14:30–16:06 on that commit, unchanged, exactly as written. Raw data and the analysis output: research/prereg-lineage/. No deviations.

## Survival by generation (512 lives per cell; dusk moved last, one fruit every 575 s)

| gen | born | learn | inherit (survivor mothers) | inheritAny (any mother) |
|---|---|---|---|---|
| 0 | 0.477 | 0.508 | 0.508 | 0.508 |
| 1 | 0.426 | 0.475 | 0.516 | 0.527 |
| 2 | 0.502 | 0.525 | 0.592 | 0.588 |
| 3 | 0.486 | 0.500 | 0.613 | 0.588 |
| 4 | 0.479 | 0.508 | 0.617 | 0.605 |
| 5 | 0.449 | 0.471 | 0.576 | 0.541 |

Generations 3–5 (1536 lives per arm):

| arm | alive | lived (s) | eaten | carries a `dusk-before-*` line | died of cold | died of hunger |
|---|---|---|---|---|---|---|
| born | 0.471 | 5425 | 8.32 | 0.000 | 486 | 312 |
| learn | 0.493 | 5703 | 8.80 | 0.686 | 517 | 256 |
| inherit | 0.602 | 6190 | 9.61 | 0.999 | 406 | 196 |
| inheritAny | 0.578 | 6107 | 9.48 | 0.987 | 408 | 230 |

## Hypotheses

| | test | discordant pairs | p (one-sided) | verdict |
|---|---|---|---|---|
| **H1 (primary)** | inherit > learn | 224 better / 56 worse | < 0.0001 | **supported**, +10.9 points |
| H2 | learn > born | 72 / 39 | 0.0011 | supported, +2.2 points |
| H3 | inherit > inheritAny | 177 / 140 | 0.022 | supported, +2.4 points |
| H4 | learning not worse than born by 0.05, intact program | 12 / 14 (96 lives) | lower bound −0.109 | **not supported** |

## Reading

1. A daughter born with her mother's evidence-backed revisions survives clearly more than one that learns the same way from scratch (0.60 vs 0.49). Nearly every inheriting daughter carries `dusk-before-pursue` from birth; in single lives only 69 % write it, and late. What one life finds too late to save itself saves its daughters.
2. Learning within a life helps, but little (+2 points, smaller than the pilot's +6).
3. Selection adds a little to inheritance (+2.4 points): drawing mothers only among survivors beats drawing any mother.
4. H4 is not supported. With the intact program, learning came out 0.750 vs born 0.771 (12 better / 14 worse); 96 lives cannot rule out a cost of 5 points. As preregistered, the new learning settings stay off in the game.

## Limits

- The gain is a repair of a deliberately broken program (dusk moved last). It shows that learning plus inheritance can recover what was lost; it does not show that they find something the born program lacks.
- One world (one fruit every 575 s, 2-hour lives); daughters live alone in separate worlds, not in a colony.
- The rewrites stay within the grammar: one behavior in front of another under one condition.

## Next (as preregistered for H1 supported)

A world where the born order is not optimal without sabotage (for instance, seasons or maps where the right priority changes), and a larger H4 run before turning anything on in the game.

## Sensitivity: the population as the unit (2026-10-09, exploratory, after the run)

Daughters in one population share mothers (about 8 distinct mothers per 16 daughters in generations 3–5), so the paired lives above are not independent. `node scripts/lineage-by-population.js research/prereg-lineage` treats each of the 32 populations as one number (its survival in generations 3–5) and compares arms population by population (sign-flip permutation, 20 000 draws). The same command on today's code reproduces the stored lives byte for byte (checked on `inherit-7`).

| | diff | populations ahead / behind | t (31 df) | one-sided 95 % lower bound | p |
|---|---|---|---|---|---|
| H1 inherit > learn | +0.109 | 31 / 1 | 11.0 | +0.093 | < 0.0001 |
| H2 learn > born | +0.021 | 19 / 5 | 3.7 | +0.012 | 0.0006 |
| H3 inherit > inheritAny | +0.024 | 20 / 9 | 1.8 | +0.002 | 0.043 |
| inherit > born | +0.131 | 31 / 1 | 11.7 | +0.112 | < 0.0001 |

H1 by generation: +0.041 (gen 1), +0.066 (2), +0.113 (3), +0.109 (4), +0.105 (5). The gain builds over two generations and then holds.

Reading: H1 and H2 do not depend on counting lives as independent. H3 survives at the population level only narrowly. A preregistered follow-up with the population as its unit: docs/research/prereg-inheritance-2.md.

Second study (preregistered, 2026-10-09): docs/research/prereg-inheritance-2-results.md. H1 replicates on new seeds (+11.0, 43/4 populations) and extends to a second damage (`shelter`, +10.3, 30/1); H3 replicates with `dusk`; H4 is now decided against: with the intact program learning costs 5.3 points and inheriting 9.0.
