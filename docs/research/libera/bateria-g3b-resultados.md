# Batería G3b: resultados (2026-10-02)

Protocolo congelado antes de correr: `bateria-g3b-protocolo.md` (6d4f3b1). Código: `a0b5558`. Datos: `bateria-g3b-2026-10-02.jsonl`. Análisis: `bateria-g3b-analisis.mjs`.

## Respuestas

1. **El cuerpo se quedó como nació.** De 18 comparaciones contra el control de deriva, 16 dan "se mantuvo". Las 2 que dan "cambió" son las esperables por azar:
   - cerebro en Darwin `unpred`: −0,107 frente a un límite de −0,097;
   - ojos en epigenético `pred`.

   **El músculo no cambió**, ni en el gen ni en lo cargado. La divergencia vista en la calibración (1,09 frente a 0,96, una sola semilla) era ruido.
2. **La experiencia del músculo no pasó el umbral** (predicho en el protocolo). |cargado − gen| fue de 0,003 a 0,011, igual que en el control. Las Fagis caminan la misma fracción del tiempo en años lejanos y cercanos: el viaje es más largo, pero no más frecuente. Que el músculo no cambie es lo que pidió el usuario: **sin experiencia suficiente, no hay cambio**.
3. **Las antenas sí se movieron en vida** (|cargado − gen| de 0,14 a 0,18, frente a 0,05–0,09 en el control). Pero no siguen el tipo de año (correlaciones de −0,16 a +0,21, todas cruzan 0) y su gen no cambió.
4. **Los modos de herencia no se separan.** Ninguna diferencia pareada excluye el 0.
   - Baldwin tiende a más crías (+43 a +52) y más muertes; el epigenético, a menos crías (−32 a −43).
   - **de Bruin no se confirma.** Si acaso, al revés: −11 [−36; 14], con pred > unpred en solo 2 de 10 semillas.
   - El gen de plasticidad de Baldwin no sube (0,98–1,03).
5. **La presión fue dura pero no selectiva.** Alternar años lejanos y cercanos baja la población mínima de ~21 a ~7 y duplica las muertes por frío: con poca fruta, el invierno mata más. Esa mortalidad no cae distinto según los órganos, así que no selecciona ningún rasgo.

## Extinciones

10 de 90 corridas.
- **Semilla 3 (Darwin y epigenético):** la fundación falla, con 0 crías, en los tres ambientes, incluido el control. Las fundadoras Baldwin de esa semilla son otras (su gen de plasticidad consume números al azar) y sobreviven.
- **Las demás** (semillas 2 y 8, Darwin y epigenético) son colapsos reales en años 3–8. Baldwin no tuvo ninguna; con n = 10 no se interpreta.

## Lectura

- En este mundo, la única experiencia que se aparta lo bastante de lo típico es el olfato. Las demás quedan dentro del margen, así que **el cuerpo no cambia y la herencia de lo vivido no tiene qué transmitir**.
- Es coherente con la idea del usuario y con la "paradoja de la estasis" en biología: la mayoría de los rasgos se mantienen pese a la selección fluctuante.
- Para que G3 discrimine entre modos haría falta una experiencia que de verdad cambie con el ambiente, por ejemplo el músculo respondiendo a la **distancia** recorrida y no al tiempo caminando. Eso es una decisión de diseño, no una corrección de estos datos.

## Tablas

## 0. Resumen por condición (media de 10 semillas)

| modo | ambiente | extintas | pobl. mínima | crías | muertes no por edad | frío | hambre | músculo gen | antenas gen | plasticidad |
|---|---|---|---|---|---|---|---|---|---|---|
| darwin | pred | 2/10 | 7.3 | 338.3 | 282.5 | 270.4 | 1.4 | 0.953 | 0.961 | 1.000 |
| baldwin | pred | 0/10 | 7.4 | 390.5 | 326.2 | 312.4 | 1.5 | 1.045 | 0.970 | 1.028 |
| epi | pred | 3/10 | 6.3 | 295.0 | 241.0 | 229.4 | 1.8 | 0.984 | 0.951 | 1.000 |
| darwin | unpred | 1/10 | 7.2 | 356.9 | 297.1 | 284.7 | 1.2 | 0.964 | 0.971 | 1.000 |
| baldwin | unpred | 0/10 | 8.3 | 400.0 | 332.1 | 318.7 | 0.7 | 0.992 | 1.023 | 0.982 |
| epi | unpred | 2/10 | 6.9 | 324.7 | 267.6 | 257.1 | 1.4 | 0.982 | 1.006 | 1.000 |
| darwin | none | 1/10 | 21.3 | 349.6 | 162.1 | 152.9 | 0.3 | 0.978 | 1.011 | 1.000 |
| baldwin | none | 0/10 | 21.5 | 395.8 | 192.3 | 184.1 | 0.3 | 1.038 | 1.007 | 1.021 |
| epi | none | 1/10 | 20.4 | 350.2 | 158.6 | 151.9 | 0.4 | 0.988 | 0.993 | 1.000 |

## 1. Supervivencia y cría frente a darwin, pareado por semilla (modo − darwin)

- baldwin pred: crías 52.2 [-58.3, 162.7] (a favor 3/10); pobl. mínima 0.1 [-3.1, 3.3]; muertes evitadas -43.7 [-133.7, 46.3]
- epi pred: crías -43.3 [-132.1, 45.5] (a favor 1/10); pobl. mínima -1.0 [-3.1, 1.1]; muertes evitadas 41.5 [-33.5, 116.5]
- baldwin unpred: crías 43.1 [-53.8, 140.0] (a favor 6/10); pobl. mínima 1.1 [-1.5, 3.7]; muertes evitadas -35.0 [-127.2, 57.2]
- epi unpred: crías -32.2 [-108.5, 44.1] (a favor 4/10); pobl. mínima -0.3 [-2.6, 2.0]; muertes evitadas 29.5 [-36.8, 95.8]
- **de Bruin** (ventaja epi en crías, pred − unpred): -11.1 [-36.2, 14.0]; semillas con pred > unpred: 2/10

## 2. Seguimiento (correlación Δcargado con año lejano +1 / cercano −1)

- muscle darwin pred: 0.17 [-0.09, 0.44] (n=8)
- muscle baldwin pred: -0.10 [-0.43, 0.24] (n=10)
- muscle epi pred: -0.04 [-0.30, 0.21] (n=7)
- muscle darwin unpred: 0.03 [-0.30, 0.35] (n=9)
- muscle baldwin unpred: -0.01 [-0.24, 0.22] (n=10)
- muscle epi unpred: 0.04 [-0.36, 0.43] (n=8)
- antennae darwin pred: -0.04 [-0.22, 0.15] (n=8)
- antennae baldwin pred: -0.06 [-0.25, 0.13] (n=10)
- antennae epi pred: -0.14 [-0.44, 0.17] (n=7)
- antennae darwin unpred: -0.09 [-0.30, 0.12] (n=9)
- antennae baldwin unpred: 0.21 [-0.02, 0.45] (n=10)
- antennae epi unpred: -0.16 [-0.41, 0.08] (n=8)

## 3. ¿Pasó la experiencia el umbral? media |cargado − gen| por año

- muscle: darwin/pred 0.004, baldwin/pred 0.003, epi/pred 0.011, darwin/unpred 0.004, baldwin/unpred 0.003, epi/unpred 0.008, darwin/none 0.006, baldwin/none 0.005, epi/none 0.012
- antennae: darwin/pred 0.145, baldwin/pred 0.135, epi/pred 0.166, darwin/unpred 0.144, baldwin/unpred 0.136, epi/unpred 0.177, darwin/none 0.067, baldwin/none 0.048, epi/none 0.086
- gut: darwin/pred 0.017, baldwin/pred 0.018, epi/pred 0.028, darwin/unpred 0.018, baldwin/unpred 0.018, epi/unpred 0.032, darwin/none 0.013, baldwin/none 0.016, epi/none 0.040
- brain: darwin/pred 0.003, baldwin/pred 0.002, epi/pred 0.009, darwin/unpred 0.003, baldwin/unpred 0.002, epi/unpred 0.007, darwin/none 0.005, baldwin/none 0.004, epi/none 0.010
- eyes: darwin/pred 0.002, baldwin/pred 0.002, epi/pred 0.007, darwin/unpred 0.002, baldwin/unpred 0.002, epi/unpred 0.005, darwin/none 0.004, baldwin/none 0.003, epi/none 0.007

## 4. Baldwin: gen de plasticidad final

- pred: 1.028 (rango 0.913–1.146)
- unpred: 0.982 (rango 0.789–1.358)
- none: 1.021 (rango 0.806–1.172)

## 5. Cambio frente a estasis (Δ gen desde fin del año 1, contra el rango de `none` del mismo modo)

| modo | ambiente | brain | gut | muscle | eyes | antennae | size |
|---|---|---|---|---|---|---|---|
| darwin | rango none | -0.097…-0.022 | -0.062…0.027 | -0.075…0.075 | -0.066…0.033 | -0.065…0.105 | -0.087…0.051 |
| darwin | pred | -0.056 se mantuvo | -0.004 se mantuvo | -0.031 se mantuvo | 0.014 se mantuvo | -0.015 se mantuvo | 0.018 se mantuvo |
| darwin | unpred | -0.107 **cambió** | -0.042 se mantuvo | -0.028 se mantuvo | -0.000 se mantuvo | -0.014 se mantuvo | -0.015 se mantuvo |
| baldwin | rango none | -0.133…-0.030 | -0.065…0.108 | -0.059…0.099 | -0.051…0.098 | -0.055…0.074 | -0.116…0.051 |
| baldwin | pred | -0.043 se mantuvo | 0.026 se mantuvo | 0.024 se mantuvo | 0.031 se mantuvo | -0.020 se mantuvo | -0.024 se mantuvo |
| baldwin | unpred | -0.080 se mantuvo | -0.005 se mantuvo | -0.029 se mantuvo | -0.008 se mantuvo | 0.033 se mantuvo | -0.014 se mantuvo |
| epi | rango none | -0.101…-0.016 | -0.073…0.113 | -0.077…0.098 | -0.026…0.073 | -0.046…0.056 | -0.043…0.006 |
| epi | pred | -0.074 se mantuvo | 0.006 se mantuvo | 0.006 se mantuvo | -0.049 **cambió** | -0.037 se mantuvo | -0.009 se mantuvo |
| epi | unpred | -0.047 se mantuvo | -0.040 se mantuvo | -0.001 se mantuvo | -0.001 se mantuvo | 0.010 se mantuvo | -0.014 se mantuvo |
