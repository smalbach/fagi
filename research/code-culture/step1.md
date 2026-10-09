# Paso 1: juez en código, aislado

Datos: `research/results/code-culture/step1` (40 mundos × 3 familias de `dev2`, 2400 s). Generado por `research/code-culture/step1-analyze.cjs`. Código: `src/learned/code-judge.js`, `src/learned/diary.js`.

## Qué se construyó

- **El juez** es el texto de `function ground(obs, look, diary)`, que responde `eat`, `taste`, `carry` o `leave`. Puede traer además `function wants(obs, look, diary)`, que responde `true` o `false`: si va hacia una fruta que ve o huele.
- **Se ejecuta en `node:vm`,** en un contexto propio por vida:
  - sin `Date`, `Math.random`, `eval`, `Function` ni `console`;
  - los argumentos entran como texto JSON;
  - tiene límite de tiempo por llamada (`CODE.timeoutMs`) y de largo del texto (`CODE.maxChars`).
- **Fallos:** cualquier fallo (no compila, no tiene `ground`, error, tiempo agotado o respuesta inválida) da la respuesta innata y queda contado.
- **`obs`** es `observe(fagi)` más:
  - `felt`: hambre menos lo que ya tiene el estómago;
  - `target`: vino a por esa fruta;
  - `innate`: lo que respondería `current`. Su juicio de siempre es parte de lo que sabe; el texto puede seguirlo, corregirlo o ignorarlo, como las líneas de conducta.
- **`look`** es `{ key, color, shape, smell }`.
- **`diary`** son sus bocados como datos planos: aspecto, porción, hambre antes y después, si era nueva y si dañó.

**Cambio frente al plan:** el plan dejaba `wants` como en `current`. Con solo `ground`, la cautela escrita rendía 0,842 frente a 0,889 de las líneas (−0,047 [−0,084, −0,008]). Las líneas también deciden a qué fruta ir: buscar lo nuevo es la mitad de "probar lo nuevo". Por eso `wants` es opcional en el texto; `pantry` y `carried` siguen siendo los de `current`.

## Puertas

| condición | supervivencia | vivas | comidas |
|---|---|---|---|
| `current` | 0.821 | 0.608 | 13.2 |
| texto semilla (`return obs.innate`) | 0.821 | 0.608 | 13.2 |
| líneas de cautela (`learned` + `CAUTION_LINES`) | 0.889 | 0.708 | 18.1 |
| cautela como texto (`CAUTION_SOURCE`) | 0.895 | 0.733 | 18.4 |

- **Semilla = `current`:** 120 de 120 huellas idénticas. **Pasa.**
- **Cautela como texto frente a líneas:** +0,006 [−0,011, 0,027]. La media queda dentro de ±0,02. **Pasa.** Hay 0 fallos en 162 779 llamadas a `ground` y 4,26 millones a `wants`.
- **Pruebas** (`test/code-judge.test.js`): cada tipo de fallo; intentos de salir del contexto (`require`, `process`, `Date`, `Math.random`, `eval`, el constructor de los argumentos); que lo que el texto cambia en sus argumentos no toca su diario; memoria propia por vida; diario. Con `CODE.enabled` apagado, las huellas de siempre no cambian (suite completa: 0 fallos).

## Coste

3,2 s por vida con `current`, 4,1 s con el texto semilla y 8,8 s con la cautela como texto. La diferencia la ponen las llamadas a `wants`, unas 35 000 por vida. Una campaña de 2400 vidas son ~22 min con 16 núcleos, sin contar el modelo. Se puede abaratar más adelante, por ejemplo preguntando a `wants` una vez por fruta y bocado nuevo.
