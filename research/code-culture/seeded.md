# Paso 0: ¿la selección tiene fuerza?

Datos: `research/results/code-culture/seeded`. Generado por `research/code-culture/seeded-analyze.js`.

## Siembra buena: `taste-novel`, `leave-harmed-mostly`

10 linajes × 20 generaciones × 30 Fagis; 3 portadoras en la generación 0; torneo de 3. Generaciones completas: torneo 20, azar 20.

Fracción portadora por generación (media de linajes):

| | g0 | g1 | g2 | g5 | g10 | g15 | g19 |
|---|---|---|---|---|---|---|---|
| torneo | 0.100 | 0.173 | 0.273 | 0.657 | 0.923 | 0.973 | 1.000 |
| azar | 0.100 | 0.127 | 0.127 | 0.173 | 0.170 | 0.103 | 0.090 |

Al final, por linaje:

| | > 50 % | fijada (100 %) | perdida (0 %) | cruzó 50 % alguna vez | mediana de la generación del cruce |
|---|---|---|---|---|---|
| torneo | 10/10 | 10/10 | 0/10 | 10/10 | 5 |
| azar | 0/10 | 0/10 | 7/10 | 1/10 | 18 |

Frecuencia media a lo largo de las generaciones, torneo − azar (pareado por linaje): 0.625 [0.516, 0.720], p 0.001, dz 3.551.

Diferencial de selección (descriptivo): las portadoras viven 0.085 [0.063, 0.110] más que el resto de su generación (supervivencia 0-1, 93 generaciones con ambas).

## Siembra mala: `leave-novel`

10 linajes × 20 generaciones × 30 Fagis; 3 portadoras en la generación 0; torneo de 3. Generaciones completas: torneo 20, azar 20.

Fracción portadora por generación (media de linajes):

| | g0 | g1 | g2 | g5 | g10 | g15 | g19 |
|---|---|---|---|---|---|---|---|
| torneo | 0.100 | 0.023 | 0.007 | 0.000 | 0.000 | 0.000 | 0.000 |
| azar | 0.100 | 0.127 | 0.127 | 0.173 | 0.170 | 0.103 | 0.090 |

Al final, por linaje:

| | > 50 % | fijada (100 %) | perdida (0 %) | cruzó 50 % alguna vez | mediana de la generación del cruce |
|---|---|---|---|---|---|
| torneo | 0/10 | 0/10 | 10/10 | 0/10 | — |
| azar | 0/10 | 0/10 | 7/10 | 1/10 | 18 |

Frecuencia media a lo largo de las generaciones, torneo − azar (pareado por linaje): -0.127 [-0.193, -0.063], p 0.002, dz -1.124.

Diferencial de selección (descriptivo): las portadoras viven -0.229 [-0.271, -0.184] más que el resto de su generación (supervivencia 0-1, 17 generaciones con ambas).

## Puerta

- Siembra buena: **se cumple** (10/10 linajes por encima del 50 % con torneo; frecuencia media 0.759 frente a 0.134 al azar).
- Siembra mala: **se cumple** (10/10 linajes la perdieron con torneo).

## Lectura

Escrita a mano tras el análisis. Desarrollo, no confirmatorio.

- **La selección tiene fuerza en este mundo.** Las dos líneas de cautela, sembradas en 3 de 30, se fijan en los 10 linajes con torneo (mediana del cruce del 50 %: generación 5; 100 % en la 19). Con madre al azar se pierden en 7 de 10. "No comas nada nuevo" desaparece en los 10 linajes con torneo antes de la generación 5.
- **El diferencial lo explica:** las portadoras de la cautela viven +0,085 más que sus hermanas de generación; las de la prohibición, −0,229. Con torneo de 3, eso basta.
- **La población mejora al fijarse lo bueno:** supervivencia media 0,841 en la generación 0 y 0,901 en la 19 con torneo; con madre al azar se queda en 0,839.
- **Más rápido de lo estimado** en `plan-evolucion-de-reglas.md` (10-20 generaciones): la mediana fue 5.
- Nota: con madre al azar, las siembras buena y mala dan la misma genealogía (mismos sorteos, que no dependen de quién vivió), así que su frecuencia coincide. Es lo esperado: es la deriva sola.

## Qué sigue

La puerta del paso 0 se cumple. Según `docs/research/plan-codigo-cultural.md`, sigue el paso 1: el juez en código aislado (`src/learned/code-judge.js`), con `current` como texto semilla que reproduzca sus episodios.
