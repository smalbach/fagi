# Diagnóstico: ¿por qué la colonia no crece como se espera?

2026-10-02. Código de `main` (`675c2f5`): `src/reproduction.js`, `src/lifecycle.js`, `LIFE` en `src/config.js`.

**Observación del usuario.** Con 4 Fagis debería haber al menos 2 huevos. Al nacer y ser 6, debería haber 3 huevos o más, y así sucesivamente. En el juego no pasa.

**Respuesta corta.** La reproducción en sí **sí crece de forma geométrica**: con el nido sin tope, la colonia se duplica cada ~600–900 s. Lo que el usuario ve es otra cosa: con los valores por defecto, **el nido admite 16 (huevos incluidos) y el "nido lleno" empieza a frenar la cría desde 4 individuos**, es decir, desde el principio. Por eso el crecimiento parece lineal y se para en 15–16. Además, cada apareamiento da **un solo huevo**, y las recién nacidas tardan 360 s en poder criar.

## 1. Cómo funciona hoy (cada paso, `matings()` y `ready()`)

Una hembra pone un huevo solo si se cumple **todo** esto a la vez:

1. Es adulta: las juveniles tardan `adultAt` = **360 s**; en la senectud la fertilidad baja.
2. Está **dentro del nido**, en el mismo instante que un macho adulto también listo.
3. Ya pasó su recuperación desde el último huevo: `femaleRecover` = **360 s** × **crowding** / fertilidad. Su **primera** cría también espera `360 × (crowding − 1)`.
4. Energía ≥ 60 %, hambre y sed < 45 %, sin estrés térmico y sana.
5. Cree que la despensa tiene ≥ 2 raciones comestibles.
6. El macho no es pariente cercano (`kinLimit` 0,5: ni padres ni hermanos).
7. **Población viva + huevos < `maxPopulation` = 16.**

Cada apareamiento produce **1 huevo** (no existe el tamaño de puesta). El huevo incuba **240 s** (más lento si el nido está frío) y para eclosionar consume 1 ración de la despensa.

`crowding(n)` (`LIFE.gradual` = 1) frena **todas** las crías en cuanto el nido supera ¼ de su capacidad:

| vivos + huevos | 4 | 6 | 8 | 10 | 12 | 14 | 15 |
|---|---|---|---|---|---|---|---|
| multiplicador de la recuperación | 1,00 | 1,03 | 1,13 | 1,33 | 1,80 | 3,27 | 6,26 |
| recuperación de la hembra | 360 s | 370 s | 405 s | 480 s | 650 s | 1180 s | 2250 s |

## 2. Lo que se midió

Script de diagnóstico (en el scratchpad de la sesión, no en el repo). Mapa 42, `dt` 0,1, 5400 s, colonia de 4 fundadores, con todo el organismo encendido y con solo `LIFE` + `SEX`. Cada 5 s se anota, para cada hembra viva, **la primera condición que le impide criar**.

### Crecimiento con los valores por defecto (organismo, 3 semillas)

| t (s) | 300 | 600 | 900 | 1200 | 1500 | 1800 | 2400 | 3000 | 3900 |
|---|---|---|---|---|---|---|---|---|---|
| vivos, semilla 1 | 4 (+2 huevos) | 6 | 8 | 11 | 11 | 13 | 15 | 15 | 16 |
| vivos, semilla 2 | 4 (+2 huevos) | 6 | 8 | 9 | 10 | 11 | 13 | 14 | 15 |
| vivos, semilla 3 | 4 (+2 huevos) | 6 | 8 | 9 | 12 | 13 | 14 | 15 | 16 |

- **Al principio funciona como el usuario espera:** 4 Fagis dan 2 huevos hacia t ≈ 300 s.
- **Luego cae a ~1 nacimiento cada 300 s** y se planta en 15–16.
- En la semilla 2 nacieron muchos machos: llegó a 2 hembras frente a 7 machos. Como cada huevo depende de una hembra, **la cría la limita el número de hembras, no el de parejas**.

### Qué bloquea a las hembras (fracción del tiempo)

| condición | organismo, semilla 1 | organismo, semilla 2 | solo LIFE |
|---|---|---|---|
| no está en el nido | 60 % | 61 % | 79 % |
| se recupera del último huevo (× crowding) | 21 % | 19 % | 9 % |
| espera de su primera cría por el nido lleno | 11 % | 10 % | 4 % |
| aún es juvenil | 7 % | 10 % | 8 % |
| energía, necesidades, despensa, parentesco | < 1 % | < 1 % | < 1 % |

Lectura:
- Las necesidades y la despensa casi nunca bloquean.
- Lo que bloquea es el **tiempo**: forrajear fuera del nido, recuperarse (inflado por el nido lleno) y madurar.

### Contrafactuales (organismo, 3 semillas; vivos en t = 1800 / 3000 / 3600 s)

| cambio | 1800 s | 3000 s | 3600 s |
|---|---|---|---|
| ninguno (tope 16, frena desde 4) | 13–16 | 14–15 | 15–16 |
| `maxPopulation` = 60 | 16–17 | 38–42 | 48–50 |
| tope 60 y `gradual` = 0 (sin freno por nido lleno) | 16–17 | 42–48 | **60 (lleno)** |
| lo anterior y `femaleRecover` = 120 | 21–40 | 60 (lleno) | 60 (lleno desde ~2700 s) |

Con el tope alto, la colonia **se duplica cada ~600–900 s**, que es el crecimiento geométrico que el usuario esperaba. **No hay un error en la mecánica de cría: son los parámetros y el freno por densidad.**

## 3. Por qué no se ve "3 huevos con 6 Fagis"

1. **Las 2 recién nacidas son juveniles durante 360 s** (2 días de juego): no cuentan como reproductoras.
2. **Las 2 madres están en recuperación 360 s** desde su huevo, y el nido ya va por 6 (crowding 1,03).
3. **1 huevo por apareamiento.** Una pareja nunca da 2 huevos a la vez; dos hembras listas, sí.
4. Cuando las juveniles maduran (~t 900–1000), el nido va por 8–10 (crowding 1,13–1,33) y su primera cría espera además `360 × (crowding − 1)`.
5. A partir de ~12 el freno crece rápido (×1,8; ×3,3; ×6,3) y el tope de 16, **huevos incluidos**, corta en seco.

**Tiempo de generación** = 240 s de incubación + 360 s de juvenil + espera hasta el primer apareamiento. Son unos **600–900 s**: lo bastante largo para que a simple vista parezca que "no pasa nada".

## 4. ¿Es un problema de realismo?

| aspecto | hoy | en la naturaleza |
|---|---|---|
| freno por densidad | por **número de individuos**, empieza al 25 % de un tope fijo | por **recursos** (comida, espacio, enfermedad): crecimiento logístico ligado a lo que hay |
| tope | 16 fijo, huevos incluidos | capacidad de carga que sale del ambiente |
| puesta | 1 huevo por apareamiento | las hembras de insecto ponen tandas de huevos |
| quién cría | cualquier hembra adulta (modelo "pareja") | en hormigas reales cría una reina y las obreras no; Fagi no es una hormiga literal |

El freno logístico es realista en sí. Lo que no lo es tanto:
- que empiece por **conteo** en lugar de por **comida**;
- que lo haga tan pronto (desde 4);
- que el tope sea un número fijo.

## 5. Opciones (no aplicadas; decide el usuario)

1. **Solo ajustar parámetros** en la configuración (no toca código): subir `maxPopulation` (p. ej. 40–60), lo que ya da crecimiento geométrico visible.
2. **Freno que empiece más tarde**: que `crowding` arranque al 50–60 % del tope en vez del 25 %. Es un cambio de una constante en `crowding()`.
3. **Tamaño de puesta** `LIFE.clutch` (1 por defecto, para no cambiar nada): 1–3 huevos por apareamiento según la energía y la despensa de la madre.
4. **Freno por recursos** en lugar de por conteo: la capacidad de carga sale de la despensa y la fruta disponible por individuo. Es lo más realista y encaja con el cuerpo evolutivo (fase 5), donde la fecundidad es un coste de los rasgos (Kotrschal 2013: cerebro mayor, −19 % de crías).
5. Mostrar en el inspector **por qué no crían** (la tabla de bloqueos de arriba), para que la observación del juego sea legible.

Cualquier cambio debe ir detrás de una bandera o con valores por defecto iguales a los de hoy: los estudios preregistrados usan estos parámetros.
