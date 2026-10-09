# Batería G3: resultados (2026-10-02)

Protocolo congelado antes de correr: `bateria-g3-protocolo.md` (a1b4792). Código: `b2a14a3`. Datos: `bateria-g3-2026-10-02.jsonl`. Análisis: `bateria-g3-analisis.mjs`.

## Respuestas

1. **de Bruin 2026: no se confirma.** La herencia epigenética no ayuda más cuando el cambio es predecible: la diferencia es 4,4 [−15,8; 24,6] y solo 5 de 10 semillas tienen pred > unpred. Tampoco ayuda ni daña frente a Darwin en ninguno de los dos ambientes; todos los intervalos cruzan 0.
2. **Baldwin:** el gen de plasticidad sube con estaciones (pred 1,12, unpred 1,10, frente a 1,03 sin estaciones), pero **no** sube más en `unpred` como predecía el análisis 3. No mejora la supervivencia.
3. **El tamaño sigue al año** en los tres modos: correlación de +0,27 a +0,58 entre su cambio anual y el tipo de año. Darwin solo ya sigue bien la presión, por selección año a año. Heredar lo vivido no añade nada medible.
4. **Cambio frente a estasis** (la pregunta del usuario):
   - **Solo el tamaño cambió por selección**, en los 6 casos: bajó entre −0,07 y −0,09, fuera del rango del control.
   - Cerebro, estómago, músculo y ojos **se mantuvieron** frente al control.
   - El cerebro baja también sin estaciones (−0,01 a −0,15 en `none`): es su coste propio, no la presión de las estaciones.
   - Las antenas del epigenético en `unpred` salen apenas fuera del rango (−0,026 frente a −0,024). Con 18 comparaciones contra un rango mínimo-máximo de 10 corridas, se espera algún falso positivo; no se interpreta.
5. **El calor pesa más que el frío** en el tamaño: el gen final queda en ~0,93 aunque la mitad de los años sean fríos.

## Problemas de diseño (se reportan, no se corrigen sobre estos datos)

- **12 extinciones de 60 corridas con estaciones, todas por la fundación.** Ocurren en las semillas que empiezan con año cálido (4, 6, 8): las 4 fundadoras mueren de calor antes de establecer la colonia, lo mismo en los tres modos. Para una batería nueva: empezar siempre con año frío, o más fundadoras.
- **El canal plástico casi no actúa.** La cría vive en el nido entre 23 y 27 °C, a menos de 1–2 °C de lo típico, así que la regla temperatura-tamaño apenas mueve el tamaño. Baldwin y el epigenético tienen poco que heredar: lo vivido casi no se aparta de lo heredado. Que la experiencia no baste para cambiar el cuerpo es realista (el nido protege a la cría), pero hace que G3 no pueda separar los modos.
- La línea base del análisis 4 es el fin del año 1, no el año 0, porque al instante 0 las fundadoras todavía no tienen genes asignados.

## Siguiente batería posible (protocolo nuevo)

Que lo vivido importe de verdad: una plasticidad que el ambiente toque directamente en los adultos (el músculo con las distancias a la fruta, el estómago con la dieta), un año que cambie qué paga, y la fundación siempre en un año benigno.

## Tablas

## 0. Resumen por condición (media de 10 semillas)

| modo | ambiente | extintas | pobl. mínima | muertes calor+frío | calor | frío | edad | hambre | tamaño gen final | plasticidad |
|---|---|---|---|---|---|---|---|---|---|---|
| darwin | pred | 2/10 | 21.5 | 99.2 | 37.2 | 62.0 | 173.2 | 4.0 | 0.931 | 1.000 |
| baldwin | pred | 2/10 | 21.1 | 102.4 | 35.6 | 66.8 | 174.7 | 4.8 | 0.921 | 1.118 |
| epi | pred | 2/10 | 21.5 | 97.5 | 36.7 | 60.8 | 171.6 | 2.4 | 0.927 | 1.000 |
| darwin | unpred | 2/10 | 21.3 | 109.0 | 36.9 | 72.1 | 169.6 | 3.2 | 0.928 | 1.000 |
| baldwin | unpred | 2/10 | 21.0 | 105.8 | 29.1 | 76.7 | 173.2 | 6.0 | 0.920 | 1.099 |
| epi | unpred | 2/10 | 20.1 | 111.7 | 35.8 | 75.9 | 163.1 | 3.1 | 0.946 | 1.000 |
| darwin | none | 0/10 | 42.0 | 17.0 | 17.0 | 0.0 | 285.1 | 0.0 | 1.034 | 1.000 |
| baldwin | none | 0/10 | 40.8 | 18.2 | 17.7 | 0.5 | 288.2 | 0.0 | 1.042 | 1.029 |
| epi | none | 0/10 | 41.4 | 14.5 | 14.1 | 0.4 | 283.7 | 0.0 | 1.038 | 1.000 |

## 1. Supervivencia: ventaja frente a darwin, pareada por semilla (darwin − modo; positivo = el modo muere menos)

- baldwin pred: muertes térmicas -3.2 [-36.5, 30.1], semillas a favor 4/10; población mínima +-0.4 [-10.6, 9.8]
- epi pred: muertes térmicas 1.7 [-14.2, 17.6], semillas a favor 3/10; población mínima +0.0 [-3.2, 3.2]
- baldwin unpred: muertes térmicas 3.2 [-48.2, 54.6], semillas a favor 6/10; población mínima +-0.3 [-8.6, 8.0]
- epi unpred: muertes térmicas -2.7 [-28.0, 22.6], semillas a favor 4/10; población mínima +-1.2 [-6.2, 3.8]
- **de Bruin** (ventaja epi en pred − en unpred): 4.4 [-15.8, 24.6]; semillas con pred > unpred: 5/10

## 2. Seguimiento del tamaño cargado (correlación Δtamaño con año frío+1/cálido−1)

- darwin pred: 0.34 [0.09, 0.59] (n=8)
- baldwin pred: 0.27 [-0.03, 0.58] (n=8)
- epi pred: 0.41 [0.26, 0.56] (n=8)
- darwin unpred: 0.58 [0.48, 0.67] (n=8)
- baldwin unpred: 0.42 [0.11, 0.73] (n=8)
- epi unpred: 0.49 [0.19, 0.79] (n=8)

## 3. Baldwin: gen de plasticidad final

- pred: 1.118 (rango 0.956–1.282)
- unpred: 1.099 (rango 0.854–1.221)
- none: 1.029 (rango 0.759–1.162)

## 4. Cambio frente a estasis (Δ gen medio año 0 → final, contra el rango de `none` del mismo modo)

| modo | ambiente | brain | gut | muscle | eyes | antennae | size |
|---|---|---|---|---|---|---|---|
| darwin | rango none | -0.151…-0.011 | -0.019…0.091 | 0.004…0.043 | -0.068…0.081 | -0.054…0.045 | -0.052…0.071 |
| darwin | pred | -0.075 se mantuvo | 0.019 se mantuvo | 0.024 se mantuvo | -0.004 se mantuvo | 0.003 se mantuvo | -0.086 **cambió** |
| darwin | unpred | -0.070 se mantuvo | 0.007 se mantuvo | 0.037 se mantuvo | -0.012 se mantuvo | 0.017 se mantuvo | -0.089 **cambió** |
| baldwin | rango none | -0.109…-0.024 | -0.033…0.060 | -0.003…0.120 | -0.083…0.036 | -0.075…0.023 | -0.057…0.095 |
| baldwin | pred | -0.074 se mantuvo | 0.004 se mantuvo | 0.013 se mantuvo | 0.020 se mantuvo | -0.004 se mantuvo | -0.070 **cambió** |
| baldwin | unpred | -0.060 se mantuvo | -0.005 se mantuvo | -0.001 se mantuvo | -0.005 se mantuvo | -0.005 se mantuvo | -0.071 **cambió** |
| epi | rango none | -0.113…-0.037 | -0.035…0.066 | -0.076…0.076 | -0.036…0.059 | -0.024…0.037 | -0.041…0.079 |
| epi | pred | -0.059 se mantuvo | 0.006 se mantuvo | -0.004 se mantuvo | -0.003 se mantuvo | -0.004 se mantuvo | -0.091 **cambió** |
| epi | unpred | -0.084 se mantuvo | -0.005 se mantuvo | 0.023 se mantuvo | -0.005 se mantuvo | -0.026 **cambió** | -0.073 **cambió** |
