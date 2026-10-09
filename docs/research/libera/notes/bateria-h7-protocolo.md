# H7: protocolo congelado (2026-10-02, antes de correr)

**Hipótesis H7.** La curiosidad por progreso de aprendizaje evita las trampas de ruido: con fruta ruidosa, la noche científica (`lp`, que marca como ruido los rasgos con error alto sin progreso) gasta menos pruebas en ella que la agenda actual, sin juzgar peor el resto.

**Mundo.** Como H3c (16 especies, 2 preguntas por noche, vidas de 2400 s), y **4 especies ruidosas**: cada fruta que cae es, la mitad de las veces, lo contrario de su especie (gemela de aspecto igual, `chemistry.js`). Las ruidosas se eligen con un flujo propio (`900000 + semilla`), igual en ambas condiciones. Código `f4bb5e1`. Script: `bateria-h7.mjs` (`SPECIES=16 AGENDA=2 NOISY=4`).

**Condiciones:** `agenda` y `lp`. **Semillas 181–240.**

**Medidas:**
- **principal:** fracción de bocados de prueba que caen en especies ruidosas (`onNoise / tries`);
- juicio sobre las especies no ruidosas, creencias falsas, supervivencia y dosis.

**Análisis declarado:** diferencia pareada `lp − agenda` con IC 95 % por bootstrap. H7 se sostiene si la fracción de pruebas en ruido baja con un IC que excluye 0 y el juicio no empeora (el IC de la diferencia no queda por debajo de −0,03).
