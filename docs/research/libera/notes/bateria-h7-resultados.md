# H7: resultados (2026-10-02)

Protocolo congelado: `bateria-h7-protocolo.md` (0621a22). 2 condiciones × 60 vidas (semillas 181–240), 16 especies, 4 ruidosas.

## Respuesta

**H7 no se sostiene.** Fracción de pruebas en fruta ruidosa, `lp − agenda`: −0,016 [−0,050; 0,018]. Las dos condiciones gastan en ruido lo que le toca por azar: 0,235 y 0,219, frente al 0,25 de especies ruidosas. El juicio sobre el resto no empeora (+0,041 [−0,005; 0,086]) y la supervivencia es igual.

## Por qué

1. **La trampa de ruido no existe en este diseño.** La agenda solo pregunta por fruta **nunca probada** (`agendaFrom` descarta las ya probadas). Una fruta ruidosa se prueba una vez y deja de ser pregunta, así que no hay dónde atascarse. En Oudeyer la trampa aparece cuando se puede volver a muestrear la misma región sin fin.
2. **La marca de ruido no llega a activarse.** Pide `SCIENCE.window` = 6 errores por rasgo sin progreso, y una vida hace ~9 pruebas repartidas entre muchos rasgos.

Para que H7 tenga sentido, la noche tendría que poder **volver a preguntar** por fruta ya probada cuya creencia sigue incierta (preguntas de tipo `check` sobre la propia fruta, no solo sobre las no probadas). Ahí la curiosidad por incertidumbre insistiría en lo ruidoso y la de progreso lo dejaría. Es un cambio de diseño con protocolo nuevo.

## Tabla

| condición | pruebas en ruido | pruebas | juicio | área | llega a 0,8 en (s) | creencias falsas | dosis | buenas encontradas | vivas |
|---|---|---|---|---|---|---|---|---|---|
| agenda | 0.235 | 8.733 | 0.716 | 0.646 | 1893.333 | 4.017 | 1.567 | 0.558 | 0.783 |
| lp | 0.219 | 9.417 | 0.757 | 0.656 | 1860.000 | 3.800 | 1.459 | 0.598 | 0.783 |

lp − agenda (pareado, n=60):
  noiseShare: -0.016 [-0.050, 0.018]
  tries: 0.683 [-0.433, 1.883]
  judgment: 0.041 [-0.005, 0.086]
  auc: 0.010 [-0.021, 0.042]
  reached: -33.333 [-300.000, 233.333]
  falseB: -0.217 [-0.833, 0.433]
  dose: -0.107 [-0.426, 0.202]
  helpful: 0.039 [-0.027, 0.108]
  alive: 0.000 [-0.117, 0.133]

veredictos lp: confirmados 3.6, refutados 2.7 por vida; experimentos 8.6 (agenda 7.7)
vidas en que lp difiere de agenda: 55/60
