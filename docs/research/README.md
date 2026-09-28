# Research: reasons against conclusions

The question (see `reports/Razones frente a conclusiones culturales.md` for
the literature behind it):

> When learners pass on **reasons** ("sour things made me sick") rather than
> **conclusions** ("don't eat the red drop"), does their culture adapt better
> to a world that changes, or does it get more trapped in false beliefs?

Nobody has answered it with a controlled manipulation of what is passed on at
an equal budget, measuring both adaptation after a change and the persistence
of false beliefs. Fagi can, because every belief records where it came from
and every run is deterministic.

## The pieces

| piece | where | what |
|---|---|---|
| Chemistry families and changes | `src/chemistry.js` | `createChemistry(rnd, { family, dim })`: `'smell'` (the game's), `'one'` (one trait on any dimension), `'conj'` (poison needs a color AND a smell). `changeChemistry(chem, kind)`: `invert`, `rotate` (the poison moves within its dimension), `shift` (to another dimension). |
| Transmission formats | `src/social.js` `pass()` | `SOCIAL.format`: `rule` (reasons, the game's default), `verdict` (per-fruit conclusions about fruit the teller has met), `evidence` (reasons plus the bites behind them). `SOCIAL.budget` / `GEN.budget` cap the items passed at once. Every copy keeps its `origin`. |
| Checking unlived rules | `src/learned/synth.js` `checkTold()` | A trait rule she was told dies when more of the fruit it covers that she tastes go against it than for it. Before this, a multi-trait rule she was told could never die. |
| The lab | `research/lab/` | Fagi without the map: one fruit at a time, decided, felt and passed on by the game's own code. About 20 lineages of 12 generations per second on 4 cores. |
| Baselines | `research/lab/agents.js` | `ideal` (Bayesian observer knowing the family of chemistries, with a change hazard), `random`, `oracle`. |
| Initial theories | `research/lab/theory.js` | What the founders are taught: `none`, `correct`, `partial`, `false`, `irrelevant`. |
| Ground truth | `research/lab/truth.js` | Balanced accuracy over the whole catalogue (fruit never met included), false rules, myths (false and unlived). |
| Runner | `research/run.js` | A design (JSON) × seeds, in parallel, resumable, same seeds in every cell. |
| Analysis | `research/analyze.js`, `research/stats.js` | Lineage-level outcomes, bootstrap intervals, paired sign-flip permutation tests, Holm correction, effect sizes (dz) and lineages needed for 80% power. |
| Sensitivity | `research/sensitivity.js` | Latin-hypercube designs over the hand-tuned parameters: does an effect keep its sign, and what does it depend on. |

## Running

```bash
node research/run.js --design research/designs/pilot.json            # → research/results/pilot
node research/analyze.js research/results/pilot --compare format     # → summary.md
node research/run.js --design research/designs/sensitivity.json
node research/sensitivity.js research/results/sensitivity --a verdict --b rule
```

Raw rows are not versioned (`.gitignore`); `manifest.json` records the design,
the seeds and the commit, which is enough to regenerate them exactly.

## The unit of analysis

A lineage. Rows of one lineage are never treated as independent. Cells share
seeds, so each lineage in one cell has a twin in every other cell living in
the same worlds (the same chemistries, catalogue and maps). Comparisons are
paired on those twins.

## Validity notes

- **The lab is not the game.** It drops space, water, the nest and the pantry.
  What it keeps is everything that learns and everything that is passed on.
  Its results are checked against the game (`scripts/batch.js --generations`,
  which now honours `SOCIAL.format` and the budgets).
- **The formats are matched by items, not by bits.** A rule about one trait
  and a verdict about one fruit each cost one item. Matching by symbols or by
  information about the chemistry is still to do.
- **A verdict only covers fruit the teller has met.** That is the point of a
  conclusion, and it is also why conclusions generalize less.
- **The pilot shaped the hypotheses.** Confirmatory tests must use fresh seeds
  and the analysis fixed in advance (`preregistration-draft.md`).
