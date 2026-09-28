# Preregistration (draft): reasons, conclusions and evidence in changing worlds

Status: **draft, not yet registered.** To be frozen (OSF) before the main
study runs. Everything below was written after the pilot (`pilot.md`), which
suggested the hypotheses; the main study uses seeds the pilot never used.

## Question

When learners pass on reasons rather than conclusions, at an equal budget,
does their culture adapt better to a changing world, or does it trap them in
false beliefs?

## Hypotheses (confirmatory)

Stated for the one-trait chemistry (`family: 'one'`), change at generation 6.

- **H1 — reasons teach better in a steady world.** Harmful bites per ant over
  generations 1–5: `rule` < `verdict`.
- **H2 — reasons are a trap when the world inverts.** Survivors per ant in
  the generation of an inversion: `rule` < `verdict`, and `rule` < `none`.
- **H3 — the trap is made of myths.** False unlived beliefs per ant at the
  end of the inversion generation: `rule` > `verdict`.
- **H4 — evidence cushions the trap.** At the inversion: myths `evidence` <
  `rule`, survivors `evidence` > `rule`; and in the steady state harmful bites
  `evidence` < `verdict`.
- **H5 — the trap needs the old reason to point the wrong way.** The H2
  difference (`verdict` − `rule` in survivors) is larger under `invert` than
  under `rotate` and under `shift` (difference of paired differences).
- **H6 — the trap kills by starvation, so it needs time.** The H2 difference
  is larger with lives of 1800 s than of 900 s (difference of paired
  differences), while the H3 difference (myths) holds at both.

## Secondary (exploratory, reported as such)

- The same contrasts in the conjunctive chemistry (`family: 'conj'`), where a
  one-trait reason is too broad.
- Recovery (generations to steady-state accuracy), meals lost, and the
  genealogy measures (false lines of belief, generations held while false,
  times passed on).
- Founders' theory (`correct`, `partial`, `false`) in the conjunctive chemistry.

## Design

- Lab (`research/lab`), commit to be fixed at registration.
- Factors: format {none, verdict, rule, evidence} × change {none, invert,
  rotate, shift} × family {one, conj} × life {900, 1800}: 64 cells.
  Everything with `choices: 3` (several fruit met at once, as in the game).
- Everything else at the lab's defaults (`research/lab/params.js`), budget 4.
- **200 lineages per cell**, seeds 1001–1200, the same seeds in every cell.
  The pilot's smallest confirmatory effect (dz 0.54) needs 29; 200 gives 80%
  power for dz ≈ 0.2.

## Outcomes and analysis

- Unit: the lineage. Outcomes as defined in `research/analyze.js`
  (`stable.harm`, `shock.alive`, `shock.myths`), computed per lineage.
- Each hypothesis is a one-sided paired comparison across seeds: the
  sign-flip permutation test (10 000 permutations) on the per-seed
  differences, with its mean difference, 95% bootstrap interval and dz.
- H5: the permutation test on per-seed differences of differences.
- H1–H5 are tested at life 1800; H6 compares 1800 with 900.
- Holm correction over the confirmatory family (H1, H2 ×2, H3, H4 ×3, H5 ×2,
  H6 ×2: 11 tests), α = .05.
- No lineage is excluded. A generation where everyone died still counts (its
  successor is untaught).

## What would count against each hypothesis

A difference in the other direction, or an interval that includes zero after
correction. A null result for H2 with H1 confirmed would mean reasons are a
free lunch in this model; a null H3 with H2 confirmed would mean the trap is
not made of myths and needs another explanation.

## Validation outside the lab

The same contrasts in the game itself (`scripts/batch.js --generations`,
with `SOCIAL.format`, the budgets and `SOCIAL.topic=food`), on fewer
lineages. The pilot's check in the game (`pilot.md`) replicated H1 and H3
and not H2: false beliefs survive the change there too, but they do not
kill. H2 is therefore stated for the lab only, and the main study adds the
cost of a refused meal (how scarce food is) as a factor to explain when the
trap turns lethal. Agreement in direction is required before any claim is
made about the model as a whole.
