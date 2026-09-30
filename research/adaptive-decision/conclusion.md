# Decisión adaptativa: conclusión del ciclo

Plan: `docs/research/plan-decision-adaptativa.md`. Protocolo congelado: `docs/research/adaptive-decision-protocol.md` (commit `56096ba`). Resultado confirmatorio generado: `confirmation.md`. Datos por episodio: `research/results/adaptive-decision/food/confirmation.csv`. Escrita a mano tras el análisis congelado.

## Qué se confirmó (300 mundos nuevos por familia y juez)

- **La cautela aprendida mejora a Fagi actual.** `model-fixed` sobrevive más que `current` en las familias cambiantes (+0,056 [0,024, 0,089], p Holm 0,001) y en la composición reservada, nunca ejecutada antes (+0,074 [0,039, 0,112]). No pierde en el mundo estable (+0,070; cota inferior 0,039 > −0,03). Cuesta lo mismo (1,03 veces el tiempo; modelo de a lo sumo 1,3 kB).
- **Pero una heurística más simple lo hace mejor.** La elegida en validación, "una especie que dañó una vez queda descartada; lo nuevo se prueba con un bocado pequeño si el hambre está por debajo de 75", supera a `model-fixed` en todas las familias: −0,030 [−0,050, −0,012] en las cambiantes, −0,030 en la composición. En validación empataban (+0,068 cada uno); con 300 mundos la diferencia aparece, y va en contra.
- **Planificar dos decisiones no aporta.** `model-fixed` frente a su versión de horizonte 1: −0,004 [−0,018, 0,011].

Criterios del protocolo: 1 ✗, 2 ✗, 3 ✓, 4 ✗, 5 ✓. Según la tabla del plan: **preferir la alternativa simple; el modelo no se integra**.

## Qué dice y qué no

- La afirmación que queda es modesta y está medida: **en mundos con química de sabores, probar lo desconocido con cautela y no volver a lo que dañó mejora la supervivencia de Fagi** respecto a su juicio actual. Lo hace el juez con modelo y lo hace, algo mejor, una regla de dos líneas.
- Descriptivo, no confirmatorio (no era hipótesis del protocolo): la heurística frente a `current` gana +0,086 [0,055, 0,119] en las cambiantes, +0,104 en la composición y +0,107 en el estable.
- No se apoya: adaptación específica al cambio (las ganancias son iguales o mayores en el mundo estable), planificación de secuencias, ni ninguna afirmación sobre AGI u originalidad. El modelo aprende de sus bocados y generaliza por el aspecto, pero en este mundo esa generalización no vence a descartar tras un mal bocado.
- Por qué pierde el modelo frente a la heurística, a la vista de las muertes (1200 vidas por juez): el modelo muere más por veneno (333 frente a 229) porque una especie con un mal bocado y varios buenos sigue pareciéndole aceptable, que es justo el patrón de los parecidos venenosos; la heurística la descarta al primer daño y paga en hambre (52 muertes frente a 4) mucho menos de lo que ahorra en veneno.

## Qué queda

- Nada se integra en el juego por este ciclo: el punto de bocado (`DECIDE.eat`) y el punto de decisión (`DECIDE`) siguen apagados por defecto y, apagados, Fagi es la misma.
- Si se quisiera llevar al juego lo que funciona, la candidata es la heurística simple, y necesitaría su propio protocolo de confirmación frente a `current`; no se deduce de este.
- Las revisiones del ciclo quedan documentadas: la batería de "dónde buscar" no distinguía nada (`viability.md`); la de "qué comer" sí; la puerta de viabilidad se dio por cumplida por decisión explícita con el informado en +0,085; la hipótesis pasó de "modelo con planificación y adaptación" a "cautela aprendida" antes de ver validación.
