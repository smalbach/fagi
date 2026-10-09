# H2d (Fase 3): protocolo congelado (2026-10-03, antes de correr)

Sigue a H2c. En desarrollo (mapa 7, semillas 7000–7015, exploratorio) aparecieron tres cosas.

1. **Un error en el bono consumatorio.** El bono premiaba cualquier propuesta con el objetivo al alcance. La marca de su propio rastro siempre está bajo sus patas, así que seguir el rastro se votaba como si fuera comer. Con el bono corregido (solo comida y agua), los cambios de acción por minuto bajan de 13,2 a 8,7 (programa 8,25). **H2b y H2c se corrieron con el error y no se rehacen.** Esta batería las sustituye en lo que toca al selector.
2. **El titubeo restante no sale de la votación.** Está dentro de la misma línea (`pursue`), en viajes de acopio: alterna entre seguir su rastro y la fruta que ve en él, rumbo al mismo árbol. Es un solo viaje, no dos actos. Por eso se añade la contigüidad **por meta**: la necesidad que atiende un acto, o el acto mismo; seguir su rastro cuenta como ir por comida.
3. **Las secuencias** (`SELECT.sequence`: el acto ganador no se vuelve a votar hasta completarse) no mejoraron nada en desarrollo y empeoraron R8 y R9.

Código `19b0ebc`. Banco: `scripts/batch.js --organism --tyrrell`, mapa 42, 40 vidas de 3600 s, dt 0,1, semillas de Fagi **5400–5439** (no usadas antes). Pareadas por semilla.

**Condiciones:**
- `program`;
- `selector`: `SELECT.mode = freeflow+central`, `consume = 4` (corregido), `veto = 1`;
- `selector+seq`: lo mismo con `SELECT.sequence = 3`.

**Hipótesis.**
- **H2d (principal):** `selector` tiene más victorias que derrotas frente a `program` en las 10 medidas.
- **H2d-seq:** `selector+seq` gana en contigüidad (R7a o R7c) frente a `selector`.

**Medidas** (dirección "mejor"):
- R1 tiempo crítico sin atender ↓
- R3 media de r(hambre) y r(sed) ↑
- R4–5 come lo que tiene al alcance ↑
- R7a cambios de acción por minuto ↓
- R7b titubeo de acción sin bocados de paso ↓
- **R7c cambios de meta por minuto ↓** (nueva)
- **R7d titubeo de meta sin bocados de paso ↓** (nueva)
- R8 latencia ante frío o calor ↓
- R9 oportunismo ↑
- R11–12 compromiso ↑

Se reporta además el recuento con solo las 8 medidas de H2, para comparar.

**Predicción declarada** (de desarrollo, `selector − program`):
- victorias en R3 y R7c;
- derrotas en R8 y R7b;
- el resto inciertas.
- H2d-seq **no** se sostendrá: las secuencias no mejoran la contigüidad y empeoran R8.

**Análisis.** Igual que H2b y H2c: diferencia pareada, IC 95 % por bootstrap (4000, semilla 4242), victoria o derrota si el IC excluye 0. Un nulo o inverso se reporta como tal. Se reportan supervivencia y coste por paso.
