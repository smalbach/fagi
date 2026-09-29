# Protocol: social learning with a misinformed sister

Status: **frozen.** Frozen by the git commit that adds this file, pushed to
GitHub before any confirmatory run. The design, the seeds, the outcomes, the
hypotheses and the analysis are the code committed with it
(`research/social/`, and `judgment` in `research/organism/life.js`).
Changing any of it after the run means a new protocol, and this one is
reported anyway.

The spec's definition of success (§23) asks that Fagi "use social
information without systematically adopting false information", and its
environment (§15) asks for "other agents with incomplete or incorrect
information". Sisters already tell each other their rules in the nest and
learn by watching each other eat (`src/social.js`), and nothing checks
whether what is told is true: a told rule becomes hers when she lives it, or
dies when what she tastes goes against it. This protocol measures whether
that is enough when one sister is wrong about almost everything.

## What is compared

A colony of **5 sisters** on a map with 8 wild species, the **whole organism
as it is today** (`--organism`, every piece on), for **2400 s**. There is no
breeding (`LIFE.enabled = 0`): the colony is the five it started with.

Sister #1 is the **informant**. Before the colony, she lives a whole life
alone (2400 s) on the same map, and what she comes to believe there goes with
her into the colony as her own:

- her live rules,
- what each trait meant to her,
- and her memory of the fruit she tasted.

Only beliefs go. Places, trails and things she met point at another world.

| informant | her first life |
|---|---|
| `none` | none: she is as naive as the rest |
| `true` | the map's own chemistry |
| `false` | the map's chemistry turned upside down (`invertChemistry`): what nourishes there poisons here, and the other way round |

Sisters #2–#5 are the **naive sisters**. They are born the same, on the same
map, in the three conditions. Everything measured is about them.

## Seeds

- **120 colonies per condition.**
- Colony *i* uses the stream `22000 + i` and the map `1100000 + 37i`, for i = 0…119.
- None of these seeds or maps was used before.
- The pipeline was piloted on development seeds (5000–5008, maps `3 + 13i`), and the harness checked with `--offset 50000`, away from them.

## Outcomes

Per colony, the mean over the naive sisters (`research/social/colony.js`):

- `dose`: poison taken, in whole fruit. A trial bite counts its portion, and a look-alike counts as what it is.
- `judgment`: at the end, or at death, would she eat each species of the map. This is `life.js` `judgment`, balanced over the poisonous species and the rest.
- `alive`, `lifetime`.
- `adopted`: rules she adopted whose origin is the informant, told by her or by a sister who had them from her.
- `adoptedFalse`: of those, the ones that were false on this map when adopted.
- `standingFalse`: of those, the ones still hers, live and still false, at the end.
- `falseShare`: pooled over the colony, `standingFalse / adoptedFalse`. It is null when the colony adopted no false rule from her.
- `myths`: her live eating rules that are false at the end, whatever their origin.

A rule about eating is **false on the map** when most of the species it covers make it wrong:

- an `avoid` is false when most of what it covers is not poison;
- a `prefer` is false when most of what it covers is poison.

A rule that covers no species of the map, or is not about eating, is neither false nor true.

## Hypotheses

Each hypothesis is a one-sided paired sign-flip permutation test (10 000 permutations) of (a + shift) − b > 0, with Holm over the three, α = .05.

| id | prediction | a | b | outcome | shift |
|---|---|---|---|---|---|
| S1 | a sister who knows the map makes the naive sisters take less poison | none | true | dose | 0 |
| S2 | a misinformed sister does not make the naive sisters judge the map more than 0.05 worse (non-inferiority) | false | none | judgment | 0.05 |
| S3 | of the false rules they adopt from her, fewer than half still stand at the end | 0.5 | false | falseShare | 0 |

- S1 says social information is used.
- S2 and S3 together say it is not adopted systematically when it is false.

S3 uses the colonies where some false rule was adopted.

Everything else is exploratory and reported as description: every outcome for every informant against `none`, what the informant brought, and the causes of death.

## Commands

```bash
node research/social/run.js --jobs 16
node research/social/analyze.js
```

The results go to `research/results/social/`: the raw pieces in `parts/`, and `report.md`.
