# Traza legible: perfil experimental, episodio 0

Semilla 29000, mapa 1700000. Viva al horizonte. 1005 segmentos; se muestran los primeros 400 s.
Cada fila es un tramo con la misma regla, acción y objetivo. Necesidades: hambre / sed (0-1) y energía, al inicio → al final.

| t0–t1 (s) | Plan de `choice` | Regla en control | Acción | Objetivo | Hambre | Sed | Energía | Comió | Guardó |
|---|---|---|---|---|---|---|---|---|---|
| 0.05–5.2 | explore | `explore.explore` | explore | — | 0.00→0.00 | 0.00→0.03 | 112→109 |  |  |
| 5.2–6.65 | explore | `provide.pursue` | track | scent | 0.00→0.00 | 0.03→0.04 | 109→108 |  |  |
| 6.65–6.7 | explore | `clues.scent` | track | scent | 0.00→0.00 | 0.04→0.04 | 108→108 |  |  |
| 6.7–6.85 | explore | `provide.pursue` | track | scent | 0.00→0.01 | 0.04→0.04 | 108→108 |  |  |
| 6.85–6.9 | explore | `clues.scent` | track | scent | 0.01→0.01 | 0.04→0.04 | 108→108 |  |  |
| 6.9–9.25 | explore | `provide.pursue` | track | scent | 0.01→0.01 | 0.04→0.05 | 108→107 |  |  |
| 9.25–9.3 | explore | `clues.scent` | track | scent | 0.01→0.01 | 0.05→0.05 | 107→107 |  |  |
| 9.3–9.4 | explore | `provide.pursue` | track | scent | 0.01→0.01 | 0.05→0.05 | 107→107 |  |  |
| 9.4–9.5 | explore | `clues.scent` | track | scent | 0.01→0.01 | 0.05→0.05 | 107→107 |  |  |
| 9.5–9.6 | explore | `provide.pursue` | track | scent | 0.01→0.01 | 0.05→0.05 | 107→107 |  |  |
| 9.6–11.5 | — | `provide.pursue` | seekFood | food | 0.01→0.01 | 0.05→0.06 | 107→106 |  |  |
| 11.5–16.5 | — | `provide.carry` | carry | nest | 0.01→0.01 | 0.06→0.09 | 106→103 |  | 1 |
| 16.5–16.65 | site 1 | `provide.pursue` | pheromone | phero | 0.01→0.01 | 0.09→0.09 | 103→103 |  |  |
| 16.65–18 | site 1 | `provide.pursue` | seekFood | food | 0.01→0.01 | 0.09→0.10 | 103→102 |  |  |
| 18–21.95 | site 1 | `provide.pursue` | pheromone | phero | 0.01→0.02 | 0.10→0.12 | 102→100 |  |  |
| 21.95–23.15 | — | `provide.pursue` | seekFood | food | 0.02→0.02 | 0.12→0.13 | 100→99 |  |  |
| 23.15–29.1 | — | `provide.carry` | carry | nest | 0.02→0.02 | 0.13→0.16 | 99→96 |  | 1 |
| 29.1–29.45 | site 1 | `provide.pursue` | pheromone | phero | 0.02→0.02 | 0.16→0.16 | 96→96 |  |  |
| 29.45–29.8 | site 1 | `provide.pursue` | seekFood | food | 0.02→0.02 | 0.16→0.16 | 96→96 |  |  |
| 29.8–34.45 | site 1 | `provide.pursue` | pheromone | phero | 0.02→0.03 | 0.16→0.19 | 96→93 |  |  |
| 34.45–35.6 | — | `provide.pursue` | seekFood | food | 0.03→0.03 | 0.19→0.20 | 93→92 |  |  |
| 35.6–35.75 | — | `provide.pursue` | pheromone | phero | 0.03→0.03 | 0.20→0.20 | 92→92 |  |  |
| 35.75–41.8 | — | `provide.carry` | carry | nest | 0.03→0.03 | 0.20→0.23 | 92→89 |  | 1 |
| 41.8–46.9 | site 1 | `provide.pursue` | seekFood | food | 0.03→0.03 | 0.23→0.26 | 89→86 |  |  |
| 46.9–48.35 | — | `provide.pursue` | seekFood | food | 0.03→0.04 | 0.26→0.27 | 86→85 |  |  |
| 48.35–54.95 | — | `provide.carry` | carry | nest | 0.04→0.04 | 0.27→0.30 | 85→82 |  | 1 |
| 54.95–78.65 | explore | `provide.thirstSearch` | explore | — | 0.04→0.06 | 0.30→0.43 | 82→69 |  |  |
| 78.65–80.5 | — | `provide.pursue` | seekWater | water | 0.06→0.06 | 0.43→0.44 | 69→68 |  |  |
| 80.5–90.4 | — | `survive.drink` | drink | water | 0.06→0.07 | 0.44→0.00 | 68→112 |  |  |
| 90.4–94.05 | site 3 | `endure.sleep` | toSleep | nest | 0.07→0.07 | 0.00→0.02 | 112→111 |  |  |
| 94.05–165.9 | site 3 | `endure.sleep` | rest | — | 0.07→0.09 | 0.02→0.06 | 111→112 |  |  |
| 165.9–169.25 | site 3 | `provide.pursue` | seekFood | food | 0.09→0.09 | 0.06→0.08 | 112→110 |  |  |
| 169.25–172.7 | — | `provide.carry` | carry | nest | 0.09→0.09 | 0.08→0.10 | 110→108 |  | 1 |
| 172.7–174.8 | site 3 | `provide.pursue` | seekFood | food | 0.09→0.09 | 0.10→0.11 | 108→107 |  |  |
| 174.8–177 | site 3 | `provide.pursue` | seekWater | water | 0.09→0.10 | 0.11→0.12 | 107→106 |  |  |
| 177–179.65 | site 3 | `survive.drink` | drink | water | 0.10→0.10 | 0.12→0.00 | 106→112 |  |  |
| 179.65–180.65 | site 3 | `provide.pursue` | seekFood | food | 0.10→0.10 | 0.00→0.00 | 112→111 |  |  |
| 180.65–180.95 | — | `provide.pursue` | seekFood | food | 0.10→0.10 | 0.00→0.01 | 111→111 |  |  |
| 180.95–185.1 | — | `provide.carry` | carry | nest | 0.10→0.10 | 0.01→0.03 | 111→109 |  | 1 |
| 185.1–187.25 | site 2 | `provide.pursue` | seekFood | food | 0.10→0.10 | 0.03→0.04 | 109→108 |  |  |
| 187.25–189.25 | site 2 | `provide.carry` | carry | nest | 0.10→0.10 | 0.04→0.05 | 108→107 |  | 1 |
| 189.25–191.65 | site 2 | `provide.pursue` | seekFood | food | 0.10→0.11 | 0.05→0.06 | 107→105 |  |  |
| 191.65–191.95 | — | `provide.pursue` | seekFood | food | 0.11→0.11 | 0.06→0.07 | 105→105 |  |  |
| 191.95–194.65 | — | `provide.carry` | carry | nest | 0.11→0.11 | 0.07→0.08 | 105→104 |  | 1 |
| 194.65–197.05 | site 2 | `provide.pursue` | seekFood | food | 0.11→0.11 | 0.08→0.09 | 104→102 |  |  |
| 197.05–197.35 | — | `provide.pursue` | seekFood | food | 0.11→0.11 | 0.09→0.10 | 102→102 |  |  |
| 197.35–199.85 | — | `provide.carry` | carry | nest | 0.11→0.11 | 0.10→0.11 | 102→101 |  | 1 |
| 199.85–200.75 | — | `provide.pursue` | pheromone | phero | 0.11→0.11 | 0.11→0.11 | 101→100 |  |  |
| 200.75–204.75 | — | `provide.pursue` | track | scent | 0.11→0.12 | 0.11→0.14 | 100→98 |  |  |
| 204.75–205.25 | — | `provide.pursue` | seekFood | food | 0.12→0.12 | 0.14→0.14 | 98→98 |  |  |
| 205.25–205.4 | — | `provide.pursue` | track | scent | 0.12→0.12 | 0.14→0.14 | 98→98 |  |  |
| 205.4–206.15 | — | `provide.pursue` | seekFood | food | 0.12→0.12 | 0.14→0.14 | 98→97 |  |  |
| 206.15–210.45 | — | `provide.carry` | carry | nest | 0.12→0.12 | 0.14→0.17 | 97→95 |  | 1 |
| 210.45–210.6 | — | `provide.pursue` | pheromone | phero | 0.12→0.12 | 0.17→0.17 | 95→95 |  |  |
| 210.6–212.05 | — | `explore.explore` | explore | — | 0.12→0.12 | 0.17→0.18 | 95→94 |  |  |
| 212.05–213.65 | — | `provide.pursue` | seekFood | food | 0.12→0.12 | 0.18→0.19 | 94→93 |  |  |
| 213.65–216.05 | — | `provide.carry` | carry | nest | 0.12→0.12 | 0.19→0.20 | 93→92 |  | 1 |
| 216.05–216.2 | — | `provide.pursue` | pheromone | phero | 0.12→0.12 | 0.20→0.20 | 92→92 |  |  |
| 216.2–217.05 | — | `explore.explore` | explore | — | 0.12→0.13 | 0.20→0.20 | 92→91 |  |  |
| 217.05–218.1 | — | `provide.pursue` | pheromone | phero | 0.13→0.13 | 0.20→0.21 | 91→91 |  |  |
| 218.1–219.7 | — | `provide.pursue` | seekFood | food | 0.13→0.13 | 0.21→0.22 | 91→90 |  |  |
| 219.7–223.25 | — | `provide.carry` | carry | nest | 0.13→0.13 | 0.22→0.24 | 90→88 |  | 1 |
| 223.25–226.2 | — | `explore.explore` | explore | — | 0.13→0.13 | 0.24→0.25 | 88→86 |  |  |
| 226.2–228.5 | — | `provide.pursue` | track | scent | 0.13→0.13 | 0.25→0.27 | 86→85 |  |  |
| 228.5–228.6 | — | `clues.scent` | track | scent | 0.13→0.13 | 0.27→0.27 | 85→85 |  |  |
| 228.6–230.35 | — | `provide.pursue` | track | scent | 0.13→0.14 | 0.27→0.28 | 85→84 |  |  |
| 230.35–230.95 | — | `provide.pursue` | seekFood | food | 0.14→0.14 | 0.28→0.28 | 84→84 |  |  |
| 230.95–234.65 | — | `provide.carry` | carry | nest | 0.14→0.14 | 0.28→0.30 | 84→82 |  |  |
| 234.65–263.5 | — | `explore.explore` | explore | — | 0.14→0.16 | 0.30→0.46 | 82→66 |  |  |
| 263.5–263.55 | site 2 | `explore.taste` | taste | food | 0.16→0.16 | 0.46→0.46 | 66→66 |  |  |
| 263.55–264.9 | site 2 | `explore.explore` | explore | — | 0.16→0.16 | 0.46→0.47 | 66→65 |  |  |
| 264.9–265.6 | site 2 | `explore.taste` | taste | food | 0.16→0.16 | 0.47→0.47 | 65→65 |  |  |
| 265.6–266.15 | site 2 | `explore.explore` | explore | — | 0.16→0.16 | 0.47→0.47 | 65→64 |  |  |
| 266.15–270.25 | site 2 | `endure.sleep` | toSleep | nest | 0.16→0.16 | 0.47→0.50 | 64→63 |  |  |
| 270.25–345.9 | site 2 | `endure.sleep` | rest | — | 0.16→0.18 | 0.50→0.54 | 63→112 |  |  |
| 345.9–348.15 | site 2 | `provide.pursue` | seekWater | water | 0.18→0.19 | 0.54→0.55 | 112→110 |  |  |
| 348.15–351.75 | site 2 | `survive.urgency` | seekWater | water | 0.19→0.19 | 0.55→0.57 | 110→108 |  |  |
| 351.75–364.55 | site 2 | `survive.drink` | drink | water | 0.19→0.20 | 0.57→0.00 | 108→112 |  |  |
| 364.55–366.55 | site 2 | `clues.memory` | memory | water | 0.20→0.20 | 0.00→0.00 | 112→111 |  |  |
| 366.55–367.2 | site 2 | `explore.taste` | taste | food | 0.20→0.26 | 0.00→0.00 | 111→111 | 1 |  |
| 367.2–370.25 | site 2 | `explore.explore` | explore | — | 0.26→0.26 | 0.00→0.02 | 111→109 |  |  |
| 370.25–370.3 | site 2 | `explore.taste` | taste | food | 0.26→0.26 | 0.02→0.02 | 109→109 |  |  |
| 370.3–371.35 | site 2 | `explore.explore` | explore | — | 0.26→0.27 | 0.02→0.03 | 109→108 |  |  |
| 371.35–372.7 | site 2 | `explore.taste` | taste | food | 0.27→0.27 | 0.03→0.03 | 108→108 |  |  |
| 372.7–381.35 | site 3 | `explore.explore` | explore | — | 0.27→0.27 | 0.03→0.08 | 108→103 |  |  |
| 381.35–383.15 | site 3 | `survive.drink` | drink | — | 0.27→0.27 | 0.08→0.00 | 103→112 |  |  |
| 383.15–411.4 | site 3 | `explore.explore` | explore | — | 0.27→0.29 | 0.00→0.15 | 112→96 |  |  |
