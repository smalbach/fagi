# LIBERA: estado del trabajo

Estado: plan, **no hay código cambiado**.

Historia del plan:
- **Nube (commit `397449a`).** El primer borrador se escribió allí, sobre un código 30 commits atrasado.
- **2026-10-01, en local.** Se actualizó al código actual.
- **2026-10-02, reordenado:**
  - la pieza más defendible (la noche que experimenta) va primero, sobre el cuerpo actual;
  - los órganos solo se construyen cuando una hipótesis los pida;
  - **sin LLM por ahora**;
  - queda un hueco para una característica generacional (§8, por definir).

Rama: `research/libera`, sacada de `main`.

| archivo | qué es |
|---|---|
| `README.md` | este archivo: el plan vigente |
| `informe-libera.md` | el informe de la nube (bibliografía, mecanismos, novedad). Las erratas van al principio |
| `cuerpo-evolutivo.md` | diseño de la fase 5: cuerpo heredable con costes, plasticidad y límites |
| `notes/reciente-*.md`, `notes/cuerpo-evolutivo-literatura.md` | literatura 2019–2026 y costes biológicos |
| `notes/pendientes-verificacion.md` | verificación local con textos completos y correcciones. **Prevalece sobre las demás notas** |
| `notes/*.md` (otros) | notas de la nube: referencias clásicas, homeostasis, neuromodulación/sueño/curiosidad, trabajos previos |

---

## 1. Cómo decide Fagi hoy (punto de partida real)

`decide()` (`src/decision.js`) recorre `firstToAnswer()`:

1. **Programa** (`src/program.js`, `fagi.brain.program`).
   - Son líneas `{ id, tier, do, if?, source }` con `tier` ∈ `survive | endure | provide | clues | explore`.
   - Fagi nace con `INNATE`, que es la antigua jerarquía `RULES`.
   - **Gana la primera línea que responde** (winner-take-all). Si ninguna responde, explora.
2. **El programa se reescribe solo** (`src/program/`):
   - `watch.js` anota qué línea actuó.
   - `imagine.js` simula las de abajo.
   - `learn.js` prueba otra línea y la escribe delante si la evidencia lo respalda (`PROGRAM.alpha`, `margin`, `minSupport`).
   - `share.js` intercambia momentos con las hermanas.
3. **Punto de decisión** (`DECIDE`, `src/decision/point.js`): los reflejos `survive` y `endure` van primero. Después se consulta a un controlador registrado; hoy es `choice` (`src/choice.js`). **Es el enchufe para un selector free-flow.**
4. **Punto de bocado y conducta:**
   - `DECIDE.eat` (`src/decision/bite.js`).
   - `CONDUCT` (`src/learned/conduct*.js`): líneas sobre frutas, escritas y retiradas con una puerta de evidencia.
5. **La noche y el experimento existen ya:**
   - `consolidation.js` cierra el día con preguntas: frutas vistas y no probadas, y rasgos con excepciones.
   - `experiment.js` (`agendaFrom`) convierte esas preguntas en la agenda del día siguiente: un bocado pequeño (`EXPERIMENT.portion`) cuando nada aprieta.
   - `night/` es la mente nocturna. Propone reglas, dudas o exploraciones; una puerta (`trial`) las admite solo si las respaldan las frutas que ella probó. El backend `local` es determinista y no usa LLM.
6. **Lo que ya se midió de esa noche** (`research/results/organism/report.md`, protocolo `organism-protocol.md`):
   - **H5, "ordenar el día de noche mejora el juicio": no se confirmó.** La diferencia fue 0,014 [−0,022; 0,051].
   - Quitar la mente nocturna (`noNightMind`) apenas cambia nada.
   - Quitar curiosidad y experimentos (`noCuriosity`) **sí empeora el juicio**: −0,095 [−0,131; −0,059].
   - **Lectura: experimentar sirve, y la noche que lo organiza todavía no aporta.** Ahí está el hueco que LIBERA ataca primero.
7. **Valor:**
   - `interoception.js` (recompensa = delta del cuerpo).
   - `memory.js`, `learned/` (`verdict()`, `cues.js`, `dsl.js`).
   - `synapses.js`, `concepts.js`.
8. **Determinismo:**
   - Huella dorada: `scripts/trace.js` y `test/fixtures/decisions.json`, comprobada en `test/program.test.js`.
   - `scripts/batch.js --check`.
   - Todos los bloques arrancan apagados (`src/organism.js`).

## 2. Qué es LIBERA (sin LLM)

Cuatro piezas, ordenadas por lo defendibles que son:

| pieza | qué afirma | qué existe ya | qué falta | amenaza a la novedad |
|---|---|---|---|---|
| **(iii) noche científica** | el sueño genera preguntas falsables, se vuelven experimentos del día siguiente y solo se admite lo que la evidencia vivida respalda | preguntas, agenda, bocado de prueba, puerta `trial` | cerrar el ciclo (§4) | **baja**: nadie lo tiene (Creatures, Grandroids, IMGEP, Adam, Drescher) |
| **(i) liberadores aprendidos** | cero liberadores innatos sobre objetos: el impulso se abre con W = κ(estado)·V(señal) aprendido | V (`memory.js`, `cues.js`); las necesidades como κ | depósitos de impulso, modo `innate` para la ablación | **media-alta**: Blumberg 1996 ya aprende liberadores (premio externo, sobre una base innata, winner-take-all). Hay que matizar frente a él, a Creatures y a Cos-Aguilera/Cañamero. Lo que distingue a Fagi: cero liberadores de partida, señal interoceptiva y free-flow |
| **(ii) selección free-flow** | las líneas del programa votan con peso y un selector central con persistencia se compromete | el enchufe `DECIDE` | `src/decision/freeflow.js` | baja como novedad; Bryson y Seth hacen plausible un resultado nulo |
| **(iv) conocimiento legible** | lo aprendido queda en líneas legibles: programa, DSL, `CONDUCT` | todo | compresión durante el sueño (opcional) | media (Drescher). **Sin LLM** por ahora |

**El cuerpo de órganos** (bus, nervios con latencia, estómago en dos tiempos, aliestesia, fatiga, reflejos locales) pasa a ser **infraestructura bajo demanda**. Solo se construye el órgano que una hipótesis necesite.

**Integración con el LLM (plan C, rama `research/codigo-cultural`): aplazada.** Cuando se retome, el juez en código leerá señales de LIBERA y la puerta de evidencia será la misma de la pieza (iii).

## 3. Lo que aportan los autores (verificado)

Detalle en `notes/pendientes-verificacion.md`.

**Tyrrell 1993** (tesis):
- 14 requisitos (§10.5).
- Entorno con 13 subproblemas: 8 comunes, 4 de dirección y el borde. Son 35 acciones.
- Fitness medio: free-flow extendido 8,31 > Hull 6,23 > jerarquía rígida 6,11 > Lorenz 2,71 > Maes 0,25.
- **Tabla 10.1:** el free-flow extendido cumple 12 de 14 requisitos. Quedan con "?" la **persistencia** y las **secuencias contiguas**. Esos dos huecos son justo los que aprovechó Bryson. Así se justifica, con el propio Tyrrell, un selector central con persistencia y secuencias.
- **El Lorenz puro falla 7 de 14 requisitos** y en 2 queda con "?". Los depósitos alimentan al selector; nunca son el selector.

**Bryson 2000:** una jerarquía con secuencias supera al free-flow en 3 de 4 mundos y es unas 10 veces más simple. El programa de líneas de Fagi ya es ese tipo de jerarquía.

**Crabbe 2007:** el compromiso aporta un 1,1 %.

**Seth 2007:** la selección emerge sin árbitro y su racionalidad depende del nicho.

**Mecanismos con base verificada para el cuerpo y la noche:**

| mecanismo | fuente | dónde va |
|---|---|---|
| HRRL | Keramati & Gutkin 2014 | `interoception.js` |
| W = κ·V | Zhang & Berridge 2009 | depósitos |
| Curiosidad por progreso de aprendizaje | Oudeyer, Kaplan & Hafner 2007 | agenda |
| Replay, escalado sináptico y REM | McClelland 1995, Tononi & Cirelli 2014, Lewis 2018 | `consolidation.js` |
| Contabilidad XCS | Wilson 1995 | líneas y reglas |
| Estómago en dos tiempos, aliestesia, fatiga, alostasis | Zimmerman 2016, Cabanac 1971, Xia & Frey Law 2008, Sterling 2012 | órganos bajo demanda |

## 4. Métricas: realismo primero

El objetivo de Fagi es la **conducta realista, no la supervivencia**. Morir está bien; lo que es un bug son las muertes por artefacto. Por eso las **métricas primarias son los 14 requisitos de Tyrrell, convertidos en medidas de conducta**. La supervivencia y ∫D(t)dt pasan a ser secundarias.

| requisito | medida en Fagi (borrador) |
|---|---|
| 1 todos los subproblemas | fracción del tiempo con algún déficit crítico desatendido; causas de muerte |
| 2 persistencia | duración de los actos consumatorios (comer, beber, dormir) más allá de que su déficit deje de ser el mayor |
| 3 activación ∝ déficit | correlación entre la urgencia que se ve en la conducta y el déficit |
| 4–5 consumatorio > apetitivo | con recurso al alcance: probabilidad de consumir frente a seguir buscando |
| 6 competencia equilibrada | ningún comportamiento acaparado por su número de entradas (sesgo por línea) |
| 7 secuencias contiguas | cambios de acción por minuto; fracción de secuencias que se abandonan |
| 8 interrumpir si hace falta | latencia de respuesta a una amenaza (agua, frío, nocicepción) |
| 9 oportunismo | fracción de consumos de paso (comer camino del agua) |
| 10 sin WTA a nivel de sistema | fracción de decisiones en las que más de un sistema influye |
| 11–12 combinación y compromiso | acciones que reducen dos déficits a la vez |
| 13–14 sensores reales, combinación flexible | se documentan; no se miden |

## 5. Plan por fases (reordenado, sin LLM)

```
Fase 0  Medir. Los 14 requisitos como métricas en scripts/batch.js; línea base `program` y
        `program+learn`; presupuesto de coste por tick; dinámica de población (nacimientos, huevos,
        tamaño de colonia). La huella dorada se amplía a cada flag nuevo. Protocolo congelado.

        ── Después de la fase 0, dos líneas en paralelo (no dependen entre sí) ──

Línea A · MENTE
Fase 1  (iii) LA NOCHE CIENTÍFICA, sobre el cuerpo actual. Cerrar el ciclo que hoy está abierto:
        a. cada pregunta lleva su hipótesis y su predicción ("si pruebo X, me hará daño");
        b. la agenda se ordena por progreso de aprendizaje esperado × seguridad (Oudeyer), no por
           "lo más preguntado"; las preguntas de error alto sin progreso se marcan "ruidosas";
        c. experimentos más allá de la fruta: las pruebas de líneas de program/learn.js (`trial`)
           también salen de la agenda nocturna;
        d. el resultado del experimento vuelve a la noche siguiente: la hipótesis se confirma o se
           refuta, con procedencia (pregunta → experimento → veredicto);
        e. la puerta exige verificación en memoria (`trial`) Y un experimento vivido que la confirme.
        Hipótesis H3. Antes: entender por qué H5 de `organism` no se confirmó.
Fase 2  (i) LIBERADORES APRENDIDOS sobre las necesidades actuales (hambre, sed y energía como κ).
        Depósitos que alimentan la urgencia; W = κ·V; modo `innate`. Hipótesis H1 y H5.
Fase 3  (ii) SELECTOR. src/decision/freeflow.js como controlador de DECIDE; las líneas que se cumplen
        votan; selector central con histéresis y secuencias (cubre los "?" de Tyrrell). Hipótesis H2.

Línea B · CUERPO
Fase 5  CUERPO EVOLUTIVO (`cuerpo-evolutivo.md`): cerebro, estómago, músculos, ojos, antenas y tamaño
        heredables con costes energéticos, plasticidad en vida, herencia darwin/baldwin/epigenética,
        límites físicos (Kleiber, cuadrado-cubo) y sprite que cambia. Hipótesis G1–G5.
        Se apoya en el genoma, la colonia y el sprite actuales. **Requisito previo: la reproducción
        de la colonia debe escalar bien** (`notes/reproduccion-diagnostico.md`).
Fase 4  CUERPO BAJO DEMANDA. Solo lo que pida una hipótesis: estómago en dos tiempos (H6), lengua con
        aliestesia, y bus con reflejos y latencia (H4). Los órganos de la fase 5 son su base natural.

        ── Convergen ──
        G4 (cuerpo × cultura) y H1 con cuerpos distintos necesitan las dos líneas.
Fase 6  Batería preregistrada (research/libera/, con research/stats.js).
```

Reglas:
- Bloques nuevos con `enabled: 0`, registrados en `src/organism.js` y activables con `--set`.
- Con todo apagado, la huella dorada y `--check` pasan sin tocar el fixture.
- Sub-flujos aleatorios propios.
- Latencia en segundos, con un test de que no depende de `dt`.
- Coste por tick ≤ 1,5×.

## 6. Hipótesis

| # | hipótesis | condiciones | fase |
|---|---|---|---|
| H3 | la noche científica (pregunta → experimento → veredicto) acorta el tiempo hasta la creencia correcta **sin** más creencias falsas | `none` / `replay-only` / `agenda-actual` / `agenda-LP` / `agenda-LP-gated` | 1 |
| H1 | los liberadores aprendidos alcanzan una viabilidad comparable a los innatos y se adaptan antes a un cambio a mitad de vida | `learned` vs `innate` (dentro de LIBERA) | 2 |
| H5 | W = κ·V revalora al instante tras una privación | `kappa` vs `V-only` | 2 |
| H2 | free-flow + selector central puntúa mejor en los requisitos de Tyrrell que el programa WTA y que el free-flow puro | `program` / `program+learn` / `freeflow` / `freeflow+central` | 3 |
| H6 | el estómago en dos tiempos produce saciedad anticipatoria | `two-stage` vs `instant` | 4 |
| H4 | la latencia daña menos con los reflejos en los órganos | 2×2 | 4 |
| H7 | la curiosidad por progreso de aprendizaje evita las trampas de ruido | `LP` vs `uncertainty` | 1 |

Un resultado nulo o inverso en H2 se preregistra como publicable.

## 7. Pendientes de verificación

- [x] 14 requisitos, entorno (13 = 8 + 4 + borde) y Tabla 10.1 de Tyrrell (leída a mano en el PDF, p. 220).
- [x] Bryson, Crabbe, Seth (PMC2440771), Creatures CSRP 434, Grandroids, IMGEP, Cos-Aguilera, referencias [P].
- [x] Neal & Timmis 2003: 27(2). Hull 1943: D. Appleton-Century (la nube acertaba). Blumberg 1994: liberadores fijos. **Blumberg 1996: aprende liberadores** (amenaza a la pieza i). Creatures AAMAS 1998: registro confirmado.
- [ ] Comparar Creatures AAMAS 1998 con CSRP 434: el texto completo es de pago.

## 8. Cuerpo evolutivo (idea del usuario, 2026-10-02)

Diseño en `cuerpo-evolutivo.md`; literatura en `notes/cuerpo-evolutivo-literatura.md`.

En resumen, cada rasgo del cuerpo (cerebro, estómago, músculos, ojos, antenas, tamaño) tiene:
- un beneficio;
- un coste en energía o en ciclo de vida (crías, longevidad);
- un límite físico;
- una regla de plasticidad en vida;
- un efecto visible en el sprite.

Herencia: se comparan tres modos (Darwin, Baldwin, epigenético que decae en ~4 generaciones). Selección: natural en el juego, torneo en las baterías.

Se apoya en lo que ya existe: el genoma en `generations.js`, `BODY_TRAITS` en `biology.js`, la colonia y el sprite.

Literatura reciente de las otras piezas: `notes/reciente-noche.md`, `notes/reciente-cuerpo-seleccion.md`, `notes/reciente-generacional.md`.

## 8b. Estado de la Fase 0 (2026-10-02)

Métricas de Tyrrell implementadas (`--tyrrell`, `c980bf0`) y línea base `program` / `program+learn` en `notes/fase0-linea-base.md`. Hallazgos:
- el hambre no activa la búsqueda: se forrajea por la despensa;
- aprender empeora la contigüidad y cuesta 1,66× (por encima del presupuesto de 1,5×);
- casi no hay compromiso entre necesidades.

## 8c. Estado de la Fase 1 (2026-10-02)

- **H5 de `organism`, explicada:** el repaso nocturno empeora el juicio y la agenda lo mejora; en H5 se sumaron y se cancelaron (§25.13 de la especificación). El repaso ya está apagado por defecto.
- **Noche científica implementada** (`SCIENCE`, `8337c7b` y `5ccaff2`): predicción por pregunta, agenda y decisión por progreso × seguridad, y veredictos con procedencia.
- **H3 no se sostiene** en el mundo de 6 especies (`notes/bateria-h3-resultados.md`, `notes/bateria-h3b-resultados.md`): no hay escasez de preguntas que priorizar. La agenda en sí vale mucho. Las predicciones previas aciertan menos de la mitad.
- **H3c** (16 especies, 2 preguntas por noche; `notes/bateria-h3c-resultados.md`): no aprende más rápido, pero **sobrevive más (+10 % [3; 18])** y confía menos en veneno: priorizar por seguridad cambia qué aprende, no cuánto.
- **H7 no se sostiene** (`notes/bateria-h7-resultados.md`): no hay trampa de ruido, porque la agenda nunca vuelve a preguntar por fruta ya probada. Haría falta re-preguntar lo incierto.
- **Pendiente:** las piezas c y e (después de la Fase 3).

## 8d. Estado de la Fase 2 (2026-10-02)

Impulsos aprendidos (`DRIVE`, `8c27816`; apagados por defecto): W = κ·V con κ aprendido del alivio sentido. **H1 se sostiene** (tan viable como el innato). **H5a se sostiene:** una sed nunca vivida no se revalora al instante (+61 s hasta beber la primera vez). **H5b no** (IC incluye 0). Detalle en `notes/bateria-h1-h5-resultados.md`.

## 8e. Estado de la Fase 3 (2026-10-02)

Selector free-flow (`SELECT`, `f8aed4b`; `program` por defecto). **H2 no se sostiene:** `freeflow+central` frente a `program` da 2 victorias y 2 derrotas. El free-flow sigue mejor a la necesidad (R3) y combina más, pero cambia más de acción; el selector central recupera casi toda la contigüidad sin superar al programa (como Bryson 2000). Detalle en `notes/bateria-h2-resultados.md`.

## 8f. Estado de la Fase 4 (2026-10-02)

- **Estómago en dos tiempos** (`STOMACH`, `7578dfb`; apagado por defecto). **H6 se sostiene con efecto pequeño:** con saciedad anticipatoria come menos bocados por comida y no desperdicia (`notes/bateria-h6-resultados.md`). Es pequeño porque casi cada comida es una sola fruta.
- **Calibración del selector** (`notes/calibracion-selector.md`): ningún ajuste iguala la continuidad del programa. El bono consumatorio (`SELECT.consume`) mejora R3, R4–5, R9 y R11–12.
- **H2b no se sostiene** (`notes/bateria-h2b-resultados.md`): con `consume` 4 y semillas nuevas, 3 victorias (R3 +0,20, R9, R11–12) y 4 derrotas (R1, R7a, R7b, R8). R1 empeora porque, agotada, vota por buscar comida en vez de descansar. Falta algo estructural (un veto por necesidad crítica, o secuencias), no un parámetro. El juego sigue con `program`.
- **H2c** (`notes/bateria-h2c-resultados.md`): el veto por necesidad crítica (`SELECT.veto`, `6b7e5aa`) **arregla la emergencia** (R1 de 0,35 a 0,18; 0 muertes por frío frente a 3) pero no la continuidad. Frente al programa, 2 victorias y 4 derrotas: H2c no se sostiene. La brecha de contigüidad ya se replicó tres veces; el siguiente candidato son las secuencias.
- **H2d** (`notes/bateria-h2d-resultados.md`, código `19b0ebc`): el bono consumatorio tenía un error, porque premiaba seguir el propio rastro como si fuera comer; H2b y H2c se corrieron con él. Corregido, el selector **empata al programa en cambios de acción y cambia de meta un 12 % menos** (17 % con secuencias, `SELECT.sequence`). H2d queda en 3 victorias y 3 derrotas, así que no se sostiene. H2d-seq sí (3 y 0). Pendiente: R8, la respuesta al frío o calor, 2 a 4 s más lenta.
- **Cierre de la Fase 3** (`notes/fase-3-cierre.md`, 2026-10-03): las baterías salen parejas porque el mundo no exige nada. Los mecanismos cambian el reparto del tiempo (explorar 34 → 23 %) pero no lo que come (7,47 · 7,50 · 7,50) ni quién vive (todas). La supervivencia es un precipicio entre una fruta cada 300 s y cada 900 s. Se cierra H2–H2d como nulo y se vuelve a la línea de autoría: plan C, paso 1.

## 9. Para retomar

> Lee `docs/research/libera/README.md`. Empieza la Fase 0: los 14 requisitos de Tyrrell como métricas en
> `scripts/batch.js`, línea base `program` y `program+learn`, y coste por tick. Después, la Fase 1: por qué
> H5 de `organism` no se confirmó.
