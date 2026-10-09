# Batería G3b: protocolo congelado (2026-10-02, antes de correr)

Código: `feat/evolving-body` en `a0b5558`. Script: `bateria-g3b.mjs`. Corrige los problemas de G3 (`bateria-g3-resultados.md`):
- el primer año es siempre benigno;
- la presión que cambia ahora toca a las adultas, no a la cría protegida en el nido.

## Pregunta

Igual que G3: ¿qué modo de herencia sigue mejor un ambiente que cambia, y se cumple de Bruin 2026? Con la pregunta del usuario: el cuerpo solo cambia si la experiencia basta; quedarse igual es un resultado válido.

## Mundo

- Opciones del juego, **mapa 19 con 6 árboles**: tres a ~300 px del nido y tres a ~440. **Fruta escasa:** `TREE.interval` 64, ocho veces la del juego, para que llegar rápido importe.
- Estaciones del juego: invierno escaso y frío cada año, sin años cálidos.
- **Año lejano:** dan fruta los árboles lejanos; los cercanos, 0,1 de su ritmo. Favorece el músculo (llegar lejos).
- **Año cercano:** lo contrario. Favorece no pagar músculo de más.
- El primer año es siempre cercano. La secuencia de años es la misma para los tres modos en cada semilla.

## Lo que se sabe antes de correr (calibración, semilla 1)

- Con fruta ×8 el gen de músculo diverge en 3 años: 1,09 en años lejanos frente a 0,96 en cercanos.
- **El uso del músculo casi no difiere entre años:** mediana de tiempo caminando 0,47 en lejanos y 0,45 en cercanos, frente a 0,53 de referencia; el umbral es ±15 %. Los viajes son más largos, pero el tiempo en movimiento es el mismo. **Se espera poca plasticidad del músculo.**
- **El olfato sí difiere:** mediana 0,01 en años lejanos y 0,13 en cercanos (referencia 0,11). Se espera que las antenas cargadas encojan en años lejanos.

## Condiciones

3 modos × {`pred` (repite el tipo de año con p = 0,75; si no, cambia), `unpred` (moneda), `none` (todos los árboles dan, control de deriva)} × 10 semillas = 90 corridas de 36 000 s.

## Análisis declarados antes de correr

1. **Supervivencia y cría (principal).** Población mínima desde el año 2, crías nacidas y muertes totales salvo vejez. Comparación pareada contra Darwin por semilla.
   - de Bruin se confirma si la ventaja epigenética (epi − darwin en crías) es **mayor en `pred` que en `unpred`**, en al menos 7 de 10 semillas o por la media pareada con su intervalo.
2. **Seguimiento.**
   - Músculo cargado: correlación de su cambio anual con el tipo de año (lejano +1).
   - Antenas cargadas: la misma correlación, con signo esperado negativo (en años lejanos se huele poco).
3. **Plasticidad frente a gen.** Media de |cargado − gen| en músculo y antenas.
   - Mide si la experiencia pasó el umbral.
   - Cerca de 0 significa que **el cuerpo se quedó como nació**.
4. **Baldwin:** el gen de plasticidad sube más en `unpred` que en `pred`.
5. **Cambio frente a estasis:** como en G3 (Δ gen desde el fin del año 1, contra el rango de `none` del mismo modo).

## Lo que no se cambia después de ver datos

Parámetros, semillas, duración, análisis y criterios.
