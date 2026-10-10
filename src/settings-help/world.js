// Help shown under each setting (settings.js): what it means and what changing it does.
export default {
  groups: {
    'Scent plumes': [
      'The scent threads that trees, fruit, water and nests trail downwind, which Fagi follows to find them.',
      'Los hilos de olor que árboles, frutas, agua y nidos dejan a favor del viento, y que Fagi sigue para encontrarlos.',
    ],
    'Water': [
      'How water feels to her body: standing in the shallows, flailing in deep water, getting soaked and probing with her antennae.',
      'Cómo siente el agua su cuerpo: hacer pie en el vado, patalear en el hondo, empaparse y tantear con las antenas.',
    ],
    'Trees': [
      'How trees drop fruit and when fruit starts to look overripe.',
      'Cómo dejan caer fruta los árboles y desde cuándo la fruta se ve pasada.',
    ],
    'Explore or come back': [
      'A world where going back to the last good place isn’t always right: seasonal trees that go bare and fruit patches that appear once.',
      'Un mundo donde volver al último buen sitio no siempre conviene: árboles de temporada que quedan pelados y manchas de fruta que aparecen una vez.',
    ],
    'Food sites': [
      'Her memory of several places where she found food, and what she expects from each.',
      'Su memoria de varios lugares donde encontró comida y lo que espera de cada uno.',
    ],
    'Explore or come back: the choice': [
      'When hungry with no food in sight, she weighs going back to a known site against exploring somewhere new.',
      'Cuando tiene hambre y no ve comida, sopesa volver a un sitio conocido o explorar uno nuevo.',
    ],
    'Map objects': [
      'Size and aroma of objects you place, and what a newly generated map contains.',
      'Tamaño y aroma de los objetos que colocas, y qué contiene un mapa recién generado.',
    ],
  },
  fields: {
    // Scent plumes
    'Scent plumes.show': [
      'Drawing only; smell works the same. On → every trail on the map is drawn (can bury the map under threads); off → a trail shows only while a Fagi is smelling it.',
      'Solo afecta el dibujo; el olfato funciona igual. Encendido → se dibujan todas las estelas (puede tapar el mapa); apagado → una estela solo se ve mientras una Fagi la huele.',
    ],
    'Scent plumes.step': [
      'Length in px of each new segment of the thread. Higher → longer, coarser threads that reach farther; lower → finer, shorter threads.',
      'Largo en px de cada tramo nuevo del hilo. Más alto → hilos más largos y toscos que llegan más lejos; más bajo → hilos más finos y cortos.',
    ],
    'Scent plumes.every': [
      'Seconds between new segments, i.e. how fast a thread grows. Higher → trails grow slowly after appearing or after rain; lower → they spread out almost at once.',
      'Segundos entre tramos nuevos, o sea, qué tan rápido crece el hilo. Más alto → las estelas tardan en crecer tras aparecer o tras la lluvia; más bajo → se extienden casi al instante.',
    ],
    'Scent plumes.drift': [
      'How much each segment can bend (radians). Higher → winding threads that are harder to follow back; lower → straighter threads.',
      'Cuánto puede doblarse cada tramo (radianes). Más alto → hilos sinuosos, más difíciles de rastrear; más bajo → hilos más rectos.',
    ],
    'Scent plumes.windPull': [
      'How strongly the wind pulls the thread towards its direction. Higher → threads stretch straight downwind; lower → they wander freely.',
      'Cuánto tira el viento del hilo hacia su dirección. Más alto → los hilos se estiran rectos a favor del viento; más bajo → vagan libremente.',
    ],
    'Scent plumes.radius': [
      'How far from the thread the smell can be perceived (px, scaled by her sense of smell). Higher → easier to catch a scent; lower → she must cross the thread almost exactly.',
      'A qué distancia del hilo se percibe el olor (px, según su olfato). Más alto → es más fácil captar un olor; más bajo → tiene que cruzar el hilo casi justo.',
    ],
    'Scent plumes.nodesPerAroma': [
      'Maximum segments of a thread = the source’s aroma × this. Higher → longer trails that reach far; lower → short trails, sources found only up close.',
      'Máximo de tramos de un hilo = aroma de la fuente × este valor. Más alto → estelas largas que llegan lejos; más bajo → estelas cortas, las fuentes se encuentran solo de cerca.',
    ],
    'Scent plumes.faint': [
      'How much the scent dilutes from the source to the tip. Higher → the far end is faint and barely smelled; lower → the whole thread smells almost as strong as the source.',
      'Cuánto se diluye el olor de la fuente a la punta. Más alto → la punta es tenue y apenas se huele; más bajo → todo el hilo huele casi tan fuerte como la fuente.',
    ],

    // Water
    'Water.vado': [
      'Band of water inside the shore (px) where her legs still touch bottom, so she can stand and drink; deeper water lies inside it. Higher → wider shallows, less deep water; lower → deep water starts right at the edge.',
      'Franja de agua junto a la orilla (px) donde todavía hace pie y puede beber; más adentro está el hondo. Más alto → vado más ancho y menos hondo; más bajo → el hondo empieza justo en la orilla.',
    ],
    'Water.wadeSpeed': [
      'Speed multiplier while in the shallows (mud, wet legs). Higher → she moves almost normally; lower → wading is slow.',
      'Multiplicador de velocidad en el vado (barro, patas mojadas). Más alto → se mueve casi normal; más bajo → avanzar por el vado es lento.',
    ],
    'Water.swimSpeed': [
      'Speed multiplier while flailing in deep water. Higher → she gets out quickly; lower → she stays trapped longer, losing more energy.',
      'Multiplicador de velocidad pataleando en el hondo. Más alto → sale rápido; más bajo → queda atrapada más tiempo y pierde más energía.',
    ],
    'Water.swimEffort': [
      'How much more energy flailing costs than walking. Higher → deep water drains her fast and hurts more; lower → falling in is cheap.',
      'Cuánta más energía cuesta patalear que andar. Más alto → el hondo la agota rápido y duele más; más bajo → caer al agua sale barato.',
    ],
    'Water.shock': [
      'Share of the full fright she gets just from losing her footing, even if she gets out at once. Higher → even a brief dunk teaches a lot; lower → only long dunks count.',
      'Parte del susto entero que le da solo perder pie, aunque salga enseguida. Más alto → hasta un chapuzón breve enseña mucho; más bajo → solo cuentan los chapuzones largos.',
    ],
    'Water.sample': [
      'Seconds in deep water that make up the whole fright; each such stretch is one experience. Higher → longer dunks are needed for the full lesson; lower → the full fright comes quickly.',
      'Segundos en el hondo que suman el susto entero; cada tramo así es una experiencia. Más alto → hacen falta chapuzones más largos para la lección completa; más bajo → el susto entero llega rápido.',
    ],
    'Water.lesson': [
      'How much a full fright lowers her belief about deep water. Higher → she learns to avoid it after few dunks; lower → she keeps falling in; 0 → she never learns.',
      'Cuánto baja un susto entero su creencia sobre el hondo. Más alto → aprende a evitarlo tras pocos chapuzones; más bajo → sigue cayendo; 0 → nunca aprende.',
    ],
    'Water.wetSpeed': [
      'Speed multiplier right after leaving deep water or in the rain outside the nest; it returns to normal as she dries. Higher → being soaked barely slows her; lower → she drags a lot.',
      'Multiplicador de velocidad al salir del hondo o bajo la lluvia fuera del nido; vuelve a lo normal al secarse. Más alto → estar empapada casi no la frena; más bajo → se arrastra mucho.',
    ],
    'Water.dryTime': [
      'Seconds it takes her to dry off after being soaked. Higher → the slowdown lasts longer; lower → she recovers quickly; 0 → no slowdown.',
      'Segundos que tarda en secarse tras empaparse. Más alto → la lentitud dura más; más bajo → se recupera rápido; 0 → sin lentitud.',
    ],
    'Water.probeReach': [
      'How far ahead of her body (px) the antennae sense deep water. Higher → she notices it earlier and slows to probe; lower → she notices it only when nearly in; 0 → almost no warning.',
      'Qué tan adelante de su cuerpo (px) las antenas detectan el hondo. Más alto → lo nota antes y frena a tantear; más bajo → lo nota casi al entrar; 0 → casi sin aviso.',
    ],
    'Water.probeSpeed': [
      'Speed multiplier while her antennae are over deep water. Higher → she barely slows; lower → she inches forward carefully.',
      'Multiplicador de velocidad mientras sus antenas están sobre el hondo. Más alto → apenas frena; más bajo → avanza con mucho cuidado.',
    ],

    // Trees
    'Trees.interval': [
      'Seconds between fruits a tree drops. Higher → scarcer food; lower → abundant food.',
      'Segundos entre frutas que deja caer un árbol. Más alto → comida escasa; más bajo → comida abundante.',
    ],
    'Trees.life': [
      'Seconds a tree lives before drying up and falling (0 = forever). Higher → trees last longer; lower → food sources vanish and she must find new ones.',
      'Segundos que vive un árbol antes de secarse y caer (0 = para siempre). Más alto → los árboles duran más; más bajo → las fuentes desaparecen y debe buscar otras.',
    ],
    'Trees.seed': [
      'On: a fruit that rots away uncollected leaves a seed, which takes root away from every crown; a tree that dies is replaced by a seed from the soil or one of its own. Off: the map’s trees are all there are.',
      'Encendido: una fruta que se pudre sin recoger deja una semilla, que echa raíz lejos de toda copa; un árbol que muere lo reemplaza una semilla del suelo o una suya. Apagado: los árboles del mapa son todos los que hay.',
    ],
    'Trees.room': [
      'How many trees seeds may add over the ones the map began with. Higher → the wood can grow; 0 → new trees only replace dead ones.',
      'Cuántos árboles pueden sumar las semillas sobre los que tenía el mapa al empezar. Más alto → el bosque puede crecer; 0 → los nuevos solo reemplazan a los muertos.',
    ],
    'Trees.mature': [
      'Seconds a young tree grows before it bears fruit. Higher → a new tree takes long to feed anyone; lower → it bears soon.',
      'Segundos que crece un árbol joven antes de dar fruto. Más alto → un árbol nuevo tarda en alimentar; más bajo → da fruto pronto.',
    ],
    'Trees.maxNear': [
      'If this much of its fruit lies uncollected, the tree stops dropping more. Higher → fruit piles up around trees; lower → little fruit waits on the ground.',
      'Si tiene esta cantidad de fruta suya sin recoger, el árbol deja de soltar más. Más alto → la fruta se acumula alrededor; más bajo → poca fruta espera en el suelo.',
    ],
    'Trees.dropRadius': [
      'Where fruit falls, as a multiple of the tree’s radius. Higher → fruit scatters farther from the trunk; lower → it lands right under the crown.',
      'Dónde cae la fruta, como múltiplo del radio del árbol. Más alto → se dispersa más lejos del tronco; más bajo → cae justo bajo la copa.',
    ],
    'Trees.warnFrom': [
      'Fraction of a fruit’s life from which it starts to look overripe (appearance only). Higher → the warning shows late; lower → fruit looks overripe early.',
      'Fracción de la vida de una fruta desde la cual se ve pasada (solo apariencia). Más alto → el aviso aparece tarde; más bajo → la fruta se ve pasada pronto.',
    ],

    // Explore or come back
    'Explore or come back.enabled': [
      'On → some trees are seasonal (they drop a crop, go bare and rest) and one-off fruit patches appear on the ground; off → every tree bears forever, as before.',
      'Encendido → algunos árboles son de temporada (dan una cosecha, quedan pelados y descansan) y aparecen manchas de fruta en el suelo; apagado → todos los árboles dan siempre, como antes.',
    ],
    'Explore or come back.persistence': [
      'Share of trees that bear all year; the rest are seasonal. Needs this group on. Higher → returning to a known tree is reliable; lower → she often finds bare trees and must explore.',
      'Parte de los árboles que dan todo el año; el resto son de temporada. Requiere este grupo encendido. Más alto → volver a un árbol conocido es fiable; más bajo → suele hallarlos pelados y debe explorar.',
    ],
    'Explore or come back.crop': [
      'Fruit a seasonal tree drops before going bare. Higher → seasonal trees stay worth visiting longer; lower → they run out quickly.',
      'Frutos que da un árbol de temporada antes de quedar pelado. Más alto → conviene visitarlo por más tiempo; más bajo → se agota rápido.',
    ],
    'Explore or come back.rest': [
      'Seconds a bare seasonal tree rests before bearing again. Higher → long empty spells; lower → it recovers quickly.',
      'Segundos que descansa un árbol de temporada pelado antes de volver a dar. Más alto → largas rachas vacías; más bajo → se recupera rápido.',
    ],
    'Explore or come back.patchEvery': [
      'Seconds between fruit patches appearing on the ground somewhere (never renewed; 0 = none). Higher → rare windfalls; lower → exploring pays off more often.',
      'Segundos entre manchas de fruta que aparecen en el suelo (no se renuevan; 0 = ninguna). Más alto → hallazgos raros; más bajo → explorar rinde más seguido.',
    ],
    'Explore or come back.patchSize': [
      'Fruit in each ground patch. Higher → each find is a bigger reward; lower → patches are small.',
      'Frutos en cada mancha del suelo. Más alto → cada hallazgo es una recompensa mayor; más bajo → manchas pequeñas.',
    ],

    // Food sites
    'Food sites.enabled': [
      'On → she remembers several places where she found food and learns what each gives when she returns; off → she remembers a single tree, as before.',
      'Encendido → recuerda varios lugares con comida y aprende qué da cada uno al volver; apagado → recuerda un solo árbol, como antes.',
    ],
    'Food sites.max': [
      'How many sites she can remember at once; when full, the least trusted is forgotten. Needs Food sites on. Higher → a wider mental map; lower → she keeps only her best spots.',
      'Cuántos sitios puede recordar a la vez; si se llena, olvida el de menos confianza. Requiere Sitios de comida encendido. Más alto → un mapa mental más amplio; más bajo → solo guarda sus mejores sitios.',
    ],
    'Food sites.rate': [
      'How far one visit moves what she expects of a site (× the surprise). Higher → she updates fast but is swayed by one bad visit; lower → steadier, slower to notice change.',
      'Cuánto mueve una visita lo que espera de un sitio (× la sorpresa). Más alto → se actualiza rápido pero una mala visita la desvía; más bajo → más estable, tarda en notar cambios.',
    ],

    // Explore or come back: the choice
    'Explore or come back: the choice.enabled': [
      'On → she learns whether to go back to a known site or explore, from what each has given her; off → a fixed hierarchy decides. Needs Food sites on.',
      'Encendido → aprende si volver a un sitio conocido o explorar, según lo que le dio cada opción; apagado → decide una jerarquía fija. Requiere Sitios de comida encendido.',
    ],
    'Explore or come back: the choice.policy': [
      'Learned → she weighs both options. Always go back / always explore are fixed baselines for comparison: always her best site, or always somewhere new.',
      'Aprendido → sopesa ambas opciones. Siempre volver / siempre explorar son referencias fijas para comparar: siempre su mejor sitio o siempre un lugar nuevo.',
    ],
    'Explore or come back: the choice.mode': [
      'Her own uncertainty → she draws guesses from her evidence (food per second), so doubt itself drives exploring. Values, fixed noise → she compares values with a set noise (Noise when choosing).',
      'Su propia incertidumbre → saca conjeturas de su evidencia (comida por segundo), así la duda misma la lleva a explorar. Valores, ruido fijo → compara valores con un ruido fijo (Ruido al elegir).',
    ],
    'Explore or come back: the choice.genes': [
      'Only with Her own uncertainty mode. On → her starting beliefs, memory pace and patience are inherited and evolve over generations; off → everyone uses the values set here.',
      'Solo con el modo Su propia incertidumbre. Encendido → sus creencias iniciales, el ritmo de su memoria y su paciencia se heredan y evolucionan; apagado → todas usan los valores fijados aquí.',
    ],
    'Explore or come back: the choice.temper': [
      'Only with Values, fixed noise mode: how much chance the worse option keeps. Higher → more random, more exploring; lower → she almost always picks what seems best.',
      'Solo con el modo Valores, ruido fijo: cuánta probabilidad conserva la peor opción. Más alto → más azar y más exploración; más bajo → casi siempre elige lo que parece mejor.',
    ],
    'Explore or come back: the choice.temperSpread': [
      'How much that noise differs between individuals from birth (0 = all alike). Higher → some are bold explorers, others creatures of habit; lower → similar temperaments.',
      'Cuánto difiere ese ruido entre individuos desde que nacen (0 = todas iguales). Más alto → unas exploran mucho y otras son de costumbre; más bajo → temperamentos parecidos.',
    ],

    // Map objects
    'Map objects.water.radius': [
      'Radius (px) of water you place from now on. Higher → bigger ponds with more deep water; lower → small ponds, possibly all shallows.',
      'Radio (px) del agua que coloques de ahora en más. Más alto → estanques grandes con más hondo; más bajo → estanques chicos, quizá todo vado.',
    ],
    'Map objects.aroma': [
      'How strongly water smells: sets the length of its scent trail. Higher → she can find water from farther away; lower → she must stumble on it; 0 → no trail.',
      'Cuánto huele el agua: define el largo de su estela. Más alto → encuentra agua desde más lejos; más bajo → tiene que toparse con ella; 0 → sin estela.',
    ],
    'Map objects.nest.radius': [
      'Radius (px) of nests placed from now on. Higher → a bigger shelter that’s easier to find; lower → a small nest.',
      'Radio (px) de los nidos que se coloquen de ahora en más. Más alto → refugio más grande y fácil de encontrar; más bajo → nido pequeño.',
    ],
    'Map objects.tree.radius': [
      'Radius (px) of trees placed from now on; fruit falls around it. Higher → wide crowns that block more and spread fruit farther; lower → small trees.',
      'Radio (px) de los árboles que se coloquen de ahora en más; la fruta cae a su alrededor. Más alto → copas anchas que estorban más y reparten la fruta más lejos; más bajo → árboles pequeños.',
    ],
    'Map objects.radius': [
      'Radius (px) of rocks placed from now on. Higher → big obstacles she must walk around; lower → pebbles that barely get in the way.',
      'Radio (px) de las rocas que se coloquen de ahora en más. Más alto → grandes obstáculos que debe rodear; más bajo → piedritas que apenas estorban.',
    ],
    'Map objects.trees': [
      'Trees placed when generating a classic map, far from the nest. Higher → more food sources; lower → a single tree forces her to find its trail; 0 → none.',
      'Árboles que se colocan al generar un mapa clásico, lejos del nido. Más alto → más fuentes de comida; más bajo → un solo árbol la obliga a encontrar su estela; 0 → ninguno.',
    ],
    'Map objects.size': [
      'Map size as a multiple of the base map on each side (1 = 64 × 43 cm). New maps only. Higher → a much larger world to explore; rocks scale with area.',
      'Tamaño del mapa como múltiplo del mapa base por lado (1 = 64 × 43 cm). Solo mapas nuevos. Más alto → un mundo mucho más grande para explorar; las rocas crecen con el área.',
    ],
    'Map objects.pools': [
      'Ponds when generating a map: the first near where she’s born, the rest anywhere. Higher → water is easy to find; lower → a single source to remember.',
      'Estanques al generar un mapa: el primero cerca de donde nace, el resto en cualquier lugar. Más alto → el agua es fácil de encontrar; más bajo → una sola fuente que recordar.',
    ],
    'Map objects.species': [
      'Above 0, new maps get their own hidden chemistry and this many wild species, one tree each, which she must learn to tell apart. 0 → classic map.',
      'Mayor que 0: los mapas nuevos tienen su propia química oculta y esta cantidad de especies silvestres, un árbol cada una, que debe aprender a distinguir. 0 → mapa clásico.',
    ],
    'Map objects.treeMinNestDistance': [
      'Closest a generated tree can be to the nest (px). Higher → longer trips for food; lower → food can be near home. Keep it below the maximum.',
      'Lo más cerca del nido que puede quedar un árbol generado (px). Más alto → viajes más largos por comida; más bajo → la comida puede estar cerca de casa. Debe ser menor que el máximo.',
    ],
    'Map objects.treeMaxNestDistance': [
      'Farthest a generated tree can be from the nest (px). Higher → trees can land far, risking hunger on the way; lower → trees stay within easy reach.',
      'Lo más lejos del nido que puede quedar un árbol generado (px). Más alto → los árboles pueden quedar lejos, con riesgo de hambre en el camino; más bajo → quedan a mano.',
    ],
    'Map objects.rocks': [
      'Rocks when generating a map (per base map area, times density). Higher → a cluttered map with more detours; lower → open ground.',
      'Rocas al generar un mapa (por área del mapa base, por la densidad). Más alto → mapa recargado con más rodeos; más bajo → terreno despejado.',
    ],
    'Map objects.density': [
      'Multiplier on the number of rocks in new maps. Higher → more obstacles; lower → a more open map.',
      'Multiplicador del número de rocas en mapas nuevos. Más alto → más obstáculos; más bajo → un mapa más abierto.',
    ],
    'Map objects.hazards': [
      'New maps only. On → mud patches that slow whoever crosses them are placed; off → no mud.',
      'Solo mapas nuevos. Encendido → se colocan zonas de barro que frenan a quien las cruce; apagado → sin barro.',
    ],
    'Map objects.mudPatches': [
      'Mud patches in new maps. Needs Hazard terrain on. Higher → more slow ground to avoid; lower → fewer traps; 0 → none.',
      'Zonas de barro en mapas nuevos. Requiere Terreno peligroso encendido. Más alto → más terreno lento que evitar; más bajo → menos trampas; 0 → ninguna.',
    ],
    'Map objects.inside': [
      'Places every tree and pond around a nest wholly inside the map, on new maps. On → no tree or pond falls off the edge where she could see it but never reach it; off → maps drawn as the preregistered studies drew them, number for number.',
      'Coloca cada árbol y estanque alrededor de un nido entero dentro del mapa, en mapas nuevos. Encendido → ningún árbol ni estanque queda fuera del borde, donde podría verlo pero nunca alcanzarlo; apagado → mapas dibujados como en los estudios preregistrados, número por número.',
    ],
    'Map objects.foodVariety': [
      'Multiplier on the number of trees in new classic maps, spread over a wider arc around the nest. Higher → more trees in more directions; lower → fewer trees. No effect with wild species.',
      'Multiplicador del número de árboles en mapas clásicos nuevos, repartidos en un arco más amplio alrededor del nido. Más alto → más árboles en más direcciones; más bajo → menos árboles. Sin efecto con especies silvestres.',
    ],
  },
};
