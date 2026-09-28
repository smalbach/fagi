# Protocol: follow-up evaluation of the organism

Status: **frozen.** Frozen by the git commit that adds this file, pushed to
GitHub before any confirmatory run. The design, the seeds, the outcomes, the
hypotheses and the analysis are the code committed with it
(`research/organism2/`, and `runLife` in `research/organism/life.js`).
Changing any of it after the run means a new protocol, and this one is
reported anyway.

The first evaluation (`docs/research/organism-protocol.md`, spec §25.9) left
three findings as exploratory. This protocol predicts them:

- the night's interleaved replay made her judgment worse;
- consolidating made her slower to adapt to a world that turned over;
- removing episodic memory was the same as removing consolidation.

The first two were seen again with the organism as it is now, in development
lives 5000–5047 on maps `3 + 13i` (spec §25.13). The third was separated in
the code: the night's "what did I see and never taste" questions no longer
need episodes (`SLEEP.askAlways`).

## What is compared

Every condition is the **whole organism as it is today**: `--organism` with
every piece on, things and concepts included. There are 6 wild species, a
life lasts 2400 s, and each life has its own map.

| condition | what changes |
|---|---|
| `full` | nothing |
| `noReplay` | `SLEEP.replay = 0`: the night sorts the day but does not rehearse the remembered fruit |
| `noConsolidation` | `SLEEP.consolidate = 0`: she sleeps but sorts nothing, and asks nothing |
| `noEpisodic` | `EXPLAIN.log = 0`: no log of what she lived. The night has no episodes to sort, but still asks about fruit she saw and never tasted |

There are two worlds, as in the first evaluation:

- **stable**: the chemistry never changes.
- **shift**: at 1200 s the chemistry turns upside down.

## Seeds

- **120 lives per condition and world.**
- Life *i* uses Fagi's stream `18000 + i` and the map `800000 + 31i`, for i = 0…119.
- None of these seeds or maps was used before.
- The harness was checked with `--offset 50000`, away from them.

## Outcomes

These are the per-life outcomes of the first evaluation (`research/organism/life.js`):

- `lifetime`
- `alive`
- `safe`
- `stressed`
- `dose`
- `firstHarm`
- `repeated`
- `judgment`: her rules plus her aversion, over the 96 looks of the catalogue, at the end, against the chemistry of the end.
- `helpful`: the share of the map's helpful kinds she found.
- `postDose` and `postRate`: in the shift world only.

## Confirmatory hypotheses

All four are one-sided and paired by life; each predicts `a − b > 0`. Holm's correction applies over the four, with α = .05.

| test | prediction | world | outcome | a − b |
|---|---|---|---|---|
| F1 | rehearsing the remembered fruit at night makes her judge untasted fruit worse | stable | judgment | noReplay − full |
| F2 | and it does so again after the world turns over | shift | judgment | noReplay − full |
| F3 | sorting the day at night makes her slower to judge by a world that turned over | shift | judgment | noConsolidation − full |
| F4 | without episodic memory the night still asks what to try, and she finds more of the good fruit than without the night at all | stable | helpful | noEpisodic − noConsolidation |

If F1 and F2 are supported, replay is turned off by default
(`SLEEP.replay = 0`), and the spec says so. The code and the results of
this protocol stay as they are.

## Analysis

The analysis is exactly `node research/organism2/analyze.js research/results/organism2`,
as committed with this file, run after `node research/organism2/run.js --jobs 16`.
The method is that of the first evaluation:

- **The tests:** one-sided sign-flip permutation tests with 10 000 permutations, a 95% bootstrap interval of the mean difference, and dz.
- **Correction:** Holm, α = .05.
- **Exclusions:** none.
- **Exploratory:** everything else in the report is descriptive.

## What will be reported

The full report `research/results/organism2/report.md` and the raw pieces,
including any hypothesis that is not supported.
