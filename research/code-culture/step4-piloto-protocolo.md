# Paso 4, piloto: formatos de transmisión y mitos (escrito antes de correr)

Pregunta del plan: cuando lo que se hereda es código, ¿el formato de transmisión decide si un linaje queda atrapado en un mito cuando el mundo cambia? Los formatos:
- solo el código (una conclusión);
- el código con las razones de la madre;
- el código con la evidencia que la madre vivió.

Con reglas, el proyecto ya confirmó (11/11 en el laboratorio, 3/3 en el juego) que las razones enseñan mejor y atrapan más en mitos tras una inversión, y que la evidencia corta los mitos sin eliminarlos.

**Lo que cambia frente al plan, por el paso 3c:** el modelo no descubre la regla desde la vida. Por eso el conocimiento se siembra:
- la generación 0 nace sabiendo la regla de su linaje: el oráculo (`rule.js`), por ejemplo "deja lo rojo";
- con razones, la generación 0 hereda además el porqué (`oracleWhy`);
- en la generación 4 la regla se invierte: lo rojo pasa a alimentar y el valor que alimentaba pasa a envenenar.

Dejar lo rojo pasa a ser el **mito**: una creencia heredada que ya no es verdad.

**Formatos** (`--format`), todos con torneo de 3:

| formato | además del texto de la madre, el modelo ve |
|---|---|
| `code` | nada más |
| `reasons` | las razones de la madre: las del oráculo en la generación 0; luego, la explicación que el modelo dio al reescribir, heredada sin cambios cuando no se reescribe |
| `evidence` | el diario de la madre |

**Común a los tres:**
- piloto: 6 linajes × 8 generaciones × 16 Fagis;
- `mutate` 0,3;
- `HEALTH.poison` 200, familias `stable` y `novel`, mundos `cdev`.

Presupuesto no igualado entre formatos: es un piloto y se dice así.

**Medidas por generación** (`step4-analyze.js`):
- **mito:** fracción de apariencias del antiguo veneno que el texto deja, con el diario vacío;
- **nuevo:** fracción de apariencias del nuevo veneno que deja;
- bocados dañinos;
- supervivencia menos `current`.

**Predicción**, por el estudio de reglas:
- en la generación 3, antes de invertir, el mito vale lo mismo que el conocimiento, y `reasons` lo conserva más que `code`;
- después de la inversión, `reasons` mantiene el mito más tiempo que `code`;
- `evidence` lo pierde más rápido, porque el diario muestra lo nuevo que daña, aunque nunca muestra que lo rojo ya alimenta (la madre no lo come);
- "nuevo" se queda cerca de 0 en todos, como en el 3c.

**Lectura del piloto:** decidir si hay mitos que medir. Si no aparecen diferencias entre formatos, no se hace la campaña larga.
