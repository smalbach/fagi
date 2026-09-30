# Decisión adaptativa, paso 3: el juez con modelo de consecuencias, en desarrollo

Plan: `docs/research/plan-decision-adaptativa.md`, paso 3 (revisión 1: "qué comer"). Mismos 40 mundos de desarrollo por familia que la viabilidad; datos en `research/results/adaptive-decision/food/`; diferencias con `node research/adaptive-decision/gate.js <juez>`. No es un resultado confirmatorio: estos mundos sirvieron para construir y ajustar.

## El prototipo (`src/adaptive-decision/`)

- `observation.js`: lo que el juez puede saber. Hambre y su tope, edad, lo que lleva, la despensa como la recuerda, el último bocado como lo sintió (hambre antes y después) y el aspecto de un fruto (color, forma, olor). Nada del fruto real, de si es un parecido, de la química ni del aprendizaje de su cerebro.
- `model.js`: por especie y por rasgo, bocados que dañaron y que no; lo que espera de una especie son sus cuentas sobre un previo sacado de sus rasgos, así que juzga una especie nueva por su aspecto. Aprende cuánto daña un bocado malo y cuánto alimenta uno bueno, a qué ritmo sube su hambre y cuánto tarda entre comidas seguras. Una sola regla de olvido: la evidencia vieja se pierde más cuanto más la sorprende el mundo (volatilidad).
- `policy.js`: en el punto de bocado compara comer, probar y dejar por el riesgo de morir (bocado dañino que la lleva al tope, o pasar hambre más de lo que suele tardar en encontrar comida segura). Con horizonte 2, cada acción va seguida de lo que aprende y de una segunda decisión sobre la misma especie. Sin hambre no come entero: prueba especies que nunca comió, lleva a casa lo que probablemente alimenta y deja el resto.
- `index.js`: registra `model`, las ablaciones `model-h1` (horizonte 1) y `model-fixed` (sin olvido), y `model-v1` (versión descartada).
- Sin azar propio: dos vidas con las mismas semillas son idénticas.

## Variantes (máximo dos, ambas registradas)

- **v1, descartada.** Un bocado de prueba contaba como un cuarto de evidencia, y una ración segura en casa no contaba para el riesgo de hambre. Resultado: volvía a probar fruta podrida y, con hambre alta, apostaba por frutos dudosos teniendo comida en casa. Supervivencia 0,53-0,58, entre 0,16 y 0,26 peor que la referencia (`model-v1`, `v1-model-h1`, `v1-model-fixed`).
- **v2.** Si un bocado dañó es igual de claro tras uno de prueba que tras uno entero: cada bocado es una unidad de evidencia; solo la magnitud se escala. Una ración que cree segura en casa cuenta como comida segura a un minuto.

## Resultado v2

Supervivencia media, 40 mundos:

| Juez | stable | invert | novel |
|---|---|---|---|
| `current` (referencia) | 0,833 | 0,736 | 0,825 |
| `model` (horizonte 2, olvido por sorpresa) | 0,839 | 0,716 | 0,827 |
| `model-h1` (horizonte 1) | 0,809 | 0,721 | 0,796 |
| `model-fixed` (sin olvido) | **0,948** | **0,790** | **0,904** |
| informado v3 (referencia de diagnóstico) | 0,953 | 0,809 | 0,922 |

Diferencias pareadas con `current`, familias cambiantes (invert + novel) e intervalo 95 %:

| Juez | Cambiantes | stable |
|---|---|---|
| `model` | −0,009 [−0,103, 0,086] | 0,006 |
| `model-h1` | −0,022 [−0,129, 0,079] | −0,024 |
| `model-fixed` | 0,067 [−0,014, 0,149] | 0,115 [0,042, 0,198] |

## Lectura

- **El modelo completo no mejora a la referencia** (−0,01). Planificar dos decisiones sobre uno (`model` frente a `model-h1`): +0,01 a +0,03, sin apoyo.
- **El olvido por sorpresa perjudica**, también justo donde debía ayudar: tras la inversión de la química, `model` 0,716 frente a 0,790 sin olvido. Los parecidos venenosos de especies buenas sorprenden todo el tiempo, así que la volatilidad nunca baja (0,3-0,4 en el mundo estable), borra lo aprendido y la hace volver a probar: come ~27 veces por vida frente a ~21 sin olvido.
- **Lo que funciona es la cautela con evidencia que no se borra**: probar cada especie nueva con un bocado pequeño, juzgar las nuevas por su aspecto y no arriesgar un bocado dañino cuando la mataría. `model-fixed` queda cerca del informado v3, sin conocer el mecanismo, y gana sobre todo en el mundo estable (+0,115). En las familias cambiantes no llega al umbral de 0,10 que el plan pediría en el paso 4 (+0,067, intervalo que toca cero).
- La hipótesis del paso 3, tal como se escribió (modelo más planificación más adaptación al cambio), **no tiene apoyo en desarrollo**. Lo que sí apunta es otra más simple: cautela aprendida frente a lo desconocido. Que eso sea lo que se lleve al paso 4 es una decisión que cambia la afirmación, y se deja a la persona.
