# Batería de evolución: ¿evoluciona ahora el cuerpo? (2026-10-02)

Código `5ff08c0`. Script: `bateria-evolucion.mjs`. Datos: `bateria-evolucion-2026-10-02.jsonl`. Análisis: `bateria-evolucion-analisis.mjs`.

Corridas cortas (4 años, 14 400 s, ~10 generaciones), a pedido del usuario. 3 condiciones × 8 semillas, juego con peso y dureza de la fruta:
- `old`: reglas viejas (sin aprovisionamiento propio, sin elección por fuerza, sin efectos maternos), 1 colonia;
- `A`: reglas nuevas, 1 colonia;
- `AB`: reglas nuevas, 3 colonias de hasta 30.

**Criterio.** Hay evolución si un rasgo cambia en la misma dirección en casi todas las semillas: la deriva da direcciones al azar. t = media / error estándar entre semillas (con 8 semillas, |t| > 2,4 ≈ p < 0,05).

## Resultado

| condición | músculo: semillas que suben | t | β del músculo | otros |
|---|---|---|---|---|
| old | 5/8 | 1,2 | 0,00 | nada consistente (el tamaño sube 7/8, t 1,9, con β negativo) |
| A | 6/8 | 2,0 | +0,08 | el cerebro baja 7/8 (t −2,1): es caro |
| **AB** | **7/8** | **2,8** | +0,07 | antenas 6/8 (t 1,7) |

- **Con las reglas nuevas y 3 colonias, el músculo evoluciona**, como predecía el mecanismo (aprovisionar y cargar fruta pesada paga): +0,035 en ~10 generaciones, en la misma dirección en 7 de 8 semillas. Con las reglas viejas, nada.
- **Las colonias divergen entre sí.** Por ejemplo, en la semilla 2 el músculo vale 0,98, 1,05 y 1,22 en los tres nidos.
- **No hubo refundaciones:** ninguna colonia se extinguió en 4 años. La selección entre colonias propiamente dicha aún no actuó; el efecto de AB viene sobre todo de la mayor población (73 vivas frente a 31) y de la menor deriva.
- **Advertencia:** son 18 comparaciones (6 rasgos × 3 condiciones), pero el músculo era el rasgo predicho de antemano.

Con este resultado, el juego pasa a 3 colonias de hasta 30 (`bbcfab6`).

## Tablas

### old: 8 corridas, extintas 0, vivas al final 30, crías 158, generación 10.6, refundaciones 0.0, 5 min/corrida
| rasgo | Δ gen medio | semillas que suben | t (media/ee) | β medio |
|---|---|---|---|---|
| brain | -0.023 | 2/8 | -1.5 | -0.043 |
| gut | -0.009 | 2/8 | -1.1 | 0.041 |
| muscle | 0.013 | 5/8 | 1.2 | 0.002 |
| eyes | 0.003 | 5/8 | 0.2 | 0.000 |
| antennae | 0.000 | 3/8 | 0.0 | -0.002 |
| size | 0.032 | 7/8 | 1.9 | -0.109 |

### A: 8 corridas, extintas 0, vivas al final 31, crías 134, generación 10.6, refundaciones 0.0, 4 min/corrida
| rasgo | Δ gen medio | semillas que suben | t (media/ee) | β medio |
|---|---|---|---|---|
| brain | -0.021 | 1/8 | -2.1 | -0.018 |
| gut | 0.005 | 5/8 | 0.3 | 0.023 |
| muscle | 0.022 | 6/8 | 2.0 | 0.078 |
| eyes | 0.013 | 5/8 | 0.7 | -0.071 |
| antennae | 0.003 | 5/8 | 0.3 | -0.042 |
| size | 0.007 | 4/8 | 0.5 | 0.027 |

### AB: 8 corridas, extintas 0, vivas al final 73, crías 217, generación 10.4, refundaciones 0.0, 22 min/corrida
| rasgo | Δ gen medio | semillas que suben | t (media/ee) | β medio |
|---|---|---|---|---|
| brain | -0.008 | 2/8 | -0.7 | -0.045 |
| gut | 0.001 | 5/8 | 0.1 | -0.014 |
| muscle | 0.035 | 7/8 | 2.8 | 0.066 |
| eyes | 0.004 | 3/8 | 0.7 | -0.029 |
| antennae | 0.016 | 6/8 | 1.7 | 0.008 |
| size | 0.014 | 5/8 | 1.1 | -0.000 |
  semilla 1: nido 1 n=25 tamaño 1.12 músculo 1.06 · nido 4 n=27 tamaño 1.06 músculo 1.01 · nido 7 n=28 tamaño 1.03 músculo 1.01
  semilla 2: nido 1 n=24 tamaño 1.05 músculo 0.98 · nido 4 n=26 tamaño 0.99 músculo 1.05 · nido 7 n=27 tamaño 1.05 músculo 1.22
  semilla 3: nido 1 n=23 tamaño 1.01 músculo 1.00 · nido 4 n=26 tamaño 0.89 músculo 0.95 · nido 7 n=23 tamaño 0.91 músculo 1.01
  semilla 4: nido 1 n=23 tamaño 0.94 músculo 1.18 · nido 4 n=21 tamaño 0.99 músculo 1.07 · nido 7 n=26 tamaño 0.95 músculo 1.16
  semilla 5: nido 1 n=21 tamaño 0.99 músculo 1.08 · nido 4 n=29 tamaño 1.04 músculo 1.04 · nido 7 n=27 tamaño 1.05 músculo 1.06
  semilla 6: nido 1 n=22 tamaño 1.06 músculo 1.08 · nido 4 n=26 tamaño 0.98 músculo 1.05 · nido 7 n=17 tamaño 0.98 músculo 1.01
  semilla 7: nido 1 n=21 tamaño 1.07 músculo 1.01 · nido 4 n=27 tamaño 0.92 músculo 0.96 · nido 7 n=29 tamaño 0.99 músculo 0.96
  semilla 8: nido 1 n=22 tamaño 0.95 músculo 1.00 · nido 4 n=24 tamaño 1.12 músculo 1.05 · nido 7 n=18 tamaño 1.01 músculo 1.06
