# World calibration 2: the scarce world without walking in circles

2026-10-10. Pilots only (seeds never used by a study: 500000, 600000, 700000). Profiles: `scripts/profiles/repair.json` (550 s) and `scripts/profiles/intact.json` (570 s). Scripts: `scripts/circles-pilot.js` (single lives), `scripts/lineage-selection.js --profile` (lineages).

## Why

Every study so far (studies 1–3, `scripts/profiles/scarce.json`, `TREE.interval` 575) ran with a movement bug: a moving Fagi spent about 18 % of her moving time walking in loops, mostly at the trunk of a tree she had reached, at a puddle by it, or following a scent to its source. The game fixed it (5ae91a8, then 2f802c4); research kept it off to keep its world. Before publishing, the inheritance results have to hold in a world without it.

## The fixes (all on in both profiles)

- `SOURCES.wait`: hungry under a tree that bears, she waits for its next fruit, rounding the trunk in bouts of her own (walk an arc, stop and look) until her patience runs out.
- `DIZZY.enabled`: turn alternation; a full turn getting nowhere makes her go straight and shun what she was going for for a while.
- `PLUME.arrive`: a scent ends at its source.
- `PHERO.ahead`: pheromone marks are followed only forward.

Loops (8 s windows with a full turn and net way under a quarter of the way walked): 18.4 % of moving time before, 1.4–1.8 % with the fixes, in every cell below.

## Nightly sleep: off

With `SLEEP.nightly` on (a diurnal body that goes home and sleeps at dark, as the game has it), moving the `dusk` line to the end of the program costs nothing at any fruit rate (0 discordant pairs of 48 at 575, 650, 725 s): the body already does what the line did, and the repair the inheritance studies measure cannot show. Both profiles keep it off. The game keeps it on; this is a stated difference between the game and the research world.

Without the circling, a Fagi that kept going round a tree got tired and went home to rest; the fixes remove that accidental rest, so the world is harsher at the same fruit rate (575 s: born 0.54, was 0.75).

## Single lives (no nightly sleep; 48 lives per cell, seeds 600000+)

`born`: born program. `dusk`: the `dusk` line moved last. `learn`: `PROGRAM.learn` with the studies' learner (`judge`, `darkTrials`, `exploreByState`). Pairs: discordant lives (first alive, second dead / the reverse).

| fruit every (s) | born | born, dusk | learn, dusk | learn | damage (born vs born dusk) | repair (learn dusk vs born dusk) | cost (born vs learn) |
|---|---|---|---|---|---|---|---|
| 500 | 0.98 | 0.98 | 0.96 | 0.96 | 0/0 | 1/2 | 2/1 |
| 525 | 0.98 | 0.98 | 0.98 | 0.96 | 0/0 | 0/0 | 1/0 |
| 550 | 0.98 | 0.44 | 0.65 | 0.96 | 26/0 | 11/1 | 1/0 |
| 555 | 0.94 | 0.38 | 0.48 | 0.92 | 27/0 | 5/0 | 3/2 |
| 560 | 0.90 | 0.33 | 0.44 | 0.85 | 27/0 | 6/1 | 5/3 |
| 565 | 0.79 | 0.33 | 0.38 | 0.71 | 22/0 | 3/1 | 8/4 |
| 570 | 0.75 | 0.35 | 0.33 | 0.67 | 19/0 | 1/2 | 10/6 |
| 575 | 0.54 | 0.38 | 0.33 | 0.54 | 8/0 | 0/2 | 8/8 |
| 650 | 0.27 | 0.08 | 0.17 | 0.29 | 9/0 | 5/1 | 2/3 |
| ≥ 725 | 0 | 0 | 0 | 0 | — | — | — |

Replication on other maps (96 lives per cell, seeds 700000+):

| fruit every (s) | born | born, dusk | learn, dusk | learn | damage | repair | cost |
|---|---|---|---|---|---|---|---|
| 550 | 0.93 | 0.48 | 0.56 | 0.91 | 44/1 | 13/5 | 4/2 |
| 560 | 0.88 | 0.45 | 0.53 | 0.89 | 42/1 | 8/0 | 5/6 |
| 570 | 0.70 | 0.44 | 0.46 | 0.69 | 25/0 | 3/1 | 12/11 |

The cliff holds on other maps, a little softer. Where learning repairs the damage (550–560 s) born is near its ceiling; where born is off its ceiling (565–575 s) the repair fades. No single fruit rate shows both, hence two worlds.

## Lineages (8 populations × 16 lives × 6 generations per arm, seeds 500000; survival in generations 3–5)

| world | born | learn | inherit | inherit − learn | learn − born | inherit − born |
|---|---|---|---|---|---|---|
| repair (550 s, dusk moved last) | 0.53 | 0.70 | 0.89 | +19.0 pts, 8/0 populations | +17.2, 8/0 | +36.2, 8/0 |
| intact (570 s) | 0.76 | 0.70 | 0.69 | −0.3, 3/3 | −6.3, 1/7 | −6.5, 1/7 |

- The inheritance result (studies 1–2: inherit − learn +11 with `dusk`) is larger without the circling, not smaller: the loops were masking it.
- With the intact program, learning and inheriting both cost about 6 points against born, as in studies 2–3; here inheriting adds nothing to learning's cost (study 2: it added 3–4 points).
- Single lives at 570 s do not show the cost (12/11) where lineages do (1/7 populations): an effect of about 6 points is within the noise of 96 single lives (± 5 points); the population-level comparison is the one to test.

Population-level spread (sd of the paired difference across populations): inherit − learn in the repair world 0.078; learn − born and inherit − born in the intact world 0.056–0.059. With a one-sided α 0.05 and power 0.8, a cost of half the pilot's size (3 points) needs about 22 populations; 48 give margin for the pilot's effects being overestimated.

## Decision

Two preregistered worlds, one per family of hypotheses:

- `repair.json` (550 s): damage and repair (inheritance vs learning, what inheritance carries, the oracle).
- `intact.json` (570 s): the cost of learning and inheriting with the program intact.

Both profiles also set the learner the studies use (`PROGRAM.judge`, `darkTrials`, `exploreByState`); the arm decides whether she learns.

## Pilots for study 4 (seeds 500000, 8 populations per cell; gens 3–5)

- `dusk` with the designer's repair as a born line (`oracle`), repair world: 0.94, at the intact ceiling (0.93–0.98).
- `shelter` moved last, repair world: born 0.91, learn 0.93, inherit 0.94. The damage costs nothing here; a content test with `shelter` cannot run.
- Evidence gate (`scripts/gate-pilot.js`, `inherit --evidence` in both worlds; 868 intact revisions, 708 `dusk-before-*` repairs, 985 other dusk revisions): no z passes at most 20 % of intact revisions and at least 80 % of repairs. z quartiles: intact 3.44 / 3.83 / 4.83, repairs 3.47 / 3.72 / 4.02. Evidence strength does not tell repairs from errors.
