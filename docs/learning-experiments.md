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

## Cost

A chemistry map costs about 190 µs per simulation step on one core (six trees,
more fruit and more scent plumes), against about 85 µs on a classic map. That
is ~1% of a 60 fps frame budget.
