# Revisión editorial del atlas de investigación

Fecha: 9 de octubre de 2026. Páginas: `investigacion/index.html` e `investigacion/en/index.html`.

## Dictamen

Las cifras centrales de transmisión cultural, herencia del aprendizaje y evolución coinciden con los informes del proyecto. La página original necesitaba matizar afirmaciones universales, distinguir controles y medidas, y separar evidencia confirmatoria de decisiones exploratorias de desarrollo. El rediseño incorpora estos límites desde la portada, preservando los resultados negativos y las tablas originales.

Esta revisión contrasta la página con informes, protocolos, código de análisis y datos agregados locales. No constituye una nueva ejecución de las campañas, una revisión por pares ni una verificación independiente de toda la bibliografía externa. Se conserva la advertencia sobre referencias consultadas solo mediante resúmenes.

## Hallazgos y cambios aplicados

| Texto o asunto | Evidencia contrastada | Corrección |
|---|---|---|
| «Las razones son el mejor maestro» | [Resultados principales](results.md): daño 0,31 con razones y 0,28 con evidencia; 0,53 con veredictos | Comparación explícita con veredictos, sin superioridad absoluta sobre todos los formatos. |
| 22–27 puntos menos de supervivencia | [Resultados principales](results.md): H2a = 0,274 en laboratorio y 0,223 en juego | Se conserva, con comparador y condición de inversión explícitos. |
| «Información igualada» | [Preregistro de cobertura](preregistration-coverage.md): coste por especies cubiertas | Se denomina presupuesto por cobertura; no se afirma igualdad de bits o de toda la información. |
| «Los mitos son del formato» | [Réplica](../../research/results/coverage-coverage/confirmatory.md): C2 = 0,902; C3 = 2,071 | Persistencia de diferencias bajo este diseño, sin convertirla en una ley universal o afirmar mediación causal demostrada. |
| Réplica «idéntica» | [Resultados](results.md): H2a original 0,274; C0 con semillas nuevas 0,232 | Separar reproducción con las semillas originales de réplica con semillas nuevas. |
| Predicción de cero | [Preregistro](preregistration-coverage.md) y [confirmación](../../research/results/coverage-coverage/confirmatory.md): IC 0,017–0,078 | La predicción era un intervalo que incluyera cero. Las seis pruebas se apoyan, pero esa predicción descriptiva no se cumple. |
| «Cada resultado» comprobado en el juego | [Resultados](results.md): solo H1, H2a y H3 preregistradas en la confirmación corporal | No extender esa confirmación a la réplica por cobertura ni a todos los hallazgos. |
| Mismos mundos entre todas las celdas | [Resultados, limitación del catálogo](results.md) | Pareamiento por formato dentro de condición; el tipo de cambio puede alterar el catálogo inicial. |
| Supervivencia del 100 % a 450 s | [Tabla de calibración](world-calibration.md): innato 0,96 a 450 s, 1,00 a 300 s | Corregido a 96 % para el programa innato. La prosa del propio informe también contiene el 100 % inconsistente; se prioriza la tabla, que coincide con la figura. |
| +11 puntos por heredar aprendizaje | [Resultados de herencia](prereg-lineage-results.md): 0,602 vs 0,493, generaciones 3–5 | Se conserva, con programa dañado deliberadamente y vidas individuales explícitos desde la portada. El 44 % previo se identifica como piloto. |
| «Aprender no cuesta» / H4 | [Resultados de herencia](prereg-lineage-results.md): 96 vidas, cota −0,109, margen −0,05 | No inferioridad no demostrada. La comparación exploratoria posterior de población (+0,8, t = 1,3) no resuelve H4 ni demuestra ausencia de coste. |
| Unidad estadística universal = linaje o colonia | [Análisis de herencia](../../scripts/lineage-analysis.js): pares por población, generación y puesto | Distinguir las unidades por protocolo. Señalar dependencia potencial entre vidas descendientes de las mismas poblaciones. |
| Hermana mal informada «no daña» | Informe histórico social, S2: −0,013 [−0,031; 0,004], margen 0,05 | No inferioridad bajo el margen, no daño cero. |
| Impulsos «no cuestan vida», −0,002 | [H1/H5](libera/notes/bateria-h1-h5-resultados.md): diferencia en vida segura, margen 0,02 | Nombrar medida y margen; no confundirla con supervivencia. |
| Estómago de dos etapas mejora sin comparador | [H6](libera/notes/bateria-h6-resultados.md) | Mejora frente a no sentir saciedad; bocados y desperdicio iguales frente al instantáneo. |
| «Sin sabotaje no hay nada que reordenar» | [Calibración y cribado](world-calibration.md) | No se encontró mejora entre 171 reordenaciones y seis mundos; no prueba imposibilidad de otra conducta mejor. |
| LLM no aprende de la vida | [Piloto 4](../../research/code-culture/step4-piloto-resultados.md) | Interpretación limitada al modelo, operador y pruebas realizados. |
| Evolución local y mapas históricos | [Calibración, cierre y repetición del 8 de octubre](world-calibration.md), [datos agregados](../../investigacion/data/game.json) | Evolución exploratoria, sin adaptación local consistente detectada; se conserva músculo +0,160, cerebro −0,096 y tamaño +0,068. |
| Árboles fuera del mapa | [Sensibilidad del juego](results.md): 101/600 mapas; tres contrastes persisten al excluir linajes afectados | La nota se amplía y pasa también a Limitaciones. No valida niveles absolutos ni otros estudios. |
| «Nadie ha respondido» / validez externa | La documentación local no establece prioridad bibliográfica ni validación en animales o personas | Retirar la afirmación de prioridad y explicar el alcance de simulación. |
| Semilla = resultado idéntico en navegador y Node | [Parámetros del laboratorio](../../research/lab/params.js), determinismo documentado por entorno | Añadir parámetros, código y entorno. El laboratorio no simula el mapa espacial. |
| Cifras promocionales de portada | 12 800 = 64 celdas × 200 semillas; no son 12 800 semillas independientes | Explicar ejecuciones por linaje y condición. Sustituir el contador agregado de 27 protocolos, sin inventario enlazado, por la réplica identificable. |

## Fuentes adicionales contrastadas

Se revisaron las tablas confirmatorias históricas de organismo, organismo2, conceptos, diversidad, social y forrajeo con:

```sh
git show b0815b8^:research/results/<estudio>/report.md
```

Sus cifras publicadas coinciden con la página; se corrigió la interpretación de no inferioridad social. Cautela contiene sus resultados en [su protocolo](caution-protocol.md). La decisión adaptativa coincide con [su conclusión](../../research/adaptive-decision/conclusion.md): +0,056 frente a current, −0,030 frente a la heurística y −0,004 para el horizonte de dos pasos. También se consultaron las baterías H1/H5 y H6 y los resultados del piloto de código cultural. El resto de las baterías se conserva como síntesis de los informes existentes, sin afirmar una recalculación exhaustiva.

## Límites que siguen abiertos

- H4 requiere más evidencia. No se cambian valores p ni veredictos preregistrados.
- El análisis de herencia usa pares de vidas, aunque las revisiones compartidas pueden correlacionar descendientes. Conviene un análisis de sensibilidad agregado por las 32 poblaciones; esta observación no invalida automáticamente el efecto descriptivo de +10,9 puntos y no se ha recalculado aquí.
- La figura de cobertura mezcla el C0 de la réplica con H1/H3/H4a del estudio principal en la serie de elementos. La leyenda ahora lo explicita; no se presenta como un único conjunto homogéneo.
- La bibliografía externa, varias afirmaciones históricas de mecanismo y los parámetros biológicos no se han auditado artículo por artículo. Las referencias siguen siendo contexto del modelo, no una validación externa.
- Los informes históricos no se reescriben ni se alteran datos crudos para hacerlos coincidir con la edición.

## Diseño y verificación

Atlas con papel marfil, tinta verde, acento terracota, títulos serif, lámina estática hecha con el sprite del juego, rutas de lectura y notas con alcance de evidencia. Conserva las 16 secciones, el laboratorio ejecutable, las figuras, idiomas y temas. Se elimina la animación decorativa y el conteo ascendente de cifras.

Validación: compilación Vite y 28 tests existentes del laboratorio, transmisión y estadística; comprobación de las anclas locales y paridad de IDs entre ES/EN; comprobación visual y funcional en navegador. No se ejecutaron de nuevo las campañas científicas completas.

Comprobación en navegador: español a 375 y 1280 px, inglés a 320 px; sin desbordamiento global ni errores de consola observados. El laboratorio ejecutó sus cuatro linajes y el selector de resultados cambió a las cifras del juego. Se revisaron los temas claro y oscuro.
