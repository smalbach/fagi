# One-trial learning from an acute crisis

**Project:** `first-agi` / Fagi
**Module:** `src/program/crisis.js` (`PROGRAM.crisis`, off by default)
**Status:** implemented; **no adaptive benefit found**. Exploratory, not preregistered.
**Revised:** 2026-10-07. This replaces an earlier version of this page (see *Correction* at the end).

## Question

`program/learn.js` needs several trials on each side of a pair before it moves
a line, and a whole life may not hold enough. An animal does not wait for a
second near-death to change what it does. Can one acute crisis, lived, write a
useful line?

## What the code does

Everything in the line comes from what she lived; there is no table of
situations and answers.

- **Onset.** Her distress (the `program/watch.js` measure, read as a share of
  the top) crosses `crisisThreshold` (0.6) and has risen by at least
  `crisisRise` (0.15) over the last 20 s.
- **Culprit.** The root that led most over those 20 s. Never a `survive` line.
- **Episode.** From the onset until distress falls back under the threshold
  (at most 90 s). For each root that leads, it counts seconds and how much
  distress fell meanwhile.
- **Reliever.** The root under which distress fell most, if it fell, that led
  at least 2 s and is not the culprit.
- **Line.** The reliever's behavior put in front of the culprit, under one
  clause describing the onset: a flag that was on (`dark`, `raining`,
  `pressureFalling`), otherwise the need that hurt most at its step. Nothing is
  written if the reliever already stands first or the clause cannot be stated.
- **Judged.** At her next crisis that meets the clause, the line is retired if
  its behavior led and distress did not fall, or if the crisis came on again
  with the culprit leading.

`crisis()` is called from `watch()` only when `PROGRAM.learn` is also on.

A written line is **data in the program grammar** (`src/program.js`), for
example:

```text
line('rest-before-probe-energyBelow45', {"tier":"endure","if":{"energyBelow":0.45},
  "do":"rest","from":"rest","over":"probe","source":"self",
  "why":"crisis at 0.603: distress fell 0.172 in 3 s under rest, came on under probe"})
```

It reorders her born behaviors under one condition. It is not generated
JavaScript, and it cannot create a behavior she was not born with.

## Results (2026-10-07, code at 2a3823e)

All runs are paired by seed. "Harsh world" is the one in
`scripts/crisis-check.js`: 140 s day, mean 17 °C, swing 14 °C, rain every 45 s,
`ENERGY.drain` 0.8. "Sabotage" moves her born `rest` and `sleep` lines to the
end of her program, so that there is something to repair.

### How often it writes, and whether the line acts

| Run | Lives | Lives with a crisis line | Seconds the line governed | Lives where an action changed |
|---|---:|---:|---:|---:|
| `crisis-check.js`, harsh, 1200 s | 12 | 1 (retired later) | 1.9 per life | — |
| `crisis-check.js`, mild, 1200 s | 12 | 0 | 0 | 0 |
| `crisis-check.js`, harsh + sabotage, 1200 s | 12 | 3 | 1.3 per life | 0 (all outcomes identical) |
| `demo-counterfactual.js`, harsh, 1200 s | 12 | 0 | 0 | 0 |
| `demo-counterfactual.js`, harsh + sabotage | 12 | 4 | 1–15 per life | **0** |

In the twin-life demo the line does govern some decisions, but in every frame
it chose the same action her twin without crisis learning chose. The lines it
writes put `rest` or `sleep` in front of something (`probe`, `dusk`) that was
not going to act at that moment, so they relabel decisions without changing
any.

### Survival

| Run | Born | Learning | Learning + crisis |
|---|---:|---:|---:|
| `run-adaptation-experiment.js` (harsh, 600 s, 10 seeds) | 10/10 | — | 9/10 (one cold death), 2/10 wrote a line |
| Harsh, 600 s, 40 seeds (crisis alone / with learning) | 39/40 | 40/40 | 39/40 / 39/40 |
| Scarce world (`profiles/scarce.json`, 7200 s, 64 seeds 9100–9163), learning = `judge` 1 + `darkTrials` 1 + `exploreByState` 1 | 44/64 | 40/64 | 40/64 (identical to learning) |
| Same, crisis with `crisisThreshold` 0.45, `crisisRise` 0.1 | 44/64 | — | 44/64 (identical to born) |

In the scarce world, turning `PROGRAM.crisis` on changed no life at all: the
batch fingerprints are identical.

## Interpretation

- The mechanism runs and is correctly reversible (its lines get judged and
  retired), and it writes nothing in a mild world, as designed.
- It writes rarely (about 0.1–0.3 lines per life in the harsh world), and the
  lines it writes have not changed a single action in any run so far.
- There is **no evidence of adaptive benefit**. The one survival difference in
  `run-adaptation-experiment.js` goes the other way and is a single life.
- The likely cause is the same one found for `program/learn.js` (see
  `world-calibration.md` and the order screen): in these worlds the born order
  is already where it should be, so a reliever is usually a behavior that
  would have acted anyway. A test needs a world where the born order is wrong
  without sabotage.

Passing unit tests (`test/crisis-plasticity.test.js`) establishes that the code
does what this page says, not that it helps her.

## Inheritance

Eggs carry born lines (or, with `PROGRAM.inherit`, the behavioral genome of
experience-backed revisions). Crisis lines do not enter the genome merely
because they were written into the live program.

## Reproduce

```bash
node scripts/crisis-check.js
node scripts/demo-counterfactual.js --sabotage
node scripts/demo-proof.js --sabotage
node scripts/run-adaptation-experiment.js
node scripts/batch.js --organism --profile scripts/profiles/scarce.json --runs 64 --duration 7200 --seed 9100 --world-varies --jobs 6 --set PROGRAM.watch=1 --set PROGRAM.learn=1 --set PROGRAM.judge=1 --set PROGRAM.darkTrials=1 --set PROGRAM.exploreByState=1 --set PROGRAM.crisis=1
```

## Correction

An earlier version of this page described a *template* mechanism (fixed
situations, each with a predefined protective behavior, reasons such as
"acute crisis: freezing darkness during hunt") and reported 10/10 lives
writing lines at a mean of 109.8 s with 100 % survival. That mechanism is not
in the code, and those numbers do not reproduce: the same script on the
current code gives 2/10 lives writing a line and one cold death among the
learners. The earlier `demo-proof.js` and `demo-counterfactual.js` printed
fixed conclusions ("death", "flees to the tree") instead of measured ones; in
the counterfactual both arms actually chose `explore`. Both demos now print
only what they measure.
