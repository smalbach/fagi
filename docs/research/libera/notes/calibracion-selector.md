# Calibración del selector (desarrollo, 2026-10-02)

Exploratorio, no confirmatorio. Mapa 7, 16 vidas de 3600 s (semillas 7000–7015), `--tyrrell`. Código `17302f5`.

**Pregunta.** Tras el nulo de H2: ¿algún ajuste del selector central iguala la continuidad del programa sin perder lo que gana siguiendo a la necesidad?

## Persistencia (`hold`) e intervalo entre votos (`every`)

Con `hold` de 0,15 a 0,8 y `every` de 0,5 a 4 s, nada cambia de fondo:
- 8,2–8,8 cambios de acción por minuto (programa 8,25);
- titubeo 0,16–0,22 (programa 0,13);
- come lo que tiene al alcance solo el 65–83 % de las veces (programa 98 %).

## Bono consumatorio (`consume`, Tyrrell 4–5)

| `consume` | come al alcance | r(hambre) | de paso | compromiso | cambios/min | titubeo (sin bocados de paso) |
|---|---|---|---|---|---|---|
| programa | 0,98 | −0,15 | 0,12 | 0,0012 | 8,25 | 0,11 |
| 0 | 0,83 | −0,03 | 0,11 | 0,0025 | 8,24 | — |
| 2 | 0,86 | +0,01 | 0,12 | 0,0037 | 9,46 | 0,20 |
| 4 | **0,96** | **+0,07** | **0,22** | **0,0062** | 10,33 | 0,22 |
| 6 | 0,92 | — | — | — | 12,84 | 0,32 |

Con `consume` = 4 el selector cumple los requisitos 3, 4–5, 9 y 11–12 mejor que el programa, pero cambia de acción más.

## De dónde sale el titubeo

Contando qué pares de acciones van y vuelven:
- **votar en cada paso** (`every` = 0) da miles de vaivenes descanso ↔ explorar: hay empates casi exactos entre líneas;
- **votar cada 0,5 s** deja sobre todo el vaivén **rastro ↔ fruta dentro de la misma línea** (`pursue`), 3–4 veces más que con el programa.

Probé darle la histéresis a la **línea** activa en vez de al objetivo exacto (el punto del rastro se mueve en cada paso). **Empeoró** (titubeo 0,34) y lo revertí: el vaivén está dentro de `pursue`, no entre líneas.

**Medida corregida.** Volver a lo que hacía tras comer o beber de paso es oportunismo (R9), no titubeo. Ahora `--tyrrell` lo reporta también sin esos casos. La batería H2 ya corrida no cambia.

## Conclusión

Ningún parámetro del selector iguala la continuidad del programa: es el hueco que Tyrrell dejó con "?" y que Bryson aprovechó. Con `consume` = 4 se gana en seguir la necesidad, comer de paso y combinar necesidades, a cambio de más cambios. Si se quisiera confirmar, haría falta un protocolo nuevo (H2b: `freeflow+central` con `consume` 4 frente a `program`) con la medida de titubeo corregida.
