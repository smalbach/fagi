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

---

# Revisión 1: "qué comer"

Plan: `docs/research/plan-decision-adaptativa.md`, revisión 1. Mismos 40 mundos de desarrollo por familia (semillas 31000 + i, mapas 1800000 + 61 i, con especies), horizonte 2400 s. Datos: `research/results/adaptive-decision/food/`. Puerta: `node research/adaptive-decision/gate.js`.

## Qué se construyó

- **Punto de bocado** (`DECIDE.eat`, `src/decision/bite.js`): un juez dice qué hacer con el fruto que toca (comer, probar, llevar, dejar), qué ración sacar del nido, si comer lo que lleva y si vale la pena ir hacia un fruto. El juez `current` es la lógica de siempre movida ahí: con él, los 40 episodios conectados del paso 1b son idénticos (`verify-current.js`); apagado, los 80 del paso 1 también (`verify-off.js`). Común a todos: lo que un bocado hace al cuerpo, lo que siente, el tiempo de masticar, comer del nido solo con hambre.
- **Mundos** (`foodworlds.js`): el mapa experimental del paso 1 (seis especies con química de sabores, parecidos venenosos, estaciones). Familias: `stable`; `invert` (la química se da la vuelta entre 900 y 1500 s); `novel` (tres especies nuevas, un árbol cada una, en ese momento); `composition` reservada.
- **Jueces de referencia** (`judges.js`): privilegiado (sabe qué hace este fruto concreto, parecido incluido) e informado (conoce el mecanismo; solo usa si el hambre le subió tras cada bocado suyo).

## Resultado

Supervivencia media (0-1) por familia, 40 mundos:

| Juez | stable | invert | novel |
|---|---|---|---|
| `current` (referencia) | 0,833 | 0,736 | 0,825 |
| privilegiado | 0,973 | 0,978 | 0,967 |
| informado v1 | 0,773 | 0,760 | 0,753 |
| informado v2 | 0,840 | 0,823 | 0,809 |
| informado v3 | **0,953** | 0,809 | **0,922** |

La referencia queda lejos del techo (40-70 % vivas al horizonte) y sus muertes son veneno: se cumplen los requisitos de mundo del plan.

Diferencia pareada con `current` en las familias cambiantes (`invert` + `novel`, mismo peso, intervalo 95 % por remuestreo de mundos):

| Juez | Cambiantes | stable | invert | novel |
|---|---|---|---|---|
| privilegiado | **0,192 [0,097, 0,281]** | 0,140 | 0,241 | 0,142 |
| informado v3 | 0,085 [0,005, 0,162] | 0,120 | 0,072 [−0,028, 0,164] | 0,097 |

Versiones del informado, todas en desarrollo y sin tocar el mundo: v1 no arriesgaba nada con hambre alta y murió de hambre (15 de 40 en estable); v2 arriesga cuando ayunar mataría antes, pero come bocados enteros de especies que nunca probó; v3 prueba primero cada especie nueva con un bocado de prueba (`EXPERIMENT.portion`).

## Puerta

- **El privilegiado supera la puerta con holgura** (+0,19): en este dominio hay mucho margen.
- **El informado v3 no llega**: +0,085 con el intervalo por encima de cero, pero por debajo de 0,10. Además, casi toda su ventaja viene de probar con cautela, no de adaptarse al cambio: gana más en `stable` (+0,12) que en `invert` (+0,07, intervalo que incluye cero). Detectar la inversión de la química le funciona poco.
- Según el plan, "si solo gana el privilegiado, investigar observabilidad y memoria". Parte de la ventaja del privilegiado es inalcanzable por observación: los parecidos venenosos son idénticos a la vista, y solo el privilegiado los distingue antes de morder.
- Queda por decidir si esto cuenta como puerta cumplida (umbral práctico, no científico), si se afina una vez más la detección del cambio en el informado, o si se cierra el ciclo como el plan pide cuando la revisión también falla.
