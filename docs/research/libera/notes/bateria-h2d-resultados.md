# H2d (Fase 3): resultados (2026-10-03)

Protocolo congelado: `bateria-h2d-protocolo.md` (fc9cc1a). Código `19b0ebc`. 3 condiciones × 40 vidas de 3600 s, mapa 42, semillas 5400–5439, pareadas. Todas viven.

## Respuesta

**H2d no se sostiene, por poco.** `selector − program` da 3 victorias y 3 derrotas (con solo las 8 medidas de H2: 2 y 3).
- **Victorias:** R3 (+0,10), R7c (−0,95 cambios de meta por minuto, un 12 % menos) y R11–12.
- **Derrotas:** R1 (+0,04), R7b (titubeo de acción +0,04) y R8 (+2,3 s ante frío o calor).
- **R7a queda empatado:** 9,30 frente a 9,39 cambios de acción por minuto. En H2, H2b y H2c era una derrota de 2,7 a 4,3 por minuto. **Gran parte de la "brecha de contigüidad" era el error del bono**, que premiaba seguir el rastro como si fuera comer.

**H2d-seq se sostiene, al revés de lo que predije.** `selector+seq − selector` da 3 victorias y 0 derrotas: menos cambios de acción (−0,49 por minuto), menos cambios de meta (−0,34) y más compromiso. R8 empeora 1,6 s, pero su IC toca 0.

**Exploratorio, no preregistrado:** `selector+seq − program` da 4 victorias y 3 derrotas.
- Victorias: R3, R7a, R7c y R11–12.
- Derrotas: R1, R7b y R8.

**Predicción declarada:**
- **Acertó** en las victorias (R3 y R7c) y en las derrotas (R7b y R8).
- **Falló** en las secuencias: en desarrollo (16 vidas, mapa 7) no ayudaban; aquí sí.

## Lectura

- **Con el error corregido, el selector ya iguala al programa en continuidad de acción y lo supera en continuidad de meta.** Cambia de objetivo un 12 % menos, un 17 % con secuencias. El "?" de Tyrrell en contigüidad lo explicaba un error de implementación, no el free-flow en sí.
- **Lo que le queda en contra:**
  - **R8:** responde 2 a 4 s más tarde al frío o calor. El programa tiene líneas térmicas anticipatorias arriba de todo; en el selector compiten por voto con un nivel térmico bajo hasta que la necesidad es crítica.
  - **Titubeo de acción** levemente mayor; por meta no hay diferencia.
  - **R1** algo peor: 0,19 frente a 0,15 del tiempo crítico.
- **Siguiente paso natural:** que la amenaza térmica sentida (`thermalFeel`) también pase por el veto, no solo el estrés crítico. Es lo que haría un animal: el frío sentido fuera interrumpe.

## Tablas

```
| medida | program | selector | selector+seq |
|---|---|---|---|
| R1 sin atender | 0.149 | 0.189 | 0.214 |
| R3 r(hambre,sed) | 0.025 | 0.127 | 0.144 |
| R4–5 come al alcance | 0.944 | 0.958 | 0.921 |
| R7a cambios/min | 9.390 | 9.303 | 8.812 |
| R7b titubeo (sin bocados de paso) | 0.079 | 0.116 | 0.136 |
| R7c cambios de meta/min | 7.569 | 6.623 | 6.282 |
| R7d titubeo de meta | 0.109 | 0.120 | 0.125 |
| R8 latencia | 2.340 | 4.672 | 6.302 |
| R9 oportunismo | 0.128 | 0.118 | 0.113 |
| R11–12 compromiso | 0.001 | 0.003 | 0.004 |
| R7b titubeo antiguo | 0.168 | 0.188 | 0.203 |
| R2 persistencia (s) | 6.00 | 7.39 | 7.54 |
| vivas | 1.000 | 1.000 | 1.000 |

selector − program: 3 victorias, 3 derrotas (solo las 8 de H2: 2, 3)
  R1 sin atender: 0.0399 [0.0118, 0.0692] derrota
  R3 r(hambre,sed): 0.1015 [0.0820, 0.1217] victoria
  R4–5 come al alcance: 0.0146 [-0.0563, 0.0917] —
  R7a cambios/min: -0.0873 [-0.3748, 0.2170] —
  R7b titubeo (sin bocados de paso): 0.0369 [0.0200, 0.0556] derrota
  R7c cambios de meta/min: -0.9457 [-1.1490, -0.7563] victoria
  R7d titubeo de meta: 0.0113 [-0.0050, 0.0275] —
  R8 latencia: 2.3320 [1.3077, 3.4717] derrota
  R9 oportunismo: -0.0105 [-0.0667, 0.0448] —
  R11–12 compromiso: 0.0021 [0.0015, 0.0026] victoria

selector+seq − selector: 3 victorias, 0 derrotas (solo las 8 de H2: 2, 0)
  R1 sin atender: 0.0247 [-0.0102, 0.0573] —
  R3 r(hambre,sed): 0.0172 [-0.0025, 0.0358] —
  R4–5 come al alcance: -0.0371 [-0.1012, 0.0250] —
  R7a cambios/min: -0.4913 [-0.8425, -0.1533] victoria
  R7b titubeo (sin bocados de paso): 0.0198 [-0.0039, 0.0422] —
  R7c cambios de meta/min: -0.3407 [-0.5520, -0.1220] victoria
  R7d titubeo de meta: 0.0041 [-0.0152, 0.0245] —
  R8 latencia: 1.6300 [-0.0443, 3.2430] —
  R9 oportunismo: -0.0045 [-0.0646, 0.0525] —
  R11–12 compromiso: 0.0007 [0.0002, 0.0012] victoria

selector+seq − program: 4 victorias, 3 derrotas (solo las 8 de H2: 3, 3)
  R1 sin atender: 0.0646 [0.0316, 0.0978] derrota
  R3 r(hambre,sed): 0.1186 [0.1018, 0.1358] victoria
  R4–5 come al alcance: -0.0225 [-0.0995, 0.0646] —
  R7a cambios/min: -0.5785 [-0.9128, -0.2155] victoria
  R7b titubeo (sin bocados de paso): 0.0566 [0.0365, 0.0773] derrota
  R7c cambios de meta/min: -1.2865 [-1.5125, -1.0630] victoria
  R7d titubeo de meta: 0.0154 [-0.0042, 0.0352] —
  R8 latencia: 3.9620 [3.0558, 5.0493] derrota
  R9 oportunismo: -0.0150 [-0.0829, 0.0517] —
  R11–12 compromiso: 0.0027 [0.0023, 0.0032] victoria
```
