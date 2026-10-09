# Paso 3, piloto: ¿evoluciona algo útil? (formato `code`, desarrollo)

Datos: `research/results/code-culture/lineages/{code-tournament,code-random,current}` (cada generación con sus textos en `texts.json`) y `research/results/code-culture/transplant`. Scripts: `research/code-culture/lineages.js` y `transplant.js`. Modelo `qwen3.6`, prompt v2, llamadas en `archive.jsonl`.

Exploratorio, a pedido del usuario: una versión corta antes de la campaña completa.

## Diseño

- **Tamaño:** 3 linajes × 10 generaciones × 12 Fagis, en `cdev`. El mundo n = linaje·120 + generación·12 + k es el mismo en las dos condiciones, y `current` vive cada mundo.
- **Generación 0:** todas nacen con el texto semilla, que equivale a `current`.
- **Herencia:** cada hija recibe el texto de su madre. Con probabilidad 0,5, el modelo lo reescribe antes, viendo solo el texto, sin diario. Si la reescritura falla la prueba de forma, se queda el texto de la madre.
- **Madres:** por torneo de 3 (la que más vivió, luego la que más comió) o al azar.
- **Trasplante:** el texto que más Fagis llevan en la generación 9 de cada linaje vive 120 mundos nuevos (`cdev` 400–519) frente a `current`.

## Resultado

**Población:** supervivencia del código menos `current` en los mismos mundos, media de los 3 linajes:

| | g1 | g2 | g3 | g4 | g5 | g6 | g7 | g8 | g9 | media g1–9 |
|---|---|---|---|---|---|---|---|---|---|---|
| torneo | −0.047 | 0.019 | −0.068 | −0.116 | 0.025 | −0.044 | 0.072 | 0.048 | −0.028 | −0.016 |
| azar | 0.063 | 0.017 | −0.049 | −0.131 | 0.014 | −0.049 | 0.078 | −0.024 | −0.071 | −0.017 |

Las dos curvas se parecen tanto porque comparten los mundos: el ruido de cada mundo pesa más que lo heredado.

**Trasplante a 120 mundos nuevos** (`current` 0,813):

| texto final | − `current` |
|---|---|
| torneo, linaje 0 | −0.021 [−0.087, 0.047] |
| torneo, linaje 1 | **+0.138 [0.094, 0.192]** |
| torneo, linaje 2 | **+0.121 [0.073, 0.175]** |
| azar, linaje 0 | **+0.092 [0.041, 0.140]** |
| azar, linaje 1 | **+0.087 [0.032, 0.140]** |
| azar, linaje 2 | −0.076 [−0.142, −0.017] |

## Lectura

- **Reescribir una y otra vez produce código mejor que `current`, con o sin selección.** Cuatro de los seis textos finales lo superan en mundos nuevos, entre +0,09 y +0,14. Es más que la cautela escrita a mano (+0,067, medida en `dev2`).
- **Esos textos redescubren la cautela:**
  - dejar lo que la dañó;
  - probar lo que nunca probó;
  - comer o cargar lo que ya sabe seguro;
  - comer cualquier cosa al borde de morir de hambre.

  Casi ninguno usa `obs.innate`: reemplazan el juicio innato entero. Un texto de azar (linaje 2) evita las frutas que comparten un rasgo con algo que la dañó, generaliza de más y pierde.
- **Este piloto no muestra fuerza de la selección.** La población del torneo es igual a la del azar (−0,016 frente a −0,017). En el trasplante, el torneo sale algo mejor (media +0,079 frente a +0,034), pero con 3 linajes por condición eso es ruido.
- **Lo encontrado es en buena parte conocimiento previo del modelo.** El modelo nunca ve un diario en este formato, así que lo que mejora viene de reescribir: cada reescritura sin vida empuja hacia "deja lo que dañó, prueba lo nuevo". El paso 2 midió que el modelo, escribiendo de cero, pierde 0,079. Reescribiendo sobre un texto que ya funciona, en cambio, acumula sentido común.
- **Por qué la población no lo muestra:** la mitad de las hijas se reescribe en cada generación, y con 12 por generación el ruido de un solo mundo tapa diferencias de ~0,1. Los buenos textos aparecen y se pierden.

## Para la campaña completa (propuesta)

- **Menos variación y más Fagis:** `mutate` 0,2 y K = 24, para que lo bueno alcance a fijarse, como en el paso 0 (K = 30, sin mutación).
- **El trasplante como medida principal,** y 10 linajes por condición.
- **El brazo ciego, imprescindible:** si en ciego no aparece la cautela, lo encontrado viene del vocabulario del modelo y no de la vida.
