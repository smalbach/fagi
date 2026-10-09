# H6 (Fase 4): resultados (2026-10-02)

Protocolo congelado: `bateria-h6-protocolo.md` (a19e2d5). Código `7578dfb`. 3 condiciones × 60 vidas de 3600 s; todas sobreviven sin hambre crítica.

## Respuesta

**H6 se sostiene, con un efecto pequeño.** `two-stage − no-satiety`:
- bocados por comida −0,023 [−0,041; −0,009];
- desperdicio −2,5 puntos de hambre [−4,5; −1,1];
- comidas −0,10 [−0,18; −0,03].

Sin sentir el estómago lleno sigue comiendo y desperdicia lo que no cabe; con saciedad anticipatoria, no.

`two-stage − instant`: misma conducta (mismas comidas y bocados). El hambre media sube 0,9 puntos [0,92; 0,97] porque el alimento tarda en llegar, sin tiempo con hambre crítica.

## Lectura

- El efecto es pequeño porque en este mundo **casi cada comida es una sola fruta** (1,07 bocados por comida): come cuando el hambre pasa de 45 y una fruta la baja a ~10. Solo cuando hay varias frutas juntas o come de la despensa tiene ocasión de seguir comiendo.
- La saciedad anticipatoria importaría más con comidas de varios bocados pequeños (frutas más chicas o un umbral de comer más bajo). Eso sería otro protocolo.
- El estómago en dos tiempos es la base natural de los órganos de la Fase 5: `gut` ya escala su capacidad.

## Tabla

| condición | bitesPerBout | wasted | meals | meanHunger | critical | alive |
|---|---|---|---|---|---|---|
| instant | 1.070 | 0.000 | 7.517 | 25.732 | 0.000 | 1.000 |
| two-stage | 1.070 | 0.000 | 7.517 | 26.677 | 0.000 | 1.000 |
| no-satiety | 1.093 | 2.535 | 7.617 | 26.657 | 0.000 | 1.000 |

two-stage − no-satiety:
  bitesPerBout: -0.023 [-0.041, -0.009]
  wasted: -2.535 [-4.507, -1.127]
  meals: -0.100 [-0.183, -0.033]
  meanHunger: 0.020 [-0.133, 0.180]
  critical: 0.000 [0.000, 0.000]
  alive: 0.000 [0.000, 0.000]

two-stage − instant:
  bitesPerBout: 0.000 [0.000, 0.000]
  wasted: 0.000 [0.000, 0.000]
  meals: 0.000 [0.000, 0.000]
  meanHunger: 0.945 [0.917, 0.973]
  critical: 0.000 [0.000, 0.000]
  alive: 0.000 [0.000, 0.000]
