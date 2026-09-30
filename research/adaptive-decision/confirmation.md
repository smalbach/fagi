# Decisión adaptativa, paso 4: confirmación

Generado por `research/adaptive-decision/confirm.js`, congelado con `docs/research/adaptive-decision-protocol.md`. No editar a mano.

## Supervivencia media por familia

| Juez | stable | invert | novel | composition |
|---|---|---|---|---|
| current | 0.843 (n 300) | 0.781 (n 300) | 0.824 (n 300) | 0.811 (n 300) |
| model-fixed | 0.913 (n 300) | 0.814 (n 300) | 0.903 (n 300) | 0.886 (n 300) |
| heuristic 1:75 | 0.951 (n 300) | 0.838 (n 300) | 0.939 (n 300) | 0.916 (n 300) |
| model-fixed-h1 | 0.909 (n 300) | 0.824 (n 300) | 0.901 (n 300) | 0.886 (n 300) |

## Contrastes (unilaterales, pareados por mundo, Holm sobre los cinco)

| | Afirma | n | Diferencia [IC 95 %] | p | p Holm | |
|---|---|---|---|---|---|---|
| H1a | changing families: learned caution survives more than current | 300 | 0.056 [0.024, 0.089] | 0.0003 | 0.0014 | ✓ |
| H1b | changing families: and more than the heuristic | 300 | -0.030 [-0.050, -0.012] | 0.9992 | 1.0000 | ✗ |
| H2a | composition (reserved): more than current | 300 | 0.074 [0.039, 0.112] | 0.0001 | 0.0005 | ✓ |
| H2b | composition (reserved): more than the heuristic | 300 | -0.030 [-0.052, -0.011] | 0.9978 | 1.0000 | ✗ |
| H4 | changing families: more than its own horizon-1 ablation | 300 | -0.004 [-0.018, 0.011] | 0.7035 | 1.0000 | ✗ |

C3, no inferioridad en stable (margen 0.03): diferencia 0.070, cota inferior unilateral 95 % 0.039 → ✓.
C5, coste: 1.029 veces el tiempo de current por segundo simulado (límite 1.5) → ✓; modelo de a lo sumo 1340 bytes.

## Criterios

1. Mejora ≥ 0.05 y significativa frente a current y a la heurística en las familias cambiantes: ✗
2. Ventaja en la composición reservada frente a ambos: ✗
3. No inferior en stable: ✓
4. Supera su ablación de horizonte 1: ✗
5. Coste dentro del límite: ✓

**Resultado según la tabla del plan: as good as a simpler alternative: prefer the simple one.**

