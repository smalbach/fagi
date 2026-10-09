# H3c: protocolo congelado (2026-10-02, antes de correr)

H3b mostró que con 6 especies no hay qué priorizar. H3c pone **escasez de preguntas**: 16 especies y solo 2 preguntas por noche (`EXPERIMENT.agenda = 2`), así que la prioridad decide qué se pregunta. Código `5ccaff2`. Script: `bateria-h3c.mjs` (`SPECIES=16 AGENDA=2`).

**Condiciones:** `none` (sin experimentos), `agenda` (preguntas por orden de la noche, la más cercana a la vista) y `lp` (noche científica: preguntas y decisión por progreso × seguridad). **Semillas 121–180**, mapas `300000 + 17·semilla`, vidas de 2400 s.

**Análisis declarado:** diferencia pareada `lp − agenda` con IC 95 % por bootstrap.
- H3 se sostiene si el área bajo la curva de juicio o el tiempo hasta juicio ≥ 0,8 mejora con un IC que excluye 0, y las creencias falsas no suben.
- Si `lp` empeora con un IC que excluye 0, se reporta como resultado inverso.
- Secundarias: dosis, especies buenas encontradas, supervivencia y veredictos.
