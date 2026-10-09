# Plan: código que se hereda y se cuenta

Estado: propuesta de ejecución; no es un protocolo congelado. Paso 0 hecho en desarrollo (`research/code-culture/seeded.md`): la selección tiene fuerza; las líneas de cautela sembradas en 3 de 30 se fijan en 10 de 10 linajes (mediana del cruce del 50 %: generación 5) y "no comas nada nuevo" se elimina en 10 de 10. Paso 1 hecho (`research/code-culture/step1.md`): el texto semilla vive las mismas 120 vidas que `current`, y la cautela escrita como texto rinde como las líneas (+0,006); el texto puede traer también `wants`. Paso 2 hecho (`research/code-culture/step2.md`): con `qwen3.6` pasa la puerta (81–97 % de textos válidos, menos de 2 % de vidas con fallos); ningún juez escrito por el modelo supera a `current` de entrada (reescrito desde el diario: −0,06), pero mundo a mundo mejora en 22 de 97 y empeora en 31. Grupos `cdev`/`cconf` con semillas y mapas nuevos (los del plan chocaban). Paso 3 hecho (`research/code-culture/step3-resultados.md`): con torneo, el código evolucionado supera a `current` en mundos nuevos (+0,056 [0,019, 0,087]); la selección no se distingue del azar en el trasplante con vocabulario normal (+0,010), sí en ciego (+0,045) y en la población (+0,05). Lo útil (la cautela) aparece en 20 de 20 linajes con vocabulario normal y en 1 de 20 en ciego: lo trae el vocabulario del modelo, no la vida. Pasos 3b y 3c (`step3b-resultados.md`, `step3c-resultados.md`): con una regla arbitraria por linaje que solo se puede saber por lo vivido, 0 de 10 linajes la aprenden, con o sin el diario de la madre (3 de 421 reescrituras la escribieron y se perdieron). Se cierra la línea "el modelo reescribe desde la vida" con este operador; sigue el paso 4.
Referencia: commit `a5f71ab`. Registrar el commit efectivo al comenzar.

## La pregunta

> Cuando las Fagis escriben su propio código de conducta (con un modelo de lenguaje como operador de variación) y lo transmiten de madre a hija, ¿qué pasa si lo transmitido es solo el código (una **conclusión**), el código con las **razones** que lo justifican o el código con la **evidencia** vivida que lo respalda? ¿Caen los programas en las mismas trampas de mitos que las reglas cuando el mundo se invierte?

Une dos cosas que el proyecto ya tiene por separado:

- **Un resultado sólido.** Razones frente a conclusiones (`docs/research/results.md`): con un presupuesto igual, transmitir razones enseña mejor mientras el mundo se mantiene y, cuando se invierte, deja 22–27 puntos menos de supervivientes. Pasar la evidencia con las razones corta los mitos sin eliminarlos. Confirmado en el laboratorio (11 de 11) y en el juego (3 de 3).
- **Un objetivo pendiente.** Que Fagi reescriba su propio código. Hasta ahora lo que se reescribe es el orden de las líneas de un programa (`src/program/learn.js`) o la elección entre 236 reglas de una gramática fija (`src/learned/conduct.js`). Seis variantes de "que las escriba ella" quedaron por debajo de la Fagi actual (`research/adaptive-decision/conduct-lineages.md`).

Aquí el código deja de ser una gramática cerrada: es una función de JavaScript que un modelo reescribe, que se ejecuta aislada y que se hereda.

## Por qué es nuevo

Evolucionar programas con un modelo de lenguaje como operador de mutación ya existe (Lehman et al., 2022, *Evolution through Large Models*; Romera-Paredes et al., 2023, FunSearch; Novikov et al., 2025, AlphaEvolve; Zhang et al., 2025, Darwin Gödel Machine; Hu et al., 2024, ADAS). En todos esos trabajos el código evoluciona contra un evaluador fijo: un banco de pruebas o una función objetivo.

Aquí el código vive dentro de organismos que mueren, en mundos que cambian sin aviso, y pasa entre generaciones por un canal cultural cuyo formato se manipula de forma controlada. Que sepamos, nadie ha medido si la **forma** en que se transmite un programa (solo el código, con razones o con evidencia) decide si un linaje se adapta o queda atrapado en mitos. Fagi puede medirlo porque cada vida es determinista dado su código, cada creencia registra su origen y la pregunta ya tiene una línea base confirmada con reglas.

Antes de publicar hay que comprobar estas citas y buscar trabajo reciente sobre evolución cultural en poblaciones de modelos de lenguaje.

## Objetivo y límite de la afirmación

Demostrar en mundos nunca usados:

1. **Requisito.** Los linajes cuyo código evoluciona sobreviven al menos como `current`. Sin esto, comparar formatos de transmisión no dice nada sobre la auto-reescritura.
2. **Pregunta principal.** El formato de transmisión cambia la adaptación tras una inversión y la cantidad de mitos en el código, en la dirección que encontró el estudio de reglas (o en la contraria, que también es un resultado).

Límites, dichos desde ahora:

- **El modelo trae conocimiento previo.** "Prueba lo nuevo con un bocado pequeño" es sentido común para un modelo de lenguaje. Para separar descubrimiento de conocimiento previo hay un brazo ciego (paso 2) y la línea base sin vida (gen 0 sin evolución).
- **Lo que el juez puede saber lo fijamos nosotros**, igual que en `src/adaptive-decision/observation.js`. Lo que se libera es el cómputo, no la percepción.
- **Un modelo de lenguaje no es reproducible por sí solo.** Todo se reproduce desde el archivo de llamadas (paso 2), no volviendo a llamar al modelo.
- No demuestra AGI, consciencia ni comprensión.
- Si el código evolucionado no supera a `current`, se publica igual: dirá cuánto cuesta en este mundo que un modelo escriba conducta útil a ciegas.

## Qué existe ya

- **Punto de bocado** (`src/decision/bite.js`): un juez responde `ground`, `pantry`, `carried` y `wants`. `current` es el juicio de siempre.
- **Observación limpia** (`src/adaptive-decision/observation.js`): hambre, tope, edad, carga, despensa recordada, último bocado sentido y aspecto del fruto. Nada del mundo oculto.
- **Batería "qué comer"** (`research/adaptive-decision/foodworlds.js`): especies con química de sabores y parecidos venenosos; familias `stable`, `invert`, `novel` y `composition` (reservada).
- **Linajes** (`research/adaptive-decision/lineages.js`): K Fagis por generación, cada una en un mundo propio que no se repite; madre por selección o al azar.
- **Heurística de referencia** confirmada en el juego (`docs/research/caution-protocol.md`): `taste-novel` y `leave-harmed-mostly`.
- **Puente de la mente nocturna** (`scripts/night-llm-bridge.js`): servidor HTTP hacia Ollama, hoy limitado a proponer dentro de la gramática.
- **Medición de mitos** (`research/lab/truth.js`) y la estadística del estudio de reglas (`research/stats.js`: bootstrap, permutaciones pareadas, Holm, dz).
- **Filogenia** (`src/phylogeny.js`), para dibujar la historia del código por linaje.

## Diseño

### La unidad de código

Un **juez en código**: el texto fuente de una función

```js
function ground(obs, look, diary) { ... return 'eat' | 'taste' | 'carry' | 'leave'; }
```

- `obs`: lo de `observe(fagi)`. `look`: color, forma y olor del fruto (`lookOf`). `diary`: sus bocados propios como datos planos (aspecto, porción, hambre antes y después, si era nueva). Todo copiado y congelado: ninguna referencia viva.
- `pantry`, `carried` y `wants` siguen siendo los de `current` en este ciclo. Ampliarlo es otro ciclo.
- **Ejecución aislada** (`src/learned/code-judge.js`): `node:vm` en un contexto sin globales, sin `Math.random`, sin `Date` y sin E/S, con límite de tiempo por llamada y de tamaño del texto (`CODE.maxChars`). Todo error, tiempo agotado o respuesta fuera del conjunto cuenta como **fallo**: ese bocado lo decide `current` y el fallo queda registrado.
- **Determinismo.** Dado el texto y el mundo, la vida es idéntica byte a byte.
- Todo detrás de `CODE.enabled`, apagado por defecto: apagado, las huellas de `test/fixtures/decisions.json` no cambian.

### El operador de variación

Un modelo local fijo (Ollama; nombre, versión y hash de pesos registrados), con temperatura y semilla fijas, reescribe el juez:

- **Al nacer:** a partir de lo que la cría recibe de su madre, según el formato.
- **Cada noche** (o cada `CODE.reviseEvery` s en la batería sin ciclo): a partir de su propio diario. Sin esta revisión, una hija no tendría con qué corregir un mito heredado.

El modelo propone el texto completo de la función y una explicación corta. Si el texto no compila o no pasa las pruebas de forma (un caso por acción), se descarta y se queda el anterior; también se registra.

**Archivo de llamadas** (`research/code-culture/archive.js`): cada llamada se guarda con la clave hash(modelo, prompt, temperatura, semilla) y su respuesta. Repetir un experimento lee del archivo; el modelo solo se llama ante claves nuevas. Así una campaña se repite byte a byte sin el modelo encendido, y otra persona puede verificarla.

### Los formatos de transmisión

Los formatos copian los del estudio de reglas (`SOCIAL.format`), ahora sobre código. Todos igualados por **caracteres transmitidos** (`CODE.budget`), no por ítems, lo que resuelve una limitación que el estudio de reglas dejó escrita.

| formato | qué recibe la hija | análogo en reglas |
|---|---|---|
| `none` | el juez semilla, igual en todas; solo aprende de su vida | `none` |
| `code` | el código de su madre; el presupuesto entero puede ser código | `verdict` (conclusión) |
| `reasons` | el código con las razones que la madre escribió para cada rama ("los ácidos me dañaron") | `rule` (razones) |
| `evidence` | el código, sus razones y los bocados de la madre que las respaldan, como casos de prueba con fecha | `evidence` |

En `evidence`, la variación que propone el modelo para la hija debe seguir respetando los casos heredados que la hija no haya contradicho con su propio diario. Los casos que su vida contradice caen.

### El juez semilla

`current` reescrito como texto fuente en el lenguaje del juez. Requisito (paso 1): los mismos episodios que `current` en los 40 mundos de `verify-current.js`.

### Selección

Por torneo (T de la generación anterior; es madre la que más vivió), como en `docs/research/plan-evolucion-de-reglas.md`. Ablación: madre al azar, que deja solo la deriva y la variación.

### Mundos y cambio

- Linajes de K Fagis por generación, cada una en un mundo propio, rotando `stable`, `invert` y `novel`. La química del linaje **se invierte en la generación G/2**, igual que en el estudio de reglas, para medir la trampa.
- Grupos nuevos, nunca usados:
  - `cdev` (desarrollo): semillas 61000 + i, mapas 2800000 + 107 i.
  - `cconf` (confirmación): semillas 63000 + i, mapas 2900000 + 109 i.

  Comprobar antes de empezar que no chocan con ningún grupo existente.

### Mitos en código

Un programa es una caja negra, así que el mito se mide por su conducta (`research/code-culture/probe.js`). Al final de cada vida, el juez se interroga sobre el catálogo completo de aspectos del mundo vigente, con un diario vacío y hambre media:

- **Mito:** el juez rechaza (`leave`) un aspecto que en la química vigente alimenta y que su portadora nunca probó.
- **Error vivido:** lo mismo, pero con un aspecto que sí probó.
- **Exactitud equilibrada** sobre el catálogo, como en `research/lab/truth.js`.

Además, una medida de texto: cuántas ramas del código nombran rasgos (`look.color === ...`) y cuáles ya estaban en la madre.

## Pasos

### Paso 0. ¿La selección tiene fuerza? (puerta previa)

Es el paso 1 de `docs/research/plan-evolucion-de-reglas.md`, sin modelo de lenguaje: sembrar las dos líneas buenas en 3 de 30 Fagis de la generación 0 y comprobar si el torneo las extiende a más del 50 % en G generaciones, más rápido que la madre al azar. Y al revés: sembrar "no comas nada nuevo" y comprobar que la selección la elimina.

**Si no se cumple, se detiene el plan.** Ningún operador, por bueno que sea, se impone en un mundo que no selecciona. Se ajustan T y K, nunca el mundo.

### Paso 1. Juez en código, aislado

- `src/learned/code-judge.js`: compilación aislada, límites, fallos y reserva a `current`.
- `current` como texto semilla: mismos episodios que `current` (`verify-current.js`).
- La heurística de cautela escrita como texto: debe rendir como `caution` en `dev2` (diferencia dentro de ±0,02).
- Pruebas: un juez que lanza un error, que no termina, que devuelve algo inválido, que intenta `require` o `globalThis`, o que es demasiado largo. Con la bandera apagada, huellas idénticas.

Entregable: juez en código y sus pruebas.

### Paso 2. Operador y líneas base del modelo

- `research/code-culture/mutate.js` y `archive.js`.
- **Viabilidad del modelo**, en `cdev`, 40 mundos por familia:
  - tasa de textos válidos y de fallos en ejecución;
  - segundos por llamada; coste estimado de una campaña (con K = 12, G = 20 y 10 linajes son unas 2400 vidas por formato, más las revisiones nocturnas);
  - si una campaña supera las 12 h en esta máquina, se reducen K o los linajes antes de seguir, y se dice.
- **Línea base sin vida (`zero-shot`):** el modelo escribe el juez solo con la descripción del problema, sin ningún diario. Mide lo que el modelo ya sabe.
- **Brazo ciego (`blind`):** acciones, campos y rasgos con nombres neutros (`a1..a4`, `f1..fn`). Si `blind` evoluciona hacia lo mismo que el brazo normal, lo descubierto viene de la vida y no del vocabulario.
- Máximo dos versiones del prompt, registradas.

Puerta: menos del 10 % de fallos en ejecución y al menos el 80 % de textos válidos. Si no, se cambia de modelo (una vez, registrado) o se cierra el ciclo.

### Paso 3. ¿Evoluciona algo útil? (desarrollo, formato `code`)

- Linajes en `cdev`, sin inversión, formato `code`, torneo y madre al azar.
- Medir:
  - supervivencia por generación frente a `current`, la cautela escrita a mano y `zero-shot`, en los mismos mundos;
  - longitud del código, fallos por vida y ramas nuevas por generación;
  - si aparecen equivalentes de "probar lo nuevo" y "no volver a lo que dañó", medidos con `probe.js`.
- Mismo diseño en el brazo `blind`.

Puerta: las últimas 5 generaciones con torneo igualan o superan a `current` (cota inferior por encima de −0,03). Si no se cumple, la pregunta principal pierde sentido: se publica como negativo y se decide.

### Paso 4. Formatos e inversión (desarrollo)

- Los cuatro formatos en `cdev`, con inversión en G/2, torneo.
- Fijar aquí, con un máximo de dos configuraciones: `CODE.budget`, `CODE.maxChars`, T, K, G y la frecuencia de revisión.
- Medidas por linaje:
  - daño en el mundo estable (bocados dañinos por Fagi, generaciones antes de G/2);
  - supervivientes en la generación de la inversión;
  - mitos al final de esa generación;
  - generaciones hasta recuperar la supervivencia previa.
- Informe de desarrollo con ejemplos de código legibles: qué rama nació, en qué generación y cómo se propagó, dibujado con `src/phylogeny.js`.

### Paso 5. Confirmación

Protocolo congelado en un commit antes de ejecutar ningún mundo de `cconf`. Una sola campaña. Unidad de análisis: el linaje. Pruebas pareadas por permutación, Holm sobre todas las hipótesis.

- **H0 (requisito):** con `code` y torneo, las últimas generaciones antes de la inversión sobreviven más que `current` en los mismos mundos (unilateral).
- **H1:** `reasons` enseña mejor que `code` en el mundo estable (menos bocados dañinos por Fagi).
- **H2:** `reasons` deja menos supervivientes que `code` en la generación de la inversión.
- **H3:** `reasons` lleva más mitos que `code` a la inversión.
- **H4a:** `evidence` lleva menos mitos que `reasons`.
- **H4b:** `evidence` deja más supervivientes que `reasons` en la inversión.

Las direcciones se fijan con lo visto en el paso 4 y se escriben antes de confirmar. Si el paso 4 apunta en sentido contrario al estudio de reglas, se preregistra esa dirección y se dice.

Descriptivo, sin hipótesis: `blind` frente al brazo normal, distancia a la cautela escrita a mano y qué ramas concretas se fijaron.

**Trasplante:** el código mayoritario al final de cada linaje, puesto como juez de nacimiento en mundos nuevos frente a `current`, para saber si sirve fuera de su linaje.

Tamaño: lo que pida la dispersión del paso 4 para el 80 % de potencia, calculado con `research/stats.js`.

### Paso 6. En el juego (condicionado)

Si H0 se cumple:

- En el panel de código aprendido, el juez en código con su diff por generación y su origen (`born`, `night`, `told`).
- Un protocolo propio, como el de la cautela, antes de que el juego nazca con código evolucionado en lugar del escrito a mano.

## Riesgos que ya se ven

- **El modelo ya sabe la respuesta.** Por eso existen `zero-shot` y `blind`. Si `zero-shot` iguala a lo evolucionado, la afirmación cambia: el modelo aporta conocimiento previo, no la vida. Es publicable, pero es otra afirmación.
- **Modelo pequeño, código malo.** La puerta del paso 2 lo detecta antes de gastar campañas.
- **Código que crece sin control.** Lo frenan `CODE.maxChars` y el presupuesto. Se informa la longitud por generación.
- **Selección débil.** El paso 0 lo comprueba antes que nada.
- **Coste.** Se mide en el paso 2. El archivo evita pagar dos veces la misma llamada.
- **Seguridad.** El código generado nunca se ejecuta fuera del contexto aislado; nada del texto generado llega a `eval`, a `Function` en el contexto principal ni a la red.
- **Mitos mal medidos.** El sondeo con diario vacío mide lo que el juez haría sin experiencia propia, que es exactamente lo que hereda una cría. Se informa también el sondeo con el diario real.

## Gestión

- Primera entrega: paso 0. Si la selección no extiende lo bueno sembrado, el resto no se construye.
- Registro breve de hipótesis y decisiones, como en los ciclos anteriores.
- Sin funcionalidades nuevas del juego mientras dure el ciclo, salvo las que pide el paso 6.

## Antecedentes

- Evolución con modelos de lenguaje como operador: Lehman et al. (2022), Romera-Paredes et al. (2023), Hu et al. (2024), Novikov et al. (2025), Zhang et al. (2025).
- Bibliotecas de habilidades en código escritas por un agente: Wang et al. (2023), Voyager.
- Evolución cultural y transmisión: Boyd y Richerson (1985); el informe `reports/Razones frente a conclusiones culturales.md`.
- Instinto frente a aprendizaje: Hinton y Nowlan (1987).

La contribución buscada es la manipulación controlada del formato de transmisión de programas en una ecología no estacionaria, con una línea base confirmada con reglas, y no reclamar novedad sobre esos trabajos.
