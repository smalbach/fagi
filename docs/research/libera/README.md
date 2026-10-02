# LIBERA: estado del trabajo (para continuar en local)

Resumen de una sesión de análisis y diseño. **No hay código cambiado todavía**: solo
documentación. Todo lo que sigue es plan; nada está implementado.

| archivo | qué es |
|---|---|
| `README.md` | este archivo: dónde quedamos y cómo seguir |
| `informe-libera.md` | el informe completo: bibliografía verificada, ideas, novedad, método, hipótesis, fases |
| `notes/classic_refs_verification.md` | verificación de Lorenz, Hinde, Tinbergen, Tyrrell, Rosenblatt & Payton, Brooks, Gat, Maes, Hull, Toates, Bryson |
| `notes/homeostasis_motivation.md` | Keramati & Gutkin, Sterling, Seth, Barrett, Friston, Pezzulo, Damasio, Cañamero, Berridge, Cabanac, saciedad/sed, fatiga muscular |
| `notes/neuromod_sleep_curiosity_symbolic.md` | Doya, Krichmar, Yu & Dayan, sistemas endocrinos artificiales, sueño (CLS, SHY, replay), curiosidad (Oudeyer), DreamCoder, Voyager, XCS |
| `notes/novelty_prior_art.md` | trabajos previos (Creatures, Blumberg, PSI/MicroPsi, OpenWorm, NeuroMechFly…) y análisis de novedad |

---

## 1. Cómo funciona Fagi hoy (punto de partida)

```
requestAnimationFrame (main.js, dt ≤ 0.05 s)
  └─ step(world, fagi, dt)                         simulation.js
       ├─ stepWorld: viento → lluvia → árboles → fruta → nido → olores → feromona
       └─ updateFagi                               fagi.js
            cuerpo/olvido → perceive() → notice() → cortex (async, nunca espera)
            → decide() → act() → consecuencias (needs, salud, sueño, guardado)
  └─ render → UI → consola → grabadora → servidor (eventos)
```

- `decision.js`: lista `RULES` por prioridad (survive → endure → provide → clues → explore).
  **Winner-take-all: gana la primera regla que responde.**
- Aprendizaje: episodio → `interoception.js` (recompensa = delta del cuerpo) → `memory.js`
  (valor + confianza) → `learned/synth.js` escribe reglas en el DSL → `learned/rules.js` (`verdict()`).
- Sinapsis Hebbianas (`synapses.js`), conceptos (`concepts.js`), noche (`consolidation.js`, `night/`,
  `experiment.js`).
- Restricción clave: con los bloques del organismo apagados, la simulación debe ser **idéntica
  hasta el último número aleatorio** (estudios preregistrados).

## 2. La idea del usuario

Separar a Fagi en **órganos** (estómago, "glándula de sed" = hipotálamo/osmorreceptores + ADH,
músculos con fatiga, ojos, nariz, lengua, nociceptores) que **mandan mensajes** al cerebro, y que el
cerebro decida/priorice al recibirlos, con todo "cableado".

Decisiones ya tomadas en la conversación:

1. **No usar un Web Worker real** para el cerebro: rompe el determinismo, el modo batch y los tests.
   En su lugar, un **bus de mensajes síncrono dentro del tick**, con latencia de nervios medida en
   **tiempo simulado** (segundos → ticks), no en milisegundos reales.
2. Dos tipos de señal: **tónica** (se mantiene: hambre 0.62, en un tablero) y **fásica** (evento:
   dolor, amargo, "veo algo nuevo"; puede interrumpir).
3. Todo detrás de un flag (`ORGANS.enabled` / `LIBERA.*`), apagado por defecto, como `CYCLE`,
   `THERMAL`, `SEX`, `SLEEP`.

## 3. Lo que aportan los autores (verificado)

- **Brooks 1986** (subsumption): capas que funcionan solas; suprimir/inhibir; reflejos en los
  órganos, no en el cerebro. Construcción incremental.
- **Lorenz 1950** (hidráulico): depósitos de impulso, liberador abre la válvula, umbral baja con la
  acumulación, actividad en vacío, el acto consumatorio vacía. Crítica: **Hinde 1960**.
- **Tyrrell 1993** (tesis, Edimburgo): free-flow (Rosenblatt & Payton 1989) > winner-take-all en un
  entorno de 15 subproblemas / 35 acciones; 14 requisitos (solo el n.º 12, "compromise candidates",
  verificado literalmente).
- **Matiz importante**: Bryson 2000 superó al free-flow con jerarquías secuenciales en el mismo
  entorno; Crabbe: el compromiso aporta poco; Avila-García et al. 2003: depende del entorno.
  ⇒ **diseño híbrido**: free-flow + **selector central con persistencia** (tipo ganglios basales,
  Redgrave, Prescott & Gurney 1999) + pocas secuencias.
- **Gat 1998**: arquitectura de tres capas (reactiva / secuenciador / deliberador).

Correcciones bibliográficas: Maes "How to do the right thing" = **1989**; Tyrrell Adaptive Behavior
1(4): 387–**419**; Hull 1943 = **Appleton-Century**; crítica de energía = **Hinde 1960**; "the world is
its own best model" ≈ **Brooks 1990** ("Elephants don't play chess", sin confirmar); Digital Hormone
Model = Shen, Will, Galstyan & Chuong 2004; Man & Damasio 2019 (revisar si hay un tercer autor "Neven").

## 4. Ideas nuevas con base verificada (detalle en `informe-libera.md`)

| mecanismo | fuente | dónde en Fagi |
|---|---|---|
| Impulso no lineal (HRRL) — Fagi ya es casi esto | Keramati & Gutkin 2014 | `interoception.js` |
| Estómago en dos tiempos (oral rápido / post-absortivo lento) | Zimmerman 2016, Chen 2015, Betley 2015 | órgano estómago / sed |
| Aliestesia: el placer depende de la carencia | Cabanac 1971 | lengua (`taste.js`) |
| Liberador aprendido = W = κ(estado)·V(señal) ("querer" ≠ "gustar") | Zhang & Berridge 2009 | depósitos |
| Consigna alostática (anticipa demandas) | Sterling 2012 | hipotálamo |
| Fatiga muscular de tres compartimentos | Xia & Frey Law 2008 | músculos |
| "Humores" globales en el bus (DA, 5HT, NE, ACh, estrés) | Doya 2002, Yu & Dayan 2005, Krichmar 2008 | bus |
| Sueño por etapas: replay NREM → reducción sináptica → REM con ruido | McClelland 1995, Tononi & Cirelli 2006/2014, Hoel 2021, Lewis 2018 | `consolidation.js`, `night/` |
| Curiosidad por progreso de aprendizaje | Oudeyer, Kaplan & Hafner 2007 | agenda nocturna / `experiment.js` |
| Reglas con contabilidad XCS + compresión del DSL (MDL) | Wilson 1995, DreamCoder 2021 | `learned/` |

## 5. Novedad (honesta)

- Lo más cercano: **Creatures** (Grand & Cliff 1998): órganos, química, hormonas, recompensa por
  reducción de impulso, genes, sueño que entrena. ⇒ "recompensa = delta del cuerpo" **no es nuevo**.
- Afirmación defendible (conjuntiva, "no encontrado en las fuentes consultadas"):
  (i) **cero liberadores innatos** sobre objetos, (ii) selección **free-flow**, (iii) **sueño que
  genera preguntas → experimentos del día siguiente**, admitidas solo con evidencia vivida,
  (iv) **reglas legibles sin LLM**.
- Órganos con nervios y reflejos = ingeniería, salvo que H4 muestre una interacción.

## 6. Método LIBERA — hipótesis

| # | hipótesis | ablación |
|---|---|---|
| H1 | liberadores aprendidos ≈ viabilidad de innatos y se adaptan antes a un cambio a mitad de vida | `learned` vs `innate` (V precargado y congelado, NO el Fagi actual) |
| H2 | free-flow + selector central > `RULES` actual y > free-flow puro | `priority` vs `freeflow` vs `freeflow+central` |
| H3 | agenda nocturna con puerta acorta el aprendizaje sin más creencias falsas | `none` / `replay-only` / `agenda-ungated` / `agenda-gated` |
| H4 | la latencia daña menos con reflejos en los órganos (interacción) | 2×2 latencia × reflejos |
| H5–H7 | revaloración instantánea (κ·V); saciedad anticipatoria; curiosidad LP evita trampas de ruido | secundarias, Holm |

Un resultado nulo o inverso en H2 (como el de Bryson) también es publicable: preregistrarlo así.

## 7. Plan por fases (nada hecho aún)

```
Fase 0  métricas tipo Tyrrell en scripts/batch.js + test "golden": con todo apagado,
        salida idéntica byte a byte a main. Medir la Fagi actual (línea base). Protocolo congelado.
Fase 1  src/organs/: bus síncrono + tablero; estómago (2 tiempos), hipotálamo, músculos.
        Conducta igual (adaptador a fagi.hunger/thirst/energy). Flag apagado.
Fase 2  reflejos en órganos (salir del agua, escupir, dolor, agotamiento) con cables suppress/inhibit.
Fase 3  depósitos de Lorenz con liberadores aprendidos W = κ·V; actividad en vacío.
Fase 4  selector free-flow + selector central con persistencia, conviviendo con RULES.
Fase 5  comparación preregistrada en batch (H1–H4) con research/stats.js (bootstrapCI, holm…).
Fase 6  nervios con latencia/ruido (sub-flujo de semilla propio del cuerpo), humores, pesos aprendidos.
```

Reglas de implementación acordadas:
- Cada bloque nuevo en `src/config.js` con `enabled: 0`, registrado en `src/organism.js`,
  activable con `--set` en `scripts/batch.js`.
- El ruido de los nervios usa **su propio sub-flujo aleatorio** para no desplazar los sorteos de Fagi.
- Latencia en segundos, con un test de que el resultado no depende de `dt`.
- `RULES` se conserva como condición base de H2.
- Presupuesto de coste por tick en cada fase.

## 8. Pendientes

- [ ] Leer a mano (estaban bloqueados desde la sesión en la nube): informe técnico de Creatures
      (CSRP 434, sobre todo el "concept lobe" y los órganos), Grandroids/Phantasia ("imaginación"),
      IMGEP de Oudeyer, los 14 requisitos de Tyrrell en el PDF de la tesis
      (https://era.ed.ac.uk/handle/1842/20257), resultados de Bryson 2000.
- [ ] Revisar el artículo **PMC2440771** que envió el usuario
      (https://pmc.ncbi.nlm.nih.gov/articles/PMC2440771/): no se pudo abrir (PubMed Central bloqueado
      por el proxy). Pendiente: identificarlo y ver dónde encaja en LIBERA.
- [ ] Revisar las referencias marcadas [P] (parcialmente verificadas) en `informe-libera.md`.
- [ ] Decidir si empezar por la **Fase 0**.

## 9. Para retomar en local

Prompt sugerido para la nueva sesión:

> Lee `docs/research/libera/README.md` e `informe-libera.md`. Primero revisa el artículo
> PMC2440771 y los pendientes de la sección 8; después empieza la Fase 0 (métricas tipo Tyrrell
> en `scripts/batch.js` y test golden de que con todo apagado la salida es idéntica).
