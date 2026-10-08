// Help shown under each setting (settings.js): what it means and what changing it does.
export default {
  groups: {
    'Weight of fruit': [
      'How heavy and how hard each fruit is, and what that costs her: carrying it slows her and burns energy, and a fruit too hard for her gut feeds her less.',
      'Cuánto pesa y qué tan dura es cada fruta, y lo que eso le cuesta: cargarla la frena y gasta energía, y una fruta demasiado dura para su estómago la alimenta menos.',
    ],
    'Tastes': [
      'Gives fruit tastes (sweet, bitter, salty, spicy…) and hidden chemistry: she likes or dislikes bites, may spit them out, learns from taste and can need sodium.',
      'Da a la fruta sabores (dulce, amargo, salado, picante…) y química oculta: le gustan o disgustan los bocados, puede escupirlos, aprende del sabor y puede necesitar sodio.',
    ],
    'Food sources': [
      'Whether she must learn which trees are food sources, by seeing fruit lying around them, instead of knowing it from birth.',
      'Si debe aprender qué árboles son fuentes de comida, al ver fruta tirada a su alrededor, en vez de saberlo de nacimiento.',
    ],
  },
  fields: {
    'Day and night.load.enabled': [
      'Each fallen fruit gets a weight and a hardness. On → carrying slows her and costs energy by her strength, and hard fruit feeds a weak gut less; off → every fruit weighs and gives the same.',
      'Cada fruta caída recibe un peso y una dureza. Encendido → cargar la frena y le cuesta energía según su fuerza, y la fruta dura alimenta menos a un estómago débil; apagado → toda fruta pesa y da lo mismo.',
    ],
    'Weight of fruit.range.0': [
      'Lower end of fruit weight, × a typical fruit; weights are drawn between this and the heaviest when fruit falls. Lower → some fruit is very light and easy to carry. Needs fruit weight on.',
      'Extremo inferior del peso, × una fruta típica; el peso se sortea entre este y el más pesado al caer la fruta. Más bajo → hay frutas muy ligeras y fáciles de cargar. Requiere el peso de la fruta encendido.',
    ],
    'Weight of fruit.range.1': [
      'Upper end of fruit weight, × a typical fruit. Higher → some fruit is very heavy, slowing her and costing more energy to bring home; lower → loads are more even. Needs fruit weight on.',
      'Extremo superior del peso, × una fruta típica. Más alto → algunas frutas son muy pesadas, la frenan y le cuesta más energía llevarlas a casa; más bajo → cargas más parejas. Requiere el peso de la fruta encendido.',
    ],
    'Weight of fruit.hardRange.0': [
      'Lower end of fruit hardness, × a typical fruit. Lower → more fruit is soft enough for any gut to get all of it. Needs fruit weight on.',
      'Extremo inferior de la dureza, × una fruta típica. Más bajo → más frutas son lo bastante blandas para que cualquier estómago las aproveche enteras. Requiere el peso de la fruta encendido.',
    ],
    'Weight of fruit.hardRange.1': [
      'Upper end of fruit hardness, × a typical fruit. Higher → some fruit is far harder than her gut and feeds her much less; lower → hardness matters little. Needs fruit weight on.',
      'Extremo superior de la dureza, × una fruta típica. Más alto → algunas frutas son mucho más duras que su estómago y la alimentan mucho menos; más bajo → la dureza importa poco. Requiere el peso de la fruta encendido.',
    ],
    'Weight of fruit.slow': [
      'How much a load heavier than her strength slows her: speed × 1 / (1 + this × load). Higher → carrying heavy fruit makes her much slower; 0 → load never slows her.',
      'Cuánto la frena una carga mayor que su fuerza: velocidad × 1 / (1 + esto × carga). Más alto → cargar fruta pesada la vuelve mucho más lenta; 0 → la carga nunca la frena.',
    ],
    'Weight of fruit.effort': [
      'Extra energy she burns walking while loaded, per unit of load over her strength. Higher → hauling heavy fruit tires her much more; 0 → carrying is free.',
      'Energía extra que gasta al caminar cargada, por unidad de carga sobre su fuerza. Más alto → acarrear fruta pesada la cansa mucho más; 0 → cargar no cuesta nada.',
    ],
    'Weight of fruit.hardGain': [
      'Exponent of the loss when a fruit is harder than her gut: she gets × (gut / hardness)^this. Higher → hard fruit feeds her much less; 0 → hardness never matters.',
      'Exponente de la pérdida cuando una fruta es más dura que su estómago: obtiene × (estómago / dureza)^esto. Más alto → la fruta dura la alimenta mucho menos; 0 → la dureza nunca importa.',
    ],
    'Tastes.enabled': [
      'Fruit has tastes and a hidden chemistry (some species poisonous). On → she tastes each bite, may spit it out and learns from flavor; off → fruit has no taste at all.',
      'La fruta tiene sabores y una química oculta (algunas especies venenosas). Encendido → prueba cada bocado, puede escupirlo y aprende del sabor; apagado → la fruta no sabe a nada.',
    ],
    'Tastes.hedonic': [
      'How much a bite’s taste adds to how good or bad it feels right away, besides its effect on her body. Higher → taste drives what she likes more; 0 → only the body’s effect counts.',
      'Cuánto suma el sabor de un bocado a qué tan bueno o malo se siente al instante, además de su efecto en el cuerpo. Más alto → el sabor pesa más en lo que le gusta; 0 → solo cuenta el efecto en el cuerpo.',
    ],
    'Tastes.spitBelow': [
      'If she likes a bite less than this (−1 to 1), she spits it out, unless she is starving or knows the fruit is good. Higher → she is pickier and spits more; lower → she swallows almost anything.',
      'Si un bocado le gusta menos que esto (−1 a 1), lo escupe, salvo que esté hambrienta o sepa que la fruta es buena. Más alto → es más quisquillosa y escupe más; más bajo → traga casi cualquier cosa.',
    ],
    'Tastes.spitPortion': [
      'Share of a spat-out bite she still swallows. Higher → spitting protects her less but feeds her more and teaches more; 0 → a spat bite has no effect at all.',
      'Parte de un bocado escupido que igual traga. Más alto → escupir la protege menos pero la alimenta y le enseña más; 0 → un bocado escupido no tiene ningún efecto.',
    ],
    'Tastes.learnWeight': [
      'How fast what she learned about a fruit overrides her innate liking for its taste. Higher → experience quickly wins over instinct; lower → she keeps judging by born likes longer.',
      'Rapidez con que lo que aprendió de una fruta pisa su gusto innato por su sabor. Más alto → la experiencia vence rápido al instinto; más bajo → sigue juzgando más tiempo por sus gustos de nacimiento.',
    ],
    'Tastes.burn': [
      'Health a fully spicy bite takes (scaled by how spicy and how much she eats). Higher → spicy fruit hurts more; 0 → spice is harmless. Needs Health on.',
      'Salud que quita un bocado completamente picante (según lo picante y cuánto come). Más alto → la fruta picante lastima más; 0 → el picante es inofensivo. Requiere Salud encendida.',
    ],
    'Tastes.salience': [
      'How much more readily a taste takes the blame (or credit) for a bite than its look or smell (Garcia effect). Higher → she learns mostly from taste; 1 → taste and look count the same.',
      'Cuánto más fácil se lleva un sabor la culpa (o el mérito) de un bocado que su aspecto u olor (efecto Garcia). Más alto → aprende sobre todo del sabor; 1 → sabor y aspecto cuentan igual.',
    ],
    'Tastes.innate': [
      'Whether she is born liking some tastes (sweet, umami) and disliking others (bitter, spicy). On → instinct guides her first bites; off → she likes and dislikes nothing until she learns.',
      'Si nace con gusto por algunos sabores (dulce, umami) y aversión a otros (amargo, picante). Encendido → el instinto guía sus primeros bocados; apagado → nada le gusta ni le disgusta hasta que aprende.',
    ],
    'Tastes.learn': [
      'Whether tastes become cues she learns from, like color or smell. On → she links a taste with what the bite did; off → taste only acts at the mouth, through her innate liking.',
      'Si los sabores son señales de las que aprende, como el color o el olor. Encendido → asocia un sabor con lo que hizo el bocado; apagado → el sabor solo actúa en la boca, por su gusto innato.',
    ],
    'Tastes.salt': [
      'Sodium becomes a need of its own: it runs out over time and salty bites restore it. On → lacking salt she craves it and, very low, walks slower; off → no sodium need.',
      'El sodio pasa a ser una necesidad propia: se agota con el tiempo y los bocados salados lo reponen. Encendido → si le falta, ansía la sal y, muy bajo, camina más lento; apagado → no hay necesidad de sodio.',
    ],
    'Tastes.saltLoss': [
      'Sodium she loses per second (1 = full; the default empties in 900 s, about 5 days). Higher → she needs salt more often; 0 → sodium never runs out. Needs sodium need on.',
      'Sodio que pierde por segundo (1 = lleno; el valor de fábrica se vacía en 900 s, unos 5 días). Más alto → necesita sal más seguido; 0 → el sodio nunca se agota. Requiere el sodio como necesidad.',
    ],
    'Tastes.saltGain': [
      'Sodium a salty bite restores, × how salty it is. Higher → one salty fruit refills her; lower → she needs many salty bites. Needs sodium need on.',
      'Sodio que repone un bocado salado, × lo salado que es. Más alto → una fruta salada la llena; más bajo → necesita muchos bocados salados. Requiere el sodio como necesidad.',
    ],
    'Tastes.saltCraving': [
      'How much she comes to like salt when her sodium is empty (her liking rises toward this as it runs low). Higher → salt hunger pulls her strongly to salty fruit; lower → she barely seeks it.',
      'Cuánto llega a gustarle la sal con el sodio vacío (su gusto sube hacia esto a medida que se agota). Más alto → el hambre de sal la atrae con fuerza a la fruta salada; más bajo → apenas la busca.',
    ],
    'Tastes.saltWeak': [
      'Sodium level (1 = full) under which she walks 20% slower. Higher → lack of salt slows her sooner; 0 → it never slows her. Needs sodium need on.',
      'Nivel de sodio (1 = lleno) bajo el cual camina un 20% más lento. Más alto → la falta de sal la frena antes; 0 → nunca la frena. Requiere el sodio como necesidad.',
    ],
    'Tastes.mimics': [
      'How many nourishing species on a map have a poisonous look-alike: same look, mostly bitter inside; only the tongue tells them apart. Higher → looks are less trustworthy. Only for new maps.',
      'Cuántas especies nutritivas de un mapa tienen un doble venenoso: mismo aspecto, por dentro casi siempre amargo; solo la lengua las distingue. Más alto → el aspecto es menos confiable. Solo para mapas nuevos.',
    ],
    'Tastes.twinShare': [
      'Share of a mimicked species’ fruit that is actually the poisonous look-alike. Higher → that species is riskier and she must rely on taste; 0 → the look-alike never appears.',
      'Parte de los frutos de una especie imitada que en realidad es el doble venenoso. Más alto → esa especie es más riesgosa y debe fiarse del sabor; 0 → el doble nunca aparece.',
    ],
    'Food sources.enabled': [
      'On → a tree is a food source to her only after she has seen fruit lying around it, and she remembers which fruit it gave; off → she knows every tree and its fruit from birth.',
      'Encendido → un árbol es fuente de comida para ella solo después de ver fruta tirada a su alrededor, y recuerda qué fruta dio; apagado → conoce cada árbol y su fruta desde que nace.',
    ],
    'Food sources.near': [
      'Fruit lying within a tree’s radius × this is taken as that tree’s fruit. Higher → she credits trees with fruit farther away (more mix-ups between neighbors); lower → only fruit right under it counts.',
      'La fruta tirada a menos del radio de un árbol × esto se toma como suya. Más alto → atribuye a un árbol fruta más lejana (más confusiones entre vecinos); más bajo → solo cuenta la que está justo debajo.',
    ],
  },
  perFood: {
    group: [
      'Settings of this kind of fruit: how much it feeds, how far it smells, how long it lasts, how big it looks and any temporary effects eating it has on her.',
      'Ajustes de este tipo de fruta: cuánto alimenta, desde qué distancia se huele, cuánto dura, qué tan grande se ve y los efectos temporales que tiene comerla.',
    ],
    hunger: [
      'How much eating it changes her hunger: negative removes hunger (it feeds), positive adds it (it harms). More negative → more nourishing; positive → eating it leaves her hungrier.',
      'Cuánto cambia su hambre al comerla: negativo quita hambre (alimenta), positivo la suma (perjudica). Más negativo → más nutritiva; positivo → comerla la deja con más hambre.',
    ],
    aroma: [
      'Length of the scent plume it gives off: how far away she can smell it, even unseen. Higher → she finds it from farther; 0 → it has no smell.',
      'Largo de la estela de olor que desprende: desde qué distancia puede olerla, aunque no la vea. Más alto → la encuentra desde más lejos; 0 → no tiene olor.',
    ],
    life: [
      'Seconds it lasts on the ground before rotting (or, for rotten fruit, before vanishing); in the pantry it lasts longer. Higher → it keeps longer; 0 → it never rots.',
      'Segundos que dura en el suelo antes de pudrirse (o, si ya está podrida, antes de desaparecer); en la despensa dura más. Más alto → se conserva más; 0 → nunca se pudre.',
    ],
    radius: [
      'Size of its dot on the map, in pixels. Only how it looks and how easy it is to click; it does not change how she sees or eats it.',
      'Tamaño de su punto en el mapa, en píxeles. Solo cambia cómo se ve y lo fácil que es hacerle clic; no cambia cómo ella la ve ni la come.',
    ],
    mult: [
      'Factor this effect multiplies the stat by while it lasts (1 = no change). Above 1 → it boosts the stat; below 1 → it weakens it. A trial bite gives a milder effect.',
      'Factor por el que este efecto multiplica la estadística mientras dura (1 = sin cambio). Más de 1 → la potencia; menos de 1 → la debilita. Un bocado de prueba da un efecto más suave.',
    ],
    sec: [
      'Seconds the effect lasts after eating it; eating it again restarts the timer instead of stacking. Higher → longer effect; 0 → no effect.',
      'Segundos que dura el efecto tras comerla; volver a comerla reinicia el tiempo en vez de acumularlo. Más alto → efecto más largo; 0 → sin efecto.',
    ],
  },
};
