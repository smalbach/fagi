# H2b (Fase 3): protocolo congelado (2026-10-02, antes de correr)

Sigue a `calibracion-selector.md`, que fue exploratorio (mapa 7). Aquí se confirma en el banco de H2 con semillas nuevas.

Código `7578dfb` (`SELECT.consume`, 17302f5; `STOMACH` apagado). Banco: `scripts/batch.js --organism --tyrrell`, mapa 42, 40 vidas de 3600 s, dt 0,1, semillas de Fagi **5200–5239** (no usadas en H2 ni en la calibración). Pareadas por semilla.

**Condiciones:**
- `program` (WTA de hoy);
- `central+consume`: `SELECT.mode = freeflow+central`, `SELECT.consume = 4` (resto por defecto).

**Hipótesis H2b.** Con el bono consumatorio, el selector central puntúa mejor que el programa en los requisitos de Tyrrell: más victorias que derrotas.

**Medidas** (iguales a H2, salvo R7b):
- R1 tiempo crítico sin atender ↓
- R3 media de r(hambre) y r(sed) ↑
- R4–5 come lo que tiene al alcance ↑
- R7a cambios por minuto ↓
- R7b titubeo **sin contar volver tras un bocado o sorbo de paso** (`r7DitherPure`) ↓
- R8 latencia ante frío o calor ↓
- R9 oportunismo ↑
- R11–12 compromiso ↑

R2 y el titubeo antiguo (`r7Dither`) se reportan solo de forma descriptiva.

**Predicción declarada** (de la calibración): victorias en R3, R9 y R11–12; derrota en R7a; R4–5 y R7b inciertas.

**Análisis.** Diferencia pareada `central+consume − program`, IC 95 % por bootstrap (4000, semilla 4242). Victoria si el IC excluye 0 en la dirección "mejor"; derrota si la excluye en la contraria. H2b se sostiene si victorias > derrotas. Un nulo o inverso se reporta como tal. Se reportan además supervivencia y coste por paso.
