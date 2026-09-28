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

## Check in the game

### First try: culture there carried nothing about food

The three formats in the game itself (`scripts/batch.js --generations 8
--switch-at 4 --colony 4 --runs 8 --duration 900 --set MAPGEN.species=6
--set GEN.genes=0 --set SOCIAL.format=F --set SOCIAL.budget=4 --set
GEN.budget=4`), 8 lineages per format: no crossover, and no benefit of
reasons before the change either (alive at the inversion: verdict 84%, rule
97%, evidence 88%).

The reason: newborns in the game were taught nothing better than chance
about the fruit (balanced accuracy 0.50, against 0.65–0.78 in the lab). With
a budget of 4, elders passed on their loudest rules: follow the pheromone,
avoid the rain, avoid the pressure drop, and superstitions like "avoid round
things". The rule about the poison smell was weak and rarely made the cut.
In the lab there is nothing but food, so every item is about food.

`SOCIAL.topic = 'food'` restricts what is passed on to rules about eating.
With it, what newborns are taught in the game rises to 0.52–0.59 accuracy.

### Second try: with food knowledge only

The same command with `--set SOCIAL.topic=food --runs 16 --seed 3000`, plus
a control where nothing is passed on (`GEN.culture=0 SOCIAL.share=0`). Every
format lives the same 16 lineages of worlds, so they are compared in pairs
(`research/embodied.js`). Mean per lineage [95% CI]:

| format | harmful bites / ant, gens 1–3 | accuracy taught | alive at the inversion | myths / ant at the inversion |
|---|---|---|---|---|
| none | 1.28 [1.08, 1.47] | 0.50 | 0.78 [0.64, 0.91] | 0.03 |
| verdict | 0.78 [0.65, 0.91] | 0.52 | 0.88 [0.75, 0.98] | 0.53 [0.25, 0.84] |
| rule | **0.64** [0.53, 0.74] | **0.59** | 0.81 [0.67, 0.94] | **1.47** [1.09, 1.89] |
| evidence | 0.73 [0.61, 0.86] | 0.58 | 0.75 [0.59, 0.89] | 1.05 [0.70, 1.41] |

Paired differences (Holm-adjusted over the six pairs of each outcome):

- **Reasons teach better in a steady world (H1): replicated.** verdict − rule,
  harmful bites: +0.14 [0.06, 0.23], p = .02, dz 0.81. Smaller than in the
  lab (+0.44) but the same direction.
- **Reasons carry more myths into the inversion (H3): replicated.** rule −
  verdict, myths per ant: +0.94 [0.48, 1.47], p = .004, dz 0.93. Evidence
  sits in between (rule − evidence +0.42 [0.03, 0.83], p = .08).
- **The myths do not kill (H2): not replicated.** Survivors at the inversion
  do not differ between formats (every interval spans zero; verdict − rule
  +0.06 [−0.13, 0.27]). In the game, an ant who refuses what is now food has
  the pantry, other fruit and more time to find it; in the lab, a refused
  meal is a meal lost.

So the mechanism travels from the lab to the game: reasons teach better and
carry more false beliefs through a change. Its lethal consequence does not,
at least not with 16 lineages: it depends on how costly a refused meal is.
That dependency is itself a prediction to test (the cost of a false "avoid"
as a factor), not a detail to hide.

## When does the trap kill?

Two exploratory designs in the lab, 60 seeds per cell, inversion at
generation 6.

**How many fruit are met at once** (`research/designs/cost-of-refusal.json`).
The lab offered one fruit at a time, so refusing it meant waiting for the
next; the game shows several. With three at once the trap is shallower but
still there: survivors at the inversion, rule 0.56–0.60 against verdict
0.88–0.93 (one at a time: 0.43–0.44 against 0.64–0.80). Choice alone does not
explain why the game did not show it.

**How long a life lasts** (`research/designs/life-length.json`). From
sated, an ant takes about 1250 s to starve. The game check used lives of
900 s: long enough to eat poison, too short to starve for refusing food.

| format | life | harmful bites / ant (stable) | alive at the inversion | meals lost at the inversion | myths / ant at the inversion |
|---|---|---|---|---|---|
| none | 900 | 0.71 | 0.87 [0.83, 0.91] | 0.01 | 0 |
| verdict | 900 | 0.63 | 0.89 [0.85, 0.92] | 0.08 | 0.92 |
| rule | 900 | 0.34 | 0.80 [0.76, 0.85] | 0.27 | 1.81 |
| evidence | 900 | 0.37 | 0.76 [0.71, 0.82] | 0.24 | 0.83 |
| none | 1800 | 1.12 | 0.82 [0.77, 0.86] | 0.02 | 0 |
| verdict | 1800 | 0.84 | 0.75 [0.68, 0.81] | 0.10 | 1.80 |
| rule | 1800 | 0.39 | **0.45** [0.35, 0.54] | 0.29 | 3.14 |
| evidence | 1800 | 0.51 | 0.66 [0.57, 0.75] | 0.20 | 1.08 |

With 900 s lives the lab looks like the game: reasons still teach best and
still carry twice the myths of verdicts through the inversion, but the trap
barely kills (80% against 89%). With 1800 s it kills (45% against 75%). The
trap is starvation by refusal: reason-lineages turn down a quarter to a third
of the food they meet, and that only kills an ant with time to starve.

This makes a prediction for the game, which is running: with lives of
1800 s, the game should show the trap too.

### The prediction in the game: lives of 1800 s

The game check again (`--duration 1800`, 16 lineages per format, seed 3000,
`SOCIAL.topic=food`), paired by lineage:

| format | harmful bites / ant, gens 1–3 | accuracy taught | alive at the inversion | harmful bites / ant at the inversion | myths / ant at the inversion |
|---|---|---|---|---|---|
| none | 1.99 [1.85, 2.11] | 0.50 | 0.75 [0.58, 0.91] | 2.05 | 0.08 |
| verdict | 1.09 [0.93, 1.26] | 0.54 | **0.86** [0.69, 1.00] | 1.14 | 0.72 |
| rule | **0.72** [0.57, 0.87] | 0.61 | **0.67** [0.48, 0.86] | 1.50 | 1.42 |
| evidence | 0.85 [0.72, 1.00] | 0.62 | 0.83 [0.67, 0.95] | 1.17 | 0.83 |

- H1 again: verdict − rule, harmful bites in the steady state, +0.38
  [0.18, 0.57], p = .014 (Holm), dz 0.87.
- The trap now points the predicted way: at the inversion, reason-lineages
  have the fewest survivors (67%, against 86% for verdicts and 83% for
  evidence), where with 900 s lives the formats were level. The verdict −
  rule gap grew from +0.06 (900 s) to +0.19 (1800 s).
- But 16 lineages are not enough to call it: +0.19 [−0.09, 0.45], dz 0.33,
  which needs about 75 lineages per format for 80% power. In the game the
  trap also works partly through eating: reason-lineages eat more poison at
  the inversion (1.50 against 1.14 harmful bites per ant), not only refuse
  food.

The game agrees in direction with the lab on every contrast, including the
one that depends on life length; it has not yet been run with enough
lineages to confirm the trap on its own.
