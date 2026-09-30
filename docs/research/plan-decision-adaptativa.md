# Plan: demostrar una mejora de decisión adaptativa

Estado: propuesta de ejecución; no es un protocolo congelado. Pasos 1 y 1b ejecutados sobre mundos de desarrollo (`research/adaptive-decision/baseline.md`). Paso 2: la puerta no se cumple, la referencia vive ~100 % en toda severidad probada (`research/adaptive-decision/viability.md`); pendiente decidir la revisión permitida.
Referencia inicial: commit `c751fe0`; paso 1 medido sobre `9b8fc6e` (el commit exacto queda en `research/results/adaptive-decision/manifest.json`).

## Objetivo y límite de la afirmación

Demostrar que aprender consecuencias y usarlas para elegir acciones permite a Fagi sobrevivir mejor ante cambios del entorno, frente al sistema actual y alternativas competitivas, sin reglas nuevas específicas para cada cambio.

Este ciclo evalúa una mejora de ingeniería y adaptación acotada. No demuestra AGI, conciencia, evolución abierta ni originalidad científica del algoritmo. Un resultado negativo o inconcluso es una salida válida.

## Alcance del ciclo

- Un individuo, sin reproducción ni transmisión social; mismo cuerpo, percepción y locomoción para todos los controladores.
- Decisiones sobre recursos: explorar, visitar un sitio conocido, buscar agua conocida, regresar al nido y descansar. Acciones disponibles según lo que realmente conoce. Hoy solo "sitio o explorar" pasa por `choice.js`; agua, nido y descanso los decide la jerarquía fija. El paso 1b fija qué reglas pasan al controlador y cuáles quedan como reflejos comunes.
- Dormir de noche (`SLEEP.nightly`) ocupa ~40 % de la vida y queda fuera del controlador: lo gobernable es aproximadamente la otra mitad.
- Mantener los mecanismos comunes de alimentación y aprendizaje de alimentos; fijar sus ajustes entre condiciones.
- Usar el motor existente. El nuevo experimento tendrá sus propios ajustes y archivos, sin editar protocolos o resultados anteriores.
- Sin cambios visuales, nuevas especies, nuevas capacidades biológicas, servicios externos ni modelos de lenguaje en este ciclo.
- No activar el controlador experimental por defecto hasta superar la evaluación.

## Paso 1. Fijar la referencia y medir quién decide

Trabajo:

1. Registrar commit, configuración resuelta, versión de Node, semillas y comandos. Separar el perfil inicial del juego del perfil con `FORAGE`, `SITES`, `CHOICE` y `LARDER` activos.
2. Tomar como referencia principal el perfil experimental con elección actual activa. Documentar la diferencia con el juego inicial; compararlo adicionalmente será descriptivo.
3. Registrar en cada decisión: observación, opciones disponibles, intención propuesta, intención ejecutada, regla que la sustituyó, duración y consecuencia percibida.
4. Medir tanto número de decisiones como tiempo de control efectivo. No atribuir al aprendiz una acción anulada por otra regla.
5. Repetir una ejecución guardada y comprobar identidad. Añadir una comprobación equivalente para el nuevo runner.

Entregable: `research/adaptive-decision/baseline.md`, manifiesto y una traza legible de un episodio.

Puerta de salida: se puede reconstruir qué decidió cada componente y repetir el resultado. Si el nuevo controlador apenas llega a actuar, corregir la conexión antes de medir aprendizaje.

Resultado (40 mundos de desarrollo por perfil, `research/adaptive-decision/`):

- Reconstrucción y repetición: se cumplen. Misma huella al repetir en otro proceso y con la traza activada.
- La elección actual apenas actúa: con un plan de volver a un sitio, el objetivo es ese sitio ~5 % del tiempo; el sitio no llega a candidato ~51 % del tiempo (olor de otro árbol, filtro de hambre de `perception.js`), y cuando llega gana otra regla (`explore`, `pursue`, beber). **Puerta no cumplida**: ver paso 1b. Esto relativiza el F1 no apoyado de la fase 9.
- El perfil del juego está en el techo (40/40 vivas, sin química ni estaciones). La diferencia con el experimental (−0,15) es del mundo, no del controlador.
- En el perfil experimental, 10 de 13 muertes son por veneno, que depende del aprendizaje de alimentos fijado como común. Hambre 0, sed 1, frío 2.
- "Decisiones" contadas como cambios de regla, acción u objetivo parpadean fotograma a fotograma (~19 por minuto): no sirven como unidad. Contar decisiones como planes resueltos o puntos de decisión del paso 1b.

## Paso 1b. Punto de decisión explícito

Motivo: con la conexión actual, ningún controlador —el actual, los de referencia del paso 2 ni el nuevo— decide lo que hace Fagi; la jerarquía lo sustituye. Medir aprendizaje antes sería medir la jerarquía.

Trabajo:

1. En `src/decision.js`, un punto de decisión tras los reflejos comunes, apagado por defecto. Con la bandera apagada, las huellas del paso 1 deben ser idénticas.
2. Lista cerrada de reflejos comunes que pueden sustituir al controlador (propuesta: nivel "sobrevivir", dormir, refugio ante frío letal) y lista de reglas que el controlador reemplaza (propuesta: `pursue` de lo que no ve, `scent`, `memory`, `explore`, `thirstSearch`, `carry` y la elección de sitio). Lo que ve y puede comer lo sigue tomando el mecanismo común de alimentación.
3. Una opción elegida se ejecuta hasta resolverse (llegar, encontrar, agotar tiempo, reflejo) con el mismo movimiento para todos; toda sustitución queda en la traza.
4. Conectar la elección actual por ese punto como "Fagi actual conectada". Se informa junto a "Fagi actual tal cual" del paso 1; la referencia principal de los pasos 2 y 4 pasa a ser la conectada, porque la tal cual casi no decide.
5. Flujo aleatorio propio del controlador: hoy `choice.js` saca sus sorteos del mismo flujo que el movimiento de Fagi, así que un controlador que sortee más cambia también cómo camina.

Puerta: con la bandera encendida, la elección conectada controla la mayor parte del tiempo de sus planes (objetivo propuesto ≥ 80 %, medido con el mismo `episode.js`), y con la bandera apagada todo es idéntico.

Resultado (`DECIDE` en `src/config.js`, `src/decision/point.js`; 40 mundos):

- Apagado: los 80 episodios del paso 1 idénticos (`research/adaptive-decision/verify-off.js`). Suite completa sin fallos.
- Reflejos comunes implementados: niveles "sobrevivir" y "aguantar" completos (incluye descanso y refugio, no solo frío letal) y comida a la vista (`provide.seen`). El descanso queda como reflejo en este ciclo; la opción `rest` existe para controladores futuros.
- Encendido: la elección sigue su plan de sitio el 88 % del tiempo sin reflejo y el de explorar el 93 %. Sobre el tiempo total de plan, 65 % y 80 %: los reflejos se llevan ~26 %. La puerta se lee sobre el tiempo sin reflejo, porque ese es el que el controlador puede perder; el objetivo del 80 % sobre el total no se cumple para el plan de sitio y se informa así.
- La elección conectada cede cuando la sed tira más que las ganas de comida (solo sabe de comida). Cambio hecho tras ver la primera ejecución conectada, antes de cualquier comparación de controladores.
- Supervivencia sin cambio (0,857 frente a 0,854). Conectada hace ~4 veces más planes y explora mucho menos; revisarlo al elegir la heurística competente del paso 2.
- Flujo propio: con `DECIDE.ownStream` los sorteos de la elección salen de un flujo sembrado una vez del de Fagi.

**Puerta cumplida** con esa lectura.

## Paso 2. Validar una prueba donde decidir bien sea útil

Crear una batería pequeña, definida antes de evaluar al nuevo aprendiz:

| Familia | Qué exige | Qué se conserva |
|---|---|---|
| Estable | Equilibrar viajes, alimento, agua y descanso | Recursos y costes constantes |
| Cambio de recursos | Revisar qué sitio merece una visita | Sensores, cuerpo y acciones |
| Cambio de coste | Revisar si un viaje compensa al aumentar su coste real | Beneficios y acciones conocidas |
| Composición reservada | Resolver juntos cambios de recursos y costes, con otro orden temporal | El mismo contrato de percepción y acción |

Requisitos del mundo de la batería, comprobados con la referencia conectada antes de evaluar ningún aprendiz:

- La química de alimentos queda controlada: sin especies dañinas o con el aprendizaje de alimentos igual y estratificado por causa. En el perfil experimental actual el veneno causa la mayoría de las muertes y ahogaría la señal de la decisión de recursos.
- Lejos del techo: la referencia no llega viva al horizonte en todos los episodios (propuesta: entre 20 % y 70 % en el techo) y una parte apreciable de las muertes es por hambre, sed o frío.

El coste debe afectar al motor real —por ejemplo, desplazamiento o consumo— y ser observable por sus consecuencias, no una penalización inventada solo para puntuar. Los cambios no se anuncian al agente.

Usar primero las políticas actuales, una heurística competente y dos referencias de diagnóstico:

- Controlador con información privilegiada del estado actual: estima el margen disponible; no ve sorteos futuros ni se presenta como competidor justo u óptimo garantizado.
- Controlador informado del mecanismo del mundo, limitado a observaciones e historia accesibles: comprueba que al menos parte de la ventaja se puede obtener sin acceso al estado oculto.

La heurística debe incluir al menos un umbral de abandono de sitios vacíos y una política de coste/beneficio, ajustados en desarrollo. No basta compararse con caminar al azar.

Medida principal: `min(tiempo hasta morir, horizonte) / horizonte`, entre 0 y 1, sobre TODOS los episodios. Un agente muerto no desaparece del análisis. Mantener también supervivencia final, causas de muerte, recurso obtenido y viajes fallidos.

Puerta de salida propuesta: el controlador informado de percepción limitada mejora al menos 0,10 de media frente a la referencia actual en la batería cambiante de desarrollo, con intervalo del 95 % por encima de cero. Es un umbral práctico propuesto, no un estándar científico.

Si solo gana el controlador privilegiado, investigar observabilidad y memoria. Si ninguno gana, esta batería no distingue la capacidad buscada. Se permite una revisión documentada del diseño basada únicamente en estas referencias; si vuelve a fallar, cerrar el ciclo como prueba inadecuada. No ajustar el mundo para favorecer al futuro aprendiz.

Resultado (`research/adaptive-decision/viability.md`): batería sin veneno con seis árboles, cambio de recursos y cambio de coste (barro, `world.mud`). La elección conectada vive al horizonte en ~100 % de los mundos, también con tres árboles, sin manchas, despensa de 4 y hambre ×4. Hambre mata en ~1250 s y cinco o seis néctares bastan para 2400 s: dónde buscar comida no decide la supervivencia. **Puerta no cumplida**; la revisión permitida se decide antes de seguir (medida, cuerpo, dominio o cierre).

Entregable: escenarios reproducibles e informe de viabilidad. El horizonte, severidad y frecuencia de cambios se fijan aquí; después no se retocan al ver el rendimiento del aprendiz.

## Paso 3. Implementar una sola hipótesis de controlador

Requiere el punto de decisión del paso 1b.

Hipótesis: un modelo pequeño de consecuencias, actualizado por experiencia, permite comparar acciones presentes y sus siguientes consecuencias mejor que la elección actual.

Diseño inicial:

1. Observación estructurada: necesidades, carga, luz percibida, sitios conocidos, resultados anteriores y antigüedad de esos recuerdos. Ningún estado oculto ni momento futuro del cambio.
2. Modelo por contexto y acción: estimar duración, cambios corporales y probabilidad de obtener recursos. Aprender de transiciones realmente ejecutadas, incluyendo interrupciones.
3. Planificador corto: comparar secuencias de dos decisiones con ese modelo y volver a planificar tras una consecuencia o información nueva. Limitar explícitamente memoria y operaciones por decisión.
4. Incertidumbre: registrar cuánta evidencia sostiene cada estimación. Usar una sola regla documentada de exploración y actualización reciente; no añadir detectores específicos para cada escenario.
5. Objetivo común: tiempo vivo, con cualquier señal auxiliar corporal definida antes del ajuste y compartida con el competidor de aprendizaje. Evaluar siempre con la medida externa del paso 2, no con la recompensa interna.
6. Reflejos de emergencia comunes: documentar qué acciones pueden sustituir y aplicar exactamente los mismos a los controladores comparables.

Integración propuesta:

| Archivo o carpeta | Trabajo |
|---|---|
| `src/adaptive-decision/observation.js` | Contrato de observación sin referencias vivas ni clasificación privilegiada |
| `src/adaptive-decision/model.js` | Actualización de consecuencias por experiencia |
| `src/adaptive-decision/policy.js` | Comparación de secuencias cortas |
| `src/adaptive-decision/trace.js` | Intención propuesta, ejecutada, interrupción y resultado |
| `src/decision.js` | Punto de decisión del paso 1b, ya existente en este paso |
| `src/config.js` | Bandera experimental apagada por defecto |
| `research/adaptive-decision/` | Diseño, escenarios, controladores de comparación, runner y análisis |
| `test/adaptive-decision.test.js` | Pruebas de aislamiento, ejecución y aprendizaje de transiciones |

No reutilizar sin auditar el JSON de `observation.js`: incluye candidatos ya ordenados, `score`, `verdict` e `instinct`, que pueden trasladar decisiones del controlador anterior. Ofrecer a los controladores comparables el mismo conjunto de candidatos y una representación común; documentar las diferencias inevitables con la referencia antigua.

Preferir una política local síncrona para batch y juego. El camino actual de `cortex.js` usa promesas; no introducir diferencias debidas al ritmo asíncrono en la evaluación determinista.

`research/adaptive-decision/episode.js` ya mide control, sustituciones y huella: reutilizarlo para el nuevo controlador.

Pruebas necesarias: no fuga de estado oculto; una consecuencia modifica la predicción; intención realmente aplicada; interrupciones correctamente atribuidas; bandera apagada conserva ejecuciones previas; semillas del controlador no alteran sorteos del entorno. Separar los generadores del entorno y del agente solo en el nuevo experimento, conservando el comportamiento histórico.

Entregable: prototipo aislado y comparación de desarrollo. Máximo dos variantes del modelo en este ciclo; registrar también la descartada.

## Paso 4. Evaluación reservada y decisión de continuar

Competidores mínimos:

- Fagi actual, fijado en el paso 1.
- Mejor heurística elegida exclusivamente en desarrollo.
- Q-learning tabular con discretización y presupuesto de ajuste explícitos, sobre observaciones y acciones comparables. Es una referencia práctica; no se presupone que sus garantías teóricas se apliquen a este mundo parcialmente observable y cambiante.
- Nuevo modelo con planificación.
- Ablación: mismo modelo, observaciones y actualización, pero horizonte de una decisión. Aísla el aporte de anticipar una secuencia.

Elegir la alternativa más fuerte entre heurística y Q-learning en validación y congelarla antes de la confirmación. Dar a los métodos nuevos el mismo máximo de configuraciones de ajuste, episodios e información. Informar el tiempo de cálculo y memoria de todos; no esconder más cómputo tras una comparación por episodios.

Separar tres grupos sin solapamiento:

- Desarrollo: construcción y ajuste; comenzar con 40 mundos por familia.
- Validación: selección de la única variante y del competidor más fuerte; comenzar con otros 40 mundos por familia. No volver a ajustar tras la selección.
- Confirmación: semillas nuevas, instantes de cambio no utilizados y la composición reservada. Generar resultados solo tras congelar código, diseño y análisis.

Aprendizaje entre episodios: con ~30 planes por vida, un Q-learning tabular que empiece de cero en cada vida apenas aprende, y la comparación sería injusta a su favor o en su contra según cómo se entrene. Fijar antes de ajustar si los parámetros o valores iniciales de los aprendices se pueden preentrenar sobre mundos de desarrollo; si se permite, se permite a todos con el mismo número de episodios, y nunca sobre validación o confirmación.

Reiniciar la memoria del individuo entre episodios. La transferencia evaluada es la del mecanismo y la adaptación dentro de cada vida; no llamarla transferencia de recuerdos entre tareas. La composición reservada tampoco demuestra resolución de tareas arbitrarias.

Referencia piloto: en el perfil experimental del paso 1 la desviación típica de la supervivencia es 0,26; para 0,05 serían ~110-220 mundos según la correlación entre pares. Recalcular con la batería real.

Antes de confirmar, calcular el tamaño de muestra para detectar una diferencia absoluta de 0,05 con potencia objetivo del 80 %, usando la dispersión piloto y las comparaciones previstas. Fijar N y presupuesto de cómputo en el protocolo. Techo propuesto: 300 mundos independientes por familia y condición; si no alcanza la potencia, informar la limitación y no prometer una conclusión fuerte. No ampliar N después de ver los resultados.

Unidad de análisis: mundo/episodio independiente; comparar por pares de semillas, sin tratar decisiones de una misma vida como muestras independientes. Promediar familias con el mismo peso. Usar intervalos por remuestreo de mundos y corrección de multiplicidad, con hipótesis, exclusiones y tratamiento de fallos congelados. Una muerte es un resultado, no una exclusión.

Criterios propuestos de aceptación, que deben quedar fijados antes de confirmar:

1. En la batería cambiante, mejora media de al menos **0,05** sobre Fagi actual y sobre el competidor seleccionado; evidencia de superioridad con control de multiplicidad.
2. Ventaja también en la familia de composición reservada frente a ambos, sin esconderla dentro del promedio global.
3. En mundos estables, descartar una pérdida de **0,03** o más frente a Fagi actual mediante un contraste de no inferioridad.
4. Superar la ablación de horizonte uno para atribuir el beneficio a planificación secuencial. Si no sucede, la afirmación sobre ese mecanismo queda sin apoyo y se prefiere la versión más simple si satisface los otros criterios.
5. Coste de cómputo dentro del límite fijado con mediciones de desarrollo en la máquina objetivo; publicar tiempo por decisión, memoria y porcentaje de intervención de reflejos.

Los valores 0,05, 0,10 y 0,03 son decisiones prácticas propuestas. Se pueden discutir antes de recoger datos nuevos; no rebajarlos después para declarar éxito.

Resultados posibles:

| Resultado | Acción |
|---|---|
| Mejora útil, transferible dentro de la batería y coste aceptable | Integrar la variante que lo demuestra |
| Gana solo en desarrollo o en mapas conocidos | No integrar como mejora general; registrar fallo de transferencia |
| Intervalos demasiado amplios | Declarar inconcluso, sin convertir ausencia de evidencia en equivalencia |
| Rinde igual que una alternativa más simple | Preferir la alternativa simple; descartar complejidad innecesaria |
| Empeora o incumple el coste permitido | Retirar el prototipo del camino predeterminado y publicar el resultado |

Entregable: protocolo congelado, manifiesto, datos, análisis reproducible y conclusión limitada a lo medido. Una única campaña confirmatoria por versión del protocolo; cualquier corrección posterior exige una nueva versión y evaluación reservada.

## Paso 5. Integración condicionada

Solo después de pasar el paso 4:

- Integrar en el perfil del juego y mostrar observaciones, predicción y resultado sin atribuir capacidades no medidas.
- Verificar que batch y juego comparten la política, su cadencia y configuración.
- Ejecutar regresiones y repetir una ejecución de referencia.
- Medir en colonias como validación posterior: el éxito individual no acredita cooperación ni reproducción.
- Preparar reproducción por otra persona. La originalidad científica se evaluará aparte contra trabajos existentes; no se deduce del número de pruebas aprobadas.

## Gestión del trabajo

Primera entrega: pasos 1, 1b y 2. El paso 1 está medido; el 1b es la única modificación de `src/` permitida antes de la puerta del paso 2, y no introduce el controlador nuevo.

Segunda entrega, condicionada: prototipo y resultados de desarrollo del paso 3.

Tercera entrega, condicionada: confirmación del paso 4 y decisión explícita de integrar, simplificar, descartar o declarar inconcluso.

Estimar duración y coste al medir el primer runner; no fijar una fecha de descubrimiento. Mantener un registro breve de hipótesis, evidencia y decisiones. No abrir nuevas líneas de cultura, evolución o gráficos durante este ciclo.

## Antecedentes técnicos

Aprender modelos para planificar no es una invención de este proyecto. Dyna es un antecedente de integración entre aprendizaje, planificación y acción: [Sutton, 1990](https://mlanthology.org/icml/1990/sutton1990icml-integrated/). Para el competidor tabular: [Watkins y Dayan, 1992](https://www.gatsby.ucl.ac.uk/~dayan/papers/wd92.html).

La contribución inicial buscada es demostrar una mejora verificable en Fagi. Una aportación científica necesitará además establecer qué resultado o mecanismo añade al conocimiento existente.
