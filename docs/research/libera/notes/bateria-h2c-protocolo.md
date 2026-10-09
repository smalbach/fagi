# H2c (Fase 3): protocolo congelado (2026-10-03, antes de correr)

Sigue a H2b (`bateria-h2b-resultados.md`): el selector perdía R1 porque, agotada, votaba por buscar comida en vez de descansar. El cambio es estructural: **una necesidad crítica no se vota** (`SELECT.veto`). Mientras una necesidad pasa su umbral crítico, solo pueden ganar las líneas que la atienden, empezando por la más urgente. Se vota normalmente si ninguna responde. El umbral es el mismo que mide R1.

En desarrollo (mapa 7, semillas 7000–7015, exploratorio), el veto bajó R1 de 0,19 a 0,11 (programa 0,14). El titubeo siguió alto.

Código `6b7e5aa`. Banco: `scripts/batch.js --organism --tyrrell`, mapa 42, 40 vidas de 3600 s, dt 0,1, semillas de Fagi **5300–5339** (no usadas antes). Pareadas por semilla.

**Condiciones:**
- `program`;
- `central+consume` (`SELECT.mode = freeflow+central`, `SELECT.consume = 4`);
- `central+consume+veto` (lo mismo con `SELECT.veto = 1`).

**Hipótesis.**
- **H2c (principal):** `central+consume+veto` tiene más victorias que derrotas frente a `program`.
- **H2c-veto (mecanismo):** frente a `central+consume`, el veto gana en R1.

**Medidas:** las de H2b (R1, R3, R4–5, R7a, R7b sin bocados de paso, R8, R9, R11–12), con las mismas direcciones. R2 y el titubeo antiguo son solo descriptivos.

**Predicción declarada:**
- frente al programa: victorias en R3, R9 y R11–12; derrotas en R7a y R7b; R1 y R8 inciertas;
- el veto gana R1 frente a `central+consume`.

**Análisis.** Igual que H2b: diferencia pareada, IC 95 % por bootstrap (4000, semilla 4242), victoria o derrota si el IC excluye 0. Un nulo o inverso se reporta como tal. Se reportan supervivencia y coste por paso.
