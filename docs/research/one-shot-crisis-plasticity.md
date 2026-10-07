# Acute one-shot plasticity and embodied program rewriting

**Project:** `first-agi` / Fagi  
**Module:** `src/program/crisis.js`  
**Date:** October 2026  
**Status:** Implemented. The results below are those recorded by the original experiment report.

## Motivation

Fagi is intended to learn from experience and rewrite her behavior program. The original report identified three possible constraints on statistical rewriting:

- **Long evidence collection:** comparing behavior pairs with a multiple-comparison correction required repeated observations before a rule could be accepted.
- **Death before review:** in changing environments, individuals could die before collecting enough evidence or take more than 1,000 simulated seconds to write their first line.
- **A strong starting policy:** the manually written hierarchy already performed well in benign environments, leaving little visible advantage for alternative priorities.

These are hypotheses motivating the mechanism, not conclusions established by the small experiment below.

## Implemented mechanism

The crisis module recognizes a fixed set of physiological situations: cold in darkness, freezing rain, immersion in deep water, dehydration, exhaustion, and thermal stress with falling pressure. Each recognized situation selects a predefined protective behavior and inserts a conditional line before pursuit.

Examples include:

- Darkness and thermal stress select `dusk` before `pursue`.
- Exhaustion selects `rest` before `pursue`, conditioned on low energy.
- Freezing rain selects the first available behavior from `shelterRetreat` and `rest`.

The implementation records an English explanation, activates the selected tactic, and displays the program-change animation. A cooldown prevents repeated immediate insertions. The proposed association is supplied by the crisis template; creating the line does not establish that Fagi discovered that association independently.

`chain` currently means first-available alternatives. It does not track completion of a temporal sequence.

## Reported paired experiment

Runner: `scripts/run-adaptation-experiment.js`. Ten paired seeds, a 600-second horizon, a 140-second day/night cycle, cold nights, and frequent rain.

| Condition | Survival | Individuals writing lines | Mean lines per individual | Mean time to first line |
|---|---:|---:|---:|---:|
| Innate control | 100% | 0% | 0.00 | Never |
| Acute plasticity | 100% | 100% (10/10) | 1.10 | 109.8 s |

Representative generated lines:

```text
dusk-before-pursue-dark
  condition: dark
  reason: acute crisis: freezing darkness during hunt

rest-before-pursue-energyBelow35
  condition: energy below 35%
  reason: acute crisis: physical exhaustion during pursuit

shelterRetreat-before-pursue-chain-shelterRetreat-rest-raining
  condition: raining
  reason: acute crisis: severe hypothermia in rainstorm
```

## Interpretation and inheritance

The recorded experiment demonstrates that the mechanism writes lines. Both groups reached the survival ceiling, so this outcome does not demonstrate improved survival. Passing unit tests establishes software behavior, not adaptive benefit, biological equivalence, or scientific novelty.

Legacy egg inheritance carries born lines only. Optional cultural transmission can teach custom lines after hatching. The new experience-driven behavioral genome, described in `experience-driven-program-plan.md`, admits revisions accepted by an observed-outcome comparison. Crisis templates do not enter that genetic journal merely because they were inserted into the live program.

Future validation needs environments with measurable room for improvement, observed consequences for the proposed change, independent evaluation worlds, and comparisons against simple fixed alternatives.
