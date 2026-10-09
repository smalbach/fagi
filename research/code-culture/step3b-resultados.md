# Paso 3b: resultados (2026-10-04)

Protocolo: `step3b-protocolo.md` (19123e6). Ciego, torneo, con el diario de la madre; 10 linajes × 24 Fagis, generaciones 0–9. Comparado con `full-blind-tournament` (paso 3, sin diario) en los mismos mundos. Datos: `research/results/code-culture/lineages/diary-blind-tournament`, trasplante en `research/results/code-culture/transplant`. Script: `step3b-run.sh`.

## Respuesta

**Con el diario no cambia nada.** La predicción no se cumple.

| | con diario | sin diario | diferencia (pareada por linaje) |
|---|---|---|---|
| población g5–9 − `current` | −0.035 [−0.052, −0.019] | −0.038 [−0.055, −0.022] | +0.003 [−0.015, 0.023] |
| trasplante g9 − `current` | −0.013 [−0.044, 0.010] | −0.008 [−0.022, 0.000] | −0.004 [−0.039, 0.022] |

- **La selección se queda con el instinto.** En la generación 9, el texto mayoritario es el texto semilla en 6 de 10 linajes con diario y en 7 de 10 sin diario. Por eso el trasplante da 0,000 en la mayoría de linajes.
- **Ningún texto ciego supera claramente a `current`.** El mejor, del linaje 1 con diario, da +0,049 [−0,005, 0,118].

## Por qué (leyendo los textos)

**El diario sí llega al texto:** 35 de 312 textos comparan `n1` antes y después. Un ejemplo: "si con esta clase `n1` subió más de 5, fue una mala jugada".

**Pero el texto no sabe con qué opción evitarla.** En ciego, las acciones son `a1..a4` sin significado, y el diario solo registra usos de `a1` y `a2`. Ante una clase mala, el código típico cambia `a1` por `a2` (comer por probar), que sigue siendo comerla. Nunca elige `a4` (dejarla), porque nada le dice que `a4` no la usa.

Así que este ciego esconde dos cosas a la vez:
- lo que el modelo ya sabe de veneno y de probar, que es lo que se quería esconder;
- qué hace cada acción, que una hormiga sí sabe: dejar una fruta es no comerla.

Lo segundo hace imposible aprender a evitar algo, venga o no del diario.

## Qué sigue (propuesta)

**Un ciego justo:** describir cada opción por lo que hace, en términos neutros, sin las palabras "comida", "veneno", "comer" ni "probar":
- `a1`: usar el ítem entero;
- `a2`: usar una parte pequeña;
- `a3`: llevarlo a la base;
- `a4`: no usarlo.

Con el diario de la madre, si los linajes ciegos llegan a "no usar la clase con la que `n1` subió", lo encontrado viene de la vida y no del vocabulario.
