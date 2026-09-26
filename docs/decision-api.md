# La API de decisión

Fagi tiene instinto (`src/decision.js`) y aprende por experiencia (`src/episodes.js`,
`src/learned/`). Ese instinto sigue decidiendo siempre — es la red de seguridad.
Pero además, si se activa, una **API externa** puede decidir qué hacer en los
momentos que importan: ve algo nuevo, le acaba de sentar algo bien o mal, la
necesidad se vuelve urgente, o lleva un rato explorando sin más.

La API **solo decide**. No enseña nada, no escribe reglas: eso lo hace el
aprendiz local (`src/learned/synth.js`) a partir de lo que Fagi siente, tenga
o no una API conectada. Enchufar una API no cambia qué aprende Fagi, solo
quién decide qué hacer con lo que ya sabe.

## Cómo se activa

Desde el panel **Código aprendido**, campo "Quién decide":

- **Solo instinto** (de fábrica): nunca se pregunta a nadie.
- **Emulador local**: una decisión razonable calculada en el propio navegador,
  sin red. Sirve para probar el camino entero y es la referencia de lo que
  cualquier API tiene que poder hacer con el mismo JSON.
- **API HTTP**: se le pide la URL base de un servidor que cumpla el contrato
  de abajo. Ver `server/decision-api.example.js` para uno mínimo de prueba.

También hay ajustes numéricos en el panel de Ajustes → "Decisión externa":
cada cuánto se le puede preguntar como mucho (`minInterval`), cuánto se le
espera antes de rendirse (`timeout`), cuánto dura una directiva si la
respuesta no dice otra cosa (`ttl`), y la autoridad (ver más abajo).

## El contrato

Un backend es cualquier cosa con esta forma:

```js
{
  name: 'mi-backend',
  async decide(observation, { signal }) {
    // devuelve una Intención, o null si prefiere que decida el instinto
  },
}
```

Con **API HTTP**, Fagi hace `POST {url}/decide` con la Observación como cuerpo
JSON, espera como mucho `BACKEND.timeout` segundos, y trata cualquier fallo
(red caída, tarda de más, respuesta que no es JSON válido) exactamente igual
que un `null`: decide el instinto, sin excepciones ni caídas del juego.

### Observación (lo que recibe la API)

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
      "key": "toxico",
      "kind": "food",
      "via": "vista",
      "dist": 88,
      "score": 0.41,
      "belief": { "value": -0.63, "confidence": 0.7, "stage": "corta" },
      "verdict": "avoid"
    }
  ],
  "beliefs": {
    "toxico": { "value": -0.63, "confidence": 0.7, "stage": "corta", "tries": 2 },
    "nectar": { "value": 0.97, "confidence": 0.88, "stage": "media", "tries": 9 }
  },
  "rules": [
    "rule('evitar-toxico', {\"on\":[\"eat\",\"store\",\"pursue\"],\"when\":{\"key\":\"toxico\"},\"verdict\":\"avoid\",\"weight\":-0.63,\"because\":[{\"sense\":\"hunger\",\"v\":25}],\"learnedAt\":70.2,\"tries\":2,\"stage\":\"corta\"})"
  ],
  "lastEpisode": { "key": "nectar", "action": "eat", "reward": 0.97 },
  "instinct": { "action": "seekFood", "reason": { "key": "reason.seekFood", "params": { "n": 2, "score": "1.10" } } }
}
```

Campos:

| campo | qué es |
|---|---|
| `needs` | fracción 0–1 de hambre, sed y energía |
| `effects` | buffs/debuffs activos ahora mismo (el efecto de lo último que comió) |
| `candidates` | hasta 8 cosas perseguibles, de mejor a peor puntuadas por el instinto — **la API solo puede nombrar algo que esté aquí** |
| `candidates[].verdict` | `"avoid"`, `"prefer"` o `null`: lo que las reglas escritas opinan de perseguirlo |
| `beliefs` | el mapa entero de creencias (valor + confianza) que Fagi tiene ahora mismo |
| `rules` | las reglas activas, literalmente como las escribiría el módulo exportado — la API puede leer el código que Fagi ya tiene |
| `lastEpisode` | la última experiencia (comer o beber) y lo que sintió |
| `instinct` | qué haría el instinto AHORA MISMO si nadie más decidiera — un ancla útil para no proponer algo disparatado |

### Intención (lo que devuelve la API)

```json
{ "action": "seekFood", "targetId": 57, "ttl": 8, "reason": "está cerca y no la evita" }
```

| campo | obligatorio | qué es |
|---|---|---|
| `action` | sí | una de: `seekFood`, `seekWater`, `track`, `explore`, `toNest`, `pantry`, `rest`, `carry` |
| `targetId` | según la acción | el `id` de un candidato de la observación. No hace falta para `explore`, `rest`, `toNest`, `pantry` |
| `ttl` | no | segundos que la directiva sigue valiendo si no llega otra antes. Se recorta a `[1, BACKEND.maxTtl]`; si falta, se usa `BACKEND.ttl` |
| `reason` | no | texto corto, o `{key, params}` si se quiere que la consola lo traduzca como el resto de razones del juego |

Cualquier respuesta que no encaje (acción fuera de la lista, `targetId` que no
estaba en `candidates`, o directamente un fallo) se descarta entera: decide el
instinto, sin excepción ni frame en blanco.

## Autoridad: quién manda cuando hay prisa

- **Segura** (`BACKEND.authority = 0`, de fábrica): el instinto atiende
  primero lo que puede matar — beber, comer, la urgencia, tirar de despensa —
  y la directiva externa solo entra después, donde antes decidían descansar,
  acarrear o perseguir. Una API lenta o rara nunca puede dejarla morir.
- **Plena** (`BACKEND.authority = 1`): la directiva va la primera de todas,
  salvo que la vida dependa de algo que ella no atiende (hambre o sed crítica
  y su `targetKind` no es `food` ni `water`) — ahí se aparta y manda el
  instinto igualmente.

## Latencia y directivas caducadas

El bucle nunca espera a la API: la pregunta se lanza y la respuesta, si
llega, se aplica cuando llega — nunca dentro del mismo fotograma. Mientras
tanto sigue decidiendo el instinto (o la directiva anterior, si seguía
vigente). Una directiva vencida (`fagi.age >= until`) se olvida sola; una
respuesta que llega tarde, después de que Fagi muriera o la partida se
reiniciara, se descarta sin aplicarse.

## Cómo enchufar un LLM de verdad

1. Levantar un servidor que sirva `POST /decide` con el contrato de arriba.
   `server/decision-api.example.js` es un punto de partida sin dependencias.
2. Dentro, pasarle la Observación a un modelo con un prompt del tipo: *"Eres
   el instinto de una hormiga. Aquí tienes lo que ve, cree y ha aprendido.
   Devuelve SOLO un JSON con `action` y, si aplica, `targetId` de la lista de
   candidatos."* — conviene pedir salida estructurada (JSON mode / tool use)
   para no depender de parsear texto libre.
3. Poner esa URL en el panel. El resto (validar, aplicar, expirar, ignorar lo
   que no cuadre) ya lo hace Fagi.

Nota de secretos: esto es una app de navegador sin backend propio. Si el LLM
necesita una clave de API, esa clave vive en EL SERVIDOR que responde a
`/decide`, nunca en el navegador ni en el código de Fagi.
