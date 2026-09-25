// Todos los números ajustables del juego viven aquí.

export const WORLD = {
  width: 1280,
  height: 860,
  bgColor: '#222630',
};

// El suelo. Se pinta una sola vez al empezar, así que estos números NO están en
// el panel de ajustes: cambiarlos en caliente no repintaría nada. Se tocan aquí.
//
// escala* = tamaño de las manchas de cada campo de ruido, en px. Grande = lomas
// anchas y pocas; pequeño = terreno picado.
export const TERRAIN = {
  escalaAltura: 300,   // lomas del relieve
  escalaHumedad: 230,  // dónde agarra el verde
  escalaGrava: 150,    // dónde asoma el pedregal
  celdaLuz: 4,         // px por celda del cálculo de color y luz
  relieve: 4.4,        // cuánto marca la pendiente. Alto = terreno abrupto
  hondo: 0.22,         // cuánto se apaga lo hondo por recibir menos cielo
  musgoDesde: 0.5,     // humedad a partir de la cual sale verde
  gravaDesde: 0.7,     // piedra a partir de la cual sale pedregal
  grano: 0.08,         // opacidad del terrón fino
  manchas: 0.05,       // opacidad de las manchas grandes de tierra
  foto: 0.62,          // presencia de la base fotográfica
  escalaFoto: 0.38,    // escala del material: menor = hojas y grava más pequeñas
  claros: 42,          // manchas suaves de luz filtrada por el dosel
  motas: 5200,         // granos de arena suelta
  guijarros: 1400,     // intentos de piedrecita (salen los del pedregal)
  matas: 3200,         // intentos de mata de hierba (salen los húmedos)
  hojarasca: 700,      // intentos de ramita seca
  hojas: 900,          // intentos de hoja caída (salen donde hay verde)
  musgo: 700,          // intentos de mata de musgo (solo en lo húmedo y hondo)
  raices: 90,          // intentos de raíz asomada (salen donde hay verde)
  grietas: 260,        // intentos de grieta (salen los secos y altos)
  orilla: 1.45,        // hasta dónde llega la tierra mojada, en radios del charco
  vineta: 0.08,        // cuánto se apagan los bordes del mundo
  velo: 0.015,         // velo del color de fondo por encima de todo
};

// La cámara. El mapa se ve entero con zoom 1; a partir de ahí se acerca.
//
// detalleMax es cuánto se puede repintar un sprite por encima de su tamaño de
// mundo. Subirlo da bordes más limpios muy de cerca y cuesta memoria y un
// repintado por escalón, así que tres es el trato razonable.
export const CAMERA = {
  min: 1,
  max: 4,
  paso: 1.18,        // cuánto acerca cada muesca de la rueda
  detalleMax: 3,
  teclas: 520,       // px por segundo al mover con las flechas
};

// El lago. El círculo que decide dónde se bebe es el radio del objeto; estos
// números son solo aspecto, y se miden en radios del lago.
export const LAKE = {
  orillaAncho: 0.34,  // barro y guijarros por fuera del agua
  hondoDesde: 0.62,   // dónde empieza el hondo, más oscuro
  bordeOnda: 0.055,   // cuánto serpentea la orilla
  destellos: 9,       // reflejos que tiritan en la superficie
  ondas: 3,           // círculos de onda que salen y se apagan
  juncos: 16,         // matas de junco en la orilla
  piedras: 18,        // piedras del fondo, junto a la orilla
  motas: 22,          // polen y hoja suelta flotando, que el viento arrastra
  rizos: 40,          // crestas de rizo que el viento empuja por la superficie
  causticas: 34,      // red de luz en el fondo del vado
};

export const FAGI = {
  radius: 9,
  speed: 70,          // px por segundo
  turnSpeed: 6.0,     // radianes por segundo. Radio de giro = speed/turnSpeed = 11.6px.
                      // Debe quedar POR DEBAJO de eatRadius o Fagi orbita la comida sin tocarla.
  fovDeg: 120,        // ángulo total del cono de visión
  viewRange: 230,     // px
  eatRadius: 14,      // distancia de contacto para comer
  memorySec: 2.0,     // segundos que recuerda un objetivo tras perderlo de vista
  smell: 1.0,         // sensibilidad del olfato. Multiplica el aroma de cada cosa.
  probe: 26,          // separación de las dos "fosas nasales" con las que compara
  castTurn: 1.15,     // cuánto se abre el barrido cuando pierde el rastro
  castEvery: 0.9,     // cada cuántos segundos cambia de lado al barrer
  trailMemory: 7.0,   // segundos que sigue buscando un rastro que ha perdido
};

export const HUNGER = {
  rate: 1.4,          // puntos de hambre por segundo (~71s de vida sin comer)
  max: 100,
};

// La sed es la segunda necesidad: sube más rápido que el hambre, pero el agua
// del mapa no se gasta. Fagi tiene que repartir su tiempo entre comer y beber.
export const THIRST = {
  rate: 2.2,          // puntos de sed por segundo (~45s sin beber)
  max: 100,
  drinkRate: 30,      // cuánta sed quita por segundo dentro del agua
  reward: 1,          // tope de lo que SIENTE al beber. No lo sabe de antemano.
  rewardFull: 0.6,    // con esta fracción de sed, beber le da la recompensa máxima
  ignoreBelow: 0.10,  // con menos sed que esto, el agua ni se plantea
};

export const BRAIN = {
  learnRate: 0.45,    // qué tan rápido actualiza su creencia
  curiosityTries: 2,  // pruebas por tipo antes de dejar de ser curioso
  curiosityBonus: 1.2,
  distanceWeight: 0.6,
  stickiness: 0.2,    // ventaja que necesita un rival para robarle el objetivo actual
  smellPenalty: 0.15,  // lo que resta perseguir algo que huele pero no ve: sabe
                      // que está cerca, no exactamente dónde.
  minScore: 0.12,     // por debajo de esto no merece la pena moverse
  baseInterest: 0.25, // cuánto tira de él algo que sabe bueno cuando NO lo necesita.
                      // Sin esto iría al agua con la sed a cero, solo porque le gusta.
};

// Los cinco puntos que el jugador puede colocar.
//
//   hunger  : cuánto suma (+) o resta (-) al hambre al comerlo.
//   effects : buffs temporales. stat = qué multiplica, mult = factor, sec = duración.
//   reward  : lo que Fagi SIENTE al comerlo, de -1 a +1. Es la señal con la que
//             aprende. Fagi no la conoce de antemano: la descubre probando.
export const POINT_TYPES = {
  nectar: {
    color: '#5bd97e',
    radius: 6,
    aroma: 175,       // huele fuerte: se detecta de lejos aunque no se vea
    life: 45,         // segundos hasta pudrirse y volverse tóxico (0 = nunca)
    hunger: -35,
    effects: [],
    reward: 1,
  },
  chispa: {
    color: '#4cc9f0',
    radius: 5,
    aroma: 85,
    life: 60,
    hunger: -5,
    effects: [{ stat: 'speed', mult: 1.8, sec: 8 }],
    reward: 0.6,
  },
  ojo: {
    color: '#b57bff',
    radius: 5,
    aroma: 85,
    life: 60,
    hunger: -5,
    effects: [
      { stat: 'viewRange', mult: 1.6, sec: 10 },
      { stat: 'fovDeg', mult: 1.4, sec: 10 },
    ],
    reward: 0.6,
  },
  resina: {
    color: '#e8a33d',
    radius: 6,
    aroma: 145,
    life: 80,
    hunger: -10,
    effects: [{ stat: 'hungerRate', mult: 0.5, sec: 14 }],
    reward: 0.7,
  },
  toxico: {
    color: '#d95b7e',
    radius: 6,
    aroma: 130,       // el veneno también huele, y huele parecido
    life: 45,         // lo podrido no se pudre más: al cumplir su tiempo desaparece
    hunger: 25,
    effects: [{ stat: 'speed', mult: 0.6, sec: 5 }],
    reward: -0.9,
  },
};

export const TYPE_KEYS = Object.keys(POINT_TYPES);

// Objetos del mapa. No se comen: se quedan puestos.
//
//   water : Fagi bebe mientras esté dentro del círculo.
//   block : roca. Corta el paso y también la línea de visión.
export const OBJECT_TYPES = {
  agua: { color: '#3d8fd9', radius: 44, kind: 'water', aroma: 150 },
  nido: { color: '#c9a227', radius: 42, kind: 'nest', aroma: 60 },
  arbol: { color: '#4f9552', radius: 44, kind: 'spawner', aroma: 70 },
  roca: { color: '#565c6b', radius: 28, kind: 'block', aroma: 0 },
};

export const OBJECT_KEYS = Object.keys(OBJECT_TYPES);

// De qué cosas tiene una creencia aprendida: los alimentos y el agua.
// El agua se aprende igual que la comida: empieza en 0 y hay que probarla.
// El olor no se expande en círculo: el viento lo arrastra y forma una estela.
// Fagi solo huele algo si está DENTRO de esa estela, es decir, a sotavento.
export const WIND = {
  turnRate: 0.09,     // radianes por segundo: gira despacio, se nota en pantalla
  changeEvery: { min: 8, max: 18 }, // cada cuánto se plantea una dirección nueva
  swing: 1.5,         // cuánto puede desviarse al elegir la nueva dirección
};

// El olor de cada fuente es UN hilo que va creciendo por el mapa. Sale a favor
// del viento, pero serpentea por su cuenta, así que toma direcciones distintas
// según avanza. Cuanto más viejo el punto, más lejos ha llegado su rastro.
export const PLUME = {
  step: 18,           // px de cada tramo nuevo
  every: 0.10,        // segundos entre tramo y tramo (velocidad de crecimiento)
  drift: 0.45,        // cuánto puede torcerse cada tramo (radianes)
  windPull: 0.22,     // cuánto lo endereza el viento hacia su dirección
  radius: 34,         // a qué distancia del hilo se percibe el olor
  nodesPerAroma: 0.7, // tramos máximos del hilo = aroma × esto
  faint: 0.85,        // cuánto se diluye de la fuente a la punta
};

// Memoria. Un recuerdo no es un número: es un valor MÁS la confianza que le
// tiene. La confianza sube al confirmarse, baja sola con el tiempo, y solo
// aguanta si las confirmaciones vienen espaciadas, como en los insectos reales.
export const MEMORY = {
  spacing: 12,         // segundos mínimos entre confirmaciones para que "cuenten"
  massedGain: 0.4,     // lo que vale una confirmación seguida frente a una espaciada
  gain: 0.45,          // cuánta confianza da una confirmación espaciada
  first: 0.5,          // confianza que deja la primera experiencia
  floor: 0.45,         // cuánto de lo aprendido sigue pesando aunque no se fíe:
                       // dudar rebaja un recuerdo, no lo anula
  contradiction: 0.45, // con qué se multiplica la confianza al llevarse un chasco
  toMedium: 2,         // confirmaciones espaciadas para pasar a memoria media
  toLong: 4,           // y para consolidarla como memoria larga
  decayShort: 0.012,   // confianza perdida por segundo en cada etapa (~33s de vida)
  decayMedium: 0.004,  // ~3 minutos
  decayLong: 0.0008,   // ~20 minutos: casi permanente
  minConfidence: 0.18, // por debajo vuelve la curiosidad: ya no se fía
  placeDrift: 1.6,     // px de imprecisión que gana un sitio por segundo sin verlo
  placeErrorMax: 260,  // tope de esa imprecisión
  travelRange: 700,    // hasta dónde le parece razonable viajar a un sitio que
                       // recuerda. Sin esto, todo lo que no ve queda "lejísimos"
  save: true,          // guardar la memoria larga entre partidas
};

export const BELIEF_KEYS = [...TYPE_KEYS, 'agua'];

// Ficha de cualquier cosa perseguible, sea comida u objeto de mapa.
export function specOf(key) {
  return POINT_TYPES[key] ?? OBJECT_TYPES[key];
}

// Mapa aleatorio al empezar y al reiniciar.
// Energía: el tercer medidor. Bajarla no mata, pero deja a Fagi sin fuerzas
// hasta que para a descansar. El nido es donde mejor se recupera.
export const ENERGY = {
  max: 100,
  drain: 1.6,         // por segundo andando (escala con la velocidad real)
  restOutside: 6,     // recuperación por segundo parada en el campo
  restNest: 16,       // recuperación por segundo dentro del nido
  tired: 22,          // por debajo de esto busca descansar
  rested: 85,         // deja de descansar al llegar aquí
  weakSpeed: 0.55,    // si se queda a cero, se arrastra a esta fracción de velocidad
};

// A partir de esta fracción, una necesidad es urgente: comer o beber pasa por
// delante de descansar y de acarrear. Nadie se echa la siesta muriéndose de sed.
export const NEEDS = { critical: 0.55 };

// Acarreo: puede llevar UN punto a la vez hasta el nido.
export const CARRY = {
  eatBelow: 45,       // con más hambre que esto se lo come en el sitio
  nestFeed: 30,       // hambre que le quita comer de las reservas del nido
};

// La despensa tiene tope. Guardar es tener reservas para después, no amontonar:
// con el nido así de lleno deja de recoger y se dedica a explorar.
//
// Dentro del nido el tiempo pasa keepFactor veces más despacio: una ración
// aguanta eso más que tirada al sol. Pero aguantar no es durar para siempre —
// cumplida esa vida larga se echa a perder y desaparece de las reservas. Guardar
// aplaza el problema del hambre, no lo elimina.
export const NEST = { full: 12, keepFactor: 10 };

// Explorar. No es deambular: Fagi lleva una rejilla basta de por dónde ha
// pasado y tira hacia la casilla que menos conoce.
export const EXPLORE = {
  cell: 90,           // px de lado de cada casilla del mapa mental
  visitGain: 1.0,     // cuánto se conoce una casilla por segundo estando en ella
  visitMax: 3,        // tope de conocimiento de una casilla
  fade: 0.005,        // cuánto se olvida por segundo: una casilla vuelve a ser
                      // terreno nuevo a los ~3 min de no pisarla
  distanceWeight: 1.4, // cuánto pesa lo lejos que queda una casilla al elegirla
  homeBias: 0.25,     // cuánto prefiere las casillas lejos del nido
  reach: 55,          // a qué distancia da por pisada la casilla a la que iba
  giveUp: 12,         // segundos insistiendo en una casilla antes de elegir otra
};

// Feromona propia: el camino que marca al volver cargada al nido.
export const PHERO = {
  life: 45,           // segundos que tarda en evaporarse una marca
  every: 0.3,         // cada cuánto deja una marca mientras acarrea
  sense: 46,          // a qué distancia detecta una marca
};

// Árbol: suelta fruta cada cierto tiempo a su alrededor. El intervalo se
// ajusta desde el panel y vale para todos los árboles del mapa.
export const TREE = {
  interval: 8,        // segundos entre frutos
  fruit: 'nectar',    // qué suelta
  dropRadius: 1.9,    // dónde cae: radio del árbol × esto
  maxNear: 5,         // si ya hay tanta fruta suya sin recoger, deja de soltar
  life: 0,            // segundos que vive un árbol (0 = para siempre)
};

// Qué le pasa a la fruta que nadie recoge.
// Lo podrido tampoco se queda para siempre: cuando se le acaba SU vida
// (POINT_TYPES.toxico.life) se deshace y desaparece del mapa, estela incluida.
export const FRUIT = {
  rot: 'toxico',      // en qué se convierte al pudrirse
  warnFrom: 0.6,      // desde qué fracción de su vida empieza a verse pasada
};

export const MAPGEN = {
  pools: 1,           // una sola fuente de agua en todo el mapa
  nests: 1,           // un nido
  trees: 1,           // una sola fuente renovable obliga a localizar su rastro
  treeMinNestDistance: 430, // el árbol nace lejos del nido
  treeMaxNestDistance: 460, // corona lejana pero alcanzable antes de pasar hambre
  rocks: 9,           // rocas
  rockScale: [0.45, 1.85], // y no todas del mismo tamaño: factor sobre su radio
  margin: 40,         // no pegar nada al borde
  minGap: 34,         // hueco mínimo entre objetos (Fagi tiene que poder pasar)
  spawnClear: 130,    // radio libre alrededor del punto donde nace Fagi
};
