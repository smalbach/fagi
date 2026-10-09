# Cierre de la Fase 3: por qué las baterías salen parejas (2026-10-03)

Diagnóstico pedido por el usuario tras H2d: "estamos dando muchas vueltas y el resultado es prácticamente el mismo". Código `ae9304d`. Exploratorio, no preregistrado.

## Respuesta

**El mundo no le exige nada, así que ningún mecanismo de selección de acción puede distinguirse por sus consecuencias.** Cambian el estilo de la conducta, no su resultado. Y ninguno de ellos mueve la autoría de la conducta hacia Fagi, que es el fin del proyecto. La Fase 3 se cierra con H2–H2d como resultado nulo; el juego sigue con `program`.

## Evidencia

1. **Sobra comida.** En el mapa 42 el árbol suelta una fruta cada 8 s (~450 por hora) y Fagi come ~7,5. Come cuando el hambre lo pide, no cuando encuentra. En H1/H5, H2–H2d y H6 viven todas o casi todas.
2. **La conducta cambia; el resultado no.** H2d, reparto del tiempo (`program` · `selector` · `selector+seq`):
   - explorar 34,5 · 26,0 · 23,3 %;
   - buscar comida 3,1 · 12,2 · 15,6 %;
   - frutas comidas 7,47 · 7,50 · 7,50; vivas 40 · 40 · 40.

   Las medidas de Tyrrell miden ese estilo (cambios por minuto, titubeo), con diferencias de centésimas.
3. **Las nulas de H3b y H7 tienen la misma raíz**, ya escrita en sus notas: no había qué priorizar (H3b) y la trampa de ruido no existía (H7). Se construyó un mecanismo para un problema que este mundo no tiene.
4. **Sondeo de escasez** (`escasez-sondeo.sh`, datos en `escasez-sondeo.json`; 16 vidas de 3600 s por celda, semillas 9100–9115, mapa 42; `selector` = `selector+seq` de H2d):

| una fruta cada | `program`: vivas · come | `selector`: vivas · come |
|---|---|---|
| 8 s (base) | 16/16 · 7,4 | 16/16 · 7,4 |
| 60 s | 16/16 · 6,6 | 16/16 · 7,4 |
| 150 s | 16/16 · 6,3 | 16/16 · 7,2 |
| 300 s | 16/16 · 5,5 | 16/16 · 5,6 |
| 300 s, vidas de 14 400 s | 16/16 | — |
| 900 s | 0/16 (15 de hambre, 1 de frío) | — |
| base con `--world-varies` | 16/16 · 7,4 | — |

   - **La supervivencia es un precipicio** entre 300 y 900 s: no hay zona intermedia donde un mecanismo mejor se note.
   - **Con escasez aparece la primera diferencia de resultado:** el selector come ~0,9 frutas más a 60 y 150 s. Sin IC ni preregistro: es una pista, no un hallazgo.

## Lectura

- Un mundo con presión es necesario para que haya algo que aprender, no para maximizar la supervivencia: el proyecto juzga por realismo (`goal-realism-not-survival`).
- La batería "qué comer" de los ciclos anteriores (especies, veneno, inversión; supervivencia ~0,84) sí tiene presión, y el paso 0 del plan C ya mostró allí que la selección tiene fuerza (`research/code-culture/seeded.md`, rama `research/codigo-cultural`).

## Decisión

Volver a la línea de autoría: el plan C (`docs/research/plan-codigo-cultural.md`), empezando por su paso 1 (juez en código, aislado). Las fases de LIBERA quedan como base: el juego no cambia.
