# H2 (Fase 3): resultados (2026-10-02)

Protocolo congelado: `bateria-h2-protocolo.md` (1bccb8b). Código `f8aed4b`. 4 condiciones × 40 vidas de 3600 s, pareadas por semilla. Todas sobreviven.

## Respuesta

**H2 no se sostiene.** `freeflow+central` frente a `program`: **2 victorias, 2 derrotas** (no más victorias que derrotas). Frente a `freeflow`: 1 victoria, 0 derrotas.

| | victorias | derrotas |
|---|---|---|
| `freeflow+central − program` | R3 (atiende ∝ necesidad, +0,09), R11–12 (compromiso) | R7a (+0,38 cambios/min), R7b (titubeo +0,03) |
| `freeflow+central − freeflow` | R7a (−2,8 cambios/min) | — |
| `freeflow − program` | R3, R8 (responde antes al frío o calor), R11–12 | R7a (+3,2 cambios/min), R7b |
| `program+learn − program` | R3, R11–12 | R1 (más tiempo crítico sin atender), R7a, R7b |

## Lectura

- **El free-flow hace lo que Tyrrell decía:** la conducta sigue más a la necesidad (R3 de 0,03 a 0,12), responde antes al frío o calor y combina algo más las necesidades. **Y falla donde Tyrrell dejó "?"**: persistencia y contigüidad. El free-flow puro cambia de acción un 34 % más.
- **El selector central arregla buena parte de eso:** vuelve a ~9,6 cambios por minuto, casi como el programa (9,2). Pero no llega a superarlo, y titubea algo más.
- **El programa jerárquico es difícil de batir en contigüidad**, como encontró Bryson (2000): una jerarquía con secuencias es tan buena o mejor y mucho más simple. Es el resultado nulo que el plan preregistró como publicable.
- **Aprender el programa (`PROGRAM.learn`) es lo peor en contigüidad** y deja más tiempo crítico sin atender. El selector no hereda ese coste: cuesta 25 µs por paso frente a 36,5.
- **No hay ganancia en supervivencia** en este mundo: todas viven la hora en las cuatro condiciones.

## Para seguir

- Lo que el selector central añade (R3, compromiso) sin perder contigüidad podría mejorar con histéresis más fuerte (`SELECT.hold`) o con un tiempo mínimo por acto. Habría que calibrarlo en desarrollo y congelar un protocolo nuevo.
- Las piezas c y e de la Fase 1 pueden apoyarse en el selector, que es más barato que `PROGRAM.learn`.

## Tablas

| medida | program | program+learn | freeflow | freeflow+central |
|---|---|---|---|---|
| R1 sin atender | 0.141 | 0.199 | 0.141 | 0.160 |
| R3 r(hambre,sed) | 0.030 | 0.053 | 0.120 | 0.116 |
| R4–5 come al alcance | 0.942 | 0.963 | 0.850 | 0.893 |
| R7a cambios/min | 9.234 | 10.665 | 12.390 | 9.616 |
| R7b titubeo | 0.164 | 0.219 | 0.181 | 0.192 |
| R8 latencia | 2.676 | 2.603 | 2.065 | 2.402 |
| R9 oportunismo | 0.104 | 0.138 | 0.161 | 0.141 |
| R11–12 compromiso | 0.001 | 0.002 | 0.001 | 0.002 |
| R2 persistencia (s) | 5.86 | 6.15 | 7.95 | 7.11 |
| vivas | 1.000 | 1.000 | 1.000 | 1.000 |

freeflow+central − program: 2 victorias, 2 derrotas
  R1 sin atender: 0.019 [-0.015, 0.055] —
  R3 r(hambre,sed): 0.086 [0.066, 0.108] victoria
  R4–5 come al alcance: -0.048 [-0.121, 0.025] —
  R7a cambios/min: 0.383 [0.119, 0.657] derrota
  R7b titubeo: 0.028 [0.013, 0.044] derrota
  R8 latencia: -0.274 [-1.022, 0.374] —
  R9 oportunismo: 0.038 [-0.035, 0.103] —
  R11–12 compromiso: 0.001 [0.000, 0.001] victoria

freeflow+central − freeflow: 1 victorias, 0 derrotas
  R1 sin atender: 0.019 [-0.015, 0.054] —
  R3 r(hambre,sed): -0.004 [-0.024, 0.017] —
  R4–5 come al alcance: 0.043 [-0.059, 0.145] —
  R7a cambios/min: -2.774 [-3.387, -2.170] victoria
  R7b titubeo: 0.011 [-0.008, 0.031] —
  R8 latencia: 0.337 [-0.082, 0.819] —
  R9 oportunismo: -0.019 [-0.095, 0.054] —
  R11–12 compromiso: 0.000 [-0.000, 0.001] —

freeflow − program: 3 victorias, 2 derrotas
  R1 sin atender: -0.000 [-0.032, 0.031] —
  R3 r(hambre,sed): 0.090 [0.069, 0.110] victoria
  R4–5 come al alcance: -0.092 [-0.204, 0.021] —
  R7a cambios/min: 3.157 [2.626, 3.742] derrota
  R7b titubeo: 0.017 [0.003, 0.034] derrota
  R8 latencia: -0.611 [-1.297, -0.019] victoria
  R9 oportunismo: 0.057 [-0.013, 0.126] —
  R11–12 compromiso: 0.000 [0.000, 0.001] victoria

program+learn − program: 2 victorias, 3 derrotas
  R1 sin atender: 0.058 [0.022, 0.096] derrota
  R3 r(hambre,sed): 0.022 [0.009, 0.035] victoria
  R4–5 come al alcance: 0.021 [-0.035, 0.090] —
  R7a cambios/min: 1.432 [1.047, 1.834] derrota
  R7b titubeo: 0.056 [0.042, 0.071] derrota
  R8 latencia: -0.073 [-0.838, 0.550] —
  R9 oportunismo: 0.034 [-0.045, 0.109] —
  R11–12 compromiso: 0.000 [0.000, 0.001] victoria
