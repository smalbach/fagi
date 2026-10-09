# Literatura reciente (2019–2026): homeostasis, valor según el estado, selección y criaturas

Búsqueda del 2026-10-02.
- **[V]** confirmado en arXiv, PMC o la página del editor.
- **[E]** solo extracto. Verificar antes de citar.

## A. Agentes homeostáticos e IA interoceptiva

| ref | qué muestra | relación con LIBERA |
|---|---|---|
| **Grimbly, Kuske, Boonstra, Bassett, van Hoof, Hodson, Rosman, Smith, Solms & Shock (ago. 2026)**, arXiv:2608.04232 [V] | Agente de inferencia activa con 4 necesidades. Reparte la "precisión interoceptiva" κ hacia la más urgente y aprende en línea qué sitio satisface cada necesidad (Dirichlet) | **La amenaza más directa a (i).** Marco bayesiano, sin selector con persistencia. **Leerlo completo** |
| Yoshida, Sprekeler & Gutkin (2025), arXiv:2507.04998 [V] | Revisión de HRRL: aversión al riesgo y regulación anticipatoria emergen | Base actual de (i) |
| Yoshida, Arikawa, Kanazawa & Kuniyoshi (2024), *PNAS Nexus* 3(12): pgae540 [V] | HRRL con dos nutrientes reproduce la geometría nutricional | Apoyo a los órganos |
| **Dulberg, Dubey, Berwian & Cohen (2023)**, PNAS [E] | Un subagente por necesidad homeostática, que compiten al decidir: explora y se adapta mejor que un agente monolítico | **Muy relevante para (ii)**: módulos por impulso + árbitro |
| Laurençon et al. (2024), arXiv:2401.08999 [V] | HRRL en tiempo y espacio continuos | — |
| Lee et al. (2023/2025), arXiv:2309.05999 [V] | Posición: IA interoceptiva | Encuadre |
| Tschantz et al. (2022), *Biol. Psychol.* [E] | Control homeostático, alostático y dirigido a metas con inferencia activa | Saciedad anticipatoria |
| Uchida, Hikida & Yamashita (2022), *Front. Neurosci.* 16: 857009 [V] | HRRL reproduce el apetito de sodio | — |
| Pihlakas (2024), arXiv:2410.00081 [E] | Benchmarks en los que maximizar sin límite un objetivo homeostático es un fallo | Criterio de evaluación |
| Yoshida & Man (2025), arXiv:2506.12894 [V]; Horibe & Yoshida (2024), arXiv:2411.12304 [V]; Christov-Moore et al. (2025), arXiv:2510.07117 [V] | Prosocialidad homeostática; agentes mortales | Encuadre |
| Khan (2025), arXiv:2508.12791 [V] | Animats con transductores hormonales alostáticos | Humores |

## B. Valor modulado por el estado ("querer")

| ref | qué muestra | relación |
|---|---|---|
| **van Swieten & Bogacz (2020)**, *PLOS Comput. Biol.* 16(5): e1007465 [V] | La motivación (distancia a la consigna) escala la utilidad dentro de las vías Go/NoGo de los ganglios basales | **Casi W = κ·V con selector: amenaza a (i)+(ii)** |
| **Gribkova, Catanho & Gillette (2020)**, ASIMOV, *Sci. Rep.*, doi:10.1038/s41598-020-66465-0 [V] | Criatura artificial sin LLM: el incentivo aprendido (Rescorla-Wagner) se combina con la saciedad | **Precedente directo de (i)**. Usa una señal innata (betaína); Fagi tiene **cero** liberadores innatos |
| Grove et al. (2022), *Nature* 608, doi:10.1038/s41586-022-04954-0 [E] | Subsistemas de dopamina siguen las etapas oral, gástrica y post-absortiva | Señales de órganos como señal de enseñanza de V |
| Zimmerman et al. (2019), *Nature* 568 [E]; Augustine et al. (2019), *Neuron* 103(2) [E] | Saciedad de la sed por etapas. **Beber libera dopamina, reducir la necesidad no** | Advertencia: "querer" ≠ reducir la necesidad |
| Burnett et al. (2019), *eLife* 8: e44527 [E] | El hambre suprime otras conductas | Calibrar κ |
| Juechems & Summerfield (2019), *TiCS* 23(10) [E]; Hulme, Morville & Gutkin (2019), *Phys. Life Rev.* 31 [E] | El valor deriva de metas y estado interno; revisión de HRL | Teoría |

## C. Selección y persistencia

- **Richman, Ticea, Allen, Deisseroth & Luo (2023)**, *Nature* 623: 571–579, doi:10.1038/s41586-023-06715-z [E]. Ratones con hambre y sed eligen en **rachas persistentes** con cambios estocásticos, como un estado de necesidad que se difunde con ruido. **Valida la persistencia** y ofrece un modelo alternativo: un atractor ruidoso frente a una histéresis determinista.
- Iovino et al. (2022), revisión de behavior trees, *Robot. Auton. Syst.* [E].
- Modelos de ganglios basales 2024–2026 [E]: ninguno los integra con impulsos aprendidos en una criatura completa.
- Shkolnikov (2026), arXiv:2609.11911 [V]: un "id" artificial que decide la persistencia.

## D. Criaturas con cuerpo

- Mosca virtual en MuJoCo: Vaxenburg et al. (2025), *Nature* 643 [E].
- Rata virtual: Aldarondo et al. (2024), *Nature* 632 [E].
- NeuroMechFly v2 (2024), *Nat. Methods* [E].
- BAAIWorm (2024), *Nat. Comput. Sci.* [E].

Todas tienen cuerpo, pero **no tienen impulsos ni órganos**. Fagi se distingue en la motivación.

- Gómez-Martínez et al. (2021), *Cogn. Syst. Res.* 66: 46–66 [E]: saciedad a corto plazo en criaturas virtuales. **Precedente del estómago.**
- Keller et al. (2025), pez cebra virtual con motivación intrínseca, arXiv:2506.00138 [V].
- ASAL y Flow-Lenia (2024–2025): vida artificial de sustrato, no compite.

## Veredicto

- **(i)** El principio no es nuevo: Zhang & Berridge, van Swieten & Bogacz, HRRL, ASIMOV y Grimbly 2026.
  - Diferenciable, con evidencia moderada: **cero** señales innatas de objeto y V entrenado con señales **por etapas de órganos**, separando consumir de reducir la necesidad.
  - Presentarlo como combinación con base biológica, no como idea nueva.
- **(ii)** Como arquitectura no es nueva: Redgrave/Gurney, Tyrrell, van Swieten & Bogacz, Dulberg, Richman.
  - Lo no visto: el selector sobre un **programa que la criatura reescribe**.
  - Usarlo como banco de comparación: histéresis frente a rachas ruidosas de Richman, y modular (Dulberg) frente a central.
- **Riesgo:** Grimbly et al. (2026), dos meses atrás. Leerlo antes de redactar la novedad.
