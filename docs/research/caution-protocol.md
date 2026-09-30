# Protocolo: cautela al comer en el juego (congelado)

Plan: `docs/research/plan-reglas-de-conducta.md`, opción 2 tras el paso 3b: integrar lo que funciona, escrito a mano, con su propia confirmación. Congelado antes de ejecutar ningún mundo de confirmación; el commit que añade este archivo es la versión 1. Una sola campaña.

## Qué se integraría

Fagi nace con dos líneas de conducta (`src/learned/conduct.js`), aplicadas por el juez `learned` del punto de bocado (`DECIDE.eat`), sin que aprenda nuevas (`CONDUCT.learn` 0):

```js
conduct('taste-novel', {"if":{"novel":true,"hungerBelow":75},"do":"taste",...});
conduct('leave-harmed-mostly', {"if":{"harmedMostly":true},"do":"leave",...});
```

- Una especie que nunca comió la prueba primero con un bocado pequeño, si su hambre está por debajo de 75.
- Una especie que la dañó tantas veces como la alimentó, no la vuelve a comer. Tampoco la lleva al nido.
- En todo lo demás, su juicio de siempre.
- El punto de bocado ya no exige el punto de decisión (`DECIDE.enabled`): la navegación del juego no cambia.

## Diseño

- **Perfiles** (`research/adaptive-decision/design.js`, `GAME_PROFILES`): el juego como se juega (`app/organism-on.js`), una Fagi sin reproducción, 2400 s.
  - `classic`: el mapa clásico, lo que el juego trae de fábrica.
  - `species`: con 6 especies silvestres, el ajuste que el juego ofrece.
- **Brazos:** `current` (sin cambios) y `caution` (las dos líneas).
- **Mundos:** grupo `gconf`, semillas 53000 + i, mapas 2700000 + 103 i, i = 0..199, nunca usados. El piloto usó `gdev` (51000, 2600000 + 101 i).
- **N = 200** por perfil y brazo. Con la dispersión del piloto (desviación típica de la diferencia 0,25), 0,05 pide ~160 para α 0,05 unilateral y potencia 80 %.
- **Comandos:**

  ```
  node research/adaptive-decision/game-caution.js --group gconf --worlds 200
  node research/adaptive-decision/caution-confirm.js
  ```

## Hipótesis y criterios (fijados aquí)

- **H1.** Con especies, `caution` sobrevive más que `current`: diferencia pareada por mundo mayor que 0, unilateral, permutación de signos, α 0,05.
- **H2.** En el mapa clásico, `caution` no es peor: cota inferior unilateral del 95 % de la diferencia mayor que −0,02.
- **Coste:** tiempo por segundo simulado de `caution` como mucho 1,5 veces el de `current` en la misma campaña.

**Decisión:**

| Resultado | Acción |
|---|---|
| H1, H2 y coste se cumplen | Integrar como comportamiento de fábrica del juego, con un ajuste para apagarlo |
| H2 o coste fallan | No integrar |
| H1 no se cumple y H2 sí | No integrar; publicar el resultado |

Una muerte es un resultado, nunca una exclusión. Piloto: con especies +0,090 [0,018, 0,176]; en el mapa clásico, sin diferencia (todas vivas).

## Resultado (añadido tras la campaña, sin tocar lo anterior)

`research/adaptive-decision/caution-confirmation.md`.

- **H1 ✓:** con especies, 0,882 → 0,955, +0,073 [0,033, 0,111], p 0,0003. Muertes por veneno: de 29 a 4, con 4 por hambre donde antes no había.
- **H2 ✓:** mapa clásico, +0,005 (cota inferior −0,014).
- **Coste ✓:** 0,94 veces.

Integrado de fábrica en el juego (`src/app/organism-on.js`), con el ajuste "Cautela" para apagarlo (`CONDUCT.enabled`). Apagado, juzga exactamente como antes.
