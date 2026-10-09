# Paso 3, campaña: protocolo (escrito antes de correr)

Desarrollo, formato `code`. Sigue al piloto (`step3-piloto.md`). Código: `research/code-culture/lineages.js` y `transplant.js`. Modelo `qwen3.6`, prompt v2.

## Condiciones

4 condiciones: torneo de 3 o madre al azar, cada una en vocabulario normal (`plain`) y ciego (`blind`). Todas con:
- 10 linajes × 20 generaciones × 24 Fagis;
- `mutate` 0,2: la hija recibe el texto de su madre y, con esa probabilidad, el modelo lo reescribe viendo solo el texto;
- mundos `cdev` n = linaje·480 + generación·24 + k, iguales en las cuatro condiciones;
- `current` vive cada uno de esos mundos.

## Medidas

1. **Principal: trasplante.** Por linaje, el texto que más Fagis llevan en la generación 19 vive 120 mundos nuevos (`cdev` 5000–5119, nunca usados por los linajes ni por el piloto). Se mide su supervivencia menos `current`. Unidad: el linaje (n = 10 por condición).
2. Supervivencia de la población menos `current` en las generaciones 15–19.
3. Descriptivo: cuántos textos finales tienen equivalentes de "dejar lo que dañó" y "probar lo nuevo" (lectura del texto), y cuántos usan el juicio innato.

## Contrastes y predicciones

- **Selección** (torneo − azar, en el trasplante, por linaje; IC bootstrap 95 %): predigo que el torneo gana en `plain` (alrededor de +0,05). En el piloto la diferencia era +0,045 con n = 3.
- **Requisito** (torneo `plain` − `current`, en el trasplante): predigo que es positivo, con la cota inferior por encima de 0. La puerta del plan pide que la cota no baje de −0,03.
- **Ciego** (torneo `blind` − `current`): predigo un efecto menor que en `plain` y quizá nulo. Si el ciego encuentra la cautela, lo encontrado viene de la selección y la vida; si no, del vocabulario del modelo.

Un nulo o un resultado al revés se publica igual.
