# Protocol: evaluation of the organism (baselines and ablations)

Status: **frozen.** Frozen by the git commit that adds this file, pushed to
GitHub before any confirmatory run. The design, the seeds, the outcomes, the
hypotheses and the analysis are the code committed with it
(`research/organism/`): changing any of it after the run means a new protocol,
and the old one is reported anyway.

This is phase 7 of `docs/ESPECIFICACION_ENTE_ADAPTATIVO.md` (§18): which parts
of the organism earn their place, against baselines and one part removed at a
time. The exploratory measurements behind the predictions are in that
document's §25; none of the seeds below was used there.

## What is compared

Every condition is the whole organism (`--organism`: day and night, body
temperature, sex, sleep and consolidation, experiments, appetite, perception,
night mind, life cycle), 6 wild species with the default chemistry, a life of
2400 s (about 13 days), one map per life. `research/organism/design.js` lists
each condition's settings.

| condition | what changes |
|---|---|
| `full` | nothing: Fagi as she is |
| `random` | baseline: walks to random points, learns nothing (`BASELINE.policy = 'random'`, `BASELINE.learn = 0`); still drinks and eats what she touches |
| `fixed` | baseline: her instinct hierarchy, learns nothing (`BASELINE.learn = 0`) |
| `noSleep` | no sleep at all |
| `noConsolidation` | she sleeps but sorts nothing (so no agenda and no night mind either) |
| `noReplay` | the night sorts the day but does not rehearse |
| `noNightMind` | no night mind |
| `noCuriosity` | no curiosity bonus, no experiments |
| `noForgetting` | memory confidence never decays |
| `noEpisodic` | no log of experiences (what consolidation and the night mind read) |
| `noTraits` | no learning by traits: every fruit on its own |
| `noAppetite` | no handling time, malaise or aversion, no thirst-driven search |
| `noPercept` | she tells fruit apart by what they are, not by what she perceives |
| `noThermalSwing` | the air's temperature does not swing between day and night |

Two worlds: `stable`, and `shift`, where at 1200 s the chemistry turns upside
down (what poisoned now feeds and the other way round; the same fruit).

Populations (§18.4): 4 founders left alone for 5400 s, whole organism;
`full`, `noCulture` (`GEN.culture = 0`), `noSocial` (no sharing, no watching),
`fixed` (no learning).

## Seeds

- Lives: **120 per condition and world**, life *i* with Fagi's stream
  `9000 + i` and map `200000 + 17i`, i = 0…119, the same in every condition.
- Populations: **12 per condition**, population *i* with stream `9500 + i` and
  map `200000 + 17(1000 + i)`.
- None was used before this file was committed (development used lives
  1000–1047 and 5000–5047 and maps `1 + 13i`). A harness check run before the
  freeze that touched lives 9000–9001 was deleted unread and the harness got an
  `--offset` for checks.

## Outcomes (per life, `research/organism/life.js`)

`lifetime` (seconds lived), `alive` (at the end), `safe` (share of her life
with hunger and thirst under critical), `stressed` (seconds with thermal
stress), `dose` (poison taken, in whole fruit; a trial bite counts its
portion), `firstHarm` (harmful kinds met by mouth), `repeated` (whole harmful
bites of a kind already bitten), `judgment` (her rules plus her aversion over
the 96 looks of the catalogue, at the end, against the chemistry of the end:
would she eat it; balanced accuracy over poison and the rest), `helpful`
(share of the map's helpful kinds she found), and in the `shift` world
`postDose` and `postRate` (poison after the shift, in total and per second she
lived after it).

Populations (`research/organism/population.js`): alive at the end, extinct
(none left, or none left that could breed: no non-senescent female or male),
generations, hatched, egg inbreeding, genetic diversity, adults' judgment,
share of deaths of old age.

## Confirmatory hypotheses

One-sided, `a − b > 0` predicted in every test, paired by seed.

| test | prediction | world | outcome | a − b |
|---|---|---|---|---|
| H1 | she lives longer than a random walker | stable | lifetime | full − random |
| H2 | she judges fruit she never tasted better than a random walker | stable | judgment | full − random |
| H3 | learning lowers the poison she takes, against her instinct alone | stable | dose | fixed − full |
| H4 | learning improves how she judges fruit she never tasted | stable | judgment | full − fixed |
| H5 | sorting the day at night improves that judgment | stable | judgment | full − noConsolidation |
| H6 | appetite lowers the poison she takes | stable | dose | noAppetite − full |
| H7 | after the world turns over, she judges by the new world better than her instinct alone | shift | judgment | full − fixed |

H1, H2, H4 and H7 are sanity checks against baselines and are expected to hold
easily; H3, H5 and H6 are the substantive ones. `dose` is biased by survival
(one who dies early takes less poison), and in H3 and H6 the condition predicted
to take more poison is also the one expected to die sooner, so the bias works
against the prediction: a supported H3 or H6 is conservative.

## Analysis

Exactly `node research/organism/analyze.js research/results/organism`, as
committed with this file, after `node research/organism/run.js --jobs 16`.

- Each test: one-sided sign-flip permutation test on the per-seed paired
  differences (10 000 permutations), with the mean difference, its 95%
  bootstrap interval and dz (`research/stats.js`).
- Holm correction over the seven tests, α = .05. A hypothesis is supported when
  its Holm-adjusted p < .05.
- No life or population is excluded. A life that ends early counts with what
  it did; its judgment is what she believed when she died.
- Everything else in the report (every ablation, both worlds, the populations)
  is exploratory and descriptive: means and paired differences with `full`,
  with bootstrap intervals, not corrected and not to be read as confirmed.

## What will be reported

The full report `research/results/organism/report.md` and the raw pieces, as
they come out, including every hypothesis that is not supported and every
ablation that makes no difference. An ablation that makes no difference is
evidence that the part does not earn its place in this world (§18.2), and is
written down as such.
