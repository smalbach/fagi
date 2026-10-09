# H2c (Fase 3): resultados (2026-10-03)

Protocolo congelado: `bateria-h2c-protocolo.md` (e2cf6c1). Código `6b7e5aa`. 3 condiciones × 40 vidas de 3600 s, mapa 42, semillas 5300–5339, pareadas.

## Respuesta

**H2c no se sostiene.** `central+consume+veto − program` da 2 victorias y 4 derrotas.
- Victorias: R3 (+0,10) y R11–12.
- Derrotas: R1, R7a, R7b y R8.

**H2c-veto (el mecanismo) se sostiene.** Frente a `central+consume`, el veto baja el tiempo crítico sin atender de 0,35 a 0,18, con IC [−0,24, −0,11].
- **Evita las muertes por frío:** sin veto mueren 3 de 40 (semillas 5322, 5328 y 5339); con veto, ninguna, igual que con el programa.
- **Coste:** sigue menos a la necesidad (R3 −0,09), combina menos necesidades y cambia algo más de acción (+1 por minuto). Mientras manda una necesidad crítica, las demás no suman votos, y eso le quita al free-flow justo lo que lo distinguía.

**Predicción declarada:**
- **Acertó** en R3, R11–12, R7a y R7b, y en que el veto gana R1.
- **Falló** en R9, que no salió victoria. R1 y R8 quedaron en derrota, frente a lo "incierto" declarado.

**R1 sigue peor que el programa** (0,18 frente a 0,135). El veto actúa cada 0,5 s y solo si alguna línea de esa necesidad responde. El programa, en cambio, tiene el orden fijo en cada paso.

## Lectura

- **El veto arregla la emergencia, no la continuidad.** Es lo esperado: un reflejo más en el tramo de supervivencia.
- **La continuidad no se arregla con parámetros (calibración, H2b) ni con el veto (H2c).** El selector cambia de acción entre un 35 y un 46 % más que el programa en las tres baterías, con semillas distintas cada vez. Es la brecha de Tyrrell ("?" en persistencia y secuencias) y el resultado de Bryson (2000), ahora replicado tres veces.
- **Siguiente candidato estructural: secuencias.** Un acto comprometido (ir a la fruta y comerla, ir al agua y beber) que no se vuelve a votar hasta terminar o fracasar. Sin probar.
- **Recomendación:** el juego sigue con `SELECT.mode = 'program'`. El veto queda disponible (`SELECT.veto`) para cualquier uso futuro del selector.

## Tablas

```
| medida | program | central+consume | central+consume+veto |
|---|---|---|---|
| R1 sin atender | 0.135 | 0.354 | 0.183 |
| R3 r(hambre,sed) | 0.038 | 0.223 | 0.138 |
| R4–5 come al alcance | 0.985 | 0.967 | 0.979 |
| R7a cambios/min | 9.196 | 12.417 | 13.457 |
| R7b titubeo (sin bocados de paso) | 0.076 | 0.175 | 0.187 |
| R8 latencia | 2.502 | 4.995 | 4.763 |
| R9 oportunismo | 0.151 | 0.209 | 0.181 |
| R11–12 compromiso | 0.001 | 0.008 | 0.003 |
| R7b titubeo antiguo | 0.164 | 0.229 | 0.240 |
| R2 persistencia (s) | 5.95 | 8.16 | 7.75 |
| vivas | 1.000 | 0.925 | 1.000 |

central+consume+veto − program: 2 victorias, 4 derrotas
  R1 sin atender: 0.0473 [0.0201, 0.0752] derrota
  R3 r(hambre,sed): 0.0999 [0.0819, 0.1157] victoria
  R4–5 come al alcance: -0.0063 [-0.0458, 0.0271] —
  R7a cambios/min: 4.2618 [3.5788, 4.9337] derrota
  R7b titubeo (sin bocados de paso): 0.1115 [0.0927, 0.1310] derrota
  R8 latencia: 2.2610 [1.2370, 3.2017] derrota
  R9 oportunismo: 0.0297 [-0.0385, 0.0972] —
  R11–12 compromiso: 0.0022 [0.0017, 0.0027] victoria

central+consume+veto − central+consume: 1 victorias, 3 derrotas
  R1 sin atender: -0.1710 [-0.2367, -0.1092] victoria
  R3 r(hambre,sed): -0.0850 [-0.1061, -0.0644] derrota
  R4–5 come al alcance: 0.0125 [-0.0375, 0.0625] —
  R7a cambios/min: 1.0405 [0.0443, 2.0075] derrota
  R7b titubeo (sin bocados de paso): 0.0123 [-0.0185, 0.0416] —
  R8 latencia: -0.2330 [-2.0008, 1.1117] —
  R9 oportunismo: -0.0277 [-0.0866, 0.0301] —
  R11–12 compromiso: -0.0047 [-0.0056, -0.0038] derrota

central+consume − program: 2 victorias, 4 derrotas
  R1 sin atender: 0.2183 [0.1595, 0.2817] derrota
  R3 r(hambre,sed): 0.1848 [0.1627, 0.2059] victoria
  R4–5 come al alcance: -0.0187 [-0.0646, 0.0229] —
  R7a cambios/min: 3.2212 [2.4895, 3.9813] derrota
  R7b titubeo (sin bocados de paso): 0.0992 [0.0740, 0.1251] derrota
  R8 latencia: 2.4940 [1.0520, 4.3220] derrota
  R9 oportunismo: 0.0575 [-0.0300, 0.1354] —
  R11–12 compromiso: 0.0069 [0.0059, 0.0080] victoria
```
