# Revisión del frontend

## Estructura actual

Frontend en JavaScript con módulos ES y Vite, sin framework de componentes. `index.html` define las superficies; `src/main.js` conecta simulación y UI; `src/app/` gestiona acceso y sesiones; `src/layout.js` gestiona vistas y tamaños; `src/panel-layout.js` gestiona pestañas y paneles de consola. Los estilos se cargan por área desde `src/styles/index.css`, con responsive al final. `src/settings.js` es el esquema compartido por formulario, persistencia y grabación/reproducción.

## Cambios implementados

- Preparación móvil con pestañas Mapa/Ajustes: evita presentar ambos paneles completos uno debajo del otro.
- Navegación móvil entre Fagi, mapa e inspector, con tamaño de texto y densidad accesibles. La vista Profunda conserva todas las secciones.
- Programa adaptativo dividido en cinco grupos funcionales; conserva los IDs antiguos.
- Búsqueda accesible, filtro de ajustes modificados, estado de grupos conservado y etiquetas de opciones largas sin truncar.
- Acciones ocasionales de sesión agrupadas en un menú. Ajustes como diálogo durante el juego, con Escape, foco inicial, recorrido de teclado contenido y retorno del foco.
- Editor de frutos, filogenia, reproducción y consola adaptados a pantallas estrechas; barras de preparación con salto de línea en escritorio pequeño.
- Eliminado el ID duplicado de herramientas de código; se conserva la exclusión de edición en reproducción.

## Cobertura del esquema

Se conservan los **414 IDs existentes**, sin pérdidas. Se añaden **26 controles**, todos incluidos en snapshots, persistencia, cambios grabados y restauración de valores. No se alteran sus valores por defecto.

- `Camera.max`
- `Camera.step`
- `Camera.keysDown`
- `Attention.forget`
- `Attention.opportunisticThirst`
- `Neural connections.hebbRate`
- `Neural connections.hebbDecay`
- `Neural connections.learnRate`
- `Neural connections.feelDecay`
- `Neural connections.prune`
- `Explanations.log`
- `Explanations.examples`
- `Explanations.wary`
- `Explanations.tempted`
- `Fagi.terrainAdapt`
- `Fagi.cautiousThreshold`
- `Body temperature.voluntary`
- `Sleep.askAlways`
- `Sleep.replayRate`
- `Sleep.downscale`
- `Night mind.timeout`
- `Night mind.log`
- `Adaptive program.tick`
- `Adaptive program.record`
- `External decision API.maxTtl`
- `Habits.learn`

## Configuración que sigue fuera del formulario

Inventario de propiedades numéricas directas de los objetos exportados de config.js que no tienen campo equivalente. No incluye cadenas, listas ni estructuras anidadas; por tanto, no es un inventario de toda la API interna. Algunas opciones se controlan desde otras partes de la UI.

| Bloque | Propiedades sin campo directo |
| --- | --- |
| APPETITE | `smellAversion`, `averse`, `desperate`, `poisonWindow` |
| BASELINE | `learn` |
| CAMERA | `min`, `maxDetail` |
| CARRY | `nestFeed` |
| CASTES | `thresholdMin`, `thresholdMax` |
| CHOICE | `explorePrior`, `rate`, `cost`, `doubt`, `trustDiscount`, `surpriseHeat`, `surpriseMemory`, `exploreWindow`, `planMax` |
| CONCEPT | `lateAt`, `lateKinds`, `lateThings`, `reach`, `stingPain`, `thermal`, `minKinds`, `testMin`, `keep`, `trust`, `sure`, `sipAt`, `surprise`, `calm`, `lookAgain`, `lining`, `liningHeat`, `social`, `seen` |
| CONDUCT | `gate`, `retire` |
| CUES | `evidence`, `checkTold` |
| CYCLE | `twilight`, `warmest` |
| DECIDE | `enabled`, `ownStream` |
| EXPLORE | `visitGain`, `visitMax`, `reach`, `rays`, `compassWeight`, `farWeight`, `turnWeight`, `waypointReach` |
| FAGI | `radius` |
| FEEL | `energyScale` |
| FORAGE | `patchSpread`, `patchMinNest` |
| GEN | `innateN`, `storedWorth`, `budget` |
| HABITS | `history` |
| HEALTH | `max` |
| LAKE | `shoreWidth`, `deepFrom`, `waveEdge`, `sparkles`, `ripples`, `reeds`, `stones`, `specks`, `ripplets`, `caustics` |
| LARDER | `prior`, `rate`, `maxRate`, `minGap` |
| LEARN | `maxRetired` |
| LOAD | `sizePower` |
| MAPGEN | `nests`, `margin`, `minGap`, `spawnClear`, `speciesMinDistance`, `speciesMaxDistance`, `shelters` |
| MEMORY | `floor`, `travelRange` |
| MORPH | `kleiber` |
| NEST | `forageDrive` |
| NIGHTAI | `sure` |
| PHERO | `learnWindow`, `found`, `miss` |
| RAIN | `minRadius`, `puddleLifeRate` |
| SEASONS | `winterAt` |
| SITES | `radius`, `full`, `first`, `gain`, `decay`, `minValue`, `leave` |
| SLEEP | `salient`, `redundant`, `minSupport`, `minEffect`, `reports` |
| SOCIAL | `minTrust`, `every`, `seeRange`, `evidence` |
| TASTE | `toxicBitter`, `hiddenToxin` |
| TERRAIN | `heightScale`, `moistureScale`, `gravelScale`, `lightCell`, `relief`, `deep`, `mossFrom`, `gravelFrom`, `grain`, `patches`, `photo`, `photoScale`, `clearings`, `specks`, `pebbles`, `bushes`, `litter`, `leaves`, `moss`, `roots`, `cracks`, `shore`, `vignette`, `veil` |
| THERMAL | `preferred`, `lethalMin`, `lethalMax`, `wetExchange`, `wetChill`, `moveHeat`, `nestBuffer`, `maxStress`, `coldHunger`, `heatThirst`, `coldSlow`, `minSpeed`, `sample`, `lesson`, `refugeSample`, `instinct`, `duskSense` |
| WATER | `shallows`, `edgeGiveUp` |
| WORLD | `width`, `height`, `baseWidth`, `baseHeight` |

### Criterios y próximos pasos

- **Terreno y decoración (TERRAIN, LAKE):** usan imágenes y superficies generadas/cacheadas. Requieren un flujo de regeneración e invalidación antes de ofrecer edición visual fiable.
- **Tamaño del mundo (WORLD):** es estado derivado; el usuario ya modifica el tamaño con MAPGEN.size en preparación. No debe editar ancho y alto de forma independiente.
- **Mente nocturna remota:** NIGHTAI.backend y NIGHTAI.url todavía no tienen controles. La instancia se recrea al cambiar de tipo, pero no al cambiar solo la URL; hace falta resolver ese ciclo de vida antes de exponer ambos. El backend de decisiones diurnas ya se elige en Código e historial.
- **DECIDE, BASELINE y otras opciones de investigación:** necesitan explicar interacción con el selector, instintos y reglas de conducta; no se activa un controlador experimental por defecto.
- **Parámetros fisiológicos y umbrales restantes:** conviene incorporarlos por bloque, con validaciones entre límites relacionados (por ejemplo temperaturas seguras y letales), en lugar de generar controles sin restricciones.
- **Ajustes de nacimiento o mapa:** varias etiquetas existentes indican nueva sesión/mapa; no todo cambio se aplica a entidades ya creadas.

## Validación

Build de producción con Vite. Pruebas de esquema para IDs históricos, snapshots, límites y restauración; pruebas existentes de atención, backend, hábitos y programa. Comprobación visual automatizada en Chrome con API simulada, sin acceso a cuentas reales: preparación, búsqueda, persistencia, modos de juego y diálogo en anchos de 320 a 1440 px. La conectividad real del servidor y los dispositivos iOS/Android físicos no forman parte de esta comprobación. Vite mantiene la advertencia por un chunk JS superior a 500 kB.
