# Pilot: reasons, conclusions and evidence under four kinds of change

**Exploratory.** These runs were used to shape the hypotheses and size the
main study. They are not evidence for the hypotheses they suggested.

## Design

`research/designs/pilot.json`, commit in `research/results/pilot/manifest.json`.

- Lab lineages of 12 generations, colonies of 5, 1800 s per generation.
- Chemistry: one smell poisons, one nourishes (`family: 'one'`); a
  catalogue of 12 species, 6 on each generation's map (a new draw every
  generation, so most fruit a newborn meets are new to her lineage).
- The world changes at generation 6: `none`, `invert` (poison and food swap),
  `rotate` (the poison moves to another smell), `shift` (to a color).
- What is passed on (budget 4 items per exchange and per teaching): `none`
  (the control), `verdict`, `rule`, `evidence`.
- 30 seeds per cell, the same in every cell: 480 lineages, 18 s.

## Results

Mean per lineage [95% bootstrap interval]. `stable.*` averages generations
1–5; `shock.*` is generation 6; `recovery` is generations until what newborns
are taught is back within 0.05 of its steady-state accuracy.

| format | change | harmful bites / ant (stable) | accuracy taught (stable) | alive at the change | meals lost at the change | myths / ant at the change | recovery (gens) |
|---|---|---|---|---|---|---|---|
| none | invert | 1.11 [1.03, 1.19] | 0.50 | 0.79 [0.72, 0.87] | 0.02 | 0.00 | – |
| verdict | invert | 0.83 [0.75, 0.91] | 0.59 | 0.69 [0.60, 0.77] | 0.09 | 1.75 [1.53, 1.99] | 1.13 |
| rule | invert | **0.39** [0.34, 0.44] | **0.67** | **0.41** [0.29, 0.54] | **0.27** | **3.16** [2.75, 3.59] | 2.27 |
| evidence | invert | 0.51 [0.45, 0.57] | 0.57 | 0.67 [0.55, 0.79] | 0.17 | 1.15 [0.88, 1.42] | 1.77 |
| none | rotate | 1.01 | 0.50 | 0.98 | 0.02 | 0.00 | – |
| verdict | rotate | 0.58 | 0.60 | 0.97 | 0.05 | 0.76 | 1.10 |
| rule | rotate | 0.30 | 0.67 | 0.98 | 0.17 | 1.59 | 1.63 |
| evidence | rotate | 0.41 | 0.58 | 0.98 | 0.13 | 0.50 | 2.23 |
| none | shift | 1.02 | 0.50 | 0.93 | 0.08 | 0.00 | – |
| verdict | shift | 0.66 | 0.60 | 0.95 | 0.09 | 0.87 | 1.13 |
| rule | shift | 0.33 | 0.67 | 0.90 | 0.17 | 1.24 | 1.77 |
| evidence | shift | 0.41 | 0.59 | 0.94 | 0.14 | 0.51 | 1.53 |

What it suggests:

1. **A crossover.** In a steady world, reasons teach best: half the harmful
   bites of conclusions (0.39 vs 0.83 per ant; paired dz ≈ 1.7–2.3). When
   the world inverts, the lineages that passed reasons do worst of all, worse
   than lineages that passed nothing: 41% alive in the generation of the
   change, against 69% (verdicts) and 79% (nothing). The culture that was
   best becomes a trap.
2. **The trap is myths.** At the inversion, reason-lineages carry 3.2 false
   unlived beliefs per ant, conclusion-lineages 1.8. They also lose more
   meals: 27% of food met while hungry is refused, against 9%.
3. **Evidence cushions it.** Passing the bites behind each reason keeps most
   of the steady-state benefit (0.51 harmful bites per ant) and cuts myths at
   the change to about a third of reasons alone (1.15 vs 3.16; dz ≈ 1.4).
4. **Only the inversion kills.** When the poison moves (`rotate`, `shift`)
   old reasons cost meals (the old poison, now harmless, is still refused)
   but not lives: nobody had a belief about the new poison either way.

## Robustness: the hand-tuned parameters

`research/designs/sensitivity.json`: 64 Latin-hypercube points over 12
parameters (trust, culture trust, the trust floor, budget, contact rate,
observation, food, colony size, two learning rates, rule evidence, outcome
noise), each crossed with the three formats, 10 seeds each: 1920 lineages.

| effect | mean over points [95% CI] | points where it holds | depends most on |
|---|---|---|---|
| steady state: verdict − rule, harmful bites / ant | +0.45 [0.38, 0.52] | **64 / 64** | budget (ρ 0.58), learning rate (−0.47) |
| at the inversion: verdict − rule, alive / ant | +0.20 [0.16, 0.25] | 54 / 64 | budget (0.60), culture trust (0.33) |
| at the inversion: verdict − rule, myths / ant | −0.97 [−1.22, −0.73] | 57 / 64 | budget (−0.52), culture trust (−0.42) |
| at the inversion: rule − evidence, myths / ant | +1.47 [1.24, 1.71] | 56 / 56 non-zero | budget (0.52), colony size (0.42) |

The crossover is not an artifact of one setting. It grows with how much is
passed on (the budget) and how much it is trusted: the more culture, the
deeper the trap.

## Sample size for the main study

From the pilot's paired effects, lineages per cell for 80% power at α = .05:

| comparison | dz | lineages |
|---|---|---|
| steady state, verdict − rule, harmful bites | 1.7–2.3 | 4–5 |
| inversion, verdict − rule, alive | 0.66 | 21 |
| inversion, rule − evidence, alive | 0.54 | 29 |
| inversion, rule − evidence, myths | 1.44 | 6 |
| any effect of dz 0.3 (the smallest worth reporting) | 0.30 | 90 |

The main study can afford 200 lineages per cell (16 cells ≈ 3 minutes), so it
is powered for effects well below the pilot's, including in the conjunctive
chemistry, where they may be smaller.
