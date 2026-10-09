# Batería de estaciones (2026-10-02)

Primera presión de selección real sobre el cuerpo evolutivo. Script: `bateria-estaciones.mjs`; datos crudos: `bateria-estaciones-2026-10-02.jsonl`.

**Diseño.**
- Mundo y opciones del juego (`organism-on.js`), mapa con semilla 42, colonia de 4 fundadoras y 18 000 s (5 años de 3600 s).
- `SEASONS`: invierno del 45 % del año, fruta ×0,02 en lo hondo y ×1,6 en verano, −8 °C.
- 3 modos de herencia × invierno predecible o impredecible (`spread` 0,5) × 3 semillas.
- La semilla fija las fundadoras, así que el mismo número de semilla da la misma colonia inicial en los tres modos.

**Resultados** (promedio de 3 semillas; población contada desde el año 2):

| modo | invierno | población media | población mínima | muertes por frío | muertes por edad | gen de tamaño (cargado) | gen de cerebro | gen de plasticidad |
|---|---|---|---|---|---|---|---|---|
| darwin | predecible | 44,7 | 21,7 | 106 | 65 | 1,04 (1,06) | 1,01 | — |
| baldwin | predecible | 45,5 | 24,7 | 92 | 72 | 0,95 (0,96) | 0,96 | 1,18 |
| epigenético | predecible | 46,0 | 27,0 | 78 | 76 | 1,04 (1,09) | 0,97 | — |
| darwin | impredecible | 46,8 | 17,7 | 60 | 95 | 1,02 (1,03) | 1,02 | — |
| baldwin | impredecible | 45,3 | 11,7 | 80 | 76 | 1,01 (1,02) | 0,96 | 1,18 |
| epigenético | impredecible | 47,9 | 25,3 | 48 | 88 | 1,06 (1,11) | 0,98 | — |

Ninguna corrida se extinguió. El hambre no mató a nadie; la sed, a 3.

**Lectura.**
- **Las estaciones crean selección.** Antes, el 100 % de las muertes eran por edad; ahora el frío causa la mitad o más.
- **Baldwin:** el gen de plasticidad sube de 1 a 1,18 en ambas condiciones. Pero con invierno impredecible tiene la peor población mínima, y no sube el gen de tamaño.
- **Epigenético:** es el mejor en ambas condiciones (menos frío, mínimo más alto). La marca lleva el tamaño cargado por encima del gen.
- **Cerebro:** baja un poco en Baldwin y epigenético. Aquí aprender no paga (en línea con G2).
- **Ruido:** domina la semilla (la 2 da genes altos en todos los modos). Con n = 3 ninguna diferencia es firme.

**G3 queda sin probar.** La predicción de de Bruin 2026 (lo epigenético daña si el cambio es impredecible) no se ve, porque el diseño no la pone a prueba:
- el invierno impredecible solo varía en intensidad, duración y fecha, no en dirección;
- ser grande ayuda siempre contra el frío, así que heredar "más tamaño" nunca engaña;
- los años sorteados salieron más suaves en promedio que el año fijo.

**Para la batería G3 hace falta:**
1. Años en que la presión se invierta. Candidato: la regla temperatura-tamaño (Atkinson 1994), donde un verano caluroso encarece el cuerpo grande por el límite de oxígeno de las tráqueas (Harrison 2010).
2. Que el hambre pueda seleccionar; hoy la despensa la amortigua.
3. Al menos 10 semillas y el protocolo congelado antes de correr.
