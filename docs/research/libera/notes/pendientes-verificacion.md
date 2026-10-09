# Pendientes §8: verificación local (2026-10-01)

Cierra los pendientes de la §8 del `README.md`. A diferencia de la sesión en la nube, aquí sí se leyeron textos completos.

Marcas usadas:
- **[V-texto]**: texto completo leído.
- **[V-registro]**: confirmado en Crossref, PubMed o la editorial.
- **[V-extracto]**: solo resumen o wiki.
- **[NO]**: no verificado.

**Afecta al informe:** dos "correcciones" de `informe-libera.md` eran erróneas. Están en la §5.

---

## 1. Tyrrell (1993), tesis: los 14 requisitos [V-texto]

Fuente: PDF de ERA, https://era.ed.ac.uk/bitstreams/a3a0f465-74df-438a-9a9d-5ed62a43d0da/download.
- La lista está en la §10.5, pp. 213–216, con la paginación impresa de la tesis.
- Crabbe (2007) cita esta misma tesis con un desfase de 40 páginas: al ítem 12 lo pone en la "p. 174". Conviene citar con la paginación de ERA.

| # | requisito | idea (definición abreviada) | pág. |
|---|---|---|---|
| 1 | Dealing with all types of sub-problem | resolver todos los tipos de subproblema | 214 |
| 2 | Persistence | seguir con el acto consumatorio más allá del momento en que su déficit deja de ser el mayor | 214 |
| 3 | Activations proportional to current offsets | activación proporcional a la distancia a la consigna | 214 |
| 4 | Consummatory over appetitive (same system) | preferir lo consumatorio a lo apetitivo dentro del mismo sistema | 214 |
| 5 | Consummatory over appetitive (other systems) | preferir lo consumatorio de un sistema a lo apetitivo de otro | 215 |
| 6 | Balanced competition | no discriminar a los nodos que sirven a varios objetivos | 215 |
| 7 | Contiguous action sequences | tender a terminar la secuencia empezada | 215 |
| 8 | Interrupts if necessary | poder interrumpir una secuencia | 215 |
| 9 | Opportunism | usar la disponibilidad externa, no solo el déficit | 215 |
| 10 | No system-level winner-take-all | no "apagar" todos los sistemas menos uno | 215 |
| 11 | Combination of preferences | integrar preferencias no binarias | 215 |
| 12 | Compromise candidates | elegir una acción que no es la mejor para ningún subproblema solo, pero sí para todos a la vez | 216 |
| 13 | Real-valued sensors | aprovechar toda la información real | 216 |
| 14 | Flexible combination of stimuli | combinar estímulos con funciones arbitrarias | 216 |

**Entorno simulado** (§3.2, pp. 50–51):
- **13 subproblemas**, no 15 como decía el informe. La §2.4 enumera solo 12; esa diferencia no se resolvió.
- **35 acciones.**
- La métrica es el número de apareamientos antes de morir, sobre unas 6600 corridas por mecanismo en 4 versiones del entorno.

**Resultados** (Tabla 10.2, p. 221; fitness medio):

| mecanismo | estándar | promedio de las 4 versiones |
|---|---|---|
| ERP (Rosenblatt & Payton extendido) | 8,09 | **8,31** |
| Drives (Hull) | 6,44 | 6,23 |
| Jerarquía rígida (Tinbergen/Baerends) | 6,69 | 6,11 |
| Lorenz (hidráulico) | 2,39 | 2,71 |
| Maes | 0,16 | 0,25 |

**Para LIBERA:**
- Los 14 requisitos se pueden convertir directamente en métricas preregistradas (Fase 0).
- El modelo hidráulico de Lorenz **puro** queda el penúltimo. Los depósitos de LIBERA tienen que ir dentro de un free-flow, nunca como selector.

## 2. Bryson (2000) [V-texto]

Referencia: SAB 6, MIT Press, pp. 147–156, doi:10.7551/mitpress/3120.003.0017. Texto leído: preprint en joannajbryson.org.

**Montaje:** mismo entorno y misma métrica que Tyrrell. El agente es Edmund, con planes reactivos jerárquicos POSH y atención selectiva.

| mundo | Edmund | ERP |
|---|---|---|
| estándar | **9,12** | 8,09 |
| var. 1 | **4,02** | 3,61 |
| var. 2 | **9,67** | 8,16 |
| var. 3 | 11,23 | **13,38** |

- Gana en 3 de 4 mundos. En el agregado, el propio texto es ambiguo sobre si la diferencia es significativa (F = 1,36).
- Con comida escasa, la ventaja de Edmund es grande: 8,17 frente a 4,77 en el mundo estándar.
- Edmund es unas 10 veces más simple: 26 umbrales frente a 264 pesos.
- Su versión final **eliminó el único caso de candidato de compromiso**.

**Para LIBERA:** confirma que en H2 conviene la condición híbrida con secuencias, y que un resultado nulo o inverso es plausible.

## 3. Crabbe (2007) [V-texto]

Referencia: Phil. Trans. R. Soc. B 362(1485): 1559–1571, doi:10.1098/rstb.2007.2053.
- En el caso prescriptivo, el óptimo con compromiso es solo un **1,1 %** mejor que la estrategia sin compromiso (MEU).
- En el caso proscriptivo, el óptimo da +29,6 %, pero la estrategia simple "skirt" ya consigue +29,1 %.
- No reproduce la lista de 14 requisitos: solo cita el ítem 12.

## 4. Seth (2007): PMC2440771, el artículo que envió el usuario

Referencia: Seth, A. K. "The ecology of action selection: insights from artificial life". *Phil. Trans. R. Soc. B* 362(1485): 1545–1558, doi:10.1098/rstb.2007.2052. Mismo número temático que Crabbe.

**Qué dice:**
- La selección de acción puede emerger de procesos sensoriomotores paralelos poco acoplados, sin un árbitro interno.
- Hay que separar la conducta observada del mecanismo que la produce.
- Lo que parece irracional, como el probability matching, es adaptación al nicho: racionalidad ecológica.

**Para LIBERA:**
- Es un argumento a favor de la condición `freeflow` pura en H2, frente al selector central.
- Recuerda que las métricas deben medirse **en el nicho de Fagi**. Un mecanismo bueno en un entorno puede ser malo en otro, igual que en Avila-García et al. (2003).

## 5. Correcciones a `informe-libera.md`

| ítem | el informe decía | correcto | fuente |
|---|---|---|---|
| Tyrrell 1993, *Adaptive Behavior* 1(4) | "corregida" a 387–**419** | **387–420**: el informe se equivocó; el artículo siguiente empieza en la 421 | Crossref [V-registro] |
| Entorno de Tyrrell | 15 subproblemas | **13** subproblemas, 35 acciones | tesis pp. 50–51 [V-texto] |
| Tyrrell 1994 | páginas sin confirmar | 2(4): 307–348 | Crossref |
| Brooks, "the world is its own best model" | 1990, sin confirmar | **confirmada**: Brooks 1990, *RAS* 6(1–2): 3–15; aparece 3 veces. Brooks 1991 solo dice "use the world as its own model" | texto completo |
| Hull 1943 | Appleton-Century | **correcto**: primera impresión de D. Appleton-Century Company (LCCN 43013698); las reimpresiones dicen Appleton-Century-Crofts | Library of Congress vía Open Library |
| Man & Damasio 2019 | ¿tercer autor "Neven"? | **solo 2 autores**; *Nat. Mach. Intell.* 1(10): 446–452, doi:10.1038/s42256-019-0103-7 | Crossref |
| Avila-García & Cañamero, SAB'04 | no verificable | **existe**: SAB'04, pp. 243–252, doi:10.7551/mitpress/3122.003.0031 | Crossref |
| Avila-García & Cañamero, AISB'05 | sede sin confirmar | simposio "Agents that Want and Like", pp. 9–16 | Herts |
| Avila-García, Cañamero & te Boekhorst 2003 | sin páginas | LNCS 2801, pp. 733–742 | Springer |
| Crabbe 2007 | volumen y páginas de memoria | 362(1485): 1559–1571 | Crossref |
| Voyager | autores sin cotejar | 8 autores (Wang, Xie, Jiang, Mandlekar, Xiao, Zhu, Fan, Anandkumar); *TMLR* 2024 | mlanthology |
| Blundell & Burley 1987 | revista sin confirmar | *Int. J. Obesity* 11(Supl. 1): 9–25, "Satiation, satiety and the action of fibre on food intake" | PubMed 3032831 |
| Yoshida et al. 2024 | "et al." | Yoshida, Daikoku, Nagai & Kuniyoshi; *Neural Networks* 177: 106379 | Crossref |
| Zimmerman et al. 2016 | páginas de memoria | *Nature* 537(7622): 680–684 | Crossref |
| Krichmar 2008 | por citas secundarias | *Adaptive Behavior* 16(6): 385–399 | Crossref |
| Lewis, Knoblich & Poe 2018 | páginas de memoria | *TiCS* 22(6): 491–503 | Crossref |
| Schmidhuber 1991 | páginas de memoria | SAB'90, pp. 222–227; Crossref da 222–228 | Crossref |
| Sutton 1991, Dyna | sede en conflicto | *SIGART Bulletin* 2(4): 160–163, doi:10.1145/122344.122377 | Crossref |
| Neal & Timmis 2003 | número 2 o 4 | **27(2): 197–204** | índice de *Informatica* |

## 6. Trabajos previos: qué amenaza la novedad

| trabajo | lo que hace | fuente |
|---|---|---|
| **Creatures** (CSRP 434) | El lóbulo de conceptos aprende conjunciones AND de 1 a 4 entradas, pero sobre neuronas de **clase de objeto fijas** (visión semisimbólica). | [V-texto] |
| | Los órganos son solo sitios de reacción química, **sin reflejos locales**. | [V-texto] |
| | La decisión es **WTA**: gana la célula más activa. | [V-texto] |
| | El sueño ensaya **instintos del genoma**. | [V-extracto] |
| | La química que reduce el drive la inyecta el **script del objeto**; desde C3, los genes de estímulo innatos. | [V-texto] / [V-extracto] |
| **Grandroids / Phantasia** | "Imaginación" como imaginería para predecir y planificar, sin algoritmo publicado. El sueño consolida memoria; no genera experimentos. | [V-extracto] |
| **IMGEP** (Forestier et al., *JMLR* 23, 2022) | Las metas se eligen en línea por progreso de aprendizaje. Lo único fuera de línea es entrenar la meta-política. Sin sueño que proponga experimentos ni puerta de evidencia. | [V-texto] |
| **Cos-Aguilera, Cañamero & Hayes** (2004/2005; *Adaptive Behavior* 2010) | Aprenden affordances desde la homeostasis, pero con selección **WTA** y cada drive **cableado** a una conducta. | [V-texto] |
| **Blumberg et al. 2002** (Dobie) | Árbol de perceptos aprendido con estadísticas de fiabilidad, pero la recompensa es **externa** y no hay sueño. | [V-texto] |
| **Drescher 1991**, *Made-Up Minds* | Esquemas legibles con fiabilidad, revisados con evidencia. Cercano a (iii) y (iv), pero sin cuerpo ni sueño. | [V-extracto] |
| **Voyager** | Un LLM escribe habilidades como código, con currículo automático y autoverificación. No es homeostático ni tiene sueño. | [V-extracto] |
| **Adam** (King et al. 2009) | Ciclo completo de hipótesis y experimento, pero es un laboratorio, no una criatura. | [V-extracto] |
| **Generative Agents** | Por la noche reflexionan sobre el día y planifican el siguiente, sin hipótesis falsables ni cuerpo. | [V-extracto] |

### Veredicto por pieza de la novedad

| pieza | amenaza | por qué |
|---|---|---|
| (i) cero liberadores innatos | **media-alta** | Blumberg 1996 ya aprende liberadores (con premio externo, sobre una base innata y con winner-take-all). Matizar también frente a Creatures y Cos-Aguilera/Cañamero. Lo nuevo es "**cero** liberadores de partida + señal interoceptiva + free-flow". |
| (ii) free-flow | baja como novedad propia | Es antiguo, pero distingue a Fagi de Creatures y de Cañamero, que usan WTA. |
| (iii) sueño, luego experimento, luego puerta de evidencia | **baja** | Es la pieza **más defendible**. Hay que citar como antecedentes parciales Creatures, Grandroids, Adam, Drescher y Generative Agents. |
| (iv) reglas o código legible | media | Voyager (código escrito por un LLM) y Drescher (esquemas legibles) cubren cada uno una mitad. Con el plan C, la pieza (iv) se reformula: **código escrito por un LLM, admitido por evidencia vivida en un cuerpo homeostático y transmitido culturalmente**. Ya no es "sin LLM". |

La conjunción (i)+(ii)+(iii)+(iv) no aparece en nada de lo consultado.

## 7. Sigue abierto

- [V-texto] **Neal & Timmis 2003:** *Informatica* **27(2): 197–204**, junio de 2003, "Timidity: A Useful Emotional Mechanism for Robot Control?". Confirmado en el índice del propio journal. Kent estaba mal.
- [V-texto] **Tabla 10.1 de Tyrrell (p. 220), leída a mano en la imagen de la página.** ✓ = cumple, × = falla, ? = dudoso.

  | requisito | Drives | Lorenz | HDS | Maes | R&P ingenuo | R&P extendido |
  |---|---|---|---|---|---|---|
  | 1 todos los subproblemas | × | × | × | × | ✓ | ✓ |
  | 2 persistencia | ? | ✓ | ? | × | ? | **?** |
  | 3 activación ∝ desviación | ✓ | × | ✓ | ✓ | ✓ | ✓ |
  | 4 consumatorio > apetitivo (mismo sistema) | ✓ | ✓ | ✓ | ✓ | × | ✓ |
  | 5 consumatorio > apetitivo (otros sistemas) | ✓ | ? | ✓ | × | × | ✓ |
  | 6 competencia equilibrada | ? | ? | ✓ | × | ✓ | ✓ |
  | 7 secuencias contiguas | ? | ✓ | ? | ✓ | ? | **?** |
  | 8 interrumpir si hace falta | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
  | 9 oportunismo | ✓ | × | ✓ | ? | ✓ | ✓ |
  | 10 sin WTA a nivel de sistema | × | × | × | ✓ | ✓ | ✓ |
  | 11 combinación de preferencias | × | × | × | × | ✓ | ✓ |
  | 12 candidatos de compromiso | × | × | × | × | ✓ | ✓ |
  | 13 sensores reales | ✓ | ✓ | ✓ | × | ✓ | ✓ |
  | 14 combinación flexible | ? | × | ✓ | × | ✓ | ✓ |

  Lectura:
  - El R&P extendido solo deja dudosas la persistencia y las secuencias contiguas, justo lo que explota Bryson.
  - Lorenz: 7 ×, 2 ?.
- [V-texto] Tyrrell: son **13 subproblemas**. La §2.4 enumera 8 comunes y 4 que solo afectan a la dirección, y añade aparte un 13.º, "edge avoidance", para no salir del entorno. No hay contradicción.
- [V-registro] **Creatures, AAMAS 1998:** 1(1): 39–57, doi:10.1023/A:1010042522104. La comparación con CSRP 434 queda [NO]: el texto completo es de pago.
- [V-texto] **Blumberg 1994 (Hamsterdam, SAB'94):**
  - Los liberadores son **fijos**, definidos a mano.
  - El arbitraje es **winner-take-all** jerárquico (modelo de Ludlow, con inhibición mutua y fatiga).
  - Rechaza expresamente el free-flow.
  - **No aprende.**
- [V-texto] **Blumberg 1996, tesis "Old Tricks, New Dogs":** **sí aprende liberadores** (§5.5).
  - Aprende Releasing Mechanisms nuevos con valor predictivo, por condicionamiento clásico.
  - Copia conductas con un mecanismo nuevo al repertorio apetitivo, por condicionamiento operante.
  - Aprende el valor de los mecanismos existentes.
  - Lo demuestra con el perro Silas aprendiendo trucos.
  - El arbitraje es **winner-take-all** por grupos de exclusión cruzada.
  - **Amenaza directa a la pieza (i).** Lo que nos sigue distinguiendo:
    - Fagi empieza con **cero** liberadores sobre objetos; Silas parte de un repertorio y unos mecanismos innatos y aprende otros nuevos encima.
    - La señal viene del **cuerpo** (interocepción); en Silas viene del entrenador (premio externo).
    - Fagi usa **free-flow**; Silas, winner-take-all.
- [V-registro] **Hull 1943:** el pie de imprenta de la primera impresión es **D. Appleton-Century Company** (registro de la Library of Congress, LCCN 43013698). Las reimpresiones dicen Appleton-Century-Crofts. **La corrección de la nube era correcta**; la errata local de la §5 se retira.
