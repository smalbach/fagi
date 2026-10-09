# Batería G3: protocolo congelado (2026-10-02, antes de correr)

Código: `feat/evolving-body` en `b2a14a3`. Script: `bateria-g3.mjs`.

## Pregunta

¿Qué modo de herencia sigue mejor un ambiente cuya presión se invierte (G3)? ¿Se cumple de Bruin 2026 (heredar lo vivido ayuda si el cambio es predecible y daña si no)?

Pregunta del usuario: ¿cambia el cuerpo solo cuando la experiencia o la presión bastan? Quedarse igual es un resultado válido.

## Mundo

- Opciones del juego (`organism-on.js`), mapa con semilla 42, colonia de 4 fundadoras y 36 000 s (10 años de 3600 s).
- **Año frío:** el invierno de hoy (−8 °C, fruta ×0,02). Favorece el cuerpo grande, porque el aislamiento crece con el tamaño (Bergmann).
- **Año cálido:** invierno escaso pero sin frío, verano +12 °C en su centro. Favorece el cuerpo pequeño (`MORPH.oxygen` 30: el límite de calor baja 3 °C por cada +0,1 de tamaño).
- **Plasticidad:** la cría criada con calor sale más pequeña, −2,5 % por °C más allá de 1 °C de los 25 °C típicos (Atkinson 1994). Ningún órgano se mueve si el uso queda dentro del 15 % de lo típico.
- **Secuencia de años:** se sortea por semilla desde un flujo propio y es la misma para los tres modos (diseño pareado).

## Condiciones

3 modos (`darwin`, `baldwin`, `epigenetic`) × 3 ambientes × 10 semillas = 90 corridas.

| ambiente | qué es |
|---|---|
| `pred` | el año repite el tipo del anterior con p = 0,75; si no, cambia. Autocorrelación +0,5: el año de la madre anuncia el de la hija |
| `unpred` | cada año es una moneda (p = 0,5) |
| `none` | sin estaciones: control de deriva (mutación sin presión) |

## Medidas (por año y al final)

Población viva, generación máxima, genes y órganos cargados (media de las vivas), gen de plasticidad y muertes por causa (acumuladas).

## Análisis declarados antes de correr

1. **Supervivencia (principal).** Muertes por calor más frío por corrida, y población mínima desde el año 2. Comparación pareada por semilla contra Darwin.
   - de Bruin se confirma si la ventaja epigenética (Darwin − epi en muertes térmicas) es **mayor en `pred` que en `unpred`**, en al menos 7 de 10 semillas o por la media pareada con su intervalo.
2. **Seguimiento del tamaño.** Correlación entre el cambio anual del tamaño cargado y el signo del año (frío +1, cálido −1), por corrida. Se espera positiva en `pred`/`unpred` y cerca de 0 en `none`.
3. **Baldwin.** El gen de plasticidad sube más en `unpred` que en `pred` (la plasticidad paga cuando el ambiente varía sin aviso).
4. **Cambio frente a estasis.** Para cada rasgo, el cambio del gen medio (año 0 a final) se compara con el rango de las 10 corridas `none` del mismo modo.
   - Solo cuenta como **cambio por selección** si cae fuera de ese rango.
   - Si cae dentro, se reporta **"se mantuvo"** (compatible con deriva).
   - Predicción: el tamaño cambia año a año; cerebro, estómago, músculo, ojos y antenas se mantienen (nada en este ambiente los presiona distinto que en `none`).
5. **Extinciones:** se reportan por condición; una corrida extinta cuenta con población mínima 0 y queda fuera del análisis 2.

## Lo que no se cambia después de ver datos

Parámetros, semillas, duración, análisis y criterios. Si algo resulta mal calibrado, se reporta como tal y se corre una batería nueva con otro protocolo, sin reemplazar esta.
