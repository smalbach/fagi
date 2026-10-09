# Por qué no hay evolución entre generaciones (2026-10-02)

Pregunta del usuario: G3 y G3b muestran que el cuerpo casi no cambia de generación en generación, y esa era una de las metas. ¿Por qué?

**Método.** Juego (`organism-on.js`), mapa 42, estaciones, 18 000 s, 3 semillas. Para cada Fagi con la vida completa se cuenta cuántas crías dejó (en `world.lineage`). Luego se calcula el gradiente de selección estandarizado de cada órgano: β = cov(z/σ, w/w̄). Como referencia de azar, el percentil 95 de |β| con rasgos barajados. Script: `diagnostico-evolucion.mjs`.

## Resultado

| | seed 1 | seed 2 | seed 3 |
|---|---|---|---|
| vidas completas | 164 | 156 | 160 |
| crías por Fagi (media ± sd) | 2,15 ± 1,89 | 2,14 ± 1,97 | 2,17 ± 1,95 |
| sin crías | 22 % | 24 % | 28 % |
| factor de hacinamiento medio | 2,5 | 1,9 | 3,3 |
| |β| máx. de los 6 órganos (crías) | 0,052 | 0,038 | 0,098 |
| |β| que da el azar (p95) | 0,134 | 0,149 | 0,127 |

Con peso y dureza de la fruta y fecundidad por tamaño (`651cf66`), el mayor |β| fue 0,135 (tamaño en la semilla 2), con un umbral de azar de 0,13–0,18. **Ningún órgano decide de forma clara cuántas crías deja una Fagi.**

## Diagnóstico

1. **La deriva gana a la selección.**
   - La población efectiva es Ne ≈ (4N − 2)/(Vk + 2) ≈ 30 (N ≈ 45; varianza de crías Vk ≈ 4).
   - Por generación, la media de un rasgo deriva al azar unos σ/√Ne ≈ 0,06/5,5 ≈ 0,011.
   - La selección la mueve β·σ ≈ 0,05 × 0,06 ≈ 0,003: **la deriva es unas 4 veces mayor**.
   - Para que la selección domine, haría falta |β| > 1/√Ne ≈ 0,18. En la naturaleza la mediana de |β| es ~0,1–0,15 (Kingsolver et al. 2001), así que con ~45 individuos casi cualquier rasgo deriva.
2. **Lo que decide las crías no depende del cuerpo.**
   - La despensa es común: lo que una Fagi trae lo comen todas, y forrajear mejor (músculo, ojos, antenas) no le da más crías a ella.
   - El hacinamiento (factor 2–3) frena la cría de todas por igual.
   - Para criar hay que estar en el nido en el momento justo, y la pareja se elige por cómo está ahora (hambre, energía), no por su cuerpo.
3. **Lo que mata tampoco depende mucho del cuerpo.** El frío (~60 % de las muertes) mata a quien la noche pilla fuera, más por conducta y suerte que por órganos. La vejez sale de un sorteo de vida.
4. **Las diferencias corporales son pequeñas.** La desviación de cada órgano es ~6 % y los beneficios tienen rendimientos decrecientes (exponente 0,5), así que una Fagi "mejor" rinde un ~3 % más.
5. **Pocas generaciones.** Hay unas 14–25 en 5–10 años de juego. Aun con β = 0,1, el cambio esperado es ~0,006 por generación, unos 0,1 en 15 generaciones: es lo que se vio en el tamaño en G3 (−0,07 a −0,09). La evolución real necesita cientos de generaciones.

**Conclusión.** El modelo no está roto: con selección débil, población pequeña y pocas generaciones, lo realista es estasis y deriva. Para que haya evolución visible hay que cambiar una de esas tres cosas.

## Soluciones posibles (de más a menos realista para hormigas)

| | qué | efecto | coste |
|---|---|---|---|
| A | **La cría depende de la propia condición:** la madre necesita reservas propias (lo que ella comió), no solo la despensa común; las hembras prefieren machos más fuertes o grandes (selección sexual, común en insectos) | sube β: forrajear bien y tener mejor cuerpo da más crías | poco código; cambia el juego |
| B | **Varias colonias que compiten** (metapoblación): cada nido con su despensa; las colonias que rinden más crecen y fundan nuevas | sube Ne, y aparece selección entre colonias, que es como evolucionan de verdad las hormigas (la despensa común deja de diluir la selección) | grande: mapa, rendimiento, interfaz |
| C | **Más generaciones:** modo laboratorio para baterías, con corridas largas (100+ generaciones) y simulación más rápida (perfilar feromonas y percepción) | la selección débil se acumula | trabajo de rendimiento |
| D | Más variación inicial o mutación | más materia prima | poco realista más allá de ~10 % |

## Lo aplicado (2026-10-02, decisión del usuario: A + B + efectos maternos)

| | commit | qué |
|---|---|---|
| peso y dureza | `651cf66` | la fruta pesa (0,5–2) y es dura (0,5–2). Cargar frena y cansa según peso / (músculo × tamaño^⅔); una fruta más dura que el estómago da menos. Plasticidad: el músculo sigue el trabajo (caminar cargando) y el estómago la masa masticada. Fecundidad ∝ tamaño (Honěk 1993) |
| A | `0837836` | **aprovisionamiento propio:** la madre pone solo tras traer 1 fruta propia desde su última puesta. **Elección de pareja** por fuerza (músculo × tamaño^⅔). **Efectos maternos** (idea del usuario): lo que la madre vivió hasta cada puesta (uso de cada órgano) y lo bien comida que está moldean dónde empiezan y se asientan los órganos de esa cría; no pasa a las nietas |
| B | `5ff08c0` | **varias colonias:** `COLONIES.count` nidos, cada uno con su agua, sus árboles, sus fundadoras, su despensa y su techo. Cada Fagi entra solo a su nido. Un nido vaciado lo refunda una pareja de la colonia más llena: las colonias que rinden se extienden |

**Medido tras A** (juego, 3 semillas, 18 000 s):
- el músculo queda bajo selección positiva en las 3 semillas (β +0,03 a +0,08 con aprovisionamiento 1; +0,07 a +0,18 con 2);
- las crías de la última postura de una madre difieren ~0,07–0,11 por órgano de las de la primera;
- la población baja a ~30 vivas, porque la comida limita la cría.

**Primera prueba de B** (3 colonias de 30, 3 años): las colonias divergen por efecto fundador (gen de tamaño 1,10, 1,04 y 0,96) y ninguna se extinguió en ese tiempo, así que no hubo refundación.

**Falta:** una batería que mida si ahora el cuerpo evoluciona más que en el control.
