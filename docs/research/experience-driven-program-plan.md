# Experience-driven, heritable behavior programs

Status: milestone 1 implemented and tested; milestones 2–4 remain planned. This is an engineering plan, not evidence of improved survival.

## Requirements

- Plans, language keywords, explanations, comments, and new implementation text are English.
- Rules are data carried by each organism. The base program and accepted changes are heritable.
- Creating, revising, or retiring a rule must be motivated by observed experience. No random rule deletion, mutation, or loss at birth.
- Missing evidence, inactivity, or an inconclusive comparison does not justify retirement.
- Inherited decisions remain revisable. Inherited evidence is provenance, not the child's personal experience.
- Retirement removes a rule from execution while preserving its history. An inherited retirement must not resurrect the rule.
- Predictions and imagined actions are not observations of their consequences.

## Architecture

The target pipeline is perception → program interpreter → action → observed consequences → evidence review → accepted program revision → inheritance.

The engine retains physics, sensory access, and elementary actions. Behavior policies progressively move into a versioned data language. The full interpreter will distinguish action, condition, first-available alternative, and stateful sequence nodes. A sequence must track running, successful, and failed steps, cancellation, and a bounded execution budget. Existing `chain` values are first-available alternatives; they must not be relabeled as completed temporal sequences.

The behavioral genome contains an explicit base snapshot and an ordered journal of accepted revisions. The initial inheritance route is maternal and deterministic. This avoids arbitrary recombination of dependent rules. Each revision records its author, time, before/after rule, observed comparison, uncertainty, support, and representative episode references. The child receives independent data copies and starts with an empty personal observation record.

## Milestones

### 1. Evidence and inheritance foundation — implemented and tested

- Require a supported disadvantage before retiring a learned rule; retain rules after ties, noise, or insufficient evidence.
- Record accepted additions and retirements in a versioned behavioral genome.
- Reconstruct the effective program from the base and journal, preserving retired rules.
- Connect the genome to egg creation and hatching behind `PROGRAM.inherit`.
- Reevaluate inherited learned rules using the child's subsequent observations.
- Provide a strictly validated, English, data-only `.fagi` JSON representation for inspection and round-trip persistence.
- Expose **Export behavior** and `.fagi` import in the learned-code panel; preserve the genome in recoverable learning snapshots.
- Test multi-generation inheritance, independent copies, retirement persistence, rejected inputs, and behavior compatibility with inheritance disabled.

This milestone continues using the existing behavior repertoire and decision walker. It does not claim arbitrary new skills or implement the full temporal interpreter. Unverified crisis templates and cultural suggestions are not automatically admitted to the genetic journal.

### 2. Compositional interpreter

- Add typed action, condition, first-available, and stateful sequence nodes.
- Use readable English syntax over the validated data representation.
- Move policy conditions out of large behavior functions into program data, beginning with food seeking, tasting, and returning.
- Preserve legacy execution as a comparison mode; demonstrate equivalent behavior before enabling learning.
- Add completion, interruption, timeout, and bounded execution tests.

### 3. Experience-directed structural revision

- Identify prediction errors, harmful outcomes, and successful alternatives in comparable situations.
- Propose condition changes, action substitutions, and sequences tied to these observations.
- Evaluate proposed structures using actual trials of that structure, not scores copied from a component action.
- Support revision and retirement of base rules with the same evidence requirement.
- Treat acute harm as grounds for provisional suspension and review, not proof of a permanent causal conclusion.
- Detect when a prohibition prevents learning; choose targeted information-seeking trials based on uncertainty and physiological cost.
- Record delayed consequences, including missed food, time, and energy expenditure.

### 4. Experimental validation

- Compare the current baseline, the new interpreter without learning, experience-driven learning without inheritance, and learning with inheritance.
- Include a simple fixed heuristic and an informed reference with the same sensory access.
- Use paired worlds, independent random streams, comparable simulation budgets, multiple lineages, and reserved evaluation worlds.
- Measure survival, recovery after environmental change, resource cost, retained improvement across generations, and rule-specific outcomes.
- Report effect sizes and uncertainty. Rule counts and passing software tests do not establish adaptive improvement.
- Keep experimental settings separate from historical research defaults until evidence supports a default change.

## First-version limitations to verify

The existing learner compares behavior pairs using closed distress windows. Those comparisons can be confounded by context and are not proof of causation. Its repertoire, conditions, and sampling remain restricted. This foundation makes accepted changes traceable and heritable; milestones 2 and 3 expand what can be learned and improve how it is evaluated.

The first version records up to 32 representative episode references per revision, plus full support counts and the uncertainty summary. It does not inherit the parent's personal memory buffer. Existing exploratory action selection remains stochastic; rule acceptance and retirement use observed evidence and never a random deletion operator. The JSON validator checks structure and consistency; it does not independently certify the historical origin of an externally edited file.

The source and target action must each have been observed enough times. Retirement requires a disadvantage exceeding both the configured margin and uncertainty threshold. Context differences and overlapping distress windows remain methodological limitations. No survival advantage is claimed by this implementation.

## Trying the first milestone

In **Settings → Adaptive program**, enable **Rewrites own program from experience** and **Inherit experience-backed program revisions**. Breeding must also be enabled for natural births. Research defaults remain off; changing inheritance affects newly conceived eggs.

In **Learned code**, **Export behavior** downloads the versioned base and accepted revision journal as a `.fagi` file. **Import** accepts this format alongside legacy learned-code modules. Import validates the full document before changing the organism. The existing JavaScript export continues to serve its legacy purpose.

For batch runs, use `--set PROGRAM.learn=1 --set PROGRAM.inherit=1` with a generation or breeding configuration. The same maternal behavioral inheritance is applied in sexual and clonal generation runs; physiological genes retain their existing model.

## Relevant existing implementation

- `src/program.js`: program grammar and initial behavior hierarchy.
- `src/program/learn.js`: comparisons and rule review.
- `src/program/watch.js`: lived outcomes and exploratory trials.
- `src/reproduction.js`: egg creation and hatching.
- `src/generations.js`: genome application.
- `research/adaptive-decision/conduct-lineages.md`: documented failures of inherited prohibitions.

## Validation log

- 2026-10-06: 64 relevant baseline tests passed before implementation.
- 2026-10-06: full suite after implementation: 505 tests, 497 passed, 8 database-dependent tests skipped, 0 failed.
- `npm run build`: passed. Vite reports the existing large-chunk advisory.
- `git diff --check`: passed.
- Eight new integration tests cover evidence provenance, insufficient evidence and noise, inherited-rule execution, retirement across three generations, isolated copies, unsupported revisions, persistence and atomic rejection, and conception-to-hatching snapshots.
- Historical decision fingerprints still pass with experimental learning and inheritance disabled.
- No new survival or generalization experiment has been run. The full temporal interpreter and experience-directed structural search are pending milestones.

## English migration

The plan, new genome format, new implementation and tests, adaptive-program controls, and related crisis report are in English. Older Spanish research documents and unrelated Spanish UI translations still exist; repository-wide translation is a separate scope from this initial behavior milestone and has not been claimed as completed.
