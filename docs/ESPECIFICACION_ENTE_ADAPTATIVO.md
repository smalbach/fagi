# Especificación: Fagi como ente adaptativo autónomo

**Estado:** en implementación: fases 1 a 7 hechas (ver §25)  
**Proyecto:** First AGI / Fagi  
**Objetivo de esta versión:** transformar la simulación actual, inspirada en una hormiga, en un entorno experimental para estudiar un organismo artificial limitado que percibe, aprende, descansa, consolida experiencias, se reproduce y se adapta durante varias generaciones.

---

## 0. Regla de compatibilidad (añadida al implementar)

El repositorio contiene estudios preregistrados y congelados (`docs/research/`) que ejecutan el mismo motor de simulación mediante `scripts/batch.js`. Todo lo que añade esta especificación debe respetar estas condiciones:

1. **Cada bloque nuevo arranca apagado** en `src/config.js` (`CYCLE.enabled`, `THERMAL.enabled`, `SEX.enabled`, `SLEEP.enabled`, `EXPERIMENT.enabled`, `APPETITE.enabled`, `PERCEPT.enabled`, `NIGHTAI.enabled`, `LIFE.enabled`, `CONCEPT.enabled`, `GEN.sexual`).
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

**Implementado** en `src/fagi-sprite/entity.js`; `fagi-preview.html` muestra todos los estados.

| Elemento | Cómo se dibuja |
|---|---|
| Cuerpo | Manto ovalado verde azulado, con volumen y borde iluminado según la luz del mundo. |
| Núcleo | Brilla con su estado vital, que es lo peor entre hambre, sed, energía y estrés térmico: verde si está bien, ámbar si le cuesta, rojo si falla. Late despacio, más despacio dormida. De noche su brillo se pinta sobre la oscuridad (`drawFagiGlow`), así que en la oscuridad es la luz que emite. |
| Locomoción | Cuatro filamentos blandos en S que caminan en pares diagonales. |
| Sentidos | Dos tallos sensoriales con bulbo; al rastrear un olor se abren hacia el lado que barre. |
| Membranas laterales | Translúcidas y festoneadas, con venas. Con calor se abren y aclaran; con frío se recogen bajo el manto y todo el cuerpo se encoge un 6 %. |
| Sexo | Diferencias sutiles: la hembra es más ancha y con la parte trasera más llena; el macho es más largo, más delgado, de tono más azul y con los tallos algo más largos. |
| Carga | Va sobre el dorso, detrás del núcleo. |
| Sueño fuera del refugio | Filamentos y tallos recogidos, cuerpo quieto. En el nido no se dibuja. |
| Cadáver | Se reconoce por la forma, no solo por el color: manto aplanado y arrugado, filamentos enroscados, tallos caídos y el núcleo convertido en un hueco oscuro. |

La hormiga anterior (patas, cabeza, antenas, hoja) se retiró. En la interfaz ya no se la llama hormiga. Las cifras corporales se calibraron con hormigas reales, el animal real más parecido en tamaño, y `config.js` lo dice así: son calibración, no una afirmación sobre qué es Fagi. Los identificadores de datos `colony.ants` y el campo `ants` de las grabaciones se conservan, porque las sesiones guardadas y los scripts de investigación dependen de ellos.

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

`fertility` es `fertility(fagi)` (`lifecycle.js`, §25.14); la gestación es el huevo en el nido (`reproduction.js`); `health` es `fagi.health` (`health.js`, §25.15).

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

### 10.6 Implementado: una población que se reproduce sola

`lifecycle.js` y `reproduction.js`, con el flag `LIFE.enabled`, que forma parte del organismo. En el juego, con `LIFE` encendido, la colonia empieza con `LIFE.founders` adultos (4) de ambos sexos. `scripts/population.js` la deja vivir sola y la mide.

| Parte | Cómo funciona |
|---|---|
| Etapas | Juvenil hasta `adultAt` (360 s, unos 2 días): más lenta (×0,85), no cría y se dibuja más pequeña. Adulta. Senescente desde el 75 % de su vida: cada vez más lenta (hasta ×0,6) y de colores apagados. Muere de vieja (causa `age`) al cumplir su esperanza de vida, que cada una sortea al nacer: `lifespan` ± 15 % (5400 s ≈ 30 días). |
| Condiciones (§10.1) | Hembra y macho adultos, dentro del nido, con energía ≥ 60 %, hambre y sed < 45 %, sin estrés térmico, pasado su tiempo de recuperación (hembra 360 s, macho 120 s), con una despensa que ella **cree** que guarda al menos 2 raciones que comería, y con sitio en el nido. |
| Elección de pareja (§10.2) | Entre los machos que pueden, el que mejor aspecto tiene (necesidades y energía, lo que cualquiera ve). Nunca un pariente con parentesco ≥ `kinLimit` (0,5: padre, madre, hijos, hermanos). |
| Costes (§10.4) | 15 de energía cada uno; la hembra paga además 12 de hambre, porque el huevo sale de ella. |
| Huevo | Se concibe en el apareamiento: genoma recombinado de ambos, más una mutación (`generations.js recombine`), y sexo sorteado en la concepción (§9.3). Se queda en el nido y se desarrolla según la temperatura del nido (nada por debajo de 12 °C y al máximo desde 22 °C). Cuando está listo necesita una ración de la despensa para eclosionar; si en `eggStarve` s no la hay, muere. |
| Cría | Juvenil. Nace sin recuerdos: solo trae sus genes (sesgos innatos y cuerpo). Si su madre vive, esta la cría con su cultura (`teach`), marcada como `born`. |
| Parentesco | `world.lineage` guarda madre, padre, generación y consanguinidad de cada individuo. La consanguinidad del huevo es la coascendencia de los padres, calculada recursivamente sobre el pedigrí. |
| Extinción | Cuando muere la última y no queda ningún huevo, se registra la extinción (`extinct`). Es un resultado válido, no un error. |

Nada de esto crea individuos desde el runner: después de los fundadores, cada generación sale de apareamientos dentro del mundo.

**Límite de población.** En este mundo la comida sobra: seis árboles sueltan unas 0,75 frutas/s y un individuo come unas 0,002/s. Lo que limita la población es el **espacio del nido**, `maxPopulation` (16, huevos incluidos): con el nido lleno no hay puesta. Es un límite físico real en organismos que anidan, pero conviene saber que la población se queda en ese techo y no en uno fijado por la comida.

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

**Implementado** en `src/night/` (§25.7). La «simulación aislada» es un contrafactual sobre su propia memoria, no una ejecución del mundo: ejecutar el mundo le diría qué son las cosas en realidad.

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

### 12.8 Cosas y conceptos: diseño implementado

`things.js`, `concepts.js` y `decision/things.js`, con el flag `CONCEPT.enabled`, que forma parte del organismo.

**El problema que resuelve.** La fruta ya se aprende por rasgos, pero Fagi sabe de nacimiento que es comida: solo descubre si una fruta concreta alimenta o envenena. Para aprender un objeto realmente nuevo hace falta algo cuya utilidad no venga dada por su categoría.

**Cosas.** Objetos pequeños del mapa, sin categoría innata. Fagi solo percibe su aspecto, con tres rasgos que no comparte con la fruta: color, forma (`stone`, `pod`, `tuft`, `shell`) y textura (`smooth`, `rough`, `spiny`, `soft`). Mismo aspecto, misma clase de cosa. Cada mapa tiene una química oculta de cosas: una dimensión (color, forma o textura) decide su *affordance*, igual que el olor decide qué hace una fruta.

| Affordance | Lo que hace | Cómo lo nota Fagi |
|---|---|---|
| `sap` | mordisquearla quita sed | la sed baja (interocepción) |
| `cool` | pegada a ella, el cuerpo se enfría | tacto frío |
| `warm` | pegada a ella, el cuerpo se calienta | tacto tibio |
| `sting` | tocarla o morderla duele | dolor |
| `inert` | nada | nada |

Lo que siente (frío o calor al tacto, dolor, alivio de la sed) son sentidos innatos, como el sabor o la temperatura del cuerpo. Lo que la cosa *permite* no viene dado: lo aprende.

**Acciones experimentales** (§12.3). *Tocar*: se acerca y la toca; el tacto dice frío, tibio, dolor o nada. *Mordisquear*: un bocado pequeño; dice alivio de sed, dolor o nada. Una cosa que al tacto no dice nada todavía puede ser `sap` o `inert`: solo mordisquear lo decide. «Esperar y volver a mirar» y «combinar» quedan fuera, porque ninguna cosa cambia con el tiempo ni se combina todavía.

**Conceptos** (§12.4). Un concepto agrupa clases de cosas con la misma affordance por los rasgos que comparten, de lo específico a lo general, como `learned/induce.js` con la fruta. Tiene:

- rasgos (la descripción más específica común a sus miembros);
- affordance;
- miembros y episodios que lo respaldan;
- excepciones (clases que encajan en la descripción pero hicieron otra cosa);
- aciertos y fallos al predecir clases nuevas.

Se conserva si agrupa al menos `CONCEPT.minKinds` clases, tiene más casos a favor que en contra y no repite la descripción de otro. **Se pone a prueba**: cuando Fagi se encuentra con una clase que nunca tocó, el concepto que la cubre predice su affordance, y al probarla se anota el acierto o el fallo. **Se retira** si, tras `CONCEPT.testMin` pruebas, acierta menos de la mitad. Uno retirado queda en el historial.

**Clases que brotan después.** A los `CONCEPT.lateAt` segundos (1200) aparecen `CONCEPT.lateKinds` clases que nunca estuvieron en el mapa, sobre los mismos valores del rasgo que decide. Es como una estación nueva. Lo que Fagi cree de ellas antes de tocarlas es lo que valen sus conceptos. Sin esto, examina todo el mapa en los primeros días y los conceptos apenas llegan a usarse.

**Curiosidad según la incertidumbre** (§12.5). No examina una clase que un concepto ya le predice con confianza ≥ `CONCEPT.sure`: la comprobará cuando la use.

**Volatilidad** (Behrens et al., 2007). Si una clase conocida se siente distinta o un concepto falla con una clase nueva, es una sorpresa: el mundo puede haber cambiado. Tres efectos:

- baja la confianza en todo lo que cree de las cosas (`CONCEPT.surprise`, que se desvanece con semivida `CONCEPT.calm`);
- vuelve a mirar lo que aprendió antes de esa racha de cambio (no lo que ya comprobó después);
- mientras duda, deja de fiarse de los conceptos, prueba más y los rehace.

En un mundo que no cambia nunca hay sorpresas y nada de esto ocurre. Con `CONCEPT.surprise = 0` (la ablación) nunca duda.

**Esperar y volver a mirar** (`CONCEPT.lookAgain`). Una cosa con savia que vacía queda seca un rato (`CONCEPT.sapRegrow`, 45 s), y ella lo ve. Recuerda cuándo la dejó seca y aprende cuánto tarda en rellenarse: verla llena otra vez le dice «como mucho tanto», y encontrarla aún seca, «más que esto». Con esa estimación, o un minuto antes de tener ninguna, vuelve a mirar cuando tiene sed. En 48 vidas de desarrollo bebe algo más de savia (15,9 frente a 15,1 bocados), y su estimación acaba en 58 s de media frente a los 45 reales. Solo la corrige cuando vuelve y la encuentra llena, así que tiende a quedarse larga.

**Combinar: forrar el nido** (`CONCEPT.lining`). Una cosa llevada al nido se queda allí y lo cambia: cada cosa tibia lo calienta `CONCEPT.liningHeat` (2,5 °C) y cada fría lo enfría. Es una affordance de la pareja cosa + nido, no de la cosa sola. Como las aves que forran el nido, el impulso de forrarlo es innato, pero qué lleva lo decide lo aprendido: con las manos libres y nada urgente, lleva una cosa que cree tibia, por su propio tacto o por un concepto, hasta `CONCEPT.lining` (3). El nido más cálido también incuba antes los huevos. 48 vidas de desarrollo:

| Clima | Cosas en el forro | Tiempo con estrés térmico | Muertes por frío |
|---|---|---|---|
| frío (media 13 °C), sin forro | 0 | 403 s | 14 |
| frío, con forro | 1,7 | **325 s** (−19 %) | 15 |
| templado, sin forro | 0 | 81 s | 0 |
| templado, con forro | 1,9 | **72 s** (−11 %) | 0 |

Pasa menos frío en el nido, pero no muere menos de frío: las muertes ocurren fuera, lejos de casa. No siempre hay cosas tibias: la química de cada mapa elige dos de frío, tibio y nada.

**Aprender mirando** (`CONCEPT.social`). Si una hermana se pica con una cosa, o bebe su savia, quien la ve aprende esa clase sin tocarla, con confianza `CONCEPT.seen` (0,6). El frío o el calor al tacto no se ven desde fuera, así que eso no se transmite. Lo visto cuenta como evidencia para sus conceptos, y lo que después viva ella lo sustituye. En los animales reales basta ver el miedo de otro para temer lo que lo causó (los monos y las serpientes de Mineka y Cook). En colonias de 4, con 24 mapas de desarrollo, las picaduras por individuo bajan de 2,24 a 1,88: solo aprende quien está mirando en ese momento.

**Cambia decisiones.**

- Con sed, una cosa que cree `sap` (por experiencia propia o por un concepto) y está más cerca que el agua la hace ir a mordisquearla.
- Con calor o frío, una cosa que cree `cool` o `warm` y está más cerca que el nido la lleva a pegarse a ella.
- Sin nada urgente, prueba las clases que no conoce, pero no toca las que un concepto le dice que pican.
- Con `CONCEPT.generalize = 0` (la ablación) aprende cada clase por separado y nunca predice una clase nueva.

**Criterio de salida** (§15, fase 6). Durante el ajuste, las affordances dependen solo de la forma o la textura. La evaluación usa además mapas donde las decide el **color**, una familia que no se vio nunca. Se mide:

- si, ante una clase nueva, su concepto predice bien la affordance (frente al azar y a la ablación);
- si usa bien esa predicción: bebe de una `sap` nueva antes de haberla probado y no toca una `sting` nueva.

Ninguna parte recibe el identificador real: la API ve rasgos y la decisión, conceptos.

### 12.9 Sabores y química nutricional: diseño

`TASTE` en `config.js`, que forma parte del organismo.

**Por qué.** Hasta aquí una fruta era un aspecto (color, forma, olor) y el olor decidía si alimentaba o envenenaba: tres clases (`nourishing`, `mild`, `poison`) y efectos fijos. En la naturaleza un alimento es una mezcla de compuestos, y el animal la conoce por la boca. Con sabores se pueden hacer muchas más cosas, parecidas al mundo real, sin escribir cada tipo a mano.

**Composición y efectos.** Cada especie del mapa tiene una composición oculta de hasta dos compuestos dominantes. El cuerpo nota sus efectos (físicas, `chemistry.js`):

| Compuesto | Sabor que la lengua percibe | Qué hace al cuerpo |
|---|---|---|
| azúcar | dulce | alimenta |
| proteína | umami | alimenta más |
| sal | salado | da sed |
| ácido | ácido | quita un poco de sed (jugoso) |
| taninos | astringente | resta lo que alimenta |
| alcaloides | amargo | a veces veneno, a veces nada: depende del mapa |
| capsaicina | picante | quema (un poco de salud), sin más daño |

El veneno sigue siendo el de siempre: el hambre sube y el cuerpo va lento. Casi siempre es amargo (`TASTE.toxicBitter`), pero en cada mapa hay alcaloides amargos inofensivos, y a veces un veneno sin sabor (`TASTE.hiddenToxin`). El olor se correlaciona con el sabor dominante sin revelarlo (lo dulce suele oler dulce; lo picante, penetrante), y el color sigue llevando sus efectos secundarios.

**Gusto innato** (`TASTE.valence`). Nace con una valencia por sabor, como los animales reales: le gusta el dulce, el umami y un poco lo salado; le disgustan el ácido, lo astringente, el picante y, sobre todo, lo amargo. Es una pista, no la verdad: lo amargo inofensivo y lo picante nutritivo existen, y aprender es descubrirlos.

**En la boca.** El sabor solo se percibe al morder: nunca a distancia, ni en la API antes del bocado.

- **Tragar o escupir.** Al morder calcula cuánto le gusta: su gusto innato, corregido por lo que ha aprendido de esos sabores. Si le disgusta lo bastante, la escupe y solo se traga un bocado pequeño (`TASTE.spitPortion`).
- **Cuándo no escupe.** Si el hambre es crítica, porque la necesidad vence al disgusto. Tampoco si ya sabe que esa fruta le sienta bien: es el sabor adquirido, como el café.
- **Lo que siente del sabor** (`TASTE.hedonic`) forma parte de la recompensa inmediata. Lo que la fruta hace al cuerpo llega aparte.

**Aprendizaje sabor-consecuencia.** Cada bocado enseña a los rasgos del aspecto y también a los sabores (`taste:bitter`, …), con la regla de Rescorla-Wagner de siempre. Los animales asocian el malestar con el sabor mucho mejor que con lo que ven (Garcia y Koelling, 1966). El resultado:

- lo aprendido de un sabor actúa en la boca ante una especie nueva;
- lo aprendido del aspecto actúa a distancia.

**Qué cambia en el resto del plan:**

- **Percepción** (§12.7). El sabor es un sentido de contacto, como el tacto de las cosas; `percept.js` no lo expone a distancia.
- **Apetito** (§25.5). La aversión de un solo bocado ahora se ata también al sabor.
- **Métricas.** El aspecto ya no decide el efecto, así que el juicio sobre el catálogo de 96 aspectos no tiene verdad. Con sabores, el juicio se mide sobre las especies del mapa.
- **Evaluaciones congeladas.** Apagan `TASTE`, como las demás piezas posteriores.

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

### Fase 8 — Sabores y química nutricional

**Meta:** que un alimento no sea un tipo fijo con un efecto fijo, sino una mezcla de compuestos que la lengua percibe como sabores, como en el mundo natural (§12.9).

- [ ] Composición oculta de cada alimento (azúcar, proteína, sal, ácido, taninos, alcaloides, capsaicina) y efectos derivados de ella.
- [ ] Siete sabores percibidos solo en la boca: dulce, umami, salado, ácido, astringente, amargo, picante.
- [ ] Gusto innato por cada sabor, como pista imperfecta y no como verdad.
- [ ] Decisión en la boca: tragar o escupir.
- [ ] Aprendizaje sabor-consecuencia y sabores adquiridos.
- [ ] Olor y color correlacionados con el sabor, sin revelarlo.
- [ ] Métricas por especie del mapa, porque el aspecto ya no decide el efecto.
- [ ] Ablaciones: sin gusto innato, sin aprendizaje del sabor.

**Criterio de salida:** con sabores, aprende qué comer con menos veneno que con el gusto innato solo, y llega a comer lo amargo inofensivo y lo picante nutritivo que su gusto innato rechazaba.

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
10. ejecutar evaluación completa con baselines y ablaciones;
11. sustituir los tipos de fruta por composiciones y sabores (fase 8, §12.9).

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
- [x] El reflejo salta también por la temperatura del cuerpo, antes de cualquier daño: el máximo y el mínimo térmicos voluntarios (§25.10).
- [x] Visión reducida de noche.
- [x] HUD «Día y cuerpo», capa de noche y crepúsculo en el render, narración (amanecer, anochecer, primeras lecciones de frío, calor, refugio y oscuridad) y ajustes.
- [x] Grabación y replay.

**Fase 2: ente ficticio y dimorfismo**
- [x] Sexo al nacer (50/50) y estadísticas corporales equilibradas, aplicadas una sola vez.
- [x] Energía máxima individual; metabolismo y aislamiento.
- [x] La población inicial tiene siempre ambos sexos.
- [x] Sexo visible en el HUD, en las grabaciones y en la observación.
- [x] Sprite ficticio nuevo (§5.2) y retirada del lenguaje de hormiga de la interfaz y de la documentación.
- [x] Batería de escenarios pareada: ningún sexo domina en todos (§25.10).

**Fase 3: sueño y consolidación local**
- [x] Presión de sueño (sube despierta, más deprisa de noche, y baja durmiendo).
- [x] Duerme de noche en el nido; agotada, en cualquier sitio.
- [x] Informe nocturno determinista, una vez por noche, con los pasos del §11.4.
- [x] Refuerzo, olvido de redundancias y ablación `SLEEP.consolidate = 0`.
- [x] Replay intercalado de los rasgos (§11.4), con su ablación `SLEEP.replay = 0` y un banco de laboratorio pareado (`scripts/sleep-lab.js`).
- [x] Las preguntas del informe dirigen el día siguiente: agenda y mordisco de prueba (§12.6).
- [x] Apetito y sed apetitiva, corregidos a partir de autopsias (§25.5).
- [x] Retención a varios días y bocados de prueba que llegan a reglas, medidos (§25.12).

**Fase 4: IA nocturna acotada**
- [x] Esquema de entrada (solo lo que sabe) y de salida (tres tipos de propuesta en una gramática declarativa).
- [x] Validación de estructura y de referencias.
- [x] Sandbox: contrafactual sobre su propia memoria.
- [x] Se acepta solo lo que mejora o cambia algo con respaldo, y se registran todas las aceptaciones y rechazos.
- [x] Mente local determinista como reserva; mente HTTP con tiempo límite.

**Fase 5: reproducción dentro del mundo**
- [x] Recombinación de dos progenitores, selección de pareja, costes reproductivos y huevo (§10.6).
- [x] Juvenil, adulta y senescente; muerte por vejez.
- [x] Parentesco y consanguinidad registrados; extinción como resultado válido.
- [x] La población se mantiene varias generaciones sin que el runner cree ninguna (§25.8).
- [x] Fertilidad que decae con la edad y densodependencia gradual; en el juego, se sigue a la descendencia (§25.14).
- [x] Salud como variable propia: daño, curación, cría y elección de pareja (§25.15).

**Fase 7: ciencia reproducible**
- [x] Baselines: agente aleatorio y agente de reglas fijas sin aprendizaje (`BASELINE`).
- [x] Batería de ablaciones del §18.2, en un mundo estable y en uno que se invierte a mitad de vida, y condiciones de población.
- [x] Protocolo congelado antes de correr (`docs/research/organism-protocol.md`, commit `c181469`), semillas nunca usadas, un solo comando.
- [x] Resultados negativos publicados, datos brutos conservados (`research/results/organism/`) e informe automático (§25.9).
- [x] Protocolo de seguimiento: replay, rigidez de la consolidación y memoria episódica como ablación propia (§25.13). El replay queda apagado por defecto.

**Fase 8: sabores y química nutricional** (§12.9, §25.16)
- [x] Composición oculta y efectos derivados de ella; siete sabores, solo en la boca.
- [x] Gusto innato como pista; tragar o escupir; sabor adquirido.
- [x] Aprendizaje sabor-consecuencia, con saliencia del sabor (Garcia).
- [x] Olor correlacionado con el sabor dominante.
- [x] Métrica de juicio por especie del mapa; ablaciones sin gusto innato y sin aprendizaje del sabor.
- [ ] Criterio de salida: se cumple a medias (§25.16).

**Fase 6: novedad y conceptos emergentes**
- [x] Identidad real separada de lo percibido, en lo que Fagi decide y en lo que ve la API (§12.7).
- [x] Acciones experimentales: el mordisco de prueba (§12.6); tocar y mordisquear cosas (§12.8).
- [x] Incertidumbre estimada: confianza de cada concepto, y volatilidad tras una sorpresa.
- [x] Agrupación de experiencias en conceptos provisionales, con miembros, excepciones, aciertos y fallos.
- [x] Conceptos puestos a prueba con clases nuevas, y retirados cuando fallan o cuando la evidencia los rehace.
- [x] Criterio de salida confirmado con protocolo congelado (§25.11).

**Fase 5: en batch (generaciones por lotes)**
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

| Condición | Vivas al final | Mordiscos dañinos | Primeros mordiscos dañinos | Especies probadas | Exactitud de sus reglas (catálogo)¹ |
|---|---|---|---|---|---|
| `SLEEP.consolidate = 0` | 24/32 | 1,75 | 1,56 | 3,3 | 0,604 |
| `consolidate = 1`, `replay = 0` | 24/32 | 1,69 | 1,47 | 3,2 | 0,619 |
| `consolidate = 1`, `replay = 4` | 24/32 | 1,69 | 1,47 | 3,2 | 0,613 |

No hay diferencia. La causa es la exposición: en una vida Fagi prueba unas 3 especies, y el ajuste diurno ya reproduce esos pocos datos casi sin error (error cuadrático medio del repaso < 0,01). Las 8 muertes de cada condición son de hambre (5) y de sed (3), ninguna de frío, y son las mismas con y sin consolidación: lo que la noche cambia sobre la fruta no llega a decidir quién sobrevive. Para que la noche se note en el juego hacen falta más datos por vida (curiosidad dirigida por las preguntas del informe, §12.5, o vidas en colonia) antes que una consolidación más fuerte. Se deja constancia en lugar de ajustar parámetros hasta que aparezca un efecto.

**Experimentos: las preguntas de la noche, al día siguiente** (`scripts/sleep-lab.js --game 48`). `--organism`, 6 especies, 48 vidas de 1800 s, un mapa por vida y las mismas semillas en cada condición:

| Condición | Especies probadas | Especies buenas descubiertas | Frutas dañinas enteras | Bocados de prueba dañinos | Dosis dañina (en frutas enteras) | Exactitud de sus reglas (catálogo)¹ | Vivas |
|---|---|---|---|---|---|---|---|
| sin experimentos (`EXPERIMENT.enabled = 0`) | 3,06 | 47 % | 1,54 | 0 | 1,54 | 0,608 ± 0,025 | 36/48 |
| con experimentos, sin consolidar (`SLEEP.consolidate = 0`) | 3,13 | 47 % | 1,58 | 0 | 1,58 | 0,601 ± 0,025 | 36/48 |
| con experimentos (por defecto) | **5,33** | **77 %** | **1,29** | 1,56 | 1,68 | **0,780 ± 0,027** | 37/48 |

Preguntar de noche y probar de día hace que Fagi conozca casi el doble de especies y encuentre muchas más de las que alimentan. Además come menos frutas dañinas enteras, porque la especie mala ya la conoció con un bocado. El coste es un 9 % más de dosis dañina en total: bocados pequeños de especies que antes nunca habría probado. La supervivencia no cambia (las muertes siguen siendo de hambre y sed, 12 frente a 11). Lo que sí cambia es cómo juzga lo que nunca probó: la exactitud de sus reglas sobre el catálogo sube de 0,61 a **0,78**. Sin consolidar no hay agenda, y el efecto desaparece por completo (0,60).

**Criterio de salida de la fase 3 («dormir mejora transferencia o retención sin recibir información externa adicional»): se cumple en el juego para la transferencia.** Las preguntas de la noche la llevan a probar más especies, y con eso juzga mejor las que nunca probó: la exactitud de sus reglas sobre las 96 combinaciones del catálogo pasa de 0,61 a 0,78. Sin sueño (sin consolidar), 0,60. El replay añade poco en el juego y algo en el laboratorio. La retención a varios días sigue sin medirse. Ninguna de las dos vías cambia todavía la supervivencia.

¹ **Corrección de la métrica.** Una versión anterior de estas tablas usó `accuracy()` de `research/lab/truth.js` sobre el catálogo completo. Esa función lee los rasgos de las especies registradas en el mapa, así que para las ~90 combinaciones que no estaban en el mapa no veía rasgos y ninguna regla de rasgos se aplicaba. Medía casi solo 6 especies (daba 0,52 en todas las condiciones) y llevó a concluir, por error, que la agenda no mejoraba la transferencia. `scripts/sleep-lab.js` ahora juzga cada combinación por sus rasgos, y las cifras de arriba están rehechas con él. Los estudios preregistrados no estaban afectados: allí el catálogo son las especies registradas.

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
| ¿Se la comería? Juicio (reglas y aversión) sobre el catálogo | 0,780 ± 0,027 | **0,870 ± 0,012** |

Las 10 muertes que quedan son realistas y se dejan como están. Todas son de forrajeras ingenuas que prueban dos cosas desconocidas y venenosas con olores distintos, y en todas una de las dos es **fruta podrida** (`toxic`): la fruta que nadie recoge se pudre, y el olor a podrido todavía no le había hecho daño. Los machos mueren antes (hacia los 665 s, frente a los 800 s de las hembras) porque su metabolismo más rápido los lleva antes al umbral de hambre al que empiezan a comer lo desconocido. Que la aversión a lo podrido sea innata o aprendida es una pregunta abierta para la especie ficticia; por ahora es aprendida, como todo lo demás (§12).

Todas las muertes por sed desaparecieron con la sed apetitiva. La aversión reduce el veneno recibido y a cambio prueba algo menos: es el intercambio real entre prudencia y exploración. Y mejora cómo juzga lo que nunca probó (0,78 → 0,87), aunque escribe menos reglas: la cautela vive en el apetito (lo que le da aversión), no solo en las reglas. Por eso, desde aquí, las tablas miden también el juicio completo, «¿se la comería?», y no solo sus reglas.

### 25.6 Percepción: resultado

Organismo completo (48 vidas de 1800 s, 6 especies):

| | `PERCEPT = 0` | `PERCEPT = 1` |
|---|---|---|
| Vivas | 38/48 | 40/48 |
| Especies probadas / buenas descubiertas | 4,63 / 72 % | 4,69 / 74 % |
| ¿Se la comería? Juicio sobre el catálogo | 0,870 ± 0,012 | 0,849 ± 0,017 |
| Dosis de veneno (en frutas enteras) | 1,20 | 1,23 |
| Muertes / con algo que parece un artefacto | 10 / 0 | 8 / 0 |

La conducta apenas cambia, y era lo esperable. En la química por defecto el olor decide si una fruta alimenta o envenena, así que juzgar solo por el olor pierde poco. La diferencia importaría en químicas donde el veneno depende de color y olor a la vez (`family: 'conj'`). El valor de este paso no es un número: es que lo que Fagi aprende ya no puede apoyarse en información que no percibe, y eso lo comprueba un test (§20, novedad: «el agente no recibe el tipo verdadero»).

### 25.7 Mente nocturna: diseño y resultado

`src/night/` (`index.js`: contrato, puerta y sandbox; `local.js`; `http.js`), con el flag `NIGHTAI.enabled`, que forma parte del organismo.

**Entrada** (`nightInput`). Solo lo que sabe, sin nombres del código ni química:

- el informe de la noche;
- las frutas que probó, por su aspecto, con lo que le hicieron de media;
- las que solo vio;
- los rasgos que conoce, con su peso;
- sus reglas vivas.

**Salida.** Una lista `proposals` de hasta `NIGHTAI.maxProposals`, cada una de uno de tres tipos:

| Tipo | Forma | Se acepta si |
|---|---|---|
| `rule` | `{ when: { all: [1–3 rasgos que conoce] }, verdict: avoid\|prefer, replaces?: [ids] }` | la respaldan ≥ `minSupport` frutas que probó, ninguna la contradice, no empeora cómo juzgaría lo que vivió, no la tiene ya y cambia el juicio sobre alguna fruta que conoce. Con `replaces` se evalúa como una sola revisión (entra la nueva y salen las otras, o nada), y cada regla reemplazada debe tener algo vivido en contra |
| `doubt` | `{ rule: id de una regla suya sobre rasgos }` | algo que vivió la contradice y, sin ella, juzgaría lo que vivió estrictamente mejor |
| `explore` | `{ look: aspecto de una fruta vista y no probada }` | no está ya en su agenda |

Todo lo demás se rechaza entero: código, reglas sobre una especie, rasgos que no conoce, campos desconocidos, listas largas. Una regla aceptada entra con `source: { kind: 'night' }` y confianza `NIGHTAI.trust`. Desde entonces responde ante lo que viva, como cualquier regla que no vivió: `checkTold` la retira cuando las frutas la contradicen. Cada propuesta queda en `fagi.nightLog` con el motivo, y en la grabación (`night_mind`). Una respuesta remota nunca bloquea el frame, y si llega tarde, con Fagi muerta o ya en otra noche, no cambia nada.

**Qué encontró probarla.**

1. **La primera puerta aceptaba duplicados.** Aceptó 27 reglas en 48 vidas sin cambiar ni un veredicto, porque solo comparaba identificadores. Ahora exige que la propuesta cambie algo.
2. **Faltaba poder corregir.** El error frecuente de Fagi no es que le falte una regla, sino que le sobra una falsa: por ejemplo «evita lo ácido» después de haber vivido una fruta ácida buena. Por eso existen `doubt` y la revisión atómica con `replaces` (de «rojo» a «rojo y ácido»), que ninguna propuesta suelta alcanzaba.
3. **Aprobar con lo vivido no garantiza generalizar.** Con 2–5 frutas probadas, algo puede mejorar el juicio sobre lo vivido y empeorar un poco el del resto.

**Resultado.**

| Banco | Química | Sin mente nocturna → con ella |
|---|---|---|
| Laboratorio (300 ensayos pareados, 6 especies probadas dos veces), exactitud de sus reglas en lo no probado | `smell` | 0,868 → 0,864 (−0,004 ± 0,006) |
| Laboratorio | `conj` (veneno = color **y** olor) | 0,807 → **0,867 (+0,060 ± 0,004)** |
| Juego, 48 vidas: juicio sobre el catálogo | `smell` | 0,849 ± 0,017 → 0,859 ± 0,016 |
| Juego, 48 vidas: exactitud de sus reglas | `conj` | 0,689 → 0,687 |

La mente nocturna local ayuda donde tiene algo que corregir: en la química `conj` las reglas de un solo rasgo son falsas, y en el laboratorio las retira o las sustituye por la conjunción (+6 puntos). En el juego no se nota. Cada vida prueba pocas especies, así que casi todo lo que propone no tiene respaldo suficiente (en 48 vidas se aceptan 0,8 cambios por vida de ~10 propuestos). La supervivencia no cambia.

**Criterio de salida de la fase 4:**

- «Ninguna respuesta del modelo puede ejecutar código arbitrario»: se cumple por construcción (la salida es datos en una gramática cerrada, sin `eval`) y lo comprueban los tests.
- «Toda mejora aceptada tiene evidencia comparativa»: se cumple; cada aceptación guarda su respaldo, lo que la contradice y la ganancia.

Queda pendiente probar un modelo de lenguaje real por `http`. La mente local es un piso, no un techo.

**Pregunta abierta.** Con el organismo completo sin experimentos ni mente nocturna, consolidar da un juicio menor que no consolidar (0,710 ± 0,025 frente a 0,791 ± 0,030). La diferencia está en el límite del ruido; se deja anotada, sin explicación todavía.

### 25.8 Población: resultado

`scripts/population.js --maps 8 --duration 10800`: 4 fundadores, el organismo completo, 6 especies, 60 días de juego por mapa.

| | Resultado |
|---|---|
| Se mantiene sola | **7 de 8 poblaciones** durante todo el periodo, en el techo del nido (16), con 6–7 generaciones |
| Nacimientos por mapa | 28 de media (entre 15 y 32) |
| Muertes | casi todas **de vejez** (16–21 por mapa); algún envenenamiento, frío o hambre |
| Consanguinidad media de los huevos | 0,06–0,13, por el cuello de botella de 4 fundadores |
| Diversidad genética de los vivos | 0,16–0,26 |
| Extinción | 0/8 totales. **Una funcional** (semilla 5001): quedan 2 machos |

**Semilla 5001.** El nido se llena hacia los 1800 s, y durante unos 3600 s no hay sitio para criar. La cohorte que nació salió sesgada por azar (5 hembras, 11 machos). Las fundadoras y la primera cohorte, casi de la misma edad, se vuelven senescentes a la vez y dejan de criar. Cuando se libera espacio queda una sola hembra adulta, emparentada con casi todos los machos, y luego ninguna. Es estocasticidad demográfica de una población pequeña con efecto fundador, como la que extingue poblaciones reales, y se deja como resultado. Contribuyen dos decisiones de diseño que conviene revisar con criterio biológico, no para evitar la extinción:

- el tope del nido es abrupto (todo o nada) y no una densodependencia gradual;
- la fertilidad se corta de golpe al empezar la senescencia, cuando en animales reales decae poco a poco.

**Hallazgo: lo aprendido no se acumula entre generaciones.** Una vida sola con el organismo completo llega a un juicio de ~0,85 sobre la fruta que nunca probó. En las poblaciones, los vivos se quedan en 0,55–0,80 según el mapa, sin tendencia de una generación a la siguiente. Dos causas probables:

- la cultura transmite **reglas**, pero la mayor parte del juicio vive en la **aversión** (el apetito y los pesos de los rasgos), que ni se enseña ni se hereda;
- en colonia cada individuo come mucho de la despensa común y prueba menos especies por su cuenta.

Transmitir preferencias alimentarias por vía social es algo que existe en animales reales (Galef: ratas que aprenden qué comer oliendo a una compañera), y sería el paso natural si se quiere cultura acumulativa.

**Criterio de salida de la fase 5** («la población puede mantenerse varias generaciones sin crear directamente cada generación desde el runner»): **se cumple**.

### 25.9 Evaluación con baselines y ablaciones: resultado

Protocolo congelado en `c181469` antes de cualquier corrida confirmatoria. 120 vidas por condición y mundo (semillas 9000–9119, mapas nunca usados), 2400 s cada una; 12 poblaciones por condición. Informe completo, generado por el propio código: `research/results/organism/report.md`.

**Hipótesis confirmatorias** (unilaterales, pareadas, Holm):

| | Predicción | a − b [IC 95 %] | dz | ¿Se sostiene? |
|---|---|---|---|---|
| H1 | vive más que un caminante aleatorio | +1725 s [1598, 1839] | 2,46 | sí |
| H2 | juzga mejor la fruta que nunca probó que el aleatorio | +0,352 [0,335, 0,369] | 3,61 | sí |
| H3 | aprender reduce el veneno respecto a su instinto solo | −1,17 frutas [0,92, 1,43] | 0,80 | sí |
| H4 | aprender mejora ese juicio respecto a su instinto solo | +0,352 [0,335, 0,369] | 3,61 | sí |
| H5 | ordenar el día de noche mejora ese juicio | +0,014 [−0,022, 0,051] | 0,07 | **no** |
| H6 | el apetito reduce el veneno | −0,80 frutas [0,59, 1,01] | 0,73 | sí |
| H7 | tras invertirse el mundo, juzga según el nuevo mejor que su instinto | +0,094 [0,064, 0,125] | 0,53 | sí |

Fagi supera claramente a los dos baselines, y aprender (del cuerpo y de los rasgos) y el apetito le ahorran veneno. **La consolidación nocturna no mejora su juicio** (H5): el efecto de 0,07 que se vio en la exploración del §25.7, con 48 vidas, no se replica con 120 vidas en mapas nuevos.

**Ablaciones (exploratorias, sin corrección, para orientar)**, diferencia con `full` y su IC 95 %:

| Pieza quitada | Mundo estable | Mundo que se invierte |
|---|---|---|
| aprendizaje por rasgos | juicio **−0,31** [−0,32, −0,29]; más especies dañinas probadas (+0,93) | juicio −0,07 |
| curiosidad y experimentos | juicio **−0,095** [−0,13, −0,06]; encuentra menos especies buenas (−0,21) | — |
| sueño | +0,52 frutas de veneno; −0,24 de especies buenas halladas; −242 s de vida | juicio **+0,14** |
| consolidación | +0,52 de veneno; −0,18 de especies buenas halladas; juicio sin diferencia | **vivas +0,16** [0,07, 0,25]; juicio **+0,15** [0,11, 0,18] |
| replay | juicio **+0,073** [0,058, 0,088] | juicio **+0,063** [0,042, 0,084] |
| mente nocturna | juicio −0,010 [−0,015, −0,005] | sin diferencia |
| apetito | +0,80 de veneno; muere de hambre (22) o de sed (7) en lugar de envenenada | +0,78 de veneno |
| olvido | sin diferencia en juicio ni en veneno; −25 s de estrés térmico | igual |
| percepción | −137 s de vida [−281, −2] | −151 s |
| variación térmica | sin estrés térmico; sin diferencia en lo demás | igual |
| memoria episódica | idéntica a quitar la consolidación: no es una ablación independiente | — |

**Lo que dicen.**

1. **Lo que más aporta es aprender por rasgos**, y después la curiosidad y los experimentos. Es lo que convierte pocas experiencias en juicio sobre lo nunca probado.
2. **El sueño aporta por la exploración, no por el juicio.** Sin sueño o sin consolidar, prueba menos y encuentra menos especies buenas (se pierde la agenda) y recibe más veneno. Pero su juicio queda igual.
3. **Cuando el mundo se invierte, quien no consolida juzga mejor el mundo nuevo.** Se interpretó como rigidez de lo consolidado (el dilema entre estabilidad y plasticidad). **El §25.13 lo corrige**: es una confusión por exposición. Con el sueño explora más y conoce el doble de fruta buena, así que tiene el doble de creencias que dar la vuelta. Por cada fruta conocida, desaprende igual.
4. **El replay, tal como está, empeora el juicio en los dos mundos.** Esto explica la pregunta abierta del §25.7 (consolidar sin experimentos daba peor juicio que no consolidar). En el laboratorio mejoraba la predicción por rasgos, pero en el juego mueve pesos de los que también depende la aversión, y el resultado neto es peor. Como es exploratorio, se deja encendido hasta confirmarlo, y es el candidato claro para el siguiente protocolo.
5. **La mente nocturna local aporta poco pero algo.** El apetito confirma su valor.
6. El olvido y la variación térmica no cambian el juicio. Quitar el olvido reduce el estrés térmico: olvidar lecciones térmicas tiene un coste.

**Poblaciones** (12 por condición, 5400 s, exploratorio):

- `full`: 2/12 extinciones funcionales, 3 generaciones, juicio de los adultos 0,73.
- Sin cultura: juicio −0,013 [−0,023, −0,003]; la cultura aporta poco, como se vio en el §25.8.
- Sin comunicación: nacen más crías (+2,1) y es más consanguínea.
- Sin aprendizaje (`fixed`): **9/12 extinciones**, juicio 0,58, ninguna muerte por vejez.

**Criterio de salida de la fase 7** («los resultados pueden repetirse desde un comando y respaldan afirmaciones concretas, no impresiones visuales»): **se cumple**. `node research/organism/run.js --jobs 16 && node research/organism/analyze.js` reproduce todo desde las semillas registradas, y las afirmaciones de arriba se limitan a lo medido, incluido lo que no se sostuvo.

### 25.10 Dimorfismo: batería de escenarios

Criterio de salida de la fase 2: «ambos sexos presentan fortalezas distintas y resultados comparables bajo una batería diversa». `scripts/sex-battery.js`: cada vida se vive dos veces, como hembra y como macho, con el mismo mapa y la misma secuencia aleatoria (120 vidas por escenario, semillas 14000–14119, mapas nunca usados), con el organismo completo, 6 especies y 2400 s. Siete escenarios, cada uno aprieta una parte distinta del cuerpo: templado (el de siempre), frío (media 13 °C), calor (media 31 °C), seco (sed ×1,27), hambruna (hambre ×1,5), comida lejos (árboles a 330–480) y un mundo que se invierte a mitad de vida. Exploratorio: intervalos bootstrap del 95 % de la diferencia pareada, sin corrección. Informe: `research/results/sex/report.md`.

| Escenario | Vida (hembra − macho) | Vivas al final | Lo que decide |
|---|---|---|---|
| templado | −116 s [−322, 73] | −0,09 [−0,22, 0,02] | comparables; el macho encuentra más especies buenas (+0,11) y juzga algo mejor (+0,03) |
| frío | **+502 s** [311, 713] | **+0,22** | la hembra: su aislamiento. El macho muere de frío 81 veces, ella 43 |
| calor | **−905 s** [−1113, −679] | **−0,36** | el macho: se enfría antes. La hembra muere de calor 99 veces, él 29 |
| seco | +80 s [−108, 276] | +0,03 | comparables |
| hambruna | +9 s [−191, 223] | −0,01 | comparables |
| comida lejos | −140 s [−310, 51] | −0,09 | comparables; el macho encuentra más especies buenas (+0,13) |
| se invierte | −61 s [−240, 106] | −0,04 | comparables; la hembra toma algo menos de veneno (−0,28) |

En todos los escenarios la hembra pasa menos tiempo con estrés térmico (su aislamiento amortigua los cambios del aire), salvo en el frío, donde vive más tiempo y por tanto acumula más.

**Se cumple.** Ningún sexo domina: cada uno tiene un clima donde sobrevive claramente mejor (la hembra en el frío, el macho en el calor), el macho explora y encuentra más (su velocidad) y en cinco de los siete escenarios la supervivencia es comparable. La ventaja metabólica de la hembra no aparece en la hambruna, porque ahí también se muere sobre todo por veneno.

El resultado del calor merece una explicación, porque se revisó por si era un artefacto. El aire llega a 43 °C la primera tarde. El reflejo que la lleva al nido salta con el 70 % del estrés letal, y dentro del nido el estrés sigue subiendo mientras el cuerpo esté por encima de 33 °C. Con ese margen, se salva quien se enfría deprisa. El aislamiento que protege a la hembra del frío es el que le impide soltar el calor. Es física coherente, no un error, pero el reflejo tardío sí era poco realista. Se probó que buscar sombra por reflejo no cambia nada: el nido suele estar más cerca que los árboles, y a 43 °C la sombra no basta. Por eso se descartó.

**Corregido: el máximo térmico voluntario.** Un ectotermo real huye del calor, o del frío, al llegar a su temperatura corporal voluntaria máxima o mínima, bastante antes de la letal. Ahora el reflejo salta también cuando su cuerpo llega a `THERMAL.voluntaryMax` (38 °C) o baja de `THERMAL.voluntaryMin` (9 °C); con `THERMAL.voluntary = 0` vuelve al reflejo de antes. Medido con las mismas 120 vidas de la batería (sin cosas):

| Clima | Sexo | Vida: antes → ahora | Muertes térmicas |
|---|---|---|---|
| templado | ambos | idéntica: el reflejo nunca se activa | — |
| calor | hembra | 534 → 1532 s | calor 99 → 65 |
| calor | macho | 1439 → 1756 s | calor 29 → 9 |
| frío | hembra | 1403 → 1578 s | frío 43 → 36 |
| frío | macho | 901 → 1288 s | frío 81 → 62 |

En los climas extremos sigue muriendo de calor o de frío, y cada sexo conserva su clima, pero ya no por llegar tarde: el juicio sobre la fruta también mejora, porque vive para aprender (calor, hembra: 0,62 → 0,86).

### 25.11 Cosas y conceptos: resultado

Protocolo congelado en `acd96a4` antes de correr (`docs/research/concepts-protocol.md`): 120 vidas por condición, familia y mundo (semillas 16000–16119, mapas nunca usados), 2400 s, el organismo completo con cosas. Informe: `research/results/concepts/report.md`.

**Hipótesis confirmatorias** (unilaterales, pareadas, Holm), todas en la familia de **color**, que nunca se usó al ajustar:

| | Predicción | Resultado | ¿Se sostiene? |
|---|---|---|---|
| K1 | a primera vista, dice bien qué permite una clase nueva, mejor que el azar | acierta el **97 %** frente al 25 % (n = 83 vidas que vieron alguna) | sí |
| K2 | los conceptos le ahorran picaduras de clases nuevas | 0,04 frente a 1,45 sin conceptos | sí |
| K3 | bebe de clases nuevas con savia antes de examinarlas | 0,84 por vida frente a 0 | sí |
| K4 | tras cambiar el mundo, dudar tras una sorpresa la deja clasificando mejor | 0,85 frente a 0,39 sin volatilidad | sí |

**Criterio de salida de la fase 6** («clasifica y usa correctamente una familia de objetos no vista durante el ajuste, sin recibir el identificador semántico real»): **se cumple** (K1, K2 y K3). La familia nueva se aprende igual que las de ajuste: 0,93 frente a 0,97 de clasificación final, y 0,97 frente a 0,97 a primera vista.

**Exploratorio:**

- **En un mundo estable la volatilidad no hace nada**: nunca hay una sorpresa y `noVolatility` da exactamente lo mismo que `full`.
- **Cuando el mundo cambia, nada se lo avisa hasta que algo falla.** A primera vista, las clases que brotan justo al cambiar las juzga como el azar (0,24). No hay de dónde saberlo.
- **Plasticidad con coste.** Con volatilidad vuelve a examinar lo que sabía, lo rehace (5,3 conceptos rehechos; 0,5–0,7 retirados por fallar) y acaba clasificando bien, pero se pica casi el doble (6,4 frente a 3,5). Sin volatilidad se pica menos, pero sigue creyendo lo que ya no es cierto (precisión 0,54). Es un dilema real entre estabilidad y plasticidad, resuelto con una señal de cambio y no con menos memoria. (En la fruta, lo que parecía el mismo dilema resultó ser otra cosa: §25.13.)
- **Supervivencia.** Las cosas apenas la cambian: muere sobre todo por el veneno de la fruta, y las diferencias de vida entre condiciones van en direcciones distintas según la familia. Aprender lo que permiten las cosas mejora el juicio y el uso, no la supervivencia, en este mundo.
- **Del desarrollo:** sin clases que brotan tarde, examina todo el mapa en los primeros días y los conceptos apenas llegan a usarse. Eso motivó las clases tardías, que son la prueba real de generalizar.

### 25.12 Retención a varios días

`scripts/retention.js`: cada amanecer, para cada fruta que probó, mira cuántos días hace que la probó por última vez y si la sigue juzgando bien (la dañina no se la comería; el resto sí), y si una regla suya decide sobre ella. 48 vidas de 2400 s (13 días), semillas de desarrollo 5000–5047, exploratorio.

| | Días desde el último bocado: 0 | 1 | 3 | 5 o más |
|---|---|---|---|---|
| dañina, bien juzgada | 1,00 | 1,00 | 1,00 | 1,00 |
| dañina, con regla | 0,81 | 0,82 | 0,82 | 0,83 |
| el resto, bien juzgada | 0,99 | 0,99 | 0,99 | 0,98 |
| el resto, con regla | 0,23 | 0,23 | 0,17 | 0,05 |

- **Lo que aprende de la fruta dura.** Días después de probar una dañina la sigue evitando, sin excepción. Es lo que se espera de la aversión al sabor, que en los animales reales dura semanas.
- **Las preferencias sí se olvidan.** Las reglas de «prefiero» se retiran con los días sin probar. No lleva a error: sigue comiéndola, solo sin regla escrita.
- **Dormir no cambia la retención.** Sin sueño, sin consolidar o sin replay, los números son los mismos. En 13 días no se pierde nada que haya que salvar, así que el sueño no tiene nada que proteger. Su aporte está en lo que hace probar al día siguiente (§12.6, §25.9), no en retener.
- **Los bocados de prueba llegan a reglas** casi tanto como la fruta entera: el 40 % de las muestras con regla frente al 47 %, y bien juzgadas por igual.

Las autopsias del organismo actual (48 vidas, 1800 s) no encuentran artefactos. Las 8 muertes son por veneno, y todas siguen el mismo patrón: muy hambrienta, come fruta podrida (`toxic`), y el veneno la termina de matar. El hambre desesperada vence a la aversión, como en los animales reales. Mueren por comida mala cuando no queda otra, no por no saber distinguirla.

### 25.13 Seguimiento: replay, consolidación y memoria episódica

El primer protocolo (§25.9) dejó tres cosas como exploratorias:

- el replay nocturno empeoraba el juicio;
- consolidar frenaba la adaptación a un mundo que cambia;
- quitar la memoria episódica daba exactamente lo mismo que quitar la consolidación.

**Lo que se cambió antes de congelar.** La noche solo preguntaba después de un día con bocados propios. Pero la pregunta «¿qué vi y nunca probé?» es memoria semántica, no episódica. Con `SLEEP.askAlways` la hace aunque no haya episodios que ordenar, así que quitar la memoria episódica deja de ser lo mismo que quitar la noche.

Con el organismo de hoy y vidas de desarrollo, los dos primeros efectos se repitieron. Se congeló el protocolo (`docs/research/organism2-protocol.md`, commit `85bea4d`) y se corrió con 120 vidas por condición y mundo, semillas 18000–18119 y mapas nunca usados. Informe: `research/results/organism2/report.md`.

| | Predicción | a − b [IC 95 %] | ¿Se sostiene? |
|---|---|---|---|
| F1 | el replay empeora el juicio sobre fruta no probada (mundo estable) | +0,024 [0,005, 0,043] | sí |
| F2 | y más aún cuando el mundo se invierte | +0,072 [0,046, 0,096] | sí |
| F3 | consolidar la hace más lenta para juzgar por el mundo nuevo | +0,203 [0,168, 0,239] | sí |
| F4 | sin memoria episódica la noche sigue preguntando, y encuentra más fruta buena que sin noche | +0,448 [0,380, 0,517] | sí |

El efecto del replay no tiene la confusión que se describe más abajo para F3: sin replay encuentra las mismas especies buenas (0,951 frente a 0,947), así que conoce lo mismo y juzga peor con el replay.

**Decisión, tal como estaba escrita en el protocolo: el replay se apaga por defecto** (`SLEEP.replay = 0`). Lo que el laboratorio mostraba (repasar la fruta recordada reparte mejor la culpa entre rasgos, §25.2) no compensa en el juego: el mismo peso que mueve lo usa también la aversión. Queda como opción, y las evaluaciones congeladas lo mantienen encendido para reproducirse.

**Exploratorio:**

- **Lo que parecía rigidez es exposición.** Tras la inversión, con consolidación vuelve a comer fruta que antes le iba bien y ahora es dañina: 2,58 bocados repetidos frente a 0,86 sin consolidación, y más veneno después del cambio (2,62 frente a 1,43). Pero con consolidación conocía el doble de fruta buena cuando el mundo cambió. Por cada fruta buena conocida en ese momento, repite casi lo mismo con consolidación y sin ella: 0,76 frente a 0,73 (24 vidas de desarrollo por condición). Consolidar no vuelve las creencias más difíciles de desaprender. Hace que haya más creencias que desaprender. F3 se sostiene como hecho medido, pero su explicación no es la rigidez.
- **Por qué repite: seguridad aprendida.** Casi todos los bocados repetidos se dan sin regla que lo impida y con el valor de esa fruta todavía positivo, no solo con hambre crítica. Un mal bocado no borra una larga historia de bocados buenos. En los animales reales pasa lo mismo: cuesta más condicionar aversión a un alimento familiar y seguro (seguridad aprendida o inhibición latente; Kalat y Rozin, 1973). Es realista, no un artefacto.
- **Se probó una volatilidad para la fruta**, como la de las cosas: una sorpresa aceleraba el aprendizaje y frenaba el refuerzo nocturno. No cambió nada (2,33 bocados repetidos frente a 2,38) y se retiró. El problema no era la velocidad de aprender.
- **Pero sin consolidación le va peor en un mundo estable.** Encuentra la mitad de las especies buenas (0,50 frente a 0,95), toma el triple de veneno y el 29 % muere, frente al 2 %. Lo que el sueño aporta es la agenda del día siguiente.
- **Sin memoria episódica se comporta casi igual que sin replay.** Conserva la agenda y pierde el repaso y el refuerzo de lo que el día confirmó. La memoria episódica aporta su propio efecto, separado de la noche entera.
- **Balance.** El sueño aporta sobre todo la agenda del día siguiente. Lo que se creía su coste, la rigidez, era el precio de haber aprendido más.

### 25.14 Población: frenos graduales y descendencia

Con `LIFE.gradual` (parte del organismo; apagado reproduce el §25.8):

- **La fertilidad decae con la vejez.** Una senescente cría cada vez menos: el tiempo que necesita para volver a criar se alarga en proporción inversa a su fertilidad, que va de 1 al empezar la vejez a 0 al final de su vida.
- **El hacinamiento frena antes del techo.** Por debajo de un cuarto del nido no pasa nada. A partir de ahí, cada recuperación, y también la espera antes de la primera cría, se alarga cuanto más lleno está el nido, como una multitud que compite por comida y sitio. El techo (`LIFE.maxPopulation`) sigue siendo el límite físico.

Todo es determinista: no añade ningún número aleatorio. `scripts/population.js --maps 8 --duration 10800` (60 días, 8 mapas de desarrollo):

| | Muestras en el techo del nido | Vivas de media | Generaciones | Crías por mapa | Extinciones |
|---|---|---|---|---|---|
| techo solo (antes) | 69 % | 13,5 | 5,9 | 29,9 | 0/8 |
| frenos graduales | **23 %** | 12,8 | **6,8** | 30,9 | 0/8 |

La población se regula antes de chocar con el techo. Hay más generaciones porque la cría se desplaza hacia las jóvenes: las viejas tardan cada vez más en volver a criar, y el tiempo entre generaciones se acorta. Un primer intento dejaba el techo casi igual de ocupado, porque quien nunca había criado no esperaba nada con el nido lleno. Se corrigió antes de medir.

**En el juego, se sigue a la descendencia.** Cuando muere la Fagi que se sigue en una población que cría, el juego pasa a su descendiente viva más cercana (una cría antes que una nieta), y si no queda ninguna, a cualquiera de la población. La sesión solo termina con la última. La grabación sigue con un evento `follow`, y el replay la muestra viva de nuevo desde ese momento. La narración lo dice («Murió. Ahora sigues a su cría, #7»).

### 25.15 Salud

`health.js`, con el flag `HEALTH.enabled`, que forma parte del organismo. El hambre, la sed y el frío siguen matando por sí mismos; la salud es lo que queda después del daño:

- **Quitan salud:** una picadura (12), un bocado venenoso (10 por fruta entera; un bocado de prueba, su parte) y el estrés térmico por encima de la mitad del letal.
- **Se recupera** mientras nada aprieta, y tres veces más rápido descansando en el nido.
- **Herida, camina más despacio:** por debajo de la mitad de su salud, hasta el 60 % de su velocidad.
- **Afecta a la cría:** con menos de la mitad de su salud no cría (§10.1), y su salud visible cuenta en la elección de pareja (§10.2).
- **A cero muere** de lo último que la hirió (`wounds`, `poison`, `heat` o `cold`).

**Medido, con semillas de desarrollo.** En el mundo por defecto no cambia casi nada, ni en vidas sueltas (48 por clima) ni en poblaciones (4 mapas, 30 días). En clima templado las vidas son idénticas, y las poblaciones crían 13,75 frente a 13,5 por mapa. En frío y en calor la vida cambia un poco (1783 frente a 1837 s en frío; 2094 frente a 2107 s en calor). Nadie muere de heridas: el daño es raro y se recupera antes de que pese. Es el contrato del §9 cumplido y listo para mundos más duros (más cosas que pican, depredadores). En este mundo no hay casi nada que herir.

### 25.16 Sabores: resultado

`scripts/taste-lab.js`: 48 vidas de desarrollo por condición (semillas 5000–5047, mapas `3 + 13i`), 2400 s, el organismo completo con `TASTE`. Como el aspecto ya no decide el efecto, el juicio se mide sobre las especies del mapa (¿se la comería, contando si la tragaría?), equilibrado entre venenosas y el resto.

**Con 6 especies los sabores apenas cambian nada.** Juicio 0,92, veneno 0,85 frutas por vida y 0,13 escupidas por vida, en todas las condiciones. Lo nuevo casi siempre lo prueba con un bocado de prueba de la agenda, que ya es pequeño, y el aspecto le basta para aprender seis especies.

**Con 12 especies:**

| Condición | Juicio | Veneno | Especies que le disgustaban, no venenosas, que acaba comiendo enteras | Vivas | Muertes por veneno |
|---|---|---|---|---|---|
| completo | 0,854 | 0,94 | 0,69 de 2,02 | 0,98 | 0 |
| sin aprender del sabor | 0,830 | 0,84 | 0,60 de 2,02 | 0,98 | 0 |
| sin gusto innato | 0,858 | 1,01 | — | 0,94 | 2 |
| sin ninguno | 0,825 | 1,03 | — | 0,92 | 3 |

- **El gusto innato protege.** Sin él mueren envenenadas 2 o 3 de 48, frente a ninguna, porque escupir lo amargo corta la dosis cuando el aspecto no avisa.
- **Aprender del sabor mejora un poco el juicio** (+0,02 a +0,03), pero no reduce el veneno. Al contrario, sube algo (0,94 frente a 0,84): lo aprendido vence a veces al disgusto innato, y no todo lo amargo es inofensivo.
- **Sabores adquiridos, sí, pero por especie.** Llega a comer entera un tercio de la fruta que de nacimiento escupiría. Casi siempre es porque el bocado escupido le enseñó que esa especie alimenta. Pocas veces porque lo aprendido del sabor se extienda a una especie nueva (0,04–0,08 por vida). La saliencia del sabor (Garcia) no cambia esto: juicio 0,851 con saliencia 1, 0,854 con 2 y 0,857 con 3.

**Criterio de salida: a medias.** Sí llega a comer lo amargo inofensivo y lo picante nutritivo que su gusto innato rechazaba (un tercio de ello). No aprende a comer con menos veneno que con el gusto innato solo.

El sabor añade realismo, porque el mundo ya no es una tabla de tipos, y añade una protección innata. En este mundo casi todo se aprende antes por la vista. Pesaría más en un mundo donde lo que se ve engaña (especies iguales por fuera y distintas por dentro) o con venenos más fuertes. Eso queda anotado como siguiente paso de esta fase.

### 25.3 Pendiente

- Fase 8: un mundo donde la vista engañe (especies de aspecto igual y composición distinta, mimetismo) y donde el sabor sea lo que decide; apetito por la sal según la necesidad.
- Fase 4: probar un modelo de lenguaje real por `NIGHTAI.backend = 'http'` y medir si propone algo que la mente local no propone.
- Fase 6, lo que queda del §12.3:
  - que el agua, el nido, los árboles y las rocas dejen de ser categorías innatas (hoy solo las cosas lo son);
  - combinaciones más ricas que forrar el nido: una cosa que solo sirve junto a otra fuera de casa (romper una contra otra, por ejemplo), con transporte y acción propios.

**Decidido y descartado**, con su motivo:

- **Transmitir la aversión alimentaria por observación.** Ver a una hermana comer algo que le sienta mal ya enseña (`learnSeen`, §25.8), pero no transmite la aversión del cuerpo (§25.5), que solo nace del malestar propio. Así pasa en las ratas: la transmisión social enseña qué comer, no qué evitar (Galef, 1985). Con las cosas es distinto, porque el dolor ajeno sí se ve.
- **Que la noche ordene también los conceptos.** Los conceptos se forman al momento, con cada clase que queda decidida (§12.8), y se ponen a prueba con cada clase nueva. Una pasada nocturna repetiría el mismo cálculo sin evidencia nueva.
- **Volatilidad para la fruta.** Se probó y no cambió nada (§25.13).

### 25.4 Cómo reproducir

Cada tabla se midió con el organismo tal como estaba en ese momento. `--organism` enciende hoy todas sus piezas, así que los comandos apagan las que se añadieron después (`--set …=0`); así reproducen las cifras exactas. Todas las tablas anteriores al §25.11 se midieron sin cosas ni conceptos y con el reflejo térmico antiguo: a los comandos de `batch.js`, `sleep-lab.js`, `autopsy.js` y `population.js` hay que añadirles `--set TASTE.enabled=0 --set HEALTH.enabled=0 --set CONCEPT.enabled=0 --set THERMAL.voluntary=0 --set SLEEP.askAlways=0 --set SLEEP.replay=4`; la del §25.11, solo las tres últimas; las del §25.12, `--set SLEEP.askAlways=0 --set SLEEP.replay=4`. A `population.js` y a todo lo que cría antes del §25.14, además, `--set LIFE.gradual=0`. Las evaluaciones congeladas y la batería de sexos ya lo hacen solas. `LIFE` solo afecta a quien pertenece a una población que se reproduce, así que no cambia las vidas individuales; en cualquier ejecución con colonia (`--colony`, `--generations`) sí la pone a criar.

```text
npm test

# §25.2 calibración térmica (medida con apetito, antes de PERCEPT y de la mente nocturna)
T="--set PERCEPT.enabled=0 --set NIGHTAI.enabled=0"
node scripts/batch.js --organism --runs 12 --duration 2400 $T
node scripts/batch.js --organism --runs 12 --duration 2400 $T --set THERMAL.behave=0
node scripts/batch.js --organism --runs 12 --duration 2400 $T --set CYCLE.swing=16
node scripts/batch.js --organism --runs 12 --duration 2400 $T --set CYCLE.swing=16 --set THERMAL.behave=0

# §25.2 replay en el laboratorio
node scripts/sleep-lab.js --k 6 --trials 300
node scripts/sleep-lab.js --k 6 --trials 300 --set SLEEP.downscale=0.1
node scripts/sleep-lab.js --k 3 --trials 300 --set SLEEP.downscale=0.1

# §25.2 replay en el juego (antes de los experimentos, el apetito, PERCEPT y la mente nocturna)
OFF="--set EXPERIMENT.enabled=0 --set APPETITE.enabled=0 --set PERCEPT.enabled=0 --set NIGHTAI.enabled=0"
node scripts/sleep-lab.js --game 32 $OFF
node scripts/sleep-lab.js --game 32 $OFF --set SLEEP.replay=0
node scripts/sleep-lab.js --game 32 $OFF --set SLEEP.consolidate=0

# §25.2 experimentos (antes del apetito, PERCEPT y la mente nocturna)
OFF="--set APPETITE.enabled=0 --set PERCEPT.enabled=0 --set NIGHTAI.enabled=0"
node scripts/sleep-lab.js --game 48 $OFF --set EXPERIMENT.enabled=0
node scripts/sleep-lab.js --game 48 $OFF
node scripts/sleep-lab.js --game 48 $OFF --set SLEEP.consolidate=0

# §25.5 autopsias y apetito (antes de PERCEPT y la mente nocturna)
OFF="--set PERCEPT.enabled=0 --set NIGHTAI.enabled=0"
node scripts/autopsy.js --lives 48 $OFF --set APPETITE.enabled=0
node scripts/autopsy.js --lives 48 $OFF
node scripts/sleep-lab.js --game 48 $OFF

# §25.6 percepción (antes de la mente nocturna)
node scripts/sleep-lab.js --game 48 --set NIGHTAI.enabled=0
node scripts/autopsy.js --lives 48 --set NIGHTAI.enabled=0

# §25.7 mente nocturna
node scripts/sleep-lab.js --k 6 --night
node scripts/sleep-lab.js --k 6 --night --family conj
node scripts/sleep-lab.js --game 48
node scripts/sleep-lab.js --game 48 --set MAPGEN.family=conj --set NIGHTAI.enabled=0
node scripts/sleep-lab.js --game 48 --set MAPGEN.family=conj
node scripts/sleep-lab.js --game 48 --set NIGHTAI.enabled=0 --set EXPERIMENT.enabled=0
node scripts/sleep-lab.js --game 48 --set SLEEP.consolidate=0

# §25.8 población que se reproduce sola
node scripts/population.js --maps 8 --duration 10800
node scripts/population.js --maps 1 --seed 5000 --duration 10800 --set LIFE.maxPopulation=40

# §25.9 evaluación congelada (docs/research/organism-protocol.md)
node research/organism/run.js --jobs 16
node research/organism/analyze.js research/results/organism

# §25.11 cosas y conceptos (protocolo congelado: docs/research/concepts-protocol.md)
node research/concepts/run.js --jobs 16
node research/concepts/analyze.js research/results/concepts
node scripts/concept-lab.js --lives 48                  # banco exploratorio
node scripts/concept-lab.js --lives 48 --dims color --turn

# §25.13 seguimiento congelado (docs/research/organism2-protocol.md)
node research/organism2/run.js --jobs 16
node research/organism2/analyze.js research/results/organism2

# §25.14 frenos graduales (y sin ellos, como en el §25.8)
node scripts/population.js --maps 8 --duration 10800
node scripts/population.js --maps 8 --duration 10800 --set LIFE.gradual=0

# §25.15 salud (con y sin)
node scripts/population.js --maps 4 --duration 5400
node scripts/population.js --maps 4 --duration 5400 --set HEALTH.enabled=0

# §25.16 sabores (12 especies; y con --set TASTE.learn=0 / TASTE.innate=0)
node scripts/taste-lab.js --set MAPGEN.species=12

# §25.12 retención
node scripts/retention.js
node scripts/retention.js --set SLEEP.consolidate=0
node scripts/retention.js --set SLEEP.enabled=0

# §25.10 batería de sexos (--current: con el organismo de hoy)
node scripts/sex-battery.js --lives 120 --jobs 16

# generaciones con reproducción sexual, creadas por lotes (sin cría dentro del mundo)
node scripts/batch.js --organism --set LIFE.enabled=0 --set GEN.sexual=1 --generations 6 --colony 6 --runs 4 --duration 600 --set MAPGEN.species=6
```

