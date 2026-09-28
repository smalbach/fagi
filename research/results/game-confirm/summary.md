## Exploratory summary (not preregistered)

Game confirmation as preregistered (`docs/research/preregistration.md`, frozen in `9d222c3`): 4 formats × 75 lineages, seeds 5000–5074, 1800 s lives, inversion at generation 4. Run with `node research/game-confirm.js --jobs 17` at commit `6c71c7c` (300 lineages, 2026-09-28, about 40 min on 18 cores).

Means per lineage with 95% bootstrap intervals; every pair of formats, Holm within each outcome. Read as description.

```bash
node ../../embodied.js none=none.json verdict=verdict.json rule=rule.json evidence=evidence.json
```

| format | n | stable.harm | stable.acc | stable.alive | shock.alive | shock.harm | shock.myths | post.harm |
|---|---|---|---|---|---|---|---|---|
| none | 75 | 1.95 [1.86, 2.02] | 0.50 [0.50, 0.50] | 0.78 [0.74, 0.82] | 0.81 [0.75, 0.86] | 2.01 [1.89, 2.14] | 0.10 [0.06, 0.14] | 1.89 [1.82, 1.96] |
| verdict | 75 | 1.12 [1.05, 1.19] | 0.53 [0.52, 0.54] | 0.91 [0.89, 0.93] | 0.89 [0.83, 0.94] | 1.29 [1.16, 1.43] | 0.59 [0.44, 0.75] | 1.20 [1.13, 1.27] |
| rule | 75 | 0.79 [0.74, 0.84] | 0.64 [0.62, 0.66] | 0.93 [0.91, 0.95] | 0.67 [0.58, 0.75] | 1.51 [1.36, 1.67] | 1.41 [1.22, 1.61] | 0.74 [0.68, 0.81] |
| evidence | 75 | 0.82 [0.76, 0.89] | 0.60 [0.58, 0.62] | 0.92 [0.90, 0.94] | 0.81 [0.74, 0.87] | 1.36 [1.22, 1.51] | 0.93 [0.72, 1.14] | 0.80 [0.73, 0.86] |

| a − b | outcome | n | diff [95% CI] | p (Holm per outcome) | dz |
|---|---|---|---|---|---|
| none − verdict | stable.harm | 75 | 0.828 [0.714, 0.933] | 0.0012 | 1.71 |
| none − rule | stable.harm | 75 | 1.160 [1.061, 1.254] | 0.0012 | 2.66 |
| none − evidence | stable.harm | 75 | 1.122 [1.014, 1.227] | 0.0012 | 2.38 |
| verdict − rule | stable.harm | 75 | 0.332 [0.243, 0.411] | 0.0012 | 0.91 |
| verdict − evidence | stable.harm | 75 | 0.294 [0.201, 0.391] | 0.0012 | 0.72 |
| rule − evidence | stable.harm | 75 | -0.038 [-0.109, 0.034] | 0.3153 | -0.12 |
| none − verdict | stable.acc | 75 | -0.031 [-0.041, -0.022] | 0.0012 | -0.74 |
| none − rule | stable.acc | 75 | -0.140 [-0.164, -0.116] | 0.0012 | -1.28 |
| none − evidence | stable.acc | 75 | -0.103 [-0.124, -0.082] | 0.0012 | -1.08 |
| verdict − rule | stable.acc | 75 | -0.109 [-0.133, -0.085] | 0.0012 | -0.99 |
| verdict − evidence | stable.acc | 75 | -0.071 [-0.092, -0.050] | 0.0012 | -0.75 |
| rule − evidence | stable.acc | 75 | 0.038 [0.012, 0.063] | 0.0078 | 0.33 |
| none − verdict | stable.alive | 75 | -0.133 [-0.171, -0.096] | 0.0012 | -0.79 |
| none − rule | stable.alive | 75 | -0.153 [-0.193, -0.113] | 0.0012 | -0.86 |
| none − evidence | stable.alive | 75 | -0.139 [-0.181, -0.098] | 0.0012 | -0.77 |
| verdict − rule | stable.alive | 75 | -0.020 [-0.044, 0.007] | 0.4673 | -0.18 |
| verdict − evidence | stable.alive | 75 | -0.006 [-0.032, 0.019] | 0.7341 | -0.05 |
| rule − evidence | stable.alive | 75 | 0.014 [-0.012, 0.039] | 0.5899 | 0.13 |
| none − verdict | shock.alive | 75 | -0.083 [-0.150, -0.020] | 0.0594 | -0.29 |
| none − rule | shock.alive | 75 | 0.140 [0.053, 0.233] | 0.0200 | 0.34 |
| none − evidence | shock.alive | 75 | 0.000 [-0.077, 0.080] | 1.0000 | 0.00 |
| verdict − rule | shock.alive | 75 | 0.223 [0.133, 0.317] | 0.0012 | 0.54 |
| verdict − evidence | shock.alive | 75 | 0.083 [0.013, 0.160] | 0.0844 | 0.25 |
| rule − evidence | shock.alive | 75 | -0.140 [-0.230, -0.050] | 0.0232 | -0.34 |
| none − verdict | shock.harm | 75 | 0.723 [0.567, 0.880] | 0.0012 | 1.04 |
| none − rule | shock.harm | 75 | 0.500 [0.340, 0.657] | 0.0012 | 0.70 |
| none − evidence | shock.harm | 75 | 0.657 [0.497, 0.800] | 0.0012 | 0.94 |
| verdict − rule | shock.harm | 75 | -0.223 [-0.400, -0.043] | 0.0438 | -0.29 |
| verdict − evidence | shock.harm | 75 | -0.067 [-0.220, 0.087] | 0.4341 | -0.10 |
| rule − evidence | shock.harm | 75 | 0.157 [-0.027, 0.327] | 0.2196 | 0.19 |
| none − verdict | shock.myths | 75 | -0.487 [-0.653, -0.340] | 0.0012 | -0.69 |
| none − rule | shock.myths | 75 | -1.313 [-1.510, -1.117] | 0.0012 | -1.47 |
| none − evidence | shock.myths | 75 | -0.830 [-1.043, -0.623] | 0.0012 | -0.90 |
| verdict − rule | shock.myths | 75 | -0.827 [-1.027, -0.630] | 0.0012 | -0.92 |
| verdict − evidence | shock.myths | 75 | -0.343 [-0.583, -0.107] | 0.0098 | -0.32 |
| rule − evidence | shock.myths | 75 | 0.483 [0.200, 0.753] | 0.0024 | 0.39 |
| none − verdict | post.harm | 75 | 0.693 [0.599, 0.786] | 0.0012 | 1.62 |
| none − rule | post.harm | 75 | 1.147 [1.071, 1.219] | 0.0012 | 3.38 |
| none − evidence | post.harm | 75 | 1.090 [0.994, 1.181] | 0.0012 | 2.64 |
| verdict − rule | post.harm | 75 | 0.453 [0.368, 0.533] | 0.0012 | 1.23 |
| verdict − evidence | post.harm | 75 | 0.397 [0.298, 0.487] | 0.0012 | 0.94 |
| rule − evidence | post.harm | 75 | -0.057 [-0.140, 0.032] | 0.2158 | -0.15 |
