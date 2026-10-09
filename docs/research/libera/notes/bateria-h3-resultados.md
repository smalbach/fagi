# H3: resultados (2026-10-02)

Protocolo congelado: `bateria-h3-protocolo.md` (b961cef). Código `8337c7b`. 4 condiciones × 60 vidas de 2400 s.

## Respuesta

**H3 no se sostiene: el efecto es exactamente cero.** Las 60 vidas de `lp` son idénticas, una a una, a las de `agenda` (y `asked` también, como debía).

**Por qué.** La decisión de probar (`src/decision/experiment.js`) elige **la fruta de la agenda más cercana a la vista**: el orden de la agenda nunca se usa. Además la agenda cabe entera (≤ 6 preguntas), así que ordenar tampoco cambia qué entra. Es un fallo de diseño del mecanismo, no de la idea: la prioridad debe llegar a la decisión.

## Lo que sí muestra

- **La agenda vale mucho** (`agenda − none`):
  - llega a un juicio de 0,8 unos 783 s antes [−1063; −483];
  - área bajo la curva de juicio +0,14 [0,10; 0,18];
  - encuentra el 25 % más de especies buenas;
  - toma 0,43 frutas menos de veneno;
  - sobrevive un 28 % más (83 % frente a 55 %);
  - no tiene más creencias falsas (−0,07 [−0,43; 0,30]).
- **Las predicciones antes de probar fallan más de lo que aciertan:** 3,0 refutadas frente a 2,3 confirmadas por vida (57 % refutadas). Lo que sus rasgos le dicen de una fruta desconocida es casi azar, justo porque la pregunta se hace donde está insegura. Es el material que la Fase 1 quería sacar a la luz: ahora cada experimento sabe si corrigió una expectativa.

## Siguiente: H3b

Que la decisión use el valor de cada pregunta (progreso × seguridad, con la distancia como coste) en vez de solo la cercanía. Protocolo nuevo, congelado antes de correr.

## Tabla

| condición | juicio | área | llega a 0,8 en (s) | creencias falsas | dosis | buenas encontradas | vivas |
|---|---|---|---|---|---|---|---|
| none | 0.706 | 0.582 | 2166.667 | 1.883 | 1.273 | 0.557 | 0.550 |
| agenda | 0.740 | 0.723 | 1383.333 | 1.817 | 0.842 | 0.810 | 0.833 |
| asked | 0.740 | 0.723 | 1383.333 | 1.817 | 0.842 | 0.810 | 0.833 |
| lp | 0.740 | 0.723 | 1383.333 | 1.817 | 0.842 | 0.810 | 0.833 |

asked idéntica a agenda: true

lp − agenda (pareado, n=60):
  judgment: 0.000 [0.000, 0.000]
  auc: 0.000 [0.000, 0.000]
  reached: 0.000 [0.000, 0.000]
  falseB: 0.000 [0.000, 0.000]
  dose: 0.000 [0.000, 0.000]
  helpful: 0.000 [0.000, 0.000]
  alive: 0.000 [0.000, 0.000]

agenda − none (pareado, n=60):
  judgment: 0.034 [-0.021, 0.091]
  auc: 0.142 [0.102, 0.182]
  reached: -783.333 [-1063.333, -483.333]
  falseB: -0.067 [-0.433, 0.300]
  dose: -0.431 [-0.647, -0.225]
  helpful: 0.253 [0.153, 0.349]
  alive: 0.283 [0.117, 0.450]

veredictos lp: confirmados 2.3, refutados 3.0 por vida; experimentos 5.2 (agenda 5.2)
vidas en que lp difiere de agenda: 0/60
