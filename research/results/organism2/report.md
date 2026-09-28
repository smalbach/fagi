# Organism follow-up evaluation: results

Produced by `node research/organism2/analyze.js research/results/organism2` from the pieces in `research/results/organism2/parts`. Protocol: `docs/research/organism2-protocol.md`.

## Confirmatory hypotheses

One-sided paired sign-flip permutation tests of a − b > 0 (10 000 permutations), 95% bootstrap interval of the mean difference, dz; Holm over all four, α = .05.

| test | prediction | outcome | n | a | b | a − b [95% CI] | dz | p | Holm p | supported |
|---|---|---|---|---|---|---|---|---|---|---|
| F1 | rehearsing the remembered fruit at night makes her judge untasted fruit worse (noReplay vs full, stable) | judgment | 120 | 0.928 | 0.904 | 0.024 [0.005, 0.043] | 0.227 | .007 | .007 | yes |
| F2 | and worse again after the world turns over (noReplay vs full, shift) | judgment | 120 | 0.618 | 0.546 | 0.072 [0.046, 0.096] | 0.502 | < .001 | < .001 | yes |
| F3 | sorting the day at night makes her slower to judge by a world that turned over (noConsolidation vs full, shift) | judgment | 120 | 0.749 | 0.546 | 0.203 [0.168, 0.239] | 0.973 | < .001 | < .001 | yes |
| F4 | without episodic memory the night still asks what to try, and she finds more of the good fruit than without the night at all (noEpisodic vs noConsolidation, stable) | helpful | 120 | 0.951 | 0.503 | 0.448 [0.380, 0.517] | 1.180 | < .001 | < .001 | yes |

## Exploratory: every condition, stable world

Means per life, and in brackets the paired difference with `full` (condition − full) and its 95% bootstrap interval. Not corrected for multiplicity: descriptive.

| condition | n | lifetime | alive | safe | stressed | dose | firstHarm | repeated | judgment | helpful | deaths |
|---|---|---|---|---|---|---|---|---|---|---|---|
| full | 120 | 2368 | 0.983 | 0.994 | 81.606 | 0.565 | 2.208 | 0.000 | 0.904 | 0.947 | cold 1, thirst 1 |
| noReplay | 120 | 2368 (0.000 [0.000, 0.000]) | 0.983 (0.000 [0.000, 0.000]) | 0.993 (-0.000 [-0.001, 0.000]) | 82.070 (0.463 [-2.310, 3.240]) | 0.573 (0.008 [-0.015, 0.035]) | 2.217 (0.008 [-0.033, 0.050]) | 0.000 (0.000 [0.000, 0.000]) | 0.928 (0.024 [0.004, 0.042]) | 0.951 (0.005 [-0.011, 0.022]) | cold 1, thirst 1 |
| noConsolidation | 120 | 1943 (-425 [-555, -294]) | 0.708 (-0.275 [-0.358, -0.192]) | 0.957 (-0.037 [-0.042, -0.031]) | 80.694 (-0.912 [-7.732, 6.345]) | 1.775 (1.210 [1.102, 1.313]) | 1.775 (-0.433 [-0.558, -0.317]) | 0.000 (0.000 [0.000, 0.000]) | 0.830 (-0.075 [-0.112, -0.038]) | 0.503 (-0.443 [-0.503, -0.378]) | poison 34, thirst 1 |
| noEpisodic | 120 | 2368 (0.000 [0.000, 0.000]) | 0.983 (0.000 [0.000, 0.000]) | 0.993 (-0.000 [-0.001, 0.000]) | 81.685 (0.078 [-3.060, 3.226]) | 0.573 (0.008 [-0.015, 0.035]) | 2.217 (0.008 [-0.033, 0.050]) | 0.000 (0.000 [0.000, 0.000]) | 0.922 (0.018 [-0.003, 0.037]) | 0.951 (0.005 [-0.011, 0.022]) | cold 1, thirst 1 |

## Exploratory: every condition, shift world

Means per life, and in brackets the paired difference with `full` (condition − full) and its 95% bootstrap interval. Not corrected for multiplicity: descriptive.

| condition | n | lifetime | alive | safe | stressed | dose | firstHarm | repeated | judgment | helpful | postDose | postRate | deaths |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| full | 120 | 1878 | 0.408 | 0.970 | 88.776 | 3.171 | 2.250 | 2.583 | 0.546 | 0.624 | 2.615 | 0.009 | poison 69, cold 1, thirst 1 |
| noReplay | 120 | 1922 (43.497 [-31.013, 114]) | 0.442 (0.033 [-0.050, 0.117]) | 0.967 (-0.003 [-0.008, 0.001]) | 92.673 (3.898 [-2.752, 10.514]) | 3.142 (-0.029 [-0.194, 0.131]) | 2.275 (0.025 [-0.033, 0.083]) | 2.542 (-0.042 [-0.208, 0.117]) | 0.618 (0.072 [0.047, 0.097]) | 0.635 (0.011 [-0.012, 0.035]) | 2.571 (-0.044 [-0.206, 0.117]) | 0.008 (-0.000 [-0.003, 0.002]) | poison 65, cold 1, thirst 1 |
| noConsolidation | 120 | 1722 (-157 [-304, -12.832]) | 0.483 (0.075 [-0.050, 0.200]) | 0.943 (-0.027 [-0.034, -0.021]) | 79.188 (-9.588 [-18.163, -1.317]) | 2.617 (-0.554 [-0.808, -0.296]) | 1.758 (-0.492 [-0.667, -0.317]) | 0.858 (-1.725 [-1.950, -1.500]) | 0.749 (0.203 [0.166, 0.241]) | 0.338 (-0.286 [-0.345, -0.225]) | 1.433 (-1.181 [-1.438, -0.915]) | 0.006 (-0.001 [-0.003, 0.001]) | poison 61, thirst 1 |
| noEpisodic | 120 | 1929 (50.870 [-23.046, 124]) | 0.450 (0.042 [-0.050, 0.125]) | 0.969 (-0.001 [-0.006, 0.003]) | 89.688 (0.912 [-5.445, 7.529]) | 3.067 (-0.104 [-0.287, 0.067]) | 2.275 (0.025 [-0.033, 0.083]) | 2.467 (-0.117 [-0.292, 0.050]) | 0.611 (0.065 [0.041, 0.091]) | 0.627 (0.003 [-0.016, 0.022]) | 2.496 (-0.119 [-0.298, 0.052]) | 0.008 (-0.001 [-0.003, 0.001]) | poison 64, cold 1, thirst 1 |
