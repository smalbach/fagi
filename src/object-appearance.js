// Visual choices only: never change collision, chemistry or simulation RNG.
export const APPEARANCES = {
  rock: [
    ['boulder', 'Boulder', 'Roca de campo'], ['granite', 'Granite', 'Granito'],
    ['slate', 'Slate', 'Pizarra'], ['sandstone', 'Sandstone', 'Arenisca'],
    ['limestone', 'Limestone', 'Caliza'], ['volcanic', 'Volcanic', 'Volcánica'],
    ['quartzite', 'Quartzite', 'Cuarcita'], ['ironstone', 'Ironstone', 'Ferruginosa'],
  ],
  tree: [
    ['broadleaf', 'Broadleaf', 'Copa frondosa'], ['conifer', 'Conifer', 'Conífera'],
    ['palm', 'Palm', 'Palmera'], ['willow', 'Willow', 'Sauce'],
  ],
  water: [
    ['woodland', 'Woodland pond', 'Estanque de bosque'], ['clear', 'Stony spring', 'Manantial pedregoso'],
    ['marsh', 'Reed pond', 'Laguna con juncos'], ['clay', 'Clay pond', 'Estanque de arcilla'],
  ],
  nest: [
    ['earth', 'Dark earth', 'Tierra oscura'], ['sand', 'Sandy mound', 'Montículo arenoso'],
    ['forest', 'Roots and litter', 'Raíces y hojarasca'],
  ],
};
export function validAppearance(type, value) {
  return Boolean(APPEARANCES[type] && (value === 'auto' || APPEARANCES[type].some(([id]) => id === value)));
}
export function appearanceOf(o, fallback = null) {
  if (o.appearance && o.appearance !== 'auto' && validAppearance(o.type, o.appearance)) return o.appearance;
  return fallback;
}
export function naturalAppearance(o, seed) {
  const options = APPEARANCES[o.type];
  return appearanceOf(o, options?.[((seed ^ (seed >>> 16)) >>> 0) % options.length]?.[0]);
}
