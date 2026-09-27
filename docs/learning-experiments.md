# Learning experiments

What learning buys Fagi, measured with `scripts/batch.js`. Every number here
can be reproduced with the commands below.

## Setup

- **Chemistry maps** (`MAPGEN.species=6`): six wild species, one tree each.
  A fruit is a color, a shape and a smell. The map's hidden chemistry decides
  what each trait tends to do: one smell poisons, one nourishes, the other
  two are mild; three colors carry a buff; shape does nothing
  (`src/chemistry.js`). Every map has at least two poisonous and two
  nourishing species. Fruit that is left too long rots into `toxic`.
- **Classic maps** (default): one nectar tree.
- 4 maps (seeds 1, 42, 7, 13) × 12 runs × 1800 s, with `--world-varies`.
- Variants:
  - `none`: no learning at all (`BRAIN.learnRate=0`, `CUES.enabled=0`);
  - `key`: learns each species on its own (`CUES.enabled=0`), which is how
    Fagi worked before;
  - `cues`: also learns traits (`src/learned/cues.js`, the default).

```bash
node scripts/batch.js --map-seed 1 --runs 12 --duration 1800 --world-varies \
  --set MAPGEN.species=6 [--set CUES.enabled=0] [--set BRAIN.learnRate=0] --json out.json
```

## Metrics

- **harmful %**: bites that were harmful, out of all bites.
- **harmful avoided**: harmful kinds she met (saw) and never bit.
- **helpful tried**: helpful kinds she met and bit at least once. This is the
  check against over-avoidance: refusing everything is not learning.
- **first harmful bites**: first bites of a harmful kind, per run. Each one is
  a lesson paid for with her body.

A kind counts as harmful or helpful by its real effect (ground truth from
`chemistry.js`). Fagi never sees that; only the runner uses it to score her.

## Results

| variant | alive at 1800 s | mean life | harmful % | harmful avoided | helpful tried | first harmful bites / run |
|---|---|---|---|---|---|---|
| chemistry · none | 12/48 | 969 s | 56% | 56%* | 34% | 1.63* |
| chemistry · key | 28/48 | 1330 s | 41% | 36% | 47% | 2.35 |
| chemistry · **cues** | **33/48** | **1422 s** | **35%** | **47%** | **55%** | **1.94** |
| classic · key | 48/48 | 1800 s | 15% | 38% | 100% | 0.63 |
| classic · cues | 48/48 | 1800 s | 15% | 35% | 100% | 0.65 |

\* Without learning she dies early, so she simply meets and bites less; those
two columns are not comparable with the others.

On chemistry maps, learning traits on top of species:

- cuts first bites of **poisonous species** (rotten fruit aside) from 73 to 53,
  i.e. −27%;
- raises harmful kinds avoided without tasting them from 36% to 47%;
- does **not** make her timid: she tries more helpful kinds (47% → 55%);
- keeps 5 more of the 48 runs alive at 1800 s.

On classic maps it changes nothing measurable, as expected: every classic
fruit has its own smell, so there is little to generalize.

### Trading caution for curiosity

Writing trait rules after a single experience (`CUES.ruleEvidence=1`, default 2):

| variant | harmful % | harmful avoided | helpful tried |
|---|---|---|---|
| cues (default) | 35% | 47% | 55% |
| cues · ruleEvidence=1 | 28% | 57% | 40% |

Fewer poison bites, but she stops trying good fruit. That is the wrong-blame
problem made visible: the first bad fruit blames its color and shape too, and a
rule written that early turns the blame into a superstition she never tests.
The default keeps the balance; `ruleEvidence=1` is a good setting to show what
superstition looks like.

## Phase 2: induced rules

Trait rules can also be induced from whole species (`src/learned/induce.js`,
`CUES.induce`). Induction works from the specific to the general:

- one species is never generalized;
- two species that did the same give a rule with only the traits they share;
- each further species drops the traits it does not share, and the new rule
  records the rule it grew out of (`from`);
- a species that fits but did the opposite becomes an exception (`except`), as
  long as the rule has more cases for it than against it.

Each rule carries its evidence (`pro`, `con`, `cases`). The brain map and the
batch report compare each rule with the map's hidden chemistry: a rule is
**fully right** if every fruit it covers on the map really does what it says.

Same maps and runs as above (chemistry maps, 48 runs):

| trait rules (`CUES.induce`) | alive | harmful % | helpful tried | rules at the end | fully right | fruit covered that fit |
|---|---|---|---|---|---|---|
| 0: one trait at a time, by weight (Phase 1) | 33/48 | 35% | 55% | 86 | 81% | 91% |
| 1: induced only | 29/48 | 39% | 51% | 23 | 91% | 97% |
| **2: both** (default) | **33/48** | **35%** | **55%** | 92 | 85% | 93% |

- Induced rules are more often right (91% vs 81%) but come later: she needs to
  taste two species that agree before she generalizes. On their own, they
  protect her less than the one-trait rules, which already act after two bites.
- Together, behavior is exactly the Phase 1 one (induced rules only cover
  fruit the one-trait rules already avoid), and the rule set is more accurate.
  That is why the default is 2.
- Rules found in the induced-only runs: `avoid-smell-musky` (4/4 on the map,
  9 runs), `avoid-smell-sharp` (3/3, 5 runs), `avoid-color-blue-smell-sharp`
  (right but narrower than the truth, 5 runs), and the superstition
  `avoid-shape-round` (2/3, 2 runs): rotten fruit and a round poison share
  their shape.
- Exceptions are rare (1 in 92 rules): with this chemistry a smell is never
  good and bad at once, so counterexamples only come from noise.
- Classic maps: unchanged (48/48 alive, same numbers), and with
  `CUES.enabled=0` the fingerprints are identical to before Phase 1.

```bash
node scripts/batch.js --map-seed 1 --runs 12 --duration 1800 --world-varies \
  --set MAPGEN.species=6 --set CUES.induce=1 --json out.json
```

## Phase 3: explanations

`src/learned/explain.js` answers "what do you think of this fruit, and why?"
from the same sources the decision uses (`rules.verdict`, `cues.predict`),
plus a log of her last 80 experiences with fruit (`brain.bites`, saved and
exported with the rest). An explanation has:

- her **stance**: avoid (a rule forbids it), wary, curious, tempted, and for
  fruit she has tasted, likes or dislikes;
- the **rule** behind it, with its evidence for and against and its exceptions;
- the **trait** that weighs most, with what the kinds she tasted with it did;
- the **bites** it rests on: the latest bite of each kind involved, the ones
  that agree with her stance first;
- a **counterfactual**, for cautious stances: the single trait that, taken
  away, would change her mind (asked by re-running the same verdict and
  prediction without it), or that no single trait would.

The narrator writes one line each time her opinion of an untasted fruit she
perceives changes, and the **Ask Fagi** tool (in the object palette; also
works while replaying) opens a card for any fruit or tree clicked, which
stays current while she learns.

Measured on the same 48 chemistry runs (`opinions on untasted` in the report):
402 opinion changes, 334 of them "curious" (nothing to go on yet). All 68 others
(28 avoid, 7 wary, 33 tempted) trace back to bites she really took, and 33 of
the 35 cautious ones hang on a single trait. Behavior is unchanged: explaining
is read-only (33/48 alive, and the fingerprints match the previous commit).

Explanations also make mistakes visible. In one run she avoids a red crystal
because "crystal" things made her sick, while the real culprit was their
musky smell. Her counterfactual says so: "Without its crystal shape, I'd give
it a try." That is a superstition, and now it can be read.

## Phase 4: habits

`src/habits.js` turns five thresholds of the decision hierarchy into habits she
tunes from what happens to her. The hierarchy stays as it was; only the
numbers it hangs on move:

| habit | what it is | factory | ladder | cautious |
|---|---|---|---|---|
| `tasteAt` | hunger from which she eats an untasted fruit instead of carrying it | 45 | 0 · 15 · 30 · 45 | lower |
| `hungerAt` | hunger from which going for food is urgent | 55% | 35 · 45 · 55 · 65% | lower |
| `thirstAt` | thirst from which going for water is urgent | 55% | 35 · 45 · 55 · 65% | lower |
| `restAt` | energy from which she rests | 22 | 10 · 22 · 35 · 50 | higher |
| `reserve` | rations she counts as enough | 12 | 6 · 12 · 18 · 24 | higher |

Each habit moves one rung at a time, like a psychophysics staircase:

- **scares** move it toward caution: hunger or thirst at 85%, running out of
  energy, a scare with an empty pantry, a first bite from the pantry of
  something she had stored untasted that turns out to harm her, and dying;
- **waste and calm** move it back: rations spoiling in the pantry, or 10
  minutes without a scare.

Every move is narrated with its reason ("Learns to taste new fruit before
storing it · she had stored red drop, musky without tasting it, and it harms
her"). The brain map shows the habits under the hierarchy, and they are saved,
exported and recovered with the rest of what she learned.

A habit that has never moved reads the factory value. With `HABITS.enabled=0`
and `CUES.enabled=0`, the fingerprints match the original baseline.

### A bug found on the way

On chemistry maps most deaths were from hunger with a **full pantry**. She
stored 12 fruit she had never tasted, the pantry counted as full, so she
stopped foraging. When she finally ate from it, it was poison. Now only food
she would eat counts toward the pantry (`edibleCount`). This fix alone saves 1
more run (33 → 34/48): the real problem was storing untasted fruit, and that
is the habit she learns.

### Experiment

Protocol: train on **other maps** (seeds 3, 5 and 11, 8 chained lives each with
`--chain`, 24 lives in total), then test the learned habits, frozen
(`HABITS.learn=0`), on the usual maps. Every variant runs on the same 4 maps
× 12 runs × 1800 s with `--world-varies`.

| variant | chemistry: alive | deaths | classic: alive |
|---|---|---|---|
| A · factory (`HABITS.enabled=0`) | 34/48 | 11 hunger, 3 thirst | 48/48 · 93/96 more seeds |
| B · learning within one life only | 34/48 | 11 hunger, 3 thirst | 48/48 |
| **C · habits learned on other maps** | **46/48** | 2 thirst | 47/48 · **96/96** more seeds |
| D · learned, and still learning | 46/48 | 2 thirst | – |

- Learned habits: `tasteAt` 0 (always taste new fruit before storing it),
  `hungerAt` 35%, `restAt` 35, `reserve` 6, and `thirstAt` unchanged.
- **Hunger deaths disappear** on maps she never trained on.
- Learning within a single life (B) changes nothing measurable. The lessons
  come too late: the scare that teaches "taste first" is the one that kills
  her. Habits pay off from one life to the next, which in the game is
  "Recover what it learned".
- The remaining thirst deaths are all the same: she never finds water in the
  first 3 minutes. That happens with factory habits too, and no habit
  addresses it.
- Costs: she stores less (reserve 6: rations were spoiling), and on classic
  maps a few more of her bites are harmful (17% vs 15%), because she tastes
  rotten fruit instead of carrying it home.
- A first version counted a pantry full of poison as "empty", so it learned
  `reserve` 24. It spent the first minutes gathering instead of finding water,
  and thirst deaths went from 3 to 7. Only a really empty pantry teaches a
  bigger reserve now.

```bash
C="--runs 8 --duration 1800 --world-varies --set MAPGEN.species=6 --chain"
node scripts/batch.js --map-seed 3 $C --habits-out h1.json
node scripts/batch.js --map-seed 5 $C --habits-in h1.json --habits-out h2.json
node scripts/batch.js --map-seed 11 $C --habits-in h2.json --habits-out H.json
node scripts/batch.js --map-seed 1 --runs 12 --duration 1800 --world-varies \
  --set MAPGEN.species=6 --habits-in H.json --set HABITS.learn=0
```

## Cost

A chemistry map costs about 190 µs per simulation step on one core (six trees,
more fruit and more scent plumes), against about 85 µs on a classic map. That
is ~1% of a 60 fps frame budget.
