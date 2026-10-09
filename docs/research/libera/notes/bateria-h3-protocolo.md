# H3: protocolo congelado (2026-10-02, antes de correr)

Código `feat/evolving-body` (commit de `SCIENCE`). Script: `bateria-h3.mjs`.

**Hipótesis H3.** La noche científica (pregunta con predicción → experimento → veredicto, agenda por progreso × seguridad) acorta el tiempo hasta la creencia correcta **sin** más creencias falsas.

**Mundo.** Organismo de hoy (`enableOrganism`; repaso nocturno apagado, como está por defecto), 6 especies, mapas de desarrollo `300000 + 17·semilla`, vidas de 2400 s, dt 0,1, semillas 1–60.

**Condiciones:**
- `none`: sin experimentos (`EXPERIMENT.enabled = 0`);
- `agenda`: la agenda actual;
- `asked`: noche científica con el orden actual. Control: solo añade predicciones y veredictos, así que debe comportarse igual que `agenda`;
- `lp`: noche científica con orden por progreso × seguridad.

**Medidas:**
- juicio final (como en `research/organism/life.js`);
- tiempo hasta juicio ≥ 0,8 (`reached`; null si no llega) y área bajo la curva de juicio (cada 200 s);
- creencias falsas al final: evita fruta buena (`falseAvoid`) o confía en veneno (`falseTrust`);
- dosis de veneno, fracción de especies buenas encontradas y supervivencia.

**Análisis declarado.** Diferencias pareadas por semilla, `lp − agenda` y `agenda − none`, con media e IC 95 % por bootstrap.
- H3 se sostiene si `lp` mejora el área o el tiempo hasta la creencia correcta frente a `agenda`, con un IC que excluye 0, y además `falseAvoid + falseTrust` no sube (el IC de la diferencia no queda por encima de 0).
- `asked` debe ser idéntica a `agenda`; si no lo es, hay un error.
