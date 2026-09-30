# Cautela al comer en el juego: confirmación

Generado por `research/adaptive-decision/caution-confirm.js`, congelado con `docs/research/caution-protocol.md`. No editar a mano.

| Perfil | Brazo | n | Supervivencia | Desenlaces |
|---|---|---|---|---|
| species | current | 200 | 0.882 | poison 29, alive 160, thirst 6, cold 5 |
| species | caution | 200 | 0.955 | alive 183, hunger 4, poison 4, cold 9 |
| classic | current | 200 | 0.986 | alive 197, thirst 3 |
| classic | caution | 200 | 0.991 | alive 198, thirst 2 |

H1, con especies: 0.073 [0.033, 0.111], p = 0.0003 → ✓
H2, mapa clásico: diferencia 0.005, cota inferior unilateral 95 % -0.014 (margen −0,02) → ✓
Coste: 0.943 veces el tiempo de current por segundo simulado (límite 1,5) → ✓

**Decisión según el protocolo: integrate as the game's factory behaviour, with a setting to turn it off.**
