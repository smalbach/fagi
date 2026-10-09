# H3c: resultados (2026-10-02)

Protocolo congelado: `bateria-h3c-protocolo.md` (85859f8). 16 especies, 2 preguntas por noche, 3 condiciones × 60 vidas (semillas 121–180).

## Respuesta

**H3, medida principal: no se sostiene.** `lp − agenda`:
- área bajo la curva de juicio +0,015 [−0,009; 0,040];
- tiempo hasta juicio 0,8: −47 s [−277; 190];
- creencias falsas +0,17 [−0,40; 0,75].

Con escasez de preguntas la noche científica cambia la conducta en 54 de 60 vidas, pero no aprende más rápido.

**Secundarias (descriptivas):**
- **sobrevive más: 95 % frente a 85 % (+10 % [3; 18])**, con algo menos de veneno (−0,09, no significativo);
- confía menos en veneno (0,33 frente a 0,53) y evita algo más de fruta buena (4,18 frente a 3,82): la seguridad en la prioridad la hace más prudente;
- sus predicciones aciertan más (39 % refutadas frente a 59 % en H3b): pregunta más por fruta que espera buena y segura, y suele acertar;
- hace algo más de experimentos (9,8 frente a 8,7).

**La agenda sigue siendo lo que más vale** (`agenda − none`): juicio +0,11 [0,07; 0,16], −550 s hasta el juicio correcto, −0,9 creencias falsas [−1,6; −0,2] y +25 % de especies buenas encontradas.

## Lectura

- Priorizar por progreso × seguridad cambia **qué** aprende (lo seguro primero) más que **cuánto**. El beneficio aparece como supervivencia, no como velocidad de aprendizaje.
- Es la forma de curiosidad que se esperaría en un animal que puede morir por probar: preferir aprender lo seguro.
- H7 (curiosidad por progreso frente a incertidumbre, en un mundo con fruta ruidosa) sigue pendiente: necesita frutas cuyo efecto varía al azar.

## Tabla

| condición | juicio | área | llega a 0,8 en (s) | creencias falsas | dosis | buenas encontradas | vivas |
|---|---|---|---|---|---|---|---|
| none | 0.660 | 0.558 | 2460.000 | 5.250 | 1.297 | 0.372 | 0.800 |
| agenda | 0.774 | 0.676 | 1910.000 | 4.350 | 1.287 | 0.622 | 0.850 |
| lp | 0.772 | 0.691 | 1863.333 | 4.517 | 1.200 | 0.640 | 0.950 |

lp − agenda (pareado, n=60):
  judgment: -0.002 [-0.033, 0.028]
  auc: 0.015 [-0.009, 0.040]
  reached: -46.667 [-276.667, 190.000]
  falseB: 0.167 [-0.400, 0.750]
  dose: -0.087 [-0.338, 0.163]
  helpful: 0.018 [-0.037, 0.076]
  alive: 0.100 [0.033, 0.183]

agenda − none (pareado, n=60):
  judgment: 0.114 [0.072, 0.156]
  auc: 0.118 [0.088, 0.147]
  reached: -550.000 [-743.333, -370.000]
  falseB: -0.900 [-1.567, -0.217]
  dose: -0.010 [-0.264, 0.254]
  helpful: 0.250 [0.174, 0.322]
  alive: 0.050 [-0.050, 0.150]

veredictos lp: confirmados 4.2, refutados 2.6 por vida; experimentos 9.8 (agenda 8.7)
vidas en que lp difiere de agenda: 54/60
