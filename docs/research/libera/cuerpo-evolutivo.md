# Cuerpo evolutivo: rasgos heredables con costes, plasticidad y límites físicos

Estado: pasos 1–6 y estaciones **en `main`** (`b649c6a`); falta la batería G1–G5. Es la fase 5 de LIBERA (`README.md`). Idea del usuario, 2026-10-02.

| paso | estado |
|---|---|
| 1. coste sin cambios (todos los rasgos en 1 = hoy) | ✅ `6f47ccd` (`src/morph.js`, bloque `MORPH`) |
| 2. genes y mutación (clonal y sexual, fundadoras con variación) | ✅ `6f47ccd` |
| 3. beneficios conectados (memoria, digestión y veneno, velocidad, vista, olfato, vida, cría) | ✅ `6f47ccd` |
| 6. sprite, inspector y ajustes | ✅ `3edab8f` |
| encendido en el juego (la investigación lo deja apagado) | ✅ `91702b6` |
| 4. plasticidad en vida (músculo ↔ caminar, estómago ↔ bocados/día, cerebro ↔ tiempo forrajeando, ojos ↔ luz, antenas ↔ olores, tamaño ↔ nutrición juvenil; ±25 % del gen, crecer cuesta hambre) | ✅ rama `feat/evolving-body` |
| 5. herencia darwin / baldwin / epigenética (`MORPH.inherit` 0/1/2; Baldwin: gen `plastic` con coste; epigenética: marca de lo vivido por ambos padres, se conserva el 70 % por generación) | ✅ `baca8fa` |
| presión de selección: estaciones (`SEASONS`, Bergmann vía `insulation`), encendidas en el juego | ✅ `109ccbb`, `eedce29`, `b649c6a` |
| batería de estaciones 3 modos × predecible/impredecible × 3 semillas | ✅ `notes/bateria-estaciones.md`: selección por frío; epigenético mejor en ambas; G3 sin probar (el cambio no invierte dirección) |
| años cálidos o fríos, calor ∝ tamaño (`MORPH.oxygen`), regla temperatura-tamaño, umbral "enough" (sin experiencia suficiente el órgano no cambia) | ✅ `b2a14a3` |
| G3 (90 corridas, protocolo congelado) | ✅ `notes/bateria-g3-resultados.md`: el tamaño sigue al año en los tres modos; de Bruin no se confirma; solo el tamaño cambia por selección, el resto se mantiene |
| G3b: años con la fruta lejos o cerca, músculo y antenas de las adultas (`a0b5558`, 90 corridas) | ✅ `notes/bateria-g3b-resultados.md`: el cuerpo se queda como nació (la experiencia del músculo no pasa el umbral); los modos no se separan; de Bruin no se confirma |
| 7. resto de G1–G5 | pendiente |

Primera corrida (juego, semilla 1, 22 000 s, 16 generaciones, población estable de ~50):
- el músculo baja de 0,97 a 0,91;
- el cerebro sube a 1,10 y luego baja a 1,04;
- el tamaño baja un poco.

Todas las muertes fueron por edad: en el mapa del juego **sobra comida y la selección es débil**. Hay que calibrarlo antes de sacar conclusiones.

> Como en la evolución, no solo se pasa conocimiento: también hay pequeños cambios en el cuerpo. Un estómago más
> fuerte, músculos más eficientes, un cerebro más grande… cada uno con sus pros y sus contras. Un cerebro más capaz
> decide mejor pero gasta más energía. La experiencia también cambia el cuerpo. El cambio se ve: más cerebro, más
> cabezona. Y hay límites físicos: demasiado grande deja de ser viable.

Decisiones del usuario (2026-10-02):
- **Herencia de lo adquirido:** comparar tres modos (Darwin, Baldwin, epigenético).
- **Selección:** natural en el juego y torneo en las baterías.
- **Rasgos:** cerebro, estómago, músculos, sentidos y tamaño.

Literatura con cifras: `notes/cuerpo-evolutivo-literatura.md`.

## 1. Qué existe ya (código en `main`)

| pieza | dónde | estado |
|---|---|---|
| Genoma `{ cues, body, forage }` | `src/generations.js:42` | existe |
| Rasgos corporales `speed, energyMax, metabolism, insulation` | `src/biology.js:16` | existe; multiplicadores dentro de `GEN.bodyRange` [0,8; 1,25] |
| Mutación del cuerpo | `src/generations.js:100` (`recombine`) | **solo en reproducción sexual**: `mutate()` (clonal) no muta `body` |
| Coste energético por rasgo | `src/needs.js` (`metabolism` × consumo) | solo `metabolism`; **ningún rasgo cuesta por tenerlo** |
| Sexo × genes | `src/biology.js:29` (`bodyFor`) | existe |
| Colonia, cría, parentesco | `src/reproduction.js`, `src/lifecycle.js`, `LIFE` | existe |
| Cultura (reglas, programa) | `src/generations.js` (`teach`, `teachProgram`) | existe |
| Sprite por partes | `src/fagi-sprite.js`, `fagi-sprite/body.js` | varía con sexo, edad, hambre (gáster) y temperatura; **no con genes** |
| Plasticidad corporal | — | **no existe** (solo postura y llenado del gáster) |

## 2. El modelo

### 2.1 Genotipo y fenotipo

Cada rasgo tiene tres partes:
- **gen** `g`: heredado; muta con un paso gaussiano.
- **plasticidad** `p`: cambio adquirido en vida, acotado a ±`P.max` alrededor del gen.
- **marca epigenética** `e`: solo en el modo epigenético; parte de lo que la madre adquirió.

```
fenotipo = clamp(g + e + p, límite físico)      (en múltiplos de la especie, 1 = Fagi de hoy)
```

### 2.2 Rasgos: beneficio, coste, límite y se ve como

Todo coste se paga en **energía** (más hambre o más consumo) o en **ciclo de vida** (fecundidad, longevidad), como en la biología.

| rasgo | beneficio en Fagi | coste | límite físico | plasticidad en vida | se ve como |
|---|---|---|---|---|---|
| **cerebro** `brain` | más memoria (`MEMORY`), más líneas propias (`PROGRAM.maxOwn`), mejor evaluación (`imagine`), menos ruido al elegir. **Saturante**, no lineal (Chittka & Niven 2009) | coste basal ~18× el de un gramo de músculo (Elia 1992) más un coste por uso (Attwell & Laughlin 2001); **menos intestino, menos crías y menos vida** (Kotrschal 2013: +9 % de cerebro → −8/−20 % de intestino, −19 % de crías; 2019: −22 % de vida) | regla de Haller con piso (Seid 2011) | crece con la experiencia de forrajeo, no con la edad (Withers 1993; Stieb 2010 en hormigas) | cabeza más grande |
| **estómago** `gut` | más energía por bocado y tolerancia a toxinas (`TASTE`, venenos) | tejido caro; compite con el cerebro dentro de la especie (Kotrschal), no siempre entre especies (Navarrete 2011) | fracción máxima del cuerpo (~10 %, Dekinga 2001) | **reversible con la dieta**: +47 % en ~6 días con comida dura, −40 % en ~8,5 días con blanda (Dekinga 2001) | gáster más grande |
| **músculos** `muscle` | velocidad y resistencia (`speed`, `energyMax` existentes) | construcción y mantenimiento; compite con la fecundidad (Marden 2000) | fracción mínima funcional y peso | crece con el uso; se gasta como reserva en el ayuno (Lindström 2000) | patas y tórax más gruesos |
| **ojos** `eyes` | `viewRange`, `fovDeg` | 5–15 % del metabolismo en reposo y coste fijo aunque no se usen (Moran 2015; Niven 2007) | cada unidad de información más cara (Niven 2007) | sin uso se pierde (peces cavernícolas, Moran 2015) | ojos más grandes |
| **antenas** `smell` | alcance del olfato | marco energía-información (Niven & Laughlin 2008) | igual que los ojos | análogo a los ojos | antenas más largas |
| **tamaño** `size` | reservas, fuerza, inercia térmica; menor coste por gramo (M^−¼) | metabolismo total ∝ M^¾ (Kleiber 1932) | **cuadrado-cubo y tráqueas ∝ M^1,29** (Harrison 2010): techo de tamaño | nutrición en la cría (escasez → adulto más pequeño) | escala del cuerpo |
| `insulation` (existe) | frío | calor | — | — | color o grosor |

### 2.3 Presupuesto energético único

```
gasto basal = Kleiber(size) × Σ_rasgo (coste_rasgo × fenotipo_rasgo × fracción_tejido)
gasto por uso = cerebro × actividad de decisión + músculo × movimiento + ojos/antenas × percepción
```

- Sustituye al multiplicador suelto `metabolism`. Con todos los rasgos en 1, el gasto es **idéntico** al de hoy.
- **Calibración:** cada coste se fija para que un rasgo en +25 % cueste lo que dice la literatura, en fracción del gasto basal.

### 2.4 Plasticidad (en vida)

Es una regla de uso en ventana lenta (días de juego):
- **músculo:** sube con la distancia recorrida;
- **estómago:** sube con la dureza o cantidad de lo comido y baja en el ayuno;
- **cerebro:** sube con las decisiones nuevas o los experimentos y baja sin uso;
- **ojos y antenas:** bajan sin uso.

Tiene dos límites: ±`P.max` alrededor del gen, y el límite físico. Cada cambio cuesta energía al construirse, que es lo que lo hace lento.

### 2.5 Herencia: tres modos que se comparan

| modo | qué hereda la hija | base |
|---|---|---|
| `darwin` | solo `g` mutado. Lo adquirido muere con la madre | estándar |
| `baldwin` | `g` mutado y **la propia capacidad plástica** (`P.max` y la tasa) como gen que evoluciona | Hinton & Nowlan 1987; Paenke 2007; Gupta 2021 |
| `epigenetic` | `g` mutado más `e = λ·p_madre`, que **decae por generación** (vida media ~4 generaciones, como *C. elegans*) | Moore 2019; Colicchio & Herman 2020; de Bruin 2026 |

Advertencias metodológicas:
- **Controles igualados** (Wu et al. 2026): la ventaja de heredar lo adquirido se encoge con buenos controles.
- **Gracia para mutantes nuevos** (Cheney 2018; Mertan & Cheney 2025): sin ella, la evolución descarta los cuerpos prometedores.

### 2.6 Selección

- **Juego:** selección natural. La colonia existente (`reproduction.js`) decide: quien vive y cría deja más hijas.
- **Baterías:** torneo de T (como `research/adaptive-decision/lineages.js`), para tener control experimental. Ablación: madre al azar.

### 2.7 Visual

`fagi-sprite` recibe el fenotipo:
- cabeza ∝ cerebro, con alometría tipo Wilson 1953;
- gáster ∝ estómago (más el llenado por hambre que ya existe);
- grosor de patas y tórax ∝ músculo;
- ojos ∝ `eyes`, longitud de antenas ∝ `smell`;
- escala global ∝ `size`.

Con todos los rasgos en 1 se dibuja exactamente igual que hoy. El inspector muestra los rasgos y su origen (gen, plasticidad, marca).

## 3. Hipótesis

| # | hipótesis | condiciones |
|---|---|---|
| G1 | Los rasgos divergen según el mundo: en mundos oscuros se pierden los ojos, en mundos tóxicos crece el estómago, con escasez se encoge el cerebro | familias de mundos × generaciones |
| G2 | El cerebro solo crece donde aprender paga (mundos que cambian o con frutas engañosas) | `invert` / `novel` frente a `stable` |
| G3 | **Baldwin acelera la adaptación corporal tras un cambio** frente a Darwin; el epigenético ayuda si el cambio es predecible y daña si no lo es | `darwin` / `baldwin` / `epigenetic` × cambio predecible o impredecible (de Bruin 2026) |
| G4 | **Cuerpo y cultura interactúan:** un cerebro mayor aprovecha más lo transmitido (formato `reasons`/`evidence`) y los mitos cuestan distinto según el cuerpo | rasgos × `SOCIAL.format` |
| G5 | Los límites físicos producen un **óptimo interior**: ningún rasgo se va al máximo | trayectoria de los rasgos |

Métrica de realismo: las de Tyrrell (`README.md` §4) más la morfología resultante comparada con las relaciones biológicas: Haller, Kleiber y el trade-off cerebro-intestino.

## 4. Pasos de implementación (cuando toque la fase 5)

1. **Coste sin cambios.** El presupuesto energético con todos los rasgos en 1 debe dar exactamente el gasto de hoy (huella dorada y `--check` intactas). Bloque `MORPH` con `enabled: 0`.
2. **Genes y mutación.** Nuevos rasgos en `BODY_TRAITS`. Que `mutate()` (clonal) también mute el cuerpo, con sub-flujo aleatorio propio para no desplazar los sorteos de hoy.
3. **Beneficios conectados** (cerebro → memoria, líneas y ruido; estómago → digestión y toxinas; ojos y antenas → percepción).
4. **Plasticidad**, con su coste de construcción.
5. **Herencia** en los tres modos.
6. **Sprite** paramétrico e inspector.
7. **Batería:** torneo, mundos nuevos, G1–G5, con protocolo congelado antes.

Cada paso, con todo apagado, deja el mundo preregistrado idéntico.
