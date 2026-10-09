# H3b: resultados (2026-10-02)

Protocolo congelado: `bateria-h3b-protocolo.md` (d8324c4). Código `5ccaff2`. 2 condiciones × 60 vidas (semillas 61–120).

## Respuesta

**H3 no se sostiene tampoco con la prioridad en la decisión.** `lp − agenda`:
- área bajo la curva de juicio +0,001 [−0,011; 0,012];
- tiempo hasta juicio 0,8: −7 s [−17; 0];
- creencias falsas −0,05 [−0,18; 0,08];
- dosis igual; supervivencia +1,7 % [−3; 8].

Ahora la decisión sí usa el valor de cada pregunta, pero solo cambia algo en 7 de 60 vidas.

## Por qué

- **No hay qué priorizar.** Con 6 especies la agenda cubre todas las frutas sin probar, y casi nunca hay dos preguntas a la vista a la vez. Las dos condiciones hacen los mismos ~5 experimentos por vida y prueban lo mismo; solo cambia el orden, y rara vez.
- **El progreso de aprendizaje (Oudeyer) sirve cuando sobran preguntas** frente a la capacidad de responderlas: muchas especies, experimentos limitados o regiones de ruido que atrapan. Este mundo no tiene esa escasez.
- **Las predicciones siguen fallando más de lo que aciertan** (59 % refutadas). Saber de antemano qué se espera no le da ventaja si igual lo prueba todo.

## Qué queda de la Fase 1

- **Sirve como instrumento:** cada experimento deja un veredicto con su procedencia (`fagi.verdicts`, `report.verdicts`). Es la base de las piezas c (experimentos con líneas del programa) y e (puerta con verificación vivida).
- **H3 y H7 necesitan un mundo con escasez de preguntas:** más especies (p. ej. 20), un tope de experimentos por día, o especies ruidosas (la misma fruta a veces buena, a veces mala) para H7. Se haría con un protocolo nuevo.
- **La agenda por sí misma sigue siendo lo que más vale** (H3: −783 s hasta el juicio correcto, +28 % de supervivencia frente a sin experimentos).

## Tabla

| condición | juicio | área | llega a 0,8 en (s) | creencias falsas | dosis | buenas encontradas | vivas |
|---|---|---|---|---|---|---|---|
| agenda | 0.742 | 0.720 | 1336.667 | 1.700 | 1.026 | 0.796 | 0.767 |
| lp | 0.749 | 0.721 | 1330.000 | 1.650 | 1.026 | 0.789 | 0.783 |

lp − agenda (pareado, n=60):
  judgment: 0.008 [-0.015, 0.033]
  auc: 0.001 [-0.011, 0.012]
  reached: -6.667 [-16.667, 0.000]
  falseB: -0.050 [-0.183, 0.083]
  dose: 0.000 [-0.052, 0.049]
  helpful: -0.007 [-0.033, 0.013]
  alive: 0.017 [-0.033, 0.083]

veredictos lp: confirmados 2.0, refutados 2.9 por vida; experimentos 5.0 (agenda 4.9)
vidas en que lp difiere de agenda: 7/60
