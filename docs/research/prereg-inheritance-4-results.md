# Results: inheritance in the world without walking in circles (study 4)

Preregistration: docs/research/prereg-inheritance-4.md (commit 7fd04e4, pushed to main as 44e4641 before any run). Run 2026-10-10 from a clean checkout of 44e4641; 432 runs, 48 populations per cell, seeds 400000+. Raw lives: research/prereg-inheritance-4/; full analysis output: research/prereg-inheritance-4/analysis.txt (`scripts/lineage-analysis4.js`, unchanged). No deviation from the plan.

## Survival, generations 3–5

| world | born | learn | inherit | inheritStrip | oracle |
|---|---|---|---|---|---|
| repair (550 s), `dusk` moved last | 0.501 | 0.662 | **0.883** | 0.674 | 0.935 |
| repair (550 s), intact (ceiling) | 0.935 | | | | |
| intact (570 s) | 0.727 | 0.682 | 0.676 | | |

Inheriting daughters reached 0.88 within two generations (gen 0 0.63, gen 1 0.81, gen 2 0.85) and stayed there; 99.7 % of them carried a `dusk-before-*` line.

## Hypotheses

| | hypothesis | difference | populations ahead/behind | p | verdict |
|---|---|---|---|---|---|
| R1 | `dusk`: inherit > learn | +0.220 | 48/0 | < 0.0001 | **supported** |
| C1 | `dusk`: inherit > inheritStrip | +0.209 | 48/0 | < 0.0001 | **supported** |
| C3 | `dusk` oracle not worse than intact born by 0.05 | 0.000 | 0/0 | < 0.0001 | supported (degenerate, see below) |
| N1 | intact: born > learn | +0.046 | 33/12 | < 0.0001 | **supported** |
| N2 | intact: born > inherit | +0.052 | 33/10 | 0.0001 | **supported** |
| N3 | intact: inherit not worse than learn by 0.03 | −0.006 | 16/22 | 0.007 | **supported** |

Holm over R1 and C1; the rest each at α 0.05.

## Recovery of what the damage cost (estimate)

`(arm − born_dusk) / (born_ceiling − born_dusk)`, 95 % bootstrap over populations:

| arm | recovery |
|---|---|
| learn | 0.37 [0.34, 0.41] |
| inheritStrip | 0.40 [0.36, 0.44] |
| inherit | **0.88 [0.84, 0.92]** |
| oracle | 1.00 (by construction, see below) |

## What it means

- **The headline holds, and is larger, without the circling.** Inheriting beats learning by 22 points in every one of 48 populations (studies 1–2, in the world with the movement bug: +11). The loops were masking the effect, not producing it.
- **The gain is the repair itself.** Strip the `dusk-before-*` revisions from what is passed on and the advantage disappears: inheritStrip (0.674) is where learning alone is (0.662). Carrying inherited lines is not what helps; carrying the fix is.
- **Inheritance wins back 88 % of what the damage cost**, against 37 % for learning from scratch in each life.
- **With nothing broken, learning and inheriting still cost** about 5 points against the born program, and inheriting costs no more than learning (it did in study 2, in the world with the bug). The cost is the trials, as study 3 found; nothing here removes it, so inheritable learning stays off by default in the game.

## C3 is degenerate

The oracle's lives are byte-identical to intact born's (checked on population 0; the difference is exactly 0 in all 48). Putting `dusk-before-pursue` in front of the damaged program restores exactly the behavior of the intact order: in this world, the only thing moving `dusk` to the end changes is whether it comes before `pursue`. So C3 is true by construction and says nothing beyond that; recovery is read against a ceiling the grammar can reach exactly, which is what makes the 0.88 interpretable.

## Limits

As preregistered: two worlds differing in one number, a deliberate damage (one line moved last), daughters alone, one grammar, a fixed world per run. The gain measured is the repair of a known damage, not the discovery of a better behavior; that inheritance passes on a repair in a fixed world is the known Lamarckian result (Ackley and Littman 1994). What this study adds is that the effect is the repair line itself (C1) and how much of the loss it recovers (0.88), in a world without the movement artifact.
