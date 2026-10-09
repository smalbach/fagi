# Paso 3b: ¿llega la vida al código? (escrito antes de correr)

El paso 3 mostró que la cautela aparece cuando el modelo lee `harmed` ("veneno") y casi nunca en ciego. Ahí el modelo nunca veía un diario: reescribía el texto de la madre sin saber qué le pasó.

**Cambio único:** el modelo ve, además del texto de la madre, el diario de la vida que ella vivió con ese texto. En ciego, el diario son líneas de este tipo:

    t=… k=… t1=… t2=… t3=… amount … n1 antes->después

El prompt ciego ya dice que `n1` en 100 mata y pide mantenerlo bajo. El prompt no cambia: sigue en la v2, y el diario se presenta como "What happened in this life".

**Condición:** `blind`, torneo, `--diary`. 10 linajes × 24 Fagis con los mundos del paso 3 (`G` = 20), pero solo las generaciones 0–9 (`--until 10`, por coste). `mutate` 0,2.

**Comparación:** con `full-blind-tournament` del paso 3, sin diario, en los mismos mundos y generaciones.
1. **Población,** generaciones 5–9, menos `current`: diferencia pareada por linaje.
2. **Trasplante** del texto mayoritario en la generación 9 a 120 mundos nuevos (`cdev` 5000–5119), en las dos condiciones.
3. **Descriptivo:** cuántos textos finales evitan una clase `k` después de que `n1` subiera con ella, leyendo el texto.

**Predicción:** con diario, el ciego encuentra en algunos linajes algo equivalente a "evitar lo que subió `n1`" y supera a la versión sin diario en el trasplante, sin llegar al nivel de `plain`. Si no lo encuentra, el modelo no extrae reglas de lo que ve, y la auto-reescritura con este operador queda limitada a lo que el modelo ya sabe.
