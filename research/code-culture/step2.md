# Paso 2: el modelo como operador de variación

Datos: `research/results/code-culture/viability/v2-qwen3.6` (`texts.json` guarda cada texto y su motivo; las vidas, una por archivo, no se suben). Todas las llamadas están en `research/results/code-culture/archive.jsonl`. Generado por `research/code-culture/viability.js` y `viability-analyze.js`. Código: `research/code-culture/{archive,model,mutate}.js`.

## Diseño

- **Modelo:** `qwen3.6` (Ollama 0.34.4; MoE de 36 B, Q4_K_M; digest `07d35212591f…`), temperatura 0,7, sin razonamiento visible y una semilla por mundo. Se eligió por velocidad, tras una prueba con un mundo:
  - `qwen3.6`: 5–18 s por llamada;
  - `qwen3.8` (denso de 27 B): 13–49 s;
  - `gemma4`: textos demasiado largos.
- **Mundos:** `cdev`, 40 por familia (120). El plan proponía mapas 2800000+107i y 2900000+109i, pero chocaban 148 veces con mapas ya usados. Se usan **semillas 70000+i y mapas 4000000+107i** (`cconf`: 90000+i, 5000000+109i), sin choques.
- **Por mundo:**
  1. una vida con el texto semilla, que es la misma vida que `current`, deja su diario;
  2. el modelo escribe cuatro jueces;
  3. cada juez vive ese mundo desde el nacimiento.
- **Los cuatro jueces:**
  - `zero-shot`: lo escribe solo con la descripción del problema;
  - `revise`: reescribe la semilla a partir del diario;
  - `zero-shot-blind` y `revise-blind`: lo mismo con nombres neutros (`a1..a4`, `n1..n5`, `t1..t3` con valores `v1..`). Un adaptador traduce dentro del juez.
- **Validez:** un texto vale si compila y responde los cuatro casos de forma sin fallar. Si no, se queda el padre.
- **Prompt:** dos versiones, el máximo del plan. La v1 fue solo una prueba con 3 mundos: en 2 de 12 textos el modelo cambió los parámetros de la función y escribió uno demasiado largo. La v2 exige la firma exacta y código corto.
- **Una llamada colgada:** una tardó 85 min, probablemente con el equipo dormido. Ahora cada llamada tiene un límite de 5 min y se repite con la misma semilla.

## Resultado

`current`: supervivencia 0,837.

| juez | válidos | vidas con fallos al ejecutar | s/llamada | supervivencia | − `current` (pareado) |
|---|---|---|---|---|---|
| `zero-shot` | 116/120 (97 %) | 1/116 | 8,7 | 0,760 | −0,079 [−0,128, −0,014] |
| `zero-shot-blind` | 109/120 (91 %) | 0/109 | 8,8 | 0,616 | −0,211 [−0,274, −0,151] |
| `revise` | 97/120 (81 %) | 2/97 | 7,6 | 0,808 | −0,059 [−0,112, −0,006] |
| `revise-blind` | 97/120 (81 %) | 2/97 | 9,8 | 0,738 | −0,094 [−0,148, −0,045] |

**Puerta** (≥ 80 % de textos válidos y < 10 % de fallos al ejecutar): **pasa en los cuatro**, `revise` justo (81 %).
- `revise` falla casi siempre porque el texto no recibe el diario como debe: lo pide con otro nombre, como `obs.diary`, o con menos parámetros (22 de 23 fallos).
- `revise-blind` falla porque el texto queda demasiado largo (18) o sin bloque de código (5).
- Un texto rechazado no daña: en la evolución, es una mutación que no prospera.

## Lectura

- **Ningún juez escrito por el modelo supera a `current` de entrada.** Lo que el modelo sabe sin vida (`zero-shot`) cuesta 0,08. Con los nombres neutros cuesta 0,21: el vocabulario ("veneno", "probar") le sirve de algo, pero no basta.
- **El diario ayuda.** `revise` queda 0,02 por encima de `zero-shot`, y también lo hace mejor en ciego. Los textos nombran menos valores de rasgos ("si es rojo…": 8 de 97 frente a 14 de 116) y siguen más el instinto (23 de 97 frente a 11 de 116).
- **Lo importante para el paso 3: la variación existe.** Frente a `current` mundo a mundo, `revise` es mejor en 22, peor en 31 e igual en 44. Un operador que a veces mejora y a menudo empeora es justo lo que la selección necesita: el paso 0 ya mostró que en estos mundos el torneo extiende lo que paga. Que un texto suelto pierda de media no dice nada de lo que hará un linaje con selección.
- **Coste:** ~8 s por llamada. Una campaña del paso 3 (K = 12, G = 20, 10 linajes = 2400 nacimientos, una reescritura por nacimiento) son ~5–6 h de modelo por condición.

## Cambio para el paso 3

La prueba de forma ahora también pregunta a `wants`, que se llama mucho más que `ground`. Con ella, 2 de los textos válidos de esta corrida habrían quedado fuera.
