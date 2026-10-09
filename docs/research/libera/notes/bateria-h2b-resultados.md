# H2b (Fase 3): resultados (2026-10-02)

Protocolo congelado: `bateria-h2b-protocolo.md` (a806bb4). Código `7578dfb`. 2 condiciones × 40 vidas de 3600 s, mapa 42, semillas 5200–5239, pareadas.

## Respuesta

**H2b no se sostiene.** `central+consume − program`: **3 victorias, 4 derrotas**.

- **Victorias:** R3 (la conducta sigue a la necesidad, +0,20; la mayor diferencia de toda la Fase 3), R9 (come o bebe de paso, +0,08) y R11–12 (combina necesidades).
- **Derrotas:** R1 (más tiempo crítico sin atender), R7a (+2,7 cambios/min), R7b (titubeo ×2,2 aun sin contar bocados de paso) y R8 (tarda 2 s más en responder al frío o calor).
- **R4–5** (come lo que tiene al alcance) queda igual: 0,96 frente a 0,98.
- **Una muere de frío** (semilla 5238); con el programa viven las 40.
- **Coste:** 30,9 µs por paso frente a 22,3.

**La predicción declarada acertó** en las tres victorias y en la derrota de R7a. **No anticipó R1 ni R8.**

## Por qué R1 empeora

El tiempo crítico sin atender es casi todo **energía**: está agotada y, en vez de descansar, **busca comida** (0,031 de 0,039) o va a beber. El bono consumatorio y el peso del hambre ×κ hacen que comer gane la votación aun con la energía en rojo. El programa pone el descanso antes por orden fijo. Es el coste esperable de un selector que suma votos sin un veto: necesidades distintas no se comparan en la misma escala.

## Lectura

- Sumado a H2, **el free-flow sigue a la necesidad mucho mejor**: R3 0,24 frente a 0,04. Eso es lo que Tyrrell predecía.
- **Pero pierde en lo que una jerarquía da gratis:** contigüidad, persistencia y prioridad de la emergencia. Es el resultado de Bryson (2000), ahora replicado con semillas nuevas.
- **No hay un ajuste de parámetros que cierre la brecha** (calibración y H2b). Lo que falta es estructural. Dos candidatos para el futuro, ambos sin probar:
  1. un **veto** por necesidad crítica, como un reflejo más del tramo de supervivencia;
  2. **secuencias**: un acto comprometido que no se vota hasta terminar.
- **Recomendación:** el juego sigue con `SELECT.mode = 'program'`. El selector queda como herramienta de investigación.

## Tablas

```
| medida | program | central+consume |
|---|---|---|
| R1 sin atender | 0.127 | 0.360 |
| R3 r(hambre,sed) | 0.043 | 0.244 |
| R4–5 come al alcance | 0.985 | 0.957 |
| R7a cambios/min | 9.396 | 12.112 |
| R7b titubeo (sin bocados de paso) | 0.079 | 0.177 |
| R8 latencia | 2.887 | 5.021 |
| R9 oportunismo | 0.099 | 0.179 |
| R11–12 compromiso | 0.001 | 0.010 |
| R7b titubeo antiguo | 0.168 | 0.237 |
| R2 persistencia (s) | 6.00 | 7.79 |
| vivas | 1.000 | 0.975 |

central+consume − program: 3 victorias, 4 derrotas
  R1 sin atender: 0.2333 [0.1795, 0.2896] derrota
  R3 r(hambre,sed): 0.2003 [0.1807, 0.2201] victoria
  R4–5 come al alcance: -0.0279 [-0.0750, 0.0145] —
  R7a cambios/min: 2.7160 [2.0625, 3.3750] derrota
  R7b titubeo (sin bocados de paso): 0.0980 [0.0760, 0.1194] derrota
  R8 latencia: 2.1345 [1.1760, 2.9835] derrota
  R9 oportunismo: 0.0793 [0.0146, 0.1431] victoria
  R11–12 compromiso: 0.0090 [0.0078, 0.0102] victoria
```
