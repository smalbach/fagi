# Sex battery: does either sex win everywhere?

Produced by `node scripts/sex-battery.js`. 120 lives per scenario, each lived twice (female, male) on the same map and random stream; whole organism, 6 wild species, 2400 s. Cells: female − male, paired, with its 95% bootstrap interval; **bold** when the interval excludes 0, with the sex it favours. Exploratory: no correction for multiplicity.

| scenario | lifetime | alive | safe | stressed | dose | judgment | helpful | deaths (female / male) |
|---|---|---|---|---|---|---|---|---|
| temperate | -116 [-322, 72.992] | -0.092 [-0.217, 0.017] | -0.005 [-0.022, 0.011] | **-23.049 [-31.790, -14.901] ♀** | 0.115 [-0.033, 0.260] | **-0.033 [-0.062, -0.004] ♂** | **-0.111 [-0.224, -0.006] ♂** | poison 36, thirst 2 / poison 24, thirst 3 |
| cold | **502 [311, 713] ♀** | **0.217 [0.117, 0.325] ♀** | -0.007 [-0.024, 0.009] | **100 [58.688, 144] ♂** | **0.260 [0.063, 0.463] ♂** | **0.067 [0.021, 0.115] ♀** | **0.174 [0.081, 0.269] ♀** | poison 23, cold 43 / poison 11, cold 81 |
| hot | **-905 [-1113, -679] ♂** | **-0.358 [-0.450, -0.258] ♂** | **0.025 [0.011, 0.039] ♀** | **-246 [-305, -183] ♀** | **-0.792 [-0.942, -0.635] ♀** | **-0.176 [-0.219, -0.130] ♂** | **-0.339 [-0.431, -0.244] ♂** | heat 99, thirst 3, poison 1 / poison 28, heat 29, thirst 3 |
| dry | 79.749 [-108, 276] | 0.025 [-0.083, 0.133] | 0.003 [-0.016, 0.022] | **-12.270 [-22.286, -1.732] ♀** | 0.092 [-0.069, 0.256] | -0.000 [-0.031, 0.028] | 0.036 [-0.072, 0.143] | poison 28, thirst 3 / poison 28, thirst 5, cold 1 |
| famine | 9.009 [-191, 223] | -0.008 [-0.108, 0.100] | 0.003 [-0.009, 0.017] | **-13.377 [-23.677, -3.637] ♀** | 0.027 [-0.127, 0.175] | 0.001 [-0.022, 0.024] | -0.035 [-0.142, 0.073] | poison 40, thirst 1 / poison 38, thirst 1, cold 1 |
| far | -140 [-310, 51.326] | -0.092 [-0.192, 0.017] | -0.015 [-0.032, 0.004] | **-25.537 [-33.366, -17.785] ♀** | 0.106 [-0.048, 0.260] | -0.029 [-0.064, 0.006] | **-0.133 [-0.228, -0.028] ♂** | poison 29, thirst 5 / poison 21, thirst 2 |
| shift | -61.448 [-240, 106] | -0.042 [-0.150, 0.067] | -0.001 [-0.017, 0.014] | **-24.083 [-33.762, -14.855] ♀** | **-0.279 [-0.550, -0.025] ♀** | 0.036 [-0.009, 0.081] | -0.058 [-0.136, 0.016] | poison 84, thirst 2 / poison 78, thirst 3 |

Means per sex:

| scenario | sex | lifetime | alive | safe | stressed | dose | judgment | helpful |
|---|---|---|---|---|---|---|---|---|
| temperate | female | 1882 | 0.683 | 0.954 | 67.281 | 1.296 | 0.842 | 0.605 |
| temperate | male | 1998 | 0.775 | 0.959 | 90.330 | 1.181 | 0.875 | 0.716 |
| cold | female | 1403 | 0.450 | 0.953 | 318 | 0.940 | 0.766 | 0.438 |
| cold | male | 901 | 0.233 | 0.959 | 218 | 0.679 | 0.699 | 0.264 |
| hot | female | 534 | 0.142 | 0.982 | 180 | 0.233 | 0.615 | 0.143 |
| hot | male | 1439 | 0.500 | 0.957 | 426 | 1.025 | 0.791 | 0.482 |
| dry | female | 1969 | 0.742 | 0.953 | 77.175 | 1.285 | 0.858 | 0.680 |
| dry | male | 1890 | 0.717 | 0.950 | 89.445 | 1.194 | 0.859 | 0.644 |
| famine | female | 1760 | 0.658 | 0.953 | 71.715 | 1.383 | 0.849 | 0.598 |
| famine | male | 1751 | 0.667 | 0.950 | 85.092 | 1.356 | 0.848 | 0.633 |
| far | female | 1921 | 0.717 | 0.950 | 68.857 | 1.244 | 0.837 | 0.624 |
| far | male | 2061 | 0.808 | 0.965 | 94.395 | 1.137 | 0.866 | 0.756 |
| shift | female | 1548 | 0.283 | 0.939 | 67.448 | 2.808 | 0.620 | 0.390 |
| shift | male | 1610 | 0.325 | 0.939 | 91.531 | 3.087 | 0.585 | 0.448 |

Where each sex is better (interval excludes 0): female 13 (temperate:stressed, cold:lifetime, cold:alive, cold:judgment, cold:helpful, hot:safe, hot:stressed, hot:dose, dry:stressed, famine:stressed, far:stressed, shift:stressed, shift:dose); male 9 (temperate:judgment, temperate:helpful, cold:stressed, cold:dose, hot:lifetime, hot:alive, hot:judgment, hot:helpful, far:helpful).