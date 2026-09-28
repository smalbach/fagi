# Especificación: Fagi como ente adaptativo autónomo

**Estado:** propuesta técnica detallada  
**Proyecto:** First AGI / Fagi  
**Objetivo de esta versión:** transformar la simulación actual, inspirada en una hormiga, en un entorno experimental para estudiar un organismo artificial limitado que percibe, aprende, descansa, consolida experiencias, se reproduce y se adapta durante varias generaciones.

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

Sin embargo, todavía existen límites importantes:

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

Configuración inicial propuesta:

```js
CYCLE = {
  seconds: 300,
  dawn: 0.20,
  dusk: 0.72,
  minLight: 0.12,
  cold: 10,
  hot: 35,
  mean: 23
}
```

Un ciclo corto permite observar varias noches durante una sesión sin pretender equivalencia literal con horas humanas.

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

---

## 8. Frío, calor y termorregulación

### 8.1 Modelo mínimo

La temperatura corporal se aproxima gradualmente a una temperatura objetivo:

```text
T_cuerpo += (T_objetivo - T_cuerpo)
            × intercambio_térmico
            × humedad
            ÷ resistencia_corporal
            × dt
```

Donde:

- `T_objetivo` es la temperatura ambiente fuera del refugio;
- dentro del refugio es una mezcla entre ambiente y temperatura estable del nido;
- estar mojado acelera el intercambio;
- moverse produce una pequeña cantidad de calor;
- el genoma y el sexo modifican la resistencia térmica.

### 8.2 Rangos propuestos

```js
THERMAL = {
  preferred: 25,
  safeMin: 15,
  safeMax: 33,
  lethalMin: 5,
  lethalMax: 43,
  maxStress: 100
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

---

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

