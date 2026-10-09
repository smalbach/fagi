# Preregistro: el estudio de razones frente a conclusiones, igualado por información

Estado: congelado en el commit que añade este archivo, antes de correr ninguna semilla de confirmación (4001–4200).

## Por qué

**El estudio principal** (`preregistration.md`, resultados en `results.md`: 11/11 en el laboratorio y 3/3 en el juego) igualó los formatos por **ítems**: una regla, una conclusión o un bocado cuentan uno cada uno. Dejó escrito como limitación que no se igualaba la información. Es la objeción más obvia: una regla sobre un rasgo ("lo ácido enferma") habla de varias especies, y una conclusión ("no comas la gota roja") de una sola.

**El nuevo modo de presupuesto** (`SOCIAL.cost = 'coverage'`, en `src/social.js`) cuenta cuántas especies del mundo cubre cada ítem. Cuestan 1:
- una conclusión;
- una regla sobre una fruta;
- un bocado.

Una regla sobre un rasgo cuesta tantas como especies lo tienen. Con el modo `items` (el de siempre), el estudio principal se reproduce idéntico: se volvió a correr y la tabla confirmatoria salió igual.

**Desarrollo** (`research/designs/coverage-dev.json`, semillas 3001–3060, exploratorio). Con inversión y química de un rasgo:
- la ventaja de supervivencia de las conclusiones (H2a) cae de 0,274 a 0,007 [−0,063, 0,080];
- los mitos de las razones (H3) se mantienen: 0,95;
- la evidencia sigue cortando mitos (H4a): 2,06;
- la ventaja de las razones al enseñar (H1) cae de 0,224 a 0,027 [−0,003, 0,057].

## Diseño

- **Dos campañas**, iguales salvo el presupuesto:
  - `research/designs/coverage-items.json`, con `SOCIAL.cost = items`;
  - `research/designs/coverage-coverage.json`, con `SOCIAL.cost = coverage`.
- **Formatos:** `none`, `verdict`, `rule` y `evidence`.
- **Mundo:** química de un rasgo, inversión en la generación 6, 12 generaciones, vidas de 1800 s, 3 frutas a la vez, presupuesto 4.
- **Linajes:** 200 por celda, semillas **4001–4200**, nunca usadas. Pareados por semilla, dentro de cada campaña y entre ellas.

## Hipótesis (unilaterales; Holm sobre las seis, α = 0,05; `research/confirm-coverage.js`)

| id | afirmación | diferencia por linaje |
|---|---|---|
| C0 | con ítems, las razones dejan menos supervivientes que las conclusiones en la inversión (H2a, replicado en semillas nuevas) | `shock.alive`: verdict − rule |
| C1 | esa brecha es mayor con ítems que con cobertura: la trampa de supervivencia depende de cuánto se transmite | (verdict − rule)ítems − (verdict − rule)cobertura |
| C2 | con cobertura, las razones llevan más mitos a la inversión que las conclusiones | `shock.myths`: rule − verdict |
| C3 | con cobertura, la evidencia lleva menos mitos que las razones | `shock.myths`: rule − evidence |
| C4 | con cobertura, la evidencia enseña mejor que las conclusiones en el mundo estable | `stable.harm`: verdict − evidence |
| C5 | con cobertura, las razones enseñan mejor que las conclusiones en el mundo estable | `stable.harm`: verdict − rule |

Prueba: permutación por cambio de signo sobre las diferencias pareadas, 10 000 permutaciones.

**Descriptivo preregistrado:** con cobertura, verdict − rule en `shock.alive`, con IC 95 % por bootstrap.

## Predicción (de desarrollo)

- C0, C1, C2, C3 y C4 se sostienen.
- C5 es dudosa: en desarrollo, el efecto fue pequeño y su IC tocaba 0.
- La brecha de supervivencia con cobertura será cercana a 0: IC que incluye 0, con cota superior por debajo de 0,10.

## Cómo se leerá

- **Si C1 se sostiene y la brecha con cobertura incluye 0:** la trampa de supervivencia del estudio principal es, en su mayor parte, efecto de que las razones transmiten más información. Lo que es propio del formato, a igual información, son los **mitos**: las razones llevan más creencias falsas (C2) y la evidencia las corta (C3). Esas falsas creencias, a igual información, ya no matan más.
- **Si C1 no se sostiene:** la trampa no depende de la cantidad y el hallazgo principal se refuerza.
- Un nulo o un resultado al revés se publica igual.
