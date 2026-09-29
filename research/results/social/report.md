# Social learning with a misinformed sister: results

Produced by `node research/social/analyze.js research/results/social`. Protocol: `docs/research/social-protocol.md`.

## Confirmatory hypotheses

One-sided paired sign-flip permutation tests of (a + shift) − b > 0 (10 000 permutations), 95% bootstrap interval of the mean difference a − b, dz; Holm over the three, α = .05.

| test | prediction | outcome | n | a | b | a − b [95% CI] | shift | dz | p | Holm p | supported |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S1 | a sister who knows the map makes the naive sisters take less poison (none vs true) | dose | 120 | 1.588 | 1.522 | 0.066 [-0.066, 0.192] | 0 | 0.091 | .161 | .161 | **no** |
| S2 | a misinformed sister does not make the naive sisters judge the map more than 0.05 worse (false vs none) | judgment | 120 | 0.800 | 0.813 | -0.013 [-0.031, 0.004] | 0.05 | 0.378 | < .001 | < .001 | yes |
| S3 | of the false rules they adopt from her, fewer than half still stand at the end (0.5 vs false) | falseShare | 115 | 0.500 | 0.262 | 0.238 [0.206, 0.269] | 0 | 1.311 | < .001 | < .001 | yes |

## Exploratory: every informant

Means per colony (naive sisters), and in brackets the paired difference with `none` and its 95% bootstrap interval. Not corrected: descriptive.

| informant | n | dose | judgment | alive | lifetime | adopted | adoptedFalse | standingFalse | falseShare | myths | informantJudgment | informantAlive | deaths |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | 120 | 1.588 | 0.813 | 0.883 | 2241 | 0.000 | 0.000 | 0.000 | – | 1.831 | 0.806 | 0.892 | poison 47, thirst 4, cold 5 |
| true | 120 | 1.522 (-0.066 [-0.192, 0.066]) | 0.824 (0.011 [-0.006, 0.028]) | 0.896 (0.013 [-0.031, 0.056]) | 2265 (23.306 [-40.518, 88.898]) | 14.608 (14.608 [13.900, 15.242]) | 1.267 (1.267 [1.017, 1.542]) | 0.512 (0.512 [0.381, 0.654]) | 0.391 | 1.810 (-0.021 [-0.246, 0.208]) | 0.817 (0.012 [-0.014, 0.037]) | 0.933 (0.042 [-0.017, 0.108]) | thirst 6, poison 36, cold 5, hunger 2, wounds 1 |
| false | 120 | 1.534 (-0.054 [-0.169, 0.059]) | 0.800 (-0.013 [-0.031, 0.004]) | 0.856 (-0.027 [-0.067, 0.017]) | 2188 (-53.071 [-115, 8.613]) | 13.242 (13.242 [12.617, 13.775]) | 4.308 (4.308 [3.925, 4.700]) | 1.129 (1.129 [0.958, 1.306]) | 0.262 | 2.371 (0.540 [0.258, 0.835]) | 0.673 (-0.133 [-0.163, -0.102]) | 0.467 (-0.425 [-0.517, -0.325]) | poison 48, cold 16, hunger 3, thirst 2 |

What the informant brought (mean per colony): rules, of those about eating, and of those false on this map.

| informant | rules | eating | false |
|---|---|---|---|
| true | 14.608 | 7.858 | 1.267 |
| false | 13.242 | 6.392 | 4.308 |
