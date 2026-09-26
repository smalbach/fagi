// Idiomas. Inglés por defecto; el idioma elegido se guarda en el navegador.
//
// Nada guarda texto ya traducido: los módulos guardan CLAVES y traducen al
// pintar, así que cambiar de idioma reetiqueta también lo que ya está en
// pantalla, incluido el histórico de la consola.

const DICT = {
  en: {
    'app.title': 'FAGI',
    'app.settings': '⚙ Settings',
    'app.immersive': '🌿 Immersive',
    'app.analysis': '◉ Analysis',
    'app.reset': 'Restart · new map',
    'app.language': 'Idioma / Language',
    'app.collapseAll': '▾ Hide all',
    'app.expandAll': '▸ Show all',
    'app.hidePanel': 'Hide panel',
    'app.showPanel': 'Show panel',

    'panel.food': 'Food',
    'panel.map': 'Map · right click removes · shift+wheel resizes',
    'panel.camera': 'Camera · wheel zooms · middle button drags · arrows move · F follows Fagi · 0 resets',
    'panel.treeEvery': 'Tree drops fruit every',
    'panel.state': 'State',
    'panel.heading': 'Heading',
    'panel.pantry': 'Nest pantry',
    'panel.effects': 'Active effects',
    'panel.learned': 'What it has learned',
    'panel.console': 'Decision console',
    'panel.scores': 'Scoring of what it perceives',
    'panel.history': 'History',
    'panel.code': 'Learned code',
    'panel.brainmap': 'Brain map',
    'panel.tabLive': 'Console & map',
    'panel.tabHistory': 'Code & history',
    'panel.now': 'Right now',
    'brainmap.empty': 'Nothing to show yet: no experience so far',
    'brainmap.status': '{beliefs} belief(s) · {active} active rule(s) · {retired} retired · {events} revision(s)',

    'stat.hunger': 'Hunger',
    'stat.thirst': 'Thirst',
    'stat.energy': 'Energy',
    'stat.age': 'Age',
    'stat.eaten': 'Eaten',
    'stat.carrying': 'Carrying',
    'stat.position': 'Position',
    'stat.movingTo': 'Moving',
    'stat.vertical': 'Vertical',
    'stat.wind': 'Wind',

    // Unidades de tiempo (formatDuration / formatClock).
    'unit.sec': 's',
    'unit.min': 'm',
    'unit.hour': 'h',
    'unit.day': 'd',

    'word.nothing': 'nothing',
    'word.none': 'none',
    'word.empty': 'empty',
    'word.untested': 'untested',
    'word.noNest': 'no nest on the map',
    'word.nothingToChase': 'nothing to chase',
    'word.eye': 'eye',
    'word.nose': 'nose',
    'word.memory': 'memory',
    'word.sees': 'eye',
    'word.smells': 'nose',
    'word.water': 'water',
    'word.carries': 'carrying',

    'type.nectar': 'Nectar',
    'type.chispa': 'Spark',
    'type.ojo': 'Eye',
    'type.resina': 'Resin',
    'type.toxico': 'Toxic',
    'type.agua': 'Water',
    'type.nido': 'Nest',
    'type.arbol': 'Tree',
    'type.roca': 'Rock',

    'hint.water': 'click moves it · shift+wheel resizes',
    'hint.nest': 'click moves it · shift+wheel resizes',
    'hint.tree': 'drops fruit on its own · shift+wheel resizes',
    'hint.rock': 'blocks movement and sight',
    'hint.hunger': 'hunger {v}',
    'hint.aroma': 'aroma {v}',

    'water.sees': 'sees it',
    'water.smells': 'smells it',
    'water.remembers': 'remembers it',
    'water.unknown': "doesn't know where",

    'action.explore': 'Exploring',
    'action.seekFood': 'Going for food',
    'action.seekWater': 'Going for water',
    'action.drink': 'Drinking',
    'action.track': 'Tracking a smell',
    'action.memory': 'Going from memory',
    'action.pheromone': 'Following its own trail',
    'action.carry': 'Carrying food to the nest',
    'action.toNest': 'Heading home to rest',
    'action.rest': 'Resting',
    'action.pantry': 'Heading home to the pantry',
    'action.eatCarried': 'Eating what it carries',
    'action.searchWaterNearHome': 'Sweeps near the nest for water',

    'tag.explore': 'EXPLORE',
    'tag.seekFood': 'HUNT',
    'tag.seekWater': 'THIRST',
    'tag.drink': 'DRINK',
    'tag.track': 'SMELL',
    'tag.memory': 'MEM',
    'tag.pheromone': 'TRAIL',
    'tag.carry': 'NEST',
    'tag.toNest': 'NEST',
    'tag.rest': 'ZZZ',
    'tag.pantry': 'FOOD',
    'tag.eat': 'EAT',
    'tag.pick': 'PICK',
    'tag.nest': 'NEST',
    'tag.learn': 'LEARN',
    'tag.spot': 'SPOT',
    'tag.done': 'DONE',
    'tag.dead': 'DEAD',
    'tag.eatCarried': 'EAT',
    'tag.searchWaterNearHome': 'THIRST',
    'tag.api': 'API',

    'reason.drinking': 'in the water, thirst {thirst}',
    'reason.restInNest': 'in the nest, energy {energy}',
    'reason.restOutside': 'worn out and no nest nearby, stops to recover',
    'reason.goRest': 'energy {energy}, going to rest',
    'reason.carry': 'carrying {what} · marking the way',
    'reason.trackFood': 'smells {what} at {strength} · follows the thread to the source',
    'reason.trackWater': 'thirst {thirst}, smells it · follows the thread to the source',
    'reason.seekWater': 'thirst {thirst}, {how} · scores {score}',
    'reason.seekFood': 'sees it · wins out of {n} · scores {score}',
    'reason.lostTrail': 'lost the trail of {what}, sweeping {sec} more',
    'reason.pantry': 'hunger {hunger} and nothing in sight · there are reserves at home',
    'reason.pheromone': 'its own marked path, leads to where food was',
    'reason.memory': 'lost sight of it, insists {sec} more',
    'reason.explore': 'no needs and nothing in sight · maps the unknown for later',
    'reason.exploreFull': 'pantry done · nothing left to do but learn the map',
    'reason.nothing': 'perceives nothing',
    'reason.belowMin': '{n} candidate(s), none above the minimum',

    'log.spotWater': 'Spots water',
    'log.spotWaterSub': 'stores where it is · not the same as going',
    'log.tryWater': 'Tries the water',
    'log.tryWaterSub': 'thirst {thirst} · learns {arrow} {before} → {after}',
    'log.reachWater': 'Reached the water',
    'log.leaveWater': 'Leaves the water',
    'log.thirstIs': 'thirst {thirst}',
    'log.ate': 'Ate {what}',
    'log.ateSub': 'hunger {hunger} · learns {arrow} {before} → {after}',
    'log.pick': 'Picks up {what}',
    'log.pickSub': 'not hungry: carries it to the nest instead of eating it',
    'log.store': 'Stores {what} in the nest',
    'log.storeSub': '{what} in reserve: {total}',
    'log.pantry': 'Eats from the reserves',
    'log.pantrySub': '{what} stored in the nest',
    'log.died': 'Died {cause}',
    'log.diedSub': 'lived {age}, ate {eaten}',

    'cause.hunger': 'of hunger',
    'cause.thirst': 'of thirst',
    'status.died': 'Died {cause} at {age}',

    'score.belief': 'belief',
    'score.curiosity': 'curiosity',
    'score.need': 'need',
    'score.distance': 'distance',
    'score.smell': 'smell',

    'dir.right': 'right',
    'dir.downRight': 'down-right',
    'dir.down': 'down',
    'dir.downLeft': 'down-left',
    'dir.left': 'left',
    'dir.upLeft': 'up-left',
    'dir.up': 'up',
    'dir.upRight': 'up-right',
    'dir.rising': 'rising',
    'dir.falling': 'falling',
    'dir.level': 'level',

    'stage.corta': 'short',
    'stage.media': 'medium',
    'stage.larga': 'long',
    'word.confidence': 'confidence',
    'log.forgot': 'Stops trusting {what}',
    'log.forgotSub': 'no longer confirmed: curiosity comes back',
    'log.consolidated': 'Consolidates {what}',
    'log.consolidatedSub': 'spaced repeats · now long-term memory',
    'set.memory': 'Memory',
    'set.wipe': 'Forget everything',

    'log.rule': 'Learns: {rule}',
    'log.ruleRevised': 'Revises: {rule}',
    'log.ruleRetired': 'Stops avoiding {what}',
    'log.ruleSub': 'because {because}',
    'log.peril': '{what} sat worse than it first seemed',
    'log.perilSub': 'the belief gets a second, harder correction',
    'reason.api': 'decided by {backend}',

    'sense.hunger': 'hunger {v}',
    'sense.thirst': 'thirst {v}',
    'sense.speed': 'speed ×{v}',
    'sense.viewRange': 'sight ×{v}',
    'sense.fovDeg': 'view angle ×{v}',
    'sense.smell': 'smell ×{v}',
    'sense.hungerRate': 'metabolism ×{v}',
    'sense.peril': 'it later got worse',
    'sense.contradiccion': 'contradicts what it believed',

    'code.recover': 'Recover',
    'code.recoverNone': 'no earlier session saved',
    'code.recoverFrom': 'saved after {age} of a previous run',
    'code.export': 'Export',
    'code.import': 'Import…',
    'code.forget': 'Forget',
    'code.recovered': 'Recovered what it learned before',
    'code.imported': 'Imported: reads as its own experience now',
    'code.importError': "That file doesn't read as learned code",
    'code.backend': 'Who decides',
    'code.backendNone': 'Instinct only',
    'code.backendLocal': 'Local emulator',
    'code.backendHttp': 'HTTP API',

    'fx.speed': 'Speed',
    'fx.viewRange': 'Sight range',
    'fx.fovDeg': 'View angle',
    'fx.hungerRate': 'Metabolism',

    'set.title': 'Settings',
    'set.clearTrees': 'Remove trees',
    'set.factory': 'Factory values',
    'set.close': 'Close',
  },

  es: {
    'app.title': 'FAGI',
    'app.settings': '⚙ Ajustes',
    'app.immersive': '🌿 Inmersivo',
    'app.analysis': '◉ Análisis',
    'app.reset': 'Reiniciar · mapa nuevo',
    'app.language': 'Idioma / Language',
    'app.collapseAll': '▾ Ocultar todo',
    'app.expandAll': '▸ Mostrar todo',
    'app.hidePanel': 'Ocultar panel',
    'app.showPanel': 'Mostrar panel',

    'panel.food': 'Alimento',
    'panel.map': 'Mapa · der. borra · mayús+rueda tamaño',
    'panel.camera': 'Cámara · rueda acerca · botón central arrastra · flechas mueven · F sigue a Fagi · 0 vuelve al mapa',
    'panel.treeEvery': 'Fruta del árbol cada',
    'panel.state': 'Estado',
    'panel.heading': 'Rumbo',
    'panel.pantry': 'Despensa del nido',
    'panel.effects': 'Efectos activos',
    'panel.learned': 'Lo que ha aprendido',
    'panel.console': 'Consola de decisiones',
    'panel.scores': 'Puntuación de lo que percibe',
    'panel.history': 'Histórico',
    'panel.code': 'Código aprendido',
    'panel.brainmap': 'Mapa del cerebro',
    'panel.tabLive': 'Consola y mapa',
    'panel.tabHistory': 'Código e histórico',
    'panel.now': 'Ahora mismo',
    'brainmap.empty': 'Todavía nada que enseñar: sin experiencia por ahora',
    'brainmap.status': '{beliefs} creencia(s) · {active} regla(s) activa(s) · {retired} retirada(s) · {events} ajuste(s)',

    'stat.hunger': 'Hambre',
    'stat.thirst': 'Sed',
    'stat.energy': 'Energía',
    'stat.age': 'Edad',
    'stat.eaten': 'Comidos',
    'stat.carrying': 'Lleva',
    'stat.position': 'Posición',
    'stat.movingTo': 'Avanza hacia',
    'stat.vertical': 'Vertical',
    'stat.wind': 'Viento',

    // Unidades de tiempo (formatDuration / formatClock).
    'unit.sec': 's',
    'unit.min': 'm',
    'unit.hour': 'h',
    'unit.day': 'd',

    'word.nothing': 'nada',
    'word.none': 'ninguno',
    'word.empty': 'vacía',
    'word.untested': 'sin probar',
    'word.noNest': 'sin nido en el mapa',
    'word.nothingToChase': 'nada que perseguir',
    'word.eye': 'ojo',
    'word.nose': 'nariz',
    'word.memory': 'memoria',
    'word.sees': 'ojo',
    'word.smells': 'nariz',
    'word.water': 'agua',
    'word.carries': 'lleva',

    'type.nectar': 'Néctar',
    'type.chispa': 'Chispa',
    'type.ojo': 'Ojo',
    'type.resina': 'Resina',
    'type.toxico': 'Tóxico',
    'type.agua': 'Agua',
    'type.nido': 'Nido',
    'type.arbol': 'Árbol',
    'type.roca': 'Roca',

    'hint.water': 'clic la mueve · mayús+rueda tamaño',
    'hint.nest': 'clic lo mueve · mayús+rueda tamaño',
    'hint.tree': 'suelta fruta sola · mayús+rueda tamaño',
    'hint.rock': 'corta paso y visión',
    'hint.hunger': 'hambre {v}',
    'hint.aroma': 'aroma {v}',

    'water.sees': 'la ve',
    'water.smells': 'la huele',
    'water.remembers': 'la recuerda',
    'water.unknown': 'no sabe dónde',

    'action.explore': 'Explorando',
    'action.seekFood': 'Va a por comida',
    'action.seekWater': 'Va a por agua',
    'action.drink': 'Bebiendo',
    'action.track': 'Rastrea un olor',
    'action.memory': 'Sigue de memoria',
    'action.pheromone': 'Sigue su propia feromona',
    'action.carry': 'Lleva comida al nido',
    'action.toNest': 'Vuelve al nido a descansar',
    'action.rest': 'Descansando',
    'action.pantry': 'Va al nido a por reservas',
    'action.eatCarried': 'Come lo que lleva encima',
    'action.searchWaterNearHome': 'Barre cerca del nido buscando agua',

    'tag.explore': 'EXPLORA',
    'tag.seekFood': 'CAZA',
    'tag.seekWater': 'SED',
    'tag.drink': 'BEBE',
    'tag.track': 'OLOR',
    'tag.memory': 'MEM',
    'tag.pheromone': 'PISTA',
    'tag.carry': 'NIDO',
    'tag.toNest': 'NIDO',
    'tag.rest': 'ZZZ',
    'tag.pantry': 'DESPENSA',
    'tag.eat': 'COME',
    'tag.pick': 'CARGA',
    'tag.nest': 'NIDO',
    'tag.learn': 'SABE',
    'tag.spot': 'VE',
    'tag.done': 'FIN',
    'tag.dead': 'MUERE',
    'tag.eatCarried': 'COME',
    'tag.searchWaterNearHome': 'SED',
    'tag.api': 'API',

    'reason.drinking': 'dentro del agua, sed {thirst}',
    'reason.restInNest': 'en el nido, energía {energy}',
    'reason.restOutside': 'sin fuerzas y sin nido cerca, para a recuperar',
    'reason.goRest': 'energía {energy}, va a descansar',
    'reason.carry': 'carga {what} · marca el camino',
    'reason.trackFood': 'huele {what} al {strength} · sigue el hilo hasta la fuente',
    'reason.trackWater': 'sed {thirst}, la huele · sigue el hilo hasta la fuente',
    'reason.seekWater': 'sed {thirst}, {how} · puntúa {score}',
    'reason.seekFood': 'lo ve · gana de {n} · puntúa {score}',
    'reason.lostTrail': 'perdió el rastro de {what}, barre {sec} más',
    'reason.pantry': 'hambre {hunger} y nada a la vista · en casa hay reservas',
    'reason.pheromone': 'camino marcado por ella misma, lleva a donde había comida',
    'reason.memory': 'lo perdió de vista, insiste {sec} más',
    'reason.explore': 'sin necesidad y sin nada a la vista · conoce mapa para después',
    'reason.exploreFull': 'despensa hecha · lo único que queda por hacer es aprenderse el mapa',
    'reason.nothing': 'no percibe nada',
    'reason.belowMin': '{n} candidato(s), ninguno supera el mínimo',

    'log.spotWater': 'Detecta agua',
    'log.spotWaterSub': 'guarda dónde está · no significa que vaya',
    'log.tryWater': 'Prueba el agua',
    'log.tryWaterSub': 'sed {thirst} · aprende {arrow} {before} → {after}',
    'log.reachWater': 'Llegó al agua',
    'log.leaveWater': 'Sale del agua',
    'log.thirstIs': 'sed {thirst}',
    'log.ate': 'Comió {what}',
    'log.ateSub': 'hambre {hunger} · aprende {arrow} {before} → {after}',
    'log.pick': 'Carga {what}',
    'log.pickSub': 'sin hambre: en vez de comerlo se lo lleva al nido',
    'log.store': 'Guarda {what} en el nido',
    'log.storeSub': 'reservas de {what}: {total}',
    'log.pantry': 'Come de las reservas',
    'log.pantrySub': '{what} guardado en el nido',
    'log.died': 'Murió {cause}',
    'log.diedSub': 'vivió {age}, comió {eaten}',

    'cause.hunger': 'de hambre',
    'cause.thirst': 'de sed',
    'status.died': 'Murió {cause} a los {age}',

    'score.belief': 'creencia',
    'score.curiosity': 'curiosidad',
    'score.need': 'necesidad',
    'score.distance': 'distancia',
    'score.smell': 'olfato',

    'dir.right': 'derecha',
    'dir.downRight': 'abajo-der.',
    'dir.down': 'abajo',
    'dir.downLeft': 'abajo-izq.',
    'dir.left': 'izquierda',
    'dir.upLeft': 'arriba-izq.',
    'dir.up': 'arriba',
    'dir.upRight': 'arriba-der.',
    'dir.rising': 'sube',
    'dir.falling': 'baja',
    'dir.level': 'nivelado',

    'stage.corta': 'corta',
    'stage.media': 'media',
    'stage.larga': 'larga',
    'word.confidence': 'confianza',
    'log.forgot': 'Deja de fiarse de {what}',
    'log.forgotSub': 'sin confirmar: le vuelve la curiosidad',
    'log.consolidated': 'Consolida {what}',
    'log.consolidatedSub': 'repeticiones espaciadas · ya es memoria larga',
    'set.memory': 'Memoria',
    'set.wipe': 'Olvidarlo todo',

    'log.rule': 'Aprende: {rule}',
    'log.ruleRevised': 'Revisa: {rule}',
    'log.ruleRetired': 'Deja de evitar {what}',
    'log.ruleSub': 'porque {because}',
    'log.peril': '{what} le sentó peor de lo que pareció al probarlo',
    'log.perilSub': 'la creencia recibe una segunda corrección, más dura',
    'reason.api': 'lo decide {backend}',

    'sense.hunger': 'hambre {v}',
    'sense.thirst': 'sed {v}',
    'sense.speed': 'velocidad ×{v}',
    'sense.viewRange': 'alcance ×{v}',
    'sense.fovDeg': 'ángulo ×{v}',
    'sense.smell': 'olfato ×{v}',
    'sense.hungerRate': 'metabolismo ×{v}',
    'sense.peril': 'más tarde fue a peor',
    'sense.contradiccion': 'contradice lo que creía',

    'code.recover': 'Recuperar',
    'code.recoverNone': 'no hay ninguna sesión anterior guardada',
    'code.recoverFrom': 'guardado tras {age} de una partida anterior',
    'code.export': 'Exportar',
    'code.import': 'Importar…',
    'code.forget': 'Olvidar',
    'code.recovered': 'Recupera lo que aprendió antes',
    'code.imported': 'Importado: ahora lo lee como experiencia propia',
    'code.importError': 'Ese archivo no se lee como código aprendido',
    'code.backend': 'Quién decide',
    'code.backendNone': 'Solo instinto',
    'code.backendLocal': 'Emulador local',
    'code.backendHttp': 'API HTTP',

    'fx.speed': 'Velocidad',
    'fx.viewRange': 'Alcance',
    'fx.fovDeg': 'Ángulo',
    'fx.hungerRate': 'Metabolismo',

    'set.title': 'Ajustes',
    'set.clearTrees': 'Quitar árboles',
    'set.factory': 'Valores de fábrica',
    'set.close': 'Cerrar',
  },
};

export const LANGS = Object.keys(DICT);

let lang = leerGuardado();
const oyentes = new Set();

function leerGuardado() {
  try {
    const guardado = localStorage.getItem('fagi.lang');
    if (guardado && DICT[guardado]) return guardado;
  } catch { /* sin localStorage: inglés y ya está */ }
  return 'en';
}

export function getLang() {
  return lang;
}

export function setLang(nuevo) {
  if (!DICT[nuevo] || nuevo === lang) return;
  lang = nuevo;
  try { localStorage.setItem('fagi.lang', nuevo); } catch { /* da igual */ }
  for (const f of oyentes) f(lang);
}

// Para que el HUD y el panel se reconstruyan al cambiar de idioma.
export function onLangChange(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

// t('reason.memory', { sec: { dur: 1.4, precise: true } })
//   ->  'lo perdió de vista, insiste 1.4s más'
export function t(key, params) {
  const txt = DICT[lang][key] ?? DICT.en[key] ?? key;
  if (!params) return txt;
  return txt.replace(/\{(\w+)\}/g, (_, k) => {
    const v = params[k];
    if (v && typeof v === 'object') {
      // Un parámetro puede ser otra clave: { key: 'water.sees' }.
      if (v.key) return t(v.key, v.params);
      // O una duración en segundos sin formatear: { dur: 90 } -> '1m 30s'.
      if (typeof v.dur === 'number') return formatDuration(v.dur, { precise: v.precise });
    }
    return v ?? `{${k}}`;
  });
}

// Duraciones legibles. La simulación cuenta todo en segundos, pero en pantalla
// "1m 30s" se lee de un vistazo y "90.0s" no. Como mucho dos unidades: la
// tercera no aporta nada a quien está mirando el HUD.
//
//   formatDuration(42)     -> '42s'
//   formatDuration(90)     -> '1m 30s'
//   formatDuration(3900)   -> '1h 05m'
//   formatDuration(180000) -> '2d 02h'
//
// `precise` deja un decimal en los segundos, para cuentas atrás cortas (efectos
// activos, insistencia de memoria) donde la décima sí se nota.
export function formatDuration(segundos, { precise = false } = {}) {
  const u = (k) => t(`unit.${k}`);
  const bruto = Math.max(0, Number(segundos) || 0);
  // Redondear ANTES de repartir, o 59.7 saldría como '60s'.
  const total = precise ? Math.round(bruto * 10) / 10 : Math.round(bruto);

  if (total < 60) return `${precise ? total.toFixed(1) : total}${u('sec')}`;

  const seg = Math.floor(total % 60);
  const min = Math.floor(total / 60) % 60;
  const hor = Math.floor(total / 3600) % 24;
  const dia = Math.floor(total / 86400);

  // La unidad pequeña desaparece cuando es cero: '5m' antes que '5m 00s'.
  if (total < 3600) return seg === 0 ? `${min}${u('min')}` : `${min}${u('min')} ${dos(seg)}${u('sec')}`;
  if (total < 86400) return min === 0 ? `${hor}${u('hour')}` : `${hor}${u('hour')} ${dos(min)}${u('min')}`;
  return hor === 0 ? `${dia}${u('day')}` : `${dia}${u('day')} ${dos(hor)}${u('hour')}`;
}

// Marca de tiempo de cronómetro, para el histórico de la consola: ahí dos
// líneas seguidas tienen que distinguirse, así que los segundos no se pierden.
//
//   formatClock(12.4) -> '12.4s'   formatClock(90) -> '1:30'   formatClock(3725) -> '1:02:05'
export function formatClock(segundos) {
  const total = Math.max(0, Number(segundos) || 0);
  if (total < 60) return `${total.toFixed(1)}${t('unit.sec')}`;
  const seg = Math.floor(total % 60);
  const min = Math.floor(total / 60) % 60;
  const hor = Math.floor(total / 3600);
  return hor > 0 ? `${hor}:${dos(min)}:${dos(seg)}` : `${min}:${dos(seg)}`;
}

function dos(n) {
  return String(n).padStart(2, '0');
}

// Un texto que puede ser una clave con parámetros: { key, params } o ya una cadena.
export function tx(valor) {
  if (!valor) return '';
  return typeof valor === 'string' ? valor : t(valor.key, valor.params);
}

// Nombre traducido de un alimento o de un objeto del mapa.
export function labelOf(key) {
  return t(`type.${key}`);
}

// Rellena los textos fijos del HTML (los que llevan data-i18n) y vuelve a
// hacerlo cada vez que se cambia de idioma.
export function bindDom() {
  const aplicar = () => {
    document.documentElement.lang = lang;
    for (const el of document.querySelectorAll('[data-i18n]')) {
      el.textContent = t(el.dataset.i18n);
    }
  };
  const selector = document.getElementById('lang');
  if (selector) {
    selector.value = lang;
    selector.addEventListener('change', () => setLang(selector.value));
  }
  onLangChange(aplicar);
  aplicar();
}
