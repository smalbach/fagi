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
