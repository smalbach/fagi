# Adaptation and diversity across a change of world: results

Produced by `node research/diversity/analyze.js /Users/smalbach/Documents/first-agi/research/results/diversity`. Protocol: `docs/research/diversity-protocol.md`.

## Confirmatory hypotheses

One-sided paired sign-flip permutation tests of (a + shift) − b > 0 (10 000 permutations), 95% bootstrap interval of the mean difference a − b, dz; Holm over the four, α = .05.

| test | prediction | a | b | n | mean a | mean b | a − b [95% CI] | shift | dz | p | Holm p | supported |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 | after the change the population comes to judge the new world better than the change left it | shift.judgmentEnd | shift.judgmentHit | 33 | 0.810 | 0.402 | 0.408 [0.362, 0.456] | 0 | 2.896 | < .001 | < .001 | yes |
| D2 | and ends within 0.1 of a population that never saw the change (non-inferiority) | shift.judgmentEnd | stable.judgmentEnd | 33 | 0.810 | 0.817 | -0.007 [-0.041, 0.025] | 0.1 | 0.934 | < .001 | < .001 | yes |
| D3 | the population comes out of the change with more genetic diversity than it went in with | shift.diversityEnd | shift.diversityBefore | 40 | 0.189 | 0.152 | 0.037 [0.013, 0.058] | 0 | 0.501 | .001 | .003 | yes |
| D4 | without genetic diversity, more of them die of poison after the change | clonal.poisonAfter | shift.poisonAfter | 40 | 0.132 | 0.121 | 0.011 [-0.021, 0.044] | 0 | 0.102 | .258 | .258 | **no** |

## Exploratory: every condition

Means per population, and in brackets the paired difference with `shift` and its 95% bootstrap interval. Not corrected: descriptive.

| condition | n | extinct | alive | judgmentBefore | judgmentHit | judgmentEnd | judgmentNew | diversityBefore | diversityEnd | hatchedAfter | poisonAfter | generations | deaths after the change |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| stable | 40 | 0.125 (-0.075 [-0.200, 0.025]) | 13.175 (0.725 [-0.576, 2.350]) | 0.844 (0.000 [0.000, 0.000]) | 0.844 (0.444 [0.396, 0.494]) | 0.816 (0.007 [-0.025, 0.041]) | 0.816 (0.007 [-0.025, 0.041]) | 0.152 (0.000 [0.000, 0.000]) | 0.204 (0.015 [0.000, 0.035]) | 14.725 (1.675 [0.300, 3.201]) | 0.066 (-0.055 [-0.118, 0.006]) | 6.000 (0.300 [-0.050, 0.650]) | age 480, hunger 6, cold 27, poison 68, thirst 2 |
| shift | 40 | 0.200 | 12.450 | 0.844 | 0.400 | 0.810 | 0.810 | 0.152 | 0.189 | 13.050 | 0.121 | 5.700 | age 394, cold 14, poison 130, hunger 7 |
| clonal | 40 | 0.025 (-0.175 [-0.300, -0.075]) | 14.400 (1.950 [0.375, 3.726]) | 0.865 (0.021 [-0.000, 0.044]) | 0.395 (0.000 [-0.039, 0.040]) | 0.837 (0.030 [0.006, 0.051]) | 0.837 (0.030 [0.006, 0.051]) | 0.000 (-0.152 [-0.163, -0.139]) | 0.000 (-0.189 [-0.213, -0.163]) | 14.775 (1.725 [0.125, 3.600]) | 0.132 (0.011 [-0.021, 0.044]) | 6.125 (0.425 [-0.075, 0.975]) | age 396, poison 159, wounds 1, cold 15, hunger 3, thirst 1 |
