# Fagi aprende sus impulsos: el método LIBERA

> **Erratas y actualización (2026-10-01, verificación local con textos completos).** Este informe se escribió
> sobre el commit `397449a`, sin acceso a los textos completos. Lo que prevalece:
>
> - **Tyrrell 1993** (*Adaptive Behavior* 1(4)) termina en la p. **420**: la "corrección" a 419 era errónea.
> - **El entorno de Tyrrell tiene 13 subproblemas**, no 15. Los 14 requisitos ya están verificados en la tesis (§10.5, pp. 213–216).
> - **Brooks 1990** contiene la frase literal "the world is its own best model". **Man & Damasio 2019** tiene solo 2 autores.
> - **Avila-García & Cañamero, SAB'04**, existe (pp. 243–252).
> - **Hull 1943:** Appleton-Century es correcto para la primera impresión (LCCN 43013698).
> - **`RULES` ya no existe:** Fagi decide con un programa de líneas que reescribe ella misma (`src/program.js`), más `DECIDE` y `CONDUCT`.
>   La base de H2 es `program` / `program+learn`. El selector free-flow será un controlador de `DECIDE`.
> - **Novedad (iv):** el 2026-10-01 se planteó integrarla con el plan C (código escrito por un LLM). El 2026-10-02 se **aplazó**: por ahora LIBERA va sin LLM y (iv) = lo aprendido queda en líneas legibles (programa, DSL, `CONDUCT`).
> - **Orden reordenado (2026-10-02):** primero la noche científica (iii), después los liberadores (i), el selector (ii) y los órganos bajo demanda. Ver `README.md` §5.
>
> Detalle: `notes/pendientes-verificacion.md`. Plan vigente: `README.md`.

**Respuesta corta:** la bibliografía del plan es casi toda correcta. Hay cinco correcciones concretas: Maes es de **1989**, Tyrrell en *Adaptive Behavior* termina en la **p. 419** [errata: es 420], Hull 1943 lo publicó **Appleton-Century**, la crítica de Hinde a los modelos de energía es la de **1960** y la frase "the world is its own best model" probablemente sea de Brooks **1990**, no de 1991. Además hay un matiz de fondo: **"free-flow es mejor" es un resultado de Tyrrell (1993), no una ley.** Bryson (2000) lo superó con jerarquías secuenciales en el mismo entorno de Tyrrell, y Crabbe (2007) halló que las acciones de compromiso aportan poco. Frente a *Creatures* (Grand & Cliff), casi ningún componente de Fagi es nuevo por separado. Órganos, química, impulsos con recompensa por reducción de impulso, genes, cría y entrenamiento durante el sueño ya estaban ahí. **La novedad defendible está en una combinación concreta y medible**, que este informe empaqueta como el **método LIBERA** (*Liberadores Interoceptivos, Bus de órganos, Elección free-flow con compromiso central, Reservorios de Lorenz y Agenda nocturna*). Tiene cuatro piezas: (a) liberadores de impulsos *aprendidos* desde señales de órganos, sin instintos innatos sobre objetos; (b) un selector free-flow rematado por un selector central con persistencia; (c) un sueño que produce preguntas falsables, convertidas en experimentos corporales al día siguiente y aceptadas solo si la evidencia vivida las respalda; y (d) la exportación de lo aprendido a reglas legibles del DSL. En las ~25 búsquedas de los investigadores **no apareció ningún trabajo que reúna las cuatro**, pero eso significa "no encontrado en las fuentes consultadas", no "no existe". **Advertencia de método:** el proxy de salida bloqueó todos los textos completos (ERA, SAGE, PMC, arXiv, Crossref, wikis de Creatures). Toda la verificación se hizo sobre registros de editoriales e índices (IEEE Xplore, Taylor & Francis, SAGE, PubMed, repositorios universitarios) y extractos de buscador. Ningún texto se leyó entero, así que conviene que revises a mano los ítems marcados como *parcialmente verificada* o *conocimiento previo*.

---

## Cinco correcciones y un matiz: la bibliografía del plan aguanta

La tabla resume el estado de cada referencia clásica del plan. **"Verificada"** significa que un registro de editorial, índice o repositorio confirmó autores, título, sede, año y páginas. **"Corregida"** significa que la versión del plan tenía un error. **"Parcialmente verificada"** significa que algún dato (páginas, número, sede) solo se confirmó por fuentes secundarias o por memoria del investigador.

| Referencia en el plan | Estado | Referencia exacta / corrección |
|---|---|---|
| Lorenz 1950 (modelo psicohidráulico) | **Verificada** | *Symp. Soc. Exp. Biol.* 4: 221–268. Sin DOI ([klha.at](http://klha.at/papers/1950-InnateBehavior.pdf)) |
| Hinde (crítica a los modelos de energía) | **Corregida** | La crítica de la energía es **Hinde 1960**, *Symp. Soc. Exp. Biol.* 14: 199–213 ([PubMed 13714429](https://pubmed.ncbi.nlm.nih.gov/13714429/)). Hinde 1956 (*BJPS* 6(24): 321–331) critica el concepto unitario de "drive" ([PhilArchive](https://dc2.philarchive.org/rec/HINEMA)) |
| Tinbergen 1951 | Parcial (conocimiento previo) | *The Study of Instinct*, Clarendon Press. No se re-verificó en esta sesión |
| Tyrrell 1993, tesis | **Verificada** | PhD, Univ. of Edinburgh ([ERA](https://era.ed.ac.uk/handle/1842/20257)) |
| Tyrrell 1993, *Adaptive Behavior* | **Verificada** (errata) | 1(4): 387–**420**; la nube lo "corrigió" a 419 por error ([SAGE](https://journals.sagepub.com/doi/10.1177/105971239300100401)) |
| Rosenblatt & Payton 1989 | **Verificada** | IJCNN 1989, vol. 2: 317–323 ([Semantic Scholar](https://www.semanticscholar.org/paper/A-fine-grained-alternative-to-the-subsumption-for-Rosenblatt-Payton/221935fa9bd67e35d53701e8a9c52e6d3e388543)) |
| Brooks 1986 | **Verificada** | *IEEE J. Robotics & Automation* 2(1): 14–23 ([IEEE Xplore](https://ieeexplore.ieee.org/document/1087032)) |
| Brooks 1991 | **Verificada** (cita) / **Corregida** (frase) | *Artificial Intelligence* 47: 139–159 ([Vidal](https://jmvidal.cse.sc.edu/lib/brooks91b.html)). Según conocimiento previo, la frase literal "the world is its own best model" es de Brooks **1990**, "Elephants don't play chess"; 1991 dice algo cercano. Cita 1990 o parafrasea |
| Gat 1998 | **Verificada** (cita) | Capítulo en Kortenkamp, Bonasso & Murphy (eds.), pp. 195–210, AAAI/MIT Press ([PDF BIU](https://u.cs.biu.ac.il/~galk/teach/current/intsys/readings/on-three-layer-arch-tla-1998.pdf)). El contenido (controlador, secuenciador, deliberador) viene de conocimiento previo |
| Maes, "How to do the right thing" | **Corregida** | **1989**, *Connection Science* 1(3): 291–323 ([T&F](https://www.tandfonline.com/doi/abs/10.1080/09540098908915643)) |
| Hull 1943 | **Corregida** | Editorial: **Appleton-Century** (pasó a "-Crofts" en 1948, según conocimiento previo) ([TECFA](https://tecfa.unige.ch/themes/sa2/act-app-dos2-fic-drive.htm)) |
| Toates 1986 | **Verificada** | *Motivational Systems*, Cambridge UP ([CUP](https://www.cambridge.org/9780521318945)) |
| Grand & Cliff 1998 (*Creatures*) | **Verificada** | *Autonomous Agents and Multi-Agent Systems* 1(1): 39–57 ([Springer](https://www.springerprofessional.de/en/creatures-entertainment-software-agents-with-artificial-life/11864520)) |

Hay dos afirmaciones del plan que conviene **precisar más que corregir**. La primera: la lista de requisitos de Tyrrell tiene **14 ítems** ([Crabbe 2007](https://pmc.ncbi.nlm.nih.gov/articles/PMC2440772/)). Solo uno se pudo recuperar textualmente, el 12: *"Compromise Candidates: the need to be able to choose actions that, while not the best choice for any one sub-problem alone, are best when all sub-problems are considered simultaneously"*. Los otros trece circulan de memoria (persistencia, oportunismo, interrumpir si hace falta, preferir lo consumatorio, equilibrar titubeo y persistencia, etc.) y **hay que cotejarlos con el PDF de la tesis** antes de usarlos como métricas preregistradas. La segunda: el entorno de Tyrrell tenía **13 subproblemas y 35 acciones** [errata: la nube decía 15; tesis pp. 50–51] ([CMU AI Repository](https://www.cs.cmu.edu/afs/cs/project/ai-repository/ai/areas/agents/animals/0.html)). El código sigue publicado como paquete "animals", así que podría servir de especificación para un banco de pruebas comparable.

En cuanto al contenido, el esquema de Lorenz que usa el plan (depósito de "energía específica de acción" cuya válvula abren los estímulos señal y el IRM) está **verificado en sustancia** ([klha.at](http://klha.at/papers/1950-InnateBehavior.pdf)). Las subafirmaciones (el umbral baja con la acumulación, el desborde produce actividad en vacío, el acto consumatorio vacía el depósito) son la lectura estándar, pero proceden de conocimiento previo. **Hinde (1960) recuerda que la fisiología no respalda una energía que se acumule literalmente** ([PubMed](https://pubmed.ncbi.nlm.nih.gov/13714429/)). Para Fagi esto es una ventaja: el depósito debe presentarse como una *variable de estado de ingeniería* alimentada por señales de órganos, no como una tesis fisiológica. Así la crítica de Hinde queda desactivada de antemano.

### Tyrrell ganó en 1993; Bryson, Crabbe y Avila-García matizaron después

La lectura correcta de Tyrrell es más estrecha de lo que sugiere el plan. Según el resumen de la tesis, el enfoque de Rosenblatt & Payton, *"with free flow of information, combination of evidence, and the ability to select compromise candidates"*, resultó más adecuado que el modelo de drives hulliano, el hidráulico de Lorenz y la red de Maes ([ERA](https://era.ed.ac.uk/handle/1842/20257)). Pero el blanco de su crítica es el **winner-take-all en los nodos altos**, que decide antes de combinar la información de abajo. No es el WTA en el nivel motor final: su versión extendida (ERP) sigue eligiendo una sola acción, la más activada. La literatura posterior lo matiza en tres frentes. **Bryson (2000)** presentó un sistema jerárquico reactivo con secuencias que *"outperforms fully parallel systems"* precisamente en el entorno de Tyrrell ([Bath](https://researchportal.bath.ac.uk/en/publications/hierarchy-and-sequence-vs-full-parallelism-in-action-selection/)). **Crabbe** concluyó que el comportamiento de compromiso óptimo tiene *"a surprisingly small benefit"* ([Crabbe 2007](https://pmc.ncbi.nlm.nih.gov/articles/PMC2440772/)). **Avila-García, Cañamero & te Boekhorst (2003)** hallaron que la superioridad de WTA o de votación depende del entorno ([Springer](https://link.springer.com/chapter/10.1007/978-3-540-39432-7_79)). Desde la neurociencia, **Redgrave, Prescott & Gurney (1999)** proponen los ganglios basales como un *"centralized selection device"* situado sobre sistemas paralelos en competencia ([White Rose](https://eprints.whiterose.ac.uk/107033)).

La consecuencia de diseño es clara. **Ninguna de estas fuentes defiende las reglas de prioridad fija que Fagi usaba** en `src/decision.js` [hoy es un programa de líneas que gana por orden pero se reescribe con evidencia: `src/program.js`], así que el cambio sigue justificado. Pero el destino no debería ser un free-flow "puro". Conviene un híbrido: urgencias continuas combinadas al estilo free-flow, un selector central con persistencia o histéresis que se compromete con una acción, y unas pocas secuencias explícitas para conductas de varios pasos. Esto convierte el resultado de Tyrrell en una **hipótesis replicable** en vez de una premisa. La tabla siguiente aclara además dos referencias del entorno del plan que estaban mal atribuidas.

| Referencia | Estado | Nota |
|---|---|---|
| Shen et al. 2004, "Digital Hormone Model" | **Corregida** | Autores: **Shen, Will, Galstyan & Chuong**, *Autonomous Robots* 17(1): 93–105 ([Springer](https://link.springer.com/article/10.1023/B:AURO.0000032940.08116.f1)). "Shen, Salemi" es otro trabajo: *IEEE T-RA* 18(5): 700–712, 2002 ([ISI](https://robots.isi.edu/prl/b2hd-shen2002hormone-inspired-adaptive-communication-and-distributed.html)) |
| Avila-García & Cañamero, SAB 2004 "hormonal feedback… competitive scenario" | **Verificada** (errata: existe, SAB'04 pp. 243–252) | Solo se confirmó la versión AISB'05, "Hormonal modulation of perception in motivation-based action selection architectures" ([Herts](https://uhra.herts.ac.uk/id/eprint/12751/)). Revisa el índice de SAB 2004 antes de citarlo |
| Man & Damasio 2019 | **Verificada**: solo 2 autores, 1(10): 446–452 | Las fuentes encontradas solo nombran a **Man & Damasio**, *Nature Machine Intelligence* 1: 446–452 ([TechXplore](https://techxplore.com/news/2019-11-ai-chapter-machines.html)) |
| Sutton, Dyna 1991 | **Parcial** | Sede en conflicto: *SIGART Bulletin* 2(4): 160–163 frente a actas AAAI ([UAlberta](https://papersdb.cs.ualberta.ca/~papersdb/view_publication.php?pub_id=500)) |

---

## Diez mecanismos verificados que encajan en el plan sin romperlo

El plan de órganos e impulsos tiene huecos que la literatura llena con mecanismos baratos y deterministas. Los agrupo en cuatro familias: cuerpo, motivación, moduladores globales y sueño-curiosidad-reglas. La idea de fondo es que **Fagi ya contiene versiones rudimentarias de casi todo**. Su recompensa interoceptiva hace de error de predicción dopaminérgico, la "duda tras la sorpresa" equivale a un reset de incertidumbre inesperada y las reglas con histéresis son un XCS sin algoritmo genético. El rediseño con bus permite hacerlo explícito.

### El cuerpo: impulso no lineal, dos escalas temporales y aliestesia

**La regla actual "recompensa = delta del cuerpo" es exactamente el aprendizaje por refuerzo homeostático (HRRL) de Keramati & Gutkin (2014)** con exponentes unitarios. En HRRL la recompensa es la caída del impulso, definido como distancia no lineal al punto de consigna, y se demuestra que buscar recompensa equivale a mantener la estabilidad fisiológica ([eLife](https://elifesciences.org/articles/04811)). Cambiar a `D = (Σ w_i·|s*_i − s_i|^n)^(1/m)` con n > m > 1 da gratis rendimientos decrecientes, aversión al riesgo e interacción entre déficits. Hay que cotejar con el texto la fórmula exacta y la separación entre estimación orosensorial (K̂) y efecto real (K), porque proceden de conocimiento previo. Ese mismo mecanismo de estimación orosensorial se apoya en neurociencia verificada. **Zimmerman et al. (2016)** muestran que las neuronas de sed del SFO anticipan el efecto de comer y beber a partir de señales orales ([Nature](https://www.nature.com/articles/nature18950)). **Chen et al. (2015)** muestran que la mera detección sensorial de comida invierte la activación de las neuronas AgRP antes de ingerir nada ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/4373539)). **Betley et al. (2015)** muestran que esas neuronas de necesidad transmiten una señal de enseñanza de valencia negativa cuya *reducción* refuerza ([PubMed](https://pubmed.ncbi.nlm.nih.gov/25915020/)).

De ahí sale un **estómago de dos escalas temporales**. La fase oral, en la lengua, inhibe de inmediato la señal de necesidad en una cantidad predicha y aprendida. La fase post-absortiva, más lenta, actualiza el estado real. El error entre ambas entrena al predictor oral, siguiendo la cascada de saciedad sensorial → post-ingestiva → post-absortiva de Blundell ([WUR](https://edepot.wur.nl/293913)). La **aliestesia de Cabanac (1971)** completa el cuadro: el agrado de un estímulo depende del estado interno, y lo dulce deja de gustar tras cargar glucosa ([Wikipedia](https://www.wikipedia.com/wiki/Alliesthesia)). Esto encaja con "nacer sin saber nada": la aliestesia es una propiedad del cuerpo (lo dulce, lo húmedo, lo cálido), no conocimiento del mundo. Fagi sigue teniendo que aprender qué objeto produce qué sabor, y `src/taste.js` ya tiene valencias por sabor sobre las que montarla. Para los músculos con fatiga, **Xia & Frey Law (2008)** dan un modelo de tres compartimentos (reposo, activo, fatigado) que se integra con Euler por tick y reproduce las curvas de resistencia de Rohmert ([Iowa](https://iro.uiowa.edu/esploro/outputs/journalArticle/A-theoretical-approach-for-modeling-peripheral/9984047678402771)). Por último, la **alostasis** (Sterling & Eyer 1988; Sterling 2012) propone anticipar la necesidad desplazando la consigna en vez de defender una fija ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4166604)). En Fagi sería un `s_eff = s0 + Δs(contexto)` aprendido en el "hipotálamo": comer antes de dormir, beber antes de cruzar una zona seca. El "gobernador central" de Noakes es muy discutido en fisiología del ejercicio ([Frontiers 2016](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2016.00656/full)). Conviene incluirlo solo como **tope de esfuerzo alostático opcional y ablacionable**, no como tesis.

### La motivación: "querer" no es "gustar", y eso define al liberador aprendido

**El mecanismo que más directamente da cuerpo a los "liberadores aprendidos" es el modelo de saliencia incentiva de Zhang, Berridge et al. (2009)**: el estado fisiológico multiplica el valor aprendido de una señal en el momento del reencuentro ([PLoS Comp Biol](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2703828/)). Se apoya en la disociación entre *wanting* (dopaminérgico) y *liking* (puntos calientes hedónicos) de Berridge & Robinson (1998) y Berridge (2009) ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC2717031)). En Fagi se traduce así: `L(sabor, estado)` es el agrado inmediato por aliestesia; `V(señal)` es la memoria valor+confianza que ya existe; y `W(señal) = κ(estado)·V(señal)` es lo que abre la válvula del depósito de Lorenz y entra en el selector. Con esta formulación, **un liberador es una señal con V aprendido cuyo poder de liberación lo modula κ**. Es el puente formal entre Lorenz y el aprendizaje que al plan le faltaba. Cañamero aporta el precedente de ingeniería más cercano: variables homeostáticas que generan motivaciones combinadas con estímulos externos ([dblp](https://dblp.uni-trier.de/pid/34/1508.html)), hormonas que modulan la *percepción* de las señales ([Herts](https://uhra.herts.ac.uk/id/eprint/12751/)) y placer que mejora la viabilidad incluso cuando no está ligado a la necesidad ([Lewis & Cañamero 2016](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5152795/)). Los marcadores somáticos (Bechara et al. 1997, [Iowa](https://iro.uiowa.edu/esploro/outputs/journalArticle/Deciding-advantageously-before-knowing-the-advantageous/9984002580202771)) inspiran una re-escenificación "como si" de deltas corporales pasados ante una señal. Pero su base empírica está discutida ([Maia & McClelland 2004](https://pmc.ncbi.nlm.nih.gov/articles/PMC528759)), así que conviene presentarlos como recurso de ingeniería.

### Moduladores globales: "humores" en el bus junto a los nervios

El bus síncrono admite dos tipos de canal: **nervios** con destinatario, latencia y ruido, y **humores** sin destinatario, escalares globales con glándula, vida media y ganancia de receptor por órgano. El contrato de parámetros lo da **Doya (2002)**: dopamina = error TD, serotonina = descuento γ, noradrenalina = temperatura inversa β, acetilcolina = tasa de aprendizaje α ([NN special issue](https://mailman.srv.cs.cmu.edu/pipermail/connectionists/2002-August/020829.html)). **Yu & Dayan (2005)** separan la incertidumbre esperada (ACh) de la inesperada (NE) ([ModelDB](https://modeldb.science/citations/233488)), lo que formaliza la "duda tras la sorpresa" de Fagi. **Neal & Timmis (2003)** aportan un sistema endocrino artificial de "timidez" ([Kent](https://www.cs.kent.ac.uk/pubs/2003/1635)), y **Timmis, Neal & Thorniley (2009)** receptores adaptativos que degradan con gracia ante sensores fallidos ([Aberystwyth](https://research.aber.ac.uk/en/publications/an-adaptive-neuro-endocrine-system-for-robotic-systems/)). Esto último encaja de forma natural con nervios ruidosos: un nervio poco fiable baja su propia ganancia.

### Sueño, curiosidad y reglas: de "proponer preguntas" a "hacer ciencia"

La consolidación nocturna de Fagi ya es medio bucle de científico robot. La literatura sugiere cuatro mejoras. La primera es **dividir el sueño en etapas con funciones distintas**. Una NREM con reproducción priorizada e intercalada, al estilo CLS ([McClelland et al. 1995](https://stanford.edu/%7Ejlmcc/papers/McCMcNaughtonOReilly95.pdf); [Kumaran et al. 2016](https://web.stanford.edu/~jlmcc/papers/KumaranHassabisMcClelland16FinalMS.pdf)). Un escalado sináptico a la baja de las sinapsis Hebbianas, al estilo SHY ([Tononi & Cirelli 2014](https://pmc.ncbi.nlm.nih.gov/articles/3921176/)). Y una REM de recombinación y ruido que genere las preguntas ([Lewis, Knoblich & Poe 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC7543772/); [Hoel 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8134940)). La segunda es **elegir experimentos por progreso de aprendizaje, no por incertidumbre bruta**. Con la curiosidad adaptativa inteligente (IAC) de Oudeyer, Kaplan & Hafner (2007), un concepto con error alto pero sin progreso se marca como "ruidoso" y deja de atraer ([EPFL](https://infoscience.epfl.ch/record/115468?ln=en)). Así se evita que Fagi pruebe compulsivamente una fruta de recompensa aleatoria, en la línea de la curiosidad como mejora del modelo de Schmidhuber (1991) ([mlanthology](https://mlanthology.org/misc/1991/schmidhuber1991misc-curious)). La tercera es **llevar las reglas con contabilidad XCS**: predicción, error, aptitud basada en precisión y experiencia ([Wilson 1995](https://www.csse.monash.edu.au/~jonmc/CSE451/Topics/Resources/FIT4012_1_Lecture8.pdf)). Así se conservan reglas fiables de bajo pago, como "nunca comer lo azul", que una aptitud por valor tiende a descartar. La cuarta es **comprimir la biblioteca de reglas durante el sueño**, al estilo DreamCoder ([Ellis et al. 2021](https://people.csail.mit.edu/asolar/papers/EllisWNSMHCST21.pdf)): las subexpresiones repetidas del DSL se promueven a predicados con nombre, que pasan a ser *conceptos nuevos* a los que se enganchan las sinapsis Hebbianas. Eso cierra el ciclo simbólico↔subsimbólico. El ciclo hipótesis → experimento → revisión con procedencia registrada tiene su precedente en el científico robot "Adam" ([King et al. 2009](https://research.aber.ac.uk/en/publications/the-automation-of-science/)).

| Idea | Base verificada | Dónde vive en Fagi | Predicción falsable |
|---|---|---|---|
| Impulso no lineal (n>m>1) | Keramati & Gutkin 2014 | `interoception.js` (`feel`) | Preferencia por fuente fiable frente a fuente arriesgada de igual media, mayor con el déficit |
| Estómago de dos escalas | Zimmerman 2016; Chen 2015; Betley 2015 | órgano estómago + `taste.js` | "Beber en falso" detiene la bebida pronto; reanuda al decaer la inhibición |
| Aliestesia | Cabanac 1971 | órgano lengua | El agrado cae dentro de la comida con V intacto; efecto "postre" |
| W = κ·V | Zhang et al. 2009 | liberador del depósito | Revaloración instantánea al primer reencuentro tras privación, sin ensayos |
| Consigna alostática | Sterling 2012 | órgano hipotálamo | Comer antes de dormir; picos de déficit menores |
| Fatiga en 3 compartimentos | Xia & Frey Law 2008 | órgano músculo | Resistencia hiperbólica con la carga |
| Humores DA/5-HT/NE/ACh | Doya 2002; Yu & Dayan 2005 | canales `hormone.*` del bus | Reaprendizaje más rápido tras un cambio de signo, sin perder confianza por ruido estacionario |
| Sueño en etapas | CLS, SHY, Hoel, Lewis 2018 | `consolidation.js`, `night/` | El escalado sináptico estabiliza el peso Hebbiano medio por días |
| Curiosidad por progreso | Oudeyer et al. 2007 | agenda de experimentos | Abandona la "tragaperras" tras un número acotado de bocados |
| XCS + compresión | Wilson 1995; Ellis 2021 | `learned/` (DSL) | Crecimiento sublineal de tokens del DSL; transferencia a frutas nuevas |

---

## Creatures ya tenía casi todo: dónde queda espacio honesto

**Esta es la objeción que un revisor hará primero, y conviene asumirla de entrada.** *Creatures* (1996–2001) tenía una red neuronal para coordinación sensoriomotora y selección de conducta, y una "bioquímica artificial" con hormonas que modulan difusamente la actividad neuronal ([Springer](https://www.springerprofessional.de/en/creatures-entertainment-software-agents-with-artificial-life/11864520)). Sus impulsos castigan al subir y recompensan al bajar ([Zucconi](https://www.alanzucconi.com/2020/07/27/the-ai-of-creatures/)). Tenía órganos desde *Creatures 2* ([Creatures Wiki](https://creatures.fandom.com/wiki/Organ)), genomas heredables con mutación ([Wikipedia](https://en.wikipedia.org/wiki/Creatures_(video_game_series))) y un sueño en el que el cerebro se entrena ([Creatures Wiki: Instinct](https://creatures.fandom.com/wiki/Instinct)). La "recompensa = delta del cuerpo" de Fagi **no es nueva**: es Creatures y es HRRL. Colonia, genes y cría están cubiertos por Creatures y Polyworld ([Polyworld](https://cis.temple.edu/tagit/presentations/PolyWorld.pdf)). Los liberadores de Lorenz en criaturas sintéticas ya aparecen en Blumberg (1994), y aprender qué estímulos predicen recompensa, en Blumberg et al. (2002) ([SIGGRAPH](https://history.siggraph.org/?p=118428)). El código autoescrito tiene precedentes en Voyager ([arXiv](https://arxiv.org/abs/2305.16291v2)) y en los sistemas clasificadores ([ZCS](https://uwe-repository.worktribe.com/OutputFile/1079603)).

```
                 Creatures   Blumberg   Cañamero   Voyager/   Gen.Agents   FAGI+LIBERA
                 (Grand &    1994/2002  1997-2016  DreamCoder (Park 2023)
                  Cliff)
Órganos/química     ██          ·          ·          ·           ·           ██
Impulso→recomp.     ██          █          ██         ·           ·           ██
Instintos innatos   ██ (sí)     ██ (sí)    █          ·           ·           ·· (NO, a propósito)
Liberador aprendido ·           █          ·          ·           ·           ██
Selección free-flow ·  (WTA)    █          █          ·           ·           ██ (+compromiso central)
Sueño entrena       ██ (instintos fijos)   ·          █ (Dream)   ·           ██
Sueño→experimento   ·           ·          ·          █ (curríc.) █ (plan,     ██
 al día siguiente                                                  sin cuerpo)
Puerta de evidencia ·           ·          ·          █ (verif.)  ·           ██
 vivida
Reglas legibles     ·           ·          ·          ██ (LLM)    ·           ██ (LLM + evidencia vivida + herencia, plan C)
Genes/cría          ██          ·          ·          ·           ·           ██
Preregistro         ·           ·          ·          ·           ·           ██ (método)

 ██ = presente   █ = parcial   · = ausente o no encontrado en las fuentes consultadas
```

Hay que leer esta tabla con cautela. **Los datos de Creatures salen de extractos de buscador de wikis y del resumen del artículo, no del informe técnico CSRP 434**, que estaba bloqueado. Según esos extractos, la diferencia más sólida es que el sueño de Creatures **ensaya instintos predefinidos en el genoma** ([Creatures Wiki](https://creatures.fandom.com/wiki/Instinct)). Los propios fans documentaron que, sin un sueño correcto, los norns "no aprendían a comer". Fagi, en cambio, renuncia a liberadores innatos sobre objetos. La segunda diferencia es que el lóbulo de decisión de Creatures elige la neurona más activa ([Creatures Wiki](https://creatures.fandom.com/wiki/Verb_lobe)), es decir, WTA. Hay tres riesgos abiertos que **debes revisar antes de afirmar nada**. El "lóbulo de conceptos" de Creatures podría solaparse con los conceptos sin categoría innata de Fagi. Los órganos de Creatures son sitios de reacción en un baño químico compartido, pero no se confirmó si tienen reflejos locales. Y el mecanismo de "imaginación" de Grandroids/Phantasia ([MIT Tech Review](https://www.technologyreview.com/2014/09/18/171315/a-grand-quest-to-create-virtual-life/)) podría acercarse a la agenda nocturna. Tampoco se revisaron IMGEP de Oudeyer ni las actas SAB/ALIFE de forma exhaustiva.

Con esas salvedades, **la afirmación de novedad que se sostiene es conjuntiva y estrecha**: *"en las fuentes consultadas no encontramos una criatura artificial que combine (i) cero liberadores innatos sobre objetos, con todos los liberadores de impulso adquiridos desde señales interoceptivas de órganos, (ii) selección free-flow, (iii) una fase de sueño que genera preguntas falsables programadas como experimentos corporales del día siguiente y admitidas solo con evidencia vivida, y (iv) la compilación de lo aprendido a reglas legibles sin LLM"* [actualizado: (iv) pasa a ser conducta escrita como código por un LLM, admitida por evidencia vivida en un cuerpo homeostático y transmitida culturalmente; ver README §5]. Los órganos con nervios latentes y ruidosos y los reflejos en órganos al estilo Brooks son **decisiones de ingeniería**, no ciencia nueva, salvo que se demuestre una interacción medible (H4 abajo). El preregistro es una **contribución de rigor**, inusual en vida artificial pero no un mecanismo. Toda la defensa debe descansar en ablaciones, no en la lista de componentes.

---

## LIBERA: cinco piezas, siete hipótesis y una ablación por pieza

### La arquitectura en tres capas sobre un bus determinista

LIBERA reinterpreta las tres capas de Gat (controlador reactivo, secuenciador, deliberador) para que cada capa tenga un dueño claro en el código y una ablación propia.

```
 ┌──────────────────────────── CAPA 3 · DELIBERADOR (solo en el nido, de noche) ──────────────────────────┐
 │  Órgano SUEÑO:  NREM-replay priorizado ──► SHY (escala ↓ sinapsis) ──► REM (recombina + ruido)         │
 │                    │ (CLS, Dyna)                                          │                            │
 │                    ▼                                                      ▼                            │
 │  Órgano REGLAS: XCS (pred, error, aptitud) ── compresión DSL (MDL) ──► concept.new                      │
 │  AGENDA: preguntas puntuadas por progreso esperado × seguridad ──► top-k experimentos de mañana         │
 └──────────────────────────────────────────────┬──────────────────────────────────────────────────────────┘
                                                 │ agenda + sesgos de reglas (con procedencia)
 ┌──────────────────────── CAPA 2 · SECUENCIADOR / SELECTOR (cada tick, despierta) ───────────────────────┐
 │  DEPÓSITOS (Lorenz, como variables de estado):  hambre  sed  fatiga  dolor  curiosidad(ΣLP)           │
 │       nivel ← señales de órganos;   válvula ← W(señal) = κ(estado)·V(señal)   [liberador APRENDIDO]     │
 │                         │                                                                               │
 │                         ▼   activación continua por candidato (sin decisiones en nodos altos)          │
 │  FREE-FLOW (Rosenblatt&Payton / Tyrrell):  Σ_impulsos peso·urgencia·W  + sesgos de reglas + bonus LP   │
 │                         │                                                                               │
 │                         ▼                                                                               │
 │  SELECTOR CENTRAL (tipo ganglios basales): argmax con histéresis/persistencia + pocas SECUENCIAS        │
 └──────────────────────────────────────────────┬──────────────────────────────────────────────────────────┘
                                                 │ comandos motores
 ┌───────────────────────── CAPA 1 · REACTIVA (reflejos dentro de los órganos, Brooks) ──────────────────┐
 │  ojo   nariz   lengua(aliestesia)   estómago(oral→post-absortivo)   hipotálamo(consigna alostática)    │
 │  músculos(Xia–Frey Law)   nociceptores(retirada refleja, escupir)                                     │
 └──────────────────────────────────────────────┬──────────────────────────────────────────────────────────┘
                                                 │
 ════════════════════════ BUS SÍNCRONO DETERMINISTA (orden fijo de órganos por tick) ════════════════════
   nerve.<src>→<dst> : cola con latencia L ticks + ruido N(0,σ) del sub-flujo "cuerpo" de la semilla de Fagi
   hormone.<DA|5HT|NE|ACh|STRESS> : escalar global, glándula, vida media, ganancia de receptor por órgano
   sleep.phase ∈ {WAKE, NREM_REPLAY, DOWNSCALE, REM_DREAM}  (de noche: umbral sensorial = ∞; replay etiquetado)
```

El orden por tick debe ser fijo para conservar el determinismo: (1) el mundo avanza; (2) cada órgano lee sus entradas, ejecuta su reflejo local y publica en su nervio con la latencia y el ruido que le tocan; (3) las glándulas actualizan los humores; (4) los depósitos se actualizan; (5) se ejecutan el free-flow y el selector central; (6) los músculos ejecutan con fatiga; (7) se registra el episodio con la señal interoceptiva de dos escalas. **La latencia debe definirse en segundos y convertirse a ticks**, con un test que compruebe que los resultados no dependen de `--dt`.

### Hipótesis falsables y sus ablaciones

Cada hipótesis tiene una predicción direccional, una ablación que la puede refutar y una métrica primaria. Las cuatro primeras (H1–H4) son **confirmatorias**. Las demás son secundarias y se corrigen por multiplicidad con Holm.

| # | Hipótesis | Condiciones (ablación) | Métrica primaria | Qué la refuta |
|---|---|---|---|---|
| **H1** | Los liberadores aprendidos alcanzan una viabilidad comparable a los innatos y **se adaptan antes a un cambio** de qué fruta nutre o envenena | `LIBERA.releasers = learned` vs `innate` (V precargado, sin actualizar κ·V); cambio a mitad de vida | Bocados perseverantes tras el cambio; viabilidad dentro de un margen de equivalencia | Perseveración igual o menor en la condición innata, o viabilidad fuera del margen |
| **H2** | Free-flow + selector central supera a la jerarquía WTA de prioridad actual **y** al free-flow puro | `selector = priority` (el `RULES` de entonces; hoy `program` y `program+learn`) vs `freeflow` vs `freeflow+central` | Integral del impulso homeostático ∫D(t)dt; supervivencia | Sin diferencia, o si gana `priority` (lo que replicaría a Bryson en contra) |
| **H3** | La agenda nocturna con puerta de evidencia acorta el tiempo hasta la creencia correcta **sin** aumentar las creencias falsas | `night = none` vs `replay-only` vs `agenda-ungated` vs `agenda-gated` | Bocados hasta el criterio; tasa de reglas falsas adoptadas | `gated` no mejora a `replay-only`, o iguala en falsas a `ungated` |
| **H4** | La latencia nerviosa perjudica **menos** cuando los reflejos viven en los órganos (interacción) | 2×2: latencia {0, L} × reflejos {en órgano, en cerebro} | Daño por nocicepción; muertes por desbordamiento | Ausencia de interacción (efecto de la ablación igual con y sin latencia) |
| H5 | W = κ·V permite **revaloración instantánea** tras privación | `wanting = kappa` vs `V-only` | Acercamiento en el primer reencuentro tras desequilibrio salino o hídrico | Hacen falta ensayos de reaprendizaje igual que con V solo |
| H6 | El estómago de dos escalas produce saciedad anticipatoria | `stomach = two-stage` vs `instant` | Ticks hasta dejar de beber; respuesta a "beber en falso" | Sin cese temprano ni reanudación |
| H7 | La curiosidad por progreso evita trampas de ruido | `curiosity = LP` vs `uncertainty` | Fracción de bocados experimentales en la "tragaperras" | Fracción igual o mayor |

Un detalle para H1: la condición "innata" **no** debe ser el Fagi actual. Debe ser LIBERA con V precargado y congelado. Así se aísla el factor "aprendido frente a innato" del factor "arquitectura nueva frente a vieja", que es justo la diferencia con Creatures. Para H2, el resultado de Bryson vuelve plausible el de verdad que `freeflow+central` empate o pierda frente a una jerarquía bien secuenciada. **Un resultado nulo o inverso sería publicable**, y debería preregistrarse como tal.

### Métricas inspiradas en Tyrrell, operacionalizadas

Como solo el requisito 12 está verificado textualmente, propongo métricas que **no dependen de la redacción exacta** de los otros trece y que se pueden mapear a ellos cuando se coteje la tesis. La viabilidad se mide como supervivencia y como ∫D(t)dt con el impulso no lineal. La persistencia y el titubeo, como cambios de acción por minuto y duración media de los episodios consumatorios. El oportunismo y el compromiso, como la fracción de acciones que reducen más de un déficit a la vez (comer en el camino hacia el agua). Esto prueba el requisito 12, aunque Crabbe anticipa un efecto pequeño. La interrupción se mide como latencia de respuesta a una nocicepción. La equidad entre subproblemas, como el máximo de los déficits normalizados en el tiempo. El aprendizaje se mide con bocados hasta el criterio, retractaciones de reglas y tokens del DSL frente al número de frutas aprendidas.

### Diseño experimental preregistrable

El repositorio ya tiene la disciplina: protocolos congelados en `docs/research/*-protocol.md`, un `preregistration.md`, y en `research/stats.js` las funciones `bootstrapCI`, `paired`, `holm` y `lineagesNeeded`. LIBERA debe reutilizarlas. La unidad experimental es la **semilla de Fagi**, con mapa y mundo fijos dentro de cada bloque y **números aleatorios comunes entre condiciones**: la misma semilla en todas las ramas de la ablación, comparada por pares. Se replica en varios `--map-seed` como factor aleatorio. El tamaño de muestra se fija con un **piloto que no se analiza para las hipótesis** y con `lineagesNeeded(dz)` para un efecto mínimo de interés declarado de antemano (por ejemplo, d_z = 0,3 en la métrica primaria). Se preregistran las métricas primarias, la dirección de cada hipótesis, el margen de equivalencia de H1, la corrección de Holm para H5–H7, las reglas de exclusión (por ejemplo, ejecuciones que mueren antes del primer cambio en H1) y el criterio de parada. Todo queda congelado con un commit antes de correr la batería confirmatoria, como ya hace el proyecto ("Protocol: explore or come back (frozen)").

---

## Plan por fases sobre el código existente, sin romper el determinismo

La regla rectora es la que el propio `src/organism.js` ya aplica: **`config.js` arranca todos los bloques apagados**, de modo que los tests y el batch son el mundo preregistrado salvo que se pida otra cosa. Cada pieza de LIBERA es un bloque nuevo con `enabled: 0`, registrado en `ORGANISM` (o en un registro hermano `LIBERA`), activable con `--set` en `scripts/batch.js` y guardado con los ajustes de la sesión para que la repetición sepa qué mundo era. **La semilla del cuerpo debe ser un sub-flujo derivado de la semilla de Fagi**, no extracciones extra del flujo de Fagi. Si no, activar el ruido nervioso desplazaría las decisiones aleatorias existentes y rompería los números aleatorios comunes entre ablaciones. `--check` (misma semilla dos veces da una sesión idéntica) debe pasar en todas las combinaciones de flags.

```
 Fase 0 ─► Fase 1 ─► Fase 2 ─► Fase 3 ─► Fase 4 ─► Fase 5 ─► Fase 6
  bus      órganos   depósitos  selector   humores   sueño     batería
 (no-op)   +reflejos +W=κ·V    free-flow             +agenda   preregistrada
                                +central             +XCS/DSL
  │          │          │          │          │         │          │
  └ test: flags OFF ⇒ sesión idéntica byte a byte a main (golden) ─┘
```

**La fase 0 es el bus vacío.** Se crea `src/bus.js` con colas por nervio (latencia en segundos → ticks, ruido del sub-flujo "cuerpo") y canales de humor. Con `ORGANS.enabled = 0` no se instancia nada. El test clave es un *golden test*: con todos los flags nuevos apagados, `scripts/batch.js --check` y la suite `npm test` dan exactamente lo mismo que en `main`. Este test protege todo lo demás.

**La fase 1 son los órganos con reflejos.** Bloque `ORGANS` en `config.js` y un directorio `src/organs/` con estómago (oral → post-absortivo), hipotálamo/sed (consigna con Δs alostático desactivable), músculos (Xia–Frey Law), ojo, nariz, lengua (aliestesia sobre `TASTE.valence`) y nociceptores. Los reflejos locales (escupir, retirarse, dejar de beber) viven en el órgano. Hoy, reflejos como `thermalReflex` o `leaveWater` viven en `decision/survive.js`; con el flag encendido se trasladan, y con el flag apagado se quedan donde están. `interoception.js` (`snapshotBody`/`feel`) pasa a leer de los órganos cuando existen y gana la opción del impulso no lineal (`FEEL.drive = {m, n}`), con m = n = 1 por defecto para que nada cambie. Tests nuevos: curva de resistencia de los músculos, "beber en falso", caída del agrado dentro de una comida y la interacción latencia × reflejo en un escenario mínimo.

**La fase 2 son los depósitos y los liberadores aprendidos.** Bloque `DRIVES`: cada depósito se llena desde las señales de órganos, y su válvula es `W = κ(estado)·V(señal)`, donde V sale de la memoria valor+confianza existente (`memory.js`, `learned/cues.js`). Se añade el modo `releasers: 'innate'` (V precargado y congelado) que exige H1. La curiosidad entra como un depósito más, alimentado por el progreso de aprendizaje por concepto, calculado sobre el registro de `episodes.js` con ventanas fijas.

**La fase 3 es el selector.** `src/decision/freeflow.js` (controlador de `DECIDE`; `src/choice.js` ya existe) suma activaciones de todos los depósitos, sesgos de reglas y bonus de progreso por candidato. Encima va un selector central con histéresis y una lista corta de secuencias. **La lista `RULES` de `decision.js` no se borra**: queda como condición `selector = priority`, que es la línea base de H2. Lo que hoy explica `brainmap` ("qué regla respondió") debe ampliarse para mostrar la descomposición de la activación ganadora. Esto conserva la legibilidad, que es una de las señas de Fagi.

**La fase 4 son los humores.** Canales `hormone.*` con el contrato de Doya. DA modula la regla Hebbiana de tres factores en `synapses.js`. NE es la temperatura del selector y el reset por sorpresa, que formaliza la duda actual. ACh es la tasa de aprendizaje de valor/confianza. STRESS es la timidez ante lo nuevo. Las ganancias de receptor son adaptativas y opcionales.

**La fase 5 es el sueño en etapas y las reglas XCS.** En `consolidation.js`/`night/`: NREM con reproducción priorizada (|RPE| × recencia × relevancia de impulso), SHY sobre las sinapsis Hebbianas, y REM que recombina rasgos y añade ruido para generar preguntas. La agenda se ordena por progreso esperado × seguridad, y cada experimento registra la hipótesis que prueba. En `learned/` (`rules.js`, `synth.js`, `dsl.js`), las reglas ganan predicción, error, aptitud y experiencia. Una pasada de compresión por subexpresiones comunes sobre el AST del DSL, aceptada si reduce la longitud de descripción, emite `concept.new` hacia `concepts.js`. La **puerta de admisión** exige verificación por reproducción *y* un experimento real confirmatorio. Las reglas retiradas se archivan, no se borran.

**La fase 6 es la batería.** `research/libera/` sigue el patrón de `research/organism2/` (`design.js`, `run.js`, `analyze.js`). Lleva protocolo y preregistro congelados antes de correr, piloto separado y un informe con intervalos bootstrap por semilla.

Un riesgo práctico merece mención. El rediseño toca la ruta caliente de cada tick, así que hay que **medir el coste por tick en el batch** desde la fase 0. Si el bus con colas por nervio duplica el tiempo de las corridas, el tamaño de muestra preregistrado se vuelve caro. Conviene fijar un presupuesto (por ejemplo, ≤1,5× el tiempo actual) como criterio de aceptación de cada fase.

---

## Conclusión

El hallazgo que más cambia el plan no es una referencia mal fechada. Es que **la pregunta científica interesante se desplaza de "¿free-flow es mejor que WTA?" a "¿qué gana una criatura que no nace sabiendo qué buscar?"**. La primera ya tiene respuesta mixta en la literatura (Tyrrell, Bryson, Crabbe). La segunda es justo donde Fagi se separa de *Creatures*: allí el genoma y el sueño ensayan instintos; aquí el sueño fabrica preguntas y el día siguiente las juzga. El modelo de "querer" de Zhang y Berridge da la pieza formal que convierte el depósito de Lorenz, criticado con razón por Hinde como fisiología, en una variable aprendible y ablacionable. Por eso LIBERA se puede defender como método y no solo como colección de ideas.

La segunda implicación es metodológica. Como cada componente tiene precedentes, **el valor del trabajo dependerá casi entero de las ablaciones y del preregistro**, y un resultado nulo en H2 o H3 informaría tanto como uno positivo. Antes de escribir una sola línea de afirmación de novedad hay que hacer tres comprobaciones manuales que este informe no pudo completar: leer el informe técnico de Creatures (CSRP 434), en especial el lóbulo de conceptos y los órganos; revisar Grandroids/Phantasia e IMGEP; y cotejar los 14 requisitos de Tyrrell en la tesis de ERA.

---

## Bibliografía

Estado: **[V]** verificada por registro de editorial, índice o repositorio · **[C]** corregida respecto al plan · **[P]** parcialmente verificada (se indica qué falta) · **[CP]** conocimiento previo, no verificada en esta sesión. No se leyó ningún texto completo.

**Selección de acción, etología y robótica**

- [V] Avila-García, O., & Cañamero, L. (2005). Hormonal modulation of perception in motivation-based action selection architectures. *Proc. AISB'05 Symposium "Agents that Want and Like"*. (La sede AISB no se confirmó en el registro.) https://uhra.herts.ac.uk/id/eprint/12751/
- [P] Avila-García, O., Cañamero, L., & te Boekhorst, R. (2003). Analyzing the performance of "winner-take-all" and "voting-based" action selection policies within the two-resource problem. *ECAL 2003*, LNCS 2801. (Coautores y número de LNCS por conocimiento previo.) https://link.springer.com/chapter/10.1007/978-3-540-39432-7_79
- [P] Avila-García, O., & Cañamero, L. (2004). "Using hormonal feedback to modulate action selection in a competitive scenario", SAB'04. [errata: existe, *From Animals to Animats 8*, pp. 243–252, doi:10.7551/mitpress/3122.003.0031]
- [V] Blumberg, B. (1994). Action-selection in Hamsterdam: Lessons from ethology. *From Animals to Animats 3 (SAB'94)*, MIT Press, 108–117. (Vía cita secundaria.) https://arxiv.org/pdf/cs/0211040
- [V] Blumberg, B., Downie, M., Ivanov, Y., Berlin, M., Johnson, M. P., & Tomlinson, B. (2002). Integrated learning for interactive synthetic characters. *SIGGRAPH 2002*. https://history.siggraph.org/?p=118428
- [V] Brooks, R. A. (1986). A robust layered control system for a mobile robot. *IEEE Journal of Robotics and Automation*, 2(1), 14–23. https://doi.org/10.1109/JRA.1986.1087032
- [CP] Brooks, R. A. (1990). Elephants don't play chess. *Robotics and Autonomous Systems*, 6(1–2), 3–15. (Verificado en local: contiene literalmente "the world is its own best model".)
- [V] Brooks, R. A. (1991). Intelligence without representation. *Artificial Intelligence*, 47(1–3), 139–159. (DOI 10.1016/0004-3702(91)90053-M por conocimiento previo.) https://jmvidal.cse.sc.edu/lib/brooks91b.html
- [V] Bryson, J. J. (2000). Hierarchy and sequence vs. full parallelism in action selection. *From Animals to Animats 6 (SAB 2000)*, MIT Press, 147–156. https://researchportal.bath.ac.uk/en/publications/hierarchy-and-sequence-vs-full-parallelism-in-action-selection/
- [P] Crabbe, F. L. (2007). Compromise strategies for action selection. *Phil. Trans. R. Soc. B*, 362(1485), 1559–1571. (Volumen y páginas por conocimiento previo.) https://pubmed.ncbi.nlm.nih.gov/17428780/
- [V] Gat, E. (1998). On three-layer architectures. En D. Kortenkamp, R. P. Bonasso & R. Murphy (Eds.), *Artificial Intelligence and Mobile Robots* (pp. 195–210). AAAI Press / MIT Press. https://u.cs.biu.ac.il/~galk/teach/current/intsys/readings/on-three-layer-arch-tla-1998.pdf
- [V] Hinde, R. A. (1956). Ethological models and the concept of 'drive'. *British Journal for the Philosophy of Science*, 6(24), 321–331. https://dc2.philarchive.org/rec/HINEMA
- [C] Hinde, R. A. (1960). Energy models of motivation. *Symposia of the Society for Experimental Biology*, 14, 199–213. https://pubmed.ncbi.nlm.nih.gov/13714429/
- [C] Hull, C. L. (1943). *Principles of Behavior: An Introduction to Behavior Theory*. New York: D. Appleton-Century Company [verificado: LCCN 43013698]. https://tecfa.unige.ch/themes/sa2/act-app-dos2-fic-drive.htm
- [V] Lorenz, K. (1950). The comparative method in studying innate behaviour patterns. *Symposia of the Society for Experimental Biology*, 4, 221–268. http://klha.at/papers/1950-InnateBehavior.pdf
- [C] Maes, P. (1989). How to do the right thing. *Connection Science*, 1(3), 291–323. https://doi.org/10.1080/09540098908915643
- [V] Redgrave, P., Prescott, T. J., & Gurney, K. (1999). The basal ganglia: a vertebrate solution to the selection problem? *Neuroscience*, 89(4), 1009–1023. https://eprints.whiterose.ac.uk/107033
- [V] Rosenblatt, J. K., & Payton, D. W. (1989). A fine-grained alternative to the subsumption architecture for mobile robot control. *Proc. IJCNN 1989*, vol. 2, 317–323. https://doi.org/10.1109/IJCNN.1989.118717
- [CP] Tinbergen, N. (1951). *The Study of Instinct*. Oxford: Clarendon Press.
- [V] Toates, F. M. (1986). *Motivational Systems*. Cambridge University Press. https://www.cambridge.org/9780521318945
- [V] Tyrrell, T. (1993). *Computational Mechanisms for Action Selection*. PhD thesis, University of Edinburgh. https://era.ed.ac.uk/handle/1842/20257
- [C] Tyrrell, T. (1993). The use of hierarchies for action selection. *Adaptive Behavior*, 1(4), 387–420 [errata]. https://doi.org/10.1177/105971239300100401
- [P] Tyrrell, T. (1994). An evaluation of Maes's bottom-up mechanism for behavior selection. *Adaptive Behavior*, 2(4), 307–348. (Páginas por conocimiento previo.) https://doi.org/10.1177/105971239400200401

**Vida artificial y trabajos previos**

- [V] Grand, S., & Cliff, D. (1998). Creatures: Entertainment software agents with artificial life. *Autonomous Agents and Multi-Agent Systems*, 1(1), 39–57. https://www.springerprofessional.de/en/creatures-entertainment-software-agents-with-artificial-life/11864520
- [V] Park, J. S., et al. (2023). Generative agents: Interactive simulacra of human behavior. arXiv:2304.03442. https://arxiv.org/pdf/2304.03442v1
- [V] Tu, X., & Terzopoulos, D. (1994). Artificial fishes: physics, locomotion, perception, behavior. *SIGGRAPH 94*, 43–50. https://history.siggraph.org/?p=119677
- [P] Wang, G., Xie, Y., Jiang, Y., Mandlekar, A., Xiao, C., Zhu, Y., Fan, L., & Anandkumar, A. (2023). Voyager: An open-ended embodied agent with large language models. arXiv:2305.16291; *TMLR* 2024 (autores y versión TMLR no cotejados del todo). https://arxiv.org/abs/2305.16291v2
- [V] Wilson, S. W. (1994). ZCS: A zeroth level classifier system. *Evolutionary Computation*, 2(1), 1–18. https://uwe-repository.worktribe.com/OutputFile/1079603
- [V] Wilson, S. W. (1995). Classifier fitness based on accuracy. *Evolutionary Computation*, 3(2), 149–175. https://www.csse.monash.edu.au/~jonmc/CSE451/Topics/Resources/FIT4012_1_Lecture8.pdf
- [V] Yaeger, L. (1994). Polyworld. https://cis.temple.edu/tagit/presentations/PolyWorld.pdf

**Homeostasis, motivación e interocepción**

- [V] Barrett, L. F., & Simmons, W. K. (2015). Interoceptive predictions in the brain. *Nature Reviews Neuroscience*, 16(7), 419–429. https://pmc.ncbi.nlm.nih.gov/articles/PMC4731102/
- [V] Bechara, A., Damasio, H., Tranel, D., & Damasio, A. R. (1997). Deciding advantageously before knowing the advantageous strategy. *Science*, 275(5304), 1293–1295. https://iro.uiowa.edu/esploro/outputs/journalArticle/Deciding-advantageously-before-knowing-the-advantageous/9984002580202771
- [V] Berridge, K. C. (2009). 'Liking' and 'wanting' food rewards. *Physiology & Behavior*, 97(5), 537–550. https://pmc.ncbi.nlm.nih.gov/articles/PMC2717031
- [V] Berridge, K. C., & Robinson, T. E. (1998). What is the role of dopamine in reward? *Brain Research Reviews*, 28(3), 309–369. https://lecerveau.mcgill.ca/flash/capsules/articles_pdf/dopamine.pdf
- [V] Betley, J. N., et al. (2015). Neurons for hunger and thirst transmit a negative-valence teaching signal. *Nature*, 521(7551), 180–185. https://pubmed.ncbi.nlm.nih.gov/25915020/
- [P] Blundell, J. E., & Burley, V. J. (1987). Cascada de saciedad (revista y páginas no confirmadas). https://edepot.wur.nl/293913
- [V] Cabanac, M. (1971). Physiological role of pleasure. *Science*, 173(4002), 1103–1107. https://www.wikipedia.com/wiki/Alliesthesia
- [V] Cañamero, D. (1997). Modeling motivations and emotions as a basis for intelligent behavior. *Proc. Agents '97*, 148–155. https://dblp.uni-trier.de/pid/34/1508.html
- [V] Chen, Y., Lin, Y.-C., Kuo, T.-W., & Knight, Z. A. (2015). Sensory detection of food rapidly modulates arcuate feeding circuits. *Cell*, 160(5), 829–841. https://pmc.ncbi.nlm.nih.gov/articles/4373539
- [CP] Damasio, A. R. (1994). *Descartes' Error*. Putnam.
- [V] Friston, K. (2010). The free-energy principle: a unified brain theory? *Nature Reviews Neuroscience*, 11(2), 127–138. https://sites.socsci.uci.edu/~rfutrell/readings/friston2010freeenergy.pdf
- [V] Keramati, M., & Gutkin, B. (2014). Homeostatic reinforcement learning for integrating reward collection and physiological stability. *eLife*, 3, e04811. https://elifesciences.org/articles/04811
- [V] Lewis, M., & Cañamero, L. (2016). Hedonic quality or reward? *Adaptive Behavior*, 24(5), 267–291. https://journals.sagepub.com/doi/10.1177/1059712316666331
- [V] Maia, T. V., & McClelland, J. L. (2004). A reexamination of the evidence for the somatic marker hypothesis. *PNAS*. https://pmc.ncbi.nlm.nih.gov/articles/PMC528759
- [P] Man, K., & Damasio, A. (2019). Homeostasis and soft robotics in the design of feeling machines. *Nature Machine Intelligence*, 1, 446–452. (Verificado: solo 2 autores; 1(10), doi:10.1038/s42256-019-0103-7.) https://techxplore.com/news/2019-11-ai-chapter-machines.html
- [V] Pezzulo, G., Rigoli, F., & Friston, K. (2015). Active inference, homeostatic regulation and adaptive behavioural control. *Progress in Neurobiology*, 134, 17–35. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4779150/
- [V] Seth, A. K. (2013). Interoceptive inference, emotion, and the embodied self. *Trends in Cognitive Sciences*, 17(11), 565–573. https://sro.sussex.ac.uk/id/eprint/49586/
- [V] Seth, A. K., & Friston, K. J. (2016). Active interoceptive inference and the emotional brain. *Phil. Trans. R. Soc. B*, 371, 20160007. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5062097/
- [V] Sterling, P., & Eyer, J. (1988). Allostasis: A new paradigm to explain arousal pathology. En S. Fisher & J. Reason (Eds.), *Handbook of Life Stress, Cognition and Health* (pp. 629–649). Wiley. https://en.wikipedia.org/wiki/Allostasis
- [V] Sterling, P. (2012). Allostasis: a model of predictive regulation. *Physiology & Behavior*, 106(1), 5–15. https://pmc.ncbi.nlm.nih.gov/articles/PMC4166604
- [V] Xia, T., & Frey Law, L. A. (2008). A theoretical approach for modeling peripheral muscle fatigue and recovery. *Journal of Biomechanics*, 41(14), 3046–3052. https://iro.uiowa.edu/esploro/outputs/journalArticle/A-theoretical-approach-for-modeling-peripheral/9984047678402771
- [P] Yoshida, N., et al. (2024). Emergence of integrated behaviors through direct optimization for homeostasis. *Neural Networks*, 177, 106379. (Volumen y artículo vía extracto.) https://www.sciencedirect.com/science/article/pii/S0893608024003034
- [V] Zhang, J., Berridge, K. C., Tindell, A. J., Smith, K. S., & Aldridge, J. W. (2009). A neural computational model of incentive salience. *PLoS Computational Biology*, 5(7), e1000437. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2703828/
- [P] Zimmerman, C. A., et al. (2016). Thirst neurons anticipate the homeostatic consequences of eating and drinking. *Nature*, 537, 680–684. (Volumen y páginas por conocimiento previo.) https://www.nature.com/articles/nature18950

**Neuromodulación y hormonas artificiales**

- [V] Doya, K. (2002). Metalearning and neuromodulation. *Neural Networks*, 15(4–6), 495–506. https://mailman.srv.cs.cmu.edu/pipermail/connectionists/2002-August/020829.html
- [P] Krichmar, J. L. (2008). The neuromodulatory system. *Adaptive Behavior*, 16(6), 385–399. (Solo por citas secundarias.) https://pmc.ncbi.nlm.nih.gov/articles/PMC3564231
- [P] Neal, M., & Timmis, J. (2003). Timidity: A useful emotional mechanism for robot control? *Informatica*, 27, 197–204. (El número aparece como 2 o como 4 según el índice.) https://www.cs.kent.ac.uk/pubs/2003/1635
- [C] Shen, W.-M., Will, P., Galstyan, A., & Chuong, C.-M. (2004). Hormone-inspired self-organization and distributed control of robotic swarms. *Autonomous Robots*, 17(1), 93–105. https://link.springer.com/article/10.1023/B:AURO.0000032940.08116.f1
- [V] Shen, W.-M., Salemi, B., & Will, P. (2002). Hormone-inspired adaptive communication and distributed control for CONRO self-reconfigurable robots. *IEEE Trans. Robotics and Automation*, 18(5), 700–712. https://robots.isi.edu/prl/b2hd-shen2002hormone-inspired-adaptive-communication-and-distributed.html
- [V] Timmis, J., Neal, M., & Thorniley, J. (2009). An adaptive neuro-endocrine system for robotic systems. *IEEE RiiSS 2009*. https://research.aber.ac.uk/en/publications/an-adaptive-neuro-endocrine-system-for-robotic-systems/
- [V] Yu, A. J., & Dayan, P. (2005). Uncertainty, neuromodulation, and attention. *Neuron*, 46(4), 681–692. https://modeldb.science/citations/233488

**Sueño, curiosidad y reglas**

- [V] Ellis, K., et al. (2021). DreamCoder: Bootstrapping inductive program synthesis with wake-sleep library learning. *PLDI '21*. https://people.csail.mit.edu/asolar/papers/EllisWNSMHCST21.pdf
- [V] Gottlieb, J., Oudeyer, P.-Y., Lopes, M., & Baranes, A. (2013). Information-seeking, curiosity, and attention. *Trends in Cognitive Sciences*, 17(11), 585–593. https://pmc.ncbi.nlm.nih.gov/articles/PMC4193662
- [V] Ha, D., & Schmidhuber, J. (2018). Recurrent world models facilitate policy evolution. *NeurIPS 31*. https://papers.nips.cc/paper/7512-recurrent-world-models-facilitate-policy-evolution
- [V] Hafner, D., Lillicrap, T., Ba, J., & Norouzi, M. (2020). Dream to control. *ICLR 2020*. https://iclr.cc/virtual/2020/poster/1737
- [V] Hoel, E. (2021). The overfitted brain: Dreams evolved to assist generalization. *Patterns*, 2(5), 100244. https://pmc.ncbi.nlm.nih.gov/articles/PMC8134940
- [V] King, R. D., et al. (2009). The automation of science. *Science*, 324(5923), 85–89. https://research.aber.ac.uk/en/publications/the-automation-of-science/
- [V] Kumaran, D., Hassabis, D., & McClelland, J. L. (2016). What learning systems do intelligent agents need? *Trends in Cognitive Sciences*, 20(7), 512–534. https://web.stanford.edu/~jlmcc/papers/KumaranHassabisMcClelland16FinalMS.pdf
- [V] Lake, B. M., Ullman, T. D., Tenenbaum, J. B., & Gershman, S. J. (2017). Building machines that learn and think like people. *Behavioral and Brain Sciences*, 40, e253. https://arxiv.org/abs/1604.00289
- [P] Lewis, P. A., Knoblich, G., & Poe, G. (2018). How memory replay in sleep boosts creative problem-solving. *Trends in Cognitive Sciences*, 22(6), 491–503. (Páginas de memoria.) https://pmc.ncbi.nlm.nih.gov/articles/PMC7543772/
- [V] McClelland, J. L., McNaughton, B. L., & O'Reilly, R. C. (1995). Why there are complementary learning systems in the hippocampus and neocortex. *Psychological Review*, 102(3), 419–457. https://stanford.edu/%7Ejlmcc/papers/McCMcNaughtonOReilly95.pdf
- [V] Muggleton, S. (1991). Inductive logic programming. *New Generation Computing*, 8(4), 295–318. https://unpaywall.org/10.1007%2FBF03037089
- [V] Oudeyer, P.-Y., Kaplan, F., & Hafner, V. V. (2007). Intrinsic motivation systems for autonomous mental development. *IEEE Trans. Evolutionary Computation*, 11(2), 265–286. https://infoscience.epfl.ch/record/115468?ln=en
- [P] Schmidhuber, J. (1991). A possibility for implementing curiosity and boredom in model-building neural controllers. *From Animals to Animats (SAB'90)*, MIT Press, 222–227. (Páginas de memoria.) https://mlanthology.org/misc/1991/schmidhuber1991misc-curious
- [P] Sutton, R. S. (1991). Dyna, an integrated architecture for learning, planning, and reacting. *SIGART Bulletin*, 2(4), 160–163. (Sede en conflicto con las actas AAAI.) https://papersdb.cs.ualberta.ca/~papersdb/view_publication.php?pub_id=500
- [V] Tadros, T., et al. (2022). Sleep-like unsupervised replay reduces catastrophic forgetting in artificial neural networks. *Nature Communications*, 13. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9755223/
- [V] Tononi, G., & Cirelli, C. (2006). Sleep function and synaptic homeostasis. *Sleep Medicine Reviews*, 10(1), 49–62. https://pubmed.ncbi.nlm.nih.gov/16376591/
- [V] Tononi, G., & Cirelli, C. (2014). Sleep and the price of plasticity. *Neuron*, 81(1), 12–34. https://pmc.ncbi.nlm.nih.gov/articles/3921176/
- [V] Wilson, M. A., & McNaughton, B. L. (1994). Reactivation of hippocampal ensemble memories during sleep. *Science*, 265(5172), 676–679. https://pubmed.ncbi.nlm.nih.gov/8036517/
