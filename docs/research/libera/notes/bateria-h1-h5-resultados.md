# H1 y H5 (Fase 2): resultados (2026-10-02)

Protocolo congelado: `bateria-h1-h5-protocolo.md` (cd09912). Código `8c27816`. 2 condiciones × 60 vidas de 3600 s.

## Respuestas

| hipótesis | contraste | resultado | ¿se sostiene? |
|---|---|---|---|
| H1 no inferioridad | vida segura, `learned − innate` | −0,002 [−0,003; −0,001] (margen −0,02) | **sí** |
| | supervivencia | 0 (todas vivas en ambas) | sí |
| H5a | latencia hasta beber tras la 1.ª privación, `learned − innate` | **+61 s [32; 92]** | **sí** |
| H5b | mejora de la 2.ª frente a la 1.ª, `learned − innate` | −26 s [−81; 29] | no (dirección predicha; IC incluye 0) |

- **El impulso aprendido es viable**, y reproduce el fenómeno central del aprendizaje de incentivos (Dickinson y Balleine): **una necesidad nunca vivida no se revalora al instante**. La primera vez que pasa esa sed, la Fagi con κ aprendido tarda más en ir a beber que la innata.
- **La segunda privación** va en la dirección predicha (medianas: aprendida 56 → 24 s; innata 11 → 95 s), pero con mucho ruido: la latencia depende de dónde y cuándo la pilla la privación (a los 2400 s puede ser de noche).

**Curvas aprendidas (media de 60 vidas, niveles de necesidad 0 · 0,25 · 0,5 · 0,75 · 1):**
- sed: 0,19 · 0,32 · 0,52 · 0,51 · 0,50;
- hambre: 0,52 · 0,65 · 0,82 · 0,50 · 0,50.

Crecen con la necesidad hasta donde la vivió. Los niveles altos quedan en el valor inicial porque casi nunca llega ahí: el reflejo de supervivencia actúa antes (umbral crítico 0,55).

## Lectura

- W = κ·V con κ aprendido es **más realista que el innato** en un punto concreto y medido: la revaloración requiere experiencia.
- Que no llegue a necesidades altas es coherente con el diseño actual: por encima del umbral crítico decide el reflejo, no la puntuación. Un selector free-flow (Fase 3) que no tenga esa anulación dura dejaría que κ actúe en todo el rango.
- **No cambia el hallazgo de la Fase 0** (el hambre no impulsa el forrajeo): el forrajeo sigue a la despensa de la colonia, no a la propia hambre. Si se quisiera, `forageNeed` podría usar κ del hambre propia; es una decisión de diseño (realismo social frente al requisito de Tyrrell).

## Tabla

| modo | vivas | vida segura | latencia 1 (s) | latencia 2 (s) |
|---|---|---|---|---|
| innate | 1.000 | 0.999 | 31.1 | 85.1 |
| learned | 1.000 | 0.998 | 92.4 | 120.4 |

H1 vida segura learned − innate: -0.002 [-0.003, -0.001]
H1 supervivencia learned − innate: 0.000 [0.000, 0.000]
H5a lat1 learned − innate: 61.308 [32.500, 92.415]
H5b [lat2−lat1] learned − innate: -26.002 [-80.730, 28.618]
medianas lat1/lat2: innate 10.6/94.9 · learned 56/23.6
κ sed aprendido (media por nivel): 0.19 0.32 0.52 0.51 0.50
κ hambre aprendido (media por nivel): 0.52 0.65 0.82 0.50 0.50
