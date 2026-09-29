# How it is organized

One file per responsibility. Nobody knows more than they need: `movement.js`
moves but does not decide, `decision.js` decides but does not draw, `render.js`
draws but does not touch the state.

## The loop

`main.js` only holds the loop: `step()` → `render()` → HUD → console.
`simulation.js` is the world's turn, in order: wind → trees → fruit →
scent plumes → pheromone → Fagi.

## Fagi

| file | what it handles |
|---|---|
| `fagi.js` | defines her and orders her turn. Nothing else |
| `needs.js` | hunger, thirst, energy: going up, going down, dying |
| `perception.js` | what she sees and smells, all together in one scored list |
| `attention.js` | what has just entered what she perceives; notes whether it made her keep or change her plan |
| `decision.js` | rules in priority order; the first one that answers wins |
| `movement.js` | turning, moving forward, avoiding, exploring, tracking a smell |
| `explore.js` | the coarse map of where she has been; exploring goes in legs towards a point she can see |
| `feeding.js` | eating or carrying |
| `nest.js` | storing, drawing on the pantry, resting |
| `synapses.js` | the trace of learning as a network: sense→concept (Hebb, pruned when unused) and concept→sensation (from consequences). It decides nothing |
| `brain.js` | scoring what she perceives, and the single gate for all learning |
| `interoception.js` | the body feels itself: comparing how it was before with how it is after |
| `episodes.js` | an experience from when it starts until it is known how it ended |
| `biology.js` | the body she was born with: sex and body genes, as multipliers worked out once |
| `thermal.js` | her temperature, the light she feels, and what the cold, the nest and the dark teach her |
| `sleep.js` + `consolidation.js` | sleep pressure, and sorting the day once per night asleep in the nest |
| `experiment.js` | the night's questions become the next day's agenda; she answers them with a trial bite (`decision/experiment.js`) |
| `appetite.js` | what the body lets her eat and when: handling time, malaise after a bad bite, one-trial aversion to a smell, dying of poisoning; and thirst that sends her looking for water |
| `percept.js` | what she perceives of a thing as opposed to what it is: by smell alone only the smell; the API reads traits, never names |
| `taste.js` + `chemistry.js` (`TASTE`) | a wild fruit as a hidden mix of compounds the tongue reads as seven tastes, only in the mouth; innate liking, spitting out, acquired tastes and taste-consequence learning |
| `health.js` | the harm her body has taken and not yet mended: stings, poison, heat and cold; it slows her, gates breeding and kills at zero |
| `things.js` + `concepts.js` | things with no inborn category: only a look (color, shape, texture), and a hidden per-map chemistry of what they afford (sap, cool, warm, sting, nothing). She touches and nibbles them (`decision/things.js`), groups what she felt into concepts that predict new kinds and are retired when they do not, and doubts everything for a while after a surprise |
| `night/` | the night mind: a model (local, or a server over HTTP) proposes rules, doubts and questions while she sleeps; a gate checks each against the grammar and against her own memory, and keeps only what what she lived backs |
| `learned/` | the code Fagi writes on her own from what she learns (see below) |
| `observation.js` + `backend/` + `cortex.js` | the external decision API (see below) |

The rules in `decision.js` are a hierarchy written in order, and all of it
comes from the one directive, survive:

1. **survive now** — drink, ease hunger or thirst, draw on the pantry;
2. **endure** — rest, because without strength there is no surviving later;
3. **provide** — take to the nest what she does not need now, and chase what she sees;
4. **explore** — with no need, no clues and the pantry stocked, getting to know
   the map is the only thing that prepares for the three above.

Adding a new behaviour only takes one more entry in the `RULES` list (tier, name, function),
in the tier where it belongs. It returns an intention or `null`. `decision.js` only
keeps that order; the functions live in `decision/`, one file per tier
(`survive`, `endure`, `provide`, `clues`, `explore`), plus `directive.js`
(the decision API) and `common.js` (`reasonOf`, `pressing`, the pantry).

There is no longer any tier that decides "this is good" or "this is bad": that is
decided by `learned/rules.js` (`verdict()`), consulted from `feeding.js`,
`nest.js` and right here. **Adding a new hazard or a new help is physics only**:
a `POINT_TYPES` entry with its `hunger` and its `effects`, nothing more. Fagi does
not know whether it is good or bad until she tries it; she learns it and writes it down on her own.

### How she learns (what used to be "brain.js is the only thing that learns")

1. **Eating or drinking opens an episode** (`episodes.js`) with a snapshot of how
   the body was before.
2. **The body feels itself** (`interoception.js`): comparing that snapshot with the
   one after gives a reward from -1 to +1, from real deltas — hunger, thirst,
   stat multipliers — never from a number hand-written in the config.
   If the bite turns out badly later (the need it came to ease ends up
   critical) or Fagi dies with it on board, the episode is corrected separately,
   after the fact.
3. **`memory.js` learns** from that reward: value + confidence, same as
   always.
4. **`learned/synth.js` synthesizes**: if the belief's weight crosses a
   threshold, it writes (or revises, or retires) a rule in `learned/rules.js`, with
   hysteresis so it does not flicker. Memory is still the only source of
   truth for the value; the rule is the symbolic layer — existence, scope,
   explanation.
5. **`learned/dsl.js`** is the grammar of that rule: a data object that
   prints as a line of real JavaScript (`rule('avoid-toxic',
   {...})`) and is read back with a regular expression + `JSON.parse`, with no
   `eval` anywhere.
6. **`learned/store.js`** keeps a recoverable copy in the browser and lets you
   export/import the module as a file. Fagi **is born knowing nothing**
   (`memory.js` does not pre-seed or load anything on its own when created): recovering
   what was learned in another session is an explicit gesture, never automatic.

### The decision API

`observation.js` builds the JSON an external API sees (candidates,
beliefs, rules already written, the last thing she felt). `backend/` defines the
contract (`local.js` an emulator with no network, `http.js` a real one with a
timeout). `cortex.js` asks without blocking the loop — an answer is never
awaited inside a frame — and applies whatever arrives as a directive
with an expiry, which `decision.js` consults as one more rule. The API
**only decides**; it never writes rules. Full contract in
`docs/decision-api.md`.

## The organism

Day and night, body temperature, sex and sleep
(`docs/ESPECIFICACION_ENTE_ADAPTATIVO.md`). Each is a block in `config.js`
(`CYCLE`, `THERMAL`, `SEX`, `SLEEP`) that starts **off**: with them off the
simulation is the one the preregistered studies ran, to the last random draw.
`organism.js` switches them together; the game does it at boot
(`app/organism-on.js`), batch with `--organism`.

`cycle.js` is the sky as a pure function of the world clock (light, air
temperature, day). Fagi never reads it directly: `thermal.js` gives her the
light and her own temperature, and she learns what they announce.

## The world

`world.js` (state), `mapgen.js` (self-sufficient random map), `obstacles.js` (geometry of
water, rocks and nest), `trees.js` (fruit), `food.js` (fruit rots),
`wind.js` + `smell.js` (wind and scent plumes), `pheromone.js` (the trail
Fagi leaves), `vision.js` (field of view), `effects.js` (temporary buffs).

## Screen

`render.js` (scene, and the night over it), `terrain.js` (the ground), `fagi-sprite.js` (Fagi, a made-up organism),
`rock-sprite.js` (rocks), `nest-sprite.js` (the nest), `tree-sprite.js` (trunk and
crown), `fruit-sprite.js` (the fruit), `sprite-kit.js` (canvases, noise and cache
they share), `colors.js` (blends),
`ui.js` (HUD), `console.js` + `narrator.js` (decision console),
`settings.js` (settings panel), `input.js` (mouse), `compass.js` (headings).

The big drawings are folders: the file with the same name is only the
entry point (it exports the usual things and keeps the caches) and the pieces go inside.

| entry point | pieces |
|---|---|
| `fagi-sprite.js` | `fagi-sprite/`: `entity` (mantle, core, filaments, membranes, sensory stalks, cargo), `palette`, `light` and `stroke.js` (ellipse, dot) |
| `fruit-sprite.js` | `fruit-sprite/`: one painter per fruit (`berry`, `spark`, `eye`, `resin`, `rotten`) and what they share in `common.js` |
| `tree-sprite.js` | `tree-sprite/`: `trunk`, `branches`, `base`, `crown`, `realistic-crown`, `wind`, `fruits`; trunk and high branches share `trunkCanvas` (in `common.js`) |
| `rock-sprite.js` | `rock-sprite/`: `realistic`, `materials`, `shape`, `surface`, `paint` |
| `terrain.js` | `terrain/`: baked ground (`ground`, `relief`), loose `details`, `near` and `shore` layers |
| `water-sprite.js` | `water-sprite/`: `lake` (photo or drawing), `realistic`, still canvas (`still` + `bed`), the living part (`surface`, `reeds`) and `shape` |
| `rain-sprite.js` | `rain-sprite/`: `state` (the sky's level, one and only), `ground`, `puddles`, `drops`, `util` |
| `brainmap.js` | `brainmap/`: one section per file (`feel`, `perceive`, `instinct`, `decide`, `learn`, `network`, `mental-map`) on top of the brushes in `brushes.js` |

When touching a sprite, **the order of the seeded random calls does not
change**: every pixel comes from it.

The CSS is in `styles/`, one file per area; `index.html` only loads
`styles/index.css`, and the order of its `@import`s is the cascade order
(`mobile.css` last). Each language's texts are in `i18n/<language>.js`;
`i18n.js` holds the API (`t`, `setLang`, `bindDom`…).

The painted sprites share two rules: light always falls from the top
left, and each drawing is painted once on its canvas and then only stamped.
Fagi is the exception to the second: she turns and walks, so she is drawn stroke by stroke. Since the
body turns and the light does not, inside her drawing the light is turned the opposite way (`localLight`)
so her back keeps shining on the same side of the map.

And the three things that make something rest on the ground instead of being stuck
on top of it, all repeated on every element: the long shadow the light casts, the
contact occlusion —short and dark, right underneath— and the ground bounce, which
is the brownish light the earth throws back onto the shaded side.

The ground is baked once at the size of the world, so when zooming in it stretches and
loses its texture. `drawNearDetail` brings it back: it scatters pebbles, blades and leaves
in WORLD coordinates by cells with their own seed, only in what is visible and
only past a certain zoom. Since the seed belongs to the cell and not to the
pass, the ground does not boil when the camera moves.

And what you see tells what the thing does. Each fruit has the shape of its
effect —the spark is glass, the eye looks, the resin drips— and shows how
overripe it is before it rots. The tree shows its fruit ripening in the crown
instead of carrying a counter above it, and it leans with the wind, which is what
carries the smells. `fagi-preview.html`, `flora-preview.html` and
`water-preview.html` are for looking at those drawings up close without playing a
game.

## Numbers

All in `config.js`. The settings panel edits them live because the game
reads them every frame: there are no copies.

## Sessions: recording and replaying

`app/boot.js` is the entry point: it asks who you are and picks the screen
(`app/screens.js`: sign in, waitlist, home, admin). `main.js` no longer
starts on its own: `createGame()` mounts the view once and uses it in three modes,
prepare (map without Fagi, editable), play (recording) and replay.

| file | what it handles |
|---|---|
| `recorder/events.js` | the event catalogue and its validation; the server uses it too |
| `recorder/recorder.js` | writes down the events in order and sends them in batches |
| `recorder/sink.js` | takes them to the server; with no network, it keeps them in IndexedDB and retries |
| `recorder/replay.js` | rebuilds the world at any instant by applying events |

Everything that changes the map goes through `world.js` (`addPoint`, `removePoint`,
`addObject`, `removeObject`) or calls `record(world, type, data)`: **a
new change in the world that does not go through there will not show up on replay**. Fagi's
things (eating, picking up, drinking, rules, dying) and the wind are not hooked into their
logic: the recorder extracts them by comparing each frame with the previous one, like the
narrator. The object's type goes in `what`, because `type` is the event's.
