# Protocol: explore or come back

Status: **draft, not frozen.** It will be frozen by the git commit that marks
it frozen, pushed to GitHub before any confirmatory run. The design, the seeds,
the outcomes, the hypotheses and the analysis are the code committed with it
(`research/forage/`). Changing any of it after the run means a new protocol,
and this one is reported anyway.

Phase 9 of the spec (§12.11) asks whether each Fagi learns, from her own
experience, when to go back to the last place she found food and when to
explore, and whether that makes sisters differ. The phases A to E built it
(§25.1); their exploratory measurements are §25.21–§25.23. This protocol
tests it on seeds nobody has run.

## The world

Every condition is a colony of **5 sisters** on a map with **6 wild species**,
running the whole organism (`--organism`) with the game's own numbers
(`app/organism-on.js`: `ENERGY.drain` 0.6, `SLEEP.nightly` 1, `CONCEPT` off,
`PHERO.life` 60), for **2400 s**, without breeding (`LIFE` off). The runner
creates no one and decides nothing.

The world is the scarce one of §25.23, where the choice first started to
matter:

- `FORAGE`: 30 % of trees bear all year; the rest drop crops of 6 fruits and
  rest 400 s; a ground patch every 200 s;
- `SITES`, `CHOICE` (learned, `policy` 0) and `LARDER` on, the nest holding
  **12** rations.

## What is compared

| condition | what changes |
|---|---|
| `learn` | nothing: the learned choice |
| `back` | fixed policy: always back to her best site (`CHOICE.policy` 1) |
| `explore` | fixed policy: always explore (`CHOICE.policy` 2) |
| `same` | no innate difference in the noise of choosing (`CHOICE.temperSpread` 0) |
| `durable` | every tree bears all year, no ground patches |
| `ephemeral` | every tree has seasons (crops of 4, rests of 900 s), a patch every 60 s |
| `shift` | `durable` until 1200 s, then `ephemeral`: every tree gets seasons |
| `nosites` | ablation: one remembered tree and the fixed hierarchy (`SITES`, `CHOICE` off) |
| `noprediction` | ablation: the pantry as last seen (`LARDER.learn` 0) |
| `nopheromone` | ablation: no trail (`PHERO.every` 10⁹) |

## Seeds

- **120 colonies per condition.**
- Colony *i* uses the stream `26000 + i` and the map `1400000 + 43i`, for i = 0…119.
- None of these seeds or maps was used before.

## The pilot

The code was piloted on development seeds (`--offset 900000`, 24 colonies per
condition). The pilot found and fixed an artefact: two sisters with opposite
beliefs carried the same ration in and out of a full nest ~1170 times a life.
Refuse carried out now smells of the refuse heap and nobody hauls it home
again (spec §25.24). On the corrected code the pilot showed:

- learning ate more than always going back (+2.0 meals) and a little more
  than always exploring (+0.9, uncertain);
- ephemeral sources made her explore more than lasting ones (+0.04);
  after a lasting world turned ephemeral, a little more than in one that
  stayed lasting (+0.03, uncertain);
- **within a colony, her first experiences did not predict how much she
  explored later** (r ≈ 0); her innate noise did (r = 0.21). The r ≈ 0.4
  of §25.22 pooled colonies on different maps;
- after finding the nest full of good food she took ~1000 s to fetch for
  home again, against ~170 s after storing.

**The hypotheses were written after seeing the pilot.** They are
confirmatory only in that they are tested on seeds nobody has run. F3 is
kept as the phase's central question although the pilot suggests it will not
hold.

## Outcomes

Per sister (`research/forage/colony.js`); a colony's outcome is the mean over
its sisters.

- `eaten`, `stored`, `perMin` (both per minute alive), `alive`, `lived`, `cause`.
- `plans`: how many times she chose; `exploreShare`: the share that were
  "explore"; `shareBefore`, `shareAfter`: the same before and after 1200 s.
- `early`: of her first 5 resolved decisions (bringing food home excluded),
  explorations that found food minus explorations that found nothing.
- `laterShare`: `exploreShare` of the plans she made after her 5th resolved
  decision.
- `innate`: her innate noise.
- `fullGood`: times she came home loaded to a nest full of good food;
  `gapAfterFull`: mean seconds from that to her next pick for home;
  `gapAfterStore`: the same from storing.
- Per colony: `spoiled`, the rations lost in the nest.

## Hypotheses

Paired: one-sided sign-flip permutation tests (10 000 permutations) of
(a + shift) − b > 0 over colonies. Within-colony (F3): the correlation of x
and y across sisters, each centered on her colony's mean, with a one-sided
permutation test that shuffles y among the sisters of each colony (10 000).
Holm over the six, α = .05.

| id | prediction | a | b |
|---|---|---|---|
| F1a | learning when to go back or explore, a sister eats more than always going back to her best site | learn.eaten | back.eaten |
| F1b | and more than always exploring | learn.eaten | explore.eaten |
| F2a | where food sources are ephemeral she explores more than where they last | ephemeral.exploreShare | durable.exploreShare |
| F2b | when a lasting world turns ephemeral, she then explores more than in a world that stayed lasting | shift.shareAfter | durable.shareAfter |
| F3 | sisters born with the same noise, on the same map: the one whose first searches paid explores more afterwards | same: early | same: laterShare (within colony) |
| F4 | after finding the nest full of good food she takes longer to fetch for home again than after storing | learn.gapAfterFull | learn.gapAfterStore |

- F1 says the learned choice pays.
- F2 says it follows the world.
- F3 says experience, not the genome nor innate noise, makes sisters differ.
- F4 says the full nest changes what she does next.

Everything else (the ablations, `perMin`, survival, individuality in `learn`)
is exploratory and reported as description.

## Commands

```bash
node research/forage/run.js --jobs 16
node research/forage/analyze.js
```

The results go to `research/results/forage/`: the raw pieces in `parts/`, and `report.md`.
