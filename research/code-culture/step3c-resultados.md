# Paso 3c: resultados (2026-10-05)

Protocolo: `step3c-protocolo.md` (3450f8c), con el criterio de corte escrito antes de correr. Datos:
- `research/results/code-culture/lineages/rule-{diary,nodiary}`: los linajes;
- `research/results/code-culture/rule-transplant`: los 60 mundos nuevos por linaje;
- `archive.jsonl`: las llamadas.

## Veredicto: fracaso, según el criterio

| | con diario | sin diario |
|---|---|---|
| linajes cuyo texto final conoce la regla (sondeo ≥ 0,5) | **0/10** | 0/10 |
| linajes que llegan a mitad de camino de la cautela al oráculo en bocados dañinos | **0/10** | 0/10 |
| reescrituras que conocían la regla (sondeo > 0,5), en todo el linaje | 3 de 421 | 0 de ~420 |

**Medias en 60 mundos nuevos por linaje** (texto final · cautela · oráculo):

| | bocados dañinos por vida | supervivencia |
|---|---|---|
| con diario | 3.06 · 3.81 · 0.60 | 0.922 · 0.953 · 0.992 |
| sin diario | 3.07 · 3.81 · 0.60 | 0.908 · 0.953 · 0.992 |

## Lectura

- **Lo vivido no llega al código heredado.** Con o sin el diario de la madre, ningún linaje termina sabiendo la regla de su mundo. El diario no cambia nada medible (3,06 frente a 3,07 bocados dañinos).
- **El modelo pocas veces convierte el diario en una regla.** Ocurrió 3 veces en 421 reescrituras: por ejemplo, `color === 'red'` en el linaje donde lo rojo envenena. Esos textos aparecen en una sola Fagi de 24, y la selección no los conserva: el veneno no siempre mata y la ventaja de un solo texto se pierde en el ruido.
- **Lo que sí escribe** es más cautela por especie: "deja la especie que me dañó; prueba la nueva". Eso baja algo los bocados dañinos (3,1 frente a 3,8), pero aprende dentro de la vida y no hereda la regla. Además sobrevive algo menos que la cautela escrita a mano (0,92 frente a 0,95).
- **Tres de los textos con diario dejan todo** (sondeo: dejan 1,00 de lo venenoso y 1,00 de lo demás). Es prudencia general, no conocimiento.

## Qué se cierra y qué sigue

Tal como se acordó antes de correr, **se cierra la línea "el modelo reescribe el código desde la vida" con este operador.** Lo que queda establecido en los pasos 1–3c:
1. Un modelo local puede escribir y reescribir el juez de una Fagi de forma segura y reproducible (pasos 1–2).
2. El código heredado y reescrito supera al juicio innato (+0,056), pero lo útil lo trae el vocabulario del modelo: la cautela es sentido común (paso 3).
3. Cuando lo útil solo puede venir de la vida (una regla arbitraria por linaje), no aparece (paso 3c). El cuello de botella es el operador: casi nunca generaliza desde el diario, y cuando lo hace, la selección con 24 Fagis no lo retiene.

**Siguiente:** el paso 4 del plan, formatos de transmisión (código, razones, evidencia) frente a la inversión de la química. Apoya en el resultado más sólido del proyecto (razones frente a conclusiones, confirmado con reglas). Con lo aprendido aquí, el formato debe manipularse sobre lo que el modelo sí hace bien: transmitir y reescribir conocimiento, no descubrirlo.
