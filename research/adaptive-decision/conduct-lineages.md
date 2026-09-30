# Reglas de conducta, paso 3b: aprender entre vidas (desarrollo)

Plan: `docs/research/plan-reglas-de-conducta.md`, revisión 1. Grupo `lin` (semillas 47000 + n, mapas 2400000 + 89 n), cada vida en un mundo propio. Por modo: 10 linajes × 20 generaciones × 12 Fagis = 2400 vidas. Las familias se turnan por mundo. Datos por vida: `research/results/adaptive-decision/lineages/lineages.csv`. Análisis: `node research/adaptive-decision/lineage-analyze.js`. No es confirmatorio.

## Qué se construyó

- **`lineages.js`.** Cada cría nace con las líneas de conducta vivas de una madre de la generación anterior, con lo que cada línea había acumulado (bocados a favor, en contra, balance y número de vidas). La memoria de bocados no se hereda.
  - La madre se elige con probabilidad proporcional a lo que vivió (`select`) o al azar (`random`).
  - `current` y la heurística fija corren en los mismos mundos, para comparar pareado.
- **`CONDUCT.inherit`.** Las líneas heredadas se siguen juzgando: lo que vive cada hija se suma a lo que traía la línea.
- **v2, `CONDUCT.declined`.** Cada fruto que deja por una línea, teniendo hambre para comerlo, queda registrado. La línea responde por esa comida perdida, estimada con sus propios bocados.
- **Corrección de la aplicación de "dejar"**, hallada en desarrollo. Significa no comerlo; puede seguir llevándolo al nido, salvo especies que la dañaron. El paso 2 da los mismos resultados (18 de 18 episodios idénticos).

## Resultado: las dos variantes se hunden

Supervivencia por generación (media de linajes y hermanas):

| | g0 | g1 | g5 | g10 | g19 | Últimas 5 − `current` (mismos mundos) |
|---|---|---|---|---|---|---|
| `current` | 0,843 | 0,869 | 0,827 | 0,835 | 0,833 | — |
| heurística fija | 0,926 | 0,914 | 0,919 | 0,882 | 0,843 | **+0,044** [0,029, 0,058] |
| v1 selección | 0,805 | 0,638 | 0,628 | 0,638 | 0,610 | −0,229 |
| v1 madre al azar | 0,805 | 0,627 | 0,615 | 0,615 | 0,579 | −0,248 |
| v2 selección | 0,830 | 0,660 | 0,657 | 0,646 | 0,628 | −0,228 |
| v2 madre al azar | 0,830 | 0,661 | 0,674 | 0,661 | 0,623 | −0,224 |

(Unidad de análisis: el linaje, 10 por modo.)

Qué pasa (v2 con selección):

| | g0 | g1 | g5 | g19 |
|---|---|---|---|---|
| Vivas al final (de 120) | 65 | 32 | 20 | 5 |
| Muertas de hambre (de 120) | 3 | 14 | 55 | 91 |
| Bocados por vida | 11,5 | 5,4 | 2,8 | 0,5 |

En la generación 19, "no comas nada nuevo" está en el 88 % de las Fagis y "con hambre < 45, no comas" en el 98 %.

## Por qué

- **Heredar una prohibición es heredar ceguera.** Una cría nace sin conocer ninguna especie: para ella todo es nuevo. "No comas lo nuevo", útil para quien ya conoce algunas especies, en quien nace significa no comer nunca.
- **Lo que prohíbe no produce datos.** Sin bocados no hay nada que la contradiga. Tampoco sirve la v2: lo que habría obtenido se estima con sus bocados de esa especie o de especies nuevas, y no los tiene. La línea se sostiene sola.
- **La selección no tiene con qué trabajar.** Casi todas las madres de la generación 0 escribieron alguna prohibición. Desde la generación 1 todas la llevan, así que elegir a las que más vivieron no la elimina (selección y azar dan igual: −0,228 y −0,224).
- **Lo que funciona no se hereda porque no se escribe.** "Probar lo nuevo" aparece en el 2-3 % de las Fagis al final. El filtro, que juzga cada bocado por separado, nunca lo prefiere a "dejar".

## Lectura

Con las dos variantes permitidas, **el paso 3b no se cumple, y empeora**: heredar las líneas que ella escribe hunde a sus descendientes (−0,23). Para el objetivo de fondo, que su conducta salga de lo que aprende, esto dice algo concreto:

1. **Una regla que prohíbe necesita una salida.** Los animales siguen probando, aunque sea poco, lo que evitan; el juicio actual de Fagi tiene curiosidad (`curiosityTries`). Las reglas de conducta la anulaban. Sin exploración, toda prohibición es para siempre.
2. **Qué se hereda importa más que cómo se juzga.** Heredar prohibiciones sin haber vivido la experiencia que las justificó es transmitir un mito, algo que el proyecto ya estudia (`scripts/batch/run.js`). Heredar disposiciones, como "prueba con cautela", sería más prudente que heredar prohibiciones.
3. **El descubrimiento necesita reconocer la cautela como útil.** Probar vale por lo que enseña a lo largo de muchas vidas, no en el repaso de un bocado. El filtro actual no puede verlo.

Cualquiera de esos cambios es una revisión del plan, no un ajuste, y se deja a decisión de la persona.

---

# Revisión 2: prohibiciones con salida (desarrollo)

Plan: `docs/research/plan-reglas-de-conducta.md`, revisión 2. Mismos mundos `lin` y mismo diseño (10 linajes × 20 generaciones × 12).

- **Variante 1 (`select-v3`).**
  - Toda prohibición tiene salida: con hambre entre 45 y 75, rompe una línea de "dejar" con un bocado de prueba el 20 % de las veces (`CONDUCT.explore`).
  - Entre candidatas casi iguales gana la que habla de la especie (`CONDUCT.kindFirst`).
  - Hacen falta 3 bocados dañinos a favor.
- **Variante 2 (`select-v4`, `random-v4`).** Lo mismo y, además, cada línea que heredaría una cría se pierde al nacer con probabilidad 0,2 (mutación), para que las hermanas difieran y la selección tenga variación.

| | g0 | g1 | g19 | Últimas 5 − `current` |
|---|---|---|---|---|
| v2 del paso 3b (referencia) | 0,830 | 0,660 | 0,628 | −0,228 |
| Revisión 2, variante 1 | 0,811 | 0,708 | 0,579 | −0,254 [−0,276, −0,232] |
| Revisión 2, variante 2, selección | 0,811 | 0,707 | 0,603 | −0,232 [−0,253, −0,211] |
| Revisión 2, variante 2, madre al azar | 0,811 | 0,678 | 0,602 | −0,245 |
| heurística fija | 0,926 | 0,914 | 0,843 | +0,044 |

**Ninguna variante mejora; la revisión 2 no se cumple.**

- **La salida funciona como mecanismo:** rompe de 7 a 8 prohibiciones por vida con un bocado de prueba. Pero no basta, porque el filtro sigue aprobando prohibiciones con muchos más frutos dejados en contra que bocados dañinos a favor.
- **El fallo empieza antes de heredar nada.** En la generación 0 (sin herencia), aprender con este filtro ya deja a la Fagi peor que la actual (0,811 frente a 0,843) y con 20 muertes de hambre de 120, frente a ~2. La herencia lo amplifica; no lo crea.
- **Por qué el filtro aprueba prohibiciones dañinas.** Lo que cuesta dejar un fruto lo estima con sus propios bocados, y sus bocados son los que rompieron prohibiciones, sobre todo de especies dañinas. Sus datos le dicen que comer no compensa. Es un sesgo de muestra, no de valoración.
- **La mutación no alcanza.** Cada cría vuelve a escribir las mismas prohibiciones en su propia vida, así que quitar líneas al nacer se compensa enseguida (en la generación 19 lleva 5 heredadas y 2 propias).

## Lectura de todo el ciclo

Seis variantes de "que las escriba ella" (dos en una vida, dos entre vidas, dos con salida) quedan por debajo de la Fagi actual. Lo común a todas es el filtro: juzgar una línea repasando sus propios bocados. Con pocos bocados y esa muestra sesgada, las prohibiciones siempre parecen buenas.

La gramática sí sirve: con las dos líneas correctas escritas a mano, la Fagi mejora y ya está en el juego (`docs/research/caution-protocol.md`). Lo que no se ha logrado es que ella las encuentre. Una salida que no pasa por ese filtro sería que las líneas aparezcan y desaparezcan al azar en la herencia y que solo la supervivencia las seleccione: evolución de reglas, sin juicio interno. Es otro experimento.
