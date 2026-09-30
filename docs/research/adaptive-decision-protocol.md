# Protocolo: cautela aprendida al decidir qué comer (congelado)

Plan: `docs/research/plan-decision-adaptativa.md`, revisiones 1 y 2, paso 4. Congelado antes de ejecutar ningún mundo de confirmación: el commit que añade este archivo es la versión 1 del protocolo. Una sola campaña confirmatoria por versión; cualquier corrección posterior exige una versión nueva y mundos nuevos.

## Hipótesis

Un juez que aprende de sus propios bocados, juzga lo desconocido por su aspecto, lo prueba primero con un bocado pequeño y no arriesga un bocado dañino cuando la mataría, sin olvidar lo aprendido (`model-fixed`, `src/adaptive-decision/`), sobrevive más que Fagi actual y que la mejor alternativa simple en mundos cuya química cambia.

No se afirma adaptación al cambio ni planificación salvo que los criterios 2 y 4 lo apoyen.

## Qué se eligió antes, y con qué

- **Desarrollo** (40 mundos por familia, semillas 31000 + i, mapas 1800000 + 61 i): construcción del juez (v1 descartada, v2) y ajuste de los competidores, 6 configuraciones cada uno. Mejor heurística `heuristic:1:75`; mejor Q-learning `qlearn:0.1:0.05` (`research/adaptive-decision/competitors.js`).
- **Validación** (40 mundos por familia, semillas 33000 + i, mapas 1900000 + 67 i). Variante: `model-fixed` (+0,068 en las familias cambiantes frente a current) sobre `model` (+0,021). Competidor: la heurística (+0,068) sobre Q-learning (−0,207). Nada se reajustó después.

## Diseño de la confirmación

- **Mundos:** semillas 35000 + i, mapas 2000000 + 71 i, i = 0..299, nunca usados. Los instantes de cambio salen de esos mapas (`foodworlds.js`), así que son nuevos.
- **Familias:** `stable`, `invert`, `novel` y `composition` (reservada: especies nuevas y, después, química invertida; nunca ejecutada antes).
- **Jueces** (punto de bocado `DECIDE.eat`, con la elección conectada para ir a los sitios):
  - `current`: Fagi actual.
  - `model-fixed`: la hipótesis.
  - `heuristic:1:75`: el competidor elegido.
  - `model-fixed-h1`: la ablación de horizonte.
- **Horizonte:** 2400 s. Cada vida empieza sin memoria. Nadie se preentrena.
- **N:** 300 mundos por familia y juez, el techo del plan. Con la dispersión de validación, 0,05 frente a current en las cambiantes pide ~210 mundos (unilateral α 0,01, potencia 80 %), y frente a la heurística ~85. La composición no tiene piloto: 300 puede quedarse corto, y así se dirá.
- **Comandos:**

  ```
  node research/adaptive-decision/battery.js --domain food --group conf --controller <juez> --families stable,invert,novel,composition --worlds 300
  node research/adaptive-decision/confirm.js
  ```

## Análisis (`research/adaptive-decision/confirm.js`, congelado)

- **Medida:** `min(tiempo vivo, horizonte) / horizonte` en todos los episodios. Una muerte es un resultado, nunca una exclusión. Un proceso que falle se repite con la misma semilla.
- **Unidad:** el mundo. Cada comparación empareja los dos jueces en el mismo mundo, y las familias pesan igual.
- **Contrastes:** cinco contrastes de superioridad unilaterales por permutación de signos (20 000), con Holm, α 0,05:
  - H1a y H1b: frente a current y a la heurística, en invert + novel.
  - H2a y H2b: lo mismo en `composition`.
  - H4: frente a la ablación de horizonte 1, en invert + novel.
- **Intervalos:** 95 % por remuestreo de mundos.

## Criterios (fijados aquí; no se rebajan después)

1. **Mejora en las familias cambiantes:** media de al menos 0,05 frente a current y frente a la heurística, y H1a y H1b significativas tras Holm.
2. **Composición reservada:** H2a y H2b significativas.
3. **No inferioridad en `stable`** frente a current: la cota inferior unilateral del 95 % de la diferencia es mayor que −0,03.
4. **Horizonte:** H4 significativa. Si no lo es, el beneficio no se atribuye a planificar dos decisiones y se prefiere la versión de horizonte 1 si cumple lo demás.
5. **Coste:** tiempo de reloj por segundo simulado de `model-fixed` como mucho 1,5 veces el de current en la misma campaña. Se publica el tamaño del modelo.

## Resultados posibles (tabla del plan)

| Resultado | Acción |
|---|---|
| 1, 2, 3 y 5 se cumplen | Integrar la variante; la de horizonte 1 si 4 no se cumple |
| Mejor que current, no que la heurística | Preferir la alternativa simple |
| Intervalos que no deciden | Inconcluso; ausencia de evidencia no es equivalencia |
| Peor o demasiado costoso | Retirar del camino por defecto y publicar |
| Otro caso | Sin mejora útil demostrada |
