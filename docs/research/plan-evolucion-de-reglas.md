# Plan: reglas de conducta que evolucionan

Estado: propuesta de ejecución; no es un protocolo congelado ni un experimento realizado.
Referencia: commit `ead909a`. Registrar el commit efectivo al comenzar.

## De dónde sale

En el ciclo de reglas de conducta (`docs/research/plan-reglas-de-conducta.md`, `research/adaptive-decision/conduct-lineages.md`), seis variantes de "que Fagi escriba sus reglas" quedaron por debajo de la Fagi actual. Lo común a todas fue el filtro: juzgar una regla repasando sus propios bocados. Con pocos bocados y una muestra sesgada (lo que muerde son sobre todo las prohibiciones que rompe), las prohibiciones siempre parecían buenas, y fallaba ya en la generación 0, sin herencia.

La gramática sí funciona: las dos líneas correctas, escritas a mano, mejoran a Fagi y ya están en el juego (`docs/research/caution-protocol.md`, +0,073 con especies).

La pregunta de este plan: **¿pueden aparecer esas reglas sin que nadie las juzgue?** Las líneas aparecen y desaparecen al azar al heredarse, y solo la supervivencia decide cuáles perduran. Es como se forma un instinto: nadie lo razona; lo tienen los descendientes de quienes vivieron.

## Objetivo y límite de la afirmación

Demostrar que, con variación al azar dentro de la gramática y selección por supervivencia, los linajes de Fagi llegan a vivir con reglas de conducta que las hacen sobrevivir más que la Fagi actual, sin juicio interno ni reglas escritas por nosotros.

Límites:

- **La búsqueda ocurre dentro de nuestra gramática.** Se publica su tamaño y qué fracción de ella son reglas útiles.
- **Es evolución simulada, no aprendizaje de un individuo.** Una Fagi concreta no aprende nada nuevo en su vida; lo aprende el linaje.
- **Si en el número de generaciones fijado no aparece nada útil, es un resultado válido.** Dirá cuánto cuesta encontrarlo a ciegas.

## Por qué debería funcionar donde lo anterior falló

- **La supervivencia sí ve lo que el filtro no veía:** que una prohibición mata de hambre, y que probar enseña.
- **La variación no depende de lo que cada Fagi vive.** En el paso 3b todas escribían las mismas prohibiciones porque su filtro las aprobaba. Aquí nadie escribe nada: las líneas llegan al azar.

## Diseño

### Qué se hereda y cómo varía

- **Genoma de conducta:** una lista de líneas de la gramática actual (`src/learned/conduct.js`), sin rasgos de aspecto. Cada vida transcurre en un mundo distinto con especies distintas, así que "no comas lo rojo" no significa lo mismo en el mundo de la hija. Quedan 236 líneas posibles (condición sobre la especie × franja de hambre × acción).
- **Al nacer**, la cría copia las líneas de su madre con variación:
  - cada línea se pierde con probabilidad `μ_perder`;
  - cada línea cambia una pieza (acción, condición sobre la especie o umbral de hambre) con probabilidad `μ_cambiar`;
  - se añade una línea nueva al azar de la gramática con probabilidad `μ_añadir`;
  - como mucho `L` líneas.
- **Durante su vida**, las líneas actúan en el punto de bocado (juez `learned`) sobre su juicio de siempre, como la cautela del juego. No aprende líneas nuevas (`CONDUCT.learn` 0) ni las juzga (`CONDUCT.inherit` 0).
- **Variación:** con una semilla propia por nacimiento, reproducible.

### Selección

- **Linajes de K Fagis por generación**, cada una en un mundo propio que no se repite, rotando las familias `stable`, `invert` y `novel` de la batería "qué comer".
- **Madres:** por torneo. Para cada cría se sortean T de la generación anterior y es madre la que más vivió. Se elige torneo, y no probabilidad proporcional, porque la ventaja de las reglas buenas (~+0,07) es pequeña frente al azar de cada mundo: con selección proporcional tardaría ~35 generaciones en extenderse.
- **Ablación:** madre al azar, que deja solo la deriva.

### Factibilidad, antes de correr

- **Probabilidad de acertar al azar.**
  - Reglas del tipo "probar lo nuevo" con alguna franja de hambre: 15 de 236 (~6 %).
  - Reglas del tipo "dejar lo que dañó" (con `harmed` o `harmedMostly`): 30 de 236 (~13 %).
  - Con `μ_añadir` = 0,1 y K = 30, aparecen ~3 líneas nuevas por generación, así que una de "probar lo nuevo" cada ~5 generaciones.
- **Tiempo de extensión.** Una ventaja de ~0,07 con torneo de T = 3 debería llevar una línea de 1/30 a la mayoría en unas 10-20 generaciones. Es una estimación que el paso 1 comprobará.
- **Tamaño propuesto:** K = 30, G = 60 generaciones, 10 linajes = 18 000 vidas por condición, ~1-2 h en esta máquina.

## Pasos

### Paso 1. ¿La selección es lo bastante fuerte?

Antes de buscar nada: sembrar las dos líneas buenas en 3 de las 30 Fagis de la generación 0, sin mutación, y ver si se extienden.

- Condiciones: con torneo y con madre al azar.
- Puerta: con torneo, las líneas buenas pasan de 10 % a más del 50 % de la población en G generaciones, en la mayoría de los linajes, y más rápido que al azar. Si no, ajustar la presión de selección (T, K), nunca el mundo.
- También al revés: sembrar "no comas nada nuevo" y ver que la selección la elimina.

### Paso 2. Evolución a ciegas (desarrollo)

- Generación 0 sin líneas; variación y selección desde ahí.
- Mundos: grupo `evo` (nuevo, desarrollo).
- **Parámetros a fijar aquí**, en desarrollo y con un máximo de dos configuraciones de mutación: `μ_añadir`, `μ_perder`, `μ_cambiar`, `L`, T.
- **Medir:**
  - supervivencia por generación;
  - qué líneas dominan al final;
  - en cuántos linajes aparece y se fija alguna del tipo "probar lo nuevo" y alguna del tipo "dejar lo que dañó";
  - generación de aparición y de fijación;
  - frente a `current` y a la heurística fija en los mismos mundos.

Entregable: informe de desarrollo con las reglas que evolucionaron, legibles, y su historia en los linajes.

### Paso 3. Confirmación

Protocolo congelado antes de ejecutarla, en mundos nunca usados (`evo2`):

- **H1:** las Fagis de las últimas generaciones de linajes con selección sobreviven más que `current` en los mismos mundos (unidad: el linaje; unilateral).
- **H2:** con selección, al final hay más reglas del tipo correcto que con madre al azar.
- **Descriptivo:** distancia a la heurística fija (la escrita a mano), y qué reglas concretas se fijaron.
- **Además, trasplante:** las líneas mayoritarias al final de cada linaje, puestas como líneas de nacimiento en mundos nuevos frente a `current`. Así se sabe si lo evolucionado sirve fuera de su linaje.

### Paso 4. Condicionado

Si lo evolucionado iguala o supera a las líneas escritas a mano, se decide si el juego debería nacer con lo que evolucionó en lugar de lo que escribimos. Tiene su propio protocolo, como el de la cautela.

## Riesgos que ya se ven

- **Ruido.** Una vida es muy azarosa (mundos distintos, veneno, frío); la selección puede tardar más de lo estimado. El paso 1 lo mide antes de gastar la búsqueda.
- **Autostop.** Si la supervivencia media ronda 0,85, la presión de selección es baja: las que viven al horizonte empatan. El torneo desempata por tiempo vivido; si no alcanza, se desempatará por lo que comió, anunciado antes.
- **Reglas que se cuelan.** Líneas neutras que acompañan a las buenas (autostopistas genéticos). Se informan; no invalidan si la supervivencia sube.
- **Coste.** Unas 18 000 vidas por condición. Si el paso 1 pide más generaciones, se dirá antes de correr el paso 2.

## Gestión

- Primera entrega: paso 1. Si la selección no extiende las líneas buenas sembradas, no tiene sentido buscarlas a ciegas.
- Registro breve de hipótesis y decisiones.

## Antecedentes

Evolución de reglas simbólicas por mutación y selección: algoritmos genéticos (Holland, 1975) y sistemas clasificadores (Holland, 1986); evolución de comportamientos innatos frente a aprendidos y el efecto Baldwin (Hinton y Nowlan, 1987). La contribución buscada es medirlo en Fagi, no reclamar novedad sobre esos trabajos.
