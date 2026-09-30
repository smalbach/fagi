# Decisión adaptativa, paso 2: viabilidad de la batería

Plan: `docs/research/plan-decision-adaptativa.md`, paso 2. Mundos de desarrollo (semillas 31000 + i, mapas 1800000 + 61 i), 40 por familia, horizonte 2400 s. Datos: `research/results/adaptive-decision/battery/`, uno por carpeta con su `run.json`.

## Qué se construyó

- `worlds.js`: mapa sin química de especies (solo néctar, sin veneno), nido y agua de `generateMap`, 6 árboles alrededor del nido a 200-560 px, 2 ricos (dan todo el año) y 4 pobres (cosecha corta, descanso largo). Familias: `stable`, `resources` (los ricos se quedan pelados para siempre y los pobres pasan a dar todo el año), `cost` (barro que frena al 25 % alrededor de los ricos) y `composition`, reservada para el paso 4. El instante del cambio se sortea por mundo entre 900 y 1500 s y no se anuncia.
- Barro: `world.mud` en `src/movement.js`. Sin barro, las 80 huellas del paso 1 son idénticas.
- Opción `place` en el punto de decisión, para los controladores de referencia que saben más que ella.
- `battery.js` / `summarize.js`: runner reanudable y tabla rápida.

## Resultado: la referencia está en el techo con cualquier severidad probada

Referencia: la elección conectada (`choice`, paso 1b).

| Variante | Mundo | Supervivencia (3 familias) | Muertes | Comidas / raciones al nido |
|---|---|---|---|---|
| `cal-choice` | 6 árboles, 2 ricos, cosecha 6, descanso 400 s, manchas cada 300 s, despensa 12 | 0,992-1,000 | 1 (frío) de 120 | 5 / 21 |
| `cal-harsh` | 3 árboles, 1 rico, cosecha 3, descanso 900 s, sin manchas, despensa 4 | 1,000 | 0 | 4,5 / 11 |
| `cal-hunger4` | como `cal-choice`, hambre ×4 (`HUNGER.rate` 0,32) | 1,000 | 0 | 17 / 22 |
| `cal-harsh-h4` | `cal-harsh` y hambre ×4 | 1,000 | 0 | 17 / 13 |

## Por qué

Con este cuerpo, el hambre tarda ~1250 s en matar desde cero (`HUNGER.rate` 0,08, "una semana sin comer"), un néctar quita 35 puntos y la despensa guarda raciones de 30. Para vivir 2400 s basta con ~5-6 néctares, y un solo árbol da uno cada 8 s mientras tiene cosecha. Incluso con el mundo más duro probado y hambre ×4, encontrar comida de sobra no depende de elegir bien adónde ir. En el paso 1 las muertes eran por veneno (qué comer), frío y sed, no por dónde buscar.

## Puerta del paso 2

**No se cumple, y no puede cumplirse con esta batería.** La referencia llega viva al horizonte en ~100 % de los mundos, así que ningún controlador, ni siquiera el privilegiado, puede mejorarla 0,10 en supervivencia. No hizo falta construir los controladores privilegiado e informado para saberlo: su techo está a menos de 0,01. Tampoco se cumple el requisito de mundo del plan (20-70 % en el techo, muertes por hambre, sed o frío).

El plan permite una revisión documentada del diseño basada solo en referencias. Las direcciones posibles cambian qué afirma el ciclo, así que se dejan a decisión de la persona:

1. **Otra medida principal**: ritmo de comida obtenida o balance, en lugar de supervivencia. Mide la decisión de forrajeo directamente, pero deja de ser "sobrevivir mejor".
2. **Otro cuerpo**: hambre mucho más rápida (más de ×4) solo en la batería. Contradice el realismo del proyecto ("una semana sin comer").
3. **Otro dominio de decisión**: qué comer (especies, química que cambia; `changeChemistry` ya existe), dónde está el agua o cuándo refugiarse. Es donde ocurren las muertes; el plan fijaba el aprendizaje de alimentos como común, así que sería otro ciclo.
4. **Cerrar el ciclo** como prueba inadecuada para supervivencia, según el plan.
