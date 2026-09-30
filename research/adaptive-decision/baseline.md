# Decisión adaptativa, pasos 1 y 1b: referencia y quién decide

Generado por `research/adaptive-decision/analyze.js` a partir de `run.js`; no editar a mano.
Plan: `docs/research/plan-decision-adaptativa.md`. Commit `9b8fc6e` (con cambios sin confirmar en el código medido), Node v24.16.0.
Manifiesto con configuración resuelta, semillas y comandos: `research/results/adaptive-decision/manifest.json`.

## Qué se midió

Una Fagi sola, sin reproducción ni hermanas, 2400 s (dt 0.05), 40 mundos de desarrollo por perfil, mismas semillas en ambos perfiles.

- `game`: organismo con los números del juego (`app/organism-on.js`), `LIFE` apagado.
- `experimental`: lo mismo más `FORAGE`, `SITES`, `CHOICE` (modo 1, aprendida) y `LARDER`, con el mundo escaso de la fase 9: Fagi actual tal cual.
- `connected`: `experimental` con el punto de decisión encendido (`DECIDE`, paso 1b): la misma elección aprendida, conectada. Referencia del plan desde el paso 2.

## Supervivencia

Medida principal del plan: `min(tiempo vivo, horizonte) / horizonte`, sobre todos los episodios (intervalo 95 % por remuestreo de mundos).

| Perfil | N | Supervivencia media | Vivas al final | Muertes | Comidas | Raciones al nido |
|---|---|---|---|---|---|---|
| game | 40 | 1.000 [1.000, 1.000] | 100 % | — | 5.03 | 18.25 |
| experimental | 40 | 0.854 [0.772, 0.927] | 68 % | poison 10, cold 2, thirst 1 | 13.03 | 18.07 |
| connected | 40 | 0.857 [0.771, 0.930] | 70 % | poison 8, cold 3, thirst 1 | 12.35 | 18.13 |

Diferencia pareada experimental − game: -0.146 [-0.228, -0.073], descriptiva.
Diferencia pareada connected − experimental: 0.003 [-0.091, 0.097], descriptiva.

Episodios en el techo (vivas al horizonte): game 100 %, experimental 68 %, connected 70 %.

## Quién tiene el control

Tiempo en control de cada nivel de la jerarquía (`decision.js`), sumado sobre episodios.

| Nivel | game | experimental | connected |
|---|---|---|---|
| survive | 7 % | 9 % | 8 % |
| endure | 48 % | 43 % | 45 % |
| decide | 0 % | 0 % | 25 % |
| provide | 13 % | 19 % | 12 % |
| clues | 2 % | 8 % | 1 % |
| explore | 31 % | 22 % | 10 % |

`decide` es el punto de decisión (solo `connected`); la comida a la vista, reflejo común, cuenta en `provide` como `provide.seen`.

Reglas con más tiempo en control (experimental):

| Regla | Tiempo |
|---|---|
| `endure.sleep` | 40 % |
| `explore.explore` | 19 % |
| `provide.pursue` | 14 % |
| `survive.drink` | 7 % |
| `clues.scent` | 6 % |
| `provide.carry` | 4 % |
| `endure.shelter` | 3 % |
| `explore.taste` | 3 % |
| `survive.urgency` | 2 % |
| `clues.memory` | 1 % |

Segmentos (cambio de regla, acción u objetivo) por minuto vivo: game 9.09, experimental 19.01, connected 14.46. Una "decisión" así contada se reevalúa cada fotograma; no equivale a una elección deliberada.

## La elección: propuesta frente a ejecución

`choice.js` hace un plan (volver al sitio k o explorar) cuando tiene hambre y no ve comida. Sin el punto de decisión solo ofrece ese sitio a la jerarquía como candidato; con él (`connected`) el plan se ejecuta salvo que un reflejo común lo sustituya (niveles sobrevivir y aguantar, comida a la vista). El plan es la propuesta; la regla en control, la ejecución. Solo cuentan los segundos en que el plan corre (busca comida, despierta), como los cuenta `choice.js`.

| | experimental | connected |
|---|---|---|
| Planes por episodio (parte explorar) | 31.98 (30 %) | 122.40 (7 %) |
| Tiempo con plan en curso / tiempo vivo | 47 % | 38 % |
| Plan de sitio: segundos por episodio | 890.18 | 691.27 |
| Plan de sitio: va a ese sitio | **5 %** | **65 %** |
| Plan de sitio: sustituido por reflejos | 20 % | 26 % |
| Plan de sitio: va a ese sitio, del tiempo sin reflejo | 7 % | 88 % |
| Plan de sitio: el sitio no es candidato | 51 % | 15 % |
| Plan de explorar: segundos por episodio | 77.30 | 98.99 |
| Plan de explorar: busca | **28 %** | **80 %** |
| Plan de explorar: busca, del tiempo sin reflejo | 37 % | 93 % |

"El sitio no es candidato" solo tiene sentido sin el punto de decisión: con él, el sitio se persigue sin pasar por la lista de candidatos.

Quién controla mientras no se sigue el plan de sitio (experimental): `explore.explore` 37 %, `provide.pursue` 20 %, `survive.drink` (reflejo) 11 %, `clues.scent` 11 %, `endure.shelter` (reflejo) 6 %, `explore.taste` 4 %, `clues.memory` 3 %, `survive.urgency` (reflejo) 2 %.

Cómo terminaron los planes (experimental, total): site:full 399, explore:found 388, site:home 190, site:empty 134, site:forgotten 80, site:gave up 51, explore:nothing 6.

Quién controla mientras no se sigue el plan de sitio (connected): `survive.drink` (reflejo) 10 %, `endure.shelter` (reflejo) 8 %, `explore.explore` 4 %, `provide.pursue` 4 %, `provide.seen` (reflejo) 4 %, `survive.urgency` (reflejo) 2 %, `endure.anticipate` (reflejo) 2 %, `explore.taste` 0 %.

Cómo terminaron los planes (connected, total): site:full 2832, site:empty 1668, explore:found 272, site:home 67, site:forgotten 24, explore:nothing 10.

## Repetibilidad

- game, episodio 0 repetido en otro proceso: huella `aa47bf6c` / `aa47bf6c` ✓ idéntica.
- experimental, episodio 0 repetido en otro proceso: huella `22a838ae` / `22a838ae` ✓ idéntica.
- connected, episodio 0 repetido en otro proceso: huella `6308aca6` / `6308aca6` ✓ idéntica.
- Con traza completa activada la huella es `22a838ae` ✓ (trazar no altera el episodio).

## Lectura

Escrita a mano sobre los números de arriba (40 mundos de desarrollo por perfil); no es un resultado confirmatorio.

**Reconstrucción y repetición: se cumple.** Cada episodio registra qué regla tuvo el control, qué plan tenía la elección y qué pasó; repetir una semilla en otro proceso da la misma huella, y activar la traza no altera el episodio.

**La elección actual (`experimental`) apenas llega a actuar: la puerta del paso 1 no se cumple.** Mientras `choice.js` tiene un plan de volver a un sitio, su objetivo es ese sitio solo el ~5 % del tiempo; la mitad del tiempo el sitio ni siquiera llega a la lista de candidatos (lo tapa, por ejemplo, el olor de otro árbol o el filtro de `forage > 0.15` de `perception.js`), y cuando llega, otra regla gana (sobre todo `explore`, `pursue` de lo que ve y beber). Esto también explica en parte el F1 no apoyado de la fase 9 ("elegir bien no paga aquí"): la elección decidía poco de lo que hacía. Según el plan, hay que corregir la conexión antes de medir aprendizaje; un controlador nuevo conectado igual heredaría el mismo problema.

**El perfil del juego está en el techo.** Con el mapa del juego (sin química de especies, sin estaciones) las 40 sobreviven al horizonte comiendo 5 veces cada una: no hay margen que medir. La diferencia con el perfil experimental (−0,15) es del mundo, no del controlador.

**En el perfil experimental casi todas las muertes son por veneno** (10 de 13; hambre 0, sed 1, frío 2), igual que en las colonias de la fase 9. El veneno depende del aprendizaje de alimentos, que el plan fija como común. Una batería con este mundo mediría sobre todo ruido ajeno a la decisión de recursos.

**Tiempo disponible para decidir.** Dormir ocupa ~40 % del tiempo (`SLEEP.nightly`), y el nivel "sobrevivir" otro ~9 %. Lo que un controlador de recursos puede gobernar es aproximadamente la mitad de la vida.

**Muestra.** Desviación típica de la supervivencia en el perfil experimental: 0,26. Para 0,05 con potencia 80 %, del orden de 110-220 mundos por condición según cuánto correlacionen los pares; dentro del techo de 300 del plan, a revisar con la batería real.

## Paso 1b: el punto de decisión

**Apagado no cambia nada.** `node research/adaptive-decision/verify-off.js`: los 80 episodios del paso 1 (`game` y `experimental`) dan la misma huella con el código nuevo.

**Encendido, la elección decide.** En `connected` el plan de volver a un sitio se sigue el 88 % del tiempo que no toman los reflejos comunes (antes 7 %), y el de explorar el 93 % (antes 37 %). El resto es la sed: la elección solo sabe de comida, así que cuando la sed tira más que las ganas de comida no opina y la jerarquía pesa agua contra comida como siempre. Sin esa cesión, la primera versión conectada la mantenía camino de un sitio con sed moderada. Sobre el tiempo total de plan, los reflejos se llevan ~26 % (beber, refugio, urgencia, comida a la vista): es la parte que no le toca decidir a ningún controlador.

**Supervivencia igual** (0,857 frente a 0,854; diferencia pareada 0,003 [−0,09, 0,10], 40 mundos). Conectar la elección no la hace mejor ni peor aquí; el veneno sigue dominando las muertes (8 de 12).

**Conducta nueva que revisar en el paso 2.** Conectada, la elección hace ~122 planes por vida en vez de ~32 y explora mucho menos (7 % de los planes frente a 30 %): vuelve a sitios que conoce, a menudo vacíos (1668 visitas vacías frente a 2832 llenas en 40 vidas). Antes, la jerarquía la desviaba a explorar o seguir olores; ahora hace lo que la elección cree mejor. Es un dato sobre la elección (su estimación de lo que tarda explorar), no un defecto del punto de decisión, pero condiciona qué referencia es "competente" en el paso 2.

