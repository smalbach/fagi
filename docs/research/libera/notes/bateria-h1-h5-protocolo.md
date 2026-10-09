# H1 y H5 (Fase 2): protocolo congelado (2026-10-02, antes de correr)

Código `8c27816` (`DRIVE`, `src/drive.js`). Script: `bateria-h1-h5.mjs`.

**Mundo.** Organismo de hoy, mapas `400000 + 17·semilla`, vidas de 3600 s, dt 0,1, semillas 1–60. **Privaciones forzadas de agua** a los 1200 s y a los 2400 s: la sed sube a 0,5 de su máximo, por debajo del umbral crítico (0,55), para que decida la puntuación y no el reflejo de supervivencia.

**Condiciones:** `innate` (κ curva innata) y `learned` (κ aprendido del alivio).

**Hipótesis:**
- **H1 (no inferioridad):** el impulso aprendido es tan viable como el innato. Medida: fracción de vida segura (hambre y sed bajo el umbral crítico). Se sostiene si el IC 95 % de `learned − innate` queda por encima de −0,02, y la supervivencia no baja (IC por encima de −0,10).
- **H5, reformulada como aprendizaje de incentivos:** con κ aprendido, la latencia hasta beber tras la primera privación es mayor que con κ innato (nunca sintió esa sed), y la segunda baja respecto de la primera más que con κ innato. Medidas: `lat1` y `lat2` (s hasta empezar a beber). Contrastes pareados:
  - (a) `lat1(learned) − lat1(innate)` > 0;
  - (b) `[lat2 − lat1](learned) − [lat2 − lat1](innate)` < 0.

  Se sostiene si ambos IC excluyen 0 en la dirección predicha. Una latencia ausente (no llegó a beber o murió) cuenta como 600 s.

**Análisis:** diferencias pareadas por semilla con IC 95 % por bootstrap (4000 remuestreos).
