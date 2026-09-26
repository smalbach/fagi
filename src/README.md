# Cómo está organizado

Un archivo por responsabilidad. Nadie sabe más de lo que necesita: `movement.js`
mueve pero no decide, `decision.js` decide pero no dibuja, `render.js` dibuja
pero no toca el estado.

## El bucle

`main.js` solo tiene el bucle: `step()` → `render()` → HUD → consola.
`simulation.js` es el turno del mundo, en orden: viento → árboles → fruta →
estelas → feromona → Fagi.

## Fagi

| archivo | de qué se ocupa |
|---|---|
| `fagi.js` | la define y ordena su turno. Nada más |
| `needs.js` | hambre, sed, energía: subir, bajar, morir |
| `perception.js` | qué ve y qué huele, todo junto en una lista puntuada |
| `decision.js` | reglas en orden de prioridad; la primera que contesta manda |
| `movement.js` | girar, avanzar, esquivar, explorar, rastrear un olor |
| `explore.js` | el mapa basto de por dónde ha pasado y hacia dónde tirar |
| `feeding.js` | comer o cargar |
| `nest.js` | depositar, tirar de despensa, descansar |
| `brain.js` | puntuación de lo que percibe, y la puerta única de todo aprendizaje |
| `interoception.js` | el cuerpo se siente: comparar cómo estaba antes con cómo está después |
| `episodes.js` | una experiencia desde que empieza hasta que se sabe cómo acabó |
| `learned/` | el código que Fagi escribe sola a partir de lo que aprende (ver abajo) |
| `observation.js` + `backend/` + `cortex.js` | la API de decisión externa (ver abajo) |

Las reglas de `decision.js` son una jerarquía escrita en orden, y sale toda de
la única directiva, sobrevivir:

1. **sobrevivir ahora** — beber, calmar hambre o sed, tirar de despensa;
2. **aguantar** — descansar, porque sin fuerzas no se sobrevive luego;
3. **proveer** — llevar al nido lo que ahora no necesita, y perseguir lo que ve;
4. **explorar** — sin necesidad, sin pistas y con la despensa hecha, conocer el
   mapa es lo único que prepara las tres anteriores.

Para añadir una conducta nueva basta con una función más en la lista `REGLAS`,
en el escalón que le toque. Devuelve una intención o `null`.

Ya no hay ningún escalón que decida "esto es bueno" o "esto es malo": eso lo
decide `learned/rules.js` (`verdict()`), consultado desde `feeding.js`,
`nest.js` y aquí mismo. **Añadir un peligro o una ayuda nueva es solo física**:
un `POINT_TYPES` con su `hunger` y sus `effects`, nada más. Fagi no sabe si es
buena o mala hasta que la prueba; lo aprende y lo escribe sola.

### Cómo aprende (lo que antes era "brain.js es lo único que aprende")

1. **Comer o beber abre un episodio** (`episodes.js`) con una foto de cómo
   estaba el cuerpo antes.
2. **El cuerpo se siente** (`interoception.js`): comparar esa foto con la de
   después da una recompensa de -1 a +1, de deltas reales — hambre, sed,
   multiplicadores de stats — nunca de un número escrito a mano en la config.
   Si el bocado sale mal más tarde (la necesidad que venía a calmar acaba
   crítica) o Fagi muere con él encima, el episodio se corrige aparte, en
   diferido.
3. **`memory.js` aprende** con esa recompensa: valor + confianza, igual que
   siempre.
4. **`learned/synth.js` sintetiza**: si el peso de la creencia cruza un
   umbral, escribe (o revisa, o retira) una regla en `learned/rules.js`, con
   histéresis para no parpadear. La memoria sigue siendo la única fuente de
   verdad del valor; la regla es la capa simbólica — existencia, alcance,
   explicación.
5. **`learned/dsl.js`** es la gramática de esa regla: un objeto de datos que
   se imprime como una línea de JavaScript real (`rule('evitar-toxico',
   {...})`) y se vuelve a leer con una expresión regular + `JSON.parse`, sin
   `eval` en ningún sitio.
6. **`learned/store.js`** guarda una copia recuperable en el navegador y deja
   exportar/importar el módulo como archivo. Fagi **nace sin saber nada**
   (`memory.js` no pre-siembra ni carga sola al crearse): recuperar lo
   aprendido de otra sesión es un gesto explícito, nunca automático.

### La API de decisión

`observation.js` construye el JSON que ve una API externa (candidatos,
creencias, reglas ya escritas, lo último que sintió). `backend/` define el
contrato (`local.js` un emulador sin red, `http.js` uno de verdad con
timeout). `cortex.js` pregunta sin bloquear el bucle — nunca se espera una
respuesta dentro de un fotograma — y aplica lo que llegue como una directiva
con caducidad, que `decision.js` consulta como una regla más. La API
**solo decide**; nunca escribe reglas. Contrato completo en
`docs/decision-api.md`.

## El mundo

`world.js` (estado), `mapgen.js` (mapa aleatorio autosuficiente), `obstacles.js` (geometría de
agua, rocas y nido), `trees.js` (fruta), `food.js` (la fruta se pudre),
`wind.js` + `smell.js` (viento y estelas de olor), `pheromone.js` (el rastro que
deja Fagi), `vision.js` (cono de visión), `effects.js` (buffs temporales).

## Pantalla

`render.js` (escena), `terrain.js` (el suelo), `fagi-sprite.js` (la hormiga),
`rock-sprite.js` (rocas), `nest-sprite.js` (el nido), `tree-sprite.js` (tronco y
copa), `fruit-sprite.js` (los frutos), `sprite-kit.js` (lienzos, ruido y caché
que comparten), `colors.js` (mezclas),
`ui.js` (HUD), `consola.js` + `narrator.js` (consola de decisiones),
`settings.js` (panel de ajustes), `input.js` (ratón), `compass.js` (rumbos).

Los sprites pintados comparten dos reglas: la luz cae siempre desde arriba a la
izquierda, y cada dibujo se pinta una vez en su lienzo y luego solo se estampa.
Fagi es la excepción a la segunda: gira y anda, así que va a trazo. Como el
cuerpo gira y la luz no, dentro de su dibujo la luz se gira al revés (`luzLocal`)
para que el lomo siga brillando por el mismo lado del mapa.

Y las tres cosas que hacen que algo se apoye en el suelo en vez de estar pegado
encima, todas repetidas en cada elemento: la sombra larga que tira la luz, la
oclusión de contacto —corta y oscura, justo debajo— y el rebote del suelo, que
es la luz parda que la tierra devuelve al lado en sombra.

El suelo se cuece una vez al tamaño del mundo, así que al acercarse se estira y
pierde el tacto. `drawDetalleCerca` lo devuelve: siembra chinas, briznas y hoja
en coordenadas de MUNDO por celdas con semilla propia, solo en lo que se ve y
solo a partir de cierto aumento. Como la semilla es de la celda y no de la
pasada, al mover la cámara el suelo no hierve.

Y lo que se ve cuenta lo que la cosa hace. Cada fruto tiene la forma de su
efecto —la chispa es cristal, el ojo mira, la resina gotea— y va enseñando lo
pasado que está antes de pudrirse. El árbol enseña su fruto madurando en la copa
en vez de llevar un contador encima, y se inclina a favor del viento, que es lo
que arrastra los olores. `fagi-preview.html`, `flora-preview.html` y
`water-preview.html` sirven para mirar esos dibujos en grande sin jugar una
partida.

## Números

Todos en `config.js`. El panel de ajustes los edita en caliente porque el juego
los lee en cada frame: no hay copias.
