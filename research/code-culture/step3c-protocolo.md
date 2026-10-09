# Paso 3c: ¿aprende un linaje la regla de su mundo? (experimento decisivo; escrito antes de correr)

## Por qué

En los pasos 3 y 3b, lo útil (la cautela) lo traía el vocabulario del modelo y no la vida. La cautela es sentido común y sirve en cualquier mundo. Aquí la ventaja solo puede venir de lo vivido:
- cada linaje vive bajo una **regla arbitraria y propia**: un valor de un rasgo envenena (`rule.js`);
  - ejemplos: linaje 0, `color = red`; linaje 1, `shape = round`;
  - es la misma regla en todos sus mundos, pero las especies se sortean de nuevo en cada uno;
- ningún modelo puede saber qué valor es.

## Calibración (hecha antes de este protocolo; `rule-calibrate.js`)

**Veneno:** `HEALTH.poison` 200. Probar un bocado daña mucho pero rara vez mata.

**Bocados dañinos por vida**, en 4 reglas × 30 mundos:
- texto de cautela: 3,8;
- oráculo que conoce la regla: 0,5.

Esa distancia es la que un linaje solo puede recorrer aprendiendo de lo vivido. En supervivencia la distancia es pequeña: con este veneno casi todas viven. Por eso la medida principal son los bocados y el sondeo de la regla, no la supervivencia.

## Diseño

**Condiciones** (vocabulario normal; las acciones tienen su significado, así que el problema del ciego del 3b no aplica):

| condición | qué ve el modelo al reescribir |
|---|---|
| `rule-diary` | el texto de la madre y su diario |
| `rule-nodiary` (control) | solo el texto de la madre |

**Común a las dos:**
- torneo de 3;
- 10 linajes × 10 generaciones × 24 Fagis;
- mundos `cdev` con familias `stable` y `novel` (`novel` añade especies a mitad de la vida);
- `mutate` 0,2;
- generación 0 con el texto de cautela (`--start caution`): la cautela ya está dada; solo cuenta lo que se aprenda además;
- `HEALTH.poison` 200.

## Medidas (`step3c-analyze.js`)

1. **Principal, sondeo de la regla.** El texto mayoritario de la generación 9 se interroga sobre las 96 apariencias posibles, con el diario vacío y hambre 50. Puntuación: fracción de apariencias venenosas que deja menos fracción de las demás que deja.
   - oráculo: 1;
   - cautela: 0;
   - un texto que deja todo, o adivina al azar: alrededor de 0.
2. **Bocados dañinos por vida** del texto final en 60 mundos nuevos con la regla de su linaje, frente a la cautela y al oráculo en esos mismos mundos.
3. Supervivencia, como secundaria.

## Criterio de corte (decidido ahora)

- **Éxito:** en `rule-diary`, al menos 5 de 10 linajes con sondeo ≥ 0,5 **y** con bocados dañinos al menos a mitad de camino entre la cautela y el oráculo; además, `rule-nodiary` con claramente menos linajes así.
  - Querría decir que lo vivido llega al código, más allá del vocabulario del modelo. Es el resultado que el proyecto busca.
- **Fracaso:** menos de 3 de 10 en `rule-diary`.
  - Se cierra la línea "el modelo reescribe el código desde la vida" con este operador, y se pasa al paso 4 (formatos de transmisión).
- **Entre medias (3–4 de 10):** se informa como señal débil y se decide con el usuario. No se repite con ajustes.

## Predicción

`rule-diary` aprende la regla en una parte de los linajes, gracias a frases del diario del tipo "red … HARMED", que el modelo convierte en "deja lo rojo". `rule-nodiary` casi nunca, salvo por azar y selección.
