## Confirmatory tests (two-sided, Holm over the three)

Game confirmation as preregistered (`docs/research/preregistration.md`, frozen in `9d222c3`): 4 formats × 75 lineages, seeds 5000–5074, 1800 s lives, inversion at generation 4. Run with `node research/game-confirm.js --jobs 17` at commit `6c71c7c` (300 lineages, 2026-09-28, about 40 min on 18 cores).

```bash
cd research/results/game-confirm
node ../../embodied.js none=none.json verdict=verdict.json rule=rule.json evidence=evidence.json --confirm
```

| test | outcome | a − b | n | diff [95% CI] | dz | p | p (Holm) | supported |
|---|---|---|---|---|---|---|---|---|
| H1 | stable.harm | verdict − rule | 75 | 0.332 [0.243, 0.411] | 0.91 | 0.0001 | 0.0003 | yes |
| H2a | shock.alive | verdict − rule | 75 | 0.223 [0.133, 0.317] | 0.54 | 0.0001 | 0.0003 | yes |
| H3 | shock.myths | rule − verdict | 75 | 0.827 [0.630, 1.027] | 0.92 | 0.0001 | 0.0003 | yes |
