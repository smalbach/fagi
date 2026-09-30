# Reglas de conducta, pasos 1 y 2: la gramática y si alcanza

Plan: `docs/research/plan-reglas-de-conducta.md`. Desarrollo en el grupo nuevo `dev2` (semillas 41000 + i, mapas 2100000 + 73 i), 40 mundos por familia, horizonte 2400 s. Datos: `research/results/adaptive-decision/food/dev2-*`. No es confirmatorio.

## Paso 1: lo construido

- **`src/learned/conduct.js`**, hermano de `dsl.js`. Se separó para no tocar las reglas actuales ni lo que las recorre (veredictos, mente nocturna, hermanas).
  - Una regla de conducta es un dato validado por `conduct()` e impreso como una línea de código que se relee sin `eval`:

    ```js
    conduct('taste-novel', {"if":{"novel":true,"hungerBelow":75},"do":"taste","weight":1,"tries":0,"stage":"long","learnedAt":0,"source":"born"});
    conduct('leave-harmed-mostly', {"if":{"harmedMostly":true},"do":"leave","weight":1,"tries":0,"stage":"long","learnedAt":0,"source":"born"});
    ```

  - Condiciones: `novel`, `harmed`, `harmedMostly` (la dañó al menos una vez y tantas veces como la alimentó), `hungerBelow` / `hungerFrom` en 45, 60, 75 o 90, y hasta tres rasgos de su aspecto.
  - Acciones: `taste`, `leave`, `eat`, `carry`.
  - Si hablan varias, gana la más prudente: `leave`, luego `taste`, luego `eat`, luego `carry`.
- **Tamaño del espacio:** 236 reglas posibles sin rasgos; con 9 rasgos conocidos, 31 196. Es lo que "descubrir" significará en el paso 3.
- **Registro propio de bocados** (con `CONDUCT` encendido): porción, si la especie era nueva para ella, si ya la había dañado, y hambre antes y después. Solo lo que sintió. De ahí sale lo que sabe de cada especie.
- **Juez `learned`** en el punto de bocado: su juicio de siempre y, encima, sus reglas de conducta vivas. En el nido una ración es entera: una regla `taste` allí la hace dejarla.
- **Verificado:**
  - Apagado, los 80 episodios del paso 1 del ciclo anterior son idénticos.
  - Con el juez `current`, los 40 del paso 1b también.
  - Sin ninguna regla, `learned` da exactamente los mismos 120 episodios que `current` en `dev2`.
  - Cinco pruebas en `test/conduct.test.js`.

## Paso 2: ¿puede la gramática expresar lo que funciona?

La heurística ganadora del ciclo anterior, escrita en esta gramática como líneas con las que nace:

| Juez | stable | invert | novel |
|---|---|---|---|
| `current` | 0,848 | 0,804 | 0,813 |
| heurística fija `1:75` | 0,936 | 0,823 | 0,897 |
| `learned` sin reglas | 0,848 | 0,804 | 0,813 |
| `learned` + 2 líneas (`taste-novel`, `leave-harmed-mostly`) | **0,932** | **0,823** | **0,911** |
| `learned` + 3 líneas (más `leave-novel-hungry` entre 75 y 90) | 0,930 | 0,821 | 0,909 |

Diferencias pareadas:

| | Familias cambiantes | stable |
|---|---|---|
| 2 líneas − `current` | +0,058 [−0,008, 0,125] | +0,084 [0,015, 0,157] |
| 2 líneas − heurística fija | +0,007 [−0,027, 0,045] | −0,004 |

**Puerta cumplida.** Las dos líneas rinden como la heurística fija (+0,007, dentro de ±0,02) y mejoran a `current`. La tercera línea no aporta. El lenguaje alcanza para expresar lo que funciona sin reescribir el juicio de Fagi: basta con dos líneas encima.

Advertencias:

- Con 40 mundos, el intervalo de la comparación con la heurística es de ±0,04. La puerta se leyó sobre la media, como estaba escrita.
- En `dev2` la ventaja de la heurística en las familias cambiantes es menor que en los grupos anteriores (+0,051): el efecto varía entre grupos de mundos.
- Estas líneas están escritas a mano. Que las escriba ella es el paso 3.
