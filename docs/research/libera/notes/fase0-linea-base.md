# Fase 0: línea base de los requisitos de Tyrrell (2026-10-02)

Código `c980bf0` (`scripts/batch/tyrrell.js`, flag `--tyrrell`). Mundo de investigación con organismo (`--organism`), mapa 42, 20 vidas de 3600 s, dt 0,1. Todas las Fagis sobreviven la hora.

```
node scripts/batch.js --organism --tyrrell --map-seed 42 --runs 20 --duration 3600 --dt 0.1 [--set PROGRAM.learn=1]
```

| requisito | medida | `program` | `program+learn` |
|---|---|---|---|
| 1 todos los subproblemas | tiempo crítico sin atender / tiempo crítico | 0,124 | 0,162 |
| | (casi todo es cansancio mientras explora) | energía 0,003 de la vida | 0,006 |
| 2 persistencia | segundos que sigue un acto consumatorio cuando su necesidad ya no es la mayor | 5,8 s (85 % del acto) | 5,9 s (81 %) |
| 3 activación ∝ déficit | r(déficit al inicio de la ventana, tiempo atendiéndolo), ventanas de 10 s | hambre −0,17 · sed +0,23 · energía −0,17 · térmico +0,25 | −0,11 · +0,25 · −0,13 · +0,24 |
| 4–5 consumatorio > apetitivo | come la fruta al alcance (≤ 30 px, con hambre de comer al paso) en 5 s | 0,96 | 0,91 |
| 6 competencia equilibrada | parte de las decisiones que toma la línea más activa | 0,34 | 0,29 |
| 7 secuencias contiguas | cambios de acción por minuto (titubeo: vuelve a la anterior en ≤ 3 s) | 9,4 (0,17) | 10,9 (0,23) |
| 8 interrumpir | segundos desde que siente frío o calor fuera hasta un acto que lo atiende | 2,1 s | 2,4 s |
| 9 oportunismo | comidas en el campo con otra intención en los 2 s previos | 0,14 | 0,17 |
| 10 sin WTA | — | no medido: `program` elige una línea por diseño | |
| 11–12 compromiso | tiempo con dos déficits bajando a la vez | 0,0012 | 0,0015 |
| coste | µs por paso de simulación | 22,1 | 36,8 (**1,66×**) |

## Lectura

- **El hambre no activa la búsqueda (r −0,17).** Fagi forrajea según lo que falta en la despensa (`forageNeed`), no según su propia hambre, y come de la despensa en un instante. Es realista para un insecto social (forrajea para la colonia), pero rompe el requisito 3 tal como lo escribe Tyrrell. **A revisar en la Fase 2 (liberadores):** κ por hambre propia frente a la despensa.
- **El sueño es circadiano, no por cansancio (energía r −0,17).** Duerme de noche aunque no esté cansada (`SLEEP.nightly`). Es realista.
- **La persistencia es alta** (85 % del acto consumatorio ocurre cuando ya hay otra necesidad mayor). Viene sobre todo de descansar y dormir.
- **Aprender (`PROGRAM.learn`) empeora la contigüidad** (titubeo 0,17 → 0,23) **y cuesta 1,66×, por encima del presupuesto de 1,5×**. Es un candidato directo para el selector con histéresis de la Fase 3 (H2).
- **El compromiso casi no existe** (0,1 % del tiempo): no hay actos que atiendan dos necesidades a la vez. Encaja con el diagnóstico WTA.

## Pendiente de la Fase 0

- Ampliar la huella dorada a cada flag nuevo: está hecho para MORPH, SEASONS, LOAD y COLONIES vía el escenario `colony`.
- Dinámica de población (nacimientos, huevos, tamaño de colonia): está en las baterías del cuerpo evolutivo; falta un reporte estándar en `batch.js`.
- Congelar este protocolo antes de las Fases 1–3.
