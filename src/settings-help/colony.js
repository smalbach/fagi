// Help shown under each setting (settings.js): what it means and what changing it does.
export default {
  groups: {
    'Individual variation': ['No two Fagis are born alike: each carries her own multiplier for speed, reserves, thirst, senses and more. With heritability, the same world pushes the colony’s traits one way (selection). The game has it on; research runs keep everyone alike.', 'No hay dos Fagis iguales: cada una trae su propio multiplicador de velocidad, reservas, sed, sentidos y más. Con heredabilidad, el mismo mundo empuja los rasgos de la colonia en una dirección (selección). El juego lo trae encendido; las corridas de investigación, a todas iguales.'],
    'Colony (new sessions)': [
      'How many sisters share Fagi’s nest and pantry, and what they learn from each other. Read when a new session starts.',
      'Cuántas hermanas comparten el nido y la despensa de Fagi, y qué aprenden unas de otras. Se lee al empezar una sesión nueva.',
    ],
    'Colonies': [
      'More than one nest on the map, each with its own brood and pantry, competing for the same fruit. A thriving colony refounds emptied nests.',
      'Más de un nido en el mapa, cada uno con su cría y su despensa, compitiendo por la misma fruta. Una colonia próspera refunda nidos vacíos.',
    ],
    'Carrying and nest': [
      'When she carries fruit home instead of eating it, how big the pantry gets and how cheap resting in the nest is.',
      'Cuándo lleva la fruta al nido en vez de comerla, cuánto crece la despensa y qué tan barato es descansar en el nido.',
    ],
    'Own pheromone': [
      'The trail she lays while carrying food home. She is born not knowing it is useful and learns whether following it leads to food.',
      'El rastro que deja al cargar comida al nido. Nace sin saber que sirve y aprende si seguirlo la lleva a comida.',
    ],
    'Larder': [
      'A nest with limited room, and a pantry she predicts between visits instead of remembering it as she last saw it.',
      'Un nido con espacio limitado, y una despensa que ella predice entre visitas en vez de recordarla como la vio por última vez.',
    ],
    'Life and breeding': [
      'Egg → juvenile → adult → old age → death, and a population that breeds inside the world. Times are game seconds (180 s ≈ one day).',
      'Huevo → juvenil → adulta → vejez → muerte, y una población que se cría dentro del mundo. Tiempos en segundos de juego (180 s ≈ un día).',
    ],
    'Inheritance': [
      'What a newborn gets from her elders: rules and habits taught (culture) and innate biases passed on with mutation (genes).',
      'Lo que recibe una cría de sus mayores: reglas y hábitos enseñados (cultura) y sesgos innatos transmitidos con mutación (genes).',
    ],
    'Evolving body': [
      'Inherited organs, each a multiplier around 1, with what they give and what they cost. Needs Life and breeding on to evolve at all.',
      'Órganos heredados, cada uno un multiplicador alrededor de 1, con lo que dan y lo que cuestan. Necesita Vida y crianza encendida para evolucionar.',
    ],
  },
  fields: {
    'Individual variation.founders': ['On → each Fagi of the first generation is born with her own draw of every trait; off → founders are all the species’ standard. Applies to new sessions and new founders.', 'Encendido → cada Fagi de la primera generación nace con su propio sorteo de cada rasgo; apagado → las fundadoras son todas el estándar de la especie. Se aplica en sesiones nuevas y fundadoras nuevas.'],
    'Individual variation.births': ['On → each newborn gets her traits from her parents (see Heritability) plus a fresh draw; off → newborns are born standard, and variation fades from the colony.', 'Encendido → cada cría toma sus rasgos de sus padres (ver Heredabilidad) más un sorteo nuevo; apagado → las crías nacen estándar y la variación desaparece de la colonia.'],
    'Individual variation.spread': ['How different individuals are: the typical gap from the species’ value, drawn evenly up and down. Higher → very unequal Fagis, stronger selection; lower → nearly alike; 0 → everyone standard.', 'Qué tan distintos son los individuos: la diferencia típica respecto al valor de la especie, igual de probable hacia arriba que hacia abajo. Más alto → Fagis muy desiguales y selección más fuerte; más bajo → casi iguales; 0 → todas estándar.'],
    'Individual variation.limit': ['The furthest any trait may be from the standard, either way. Higher → rare extreme individuals possible; lower → variation stays modest even with a big spread.', 'Lo más lejos que puede estar un rasgo del estándar, en cualquier dirección. Más alto → posibles individuos extremos; más bajo → la variación se mantiene moderada aunque la diferencia típica sea grande.'],
    'Individual variation.heritability': ['How much a newborn’s trait comes from her parents’ average; the rest is a fresh draw. Higher → traits that help survive spread and the colony drifts in one direction; 0 → every birth is a new lottery and nothing accumulates.', 'Cuánto del rasgo de una cría viene del promedio de sus padres; el resto es un sorteo nuevo. Más alto → los rasgos que ayudan a sobrevivir se extienden y la colonia deriva en una dirección; 0 → cada nacimiento es una lotería nueva y nada se acumula.'],
    'Individual variation.weight.speed': ['How much individuals differ in how fast she walks, as a multiple of the typical gap. Higher → faster ones reach food sooner but some lag far behind; 0 → everyone the same in this trait.', 'Cuánto difieren los individuos en qué tan rápido camina, como múltiplo de la diferencia típica. Más alto → las rápidas llegan antes a la comida, pero otras quedan muy atrás; 0 → todas iguales en este rasgo.'],
    'Individual variation.weight.energyMax': ['How much individuals differ in her energy reserves, as a multiple of the typical gap. Higher → some last much longer before resting, others tire early; 0 → everyone the same in this trait.', 'Cuánto difieren los individuos en sus reservas de energía, como múltiplo de la diferencia típica. Más alto → unas aguantan mucho más sin descansar, otras se cansan pronto; 0 → todas iguales en este rasgo.'],
    'Individual variation.weight.metabolism': ['How much individuals differ in how fast she burns food (hunger and the energy walking costs), as a multiple of the typical gap. Higher → some starve sooner, others go long on little; 0 → everyone the same in this trait.', 'Cuánto difieren los individuos en qué tan rápido quema la comida (hambre y energía al caminar), como múltiplo de la diferencia típica. Más alto → unas pasan hambre antes, otras aguantan mucho con poco; 0 → todas iguales en este rasgo.'],
    'Individual variation.weight.thirst': ['How much individuals differ in how fast she gets thirsty, as a multiple of the typical gap. Higher → some must stay near water, others can roam far; 0 → everyone the same in this trait.', 'Cuánto difieren los individuos en qué tan rápido le da sed, como múltiplo de la diferencia típica. Más alto → unas deben quedarse cerca del agua, otras pueden alejarse; 0 → todas iguales en este rasgo.'],
    'Individual variation.weight.insulation': ['How much individuals differ in how slowly heat and cold reach her body, as a multiple of the typical gap. Higher → some bear a cold night or a hot noon, others suffer them; 0 → everyone the same in this trait.', 'Cuánto difieren los individuos en qué tan despacio le llegan el calor y el frío, como múltiplo de la diferencia típica. Más alto → unas soportan una noche fría o un mediodía caluroso, otras los sufren; 0 → todas iguales en este rasgo.'],
    'Individual variation.weight.view': ['How much individuals differ in how far she sees, as a multiple of the typical gap. Higher → some spot food and danger from far, others nearly bump into them; 0 → everyone the same in this trait.', 'Cuánto difieren los individuos en hasta dónde ve, como múltiplo de la diferencia típica. Más alto → unas ven comida y peligros de lejos, otras casi se los topan; 0 → todas iguales en este rasgo.'],
    'Individual variation.weight.smell': ['How much individuals differ in how keen her smell is, as a multiple of the typical gap. Higher → some follow faint scents from far, others need to be close; 0 → everyone the same in this trait.', 'Cuánto difieren los individuos en qué tan fino es su olfato, como múltiplo de la diferencia típica. Más alto → unas siguen olores débiles desde lejos, otras necesitan estar cerca; 0 → todas iguales en este rasgo.'],
    'Individual variation.weight.memory': ['How much individuals differ in how slowly she forgets what she learned, as a multiple of the typical gap. Higher → some keep lessons for long, others relearn often; 0 → everyone the same in this trait.', 'Cuánto difieren los individuos en qué tan despacio olvida lo aprendido, como múltiplo de la diferencia típica. Más alto → unas conservan lo aprendido mucho tiempo, otras deben reaprender; 0 → todas iguales en este rasgo.'],
    'Individual variation.weight.tolerance': ['How much individuals differ in how well she stands poison, as a multiple of the typical gap. Higher → some survive a bad bite better, others are hurt more; 0 → everyone the same in this trait.', 'Cuánto difieren los individuos en qué tanto resiste el veneno, como múltiplo de la diferencia típica. Más alto → unas sobreviven mejor a un mal bocado, otras sufren más; 0 → todas iguales en este rasgo.'],
    'Individual variation.weight.life': ['How much individuals differ in how long she lives (needs Life cycle on), as a multiple of the typical gap. Higher → some live and breed longer, others die young; 0 → everyone the same in this trait.', 'Cuánto difieren los individuos en cuánto vive (necesita Ciclo de vida encendido), como múltiplo de la diferencia típica. Más alto → unas viven y crían más tiempo, otras mueren jóvenes; 0 → todas iguales en este rasgo.'],
    // Colony (new sessions)
    'Colony (new sessions).size': [
      'How many individuals start in the colony; 1 is Fagi alone. Higher → more sisters sharing food, trail and knowledge, but more mouths to feed. New sessions only.',
      'Cuántos individuos empiezan en la colonia; 1 es Fagi sola. Más alto → más hermanas que comparten comida, rastro y saber, pero más bocas que alimentar. Solo sesiones nuevas.',
    ],
    'Colony (new sessions).share': [
      'Trophallaxis: sisters who meet in the nest tell each other their rules. On → what one learns spreads through the colony; off → each learns only for herself.',
      'Trofalaxia: las hermanas que se encuentran en el nido se cuentan sus reglas. Encendido → lo que una aprende se extiende por la colonia; apagado → cada una aprende sola.',
    ],
    'Colony (new sessions).touch': [
      'How close (px) two sisters in the nest must be to exchange rules; 0 = anywhere in the nest. Higher → easier to meet; lower → they must almost touch, so exchanges are rarer.',
      'Qué tan cerca (px) deben estar dos hermanas en el nido para intercambiar reglas; 0 = en cualquier parte del nido. Más alto → se encuentran más fácil; más bajo → casi deben tocarse y los intercambios son más raros.',
    ],
    'Colony (new sessions).enabled': [
      'Emergent castes: each sister grows an affinity for the tasks she does (foraging, scouting, nursing, patrolling). On → a division of labor appears; off → all behave alike.',
      'Castas emergentes: cada hermana toma afinidad por las tareas que hace (forrajear, explorar, cuidar, patrullar). Encendido → aparece una división del trabajo; apagado → todas actúan igual.',
    ],
    'Colony (new sessions).cultureProgram': [
      'Elders also pass the program lines they wrote themselves (and haven’t retired) to juveniles. On → self-written code spreads down generations; off → each juvenile writes her own.',
      'Las veteranas también pasan a las juveniles las líneas de programa que escribieron ellas mismas (y no retiraron). Encendido → el código propio se transmite entre generaciones; apagado → cada juvenil escribe el suyo.',
    ],
    'Colony (new sessions).observe': [
      'How much watching a sister eat teaches, as a fraction of eating it herself; 0 = off. Higher → she learns faster from others’ bites, mistakes included; lower → she relies on her own.',
      'Cuánto enseña ver comer a una hermana, como fracción de comerlo ella misma; 0 = apagado. Más alto → aprende más rápido de los bocados ajenos, errores incluidos; más bajo → depende de los suyos.',
    ],
    'Colony (new sessions).trust': [
      'A rule told is trusted this fraction of the teller’s own trust. Higher → told rules weigh almost like lived ones; lower → she keeps them as hints until she checks them.',
      'Una regla contada se cree esta fracción de lo que la cree quien la cuenta. Más alto → las reglas contadas pesan casi como las vividas; más bajo → las toma como pistas hasta comprobarlas.',
    ],
    'Colony (new sessions).format': [
      'What sisters pass on: whole rules, only verdicts about each fruit (“don’t eat the red drop”), or rules with the bites behind them so the receiver weighs the evidence herself.',
      'Qué se pasan las hermanas: reglas enteras, solo veredictos sobre cada fruta (“no comas la gota roja”), o reglas con los bocados que las respaldan para que quien recibe pese la evidencia.',
    ],
    'Colony (new sessions).topic': [
      'Which rules are passed on: everything, or only rules about eating. Only food → less noise but nothing learned about water, danger or shelter spreads.',
      'Qué reglas se pasan: todo, o solo las reglas sobre comer. Solo comida → menos ruido, pero no se transmite nada sobre agua, peligro o refugio.',
    ],
    'Colony (new sessions).budget': [
      'Cap on items passed in one exchange (a rule, a verdict or a bite each count one); 0 = no cap. With a cap, the most trusted go first. Lower → knowledge spreads more slowly.',
      'Tope de cosas que se pasan en un intercambio (una regla, un veredicto o un bocado cuentan uno); 0 = sin tope. Con tope, van primero las más confiables. Más bajo → el saber se extiende más lento.',
    ],
    'Colony (new sessions).reinforceRate': [
      'How much each successful turn at a task strengthens her affinity for it. Higher → castes form fast and rigidly; lower → specialization is slow. Needs castes on.',
      'Cuánto refuerza su afinidad por una tarea cada turno exitoso en ella. Más alto → las castas se forman rápido y rígidas; más bajo → la especialización es lenta. Necesita las castas encendidas.',
    ],
    'Colony (new sessions).decayRate': [
      'How fast, per second, an affinity fades while she does something else. Higher → roles stay flexible and switch easily; lower → a role sticks long after it’s needed. Needs castes on.',
      'Qué tan rápido, por segundo, se pierde una afinidad mientras hace otra cosa. Más alto → los roles son flexibles y cambian fácil; más bajo → un rol persiste aunque ya no haga falta. Necesita las castas encendidas.',
    ],

    // Colonies
    'Day and night.colonies.count': [
      'Nests on the map, each its own colony; 1 = one colony. Higher → colonies compete for the same fruit and the thriving ones spread. Applies to new maps.',
      'Nidos en el mapa, cada uno su propia colonia; 1 = una colonia. Más alto → las colonias compiten por la misma fruta y las prósperas se extienden. Se aplica a mapas nuevos.',
    ],
    'Colonies.founders': [
      'How many founders each nest beyond the first starts with. Higher → further colonies start stronger; lower → they are fragile and may die out early.',
      'Con cuántas fundadoras empieza cada nido además del primero. Más alto → las colonias adicionales arrancan más fuertes; más bajo → son frágiles y pueden extinguirse pronto.',
    ],
    'Colonies.spacing': [
      'Least distance in px between two nests on a new map. Higher → colonies forage apart and compete less; lower → they share ground and fight over the same fruit.',
      'Distancia mínima en px entre dos nidos en un mapa nuevo. Más alto → las colonias forrajean separadas y compiten menos; más bajo → comparten terreno y se disputan la misma fruta.',
    ],
    'Colonies.foundAt': [
      'How full a colony must be (share of the nest capacity) before it sends a pair to refound an empty nest. Higher → only crowded colonies spread; lower → they spread early.',
      'Qué tan llena debe estar una colonia (fracción de la capacidad del nido) para enviar una pareja a refundar un nido vacío. Más alto → solo se expanden las muy llenas; más bajo → se expanden pronto.',
    ],
    'Colonies.every': [
      'Seconds between a colony’s looks for an empty nest to refound. Higher → empty nests stay empty longer; lower → they are retaken quickly.',
      'Segundos entre búsquedas de una colonia de un nido vacío que refundar. Más alto → los nidos vacíos tardan más en ocuparse; más bajo → se recuperan rápido.',
    ],
    'Colonies.from': [
      'Which colony refounds an empty nest, among those full enough. Nearest → the neighbours spread, as in nature, and far habitats mix less; fullest → the most crowded colony anywhere sends the pair.',
      'Qué colonia refunda un nido vacío, entre las bastante llenas. La más cercana → se expanden las vecinas, como en la naturaleza, y los hábitats lejanos se mezclan menos; la más llena → la colonia más poblada, esté donde esté, envía la pareja.',
    ],

    // Carrying and nest
    'Carrying and nest.eatBelow': [
      'Hunger above which she eats a fruit on the spot instead of carrying it home. Higher → she carries more and fills the pantry; lower → she eats what she finds and stores less.',
      'Hambre a partir de la cual se come la fruta en el lugar en vez de llevarla al nido. Más alto → carga más y llena la despensa; más bajo → se come lo que encuentra y guarda menos.',
    ],
    'Carrying and nest.full': [
      'Stored items at which the pantry counts as done: she stops gathering and turns to exploring. Higher → bigger reserves, more trips; lower → less stock, more free time.',
      'Reservas con las que la despensa se da por hecha: deja de recolectar y se pone a explorar. Más alto → más reservas, más viajes; más bajo → menos reservas, más tiempo libre.',
    ],
    'Carrying and nest.keepFactor': [
      'Inside the nest, food lasts this many times longer than outside, then spoils away. Higher → stores keep for long; lower → stored food rots almost as fast as in the sun.',
      'Dentro del nido la comida dura estas veces más que afuera, y luego se echa a perder. Más alto → lo guardado se conserva mucho; más bajo → se pudre casi tan rápido como al sol.',
    ],
    'Carrying and nest.restHunger': [
      'Hunger she builds sleeping in the nest, compared to being outside (×). Higher → resting costs almost as much as walking; lower → sleeping at home saves food.',
      'Hambre que acumula durmiendo en el nido, comparada con estar afuera (×). Más alto → descansar cuesta casi como caminar; más bajo → dormir en casa ahorra comida.',
    ],
    'Carrying and nest.restThirst': [
      'Thirst she builds sleeping in the nest, compared to outside (×); the nest air is humid. Higher → she wakes thirsty; lower → she barely loses water at rest.',
      'Sed que acumula durmiendo en el nido, comparada con afuera (×); el aire del nido es húmedo. Más alto → despierta con sed; más bajo → casi no pierde agua descansando.',
    ],

    // Own pheromone
    'Own pheromone.life': [
      'Seconds until a pheromone mark evaporates. Higher → trails last and can lead to food long gone; lower → only fresh trails remain.',
      'Segundos hasta que una marca de feromona se evapora. Más alto → los rastros duran y pueden llevar a comida que ya no está; más bajo → solo quedan rastros frescos.',
    ],
    'Own pheromone.every': [
      'Seconds between marks while she carries food. Lower → a dense, continuous trail; higher → sparse dots that are easy to lose.',
      'Segundos entre marcas mientras carga comida. Más bajo → un rastro denso y continuo; más alto → puntos sueltos fáciles de perder.',
    ],
    'Own pheromone.sense': [
      'Distance in px at which she detects a mark (what her antennae reach). Higher → she picks up trails from afar; lower → she must walk right over them.',
      'Distancia en px a la que detecta una marca (lo que alcanzan sus antenas). Más alto → capta rastros de lejos; más bajo → debe pasar justo encima.',
    ],

    // Larder
    'Larder.enabled': [
      'The nest has limited room, and she predicts the pantry between visits. On → a full nest makes her decide what to do with her load; off → it takes all she brings.',
      'El nido tiene espacio limitado, y ella predice la despensa entre visitas. Encendido → con el nido lleno debe decidir qué hacer con su carga; apagado → cabe todo lo que trae.',
    ],
    'Larder.capacity': [
      'Rations the nest holds. Higher → more room for reserves; lower → the nest fills fast and she must often eat or leave what she carries. Needs Larder on.',
      'Raciones que caben en el nido. Más alto → más espacio para reservas; más bajo → se llena rápido y a menudo debe comerse o dejar lo que carga. Necesita la Despensa encendida.',
    ],
    'Larder.eatIfHunger': [
      'Hunger (fraction) from which she eats a load that doesn’t fit in a full nest; below it, she leaves it at the door. Higher → less eating, more waste; lower → she eats it more often.',
      'Hambre (fracción) desde la que se come la carga que no cabe en el nido lleno; por debajo, la deja en la puerta. Más alto → come menos y se desperdicia más; más bajo → se la come más a menudo.',
    ],
    'Larder.learn': [
      'She learns how fast the pantry empties and predicts it between visits. On → she learns from the surprise when she looks; off → she remembers it as she last saw it.',
      'Aprende a qué ritmo se vacía la despensa y la predice entre visitas. Encendido → aprende de la sorpresa al mirarla; apagado → la recuerda como la vio por última vez.',
    ],

    // Life and breeding
    'Life and breeding.enabled': [
      'Life cycle and breeding: individuals are born, grow, age, mate and die. On → the population changes and evolves; off → the same individuals live on.',
      'Ciclo de vida y crianza: los individuos nacen, crecen, envejecen, se aparean y mueren. Encendido → la población cambia y evoluciona; apagado → viven siempre los mismos.',
    ],
    'Life and breeding.founders': [
      'How many adults (both sexes) the population starts with. Higher → a sturdier start with more variety; lower → a fragile population that may die out. New sessions only.',
      'Con cuántos adultos (de ambos sexos) empieza la población. Más alto → un inicio más robusto y variado; más bajo → una población frágil que puede extinguirse. Solo sesiones nuevas.',
    ],
    'Life and breeding.maxPopulation': [
      'How many a nest holds, eggs included; breeding stops at this ceiling. Higher → bigger colonies that need more food; lower → small colonies.',
      'Cuántos caben en un nido, huevos incluidos; la cría se detiene en este tope. Más alto → colonias más grandes que necesitan más comida; más bajo → colonias pequeñas.',
    ],
    'Life and breeding.adultAt': [
      'Age in seconds at which a juvenile becomes adult and may breed. Higher → a longer, slower youth and slower generations; lower → they grow up and breed sooner.',
      'Edad en segundos a la que una juvenil se hace adulta y puede criar. Más alto → una juventud más larga y generaciones más lentas; más bajo → crecen y crían antes.',
    ],
    'Life and breeding.lifespan': [
      'Mean age in seconds at which one dies of old age. Higher → long lives and slow turnover; lower → fast generations, so evolution moves quicker.',
      'Edad media en segundos a la que se muere de vejez. Más alto → vidas largas y poco recambio; más bajo → generaciones rápidas, y la evolución avanza más rápido.',
    ],
    'Life and breeding.lifespanSpread': [
      'How much each individual’s lifespan varies around the mean (± fraction). Higher → some die young and some live long; 0 → all die at the same age.',
      'Cuánto varía la esperanza de vida de cada individuo alrededor de la media (± fracción). Más alto → unos mueren jóvenes y otros viven mucho; 0 → todos mueren a la misma edad.',
    ],
    'Life and breeding.senescentAt': [
      'Fraction of her life from which she is old: she slows down and her fertility fades. Higher → a short old age; lower → a long decline.',
      'Fracción de su vida desde la que es vieja: se vuelve más lenta y su fertilidad baja. Más alto → una vejez corta; más bajo → un declive largo.',
    ],
    'Life and breeding.juvenileSpeed': [
      'A juvenile’s speed compared to an adult’s (×). Higher → young ones move like adults; lower → they are slow and depend more on the colony.',
      'Velocidad de una juvenil comparada con una adulta (×). Más alto → las jóvenes se mueven como adultas; más bajo → son lentas y dependen más de la colonia.',
    ],
    'Life and breeding.oldSpeed': [
      'The speed she ends her life at (×), reached gradually through old age. Lower → old ones slow down a lot; 1 → age doesn’t slow her.',
      'Velocidad con la que termina su vida (×), a la que llega poco a poco en la vejez. Más bajo → las viejas se vuelven muy lentas; 1 → la edad no la frena.',
    ],
    'Life and breeding.mateEnergy': [
      'Energy (fraction of the maximum) both partners need to mate. Higher → only rested, healthy pairs breed; lower → they breed even when tired.',
      'Energía (fracción del máximo) que ambos necesitan para aparearse. Más alto → solo crían parejas descansadas y sanas; más bajo → crían aun cansados.',
    ],
    'Life and breeding.mateNeed': [
      'Both partners’ hunger and thirst (fraction) must be under this to mate. Higher → they breed even when needy; lower → only well-fed, watered pairs breed.',
      'El hambre y la sed (fracción) de ambos deben estar por debajo de esto para aparearse. Más alto → crían aun con necesidad; más bajo → solo crían parejas bien comidas y bebidas.',
    ],
    'Life and breeding.mateStock': [
      'Edible rations the pantry must hold before anyone breeds: no brood in lean times. Higher → breeding waits for good stores; 0 → they breed even with an empty pantry.',
      'Raciones comestibles que debe tener la despensa antes de criar: no hay cría en tiempos de escasez. Más alto → la cría espera buenas reservas; 0 → crían aun con la despensa vacía.',
    ],
    'Life and breeding.provision': [
      'Fruit (in typical weights) a mother must bring home herself since her last brood before laying again; 0 = off, the shared pantry is enough. Higher → only good foragers breed often.',
      'Fruta (en pesos típicos) que una madre debe traer ella misma desde su última cría antes de volver a poner; 0 = apagado, basta la despensa común. Más alto → solo las buenas recolectoras crían seguido.',
    ],
    'Life and breeding.mateCost': [
      'Energy mating costs each partner. Higher → mating is exhausting and less frequent; lower → it is nearly free.',
      'Energía que le cuesta aparearse a cada uno. Más alto → aparearse agota y es menos frecuente; más bajo → casi no cuesta.',
    ],
    'Life and breeding.eggCost': [
      'Hunger the female pays to lay an egg (the egg is made of her). Higher → laying leaves her hungry; lower → eggs are cheap.',
      'Hambre que le cuesta a la hembra poner un huevo (el huevo está hecho de ella). Más alto → poner la deja con hambre; más bajo → los huevos son baratos.',
    ],
    'Life and breeding.femaleRecover': [
      'Seconds before a female may mate again. Higher → fewer broods per mother; lower → mothers breed back to back.',
      'Segundos antes de que una hembra pueda volver a aparearse. Más alto → menos crías por madre; más bajo → las madres crían una tras otra.',
    ],
    'Life and breeding.maleRecover': [
      'Seconds before a male may mate again. Higher → each male fathers fewer broods; lower → a few males can father most of them.',
      'Segundos antes de que un macho pueda volver a aparearse. Más alto → cada macho engendra menos crías; más bajo → unos pocos machos pueden engendrar la mayoría.',
    ],
    'Life and breeding.incubation': [
      'Seconds an egg takes to hatch at a good temperature. Higher → slower population growth; lower → eggs hatch quickly.',
      'Segundos que tarda un huevo en eclosionar a buena temperatura. Más alto → la población crece más lento; más bajo → los huevos eclosionan pronto.',
    ],
    'Life and breeding.eggCold': [
      'Nest temperature (°C) below which an egg stops developing. Higher → cold nights stall broods; lower → eggs develop even in the cold. Needs Body temperature on.',
      'Temperatura del nido (°C) bajo la que un huevo deja de desarrollarse. Más alto → las noches frías detienen la cría; más bajo → se desarrollan aun con frío. Necesita Temperatura corporal encendida.',
    ],
    'Life and breeding.eggWarm': [
      'Nest temperature (°C) from which an egg develops at full pace; between the cold and this, it goes slower. Higher → eggs need a warm nest; lower → they thrive cooler. Needs Body temperature on.',
      'Temperatura del nido (°C) desde la que un huevo se desarrolla a pleno ritmo; entre el frío y esta, va más lento. Más alto → necesitan un nido cálido; más bajo → prosperan con menos calor. Necesita Temperatura corporal encendida.',
    ],
    'Life and breeding.eggStarve': [
      'Seconds a ready egg waits for a ration to hatch before it dies. Higher → broods survive lean spells; lower → an empty pantry quickly kills them.',
      'Segundos que un huevo listo espera una ración para eclosionar antes de morir. Más alto → la cría sobrevive épocas de escasez; más bajo → una despensa vacía la mata rápido.',
    ],
    'Life and breeding.inbreeding': [
      'Inbreeding depression, in lethal equivalents: an egg with inbreeding coefficient F hatches with chance e^(−value × F). 1.57 is the median of captive mammals (a full-sib egg hatches 2 times in 3). Higher → inbred eggs fail more and avoiding kin pays more; 0 → inbreeding costs nothing.',
      'Depresión por endogamia, en equivalentes letales: un huevo con coeficiente de endogamia F eclosiona con probabilidad e^(−valor × F). 1,57 es la mediana en mamíferos en cautiverio (un huevo de hermanos eclosiona 2 de cada 3 veces). Más alto → los huevos endogámicos fallan más y evitar parientes paga más; 0 → la endogamia no cuesta nada.',
    ],
    'Life and breeding.kinLimit': [
      'Relatedness (0–1) from which two don’t mate; 0.5 = parent and child or full siblings. Lower → stricter, avoids more inbreeding; higher → close kin may mate.',
      'Parentesco (0–1) desde el que dos no se aparean; 0,5 = padre e hija o hermanos completos. Más bajo → más estricto, evita más endogamia; más alto → parientes cercanos pueden aparearse.',
    ],
    'Life and breeding.gradual': [
      'On → fertility fades through old age and a crowded nest slows every brood before the ceiling; off → old ones never breed and only the nest capacity stops growth.',
      'Encendido → la fertilidad baja con la vejez y un nido lleno frena cada cría antes del tope; apagado → las viejas nunca crían y solo la capacidad del nido frena el crecimiento.',
    ],

    // Inheritance
    'Inheritance.culture': [
      'A surviving elder raises the newborn and teaches her her rules. On → knowledge carries across generations; off → each newborn starts knowing nothing.',
      'Una mayor que sobrevive cría a la recién nacida y le enseña sus reglas. Encendido → el saber pasa entre generaciones; apagado → cada cría empieza sin saber nada.',
    ],
    'Inheritance.cultureTrust': [
      'A rule taught is trusted this fraction of the elder’s own trust. Higher → the young follow taught rules almost as if lived; lower → they test them before relying on them.',
      'Una regla enseñada se cree esta fracción de lo que la cree la mayor. Más alto → las jóvenes siguen lo enseñado casi como lo vivido; más bajo → lo ponen a prueba antes de confiar.',
    ],
    'Inheritance.habits': [
      'Habits (her tuned behavior thresholds) are taught too, along with the rules. On → the young start with their elder’s boldness or caution; off → they start from factory habits. Needs culture on.',
      'Los hábitos (sus umbrales de conducta ajustados) también se enseñan, junto con las reglas. Encendido → las jóvenes empiezan con la audacia o cautela de su mayor; apagado → parten de los hábitos de fábrica. Necesita la cultura encendida.',
    ],
    'Inheritance.genes': [
      'Newborns carry innate biases about traits (e.g. a color seems safe), inherited with mutation. On → useful instincts can evolve; off → all are born neutral.',
      'Las crías nacen con sesgos innatos sobre rasgos (p. ej., un color parece seguro), heredados con mutación. Encendido → pueden evolucionar instintos útiles; apagado → todas nacen neutras.',
    ],
    'Inheritance.mutation': [
      'Spread of each bias’s random step from parent to child. Higher → more variety but good biases get lost; lower → stable inheritance, slow adaptation. Needs genes on.',
      'Amplitud del paso aleatorio de cada sesgo de padres a cría. Más alto → más variedad, pero se pierden sesgos buenos; más bajo → herencia estable, adaptación lenta. Necesita los genes encendidos.',
    ],
    'Inheritance.blend': [
      'On → each innate bias is the average of both parents’; off → each comes whole from one parent. Blending smooths out extremes and reduces variety.',
      'Encendido → cada sesgo innato es el promedio de los de ambos padres; apagado → cada uno viene entero de uno de ellos. Promediar suaviza los extremos y reduce la variedad.',
    ],
    'Inheritance.bodyMutation': [
      'Spread of each body gene’s step from parent to child (a multiplier around 1). Higher → bodies vary more between generations; lower → offspring resemble their parents.',
      'Amplitud del paso de cada gen del cuerpo de padres a cría (un multiplicador alrededor de 1). Más alto → los cuerpos varían más entre generaciones; más bajo → las crías se parecen a sus padres.',
    ],
    'Inheritance.sexual': [
      'On → each newborn has a mother and a father, each picked by fitness; off → one parent, mutated (clonal lineages). Needs Sexes with different bodies on.',
      'Encendido → cada cría tiene una madre y un padre, elegidos por aptitud; apagado → un solo progenitor, con mutación (linajes clonales). Necesita Sexos con cuerpos distintos encendido.',
    ],

    // Evolving body
    'Evolving body.enabled': [
      'Each individual inherits organs (brain, gut, muscle, eyes, antennae, size), each giving a benefit and costing energy. On → bodies can evolve; off → all have Fagi’s body.',
      'Cada individuo hereda órganos (cerebro, estómago, músculo, ojos, antenas, tamaño), cada uno con un beneficio y un costo de energía. Encendido → los cuerpos pueden evolucionar; apagado → todos tienen el cuerpo de Fagi.',
    ],
    'Evolving body.mutation': [
      'Spread of each organ gene’s step from parent to child, as a factor. Higher → bodies change fast but erratically; lower → slow, steady evolution.',
      'Amplitud del paso de cada gen de órgano de padres a cría, como factor. Más alto → los cuerpos cambian rápido pero de forma errática; más bajo → evolución lenta y estable.',
    ],
    'Evolving body.founders': [
      'How much the founders’ organs vary, so selection has something to choose from. Higher → a diverse start; 0 → all founders identical.',
      'Cuánto varían los órganos de las fundadoras, para que la selección tenga de dónde elegir. Más alto → un inicio diverso; 0 → todas las fundadoras idénticas.',
    ],
    'Evolving body.costPower': [
      'How much faster than linear an organ’s cost grows with its size. Higher → big organs quickly become unaffordable; lower → growing them stays cheap.',
      'Cuánto más rápido que lo lineal crece el costo de un órgano con su tamaño. Más alto → los órganos grandes pronto son impagables; más bajo → agrandarlos sigue siendo barato.',
    ],
    'Evolving body.brainLife': [
      'How much a bigger brain shortens life (an elasticity). Higher → big brains cost many years; 0 → brain size doesn’t affect lifespan.',
      'Cuánto acorta la vida un cerebro mayor (una elasticidad). Más alto → un cerebro grande cuesta muchos años; 0 → el tamaño del cerebro no afecta la vida.',
    ],
    'Evolving body.brainBrood': [
      'How much a bigger brain slows breeding: a longer rest between broods. Higher → brainy mothers breed much less; 0 → no effect.',
      'Cuánto frena la cría un cerebro mayor: un descanso más largo entre crías. Más alto → las madres con más cerebro crían mucho menos; 0 → sin efecto.',
    ],
    'Evolving body.fecundity': [
      'A bigger mother rests less between broods (∝ size to minus this). Higher → size pays off strongly in offspring; 0 → size doesn’t change breeding pace.',
      'Una madre mayor descansa menos entre crías (∝ tamaño elevado a menos esto). Más alto → el tamaño rinde mucho en crías; 0 → el tamaño no cambia el ritmo de cría.',
    ],
    'Evolving body.choice': [
      'How much a female prefers stronger males (muscle × size). Higher → strong males father most broods, pushing bodies bigger; 0 → she picks by condition only.',
      'Cuánto prefiere la hembra a los machos más fuertes (músculo × tamaño). Más alto → los fuertes engendran la mayoría de las crías y los cuerpos tienden a crecer; 0 → elige solo por condición.',
    ],
    'Evolving body.sizeSpeed': [
      'How much a heavier body slows her, per unit of muscle. Higher → big bodies are sluggish; 0 → size costs no speed.',
      'Cuánto la frena un cuerpo más pesado, por unidad de músculo. Más alto → los cuerpos grandes son torpes; 0 → el tamaño no cuesta velocidad.',
    ],
    'Evolving body.oxygen': [
      '°C her heat limit drops per unit of size above 1 (big bodies run short of oxygen in heat). Higher → big ones suffer heat much sooner; 0 → size doesn’t matter in heat.',
      '°C que baja su límite de calor por unidad de tamaño sobre 1 (los cuerpos grandes se quedan sin oxígeno con calor). Más alto → los grandes sufren el calor mucho antes; 0 → el tamaño no importa con calor.',
    ],
    'Evolving body.maternal.share': [
      'Maternal effects: how much what the mother lived, up to laying, shapes where her daughter’s organs start; 0 = off. Higher → broods follow their mother’s recent life; not passed on further.',
      'Efectos maternos: cuánto lo que vivió la madre hasta poner el huevo moldea dónde empiezan los órganos de su hija; 0 = apagado. Más alto → cada cría sigue la vida reciente de la madre; no se transmite más allá.',
    ],
    'Evolving body.maternal.fed': [
      'How much the mother’s hunger when laying sets the egg’s provisioning, hence the daughter’s size. Higher → hungry mothers have small daughters. Needs the maternal effect above 0.',
      'Cuánto fija el hambre de la madre al poner lo que lleva el huevo, y por tanto el tamaño de la hija. Más alto → madres hambrientas tienen hijas pequeñas. Necesita el efecto materno por encima de 0.',
    ],
    'Evolving body.plastic.enabled': [
      'What she lives moves her organs (never her genes): muscle grows with walking, the gut with eating, unused eyes or antennae waste. On → bodies adapt within a life; off → she keeps what she inherited.',
      'Lo que vive mueve sus órganos (nunca sus genes): el músculo crece al caminar, el estómago al comer, ojos o antenas sin uso se atrofian. Encendido → el cuerpo se adapta en vida; apagado → conserva lo heredado.',
    ],
    'Evolving body.inherit': [
      'What daughters inherit of what parents lived: only genes (Darwin); how much one can change, as a gene with a cost (Baldwin); or a mark of the parents’ life that fades each generation (epigenetic).',
      'Qué heredan las hijas de lo que vivieron sus padres: solo genes (Darwin); cuánto puede cambiar, como un gen con costo (Baldwin); o una marca de la vida de los padres que se diluye cada generación (epigenética).',
    ],
    'Evolving body.epigenetic.share': [
      'How much of what a parent lived reaches the mark passed to her daughters. Higher → daughters start close to their parents’ adapted body; lower → a faint mark. Needs the epigenetic option.',
      'Cuánto de lo que vivió un progenitor llega a la marca que pasa a sus hijas. Más alto → las hijas empiezan cerca del cuerpo adaptado de sus padres; más bajo → una marca débil. Necesita la opción epigenética.',
    ],
    'Evolving body.epigenetic.keep': [
      'Share of a parent’s own mark kept each generation (0.7 leaves about a quarter after four). Higher → marks last many generations; lower → they fade fast. Needs the epigenetic option.',
      'Parte de la marca propia de un progenitor que se conserva por generación (0,7 deja cerca de un cuarto tras cuatro). Más alto → las marcas duran muchas generaciones; más bajo → se diluyen rápido. Necesita la opción epigenética.',
    ],
  },
};
