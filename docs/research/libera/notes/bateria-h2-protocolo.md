# H2 (Fase 3): protocolo congelado (2026-10-02, antes de correr)

Código `f8aed4b` (`SELECT`, `src/decision/select.js`). Banco: `scripts/batch.js --organism --tyrrell`, mapa 42, 40 vidas de 3600 s, dt 0,1, semillas de Fagi 5000–5039. Las condiciones se comparan pareadas por semilla.

**Condiciones:**
- `program` (el programa WTA de hoy);
- `program+learn` (`PROGRAM.learn = 1`);
- `freeflow` (`SELECT.mode = freeflow`);
- `freeflow+central` (`SELECT.mode = freeflow+central`).

**Hipótesis H2.** free-flow + selector central puntúa mejor en los requisitos de Tyrrell que el programa WTA y que el free-flow puro.

**Medidas** (por vida, de `tyrrell.js`), con la dirección "mejor":
- R1 tiempo crítico sin atender ↓
- R3 media de r(hambre) y r(sed) ↑
- R4–5 come lo que tiene al alcance ↑
- R7a cambios por minuto ↓
- R7b titubeo ↓
- R8 latencia ante frío o calor ↓
- R9 oportunismo ↑
- R11–12 compromiso ↑

R2 (persistencia) no tiene una dirección "mejor" clara y se reporta solo de forma descriptiva.

**Análisis declarado.** Para cada medida, la diferencia pareada `A − B` con IC 95 % por bootstrap (4000). Una medida es **victoria** de A si el IC excluye 0 en la dirección "mejor", y **derrota** si lo excluye en la contraria.
- H2 se sostiene si `freeflow+central` tiene más victorias que derrotas **frente a `program`** y también **frente a `freeflow`**.
- Un resultado nulo o inverso se reporta como tal.
- Se reportan además la supervivencia y el coste por paso.
