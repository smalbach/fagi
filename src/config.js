// Todos los números ajustables del juego viven aquí.

// Escala y relojes. 1 px = 0,5 mm: Fagi mide ~9 mm, como una obrera de
// Formica, y el mapa es un trozo de suelo de 64 x 43 cm. Moverse, ver, oler y
// la feromona van a tiempo real. Solo la biología (sed, hambre, olvido, lo que
// se pudre) va comprimida: 1 s de juego = ~8 min de hormiga, con las
// proporciones reales entre unas cosas y otras.
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
  fovDeg: 280,        // ángulo total del cono de visión: los ojos compuestos
                      // ven casi todo alrededor, menos justo detrás
  viewRange: 120,     // px. Poca resolución: una gota de 3 mm deja de verse a ~6 cm
  eatRadius: 14,      // distancia de contacto para comer
  memorySec: 2.0,     // segundos que recuerda un objetivo tras perderlo de vista
  smell: 1.0,         // sensibilidad del olfato. Multiplica el aroma de cada cosa.
  probe: 26,          // separación de las dos "fosas nasales" con las que compara
  castTurn: 1.15,     // cuánto se abre el barrido cuando pierde el rastro
  castEvery: 0.9,     // cada cuántos segundos cambia de lado al barrer
  trailMemory: 7.0,   // segundos que sigue buscando un rastro que ha perdido
};

export const HUNGER = {
  rate: 0.08,         // puntos de hambre por segundo (~1250s = ~1 semana sin comer,
                      // con agua: 5-7 veces más de lo que aguanta sin beber)
  max: 100,
};

// La sed es la segunda necesidad: sube más rápido que el hambre, pero el agua
// del mapa no se gasta. Fagi tiene que repartir su tiempo entre comer y beber.
export const THIRST = {
  rate: 0.55,         // puntos de sed por segundo (~180s = ~1 día hasta desecarse)
  max: 100,
  drinkRate: 5,       // cuánta sed quita por segundo dentro del agua (~20s para llenar el buche)
  ignoreBelow: 0.10,  // con menos sed que esto, el agua ni se plantea
};

// El agua por dentro. Una hormiga no nada: pesa tan poco que la tensión
// superficial la atrapa y patalea casi sin avanzar. Bebe desde la orilla, en el
// vado, donde las patas aún tocan fondo. Todo esto es física, no se aprende. Lo
// que SÍ aprende, a base de hundirse, es a no meterse en el hondo: la creencia
// 'hondo', igual que aprende qué fruto le sienta mal.
//
//   vado       : px de agua por dentro de la orilla donde aún hace pie y bebe
//   wadeSpeed  : velocidad en el vado (barro, patas mojadas)
//   swimSpeed  : velocidad en el hondo, pataleando
//   swimEffort : cuánta más energía gasta pataleando que andando
//   shock      : parte del susto que da perder pie, aunque salga enseguida
//   sample     : segundos en el hondo que valen el susto entero
//   lesson     : lo que resta ese susto entero a la creencia 'hondo'
//
// Al salir del hondo va empapada: el agua pesa y se le pega a las patas hasta
// que se seca (wetSpeed al salir, que vuelve a 1 en dryTime segundos).
//
// Nota el agua antes de pisarla: las antenas (probeReach px por delante del
// cuerpo) captan la humedad y el tacto del agua, y avanza tanteando
// (probeSpeed) mientras las tenga sobre el hondo.
export const WATER = {
  vado: 10,
  wadeSpeed: 0.6,
  swimSpeed: 0.2,
  swimEffort: 3,
  shock: 0.6,
  sample: 1.5,
  lesson: 1,
  wetSpeed: 0.7,
  dryTime: 8,
  probeReach: 7,
  probeSpeed: 0.45,
};

// Lluvia (rain.js). Chaparrones cortos cada cierto tiempo que dejan charcos
// poco hondos; el sol los va encogiendo hasta secarlos. Mientras llueve la
// feromona se lava y Fagi, fuera del nido, se empapa (WATER.wetSpeed).
//   every        : segundos entre chaparrones (min, max). ~1-2 días de hormiga
//   duration     : cuánto dura cada uno
//   puddles      : charcos que deja cada chaparrón
//   puddleRadius : tamaño de un charco al nacer (px)
//   grow         : px de radio que gana un charco por segundo mientras llueve
//   evaporate    : px de radio que pierde por segundo con el sol (~4 min = ~1,5 días)
//   minRadius    : por debajo de esto ya está seco
//   washPhero    : cuántas veces más rápido se borra la feromona bajo la lluvia
export const RAIN = {
  every: { min: 240, max: 420 },
  duration: { min: 18, max: 35 },
  puddles: { min: 2, max: 4 },
  puddleRadius: [12, 22],
  grow: 0.15,
  evaporate: 0.05,
  minRadius: 5,
  washPhero: 8,
};

// El cuerpo. Lo único que Fagi sabe de nacimiento es sentirse: si el hambre
// baja se siente bien, si la velocidad cae se siente torpe. Qué COSA del mundo
// le produce cada sensación no lo sabe: eso lo aprende probando.
//
//   hungerScale : puntos de hambre que valen una sensación de ±1 (35 = un néctar)
//   effectWeight: cuánto pesa un cambio de stat frente al hambre
//   statSense   : cómo siente el cuerpo cada stat. +1 = subir es bueno; -1 =
//                 subir es malo. Un stat nuevo necesita su signo aquí (sin
//                 entrada, se asume +1).
//   window      : segundos que sigue vigilando tras comer, por si le sienta mal
//                 después (cruzar el umbral crítico de la necesidad que atendía)
//   perilWeight : lo que resta ese mal desenlace diferido
//   deathPenalty: lo que resta morir con un bocado reciente en el cuerpo
//   drinkSample : segundos bebiendo antes de juzgar cuánto le quitó la sed
//   energyScale : puntos de energía perdidos que valen una sensación de -1
export const FEEL = {
  hungerScale: 35,
  thirstScale: 60,
  effectWeight: 0.5,
  statSense: { speed: 1, viewRange: 1, fovDeg: 1, smell: 1, hungerRate: -1 },
  window: 10,
  perilWeight: 0.5,
  deathPenalty: 1,
  drinkSample: 9,     // con drinkRate 5 son ~45 puntos de sed: la misma señal que antes
  energyScale: 20,    // puntos de energía que valen una sensación de ±1
};

// Aprendizaje simbólico: cuándo una creencia se convierte en una regla escrita
// y cuándo esa regla se retira. Con histéresis, para que no parpadee.
export const LEARN = {
  avoidFrom: 0.2,     // peso (negativo) a partir del cual escribe "evitar X"
  avoidUntil: 0.1,    // y por debajo del cual la retira
  preferFrom: 0.5,    // peso a partir del cual escribe "preferir X"
  preferUntil: 0.3,
  autosave: 1,        // guardar una copia recuperable en el navegador (1 = sí)
  autosaveEvery: 10,  // cada cuántos segundos
  maxRetired: 20,     // reglas retiradas que conserva como historial
};

// Decisión externa: una API que recibe lo que Fagi percibe y devuelve qué
// hacer. El instinto sigue mandando cuando la API calla, tarda o se equivoca.
//
//   authority: 0 = segura (el instinto atiende las emergencias antes);
//              1 = plena (la API va primero, salvo emergencia que no atienda)
export const BACKEND = {
  enabled: 0,
  authority: 0,
  minInterval: 2,     // segundos mínimos entre consultas
  timeout: 2,         // segundos de espera antes de rendirse
  ttl: 6,             // segundos que vale una directiva si la API no dice otra cosa
  maxTtl: 20,
  idleAfter: 8,       // segundos explorando sin más antes de preguntar
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
//
// Aquí solo hay FÍSICA: lo que el bocado le hace al cuerpo. Si es bueno o malo
// no está escrito en ningún sitio: Fagi lo siente al comerlo (FEEL) y lo
// aprende. Un alimento nuevo, o un peligro nuevo, se añade con su física y nada
// más.
export const POINT_TYPES = {
  nectar: {
    color: '#5bd97e',
    radius: 6,
    aroma: 175,       // huele fuerte: se detecta de lejos aunque no se vea
    life: 180,        // segundos hasta pudrirse y volverse tóxico (0 = nunca). ~1 día
    hunger: -35,
    effects: [],
  },
  chispa: {
    color: '#4cc9f0',
    radius: 5,
    aroma: 85,
    life: 240,
    hunger: -5,
    effects: [{ stat: 'speed', mult: 1.8, sec: 8 }],
  },
  ojo: {
    color: '#b57bff',
    radius: 5,
    aroma: 85,
    life: 240,
    hunger: -5,
    effects: [
      { stat: 'viewRange', mult: 1.6, sec: 10 },
      { stat: 'fovDeg', mult: 1.4, sec: 10 },
    ],
  },
  resina: {
    color: '#e8a33d',
    radius: 6,
    aroma: 145,
    life: 320,
    hunger: -10,
    effects: [{ stat: 'hungerRate', mult: 0.5, sec: 14 }],
  },
  toxico: {
    color: '#d95b7e',
    radius: 6,
    aroma: 130,       // el veneno también huele, y huele parecido
    life: 180,        // lo podrido no se pudre más: al cumplir su tiempo desaparece
    hunger: 25,
    effects: [{ stat: 'speed', mult: 0.6, sec: 5 }],
  },
};

export const TYPE_KEYS = Object.keys(POINT_TYPES);

// Objetos del mapa. No se comen: se quedan puestos.
//
//   water : Fagi bebe en el vado, por dentro del borde (WATER). El hondo la atrapa.
//           Un charco (shallow) no tiene hondo: todo él es vado.
//   block : roca. Corta el paso y también la línea de visión.
export const OBJECT_TYPES = {
  agua: { color: '#3d8fd9', radius: 44, kind: 'water', aroma: 150 },
  // Charco de lluvia (rain.js): agua poco honda que se seca. Apenas huele.
  charco: { color: '#6f9fbf', radius: 16, kind: 'water', aroma: 0, shallow: true },
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
// Sinapsis (synapses.js): la huella del aprendizaje como red de conexiones.
export const SYNAPSE = {
  hebbRate: 0.6,      // cuánto se refuerza por segundo sentido→concepto al percibirlo
  hebbDecay: 0.01,    // lo que pierde por segundo sin usarse (~1.5 min de fuerte a podada)
  learnRate: 0.45,    // cuánto se acerca concepto→sensación a lo que sintió cada vez
  feelDecay: 0.0008,  // lo aprendido por consecuencias se olvida mucho más despacio
  prune: 0.03,        // por debajo de esto la conexión se poda
};

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
  // El olvido es biología: va al reloj comprimido, como la sed y el hambre.
  decayShort: 0.003,   // confianza perdida por segundo en cada etapa (~3 min = ~1 día)
  decayMedium: 0.0008, // ~10 min = unos días
  decayLong: 0.0003,   // ~1 h = semanas: casi permanente
  minConfidence: 0.18, // por debajo vuelve la curiosidad: ya no se fía
  placeDrift: 0.2,     // px de imprecisión que gana un sitio por segundo sin verlo.
                       // Poca: la integración de caminos falla al andar, no al esperar
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
//
// forageDrive: cuánto tira de una obrera la despensa vacía. Sale a por comida
// por lo que le falta a la colonia, no solo por su propia hambre.
export const NEST = { full: 12, keepFactor: 10, forageDrive: 0.5 };

// Explorar. No es deambular: Fagi lleva una rejilla basta de por dónde ha
// pasado y tira hacia la casilla que menos conoce.
export const EXPLORE = {
  cell: 90,           // px de lado de cada casilla del mapa mental
  visitGain: 1.0,     // cuánto se conoce una casilla por segundo estando en ella
  visitMax: 3,        // tope de conocimiento de una casilla
  fade: 0.001,        // cuánto se olvida por segundo: una casilla vuelve a ser
                      // terreno nuevo a los ~15 min (días de hormiga) de no pisarla
  distanceWeight: 1.4, // cuánto pesa lo lejos que queda una casilla al elegirla
  homeBias: 0,        // cuánto prefiere las casillas lejos del nido. 0: las obreras
                      // no nacen con prisa por alejarse, amplían el radio con la experiencia
  reach: 55,          // a qué distancia da por pisada la casilla a la que iba
  giveUp: 12,         // segundos insistiendo en una casilla antes de elegir otra
  // Explorar por tramos: cada tramo va a un punto que VE, dentro de su cono.
  // Al llegar mira otra vez y elige el siguiente con lo que tenga delante.
  rays: 9,            // direcciones que tantea dentro del cono
  depths: [0.45, 0.7, 0.92],  // a qué fracción de la vista pone cada punto
  compassWeight: 1.2, // cuánto tira el rumbo hacia la zona menos conocida del mapa
  farWeight: 0.3,     // preferencia por llegar hasta el fondo de lo que ve
  turnWeight: 0.4,    // lo que cuesta un tramo que obliga a darse la vuelta entera
  waypointReach: 18,  // a qué distancia da por alcanzado el punto del tramo
};

// Atención: lo que acaba de entrar en lo que percibe. Algo que no percibía
// desde hace `forget` segundos cuenta como nuevo y le hace replantearse el plan.
export const ATTENTION = {
  forget: 3,
  opportunisticThirst: 0.35,  // con esta sed, ver agua cerca le desvía aunque vaya cargada
};

// Feromona propia: el camino que marca al volver cargada al nido.
export const PHERO = {
  life: 600,          // segundos que tarda en evaporarse una marca (Lasius niger: ~47 min de vida media)
  every: 0.1,         // cada cuánto deja una marca mientras acarrea: ~7 px, un rastro continuo
  sense: 12,          // a qué distancia detecta una marca: lo que alcanzan las antenas (~6 mm)
  // Seguir el rastro se aprende como cualquier otra cosa: si en learnWindow
  // segundos la lleva a comida, la creencia sobre la feromona sube (found); si
  // no, baja (miss). Nace sin saber que el rastro sirve para algo.
  learnWindow: 20,
  found: 0.8,
  miss: -0.5,
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
