# H6 (Fase 4): protocolo congelado (2026-10-02, antes de correr)

Código: commit de `STOMACH` en `feat/evolving-body`. Script: `bateria-h6.mjs`. Organismo de hoy, mapas `500000 + 17·semilla`, vidas de 3600 s, dt 0,1, semillas 1–60.

**Condiciones:**
- `instant` (como hoy);
- `two-stage` (estómago en dos tiempos, saciedad 1);
- `no-satiety` (dos tiempos, saciedad 0: siente solo lo ya digerido).

**Hipótesis H6.** El estómago en dos tiempos produce saciedad anticipatoria: deja de comer antes de que el alimento le llegue.

**Medidas:**
- **principal:** bocados por comida (bocados con menos de 20 s entre sí);
- desperdicio (puntos de hambre que no cupieron);
- hambre media, tiempo con hambre crítica y supervivencia.

**Análisis declarado:** diferencias pareadas con IC 95 % por bootstrap.
- H6 se sostiene si `two-stage − no-satiety` da **menos bocados por comida y menos desperdicio**, ambos con IC que excluye 0.
- Además `two-stage − instant` en tiempo con hambre crítica no debe subir (el IC no queda entero por encima de 0,01).
