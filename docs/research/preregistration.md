# Preregistration: reasons, conclusions and evidence in changing worlds

Status: **frozen.** Frozen by the git commit that adds this file, pushed to
GitHub before any run of the main study (`research/designs/main.json`, seeds
1001–1200) or of the game confirmation (seeds 5000–5074). The commit's
timestamp on GitHub is the registration date. It was not registered on OSF;
a registry entry, if made later, will point to this commit and say so.

Everything below was written after the exploratory work in `pilot.md`, which
suggested the hypotheses. No seed used here was used there.

## Question

When learners pass on reasons rather than conclusions, at an equal budget of
items, does their culture adapt better to a changing world, or does it trap
them in false beliefs?

## Confirmatory hypotheses (lab)

Unless stated otherwise: one-trait chemistry (`family: 'one'`), lives of
1800 s, the world inverts at generation 6, three fruit met at once
(`choices: 3`), budget 4. `a − b > 0` is predicted in every test.

| test | hypothesis | outcome | a − b |
|---|---|---|---|
| H1 | reasons teach better in a steady world | harmful bites / ant, gens 1–5 (`stable.harm`) | verdict − rule |
| H2a | at an inversion, reason-lineages have fewer survivors than verdict-lineages | survivors / ant, gen 6 (`shock.alive`) | verdict − rule |
| H2b | … and fewer than lineages that pass nothing on | `shock.alive` | none − rule |
| H3 | reason-lineages carry more myths into the inversion | false unlived beliefs / ant, end of gen 6 (`shock.myths`) | rule − verdict |
| H4a | evidence carries fewer myths than reasons alone | `shock.myths` | rule − evidence |
| H4b | evidence-lineages have more survivors at the inversion | `shock.alive` | evidence − rule |
| H4c | evidence teaches better than verdicts in a steady world | `stable.harm` | verdict − evidence |
| H5a | the H2a gap is larger when the world inverts than when the poison rotates | `shock.alive`, (verdict − rule) at invert − at rotate | |
| H5b | … than when it shifts to another dimension | (verdict − rule) at invert − at shift | |
| H6a | the H2a gap is larger with lives of 1800 s than of 900 s | (verdict − rule) at 1800 − at 900 | |
| H6b | the H3 difference holds with lives of 900 s | `shock.myths` at 900 | rule − verdict |

## Design

- The lab (`research/lab`) at the commit that freezes this file.
- `research/designs/main.json`: format {none, verdict, rule, evidence} ×
  change {none, invert, rotate, shift} × family {one, conj} × life {900,
  1800} = 64 cells; `choices: 3`; everything else at `research/lab/params.js`
  defaults.
- **200 lineages per cell, seeds 1001–1200**, the same seeds in every cell.
  The pilot's smallest confirmatory effect (dz 0.5) needs 29 lineages; 200
  gives 80% power for dz ≈ 0.2 one-sided after correction.

## Analysis

- Exactly `node research/confirm.js research/results/main`, as committed
  with this file. Outcomes are computed per lineage by `research/analyze.js`
  (the lineage is the unit; generation 0 is left out of the steady state).
- Each test: one-sided sign-flip permutation test on the per-seed paired
  differences (10 000 permutations), with the mean difference, its 95%
  bootstrap interval and dz. H5 and H6a use per-seed differences of
  differences.
- Holm correction over the eleven tests, α = .05. A hypothesis is supported
  when its Holm-adjusted p < .05.
- No lineage is excluded. A generation in which everyone died still counts
  (its successor is born untaught).

## What would count against the hypotheses

A difference in the other direction, or a Holm-adjusted p ≥ .05. If H1 holds
and H2a does not, reasons are a free lunch in this model. If H2a holds and H3
does not, the trap is not made of myths. If H6a fails, the lab-to-game
explanation in `pilot.md` (starvation needs time) is wrong.

## Secondary (exploratory, reported as such)

- Every contrast in the conjunctive chemistry (`family: 'conj'`), where a
  one-trait reason is too broad.
- Recovery, meals lost, and the genealogy measures (false lines of belief,
  generations held while false, times passed on).
- All other cells and outcomes of the main design.

## Game confirmation

The same contrasts H1, H2a and H3 in the game itself, two-sided, Holm over
the three, α = .05:

```bash
scripts/batch.js --generations 8 --switch-at 4 --colony 4 --runs 75 --seed 5000 \
  --duration 1800 --set MAPGEN.species=6 --set GEN.genes=0 --set SOCIAL.budget=4 \
  --set GEN.budget=4 --set SOCIAL.topic=food --set SOCIAL.format=F --json F.json
# and the control: --set GEN.culture=0 --set SOCIAL.share=0
node research/embodied.js none=none.json verdict=verdict.json rule=rule.json evidence=evidence.json --confirm
```

75 lineages per format: the pilot's game effect for H2a (dz 0.33) needs about
75 for 80% power. The game differs from the lab in world, change (inversion
at generation 4) and scale; agreement in direction with the lab is what is
tested, and a claim about the model as a whole needs both.
