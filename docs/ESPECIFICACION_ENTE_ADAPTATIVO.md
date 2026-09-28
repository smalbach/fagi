# Especificación: Fagi como ente adaptativo autónomo

**Estado:** en implementación: fase 1 hecha; 2, 3, 5 y 6, en parte (ver §25)  
**Proyecto:** First AGI / Fagi  
**Objetivo de esta versión:** transformar la simulación actual, inspirada en una hormiga, en un entorno experimental para estudiar un organismo artificial limitado que percibe, aprende, descansa, consolida experiencias, se reproduce y se adapta durante varias generaciones.

---

## 0. Regla de compatibilidad (añadida al implementar)

El repositorio contiene estudios preregistrados y congelados (`docs/research/`) que ejecutan el mismo motor de simulación mediante `scripts/batch.js`. Todo lo que añade esta especificación debe respetar estas condiciones:

1. **Cada bloque nuevo arranca apagado** en `src/config.js` (`CYCLE.enabled`, `THERMAL.enabled`, `SEX.enabled`, `SLEEP.enabled`, `EXPERIMENT.enabled`, `APPETITE.enabled`, `PERCEPT.enabled`, `GEN.sexual`).
2. **Con todo apagado, la simulación es idéntica número a número**: no se consume ni un número aleatorio más ni en otro orden, y todo multiplicador corporal vale exactamente `1`. Se comprobó comparando byte a byte la salida JSON de `batch.js` antes y después (ejecución simple y por generaciones con especies).
3. **El juego enciende el organismo** al arrancar (`src/app/organism-on.js`, que se importa antes que los ajustes). En batch se enciende con `--organism`, y `--set` puede apagar después cualquier pieza (`--set SLEEP.consolidate=0`).
4. **Las sesiones grabadas guardan los flags** con el resto de ajustes. Al reproducir una sesión anterior al organismo, los flags ausentes se consideran `0` (`organismOffConfig`).

Sin esta regla, cada mejora invalidaría en silencio los resultados publicados.

---

## 1. Resumen ejecutivo

El objetivo no debe formularse como “crear una AGI completa”. Eso no sería realista con el sistema actual ni con un simulador individual de este tamaño. El objetivo defendible es construir un **ente adaptativo mínimo**, comparable en alcance funcional a un organismo muy simple:

- mantiene variables internas necesarias para sobrevivir;
- percibe solo una parte del entorno;
- actúa con información incompleta;
- aprende asociaciones mediante experiencia;
- descubre propiedades de objetos inicialmente desconocidos;
- forma memoria episódica, semántica y espacial;
- alterna actividad diurna con descanso y consolidación nocturna;
- presenta diferencias corporales heredables;
- se reproduce combinando información de dos progenitores;
- se adapta tanto durante su vida como entre generaciones;
- puede ser evaluado contra agentes sin aprendizaje y contra políticas programadas.

El resultado esperado no será una inteligencia general humana ni un sistema que pueda aprender cualquier tarea. Será una plataforma de **vida artificial y aprendizaje abierto pero acotado**, con suficiente complejidad para estudiar autonomía, curiosidad, memoria, adaptación, cultura y evolución.

La innovación no está en inventar por separado hambre, memoria, evolución, sueño o un modelo de lenguaje. Todos esos elementos ya existen en investigación. La posibilidad innovadora está en integrarlos en un sistema pequeño, observable, explicable y experimentalmente reproducible donde:

1. el aprendizaje individual modifica la conducta;
2. el sueño reorganiza lo aprendido sin editar código de forma insegura;
3. la cultura transmite conocimiento adquirido;
4. la reproducción transmite predisposiciones, no recuerdos completos;
5. el entorno cambia y obliga a desaprender;
6. cada afirmación se comprueba con métricas y experimentos de ablación.

---

## 2. Qué significa “acercarse a la AGI de un insecto”

No existe una definición científica aceptada de “AGI de insecto”. Por eso el proyecto necesita una definición operacional.

En este documento, un ente alcanza el objetivo cuando demuestra de manera repetible las siguientes capacidades:

1. **Autonomía:** funciona durante periodos largos sin órdenes manuales.
2. **Homeostasis:** regula hambre, sed, energía y temperatura corporal.
3. **Percepción parcial:** decide a partir de visión, olor, memoria e interocepción limitadas.
4. **Aprendizaje en vida:** cambia sus predicciones por consecuencias experimentadas.
5. **Exploración activa:** busca información cuando la incertidumbre lo justifica.
6. **Novedad:** interactúa con objetos cuyas propiedades no están preclasificadas como “buenas” o “malas”.
7. **Memoria:** conserva episodios, regularidades y lugares con distintos ritmos de olvido.
8. **Consolidación:** durante el descanso selecciona, comprime y generaliza experiencias.
9. **Transferencia:** usa una regularidad aprendida en una situación nueva relacionada.
10. **Adaptación no estacionaria:** corrige creencias cuando el entorno cambia.
11. **Aprendizaje social:** incorpora información de otros sin confiar ciegamente.
12. **Reproducción sexual simulada:** dos progenitores aportan rasgos heredables.
13. **Evolución:** la presión de selección cambia estadísticas de la población.
14. **Emergencia medible:** aparecen estrategias que no fueron codificadas como una secuencia fija de acciones.

Cumplir estas capacidades permitiría describir el sistema como un **agente de propósito general dentro de un microentorno**, no como AGI universal.

---

## 3. Lo que el proyecto no debe afirmar

Para mantener credibilidad técnica, no se debe afirmar que Fagi:

- es consciente;
- tiene emociones reales;
- entiende el mundo como una persona;
- genera conocimiento sin señales ni experiencia;
- reescribe correctamente su propio código de manera autónoma;
- constituye una AGI humana;
- reproduce fielmente la neurobiología de una especie real;
- prueba que el descanso artificial equivale al sueño biológico;
- demuestra evolución útil si solo mejora en un mapa o una semilla.

El diseño nuevo será ficticio precisamente para evitar afirmar que la simulación representa con fidelidad una hormiga. Puede inspirarse en principios biológicos sin quedar atado a la anatomía, reproducción o división de trabajo de una especie concreta.

---

## 4. Estado de partida

La base actual ya contiene piezas valiosas:

- hambre, sed y energía;
- visión y olor limitados;
- agua superficial y profunda;
- lluvia, presión y refugio;
- exploración espacial;
- memoria con pérdida de confianza;
- aprendizaje de alimentos y efectos;
- reglas aprendidas explicables;
- hábitos ajustables por experiencia;
- colonia, comunicación social y despensa;
- genoma de predisposiciones;
- generaciones y mutación;
- API opcional para decisiones externas;
- grabación y repetición de sesiones;
- herramientas de experimentación por lotes.

Sin embargo, antes de esta especificación existían límites importantes (el §25 indica cuáles ya se resolvieron):

- la conducta final depende en gran parte de una jerarquía fija de reglas;
- el mundo conoce tipos discretos y sus efectos antes que el agente;
- la novedad se limita principalmente a descubrir el valor de elementos ya programados;
- el modelo generacional actual se parece más a clonación con mutación que a reproducción sexual;
- no hay ciclo circadiano completo;
- no hay temperatura corporal ni coste térmico;
- el descanso recupera energía, pero no consolida memoria de forma sustantiva;
- no existe desarrollo desde nacimiento hasta madurez;
- no hay apareamiento, gestación, puesta, incubación ni cuidado de descendencia;
- la selección puede optimizar una sola métrica y producir atajos;
- el modelo externo puede decidir, pero no debe confundirse con inteligencia nacida dentro del entorno.

---

## 5. Identidad del nuevo organismo

### 5.1 Nombre de trabajo

Se mantiene **Fagi** como nombre del ente y de la especie artificial. Ya no se describirá como hormiga.

### 5.2 Diseño visual

El sprite debe representar un organismo ficticio reconocible, no un insecto existente. Propuesta:

- cuerpo central ovalado o en forma de manto;
- núcleo luminoso que indique estado vital;
- cuatro apéndices locomotores o filamentos;
- dos órganos sensoriales frontales;
- placas o membranas laterales relacionadas con termorregulación;
- diferencias sexuales sutiles de forma y color, no caricaturescas;
- animación térmica: contracción en frío y apertura de membranas con calor;
- carga visible integrada en la parte dorsal;
- estado de sueño visible solo cuando se encuentra fuera del refugio;
- cadáver visualmente diferenciable sin depender únicamente del color.

El diseño seguirá siendo vectorial y generado por Canvas para conservar nitidez con zoom y evitar depender de imágenes estáticas.

### 5.3 Principio biológico

Fagi será un ectotermo parcialmente regulador: su temperatura depende del ambiente, pero puede modificarla mediante conducta, refugio, movimiento y rasgos corporales.

---

## 6. Variables internas del ente

Cada individuo debe mantener como mínimo:

```js
{
  alive: true,
  age: 0,
  sex: "female" | "male",
  lifeStage: "juvenile" | "adult" | "senescent",

  hunger: 0,
  thirst: 0,
  energy: 100,
  temperature: 24,
  thermalStress: 0,
  health: 100,

  sleepPressure: 0,
  sleepTime: 0,
  fertility: 0,
  gestation: null,

  genome: {},
  brain: {},
  episodicMemory: [],
  semanticMemory: {},
  proceduralMemory: {},
  spatialMemory: {},

  uncertainty: {},
  currentGoal: null,
  thought: null
}
```

No es necesario implementar todas estas variables en una sola entrega. Sí deben formar parte del contrato de diseño para evitar soluciones incompatibles entre sí.

**Correspondencia con el código actual.** Varias memorias del contrato ya existen con otro nombre, y no conviene duplicarlas:

| Contrato | Dónde vive hoy |
|---|---|
| `episodicMemory` | `brain.bites` (registro acotado de experiencias con fruta, `learned/explain.js`) y `episodes.js` (experiencia abierta hasta conocer su final) |
| `semanticMemory` | `brain.facts` (valor + confianza por especie, `memory.js`), `brain.cues` (pesos por rasgo) y `brain.rules` (reglas escritas) |
| `proceduralMemory` | `brain.habits` (`habits.js`) |
| `spatialMemory` | `fagi.explored` (`explore.js`) y `brain.places` (`memory.js`) |
| `temperature`, `thermalStress` | `fagi.temperature`, `fagi.thermalStress`, más `fagi.thermalFeel` (`'cold' \| 'heat' \| null`) |
| `sleepPressure`, `sleepTime` | `fagi.sleepPressure` (0–1), `fagi.sleepTime` (segundos de la fase de sueño actual en el nido) |
| `sex`, rasgos corporales | `fagi.sex` y `fagi.body` (multiplicadores calculados una sola vez al nacer, `biology.js`) |
| `energy` máxima | `energyMax(fagi)` = `ENERGY.max × body.energyMax` |
| informe nocturno | `fagi.lastNightReport`, `fagi.nightReports`, `fagi.consolidations` |

`fertility`, `gestation` y `health` siguen sin implementar (§25).

---

## 7. Ciclo de día y noche

### 7.1 Reloj ambiental

El mundo tendrá ciclos repetibles con:

- número de día;
- fase normalizada entre `0` y `1`;
- nivel de luz entre `0` y `1`;
- temperatura ambiente;
- amanecer y atardecer progresivos;
- indicador de noche;
- variación opcional por estación.

Configuración implementada (`src/config.js`, `CYCLE`):

```js
CYCLE = {
  enabled: 0,       // apagado por defecto (§0)
  seconds: 180,     // un día
  start: 0.3,       // fase a la que empieza la sesión (0 = medianoche)
  dawn: 0.22,       // fase en la que la luz está a medias al amanecer
  dusk: 0.78,       // y al atardecer
  twilight: 0.05,   // fase que dura cada rampa de luz
  minLight: 0.12,
  mean: 22,         // °C
  swing: 12,        // ± °C: 10 al amanecer, 34 a media tarde
  warmest: 0.6,     // fase más calurosa
  nightSight: 0.45  // fracción del alcance visual que queda de noche
}
```

**Por qué 180 s y no 300.** El motor ya fija una escala biológica: 1 s de juego ≈ 8 min del organismo, y la sed mata en unos 180 s (≈ un día). Un día de 300 s haría que la sed matara en ~0,6 días y rompería esa proporción. Con 180 s, un día del reloj coincide con un día fisiológico, y una sesión de 30 min contiene 10 noches.

**El ciclo es una función pura del reloj** (`cycle.js`, `cycleAt(world.time)`): no guarda estado. Por eso son deterministas el reinicio (basta con `world.time = 0`), el replay (reconstruye el cielo a partir de `t`) y el batch, sin tener que grabar nada. El cambio de día se registra como evento `day` solo para la línea de tiempo.

### 7.2 Efectos del día

- mayor visibilidad;
- temperatura ascendente hasta un máximo cercano al mediodía;
- evaporación más rápida de charcos;
- alimentos expuestos pueden degradarse más rápido;
- algunos recursos aparecen solo con luz;
- mayor facilidad para navegación visual.

### 7.3 Efectos de la noche

- visión reducida;
- temperatura descendente;
- predominio relativo del olfato y la memoria;
- aparición opcional de recursos y amenazas nocturnas;
- mayor presión de sueño;
- oportunidad de consolidación en refugio;
- coste de permanecer expuesto al frío.

### 7.4 El agente no debe conocer el reloj de forma mágica

Fagi puede percibir luz, temperatura y cambios regulares. Puede aprender la relación entre esas señales y los eventos. No debería recibir inicialmente “son las 22:00 y viene la noche” como conocimiento simbólico perfecto.

Implementado así: el cuerpo recibe `fagi.light`, `fagi.dark` (luz por debajo de `THERMAL.duskSense`) y `fagi.dimming` (la luz está bajando). La hora, el número de día y la temperatura del aire no llegan a Fagi: se muestran en el HUD para quien observa, pero no entran en su observación (§17).

---

## 8. Frío, calor y termorregulación

### 8.1 Modelo mínimo

La temperatura corporal se aproxima gradualmente a una temperatura objetivo:

La versión lineal (`T += (T_obj − T) × k × dt`) se vuelve inestable cuando `k·dt > 1`, por ejemplo con pasos grandes o si Fagi está mojada. Por eso se implementó en forma exponencial, que es estable con cualquier `dt`:

```text
k        = THERMAL.exchange × (mojada ? THERMAL.wetExchange : 1) ÷ body.insulation      [1/s]
T_cuerpo += (T_objetivo − T_cuerpo) × (1 − e^(−k·dt))
```

`T_objetivo` se compone así (`thermal.js`, `targetTemperature`):

- fuera del refugio, la temperatura del aire;
- dentro del nido, `nestBuffer × nestTemp + (1 − nestBuffer) × aire` (con los valores por defecto, 80 % nido y 20 % aire);
- `+ moveHeat` si caminó en el paso anterior (calor limitado: nunca más de `moveHeat` °C);
- `− shade × luz` bajo la copa de un árbol mientras hay sol: la sombra como refugio pasivo;
- `− wetChill` si está empapada (por el agua honda o por la lluvia a la intemperie).

El estrés térmico es explícito:

```text
grados = distancia en °C fuera de [safeMin, safeMax]
grados > 0      → estrés += stressRate × grados × dt
grados = 0      → estrés −= recover × dt
T ≤ lethalMin o T ≥ lethalMax → estrés = maxStress
estrés = maxStress → muere de frío o de calor (el último que sufría)
```

### 8.2 Rangos propuestos

```js
THERMAL = {
  preferred: 25, safeMin: 15, safeMax: 33,
  lethalMin: 4, lethalMax: 44, maxStress: 100,
  exchange: 0.05,   // ~20 s para asentarse
  stressRate: 0.5, recover: 2,
  coldHunger: 0.06, heatThirst: 0.06, coldSlow: 0.03, minSpeed: 0.5,
  nestTemp: 24, nestBuffer: 0.8, shade: 5, moveHeat: 1.5, wetChill: 4, wetExchange: 2,
  sample: 4, lesson: 0.6, refugeSample: 4, instinct: 0.15, reflex: 0.7, duskSense: 0.6,
  behave: 1         // 0 = siente y aprende, pero nunca actúa (ablación)
}
```

Estos números pertenecen a la especie ficticia. Deben calibrarse por simulación, no presentarse como datos zoológicos.

### 8.3 Consecuencias del frío

- aumenta el consumo energético o el hambre;
- reduce gradualmente la velocidad;
- incrementa la presión por buscar refugio;
- estar mojado empeora el enfriamiento;
- exposición prolongada acumula estrés térmico;
- el estrés máximo causa muerte por frío.

### 8.4 Consecuencias del calor

- aumenta la sed;
- puede reducir la eficiencia de movimiento;
- favorece buscar sombra, agua o refugio;
- exposición prolongada acumula estrés térmico;
- el estrés máximo causa muerte por calor.

### 8.5 Aprendizaje térmico

Fagi nace sintiendo que demasiado frío o calor perjudica su cuerpo, pero no conoce qué lugares o señales lo evitan. Debe aprender asociaciones como:

- “el refugio estabiliza mi temperatura”;
- “estar mojado de noche es peligroso”;
- “esta zona se vuelve caliente después del amanecer”;
- “la sombra reduce el estrés térmico”;
- “conviene regresar antes del descenso de luz”.

Esto preserva la distinción entre **interocepción innata** y **conocimiento ambiental aprendido**.

Implementado con el mismo mecanismo con el que ya aprende la lluvia (`weather.js`):

| Clave aprendida | Cómo se aprende | Qué cambia |
|---|---|---|
| `cold` / `heat` | cada `THERMAL.sample` s fuera del rango seguro es una experiencia negativa | más urgencia de ir al refugio; `synth.js` acaba escribiendo `avoid-cold` |
| `refuge` | entra al nido con frío o calor y, tras `refugeSample` s dentro, compara temperatura y estrés; una lección por visita | **habilita** la regla `thermal`: mientras no sabe que el nido ayuda, no va a él por la temperatura |
| `dusk` | si nota la oscuridad y después llega el frío, la oscuridad toma el valor del frío (condicionamiento clásico, igual que `pressure`) | regla `dusk`: vuelve al nido al oscurecer, antes de que el frío muerda |

Lo único innato es un **reflejo**: cuando el estrés alcanza `reflex × maxStress`, vuelve a casa sin importar lo que la retenga fuera, y no sale hasta estar a gusto (histéresis para no rebotar en el umbral). Es el análogo de salir del agua honda.

---

## 9. Sexo y dimorfismo funcional

### 9.1 Regla de diseño

No habrá un sexo objetivamente superior. Cada uno tendrá ventajas y costes que produzcan estrategias diferentes según el entorno.

Configuración inicial propuesta:

| Rasgo | Hembra | Macho | Interpretación |
|---|---:|---:|---|
| Velocidad | 0.94 | 1.08 | El macho se desplaza más rápido |
| Energía máxima | 1.12 | 0.92 | La hembra almacena más energía |
| Metabolismo | 0.92 | 1.08 | El macho consume recursos más rápido |
| Resistencia térmica | 1.08 | 0.94 | La hembra tolera mejor cambios térmicos |
| Inversión reproductiva | Alta | Baja por evento | Coste corporal distinto |
| Recuperación posreproductiva | Más lenta | Más rápida | Compensa el coste de descendencia |

Estos valores son hipótesis de simulación. Se deberán ajustar hasta que ambos sexos tengan oportunidades reproductivas y ninguna estrategia domine en todos los mapas.

Implementado (`SEX`, `biology.js`): `speed`, `energyMax`, `metabolism` (multiplica el hambre y el gasto al caminar) e `insulation` (divide el intercambio térmico). Se multiplican por los **genes corporales** (`genome.body`, limitados a `GEN.bodyRange`) y se guardan una sola vez en `fagi.body`. Así ningún multiplicador se aplica dos veces. Las filas de inversión y recuperación reproductiva esperan a la reproducción dentro del mundo (§25).

### 9.2 Separar sexo, cuerpo y conducta

El sexo modifica parámetros corporales, no órdenes mentales. No se codificarán reglas como “la hembra cuida” o “el macho explora”. Si esas especializaciones aparecen, deben ser resultado de costes, oportunidades, aprendizaje y selección.

### 9.3 Proporción

- probabilidad inicial cercana a 50/50;
- el sexo de la descendencia se determina al crear el cigoto;
- una población experimental debe garantizar al menos una pareja compatible al inicio, para no extinguirse por azar antes de probar el sistema.

---

## 10. Reproducción sexual y ciclo de vida

### 10.1 Condiciones para reproducirse

Un individuo solo puede participar si:

- está vivo;
- es adulto;
- supera un mínimo de energía y salud;
- no presenta estrés térmico crítico;
- encuentra una pareja compatible;
- existe suficiente recurso o seguridad ambiental;
- ha transcurrido un periodo de recuperación.

### 10.2 Selección de pareja

En una primera versión, la elección puede usar:

- proximidad;
- salud observable;
- energía;
- edad adulta;
- compatibilidad genética mínima;
- historial de cooperación o señales aprendidas.

Más adelante se podrá estudiar preferencia sexual aprendida, pero no debe incluirse antes de validar la reproducción básica.

### 10.3 Recombinación genética

Cada rasgo del descendiente se obtiene mediante una de estas estrategias:

1. escoger el alelo de uno de los dos progenitores;
2. interpolar ambos valores;
3. aplicar mutación pequeña;
4. limitar el valor al rango permitido.

Ejemplo:

```text
rasgo_hijo = mezcla(rasgo_madre, rasgo_padre) + mutación_gaussiana
```

Los recuerdos autobiográficos no pasan por el genoma. Las predisposiciones sí pueden heredarse. Las reglas aprendidas solo llegan al joven mediante cultura u observación.

Implementado en `generations.js`, `recombine(madre, padre, rnd, padres)`. Cada sesgo innato se toma entero de uno de los progenitores (o se promedia si `GEN.blend = 1`) y después muta. Los genes corporales se promedian, mutan con `GEN.bodyMutation` y se limitan al rango. El genoma lleva `parents` para registrar el parentesco. En `batch --generations` con `GEN.sexual = 1`, cada recién nacido tiene madre y padre, elegidos por aptitud dentro de su sexo. Una generación sin alguno de los dos sexos termina el linaje, y ese final se informa como extinción.

### 10.4 Costes reproductivos

- ambos individuos gastan energía al aparearse;
- la hembra asume un coste adicional de gestación o puesta;
- el huevo o juvenil requiere recursos;
- reproducirse en mal momento puede reducir la supervivencia;
- una población que solo maximiza descendencia inmediata puede colapsar después.

### 10.5 Etapas vitales

Versión recomendada:

```text
huevo → juvenil → adulto → senescente → muerte
```

- **Huevo:** no decide; depende del microclima.
- **Juvenil:** explora menos, aprende y consume alimento.
- **Adulto:** puede reproducirse y realizar todas las tareas.
- **Senescente:** pierde rendimiento lentamente y conserva valor cultural.

La senescencia crea una tensión interesante: un individuo viejo puede ser físicamente débil pero informativamente valioso.

---

## 11. Arquitectura día/noche del aprendizaje

### 11.1 Durante el día: experiencia

El ciclo activo debe:

1. percibir;
2. estimar necesidades y riesgos;
3. elegir una meta;
4. ejecutar una acción;
5. observar consecuencias;
6. registrar un episodio;
7. actualizar predicciones locales.

Los episodios deben registrar, como mínimo:

```js
{
  at,
  place,
  context,
  perceivedFeatures,
  action,
  expectedOutcome,
  actualOutcome,
  reward,
  surprise,
  bodyBefore,
  bodyAfter
}
```

### 11.2 Durante la noche: consolidación

La consolidación solo ocurre si el ente duerme durante suficiente tiempo y se encuentra razonablemente seguro.

Pipeline propuesto:

1. seleccionar episodios importantes por sorpresa, daño, recompensa o repetición;
2. agrupar episodios por similitud de rasgos y contexto;
3. detectar regularidades candidatas;
4. reforzar recuerdos útiles;
5. debilitar detalles redundantes;
6. convertir regularidades en reglas provisionales;
7. estimar confianza y excepciones;
8. preparar preguntas o experimentos para el día siguiente;
9. guardar un informe de consolidación auditable.

Ejemplo de informe:

```json
{
  "day": 12,
  "importantEpisodes": [81, 94, 101],
  "hypotheses": [
    {
      "when": ["olor:ácido", "forma:redonda"],
      "predict": "aumenta_hambre",
      "confidence": 0.62,
      "support": 3,
      "exceptions": 1
    }
  ],
  "forgotten": 14,
  "questions": ["probar objeto 44 con hambre baja"]
}
```

### 11.3 Uso del modelo de IA actual

El modelo externo puede funcionar como **motor de hipótesis**, no como autoridad que cambia el programa directamente.

Entrada nocturna:

- resumen de episodios;
- reglas actuales;
- contradicciones;
- estado corporal;
- mapa conocido;
- resultados de días anteriores.

Salida permitida:

- hipótesis nuevas;
- relaciones candidatas;
- prioridades de exploración;
- reglas propuestas en un DSL limitado;
- explicación de evidencia y nivel de confianza.

Salida no permitida en producción:

- ejecutar código arbitrario;
- editar archivos del proyecto automáticamente;
- cambiar constantes globales sin evaluación;
- declarar hechos sin evidencia disponible;
- borrar memoria completa;
- saltarse las necesidades vitales.

Cada propuesta debe pasar por:

```text
propuesta → validación de esquema → simulación aislada → comparación → aceptación o rechazo
```

Así se obtiene mejora nocturna sin convertir el sistema en autoedición insegura e imposible de auditar.

### 11.4 Consolidación local implementada

`sleep.js` y `consolidation.js`. Condiciones: sueño (acción `rest`) dentro del nido durante al menos `SLEEP.minSleep` s, con oscuridad y **una vez por noche**. La noche se identifica con `nightOf(t)`, de modo que la tarde y la madrugada siguiente cuentan como la misma noche. Una siesta al mediodía no consolida nada. Sin ciclo de día, cada fase de sueño en el nido cuenta como una noche.

| Paso | Implementación |
|---|---|
| episodios del día | mordiscos propios en `brain.bites` posteriores a la última consolidación (no los observados en otras) |
| relevancia | `abs(recompensa) + 0,5·abs(recompensa − creencia actual)`, + 0,25 si fue un juicio tardío |
| destacados | los `SLEEP.salient` más relevantes |
| hipótesis | por rasgo: soporte ≥ `minSupport`, efecto medio ≥ `minEffect`; confianza con suavizado de Laplace `(soporte − excepciones + 1)/(soporte + 2)` |
| refuerzo | cada creencia cuyo signo coincide con un destacado gana `boost × (1 − confianza)` y cuenta como confirmación espaciada |
| olvido | más de `SLEEP.redundant` mordiscos del mismo fruto con el mismo resultado en un día se fusionan; los destacados nunca se borran |
| replay intercalado | los frutos que quedan en el registro (propios, tras el olvido) se repasan juntos `SLEEP.replay` rondas, cada uno hacia su recompensa media, con la regla de Rescorla-Wagner a `SLEEP.replayRate`; el orden es fijo (por clave, rotado en cada ronda). Solo cambian los pesos `w` de los rasgos; `n` no, porque repasar no es un encuentro nuevo. Los rasgos que cruzan un umbral reescriben su regla con la sensación `sleep` |
| contradicciones | frutos con resultados de signo opuesto en el mismo día |
| preguntas | hipótesis con excepciones o poco soporte, y frutos percibidos pero nunca probados |
| informe | solo datos (se verifica que se serializa a JSON sin pérdida); se graba como evento `night_report` y se expone en la observación v2 |

`SLEEP.consolidate = 0` es la ablación: duerme, pero no ordena nada. `SLEEP.replay = 0` conserva el resto de la noche y quita solo el replay.

**Por qué un replay y no más refuerzo.** De día, cada mordisco reparte la misma sorpresa entre todos sus rasgos, un mordisco detrás de otro. Así nace la culpa mal repartida: la primera fruta mala culpa a su forma tanto como a su olor, y la última fruta probada pesa más que las anteriores. El repaso nocturno intercalado (McClelland, McNaughton y O'Reilly, 1995) lleva cada rasgo hacia lo que predice en el conjunto de frutas recordadas. Es la única operación de la noche que el día no puede hacer por sí mismo, porque el día nunca ve dos frutas a la vez.

`SLEEP.downscale > 0` añade, antes de cada ronda, una atenuación multiplicativa de los pesos repasados (homeostasis sináptica, Tononi y Cirelli). Junto con el replay equivale a una regresión ridge: favorece el rasgo que comparten varias frutas frente al rasgo visto en una sola. Viene apagado por lo que se mide en el §25.2.

---

## 12. Aprender elementos realmente nuevos

### 12.1 Problema actual

Si el código define de antemano `food`, `water`, `nest` y cada acción posible, el agente no crea conceptos nuevos: solo descubre valores ocultos dentro de categorías que el programador ya conoce.

### 12.2 Representación basada en rasgos

Los objetos percibidos deben describirse mediante rasgos observables:

```js
{
  id: 44,
  visual: {
    color: "violet",
    shape: "lobed",
    size: 0.42,
    motion: 0
  },
  smell: {
    acidic: 0.7,
    sweet: 0.2,
    rotten: 0.0
  },
  touch: null,
  knownAffordances: [],
  confidence: 0.15
}
```

La verdad del simulador permanece oculta. Fagi aprende **affordances**: qué puede hacer con el objeto y qué suele ocurrir.

### 12.3 Descubrimiento de affordances

Acciones experimentales mínimas:

- acercarse;
- observar;
- oler;
- tocar;
- probar una cantidad pequeña;
- consumir;
- recoger;
- soltar;
- transportar;
- combinar;
- esperar y volver a observar;
- seguir a otro individuo que interactúa.

El agente puede descubrir que algo:

- se come;
- hidrata;
- intoxica;
- da sombra;
- conserva calor;
- bloquea el paso;
- sirve como material;
- atrae a otros;
- cambia con el tiempo;
- solo es útil al combinarse con otra cosa.

### 12.4 Formación de conceptos

Un concepto nuevo no debe ser solo un nombre inventado. Debe representar un grupo de observaciones que mejora predicción o conducta.

Criterio mínimo para conservar un concepto:

- agrupa varios episodios;
- permite predecir una consecuencia mejor que el azar;
- puede distinguirse de otros conceptos;
- cambia alguna decisión;
- mantiene registro de evidencia y excepciones.

Ejemplo:

```text
Concepto C17:
  rasgos frecuentes: tibio + poroso + olor mineral
  affordance aprendida: conserva temperatura dentro del refugio
  confianza: 0.71
  evidencia: 6 episodios
  excepciones: 1
```

### 12.5 Curiosidad dirigida

La curiosidad no debe equivaler a movimiento aleatorio. Una acción exploratoria recibe valor si puede reducir incertidumbre relevante.

```text
valor_exploración = incertidumbre
                    × utilidad_potencial
                    × novedad
                    - riesgo
                    - coste_energético
```

Cuando hambre, sed o temperatura son críticas, sobrevivir debe dominar. En estado estable, el agente puede elegir experimentos informativos.

### 12.6 Experimentos implementados: el mordisco de prueba

`experiment.js` y `decision/experiment.js`, con el flag `EXPERIMENT.enabled`, que forma parte del organismo.

Medir antes de diseñar cambió el problema. Con 6 especies, cada vida **ve las 6** (casi todas antes de los 200 s), pero **prueba unas 3**. El cuello de botella no es encontrar las especies, sino decidir probarlas. Una especie no probada que se deja pasar sin hambre acaba guardada sin probar o abandonada, y la mitad de las que se quedaban sin probar no eran dañinas.

1. **Agenda.** Al terminar la noche, las preguntas del informe (§11.4) se convierten en la agenda del día: frutas vistas y nunca probadas (`taste`), y frutas no probadas que tienen un rasgo cuya hipótesis tiene excepciones o poco soporte (`check`). Como máximo `EXPERIMENT.agenda` entradas. Solo entra lo que Fagi percibió, así que nada revela qué es cada fruta.
2. **Regla `taste`**, en el último nivel (§16.7, experimentación y exploración) y antes de explorar. Se activa si no aprieta nada, no carga nada, le sobra energía y hay a la vista una fruta de la agenda cuyos rasgos no le dan una cautela ≥ `EXPERIMENT.maxWary`. Elige la más cercana.
3. **Mordisco de prueba.** Al tocarla come solo `EXPERIMENT.portion` (0,25) de la fruta. El hambre cambia en esa fracción, y cada efecto pasa a `mult^porción` y dura esa fracción del tiempo. Lo que siente se divide por la porción, porque sabe lo pequeño que fue el bocado, así que aprende casi lo mismo que con una fruta entera. La explicación lo dice con la sensación `trial`. La pregunta queda respondida.

Con `SLEEP.consolidate = 0` la noche no pregunta nada, la agenda queda vacía y no hay experimentos. Esa es la parte del sueño que llega al día siguiente. Las mismas preguntas podrían calcularse despierta; el diseño las ata a la noche porque la noche es cuando el día ya está ordenado y hay algo que preguntar.

---

### 12.7 Identidad real y representación percibida

`percept.js`, con el flag `PERCEPT.enabled`, que forma parte del organismo.

**La auditoría.** La memoria de Fagi se indexa por tipo de fruta (`brain.facts['red-round-sour']`). Eso no es una fuga: cada tipo tiene un aspecto propio (color, forma y olor), así que distinguirlos a la vista es exactamente lo que es ver. Renombrar las claves por sus rasgos no cambiaría nada de lo que sabe. Sí había fugas en otros sitios:

1. **Por el olfato conocía la especie exacta.** Un fruto que solo olía se juzgaba con su memoria de esa especie y con las reglas escritas sobre ella, aunque por el olor solo sabía cómo olía.
2. **Rastreaba estelas por especie, no por olor.** Distinguía dos estelas del mismo olor según qué especie las emitía.
3. **La API recibía los nombres internos.** Nombres como `toxic` o `nectar`; `toxic` le dice literalmente al modelo que es tóxica (§17: «solo lo que Fagi puede conocer»).
4. **Una especie silvestre podía tener el mismo aspecto que una fruta clásica** (por ejemplo `blue-crystal-sharp`, igual que `spark`) con otros efectos. Si convivían, su memoria las distinguía sin poder percibir la diferencia. El generador solo evitaba claves repetidas, no aspectos repetidos. Lo encontró un test.

**Con `PERCEPT` encendido:**

- un fruto que solo huele se juzga por lo que ese olor ha significado para ella (`learned/cues.js`): nada de su memoria de la especie, ni reglas sobre ella, ni preguntas de su agenda; una regla sobre el olor sí se aplica;
- al rastrear sigue un olor, lo emita quien lo emita;
- la API recibe rasgos, nunca nombres: un fruto olido es `smell:<olor>`, y cada nombre clásico se sustituye por su aspecto (`red-round-rotten`);
- ninguna especie nueva puede tener el aspecto de una fruta clásica.

Con el flag apagado, el sorteo de especies es el mismo que usaron los estudios preregistrados.

Queda fuera de este paso: los objetos del mapa (agua, nido, árbol, roca) siguen siendo categorías que Fagi reconoce de nacimiento, y la traza de sinapsis (`synapses.js`, que no decide nada) sigue ligando olores a especies. Formar conceptos a partir de rasgos es el resto de la fase 6.

## 13. Memoria propuesta

### 13.1 Memoria episódica

Guarda experiencias concretas. Es detallada, costosa y se olvida rápido.

### 13.2 Memoria semántica

Guarda regularidades: “objetos con estos rasgos suelen producir este efecto”. Se crea a partir de varios episodios.

### 13.3 Memoria procedimental

Guarda habilidades y políticas: cómo rodear un obstáculo, regresar al refugio o regular temperatura.

### 13.4 Memoria espacial

Guarda lugares, rutas, estacionalidad local y confianza en cada recuerdo.

### 13.5 Memoria social

Guarda quién transmitió una regla, cuánta confianza merece y si sus consejos se confirmaron.

### 13.6 Olvido útil

El olvido no es un error. Debe:

- eliminar detalles redundantes;
- conservar experiencias críticas;
- reducir confianza en información antigua;
- permitir reaprendizaje cuando el entorno cambia;
- impedir crecimiento ilimitado de memoria.

---

## 14. Sistema de decisión

La jerarquía fija actual es útil como capa de seguridad, pero no debe decidirlo todo.

Arquitectura recomendada:

```text
reflejos vitales
    ↓
restricciones de seguridad
    ↓
metas homeostáticas
    ↓
predicción de resultados
    ↓
selección de acción
    ↓
ejecución y aprendizaje
```

### 14.1 Reflejos no aprendidos

- salir de agua profunda;
- evitar temperatura letal inmediata;
- beber cuando está en contacto con agua y la sed es extrema;
- detener acciones imposibles.

### 14.2 Conductas que sí deben aprenderse

- qué alimento conviene;
- dónde buscarlo;
- cuándo volver antes de la noche;
- qué refugio regula mejor la temperatura;
- qué señales anuncian lluvia, calor o frío;
- en quién confiar;
- qué objeto desconocido vale la pena probar;
- cuándo reproducirse;
- cómo repartir exploración y explotación.

### 14.3 Modelo predictivo

La evolución importante será pasar de “regla que responde” a “acción cuyo resultado se estima”. Para cada acción candidata:

```text
utilidad = supervivencia_esperada
          + información_esperada
          + valor_reproductivo
          + valor_social
          - riesgo
          - energía
          - tiempo
```

Los pesos no deberían ser todos constantes. El estado corporal cambia su relevancia.

---

## 15. Entorno necesario para aprendizaje abierto

Un agente no puede demostrar inteligencia si el entorno no exige adaptarse. Se deben añadir gradualmente:

- cambios de temperatura por zona y hora;
- sombra móvil o refugios con propiedades distintas;
- recursos que cambian de lugar;
- alimentos con rasgos parcialmente compartidos;
- objetos neutros que puedan adquirir utilidad;
- materiales combinables;
- amenazas o competidores simples;
- señales engañosas;
- cambios estacionales;
- química invertida entre generaciones;
- escasez temporal;
- eventos nunca vistos durante entrenamiento;
- otros agentes con información incompleta o incorrecta.

No se deben agregar todos a la vez. Cada dimensión nueva necesita pruebas aisladas para saber qué causó cada resultado.

---

## 16. Cambios técnicos por módulo

> **Nota de implementación.** Los nombres de archivo de esta sección eran una propuesta. Lo que existe hoy es: `src/cycle.js`, `src/thermal.js` (temperatura, luz y su aprendizaje), `src/biology.js` (sexo y cuerpo), `src/sleep.js`, `src/consolidation.js`, `src/organism.js` (encender y apagar), `src/app/organism-on.js` y `scripts/batch/organism.js`. No se crearon `src/memory/*.js` ni `src/learned/hypotheses.js`, porque las estructuras existentes ya cubren esa función (§6). `src/lifecycle.js` y `src/reproduction.js` siguen pendientes (§25).

### 16.1 Configuración

Archivo principal: `src/config.js`

Agregar bloques:

- `CYCLE`;
- `THERMAL`;
- `SEX`;
- `LIFE`;
- `REPRODUCTION`;
- `SLEEP`;
- `NOVELTY`.

Toda constante debe tener unidad, rango y explicación.

### 16.2 Mundo

Archivos principales:

- `src/world.js`;
- `src/simulation.js`;
- nuevo `src/cycle.js`;
- futuro `src/seasons.js`.

Responsabilidades:

- reloj circadiano;
- luz;
- temperatura ambiente;
- día actual;
- actualización previa al turno de los entes;
- reinicio y grabación deterministas.

### 16.3 Biología

Archivos propuestos:

- `src/biology.js`;
- `src/thermal.js`;
- `src/lifecycle.js`;
- `src/reproduction.js`.

Responsabilidades:

- sexo;
- estadísticas corporales;
- temperatura;
- salud;
- madurez;
- fertilidad;
- gestación o huevo;
- nacimiento y senescencia.

### 16.4 Agente

Archivo principal: `src/fagi.js`

Cambios:

- aceptar opciones de nacimiento;
- inicializar sexo, genoma y temperatura;
- actualizar termorregulación antes de decidir;
- actualizar consolidación después de descansar;
- aplicar muerte térmica y de salud;
- exponer estado interno sin filtrar verdad del mundo.

### 16.5 Necesidades y movimiento

Archivos:

- `src/needs.js`;
- `src/movement.js`.

Cambios:

- energía máxima individual;
- metabolismo individual;
- coste por frío;
- sed por calor;
- velocidad corporal y penalización térmica;
- recuperación dependiente de refugio y etapa vital.

### 16.6 Percepción

Archivos:

- `src/perception.js`;
- `src/interoception.js`;
- `src/observation.js`.

Cambios:

- luz percibida;
- temperatura sentida;
- sensación de frío o calor;
- presión de sueño;
- rasgos observables de objetos;
- incertidumbre;
- último informe nocturno;
- ocultar propiedades que el agente aún no ha descubierto.

### 16.7 Decisión

Archivos:

- `src/decision.js`;
- `src/decision/endure.js`;
- futuro `src/decision/reproduce.js`;
- futuro `src/decision/experiment.js`.

Orden recomendado:

1. emergencia física;
2. hambre, sed y temperatura críticas;
3. descanso y refugio;
4. cuidado de descendencia dependiente;
5. búsqueda de recursos;
6. reproducción;
7. experimentación y exploración.

### 16.8 Generaciones

Archivos:

- `src/generations.js`;
- `scripts/batch/generations.js`.

Cambios:

- genoma con sexo y rasgos corporales;
- recombinación de dos progenitores;
- selección separada de candidatos;
- mutación posterior a recombinación;
- registro de parentesco;
- medición de diversidad genética;
- extinción como resultado válido, no como excepción silenciosa.

### 16.9 Sueño y consolidación

Archivos propuestos:

- `src/consolidation.js`;
- `src/memory/episodic.js`;
- `src/memory/semantic.js`;
- `src/learned/hypotheses.js`.

La primera versión puede producir un informe estructurado. Una versión posterior podrá inducir reglas provisionales y probarlas al día siguiente.

### 16.10 Representación visual

Archivos:

- `src/fagi-sprite.js`;
- nuevo `src/fagi-sprite/entity.js`;
- `src/render.js`;
- `src/ui.js`;
- `index.html`;
- `src/i18n/es.js`;
- `src/i18n/en.js`.

Cambios visibles:

- sprite de ente;
- iluminación nocturna;
- indicador de día y fase;
- temperatura ambiente y corporal;
- sexo y etapa vital;
- estrés térmico;
- número de consolidaciones;
- causa de muerte por frío o calor.

### 16.11 Grabación y reproducción

La grabación debe incluir:

- cambio de día y fase importante;
- temperatura ambiente;
- sexo y nacimiento;
- reproducción y progenitores;
- muerte y causa;
- inicio y fin de sueño;
- resumen nocturno;
- creación de concepto;
- propuesta aceptada o rechazada.

El replay debe reproducir el mismo resultado con la misma semilla.

---

## 17. Contrato de observación para la IA externa

Ejemplo de versión futura:

```json
{
  "version": 2,
  "time": {
    "age": 184.2,
    "day": 3,
    "phase": 0.78,
    "light": 0.12,
    "isNight": true
  },
  "biology": {
    "sex": "female",
    "stage": "adult",
    "hunger": 0.31,
    "thirst": 0.42,
    "energy": 0.68,
    "temperature": 14.8,
    "thermalState": "cold",
    "thermalStress": 0.21,
    "sleepPressure": 0.74
  },
  "perception": {
    "objects": [],
    "places": [],
    "agents": []
  },
  "memory": {
    "activeRules": [],
    "uncertainConcepts": [],
    "lastNightReport": null
  },
  "allowedActions": [],
  "instinctProposal": {}
}
```

El API debe enviar solo lo que Fagi puede conocer. La verdad interna del simulador se reserva para evaluación.

**Corrección.** El ejemplo anterior enviaba `day`, `phase` e `isNight`, lo que contradice el §7.4: Fagi no conoce el reloj. La versión 2 implementada (`observation.js`, solo con el organismo encendido; sin él se sigue enviando la versión 1, igual que antes) añade:

```json
{
  "version": 2,
  "senses": { "light": 0.12, "dark": true, "dimming": false },
  "biology": {
    "sex": "female", "stage": "adult", "energyMax": 112,
    "temperature": 14.8, "thermalState": "cold", "thermalStress": 0.21,
    "sleepPressure": 0.74, "asleep": false
  },
  "memory": {
    "consolidations": 3,
    "lastNightReport": { "night": 3, "episodes": 7, "hypotheses": [], "contradictions": [], "questions": [] }
  }
}
```

La temperatura del aire, la hora y el día no se envían, porque Fagi no los siente.

---

## 18. Evaluación científica

### 18.1 Baselines obligatorios

Comparar contra:

1. agente aleatorio;
2. agente de reglas fijas;
3. agente actual sin consolidación;
4. agente con aprendizaje individual;
5. agente con aprendizaje y sueño;
6. agente con cultura;
7. agente con evolución;
8. sistema completo.

### 18.2 Ablaciones

Desactivar una pieza a la vez:

- sin memoria episódica;
- sin olvido;
- sin sueño;
- sin modelo externo;
- sin curiosidad;
- sin comunicación;
- sin reproducción sexual;
- sin variación térmica;
- sin cambio ambiental.

Si quitar una pieza no empeora nada, esa pieza no está demostrando valor.

### 18.3 Métricas individuales

- tiempo vivo;
- porcentaje de necesidades en rango seguro;
- episodios de estrés térmico;
- energía obtenida por energía gastada;
- daño por primer contacto con novedades;
- rapidez de aprendizaje;
- calibración de confianza;
- errores repetidos;
- transferencia a objetos nuevos;
- retorno seguro antes de condiciones adversas;
- calidad predictiva de conceptos.

### 18.4 Métricas poblacionales

- nacimientos y muertes;
- diversidad genética;
- proporción sexual;
- tamaño efectivo de población;
- éxito reproductivo por linaje;
- consanguinidad;
- supervivencia después de cambios ambientales;
- velocidad de adaptación generacional;
- pérdida o conservación cultural;
- tasa de extinción.

### 18.5 Métricas de consolidación

- precisión de reglas antes y después de dormir;
- reducción de memoria sin pérdida de desempeño;
- generalizaciones correctas;
- falsas generalizaciones;
- contradicciones resueltas;
- hipótesis útiles propuestas;
- coste computacional por noche.

### 18.6 Protocolo

- múltiples semillas;
- mapas no vistos;
- intervalos de confianza;
- mismos recursos para cada condición;
- resultados fallidos incluidos;
- parámetros congelados antes del experimento final;
- datos brutos conservados;
- afirmaciones limitadas a las métricas observadas.

---

## 19. Plan de implementación por fases

### Fase 0 — Definición y compatibilidad

**Meta:** fijar contratos antes de aumentar complejidad.

- [ ] Aprobar esta especificación.
- [ ] Decidir duración inicial del día.
- [ ] Definir rangos térmicos de la especie ficticia.
- [ ] Definir nomenclatura de sexo y etapas vitales.
- [ ] Crear pruebas de regresión del comportamiento actual.
- [ ] Versionar observaciones, grabaciones y snapshots.

**Criterio de salida:** el proyecto actual sigue pasando todas sus pruebas y los nuevos contratos están documentados.

### Fase 1 — Día, noche y temperatura

**Meta:** hacer que el entorno tenga ritmo y que el cuerpo deba regularse.

- [ ] Implementar reloj circadiano determinista.
- [ ] Añadir temperatura ambiente.
- [ ] Añadir temperatura corporal y estrés térmico.
- [ ] Conectar frío con energía/hambre.
- [ ] Conectar calor con sed.
- [ ] Añadir refugio térmico.
- [ ] Añadir decisiones de regulación.
- [ ] Mostrar datos en HUD.
- [ ] Añadir iluminación nocturna.
- [ ] Registrar y reproducir el ciclo.

**Criterio de salida:** Fagi sobrevive mejor cuando aprende o utiliza refugio que cuando ignora la temperatura.

### Fase 2 — Ente ficticio y dimorfismo

**Meta:** abandonar las restricciones conceptuales de la hormiga.

- [ ] Crear el sprite nuevo.
- [ ] Eliminar texto zoológico incorrecto.
- [ ] Añadir sexo al nacimiento.
- [ ] Aplicar estadísticas corporales balanceadas.
- [ ] Mostrar sexo y rasgos relevantes.
- [ ] Probar que ningún sexo domina todos los escenarios.

**Criterio de salida:** ambos sexos presentan fortalezas distintas y resultados comparables bajo una batería diversa.

### Fase 3 — Sueño y consolidación local

**Meta:** convertir el descanso en procesamiento de memoria.

- [ ] Crear presión de sueño.
- [ ] Exigir un periodo mínimo de descanso.
- [ ] Seleccionar episodios destacados.
- [ ] Generar informe nocturno determinista.
- [ ] Consolidar reglas con evidencia.
- [ ] Medir olvido y compresión.
- [ ] Comparar con condición sin sueño.

**Criterio de salida:** dormir mejora transferencia o retención sin recibir información externa adicional.

### Fase 4 — IA nocturna acotada

**Meta:** usar el modelo como generador de hipótesis verificables.

- [ ] Diseñar esquema de entrada y salida.
- [ ] Restringir salida a DSL declarativo.
- [ ] Validar estructura y referencias.
- [ ] Ejecutar propuestas en sandbox de simulación.
- [ ] Aceptar solo mejoras reproducibles.
- [ ] Registrar cada rechazo y aceptación.
- [ ] Añadir fallback totalmente local.

**Criterio de salida:** ninguna respuesta del modelo puede ejecutar código arbitrario y toda mejora aceptada tiene evidencia comparativa.

### Fase 5 — Reproducción sexual y ciclo de vida

**Meta:** pasar de generaciones artificiales a población persistente.

- [ ] Implementar recombinación genética.
- [ ] Añadir selección de pareja.
- [ ] Añadir costes reproductivos.
- [ ] Añadir huevo o gestación.
- [ ] Añadir juventud, madurez y senescencia.
- [ ] Registrar parentesco.
- [ ] Medir diversidad y consanguinidad.
- [ ] Permitir extinción.

**Criterio de salida:** la población puede mantenerse varias generaciones sin crear directamente cada generación desde el runner.

### Fase 6 — Novedad y conceptos emergentes

**Meta:** aprender objetos por rasgos y affordances.

- [ ] Separar identidad real de representación percibida.
- [ ] Añadir acciones experimentales.
- [ ] Estimar incertidumbre.
- [ ] Crear agrupaciones de experiencias.
- [ ] Formar conceptos provisionales.
- [ ] Probar conceptos en nuevas situaciones.
- [ ] Retirar conceptos que no predicen.

**Criterio de salida:** Fagi clasifica y usa correctamente una familia de objetos no vista durante el ajuste, sin recibir el identificador semántico real.

### Fase 7 — Ciencia reproducible

**Meta:** demostrar qué componentes aportan inteligencia adaptativa.

- [ ] Implementar baselines.
- [ ] Ejecutar ablaciones.
- [ ] Congelar parámetros.
- [ ] Ejecutar muchas semillas.
- [ ] Publicar resultados negativos.
- [ ] Generar reportes automáticos.
- [ ] Documentar límites y amenazas a validez.

**Criterio de salida:** los resultados pueden repetirse desde un comando y respaldan afirmaciones concretas, no impresiones visuales.

> Las casillas de este plan se actualizan en el §25, no aquí, para conservar la propuesta original tal como se escribió.

---

## 20. Pruebas mínimas requeridas

### Día y noche

- la fase es determinista;
- el contador de día avanza correctamente;
- la luz cambia suavemente;
- el reinicio restaura el ciclo;
- replay y ejecución producen la misma fase.

### Temperatura

- el cuerpo converge hacia el ambiente;
- el refugio reduce extremos;
- estar mojado acelera intercambio;
- el movimiento genera calor limitado;
- frío aumenta coste metabólico;
- calor aumenta sed;
- estrés acumulado puede matar;
- regresar al rango seguro recupera estrés.

### Sexo

- solo existen valores válidos;
- estadísticas se aplican una sola vez;
- energía usa máximo individual;
- misma semilla produce misma población;
- población inicial tiene compatibilidad reproductiva.

### Reproducción

- el hijo recibe información de ambos progenitores;
- la mutación respeta límites;
- los recuerdos no se heredan genéticamente;
- la cultura permanece separada del genoma;
- parentesco queda registrado;
- individuos inmaduros no se reproducen.

### Consolidación

- no ocurre despierto;
- no ocurre inmediatamente al entrar al refugio;
- ocurre una vez por noche;
- usa solo experiencias disponibles;
- registra evidencia;
- no ejecuta código de una respuesta externa.

### Novedad

- el agente no recibe el tipo verdadero;
- puede distinguir objetos por rasgos;
- actualiza predicciones después de actuar;
- reduce confianza cuando aparecen excepciones;
- transfiere una relación a un objeto nuevo;
- olvida conceptos inútiles.

---

## 21. Riesgos principales

### 21.1 Complejidad sin evidencia

Agregar muchas variables puede hacer la simulación más vistosa sin volver al agente más inteligente. Mitigación: cada módulo necesita baseline, ablación y métrica.

### 21.2 Conducta aparente programada

Si cada caso tiene una regla manual, la conducta parece inteligente pero no generaliza. Mitigación: mantener reflejos mínimos y trasladar decisiones normales a predicción aprendida.

### 21.3 Fuga de información

Si la observación incluye el tipo verdadero o el efecto oculto de un objeto, el agente no lo descubre. Mitigación: separar estado del simulador y observación del agente.

### 21.4 Autoedición inestable

Permitir que un modelo cambie el código después de cada noche puede destruir reproducibilidad y seguridad. Mitigación: DSL, validación, sandbox, evaluación y aprobación explícita.

### 21.5 Optimización de una sola métrica

Maximizar solo tiempo vivo puede producir un ente inmóvil en el refugio. Mitigación: evaluar supervivencia, información, reproducción, eficiencia y adaptación.

### 21.6 Colapso poblacional

Costes mal calibrados pueden extinguir la población antes de aprender. Mitigación: escenarios de calibración, reservas iniciales y múltiples semillas; no ocultar extinciones reales.

### 21.7 Antropomorfismo

Palabras como “sueña”, “entiende” o “quiere” pueden exagerar mecanismos simples. Mitigación: interfaz amigable, documentación técnica precisa y trazas explicables.

---

## 22. Mejoras posteriores con mayor valor

Una vez completadas las fases anteriores, las extensiones más útiles serían:

1. **Desarrollo corporal:** rasgos que cambian con edad y nutrición.
2. **Salud y lesiones:** consecuencias persistentes, no solo muerte instantánea.
3. **Microbioma o inmunidad simple:** nuevos costes y aprendizaje alimentario.
4. **Construcción:** mover materiales y modificar refugios.
5. **Comunicación emergente:** señales cuyo significado se aprende.
6. **Teoría de otros mínima:** predecir acciones de individuos conocidos.
7. **Roles flexibles:** división de trabajo nacida de estado y experiencia.
8. **Depredadores simples:** planificación y aprendizaje de señales de riesgo.
9. **Estaciones:** adaptación a cambios lentos y recurrentes.
10. **Migración:** decidir cuándo abandonar una zona conocida.
11. **Aprendizaje de herramientas:** usar un objeto para modificar otro.
12. **Currículo automático:** generar escenarios en el límite de competencia.

El orden recomendado es construcción, comunicación y estacionalidad antes que lenguaje complejo. Son capacidades más cercanas al objetivo de organismo autónomo.

---

## 23. Definición de éxito del proyecto

La versión objetivo se considera exitosa cuando, en mapas no vistos y múltiples semillas:

- mantiene homeostasis significativamente mejor que un agente aleatorio;
- supera a reglas fijas cuando cambia la relación entre señales y recursos;
- aprende a usar al menos una affordance no etiquetada;
- conserva aprendizaje útil después de dormir;
- corrige una creencia que dejó de ser válida;
- transfiere una regularidad a una variante nueva;
- utiliza información social sin adoptar sistemáticamente información falsa;
- mantiene una población con reproducción sexual durante varias generaciones;
- conserva diversidad suficiente para adaptarse a cambios;
- muere por causas que tendría un organismo real, nunca por artefactos de la simulación (§25.5); sobrevivir más no es un objetivo en sí;
- produce trazas que permiten explicar qué percibió, creyó, predijo y decidió;
- reproduce resultados estadísticos desde semillas registradas;
- muestra mediante ablaciones qué componentes aportan la mejora.

La afirmación pública adecuada sería:

> Fagi es un organismo artificial experimental con homeostasis, aprendizaje individual y social, consolidación de memoria, reproducción y adaptación generacional dentro de un microentorno abierto pero limitado.

No se utilizará “AGI” sin el calificativo explícito de objetivo experimental acotado.

---

## 24. Prioridad inmediata recomendada

El siguiente orden minimiza retrabajo:

1. completar día/noche y termorregulación;
2. cambiar el sprite y el lenguaje de hormiga a ente;
3. añadir sexo como propiedad corporal;
4. implementar informe nocturno local y medirlo;
5. convertir generaciones clonales en recombinación de dos progenitores;
6. separar rasgos percibidos de tipos verdaderos;
7. añadir experimentación y conceptos;
8. integrar la IA nocturna bajo esquema limitado;
9. implementar población persistente y ciclo vital;
10. ejecutar evaluación completa con baselines y ablaciones.

Este orden construye primero el cuerpo y el entorno, después la memoria, después la evolución y finalmente la apertura conceptual. Intentar todo al mismo tiempo haría imposible saber qué funciona.

---

## 25. Estado de implementación

Actualizado al implementar las fases 1 a 3 y parte de la 5. Todo está detrás de los flags del §0.

### 25.1 Hecho

**Fase 0**
- [x] Pruebas de regresión: con el organismo apagado, `batch.js` produce la misma salida byte a byte (verificado en una ejecución simple y en otra por generaciones con especies), y un nacimiento con `SEX` apagado consume exactamente un número aleatorio (`test/biology.test.js`).
- [x] Versionado: observación v1 → v2 (§17), nuevas columnas en `track` (`temperature`, `thermalStress`, `sleepPressure`, `sex`) compatibles con las sesiones antiguas, y nuevos eventos `day` y `night_report`.

**Fase 1: día, noche y temperatura**
- [x] Reloj circadiano determinista (`cycle.js`).
- [x] Temperatura ambiente, corporal y estrés térmico (`thermal.js`).
- [x] El frío aumenta el hambre y reduce la velocidad; el calor aumenta la sed.
- [x] El nido como refugio térmico; la copa de los árboles como sombra.
- [x] Decisiones: reflejo (`thermalReflex`, nivel sobrevivir) y reglas aprendidas `thermal` y `dusk` (nivel aguantar).
- [x] Visión reducida de noche.
- [x] HUD «Día y cuerpo», capa de noche y crepúsculo en el render, narración (amanecer, anochecer, primeras lecciones de frío, calor, refugio y oscuridad) y ajustes.
- [x] Grabación y replay.

**Fase 2: parcial**
- [x] Sexo al nacer (50/50) y estadísticas corporales equilibradas, aplicadas una sola vez.
- [x] Energía máxima individual; metabolismo y aislamiento.
- [x] La población inicial tiene siempre ambos sexos.
- [x] Sexo visible en el HUD, en las grabaciones y en la observación.

**Fase 3: sueño y consolidación local**
- [x] Presión de sueño (sube despierta, más deprisa de noche, y baja durmiendo).
- [x] Duerme de noche en el nido; agotada, en cualquier sitio.
- [x] Informe nocturno determinista, una vez por noche, con los pasos del §11.4.
- [x] Refuerzo, olvido de redundancias y ablación `SLEEP.consolidate = 0`.
- [x] Replay intercalado de los rasgos (§11.4), con su ablación `SLEEP.replay = 0` y un banco de laboratorio pareado (`scripts/sleep-lab.js`).
- [x] Las preguntas del informe dirigen el día siguiente: agenda y mordisco de prueba (§12.6).
- [x] Apetito y sed apetitiva, corregidos a partir de autopsias (§25.5).

**Fase 6: parcial**
- [x] Identidad real separada de lo percibido, en lo que Fagi decide y en lo que ve la API (§12.7).
- [x] El mordisco de prueba como primera acción experimental (§12.6).

**Fase 5: parcial (en batch)**
- [x] Recombinación de dos progenitores, mutación posterior y límites.
- [x] Parentesco (`genome.parents`), apareamientos entre hermanos, diversidad genética, proporción de sexos y cuerpo medio por generación.
- [x] La extinción es un resultado del informe.

### 25.2 Resultados de calibración

Mapa 1, `--organism`, 12 vidas de 2400 s por condición. Las cifras son descriptivas y no están preregistradas. Se volvieron a medir después de añadir los experimentos y el apetito (§25.1), que `--organism` también enciende. Solo cambió una muerte, en el clima duro sin conducta térmica (de 2 a 3), y el resto varió poco.

| Clima | `THERMAL.behave` | Muertes | Segundos con estrés | Pico de estrés | Despierta de noche |
|---|---|---|---|---|---|
| ±12 °C (por defecto) | 1 | 0/12 | 110 | 0,19 | 383 s |
| ±12 °C | 0 (ablación) | 0/12 | 174 | 0,26 | 547 s |
| ±16 °C | 1 | 1/12 (frío) | 502 | 0,57 | 323 s |
| ±16 °C | 0 (ablación) | 3/12 (frío) | 932 | 0,78 | 451 s |

**Criterio de salida de la fase 1:** se cumple en parte. Actuar sobre lo aprendido reduce aproximadamente a la mitad la exposición y el estrés. Con el clima por defecto el frío no llega a matar, así que la diferencia en supervivencia solo aparece con clima duro, y con 12 vidas no es concluyente. Lo aprendido al final, con el clima por defecto (valor medio): frío −0,46, calor −0,46, refugio +0,17, oscuridad −0,47.

**Criterio de salida de la fase 3: se cumple en el laboratorio y no en el juego.**

*Sin replay* (primera versión, solo refuerzo y olvido). Con 6 especies, 16 vidas de 1800 s y el mismo mapa, `SLEEP.consolidate = 1` y `= 0` dan el mismo aprendizaje: los mismos mordiscos dañinos, las mismas reglas y la misma exactitud. El refuerzo solo sube la confianza, y las decisiones ya pesan casi lo mismo gracias al residuo `MEMORY.floor`.

*Con replay intercalado, en el laboratorio* (`scripts/sleep-lab.js`). Sin mapa: una química al azar, K especies probadas dos veces cada una por la vía real de comer y sentir, y la misma Fagi evaluada despierta y tras una noche. Se evalúan todas las especies del catálogo que nunca probó (96 combinaciones menos las probadas). Son 300 ensayos pareados; la diferencia se da con su error típico:

| Condición | K | Acierto despierta → dormida | Cautela ante veneno | Cautela ante lo demás (falsas alarmas) |
|---|---|---|---|---|
| replay puro (`downscale 0`, por defecto) | 6 | 0,852 → 0,858 (+0,006 ± 0,001) | 0,609 → 0,607 (−0,002 ± 0,004) | 0,056 → 0,051 (−0,005 ± 0,001) |
| replay + atenuación (`downscale 0,1`) | 6 | 0,852 → 0,865 (+0,013 ± 0,001) | 0,609 → 0,573 (−0,036 ± 0,004) | 0,056 → 0,044 (−0,013 ± 0,001) |
| replay + atenuación (`downscale 0,1`) | 3 | 0,771 → 0,780 (+0,009 ± 0,002) | 0,476 → 0,434 (−0,042 ± 0,004) | 0,068 → 0,058 (−0,010 ± 0,001) |

Dormir con replay generaliza mejor sin recibir información nueva. Con el replay puro la mejora es pequeña pero no tiene coste: acierta más y da menos falsas alarmas sin perder cautela ante el veneno. La atenuación duplica la mejora en acierto, pero reduce la cautela ante el veneno más de lo que reduce las falsas alarmas. Para un organismo que muere por un mordisco, ese intercambio es peor, así que queda apagada.

*Con replay, en el juego* (`scripts/sleep-lab.js --game 32`). `--organism`, 6 especies, 32 vidas de 1800 s, un mapa por vida:

| Condición | Vivas al final | Mordiscos dañinos | Primeros mordiscos dañinos | Especies probadas | Exactitud equilibrada (catálogo) |
|---|---|---|---|---|---|
| `SLEEP.consolidate = 0` | 24/32 | 1,75 | 1,56 | 3,3 | 0,519 |
| `consolidate = 1`, `replay = 0` | 24/32 | 1,69 | 1,47 | 3,2 | 0,520 |
| `consolidate = 1`, `replay = 4` | 24/32 | 1,69 | 1,47 | 3,2 | 0,520 |

No hay diferencia. La causa es la exposición: en una vida Fagi prueba unas 3 especies, y el ajuste diurno ya reproduce esos pocos datos casi sin error (error cuadrático medio del repaso < 0,01). Las 8 muertes de cada condición son de hambre (5) y de sed (3), ninguna de frío, y son las mismas con y sin consolidación: lo que la noche cambia sobre la fruta no llega a decidir quién sobrevive. Para que la noche se note en el juego hacen falta más datos por vida (curiosidad dirigida por las preguntas del informe, §12.5, o vidas en colonia) antes que una consolidación más fuerte. Se deja constancia en lugar de ajustar parámetros hasta que aparezca un efecto.

**Experimentos: las preguntas de la noche, al día siguiente** (`scripts/sleep-lab.js --game 48`). `--organism`, 6 especies, 48 vidas de 1800 s, un mapa por vida y las mismas semillas en cada condición:

| Condición | Especies probadas | Especies buenas descubiertas | Frutas dañinas enteras | Bocados de prueba dañinos | Dosis dañina (en frutas enteras) | Exactitud de sus reglas | Vivas |
|---|---|---|---|---|---|---|---|
| sin experimentos (`EXPERIMENT.enabled = 0`) | 3,06 | 47 % | 1,54 | 0 | 1,54 | 0,516 | 36/48 |
| con experimentos, sin consolidar (`SLEEP.consolidate = 0`) | 3,13 | 47 % | 1,58 | 0 | 1,58 | 0,516 | 36/48 |
| con experimentos (por defecto) | **5,33** | **77 %** | **1,29** | 1,56 | 1,68 | 0,532 | 37/48 |

Preguntar de noche y probar de día hace que Fagi conozca casi el doble de especies y encuentre muchas más de las que alimentan. Además come menos frutas dañinas enteras, porque la especie mala ya la conoció con un bocado. El coste es un 9 % más de dosis dañina en total: bocados pequeños de especies que antes nunca habría probado. La supervivencia no cambia (las muertes siguen siendo de hambre y sed, 12 frente a 11), y la exactitud de sus reglas apenas sube, porque la mayoría de lo aprendido queda en los pesos de los rasgos sin llegar a regla. Sin consolidar no hay agenda, y el efecto desaparece por completo.

Esto no cumple por sí solo el criterio de salida de la fase 3 («dormir mejora transferencia o retención sin recibir información externa adicional»). La agenda mejora la **exploración**: cuántas especies prueba y encuentra. No mide transferencia ni retención. El criterio se cumple solo en el laboratorio, con el replay, y con un efecto pequeño (+0,006 de acierto en especies nunca probadas). En el juego sigue pendiente, y la retención a varios días no se ha medido. Ninguna de las dos vías cambia todavía la supervivencia.

**Sexos:** en 8 vidas de 1200 s sobrevivieron todas, tanto hembras (5) como machos (3); ningún sexo dominó en esa muestra. Hace falta una batería de mapas para afirmar equilibrio.

### 25.5 Realismo antes que supervivencia: autopsias

**Criterio.** El objetivo no es que Fagi sobreviva: es que se comporte y aprenda como un organismo real. Morir es un resultado válido; una muerte de sed con el agua demasiado lejos o un envenenamiento por probar lo desconocido son muertes de la vida real. Lo que se busca y se corrige son las muertes y conductas **que ningún animal tendría**. Nunca se ajustan parámetros para subir la tasa de supervivencia.

**Herramienta.** `scripts/autopsy.js` guarda los últimos 180 s de cada vida que muere: acción, regla, necesidades, temperatura, noche, distancia real al agua y a la fruta comestible, raciones comestibles del nido y carga. Además marca lo que parece un artefacto, para que lo lea una persona:

- quieta mientras la necesidad que la mata es crítica;
- dando vueltas sin avanzar;
- cerca del agua con sed crítica;
- con comida en su propia despensa;
- con fruta comestible a la vista;
- envenenada otra vez por la misma fruta o por el mismo olor.

**Lo que encontraron** (48 vidas de 1800 s, `--organism`, 6 especies), antes de cualquier corrección, con 11 muertes:

1. **Envenenamiento en serie, registrado como «hambre».** Dentro del nido, hambrienta, comía una ración por frame: dos o tres venenosas en el mismo segundo. El hambre subía de 45 a 96 en ~15 s y la causa quedaba como «hambre».
2. **Recién nacidas muertas de sed a los ~200 s.** Sin saber dónde había agua, dedicaban los primeros 120 s a acarrear fruta mientras la sed subía al 55 %, y solo empezaban a buscar agua al volverse crítica, casi siempre ya de noche.
3. **Indecisión en la puerta del nido.** Creía que la despensa tenía algo, entraba, no había nada que pudiera comer, salía siguiendo un olor, y la creencia la volvía a mandar dentro, cada medio segundo.

Al corregirlos aparecieron otros tres, y la autopsia también los mostró:

4. Quieta hasta 77 s con una fruta en la boca que el malestar no le dejaba comer.
5. Clavada sobre una fruta que no podía comer ni cargar.
6. Al pasar el malestar, se comía la misma fruta que la había envenenado, que había recogido estando enferma.

**Correcciones** (`appetite.js`, flag `APPETITE.enabled`, parte del organismo). Cada una es un mecanismo que tienen los animales, no un parche para que viva más:

| Mecanismo | Qué hace | Base |
|---|---|---|
| tiempo de manipulación | `APPETITE.handling` s entre bocados | comer no es instantáneo |
| malestar posingestivo | tras un bocado que sienta mal, `APPETITE.malaise` s sin comer nada que no sepa bueno | náusea; origen de la aversión aprendida |
| aversión al olor en un ensayo | no come una fruta sin probar si su **olor** le hizo daño (peso ≤ −`smellAversion`), ni lo que probó y fue malo, ni lo que sus rasgos juntos desaconsejan (cautela ≥ `averse`); tampoco lo guarda. El hambre desesperada (`desperate`) lo anula | efecto Garcia (Garcia y Koelling, 1966): la aversión se liga al sabor u olor, no al color ni a la forma, y basta un ensayo |
| sed apetitiva | con sed ≥ `searchWater` y sin saber dónde hay agua, deja de recolectar y la busca (regla `thirstSearch`) | la sed motiva la búsqueda antes de ser crítica |
| la despensa llama solo si hay algo comestible | la intención de ir a la despensa usa el mismo filtro que el nido | sin él, indecisión en la puerta |
| causa «envenenada» | si, sin el daño de los venenos de los últimos `poisonWindow` s, seguiría viva | nombrar la causa real |

**Resultado** (mismas 48 vidas y semillas):

| | Sin apetito | Con apetito |
|---|---|---|
| Muertes | 11: hambre 6, sed 5 | 10: envenenamiento 10 |
| Vidas con algo que parece un artefacto | 9 | **0** |
| Dosis de veneno recibida (en frutas enteras) | 1,68 | **1,20** |
| Especies probadas / especies buenas descubiertas | 5,33 / 77 % | 4,63 / 72 % |

Las 10 muertes que quedan son realistas y se dejan como están. Todas son de forrajeras ingenuas que prueban dos cosas desconocidas y venenosas con olores distintos, y en todas una de las dos es **fruta podrida** (`toxic`): la fruta que nadie recoge se pudre, y el olor a podrido todavía no le había hecho daño. Los machos mueren antes (hacia los 665 s, frente a los 800 s de las hembras) porque su metabolismo más rápido los lleva antes al umbral de hambre al que empiezan a comer lo desconocido. Que la aversión a lo podrido sea innata o aprendida es una pregunta abierta para la especie ficticia; por ahora es aprendida, como todo lo demás (§12).

Todas las muertes por sed desaparecieron con la sed apetitiva. La aversión reduce el veneno recibido y a cambio prueba algo menos: es el intercambio real entre prudencia y exploración.

### 25.6 Percepción: resultado

Organismo completo (48 vidas de 1800 s, 6 especies):

| | `PERCEPT = 0` | `PERCEPT = 1` |
|---|---|---|
| Vivas | 38/48 | 40/48 |
| Especies probadas / buenas descubiertas | 4,63 / 72 % | 4,69 / 74 % |
| Dosis de veneno (en frutas enteras) | 1,20 | 1,23 |
| Muertes / con algo que parece un artefacto | 10 / 0 | 8 / 0 |

La conducta apenas cambia, y era lo esperable. En la química por defecto el olor decide si una fruta alimenta o envenena, así que juzgar solo por el olor pierde poco. La diferencia importaría en químicas donde el veneno depende de color y olor a la vez (`family: 'conj'`). El valor de este paso no es un número: es que lo que Fagi aprende ya no puede apoyarse en información que no percibe, y eso lo comprueba un test (§20, novedad: «el agente no recibe el tipo verdadero»).

### 25.3 Pendiente

- Fase 2: sprite ficticio nuevo y retirar el lenguaje de «hormiga» de la interfaz y la documentación (`fagi-sprite/`, `i18n/`).
- Fase 3: medir la retención a varios días y si lo que se aprende con bocados de prueba llega a reglas; convertir lo que sabe de la fruta en supervivencia (hoy mueren de hambre y sed, no por la fruta).
- Fase 4: IA nocturna acotada (esquema, DSL, sandbox, aceptación por comparación). Aún no hay ninguna vía por la que un modelo externo modifique la memoria.
- Fase 5: reproducción dentro del mundo (selección de pareja, costes, huevo o gestación, juvenil y senescente, `fertility`, `health`) y población persistente sin runner; que los inmaduros no se reproduzcan.
- Fase 6: formar conceptos a partir de rasgos, que los objetos del mapa dejen de ser categorías innatas y el resto de acciones experimentales del §12.3 (tocar, combinar, esperar y volver a mirar).
- Fase 7: baselines (aleatorio, reglas fijas), batería de ablaciones del §18.2 y preregistro de las afirmaciones.

### 25.4 Cómo reproducir

Cada tabla se midió con el organismo tal como estaba en ese momento. `--organism` enciende hoy todas sus piezas, así que los comandos apagan las que se añadieron después (`--set …=0`); así reproducen las cifras exactas.

```text
npm test

# §25.2 calibración térmica (medida con apetito, antes de PERCEPT)
node scripts/batch.js --organism --runs 12 --duration 2400 --set PERCEPT.enabled=0
node scripts/batch.js --organism --runs 12 --duration 2400 --set PERCEPT.enabled=0 --set THERMAL.behave=0
node scripts/batch.js --organism --runs 12 --duration 2400 --set PERCEPT.enabled=0 --set CYCLE.swing=16
node scripts/batch.js --organism --runs 12 --duration 2400 --set PERCEPT.enabled=0 --set CYCLE.swing=16 --set THERMAL.behave=0

# §25.2 replay en el laboratorio
node scripts/sleep-lab.js --k 6 --trials 300
node scripts/sleep-lab.js --k 6 --trials 300 --set SLEEP.downscale=0.1
node scripts/sleep-lab.js --k 3 --trials 300 --set SLEEP.downscale=0.1

# §25.2 replay en el juego (antes de los experimentos, el apetito y PERCEPT)
OFF="--set EXPERIMENT.enabled=0 --set APPETITE.enabled=0 --set PERCEPT.enabled=0"
node scripts/sleep-lab.js --game 32 $OFF
node scripts/sleep-lab.js --game 32 $OFF --set SLEEP.replay=0
node scripts/sleep-lab.js --game 32 $OFF --set SLEEP.consolidate=0

# §25.2 experimentos (antes del apetito y PERCEPT)
OFF="--set APPETITE.enabled=0 --set PERCEPT.enabled=0"
node scripts/sleep-lab.js --game 48 $OFF --set EXPERIMENT.enabled=0
node scripts/sleep-lab.js --game 48 $OFF
node scripts/sleep-lab.js --game 48 $OFF --set SLEEP.consolidate=0

# §25.5 autopsias y apetito (antes de PERCEPT)
node scripts/autopsy.js --lives 48 --set PERCEPT.enabled=0 --set APPETITE.enabled=0
node scripts/autopsy.js --lives 48 --set PERCEPT.enabled=0
node scripts/sleep-lab.js --game 48 --set PERCEPT.enabled=0

# §25.6 percepción (el organismo completo)
node scripts/sleep-lab.js --game 48
node scripts/autopsy.js --lives 48

# generaciones con reproducción sexual
node scripts/batch.js --organism --set GEN.sexual=1 --generations 6 --colony 6 --runs 4 --duration 600 --set MAPGEN.species=6
```

