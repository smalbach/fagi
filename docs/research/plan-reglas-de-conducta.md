# Plan: que Fagi escriba sus propias reglas de conducta

Estado: propuesta de ejecución; no es un protocolo congelado. Pasos 1 y 2 hechos en desarrollo (`research/adaptive-decision/conduct-grammar.md`): la gramática expresa la regla ganadora con dos líneas que rinden como la heurística fija. Siguiente: paso 3.
Referencia inicial: commit `96cba62` (cierre del ciclo de decisión adaptativa). Registrar el commit efectivo al comenzar.

## De dónde sale

El ciclo anterior (`docs/research/plan-decision-adaptativa.md`, `research/adaptive-decision/conclusion.md`) encontró qué la salva al decidir qué comer: probar lo nuevo con un bocado pequeño y no volver a una especie que la dañó, aunque otras veces le sentara bien. Esa regla la escribimos nosotros, fija, y ganó.

La idea de este ciclo es que **esas reglas salgan de ella**: que Fagi, a partir de lo que vive, escriba, revise y retire líneas de su propia conducta, igual que ya escribe líneas sobre qué es bueno o malo.

## Qué existe ya

- **Reglas que escribe ella** (`src/learned/dsl.js`, `synth.js`, `rules.js`): líneas de código real (`rule('avoid-smell-sour', {...})`), validadas por `rule()`, que se refuerzan, se debilitan, se retiran y pasan entre hermanas. Solo dicen **qué**: evitar o preferir una especie o unos rasgos, para comer, guardar o perseguir.
- **Hábitos** (`src/habits.js`): números de su conducta que un susto mueve un peldaño hacia la prudencia y una pérdida hacia la audacia.
- **Mente nocturna** (`src/night/`): de noche un modelo (local o remoto) propone reglas; un filtro (`trial`) las prueba contra su propia memoria y solo guarda las que mejorarían cómo juzga lo que ya vivió.
- **Punto de bocado** (`DECIDE.eat`, `src/decision/bite.js`): un juez decide comer, probar, llevar o dejar cada fruto. `current` es su juicio de siempre.
- **Batería "qué comer"** (`research/adaptive-decision/foodworlds.js`): especies con química de sabores y parecidos venenosos; familias estable, química invertida y especies nuevas; composición reservada.

## Qué falta

1. **Gramática de conducta.** Hoy una regla no puede decir "lo nuevo, pruébalo primero" ni "lo que me dañó una vez, no lo como más". Son reglas sobre **cómo** actuar según su estado y lo que sabe de una especie.
2. **Memoria de bocados suficiente.** El registro de bocados (`brain.bites`, `learned/explain.js`) guarda especie, hora y recompensa. Para juzgar una regla de conducta hace falta, por bocado, si la especie era nueva para ella, qué porción fue y cómo estaba su hambre antes y después.
3. **Quién propone y cómo se prueba.** Un generador de propuestas a partir de su experiencia, y un filtro contrafactual sobre su memoria que diga si la regla la habría dejado mejor.

## Objetivo y límite de la afirmación

Demostrar que Fagi **descubre por sí misma** reglas de conducta al comer, las escribe como líneas de su código, las revisa con lo que vive, y que con ellas sobrevive más que con su juicio actual.

Límites, dichos desde ahora:

- Descubre **dentro de una gramática que escribimos nosotros**. Lo fijo se desplaza de la regla al lenguaje. Se informará cuántas reglas posibles admite la gramática, para que "descubrir" tenga su tamaño real.
- No es generación libre de código ni evolución abierta. No demuestra AGI.
- Si no descubre nada útil, o solo lo que era obvio en la gramática, es un resultado válido y se publica igual.

## Alcance

- Un individuo, sin reproducción; la transmisión entre vidas queda para una fase posterior condicionada (paso 5).
- Solo decisiones de comer, en el punto de bocado. "Adónde ir" sigue con la elección conectada, como en la batería anterior.
- Motor, cuerpo y mundos del ciclo anterior. Sin cambios visuales en este ciclo, salvo que las reglas nuevas se vean en el panel de código aprendido como las demás.
- Todo detrás de banderas apagadas por defecto. Apagado, Fagi es la misma: mismas huellas.
- Sin LLM en la evaluación. El respaldo remoto de la mente nocturna se puede probar aparte, nunca en la confirmación, porque no es reproducible.

## Paso 1. Gramática de conducta y memoria de bocados

Trabajo:

1. **Registro de bocados ampliado.** Por bocado propio: especie, hora, porción, si era la primera vez que la comía, hambre antes y después, y si la especie ya la había dañado antes. Solo lo que ella sintió o sabe; nada del fruto real.
2. **Reglas de conducta** (hechas en `src/learned/conduct.js`, hermano de `dsl.js`, para no tocar las reglas actuales), validadas por `conduct()` e imprimibles como una línea:

   ```js
   rule('probar-lo-nuevo', { kind: 'conducta', si: { nueva: true, hambreBajo: 75 }, hacer: 'probar', ... })
   rule('no-perdonar-dano', { kind: 'conducta', si: { danoAlgunaVez: true }, hacer: 'dejar', ... })
   ```

   - Condiciones: `nueva` (nunca la comió), `danoAlgunaVez`, `hambreBajo` / `hambreDesde` con valores de una escalera corta (45, 60, 75, 90), y opcionalmente rasgos de su aspecto (como las reglas actuales).
   - Acciones: `probar`, `dejar`, `comer`, `llevar`.
   - Mismos campos de vida que las reglas actuales: peso, pruebas, a favor y en contra, etapa, retirada, de dónde vino.
3. **Aplicación.** Un juez `learned` en el punto de bocado: su juicio actual, y encima sus reglas de conducta vivas, que lo sustituyen cuando se cumplen. Orden de prioridad documentado (`dejar` antes que `probar`, y así).
4. **Tamaño del espacio.** Contar cuántas reglas distintas admite la gramática con esos valores. Se publica con los resultados.

Pruebas: una regla mal formada se rechaza con motivo legible; una regla se imprime y se relee igual; sin reglas de conducta, `learned` da las mismas huellas que `current`; bandera apagada, las mismas que el paso 1b.

Entregable: gramática, registro y juez `learned`, con sus pruebas.

## Paso 2. ¿Puede la gramática expresar lo que funciona?

Antes de pedirle que descubra nada, comprobar que el lenguaje alcanza.

- Escribir a mano, en la gramática, las dos reglas de la heurística ganadora y cargarlas al nacer.
- Medir en mundos de desarrollo nuevos del grupo `dev2` (40 por familia) frente a `current` y frente a la heurística fija (`heuristic:1:75`).

Puerta: las reglas escritas en la gramática rinden como la heurística fija (diferencia dentro de ±0,02) y mejoran a `current`. Si no, corregir la gramática o su aplicación. Nunca el mundo.

## Paso 3. Que las descubra ella

Un proponente y un filtro, con su propia memoria como único material.

1. **Propuestas desde su experiencia.** Tras cada bocado que la dañó, y cada noche, generar candidatas dentro de la gramática que habrían cambiado lo que hizo en ese bocado. Por ejemplo: "era nueva y la comí entera" lleva a `probar` cuando es `nueva`; "ya me había dañado" lleva a `dejar` cuando hubo `danoAlgunaVez`. La mente nocturna local amplía su gramática de propuestas con estas reglas.
2. **Filtro contrafactual sobre su memoria.** Para cada candidata, repasar sus bocados registrados y estimar qué habría pasado con la regla:
   - `probar` escala el daño y el alimento a la porción de prueba;
   - `dejar` quita el daño y también la comida.

   Aceptarla si la deja mejor, con al menos N bocados a favor y sin empeorar el balance cuando el hambre estaba alta. Los umbrales se fijan antes de ajustar.
3. **Vida de la regla.** Entra con confianza baja; cada bocado nuevo que cubre la refuerza o la contradice con el mismo cálculo; se retira si deja de compensar. Igual que sus reglas actuales.
4. **Una sola regla de exploración** para cuándo proponer, documentada. Nada de detectores por escenario ni conocimiento del mecanismo del mundo.

Medir en `dev2`:

- supervivencia;
- **tasa de descubrimiento**: en qué parte de las vidas escribe cada regla útil, y cuándo;
- reglas escritas que resultan dañinas;
- reglas retiradas y por qué.

Ablaciones de desarrollo:

- sin filtro (acepta toda propuesta);
- sin retirada;
- solo propuestas nocturnas o solo diurnas.

Máximo dos variantes del proponente y el filtro en este ciclo; registrar la descartada.

Entregable: prototipo aislado e informe de desarrollo, con ejemplos legibles de reglas que escribió y de su vida.

## Paso 4. Validación y confirmación

- **Grupos nuevos, sin solapamiento con el ciclo anterior:** `dev2` (desarrollo), `val2` (validación, 40 por familia), `conf2` (confirmación, N fijado por cálculo de potencia, techo 300 por familia y juez). Semillas y mapas nunca usados.
- **Jueces:**
  - `current`;
  - `learned` (la variante elegida en validación);
  - heurística fija `heuristic:1:75`;
  - `learned` sin filtro (ablación).
- **Hipótesis confirmatorias**, fijadas antes de ejecutar `conf2`:
  1. `learned` sobrevive más que `current` en las familias cambiantes y en la composición reservada (mejora media de al menos 0,05, unilateral, Holm).
  2. `learned` escribe por sí misma al menos una regla de conducta útil en la mayoría de las vidas que llegan a comer una especie nueva. Útil se define antes: la que el análisis con la verdad oculta, solo del analista, califica como beneficiosa.
  3. El filtro importa: `learned` sobrevive más que su versión sin filtro.
  4. Descriptivo, no confirmatorio: distancia a la heurística fija. Aprender cuesta bocados, y se espera que quede por debajo de una regla que ya nace sabida; se informa cuánto.
- **Criterios de aceptación y tabla de resultados** como en el ciclo anterior: integrar si 1 y 2 se cumplen con coste aceptable (tiempo por segundo simulado de a lo sumo 1,5 veces el de `current`, tamaño del registro); inconcluso si los intervalos no deciden; retirar si empeora.
- Protocolo congelado en `docs/research/reglas-de-conducta-protocol.md` con análisis escrito antes de la campaña. Una sola campaña por versión.

## Paso 5. Condicionado: que pase de una vida a otra

Solo si el paso 4 se cumple. Las reglas de conducta ya caben en la transmisión existente (`source: born | told | saw`). Medir en colonias con generaciones si una regla descubierta por una se extiende, si las crías que nacen con ella sobreviven más que las que tienen que descubrirla, y si una regla equivocada puede volverse mito (el registro de mitos de `scripts/batch/run.js` ya existe). Es otra pregunta, con su propio protocolo.

## Riesgos que ya se ven

- **Aprender cuesta.** La regla fija actúa desde el primer bocado; ella necesita dañarse antes de saber. En vidas cortas puede no compensar. Por eso la comparación con la heurística es descriptiva y la hipótesis principal es contra `current`.
- **Pocas pruebas por vida.** Unos 20-30 bocados. El filtro tiene que decidir con poca evidencia: umbrales bajos llevan a reglas falsas, altos a no descubrir nada. Se ajustan en desarrollo y se congelan.
- **Reglas que matan de hambre.** "Dejar todo lo nuevo" evita veneno pero deja sin comida. El filtro cuenta la comida perdida; hay que comprobar que lo haga bien cuando el hambre está alta.
- **Descubrir lo que ya estaba escrito.** Con una gramática pequeña, las reglas útiles son pocas y obvias. Se publica el tamaño del espacio y cuántas candidatas distintas propuso y descartó.

## Gestión del trabajo

- Primera entrega: pasos 1 y 2. No empezar el proponente hasta que la gramática pase su puerta.
- Segunda entrega, condicionada: paso 3.
- Tercera, condicionada: paso 4 y decisión explícita de integrar, simplificar, descartar o declarar inconcluso.

Registro breve de hipótesis, evidencia y decisiones, como en el ciclo anterior. No abrir otras líneas mientras tanto.

## Antecedentes

Aprender reglas simbólicas de la experiencia y probarlas antes de adoptarlas tiene historia: sistemas clasificadores (Holland, 1986), programación lógica inductiva (Muggleton, 1991) y el aprendizaje de aversiones gustativas en animales que el proyecto ya cita (Garcia y Koelling, 1966). La contribución buscada es demostrar el mecanismo en Fagi, medido, no reclamar novedad sobre esos trabajos.
