# Paso 4, piloto: resultados (2026-10-05)

Protocolo: `step4-piloto-protocolo.md` (7ec310d). 3 formatos × 6 linajes × 8 generaciones × 16 Fagis. La regla se siembra en la generación 0 y se invierte en la 4. Datos: `research/results/code-culture/lineages/f-{code,reasons,evidence}`. Análisis: `step4-analyze.js`.

## Respuesta

**No hay mito que medir: el conocimiento verdadero se borra antes de la inversión, igual en los tres formatos.**

Fracción de lo venenoso que el texto deja, media de las Fagis (generaciones 0 a 3, cuando la regla todavía es verdad):

| formato | g0 | g1 | g2 | g3 | reescrituras (g1–3) que borran la regla |
|---|---|---|---|---|---|
| `code` | 1.00 | 0.79 | 0.52 | 0.36 | 84 % |
| `reasons` | 1.00 | 0.83 | 0.57 | 0.30 | 70 % |
| `evidence` | 1.00 | 0.85 | 0.59 | 0.40 | 75 % |

- **En tres generaciones, los linajes pierden dos tercios de lo que sabían.** Los bocados dañinos suben de 0,6 a 2–3 por vida antes de que nada cambie en el mundo.
- **Ni las razones ni la evidencia lo frenan:**
  - con razones, el modelo borra la regla en el 70 % de las reescrituras, algo menos que sin ellas (84 %);
  - la población la pierde al mismo ritmo.
- **Tras la inversión** el "mito" sigue la misma caída (0,10–0,17 en g7). Ya no queda casi nada que creer, así que no hay trampa.
- **Lo nuevo no se aprende:** 0,04–0,15 en g7, como en el 3c.
- **La selección no defiende el conocimiento.** Con este veneno, lo que cuesta un bocado dañino casi no se nota en la supervivencia (supervivencia − `current` entre −0,07 y +0,07), así que el torneo no distingue a quien sabe la regla.

**La predicción falló:** se esperaba que las razones conservaran el mito más que el código y que la evidencia lo perdiera antes.

**Decisión, según el protocolo:** sin diferencias entre formatos, no se hace la campaña larga.

## Lectura

- **Un modelo como operador de la herencia cultural es un canal con pérdidas:** cada reescritura empuja el texto hacia lo que el modelo ya cree útil (la cautela genérica) y borra lo específico del linaje. Es el juego del teléfono descompuesto, con el modelo como atractor. Es un fenómeno ya descrito para cadenas de modelos de lenguaje. Aquí se ve en organismos que viven del código y con selección por supervivencia.
- **Junto con el 3c, el cuadro de la línea es coherente:**
  - el modelo trae su sentido común (paso 3);
  - no extrae reglas nuevas de la vida (paso 3c);
  - borra las que se le dan (paso 4).

  En las tres, lo que manda es lo que el modelo ya sabe, no lo que el linaje vive ni cómo se lo cuentan.
- **La comparación con el estudio de reglas** (razones frente a conclusiones, confirmado) **no se puede replicar con este operador:** en reglas, el canal copia fiel; aquí, el canal reescribe.
