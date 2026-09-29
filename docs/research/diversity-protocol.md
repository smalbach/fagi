# Protocol: adaptation and diversity across a change of world

Status: **frozen.** Frozen by the git commit that adds this file, pushed to
GitHub before any confirmatory run. The design, the seeds, the outcomes, the
hypotheses and the analysis are the code committed with it
(`research/diversity/`, and `judgment` in `research/organism/life.js`).
Changing any of it after the run means a new protocol, and this one is
reported anyway.

The spec's definition of success (§23) asks that the population "keep enough
diversity to adapt to changes", and its environment (§15) asks for "chemistry
inverted between generations". This protocol measures both with a population
that breeds on its own.

## What is compared

Each population is **4 founders** on a map with 8 wild species, running the
**whole organism as it is today** (`--organism`, in-world breeding `LIFE`
included). It is left alone for **10 800 s**, and the runner creates no one
after the founders.

At **5400 s** the chemistry turns upside down (`invertChemistry`): what fed
now poisons, and the other way round. A founder lives about 5400 s, so by then
the founders are old or dead. The living were born, taught and selected in the
old world.

| condition | the change | genetic diversity |
|---|---|---|
| `stable` | none | yes |
| `shift` | at 5400 s | yes |
| `clonal` | at 5400 s | none: `GEN.mutation = 0` and `GEN.bodyMutation = 0`, so every genome stays the founders' blank one |

## Seeds

- **40 populations per condition.**
- Population *i* uses the stream `24000 + i` and the map `1300000 + 41i`, for i = 0…39.
- None of these seeds or maps was used before.

**The pilot.** The code was piloted on development seeds 5000–5003 (maps
`3 + 13i`), all three conditions. The pilot showed:

- the judgment falls to about 0.25 at the change and ends near 0.8;
- the diversity grows from about 0.16 to 0.22;
- the clonal populations die of poison a little more often after the change.

**The hypotheses and the margin of D2 were written after seeing the pilot.**
They are confirmatory only in that they are tested on seeds nobody has run.

## Outcomes

These are per population (`research/diversity/population.js`):

- `extinct`: 1 if nobody is left, or nobody who can still breed.
- `alive`: how many are alive at the end.
- `judgmentBefore`: the mean judgment of the living adults just before the change, against the old chemistry.
- `judgmentHit`: the same adults with the same beliefs, against the new chemistry.
- `judgmentEnd`: the living adults at the end, against the chemistry of the end.
- `judgmentNew`: of those, the ones born after the change.
- `diversityBefore`, `diversityEnd`: the genetic diversity of the living (`generations.js diversity`).
- `hatchedAfter`: the young born after the change.
- `poisonAfter`: deaths by poison after the change, per individual that lived some of it.
- `deathsAfter`: the deaths after the change, by cause.
- `generations`.

The judgment is `life.js judgment`: over the map's species, would she eat each one (rules, aversion), balanced over the poisonous species and the rest.

## Hypotheses

One-sided paired sign-flip permutation tests (10 000 permutations) of (a + shift) − b > 0 over populations; Holm over the four, α = .05. A population with no adults to judge drops out of the judgment tests.

| id | prediction | a | b | shift |
|---|---|---|---|---|
| D1 | after the change the population comes to judge the new world better than the change left it | shift.judgmentEnd | shift.judgmentHit | 0 |
| D2 | and ends within 0.1 of a population that never saw the change (non-inferiority) | shift.judgmentEnd | stable.judgmentEnd | 0.1 |
| D3 | it comes out of the change with more genetic diversity than it went in with | shift.diversityEnd | shift.diversityBefore | 0 |
| D4 | without genetic diversity, more of them die of poison after the change | clonal.poisonAfter | shift.poisonAfter | 0 |

- D1 and D2 say the population adapts.
- D3 says it keeps its diversity through the change.
- D4 says that diversity is what helps it adapt.

Everything else is exploratory and reported as description.

## Commands

```bash
node research/diversity/run.js --jobs 16
node research/diversity/analyze.js
```

The results go to `research/results/diversity/`: the raw pieces in `parts/`, and `report.md`.
