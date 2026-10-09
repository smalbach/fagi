# H3b: protocolo congelado (2026-10-02, antes de correr)

Corrige el fallo de diseño de H3 (`bateria-h3-resultados.md`): con `SCIENCE.order = 'lp'` la decisión de probar elige ahora la pregunta a la vista que más vale (progreso esperado × seguridad, con la mitad del valor cada `SCIENCE.reach` = 200 px), no la más cercana. Código: el commit siguiente a `8337c7b` en `feat/evolving-body`. Script: `bateria-h3.mjs`, sin cambios.

**Condiciones:** `agenda` (como hoy) y `lp`. **Semillas nuevas: 61–120** (60 vidas por condición, mapas `300000 + 17·semilla`). Mismas medidas.

**Análisis declarado:** diferencia pareada `lp − agenda` con IC 95 % por bootstrap.
- H3 se sostiene si el área bajo la curva de juicio o el tiempo hasta juicio ≥ 0,8 mejora con un IC que excluye 0, y las creencias falsas no suben (el IC de la diferencia no queda por encima de 0).
- Secundarias: dosis de veneno, especies buenas encontradas, supervivencia y proporción de veredictos refutados.
