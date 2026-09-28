# The decision API

Fagi has instinct (`src/decision.js`) and learns from experience (`src/episodes.js`,
`src/learned/`). That instinct always keeps deciding — it is the safety net.
But on top of that, if enabled, an **external API** can decide what to do at the
moments that matter: she sees something new, something just did her good or harm,
a need turns urgent, or she has spent a while just exploring.

The API **only decides**. It teaches nothing and writes no rules: that is done by
the local learner (`src/learned/synth.js`) from what Fagi feels, whether or
not an API is connected. Plugging in an API does not change what Fagi learns, only
who decides what to do with what she already knows.

## How to enable it

From the **Learned code** panel, "Who decides" field:

- **Instinct only** (default): nobody is ever asked.
- **Local emulator**: a reasonable decision computed in the browser itself,
  with no network. It is for testing the whole path and it is the reference for what
  any API must be able to do with the same JSON.
- **HTTP API**: asks for the base URL of a server that fulfils the contract
  below. See `server/decision-api.example.js` for a minimal test one.

There are also numeric settings in the Settings panel → "External decision API":
how often it may be asked at most (`minInterval`), how long to wait for it
before giving up (`timeout`), how long a directive lasts if the
answer does not say otherwise (`ttl`), and the authority (see below).

## The contract

A backend is anything with this shape:

```js
{
  name: 'my-backend',
  async decide(observation, { signal }) {
    // returns an Intention, or null if it would rather let instinct decide
  },
}
```

With **HTTP API**, Fagi does `POST {url}/decide` with the Observation as the JSON
body, waits at most `BACKEND.timeout` seconds, and treats any failure
(network down, too slow, an answer that is not valid JSON) exactly like
a `null`: instinct decides, with no exceptions and no game crashes.

### Observation (what the API receives)

```json
{
  "version": 1,
  "t": 132.4,
  "needs": { "hungerU": 0.62, "thirstU": 0.31, "energyU": 0.8 },
  "effects": [{ "stat": "speed", "mult": 0.6, "left": 3.1 }],
  "carrying": null,
  "atNest": false,
  "nestKnown": true,
  "pantry": { "nectar": 4 },
  "water": "remembers",
  "candidates": [
    {
      "id": 57,
      "key": "toxic",
      "kind": "food",
      "via": "sight",
      "dist": 88,
      "score": 0.41,
      "belief": { "value": -0.63, "confidence": 0.7, "stage": "short" },
      "verdict": "avoid",
      "new": false
    }
  ],
  "beliefs": {
    "toxic": { "value": -0.63, "confidence": 0.7, "stage": "short", "tries": 2 },
    "nectar": { "value": 0.97, "confidence": 0.88, "stage": "medium", "tries": 9 }
  },
  "rules": [
    "rule('avoid-toxic', {\"on\":[\"eat\",\"store\",\"pursue\"],\"when\":{\"key\":\"toxic\"},\"verdict\":\"avoid\",\"weight\":-0.63,\"because\":[{\"sense\":\"hunger\",\"v\":25}],\"learnedAt\":70.2,\"tries\":2,\"stage\":\"short\"})"
  ],
  "lastEpisode": { "key": "nectar", "action": "eat", "reward": 0.97 },
  "instinct": { "action": "seekFood", "reason": { "key": "reason.seekFood", "params": { "n": 2, "score": "1.10" } } }
}
```

Fields:

| field | what it is |
|---|---|
| `needs` | 0–1 fraction of hunger, thirst and energy |
| `effects` | buffs/debuffs active right now (the effect of the last thing she ate) |
| `water` | what she knows about water: `"sees"`, `"smells"`, `"remembers"` or `"unknown"` |
| `candidates` | up to 8 things worth chasing, from best to worst as scored by instinct — **the API can only name something that is here** |
| `candidates[].via` | how she knows about it: `"sight"`, `"smell"` or `"memory"` |
| `candidates[].verdict` | `"avoid"`, `"prefer"` or `null`: what the written rules think of chasing it |
| `candidates[].new` | it has just entered what she perceives: the previous directive did not account for it |
| `beliefs` | the whole map of beliefs (value + confidence) Fagi holds right now |
| `rules` | the active rules, literally as the exported module would write them — the API can read the code Fagi already has |
| `lastEpisode` | the last experience (eating or drinking) and what she felt |
| `instinct` | what instinct would do RIGHT NOW if nobody else decided — a useful anchor to avoid proposing something absurd |

#### Version 2: the organism

With the organism on (day and night, body temperature, sex, sleep; the game
turns it on, batch with `--organism`, see `docs/ESPECIFICACION_ENTE_ADAPTATIVO.md`)
`version` is `2` and three blocks are added. Everything above stays the same, so
a version-1 client keeps working.

```json
{
  "version": 2,
  "senses": { "light": 0.12, "dark": true, "dimming": false },
  "biology": {
    "sex": "female", "stage": "adult", "energyMax": 112,
    "temperature": 14.8, "thermalState": "cold", "thermalStress": 0.21,
    "sleepPressure": 0.74, "asleep": false, "nauseous": false
  },
  "memory": {
    "consolidations": 3,
    "lastNightReport": { "night": 3, "episodes": 7, "hypotheses": [], "contradictions": [], "questions": [] }
  }
}
```

Only what she can feel: the light and her own temperature, never the hour, the
day or the air's temperature. `thermalStress` and `sleepPressure` are 0–1;
`thermalState` is `"cold"`, `"heat"` or `"comfortable"`. The night report is
data she produced herself while asleep (`src/consolidation.js`); the API can read
it, not write it.
`nauseous` is true for a while after a bite that made her feel bad
(`src/appetite.js`): she will eat only what she knows is good.

With `PERCEPT` on (part of the organism, `src/percept.js`) the observation says
only what she perceives. A fruit is named by how it looks (`"red-round-rotten"`),
never by the name the code gives it (`toxic`, `nectar`...), in every field:
candidates, beliefs, rules and reasons. A fruit she only smells is
`"smell:<smell>"`, with no `belief` and no `verdict`, since by smell alone she
cannot tell which fruit it is.

### Intention (what the API returns)

```json
{ "action": "seekFood", "targetId": 57, "ttl": 8, "reason": "it is close and she does not avoid it" }
```

| field | required | what it is |
|---|---|---|
| `action` | yes | one of: `seekFood`, `seekWater`, `track`, `explore`, `toNest`, `pantry`, `rest`, `carry` |
| `targetId` | depends on the action | the `id` of a candidate from the observation. Not needed for `explore`, `rest`, `toNest`, `pantry` |
| `ttl` | no | seconds the directive stays valid if no other one arrives first. Clamped to `[1, BACKEND.maxTtl]`; if missing, `BACKEND.ttl` is used |
| `reason` | no | short text, or `{key, params}` if you want the console to translate it like the rest of the game's reasons |

Any answer that does not fit (an action outside the list, a `targetId` that was not
in `candidates`, or an outright failure) is discarded whole: instinct
decides, with no exception and no blank frame.

## Authority: who is in charge when things are pressing

- **Safe** (`BACKEND.authority = 0`, default): instinct first takes care of
  whatever can kill her — drinking, eating, urgency, drawing on the pantry —
  and the external directive only comes in afterwards, where resting,
  carrying or chasing used to decide. A slow or odd API can never let her die.
- **Full** (`BACKEND.authority = 1`): the directive goes first of all,
  unless her life depends on something it does not address (critical hunger or thirst
  and its `targetKind` is neither `food` nor `water`) — then it steps aside and
  instinct is in charge anyway.

## Latency and expired directives

The loop never waits for the API: the question is sent and the answer, if
it arrives, is applied when it arrives — never inside the same frame. Meanwhile
instinct keeps deciding (or the previous directive, if it was still
valid). An expired directive (`fagi.age >= until`) is forgotten on its own; an
answer that arrives late, after Fagi died or the game was
restarted, is discarded without being applied.

## How to plug in a real LLM

1. Stand up a server that serves `POST /decide` with the contract above.
   `server/decision-api.example.js` is a starting point with no dependencies.
2. Inside, pass the Observation to a model with a prompt along the lines of: *"You are
   the instinct of Fagi, a small artificial organism. Here is what she sees, believes and has learned.
   Return ONLY a JSON with `action` and, if applicable, a `targetId` from the
   candidate list."* — it is worth asking for structured output (JSON mode / tool use)
   so you do not depend on parsing free text.
3. Put that URL in the panel. The rest (validating, applying, expiring, ignoring whatever
   does not fit) Fagi already does.

A note on secrets: this is a browser app with no backend of its own. If the LLM
needs an API key, that key lives on THE SERVER that answers
`/decide`, never in the browser or in Fagi's code.
