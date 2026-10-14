# Plan: a predator in the Fagi world (study 6)

**Status:** plan, 2026-10-12. Not preregistered. Nothing is built yet.

## Why a predator

Every lesson Fagi has learned so far could be learned by trying: a bad fruit
makes her sick, she survives, and she avoids it next time. A predator breaks
that. The first mistake can be the last one, so trial and error is the most
expensive way to learn about it. That makes a predator the hardest test so far
for the project's main result, that inheriting what was learned beats learning
it again (H1, +11 to +22 points across studies 1–4).

Real animals point to three things:

- **Social and inherited fear.** Monkeys raised in the lab learn to fear snakes
  by watching another monkey react to one (Mineka and Cook). Blackbirds learn
  which birds to mob by watching others mob them (Curio, 1978). Training prey
  to recognise predators before release is a standard conservation technique
  (Griffin et al., 2000).
- **The landscape of fear.** A predator changes where prey eat and drink even
  when it kills little (Laundré et al., 2001; Brown, 1999, giving-up densities).
- **Ghosts of predators past.** Pronghorn still run far faster than any living
  predator requires (Byers, 1997). A fear can outlive its cause.

The third point matches the reasons-versus-conclusions study, where inherited
myths outlived the world that made them true.

## Question

When a mistake can kill, does inheriting knowledge help more than it does with
food, and what does it cost once the predator is gone?

## Hypotheses (draft, to be fixed in a preregistration)

Primary:

- **P1 (inheritance matters more when a mistake can kill).** The gap between
  inherit and learn populations is larger in the predator world than in the
  same world without the predator. This is an interaction test, paired by map.
- **P2 (fear comes from harm, not from the cue).** With a real predator, Fagis
  spend less time in its ambush zones than with a sham predator: the same
  animal, visible and smellable the same way, that never attacks.
- **P3 (the ghost of the predator).** After the predator is removed in mid-run,
  inherit populations keep avoiding the old ambush zones longer than learn
  populations, and they eat less for it.

Secondary:

- **P4 (watching teaches).** With observation on (seeing a sister attacked),
  fewer Fagis die by predation than with it off.
- **P5 (the body answers).** In the evolving game world, the mean muscle gene
  (speed) ends higher with the predator than with the sham. This connects to
  the leaps study.
- **P6 (realism, not extinction).** Predation is a real share of deaths
  (target 15–35 %) without driving colonies extinct more often than the sham.

## The mechanism (minimum, and physics only)

The project rule holds (src/README.md): a new hazard is physics only. Nothing
in Fagi knows "predator"; she meets a thing that looks, smells and hurts, and
whatever she does about it she must learn with the machinery she already has
(concepts, pain, `watchThings` in src/social.js, inheritance in
src/generations.js).

- `src/predator.js`, `PREDATOR` in src/config.js, **off by default**. With it
  off, game and research output stay byte-identical (checked against a
  detached-HEAD worktree, as for the speed work).
- **An ambush hunter, to start with.** It waits near water and the edges of the
  wood and lunges at whoever comes within range. Ambush makes the landscape of
  fear measurable (where they drink and eat). A pursuit hunter comes later.
- **It wounds more often than it kills.** A lunge hurts (pain, health) and
  kills with a set chance. A survived wound is the lesson; without survivable
  encounters there is nothing to learn or pass on.
- **Visible and smellable** through the existing vision and smell channels, as
  a kind of thing with its own look and scent.
- **Sham control:** `PREDATOR.sham` 1. It is the same animal with the same
  random draws, but it never strikes.
- **Removal:** `PREDATOR.until` (seconds), for P3.
- No innate "flee" line is written by hand. Whether a generic startle reflex
  to a sudden approach should exist is a design decision (below).

## Steps

1. **Mechanism and tests.** Build predator.js, config, sprite and settings help
   (ES+EN), plus unit tests for the lunge, wounding, sham and removal. Confirm
   byte-identical output when it is off.
2. **Pilot (scratch, 16 maps, seeds 9200–9215).** Use the inheritance profiles
   (scripts/profiles/repair.json, intact.json) and the game world. Calibrate the
   attack rate and lethality to the P6 target. Check for artifact deaths: a
   predator born on a nest, Fagis trapped in a loop near it, deaths with no
   lunge recorded.
3. **Measures.** Deaths by cause; time spent within the ambush radius; food
   eaten; the age at first wound; how often a wound was survived versus seen
   happen to a sister versus inherited before any encounter.
4. **Preregistration.** Freeze hypotheses, arms, seeds (61000+, unused) and
   the analysis script before any confirmatory run, as in studies 1–5.
   - Draft arms: {none, sham, predator} × {learn, inherit}, plus a removal arm
     for P3 and observation on/off for P4.
   - Before quoting cost or duration, measure the real time per population at
     the expected size. The machine is shared.
5. **Run, analyse, results doc,** and the site update in ES and EN together.

## Decisions for the user before step 1

- **Ambush or pursuit** for the first version. Ambush is recommended: it is
  cheaper to compute and makes the landscape of fear measurable.
- **Generic startle reflex:** yes or no. Real prey have one. Without it, early
  generations may simply die, and P1 then measures luck.
- **Does the predator evolve too** (coevolution)? Recommended: no for study 6.
  It stays fixed so the effects can be attributed.
- **Kill chance per lunge:** a starting value (for example 0.2) for the pilot
  to calibrate.

## Risks

- **Extinction from the predator alone.** Then P1 and P3 measure nothing; the
  P6 calibration exists to prevent this.
- **Speed.** The predator adds another agent to scan. Use src/spatial.js.
- **Overlap with study 4.** In the repair profile the inherited gain is already
  the repair line, so the interaction in P1 must be measured against the same
  profile without the predator, not against old numbers.
