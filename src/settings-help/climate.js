// Help shown under each setting (settings.js): what it means and what changing it does.
export default {
  groups: {
    'Day and night': [
      'The daily cycle of light and dark: how long a day lasts, when dawn and dusk fall and how dark and blind the night is.',
      'El ciclo diario de luz y oscuridad: cuánto dura un día, cuándo amanece y anochece, y qué tan oscura y ciega es la noche.',
    ],
    'Temperature': [
      'The air temperature over the day: its average, how far it swings between night and afternoon, and when it peaks.',
      'La temperatura del aire a lo largo del día: su media, cuánto oscila entre la noche y la tarde, y cuándo llega al máximo.',
    ],
    'Seasons': [
      'Years with a lean, cold winter and a generous summer, and optionally years that vary: hot years, unpredictable winters, fruit far from the nest.',
      'Años con un invierno escaso y frío y un verano generoso, y opcionalmente años que varían: años calurosos, inviernos impredecibles, fruta lejos del nido.',
    ],
    'Habitats': [
      'Each nest’s surroundings as a place of its own: a cold hollow, a sun-baked slope, poison growing close by. Each colony then lives, learns and inherits under its own conditions.',
      'El entorno de cada nido como un lugar propio: una hondonada fría, una ladera soleada, veneno creciendo cerca. Así cada colonia vive, aprende y hereda bajo sus propias condiciones.',
    ],
    'Wind': [
      'How the wind turns and changes direction. It carries smells, so it decides from where Fagi can catch a scent.',
      'Cómo gira el viento y cambia de dirección. Arrastra los olores, así que decide desde dónde Fagi puede captar un rastro.',
    ],
    'Rain': [
      'How often it rains, how long showers last, and the pressure drop that warns of them before the first drop.',
      'Cada cuánto llueve, cuánto duran los chaparrones y la bajada de presión que los anuncia antes de la primera gota.',
    ],
    'Rain: puddles and wash': [
      'The puddles each shower leaves (how many, how big, how fast they grow and dry) and how rain erases pheromone and scent trails.',
      'Los charcos que deja cada chaparrón (cuántos, de qué tamaño, qué tan rápido crecen y se secan) y cómo la lluvia borra la feromona y los rastros de olor.',
    ],
    'Rain: what it costs and teaches': [
      'What being caught out in the rain costs Fagi in energy, and how much she learns from rain and from puddles.',
      'Lo que le cuesta a Fagi en energía quedar a la intemperie bajo la lluvia, y cuánto aprende de la lluvia y de los charcos.',
    ],
    'Camera': [
      'How the view zooms and pans. Purely visual: it doesn’t change the simulation.',
      'Cómo se acerca y se desplaza la vista. Es solo visual: no cambia la simulación.',
    ],
    'External decision API': [
      'An optional external service Fagi can ask for what to do: when she asks, how much weight its answer gets and how long it lasts.',
      'Un servicio externo opcional al que Fagi puede preguntar qué hacer: cuándo pregunta, cuánto peso tiene su respuesta y cuánto dura.',
    ],
  },
  fields: {
    'Day and night.enabled': [
      'Turns the day-night cycle on. On → light, night blindness, sleep at night and a daily temperature wave; off → an endless day at her preferred temperature.',
      'Activa el ciclo de día y noche. Encendido → luz, ceguera nocturna, sueño de noche y una onda diaria de temperatura; apagado → un día eterno a su temperatura preferida.',
    ],
    'Day and night.seconds': [
      'Real seconds one full day lasts. Higher → longer days and nights, needs like thirst build up more within a day; lower → a hurried cycle. Needs Day and night on.',
      'Segundos reales que dura un día completo. Más alto → días y noches más largos, y necesidades como la sed se acumulan más en un día; más bajo → un ciclo apurado. Requiere Día y noche encendido.',
    ],
    'Day and night.start': [
      'Time of day at which a session starts (0.3 ≈ early morning). Higher → she starts later in the day, nearer to night; lower → she starts at night. Changing it mid-session shifts the clock.',
      'Hora del día a la que empieza una sesión (0,3 ≈ temprano en la mañana). Más alto → empieza más tarde, más cerca de la noche; más bajo → empieza de noche. Cambiarlo a mitad de sesión mueve el reloj.',
    ],
    'Day and night.dawn': [
      'Point of the day when light is halfway up. Higher → later dawn and longer nights; lower → earlier dawn and longer days.',
      'Momento del día en que la luz está a medio subir. Más alto → amanece más tarde y las noches son más largas; más bajo → amanece antes y los días son más largos.',
    ],
    'Day and night.dusk': [
      'Point of the day when light is halfway down. Higher → later dusk and longer days; lower → earlier dusk and longer nights.',
      'Momento del día en que la luz está a medio bajar. Más alto → anochece más tarde y los días son más largos; más bajo → anochece antes y las noches son más largas.',
    ],
    'Day and night.twilight': [
      'How long light takes to rise at dawn or fall at dusk, as a share of the day. Higher → slow, gradual twilights; lower → light switches almost at once.',
      'Cuánto tarda la luz en subir al amanecer o bajar al ocaso, como fracción del día. Más alto → crepúsculos lentos y graduales; más bajo → la luz cambia casi de golpe.',
    ],
    'Day and night.minLight': [
      'How much light is left at night (0 = pitch dark, 1 = like day). Higher → brighter nights; lower → darker nights. Shade only cools her while light is above this.',
      'Cuánta luz queda de noche (0 = oscuridad total, 1 = como de día). Más alto → noches más claras; más bajo → noches más oscuras. La sombra solo la refresca mientras hay más luz que esta.',
    ],
    'Day and night.nightSight': [
      'Fraction of her sight range left in the darkest night. Higher → she still sees far at night; lower → she is nearly blind and must rely on smell and memory.',
      'Fracción de su alcance de vista que le queda en la noche más oscura. Más alto → sigue viendo lejos de noche; más bajo → queda casi ciega y depende del olfato y la memoria.',
    ],
    'Day and night.mean': [
      'The day’s average air temperature, in °C. Higher → a hotter place; lower → a colder one. Without Day and night it is the steady air temperature.',
      'La temperatura media del aire en el día, en °C. Más alto → un lugar más caluroso; más bajo → uno más frío. Sin Día y noche es la temperatura fija del aire.',
    ],
    'Day and night.swing': [
      'Degrees the air rises above and falls below the average over the day. Higher → cold nights and hot afternoons; lower → an even temperature. Needs Day and night on.',
      'Grados que el aire sube y baja respecto de la media a lo largo del día. Más alto → noches frías y tardes calurosas; más bajo → una temperatura pareja. Requiere Día y noche encendido.',
    ],
    'Temperature.warmest': [
      'Point of the day when the air is hottest (0.6 ≈ mid-afternoon); the coldest is half a day later. Higher → heat peaks later; lower → earlier. Needs Day and night on.',
      'Momento del día en que el aire está más caliente (0,6 ≈ media tarde); el más frío llega medio día después. Más alto → el calor llega más tarde; más bajo → antes. Requiere Día y noche encendido.',
    ],
    'Day and night.seasons.enabled': [
      'Turns on years with seasons. On → winters where trees bear little and the air is colder, and summers with more fruit; off → every day of the year is the same.',
      'Activa años con estaciones. Encendido → inviernos en que los árboles dan poco y el aire es más frío, y veranos con más fruta; apagado → todos los días del año son iguales.',
    ],
    'Day and night.seasons.year': [
      'Real seconds one year lasts (3600 s ≈ 20 days). Higher → longer winters she must outlast on reserves; lower → seasons come and go quickly. Needs Seasons on.',
      'Segundos reales que dura un año (3600 s ≈ 20 días). Más alto → inviernos más largos que debe aguantar con sus reservas; más bajo → las estaciones pasan rápido. Requiere Estaciones encendido.',
    ],
    'Day and night.seasons.winter': [
      'Share of the year that winter takes. Higher → long, hard winters; lower → short ones; 0 → no winter at all. Needs Seasons on.',
      'Parte del año que ocupa el invierno. Más alto → inviernos largos y duros; más bajo → inviernos cortos; 0 → sin invierno. Requiere Estaciones encendido.',
    ],
    'Day and night.seasons.winterFruit': [
      'How much trees bear in deep winter, times their normal rate. Higher → winters with some food; lower → almost nothing, so she must store reserves or a pantry. Needs Seasons on.',
      'Cuánto dan los árboles en pleno invierno, por su ritmo normal. Más alto → inviernos con algo de comida; más bajo → casi nada, y tiene que guardar reservas o una despensa. Requiere Estaciones encendido.',
    ],
    'Day and night.seasons.summerFruit': [
      'How much trees bear outside winter, times their normal rate. Higher → abundant summers to build up reserves; lower → lean summers too. Needs Seasons on.',
      'Cuánto dan los árboles fuera del invierno, por su ritmo normal. Más alto → veranos abundantes para acumular reservas; más bajo → veranos también escasos. Requiere Estaciones encendido.',
    ],
    'Day and night.seasons.winterCold': [
      'Degrees (°C) deep winter takes off the air. Higher → harsh cold winters and leafless trees; lower → mild winters that are only lean. Needs Seasons on.',
      'Grados (°C) que el invierno más crudo le quita al aire. Más alto → inviernos muy fríos y árboles sin hojas; más bajo → inviernos suaves que solo son escasos. Requiere Estaciones encendido.',
    ],
    'Day and night.seasons.unpredictable': [
      'Whether winters vary from year to year. On → each year draws how hard, how long and when its winter comes, so last year can mislead; off → every winter is the same.',
      'Si los inviernos varían de un año a otro. Encendido → cada año sortea qué tan duro, largo y cuándo llega su invierno, así que el año anterior puede engañar; apagado → todos los inviernos son iguales.',
    ],
    'Day and night.seasons.hotYears': [
      'Share of years that come hot: a lean but mild winter and a scorching summer. Higher → more hot years, which favor small bodies; 0 → none. Needs Seasons on.',
      'Parte de los años que llegan calurosos: un invierno escaso pero templado y un verano abrasador. Más alto → más años calurosos, que favorecen cuerpos pequeños; 0 → ninguno. Requiere Estaciones encendido.',
    ],
    'Day and night.seasons.summerHeat': [
      'Degrees (°C) the heart of a hot year’s summer adds to the air. Higher → hot summers that push heat stress; lower → milder ones. Only matters with hot years above 0.',
      'Grados (°C) que el pleno verano de un año caluroso le suma al aire. Más alto → veranos que llevan al estrés por calor; más bajo → veranos más suaves. Solo cuenta con años calurosos por encima de 0.',
    ],
    'Day and night.seasons.persist': [
      'Chance a year is the same kind as the one before (hot or cold; fruit near or far). Higher → long predictable runs; lower → each year drawn afresh.',
      'Probabilidad de que un año sea del mismo tipo que el anterior (caluroso o frío; fruta cerca o lejos). Más alto → rachas largas y predecibles; más bajo → cada año se sortea de nuevo.',
    ],
    'Day and night.seasons.spread': [
      'How far one winter’s depth, length and timing may stray from the usual. Higher → wildly different winters; lower → nearly alike. Needs Every winter different on.',
      'Cuánto pueden alejarse de lo habitual la dureza, la duración y la fecha de un invierno. Más alto → inviernos muy distintos; más bajo → casi iguales. Requiere Cada invierno distinto encendido.',
    ],
    'Day and night.seasons.farYears': [
      'Share of years whose fruit grows on the trees far from the nest (the rest, on the near ones). Higher → more years where she must travel far to eat; 0 → off.',
      'Parte de los años en que la fruta crece en los árboles lejos del nido (el resto, en los cercanos). Más alto → más años en que tiene que ir lejos a comer; 0 → desactivado.',
    ],
    'Day and night.seasons.reachLow': [
      'In near/far years, what trees on the wrong side of the nest bear, times their rate. Higher → the difference barely matters; lower → those trees go almost bare. Needs far years above 0.',
      'En años de fruta cerca o lejos, lo que dan los árboles del lado equivocado, por su ritmo. Más alto → la diferencia casi no importa; más bajo → esos árboles quedan casi pelados. Requiere años con fruta lejos por encima de 0.',
    ],
    'Seasons.winterAt': [
      'Point of the year when winter is deepest (0.75 = three quarters in); summer peaks half a year away. Changing it moves winter earlier or later in the year. Needs Seasons on.',
      'Momento del año en que el invierno es más crudo (0,75 = a tres cuartos del año); el verano llega a su punto medio año después. Cambiarlo adelanta o atrasa el invierno. Requiere Estaciones encendido.',
    ],
    'Wind.turnRate': [
      'How fast the wind turns toward its new direction, in radians per second. Higher → it swings round quickly and scents shift often; lower → slow, steady turns.',
      'Qué tan rápido gira el viento hacia su nueva dirección, en radianes por segundo. Más alto → cambia rápido y los olores se desplazan seguido; más bajo → giros lentos y estables.',
    ],
    'Wind.swing': [
      'How far from its current heading the wind may pick its next direction, in radians. Higher → big unpredictable shifts; lower → it keeps blowing roughly the same way; 0 → fixed.',
      'Cuánto puede alejarse de su rumbo actual la siguiente dirección del viento, en radianes. Más alto → cambios grandes e impredecibles; más bajo → sopla más o menos hacia el mismo lado; 0 → fijo.',
    ],
    'Wind.changeEvery.min': [
      'Shortest wait, in seconds, before the wind picks a new direction. Higher → the wind stays put longer; lower → it may change very often.',
      'Espera más corta, en segundos, antes de que el viento elija una nueva dirección. Más alto → el viento se mantiene más tiempo; más bajo → puede cambiar muy seguido.',
    ],
    'Wind.changeEvery.max': [
      'Longest wait, in seconds, before the wind picks a new direction. Higher → long calm stretches are possible; lower → changes come regularly. Keep it above the minimum.',
      'Espera más larga, en segundos, antes de que el viento elija una nueva dirección. Más alto → puede haber rachas largas sin cambios; más bajo → los cambios llegan con regularidad. Mantenlo por encima del mínimo.',
    ],
    'Rain.every.min': [
      'Shortest dry spell, in seconds, between one shower and the next. Higher → rain is rarer; lower → showers can follow each other closely.',
      'Tiempo seco más corto, en segundos, entre un chaparrón y el siguiente. Más alto → llueve con menos frecuencia; más bajo → los chaparrones pueden seguirse muy de cerca.',
    ],
    'Rain.every.max': [
      'Longest dry spell, in seconds, between showers. Higher → long droughts are possible; lower → rain comes regularly. Keep it above the minimum.',
      'Tiempo seco más largo, en segundos, entre chaparrones. Más alto → puede haber sequías largas; más bajo → llueve con regularidad. Mantenlo por encima del mínimo.',
    ],
    'Rain.duration.min': [
      'Shortest a shower lasts, in seconds. Higher → every shower soaks her longer and leaves more water; lower → some showers are brief.',
      'Lo mínimo que dura un chaparrón, en segundos. Más alto → cada chaparrón la empapa más y deja más agua; más bajo → algunos chaparrones son breves.',
    ],
    'Rain.duration.max': [
      'Longest a shower lasts, in seconds. Higher → long downpours that erase trails and keep her sheltering; lower → showers stay short. Keep it above the minimum.',
      'Lo máximo que dura un chaparrón, en segundos. Más alto → aguaceros largos que borran rastros y la tienen refugiada; más bajo → chaparrones cortos. Mantenlo por encima del mínimo.',
    ],
    'Rain.front.min': [
      'Shortest warning before rain: seconds the air pressure drops before the first drop. Higher → she always has time to head home; lower → some showers catch her by surprise.',
      'Aviso más corto antes de la lluvia: segundos que baja la presión antes de la primera gota. Más alto → siempre tiene tiempo de volver al nido; más bajo → algunos chaparrones la toman por sorpresa.',
    ],
    'Rain.front.max': [
      'Longest warning before rain, in seconds of falling pressure. Higher → long, vague warnings; lower → short, sharp ones. Keep it above the minimum.',
      'Aviso más largo antes de la lluvia, en segundos de presión bajando. Más alto → avisos largos y vagos; más bajo → avisos cortos y claros. Mantenlo por encima del mínimo.',
    ],
    'Rain.recover': [
      'Seconds the air pressure takes to climb back to normal after rain stops. Higher → the “rain coming” signal lingers after a shower; lower → it clears at once.',
      'Segundos que tarda la presión en volver a lo normal cuando deja de llover. Más alto → la señal de “viene lluvia” se queda tras el chaparrón; más bajo → se despeja enseguida.',
    ],
    'Rain.puddles.min': [
      'Fewest puddles a shower leaves. Higher → every shower brings water to drink; lower → some leave none.',
      'Menor cantidad de charcos que deja un chaparrón. Más alto → cada chaparrón trae agua para beber; más bajo → algunos no dejan ninguno.',
    ],
    'Rain.puddles.max': [
      'Most puddles a shower leaves. Higher → rain can flood the map with water; lower → water stays scarce. Keep it above the minimum.',
      'Mayor cantidad de charcos que deja un chaparrón. Más alto → la lluvia puede llenar el mapa de agua; más bajo → el agua sigue escasa. Mantenlo por encima del mínimo.',
    ],
    'Rain.puddleRadius.0': [
      'Smallest size a new puddle starts at, in pixels of radius. Higher → bigger puddles that last longer; lower → small ones that dry fast.',
      'Tamaño mínimo con que empieza un charco nuevo, en píxeles de radio. Más alto → charcos más grandes que duran más; más bajo → charcos chicos que se secan rápido.',
    ],
    'Rain.puddleRadius.1': [
      'Largest size a new puddle starts at, in pixels of radius (it can grow a bit more while it rains). Higher → some big, long-lasting puddles; lower → all small. Keep it above the minimum.',
      'Tamaño máximo con que empieza un charco nuevo, en píxeles de radio (puede crecer algo más mientras llueve). Más alto → algunos charcos grandes y duraderos; más bajo → todos chicos. Mantenlo por encima del mínimo.',
    ],
    'Rain.grow': [
      'How fast puddles grow while it rains, in pixels of radius per second. Higher → showers swell puddles a lot; lower → puddles stay as they formed.',
      'Qué tan rápido crecen los charcos mientras llueve, en píxeles de radio por segundo. Más alto → los chaparrones los agrandan mucho; más bajo → quedan como se formaron.',
    ],
    'Rain.evaporate': [
      'How fast puddles shrink when it isn’t raining, in pixels of radius per second. Higher → puddles vanish quickly and she learns not to trust them; lower → they last a long time; 0 → never dry.',
      'Qué tan rápido se achican los charcos cuando no llueve, en píxeles de radio por segundo. Más alto → desaparecen rápido y ella aprende a no confiar en ellos; más bajo → duran mucho; 0 → nunca se secan.',
    ],
    'Rain.washPhero': [
      'How many times faster pheromone fades while it rains. Higher → a shower wipes trails out; lower → trails survive the rain; 1 → rain doesn’t affect them.',
      'Cuántas veces más rápido se desvanece la feromona mientras llueve. Más alto → un chaparrón borra los rastros; más bajo → los rastros sobreviven a la lluvia; 1 → la lluvia no los afecta.',
    ],
    'Rain.washScent': [
      'Seconds of rain it takes to wash away a whole scent trail. Higher → scent trails survive showers; lower → rain erases them almost at once.',
      'Segundos de lluvia que hacen falta para lavar un rastro de olor entero. Más alto → los rastros de olor sobreviven a los chaparrones; más bajo → la lluvia los borra casi enseguida.',
    ],
    'Rain.effort': [
      'Energy she burns out in the rain, times what walking costs. Higher → getting caught outside is costly and sheltering pays off; 1 → rain costs nothing extra.',
      'Energía que gasta a la intemperie bajo la lluvia, por lo que cuesta andar. Más alto → quedar afuera sale caro y refugiarse vale la pena; 1 → la lluvia no cuesta nada extra.',
    ],
    'Rain.sample': [
      'Seconds out in the rain that make up one full lesson about it. Higher → she needs long soakings to learn; lower → even a short wetting teaches her fully.',
      'Segundos bajo la lluvia que forman una lección completa sobre ella. Más alto → necesita mojarse mucho para aprender; más bajo → incluso mojarse un poco le enseña del todo.',
    ],
    'Rain.lesson': [
      'How much each lesson in the rain strengthens her wish to shelter when it rains. Higher → she quickly learns to stay home; lower → she learns slowly; 0 → only instinct.',
      'Cuánto refuerza cada lección bajo la lluvia sus ganas de refugiarse cuando llueve. Más alto → aprende rápido a quedarse en el nido; más bajo → aprende despacio; 0 → solo instinto.',
    ],
    'Rain.puddleLesson': [
      'How much finding water in a puddle raises her trust in puddles, or finding one dry lowers it. Higher → she quickly learns whether puddles are worth the trip; lower → slowly; 0 → never.',
      'Cuánto sube su confianza en los charcos al encontrar agua en uno, o cuánto baja al encontrarlo seco. Más alto → aprende rápido si vale la pena ir a un charco; más bajo → despacio; 0 → nunca.',
    ],
    'Camera.max': [
      'How far you can zoom in. Higher → you can get very close to Fagi; lower → the view stays wider.',
      'Cuánto puedes acercarte con el zoom. Más alto → puedes ver a Fagi muy de cerca; más bajo → la vista queda más amplia.',
    ],
    'Camera.step': [
      'How much each wheel notch (or + / − key) zooms. Higher → big, fast zoom jumps; lower → fine, smooth zooming.',
      'Cuánto acerca cada paso de la rueda (o tecla + / −). Más alto → saltos de zoom grandes y rápidos; más bajo → un zoom fino y suave.',
    ],
    'Camera.keysDown': [
      'How fast the view moves with the arrow keys, in pixels per second. Higher → quick panning; lower → slow, precise panning.',
      'Qué tan rápido se mueve la vista con las flechas, en píxeles por segundo. Más alto → desplazamiento rápido; más bajo → lento y preciso.',
    ],
    'External decision API.enabled': [
      'Whether Fagi asks the external decision API what to do. On → its answers become directives she follows; off → she decides by instinct and what she has learned alone.',
      'Si Fagi consulta a la API de decisión externa qué hacer. Encendido → sus respuestas se vuelven directivas que ella sigue; apagado → decide solo con su instinto y lo que aprendió.',
    ],
    'External decision API.authority': [
      'How much say the API’s directives have. Safe → instinct handles drinking, eating and danger first, and the directive comes after; Full → the directive comes first unless her life depends on something it doesn’t cover.',
      'Cuánto peso tienen las directivas de la API. Segura → el instinto se ocupa primero de beber, comer y el peligro, y la directiva viene después; Plena → la directiva va primero salvo que su vida dependa de algo que no cubre.',
    ],
    'External decision API.minInterval': [
      'Minimum seconds between two queries to the API. Higher → fewer calls, slower to react to news; lower → she asks more often, with more load on the service.',
      'Segundos mínimos entre dos consultas a la API. Más alto → menos llamadas y reacciona más lento a lo nuevo; más bajo → pregunta más seguido, con más carga para el servicio.',
    ],
    'External decision API.timeout': [
      'Seconds to wait for an API answer before giving up and going on by instinct. Higher → tolerates a slow service; lower → abandons slow answers sooner.',
      'Segundos que espera una respuesta de la API antes de rendirse y seguir por instinto. Más alto → tolera un servicio lento; más bajo → abandona antes las respuestas lentas.',
    ],
    'External decision API.maxTtl': [
      'Cap on how long any API directive can last, in seconds, whatever the API asks. Higher → long orders allowed; lower → directives always expire quickly and instinct takes back over.',
      'Tope de cuánto puede durar cualquier directiva de la API, en segundos, pida lo que pida la API. Más alto → se permiten órdenes largas; más bajo → las directivas siempre vencen rápido y vuelve a mandar el instinto.',
    ],
    'External decision API.ttl': [
      'Seconds a directive stays valid when the API doesn’t say how long. Higher → she sticks to orders longer; lower → they expire soon and she asks again. Capped by the maximum lifetime.',
      'Segundos que vale una directiva cuando la API no dice cuánto. Más alto → mantiene las órdenes más tiempo; más bajo → vencen pronto y vuelve a preguntar. Limitado por la duración máxima.',
    ],
    'External decision API.idleAfter': [
      'Seconds of just exploring before she asks the API for something better to do. Higher → she wanders longer on her own; lower → she asks as soon as she runs out of ideas.',
      'Segundos de solo explorar antes de pedirle a la API algo mejor que hacer. Más alto → vaga más tiempo por su cuenta; más bajo → pregunta en cuanto se queda sin ideas.',
    ],
    'Habitats.enabled': [
      'Gives each nest a habitat, dealt at random when a new map is made. On → the colonies live in different places (cold, hot, poison close by); off → every nest lives in the same world.',
      'Da a cada nido un hábitat, repartido al azar al crear un mapa nuevo. Encendido → las colonias viven en lugares distintos (frío, calor, veneno cerca); apagado → todos los nidos viven en el mismo mundo.',
    ],
    'Habitats.cold': [
      'Degrees added to the air and soil around the cold nest (negative = colder). The nest is dug in that soil, so its brood feels it too: raised cold, a juvenile grows bigger. Lower → harsher cold, more cold deaths and slower eggs; too low and the colony can’t hold on.',
      'Grados que se suman al aire y al suelo alrededor del nido frío (negativo = más frío). El nido está cavado en ese suelo, así que sus crías también lo sienten: criada con frío, una juvenil crece más grande. Más bajo → frío más duro, más muertes por frío y huevos más lentos; demasiado bajo y la colonia no se sostiene.',
    ],
    'Habitats.hot': [
      'Degrees added to the air and soil around the hot nest. Raised warm, a juvenile grows smaller, and a big body suffers heat sooner. Higher → hotter afternoons, more heat stress.',
      'Grados que se suman al aire y al suelo alrededor del nido caliente. Criada con calor, una juvenil crece más pequeña, y un cuerpo grande sufre antes el calor. Más alto → tardes más calurosas, más estrés por calor.',
    ],
    'Habitats.lean': [
      'What the trees nearest a lean nest bear, times their rate (poor soil). Only used if a nest is dealt the lean habitat. Lower → its colony must reach farther, shared trees.',
      'Lo que dan los árboles más cercanos a un nido pobre, por su ritmo (suelo pobre). Solo se usa si a un nido le toca el hábitat pobre. Más bajo → su colonia debe llegar a árboles más lejanos y compartidos.',
    ],
    'Habitats.toxic': [
      'Poisonous trees that grow close to the toxic nest, nearer than its good tree, on a new map. More → what is at hand is more often what harms; 0 → that nest is like any other.',
      'Árboles venenosos que crecen cerca del nido engañoso, más cerca que su árbol bueno, en un mapa nuevo. Más → lo que está a mano es más a menudo lo que daña; 0 → ese nido es como cualquier otro.',
    ],
  },
};
