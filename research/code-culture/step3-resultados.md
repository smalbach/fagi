# Paso 3, campaña: resultados (2026-10-04)

Protocolo: `step3-protocolo.md` (70cf391), escrito antes de correr. 4 condiciones × 10 linajes × 20 generaciones × 24 Fagis, `mutate` 0,2, modelo `qwen3.6`. Datos:
- `research/results/code-culture/lineages/full-*`: cada generación con sus textos;
- `research/results/code-culture/transplant`: el trasplante;
- `archive.jsonl`: las llamadas.

Estado en vivo: `node research/code-culture/campaign-status.js`. Unidad: el linaje (n = 10). IC 95 % por bootstrap (4000, semilla 4242), pareado por linaje.

## Respuesta

**El requisito se cumple; la predicción principal no.**

- **Requisito: se cumple.** Con torneo y vocabulario normal, el código evolucionado supera a `current`:
  - en el trasplante (medida principal): **+0,056 [0,019, 0,087]**;
  - en la población de las generaciones 15–19: +0,034 [0,008, 0,062]. La puerta del plan pedía cota inferior por encima de −0,03.
- **Selección en el trasplante: no se sostiene en `plain`.** Torneo − azar da **+0,010 [−0,049, 0,077]**, frente a +0,05 predicho.
  - Los textos finales del azar también superan a `current` (+0,046 [−0,014, 0,096]).
  - Pero dos de ellos se hunden (−0,165 y −0,107). El peor del torneo queda en −0,075.
- **En ciego sí se sostiene.** Torneo − azar: +0,045 [0,018, 0,071]. Aun así, el torneo ciego queda por debajo de `current` (−0,027 [−0,051, −0,007]).
- **En la población** (generaciones 15–19), la selección gana en los dos vocabularios:
  - `plain`: +0,050 [0,009, 0,094];
  - `blind`: +0,065 [0,037, 0,089].

**Predicciones declaradas:**
- **Acertó:** el requisito, y que en ciego el efecto sería menor (de hecho, negativo).
- **Falló:** que el torneo ganara al azar en el trasplante con `plain`.

## Tablas

Supervivencia menos `current`, media de 10 linajes:

| condición | población g15–19 | trasplante (texto final, 120 mundos nuevos) |
|---|---|---|
| torneo, `plain` | +0.034 [0.008, 0.062] | **+0.056 [0.019, 0.087]** |
| azar, `plain` | −0.016 | +0.046 [−0.014, 0.096] |
| torneo, `blind` | −0.048 [−0.059, −0.035] | −0.027 [−0.051, −0.007] |
| azar, `blind` | −0.113 | −0.072 [−0.105, −0.043] |

Trasplante por linaje:

| | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| torneo | .095 | .039 | .021 | .098 | .109 | .111 | .050 | .031 | −.075 | .081 |
| azar | .096 | −.165 | .050 | .087 | .122 | −.107 | .098 | .111 | .048 | .117 |
| torneo ciego | −.103 | −.021 | .000 | .000 | −.007 | −.088 | −.010 | −.033 | −.009 | .000 |
| azar ciego | −.080 | −.068 | −.095 | −.068 | −.017 | −.203 | .000 | −.045 | −.067 | −.080 |

Qué dicen los textos finales (el más común de cada linaje en la generación 19, leídos):

| condición | deja lo que la dañó | usa el juicio innato | es el texto semilla | Fagis que lo llevan (de 24) |
|---|---|---|---|---|
| torneo, `plain` | 10/10 | 0/10 | 0/10 | 5–13 |
| azar, `plain` | 10/10 | 1/10 | 0/10 | 3–8 |
| torneo, `blind` | 0/10 | 10/10 | 3/10 | 7–13 |
| azar, `blind` | 1/10 | 10/10 | 0/10 | 3–8 |

## Lectura

- **Lo útil lo pone el vocabulario, no la vida.** En `plain`, los 20 textos finales, con o sin selección, dejan la especie que la dañó y prueban lo nuevo. Es la cautela, y reemplazan el juicio innato entero. En `blind` casi ninguno lo descubre (1 de 20).
  - La diferencia está en el prompt: `plain` le dice al modelo que `harmed` significa "veneno".
  - En ciego solo ve el nivel `n1` antes y después. Nunca infiere "subió después de usarlo, evítalo".
- **La selección hace de freno, no de motor.** Su efecto robusto es evitar desastres: en ciego conserva el juicio innato (3 de 10 linajes terminan con el texto semilla intacto; todos lo usan) y descarta las reescrituras que empeoran. En `plain`, el azar llega a textos igual de buenos de media, pero con dos hundidos.
- **El cuello de botella es el operador.** El modelo no aprende de lo que ve en el diario; trae lo que ya sabe. Con selección por supervivencia, en 20 generaciones y 24 Fagis, no basta para que un linaje descubra a ciegas algo que el modelo no sepa.

## Qué sigue (para decidir)

- **Paso 4 tal como está en el plan:** comparar formatos de transmisión (`code`, `reasons`, `evidence`) con inversión de la química. Mediría mitos, pero sobre un operador que no aprende del diario.
- **Antes, darle al operador la vida:**
  - reescritura con el diario de la madre o el propio (como `revise` en el paso 2, que en ciego mejora a `zero-shot`);
  - en ciego, decirle que `n1` alto es malo para el agente y mostrar "subió/bajó".

  Es la prueba directa de si lo que vive una Fagi llega a su código.
