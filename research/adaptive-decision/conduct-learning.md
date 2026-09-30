# Reglas de conducta, paso 3: que las escriba ella (desarrollo)

Plan: `docs/research/plan-reglas-de-conducta.md`, paso 3. Grupo `dev2`, 40 mundos por familia, los mismos del paso 2. Datos: `research/results/adaptive-decision/food/dev2-learn-v1` y `dev2-learn-v2`. No es confirmatorio.

## Lo construido (`src/learned/conduct-learn.js`)

1. **Proponer.** Tras cada bocado que la dañó, genera toda línea de la gramática que habría cambiado ese bocado:
   - condiciones sacadas del momento: especie nueva o ya dañina, su franja de hambre, un rasgo del aspecto;
   - acción: probar (si el bocado fue entero) o dejar.
2. **Filtro.** Repasa cada candidata sobre todos sus bocados registrados y la acepta si la habría dejado más lejos del tope de hambre. Pesa más lo cercano al tope: peligro = (hambre / tope)³. Además exige al menos 2 bocados dañinos que habría evitado y no empeorar lo que comió ya muy hambrienta.
3. **Adoptar.** Como mucho una línea por bocado dañino: la que más habría ayudado y, entre casi empates, la que dice menos.
4. **Revisar.** Tras cada bocado re-juzga sus líneas y retira las que dejan de compensar.

Es lo que el plan pedía, solo con lo que ella sintió. Cuatro pruebas en `test/conduct-learn.test.js`.

## Resultado: las dos variantes permitidas empeoran

| | stable | invert | novel | Cambiantes − `current` |
|---|---|---|---|---|
| `current` | 0,848 | 0,804 | 0,813 | — |
| 2 líneas escritas a mano (paso 2) | 0,932 | 0,823 | 0,911 | +0,058 |
| **v1**: cada bocado juzgado por separado | 0,790 | 0,717 | 0,740 | **−0,080** [−0,160, −0,004] |
| **v2**: el hambre como un stock que arrastra lo no comido | 0,803 | 0,711 | 0,761 | **−0,072** [−0,155, 0,003] |

Qué escribe (v2, 120 vidas, 324 líneas guardadas de 11 703 propuestas, 3 retiradas):

| Línea | Vidas |
|---|---|
| `leave-below45` ("con hambre < 45, no comas") | 70 |
| `leave-below60` | 57 |
| `leave-below75` | 39 |
| `leave-shape-round` | 36 |
| `leave-novel` ("no comas nada nuevo") | 31 |
| `leave-color-red` | 15 |

- Líneas de "probar": en 4 vidas de 120.
- De las 324 líneas: 191 hablan solo de su hambre, 106 de un rasgo, 37 de especie nueva y ninguna de especie que ya la dañó.

## Por qué

- **Muy pocos datos por vida.** La mediana es 9 bocados (entre 5 y 18). Con ~100 candidatas por bocado dañino y un mínimo de 2 a favor, casi cualquier línea sencilla encaja con su pasado por azar. Es un problema de comparaciones múltiples, no de mala suerte.
- **Lo simple se confunde con lo verdadero.** Por debajo de 45 de hambre solo muerde especies nuevas, así que "con hambre < 45, no comas" y "no comas lo nuevo" explican igual su pasado. El desempate por la más simple elige la de hambre, que luego bloquea comida buena.
- **Las líneas de dejar se sellan solas.** Una vez que deja algo, ya no lo muerde y nada puede contradecir la línea (3 retiradas de 324). La heurística fija tiene el mismo sesgo, pero nació con las dos líneas correctas.
- **Dejar le gana a probar en cada caso.** Frente a un bocado dañino, dejar evita todo el daño y probar solo tres cuartas partes. El valor de probar aparece a lo largo de muchas vidas (aprender barato qué especies alimentan), no en el repaso de un solo bocado. Por eso casi nunca escribe "prueba lo nuevo", que es la mitad de lo que funciona.
- **v2 corrigió lo que debía** (dejar comida ya no sale gratis), pero no cambió lo anterior: los problemas son de evidencia y de a qué atribuir el daño, no de cómo se valora.

## Lectura

Con estas dos variantes, **el paso 3 no se cumple**: dentro de una vida, con lo que ella siente, no descubre la regla que funciona y lo que escribe la empeora. El plan limita a dos variantes; no se ajusta más sin una decisión explícita.

Lo que sugieren los datos, para decidir:

- **Una vida no da para descubrir.** La lección necesita más bocados de los que vive una Fagi. Encaja con aprender entre vidas (paso 5 del plan: reglas que pasan de madre a cría o entre hermanas), donde muchas vidas suman evidencia.
- **Atribuir mejor.** Exigir más evidencia cuanto más candidatas compara, y preferir condiciones sobre la especie antes que sobre su hambre. Sería una tercera variante: una revisión del plan, no un ajuste.
- **Cerrar el paso 3 como negativo:** la gramática puede decir lo que funciona (paso 2), pero una vida no basta para escribirlo.
