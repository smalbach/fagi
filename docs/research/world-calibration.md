# World calibration: where behavior decides the outcome

2026-10-06. Script: `scripts/calibrate-world.js`. Profile: `scripts/profiles/scarce.json`.

## Why

In the default world (`TREE.interval` 8 s) every program survives two hours, including programs broken on purpose. No learning mechanism can show an effect there: survival and food eaten are capped by the world, not by what she does.

## Method

Organism on, varied maps (map seed 4000 + i), lives of 7200 s, `TREE.interval` swept. Variants of her born program, paired by seed:

- `born`: as born
- `noRest`: rest + sleep moved to the end
- `noFood`: carry + pursue moved to the end
- `noClues`: scent + memory + zigzag moved to the end
- `noWarmth`: thermal + shelter + dusk + huddle moved to the end
- `noPantry`: pantry + eatCarried moved to the end
- `learns`: born program with `PROGRAM.learn` and `PROGRAM.watch` on

Coarse sweep: 24 lives per cell. Fine cells: 48 lives each.

## Survival (share alive at 7200 s)

| interval (s) | born | noRest | noFood | noClues | noWarmth | noPantry | learns |
|---|---|---|---|---|---|---|---|
| 300 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| 450 | 0.96 | 0.92 | 0.71 | 0.88 | 0.92 | 1.00 | 1.00 |
| 525 | 0.92 | 0.67 | 0.79 | 0.96 | 0.67 | 0.92 | 1.00 |
| 550 (48) | 0.94 | 0.40 | 0.73 | 0.96 | 0.38 | 0.94 | 0.98 |
| **575 (48)** | **0.75** | **0.40** | **0.48** | 0.69 | **0.38** | 0.77 | **0.58** |
| 590 (48) | 0.44 | 0.35 | 0.29 | 0.44 | 0.33 | 0.44 | 0.38 |
| 600 | 0.33 | 0.25 | 0.21 | 0.29 | 0.29 | 0.33 | 0.29 |
| 675 | 0.04 | 0 | 0 | 0 | 0 | 0.04 | 0 |
| ≥ 750 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Paired against `born` at 575 (lives where the variant died and born lived / the reverse): noRest 17/0, noFood 16/3, noWarmth 18/0, noClues 5/2, noPantry 2/3, learns 9/1.

## Findings

1. Survival is a cliff in food supply: 100 % at 450 s, 0 % at 750 s. Deaths in the window are cold and hunger, both realistic.
2. **575 s is the discriminating world.** Born survives 75 %; breaking rest, warmth or food lines costs 27–37 points. Behavior decides the outcome here.
3. At 590–600 s (born ≈ 40–50 %) the food supply dominates and the variants separate less. Exactly 50 % is not the best test point.
4. **Program learning hurts at 575 s** (58 % vs 75 %, 9 vs 1 discordant lives, sign test p ≈ 0.02). At 550 s it is neutral to slightly positive (98 % vs 94 %, 3 vs 1). Consistent with earlier measurements that exploratory trials cost.
5. `noPantry` is identical to `born` at 550 s to the last digit: the pantry and eatCarried lines never act in these lives.
6. `noClues` barely matters: the lines back each other up.

## Use

```bash
node scripts/batch.js --organism --profile scripts/profiles/scarce.json --world-varies --runs 48 --duration 7200 --jobs 16
```

Any new mechanism should be tested here against `born`, paired by seed, with survival as the primary measure.

## Why program learning hurts here (2026-10-06, exploratory)

Interval 575 s, 48 lives per cell, paired by seed. Diagnosis seeds 1000–1047, replication seeds 2000–2047.

| variant | alive 1000s | alive 2000s | trials/life | lines/life |
|---|---|---|---|---|
| born | 0.75 | 0.71 | 0 | 0 |
| learns (as today) | 0.58 (9/1 worse/better) | 0.58 (8/2) | ~195 | 1.3–1.4 |
| trialsOnly (trials, `maxOwn` 0) | 0.58 (9/1) | – | 191 | 0 |
| trialsByState | 0.71 (5/3) | 0.63 (7/3) | ~62 | 0 |
| learnsByState (`PROGRAM.exploreByState`) | 0.79 (1/3) | 0.67 (6/4) | ~65 | 2.0 |
| learnsByState, horizon 60 s | – | 0.63 (8/4) | 64 | 0.5 |
| learnsByState, horizon 120 s | – | 0.56 (11/4) | 64 | 1.1 |
| crisis (`PROGRAM.crisis`, no trials) | 0.75 (0/0) | – | 0 | 0 |

1. The whole cost is the trials, not the lines: trials without writing cost exactly as much as full learning. The most common trial is `pursue>memory` (leaving a fruit in sight for a remembered place); she eats 9.4 instead of 12 and dies of cold or hunger late in life.
2. Trying less the worse she is (`PROGRAM.exploreByState`: chance × (1 − distress)²) cuts trials by two thirds. Pooled over 96 seeds, learning goes from −15 points to about even with born (0.73 vs 0.73). It stops the harm; it does not make learning help.
3. The lines she writes are mostly `memory-before-pursue` / `memory-before-scent`. They do not raise survival. A longer horizon does not fix it: at 120 s she writes `pursue-before-dusk` (keep foraging as night falls) and cold deaths rise. Distress over a short window cannot see a death that comes hours later.
4. Crisis learning wrote no line here: in every crisis what relieved her already stood before what she was doing.
5. Inheritance (`PROGRAM.inherit`, 16 lineages × 5 generations, exploreByState on): the journal grows from 1.9 to 5.6 revisions and inherited lines act about 1000 s per life, but survival over generations 1–4 is 0.70 vs 0.80 learning without inheritance and 0.77 born (12/6 vs learning, not significant). What accumulates are the same memory-first lines. In this test every mother passed her program on, dead or alive: there was no selection.

Next: the judge, not the explorer, is the bottleneck. Candidates: judge lines by intake per time or by reserves at dusk instead of distress over 15 s, or let selection judge (only mothers that live pass their lines on, as reproduction.js already does in the game).

## Selection as the judge (option B, 2026-10-06, exploratory)

Populations of 16, 6 generations, 4 populations per arm, interval 575 s, lives of 7200 s, `PROGRAM.exploreByState` on in every learning arm. Each daughter lives in her own world; the same world slots are used in every arm. Arms: `born` (no learning), `learn` (no inheritance), `inheritNoSel` (mother drawn from all, dead or alive), `inheritSel` (mother drawn only from survivors).

| gens 3–5 (192 lives) | alive | eaten |
|---|---|---|
| born | 0.82 | 10.7 |
| learn | 0.72 | 10.4 |
| inheritNoSel | 0.71 | 9.8 |
| inheritSel | 0.72 | 10.3 |

Paired: inheritSel vs inheritNoSel 24/23 (p 1.0); inheritSel vs learn 24/25; learn vs born 15 better / 33 worse (p 0.013); inheritSel vs born 13/32 (p 0.007).

1. Selection changed nothing. The lines that pass are the same in both arms: by generation 5 nearly every daughter carries `memory-before-scent` and `memory-before-pursue` (about 50 and 37 of 64). There is no heritable variation for selection to act on: every life rediscovers the same lines, and whether she lives depends mostly on her world.
2. Even with fewer trials, learning still costs about 10 points here (pooled over these 384 learning lives vs born). The earlier "about even" (96 seeds) did not hold at this sample size.
3. The bottleneck is what the learner writes, not who passes it on. Selection can only cull what varies; the judge (distress over 15 s) makes every lineage write the same memory-first lines.

## Changing the judge (option A, 2026-10-06, exploratory)

Two changes, both off by default:

- `PROGRAM.judge` 1 (reserves): a moment costs what it took from her reserves over the horizon — every need added up (not only the worst) plus food on her back or in the pantry she knows. Chasing a fruit costs energy at once, but the fruit counts as food to come.
- `PROGRAM.darkTrials` 1: in the dark, trials only toward endure lines. Before, no trial was allowed in the dark, and `dusk` (going home as the light goes) answers only once it is dark: she could never find out that it beats what she was doing.

Single lives, 48 per cell, interval 575 s. Design seeds 6000–6047, replication 7000–7047.

| | design | replication |
|---|---|---|
| born | 0.77 | 0.75 |
| learns as before | – | 0.65 (5/10) |
| reserves | 0.71 (4/7) | – |
| reserves + darkTrials | 0.79 (5/4) | 0.77 (6/5) |
| dusk moved last, no learning | 0.44 | 0.44 |
| … + reserves | 0.42 (1/2) | – |
| … + reserves + darkTrials | 0.54 (5/0) | 0.52 (4/0) |
| warmth lines moved last, no learning | 0.33 | 0.46 |
| … + reserves + darkTrials | 0.46 (6/0) | 0.42 (0/2) |

(better/worse vs the row without learning, paired by seed)

- Judged by reserves she stops writing memory-first lines (0.3 lines/life vs 1.8) and, with warmth broken, writes `shelter-before-pursue`; with dark trials she writes `dusk-before-pursue`, the real repair.
- With dusk broken, learning repairs part of it in one life: 0.44 → 0.53 pooled, 9 better / 0 worse (p 0.004). Intact, learning no longer costs (0.78 vs 0.76).
- All four warmth lines broken: not replicated.

Lineages (16 × 6 generations × 4 populations, dusk moved last and inherited through the genome base, reserves + darkTrials + exploreByState, survivor-only mothers):

| gen | born | learn | inherit + selection |
|---|---|---|---|
| 0 | 0.45 | 0.48 | 0.48 |
| 1 | 0.44 | 0.48 | 0.55 |
| 3 | 0.47 | 0.53 | 0.55 |
| 5 | 0.53 | 0.58 | 0.63 |

Gens 3–5: learn vs born 12/1 (p 0.003); inherit vs born 20/4 (p 0.002); inherit vs learn 18/13 (p 0.47). By generation 5, 63 of 64 daughters carry `dusk-before-pursue`. First result where what she learns, and what her mothers learned, raises survival. Inheritance adds to learning in trend, not yet significantly. Needs a preregistered run before any claim. Preregistered run: docs/research/prereg-lineage-results.md (H1 supported, inherit 0.60 vs learn 0.49).

## Is there anything to learn without sabotage? (2026-10-06, exploratory)

`scripts/order-screen.js`: every move the learner can make (a born line put right in front of one above it, no condition; 171 moves), 24 lives each against the born order, paired by seed.

- Scarce world (575 s): no move beats the born order. The best are +2 net of 24 (noise over 171 tests); 102 of 171 moves change nothing at all (the lines never compete); many are lethal (`pursue>rest`, `pursue>sleep`: 0 % alive).
- Five more worlds, all scarce, 22 plausible moves, 24 lives each: warm nights (mean 26, swing 4; born 0.33), cold (18 ± 14; 0.71), long nights (dawn 0.35, dusk 0.65; 0.79), hot days (28 ± 12; 0.25), rain every 45 s (0.42). In warm and rainy worlds no move changes anything. The one recurring hint, `memory>thermal` (long nights 0.92 vs 0.79, 4/1), did not replicate on 48 new seeds (9/10).

Reading: the born order is a robust local optimum across these worlds. Part of why: the behaviors carry their own learning (`dusk` acts only once the dark means cold to her, `thermal` only once she knows the nest helps), so the same order adapts by itself. Reordering lines has something to find only when the order is broken. For entities to find something new, the world must demand a priority nobody built in, or the grammar must let them build more than an order.

## The game's world: three colonies, each in its own habitat (2026-10-07)

`scripts/game-world.js`: the game's own settings (`src/app/organism-on.js`: three colonies of up to 30, seasons, evolving body, fruit that weighs), 3 years per map, varied maps.

**A bug first.** Further nests' water and trees were placed without checking the map's edge: 583 of 2000 waters, trees and nests sat partly or wholly off the map. Ants of those colonies died of thirst pacing the edge 2–60 px from water they could not reach (27 thirst deaths in the first year on 4 maps). Fixed for colonies and habitats (`placeAround` in `mapgen.js`); the preregistered maps (one nest, species ring) are drawn exactly as before. Thirst deaths fell to ~0.

**Habitats** (`src/habitats.js`, `HABITATS`, on in the game): each nest gets one, dealt at random per map — `cold` (air 5 °C colder around it, fading by 1/d²), `lean` (its trees bear × 0.4), `toxic` (a poisonous tree 150–260 px from it).

**Fruit interval** (6 maps × 3 years, then 8 maps × 3 years with habitats shuffled):

| fruit every | alive (% of ceiling) | what they die of | nests emptied / refounded |
|---|---|---|---|
| 8 s (game until now) | 71–73 % (25 of 30 by year 2) | mostly age | 0 / 0 |
| 20 s | 53–64 % | cold ≈ age | 0 / 0 |
| **30 s** | lean 38 %, toxic 48 %, cold 48 % | cold > age | 3 of 72 nest-years / 4 |
| 40 s | lean 31 %, toxic 45 %, cold 28 %, falling in year 3 | cold ≫ age | 8 of 72 / 7 |
| 80 s | 12–31 % | cold | 13 of 54 / 11 |

The game moves to 30 s: food and winter set how many live, habitats separate, colonies turn over now and then, no map dies out. At 40 s cold and lean colonies keep falling and refounding needs a donor of 15, so long games would empty.

Cold deaths are not an artifact (autopsy, one map, 2 years, 30 s): all 57 in winter, 39 at night, nearly all far from the nest (median ~500 px), 38 of 57 with hunger above 60 — foragers caught out hungry in the cold.

Hunger itself almost never kills: scarcity acts through cold while foraging and through fewer broods.

## Inheriting what was lived, in the game (2026-10-07)

Same 8 maps, 4 years, fruit every 30 s, habitats on. A: the game as above. B: plus an epigenetic mark of the parents' organs (`MORPH.inherit` 2) and conduct learned and inherited as preregistered (`PROGRAM.learn/inherit/judge/darkTrials/exploreByState` 1).

| | A | B |
|---|---|---|
| alive per nest | 12.0 | 12.7 (B − A +0.8, 5 of 8 maps, t 1.3) |
| nests emptied / refounded | 12 / 11 | 7 / 7 |
| lines of her own per ant | 0 | 0.41–0.74, of which 0.29–0.47 inherited |
| commonest line | — | memory before pursue, memory before scent |
| muscle body / gene | 1.06–1.12 / 1.03–1.08 | 1.14–1.17 / 1.05–1.06 |
| size body / gene | 0.93–1.02 / 1.00–1.08 | 0.89–0.90 / 1.00–1.01 |

B goes into the game: it costs no population, conduct passes from mother to daughter, and bodies follow what was lived. **Not yet local adaptation:** the three habitats end with the same lines and the same bodies. The lean winter presses the same way everywhere, and the cold habitat barely reaches the brood (the nest takes 80 % of the air's chill off). For colonies to diverge, habitats must pull in different directions.

## Habitats that pull opposite ways, and a reciprocal transplant (2026-10-07)

Habitats redesigned: `cold` (air and soil −6 °C, so the nest and the brood feel it), `hot` (+6 °C), `toxic` (poison close by). `scripts/transplant.js`: 16 maps (seeds 7300–7315), 4 years living where they are, then 2 years in which every newborn is cross-fostered at hatching (1/3 stays, 1/3 to each other nest), each followed until death or 1.5 years past the window. 1 409 cross-fostered newborns.

**Before the transplant** (adults per colony): body size follows the temperature-size rule in the expected direction but weakly (hot 0.874, cold 0.902, toxic 0.915); size genes 0.99–1.02, the same everywhere. Cold colonies are smallest (8.4 adults vs 12–14) and weakest (muscle body 1.03 vs 1.13). The same lines of conduct everywhere (memory before pursue). 14 colonies refounded over the 16 maps: gene flow between habitats.

**Local vs foreign** (same habitat, same time; per map, then over maps):

| measure | local − foreign | t | maps local ahead |
|---|---|---|---|
| reached adulthood | −0.008 | −0.9 | 4/16 |
| days lived | −1.27 | −2.2 | 5/16 |
| offspring | −0.41 | −2.9 | 3/16 |

No local adaptation. The opposite: in every habitat, newborns from elsewhere did better than those born there, whichever habitat they came from (e.g. raised in toxic: locals 1.90 offspring, from cold 2.16, from hot 2.37). A "stranger advantage" that does not depend on origin is not adaptation; likely candidates are mating (an immigrant is unrelated to every resident, and mates are refused above `LIFE.kinLimit` relatedness) and something not yet found for lifespan. It must be explained before a transplant can measure local adaptation here.

Why no local adaptation yet: about 10 generations; colonies of ~10 adults (drift outweighs weak selection); refounding mixes colonies; and the inherited conduct (`PROGRAM` lines) has nothing habitat-specific to say.

### The stranger advantage is mating with non-kin (2026-10-07)

Same transplant on 12 new maps (seeds 7400–7411, 3 years, then a 2-year window), with and without the rule that refuses a mate past `LIFE.kinLimit` relatedness:

| | offspring, local − foreign | days lived, local − foreign |
|---|---|---|
| kin rule on (as in the game) | −0.28 (t −1.7, 4/12 maps) | −0.36 (t −0.5) |
| kin rule off (`kinLimit` 1.01) | −0.05 (t −0.3) | +0.05 (t 0.1) |

- With the rule on, the advantage is in females: as mothers, foreign 2.29 vs local 2.08 broods; as fathers males are even (2.10 vs 2.06). A local female may not take her brothers, often the best males of a small colony; a newcomer is unrelated to all of them.
- With the rule off it disappears. The lifespan gap of the first run did not replicate (noise).
- So it is not a bug, and it is real biology in kind (immigrants into small, related populations mate more). But here kin avoidance has no reason to exist: nothing in the code makes inbred young worse (no inbreeding depression), so the rule costs locals and pays nothing.
- With the stranger advantage removed (rule off), there is still no local adaptation: local − foreign ≈ 0 on every measure. The habitats do not yet shape the colonies.

### Inbreeding depression (2026-10-07)

`LIFE.inbreeding` (lethal equivalents per gamete; off in research, 1.57 in the game, the median of 40 captive mammal populations, Ralls, Ballou & Templeton 1988): an egg with inbreeding coefficient F hatches with chance exp(−1.57 F), so a full-sib egg 2 times in 3. Now the kin rule for mates has a reason to exist.

Same 12 maps as above (seeds 7400–7411):

| | adults (hot / cold / toxic) | refounded | offspring, local − foreign | reached adulthood, local − foreign |
|---|---|---|---|---|
| without | 14.0 / 8.6 / 14.2 | 7 | −0.28 (t −1.7) | −0.006 |
| with | 12.4 / 7.4 / 15.1 | 6 | −0.36 (t −1.7) | +0.010 (t 2.0, 8/12) |

Populations barely change (−5 %). Newcomers still leave more young, now for a reason found in nature too: their young are outbred (genetic rescue of small, related colonies). Still no local adaptation.

## Twenty years (2026-10-07)

`scripts/game-world.js`, the game as it is now, 8 maps (seeds 7500–7507), 20 years each (~50 generations).

**Evolution happens, the same way everywhere.** Genes from year 1 to year 20, hot and toxic colonies: muscle +0.185 (t 5.0, up in 8/8 maps), brain −0.128 (t −4.6, down in 7/8), size +0.061 (t 2.0, 6/8); gut, eyes and antennae drift. Carrying fruit that weighs pays for muscle; a costly brain does not pay for itself. This is adaptation to the world all colonies share.

**Not local.** The cold habitat (−6 °C on top of winter) is a sink: 4.6 alive on average, ~2 from year 10 on, empty in 31 of 160 nest-years, and refounded over and over by the other colonies (85 refoundings in all). Its population is mostly recent immigrants and cannot adapt. Body size ends bigger in cold than in hot (+0.091, t 2.6, 6/7 maps), mostly through the temperature-size rule within life; the size gene difference (+0.049, t 2.1) swings sign over the years and rests on 2 adults per cold colony. Lines of conduct: "memory before scent" and "memory before pursue" everywhere; "anticipate before sleep" turns up in cold and toxic colonies.

For local adaptation the habitats must differ in what pays without one being a sink: milder cold, and refounding from the nearest nest rather than the fullest.

### Milder cold, refounding from the nearest colony (2026-10-07)

Cold habitat −3 °C instead of −6; an emptied nest is refounded by the nearest colony able to (`COLONIES.from` 'nearest'), not the fullest. Same 8 maps, 20 years.

| | cold / hot / toxic alive | nest-years empty (cold / hot / toxic) | refounded |
|---|---|---|---|
| before (−6 °C, fullest) | 4.6 / 18.6 / 16.3 | 31 / 2 / 10 of 160 | 85 |
| now (−3 °C, nearest) | 13.6 / 12.1 / 14.3 | 15 / 15 / 16 of 160 | 87 |

- The cold colony is no longer a sink. But every colony now empties about one year in ten (winter crashes) and is refounded from a neighbour: mixing between habitats stays as high as before.
- **Size genes: bigger in the cold than in the heat**, averaged over years 10–20: +0.055 (t 1.8, 6/8 maps); in the first 20-year run +0.016 (t 1.9, 7/8). The direction predicted by the temperature-size rule in 13 of 16 runs, weak and not significant in either alone.
- Muscle and brain evolve as before (muscle up, brain down) in every habitat; no robust difference between habitats.
- Conduct: "dusk before sleep" (go home as the light goes, before anything else) becomes a tradition mostly in cold colonies (line carriers over years 10–20: 93 cold, 7 hot, 12 toxic; first run 16 / 0 / 0), but each time in one map: a hint, not a result.

### Twenty-four maps: is the size difference real? (2026-10-07)

16 new maps (seeds 7508–7523), same settings, 20 years, plus the 8 above. Per map, the mean over years 10–20.

| comparison | difference | t | maps + | sign test p |
|---|---|---|---|---|
| size gene, cold − hot (24 maps) | +0.037 | 1.94 | 15/23 | 0.21 |
| size gene, cold − hot (16 new only) | +0.027 | 1.12 | 9/15 | 0.61 |
| size body, cold − hot (24 maps) | +0.033 | 2.35 | 14/23 | 0.41 |
| muscle, brain, gut, mark: any pair | \|t\| ≤ 2.2 | | | ≥ 0.21 |

Not confirmed. The size genes keep leaning the predicted way (bigger in cold) but the new maps alone do not show it, and with 24 comparisons a t near 2 is what chance gives. Conduct, now counted ant by ant: the same lines everywhere (memory before pursue in 59–69 % of a colony, memory before scent in 37–52 %); "dusk before sleep", the hint of the earlier runs, did not come back.

Two of the 16 new maps died out entirely within 20 years (7513, 7519); every colony empties in about 7 % of its years, and 115 refoundings in 16 maps keep mixing the habitats. What is robust is evolution towards the world all colonies share (muscle up, brain down). Local adaptation needs selection that outweighs mixing: fewer winter crashes, bigger colonies, or both.

### A milder winter does not stop colonies emptying (2026-10-07)

8 maps (seeds 7600–7607), 6 years, trees bearing 10 % or 20 % of their rate in deep winter instead of 2 %; compared with years 1–6 of the 16 maps above.

| deep-winter fruit | alive per nest | nest-years empty | share of deaths by cold | refounded per map |
|---|---|---|---|---|
| 2 % (game) | 14.9 | 6.6 % | 28 % | 7.2 in 20 years |
| 10 % | 14.9 | 8.3 % | 26 % | 1.6 in 6 years |
| 20 % | 15.8 | 6.9 % | 18 % | 1.5 in 6 years |

Winter is not what empties colonies. A colony that empties held 1–5 alive the year before (66 of 69 cases): it had already dwindled. And refounding often fails: 115 refoundings for 69 emptied nest-years, because a pair sent to an empty nest often dies before raising a brood, and the nest is refounded again. The game keeps its winter (a milder one only takes pressure away).

### Refounding with a party instead of a pair (2026-10-08)

`COLONIES.party` (default 2, the pair): adults sent to refound an empty nest. After merging main (individual variation, gait, climate). 8 maps (seeds 7700–7707), 6 years:

| party | alive per nest | nest-years empty | refounded | refoundings per emptied nest |
|---|---|---|---|---|
| 2 | 14.8 | 4.9 % | 8 | 1.14 |
| 4 | 15.0 | 4.9 % | 8 | 1.14 |
| 6 | 15.0 | 3.5 % | 6 | 1.20 |

No difference worth the name: in these six years refounding is rarer than before (8 in 48 map-years) and seldom fails. The game keeps the pair. What drives mixing is not failed refounding but colonies that dwindle to a handful, with 12–19 adults per nest, and are then replaced.
