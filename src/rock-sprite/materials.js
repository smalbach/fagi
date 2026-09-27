// The procedural rock's materials. Each stone draws one at random from its
// seed, and the material decides color, grain, shape and what goes on top.

export const SILHOUETTE_MAX = 0.99;    // outermost point: never sticks out past the radius

// min       = how far the outline sinks in (low = pointy stone)
// sides     = how many vertices, from fewer to more (few = carved block)
// flattened = how much it can be squashed along one axis
// grain     = [cell size of the fine noise, octaves, opacity]
// veins     = opacity of the big mineral patches
// specks    = [how many, probability they shine]
// cracks    = [minimum, maximum]
export const MATERIALES = [
  { // Granite: light, heavily speckled with quartz, few cracks.
    name: 'granito',
    tint: '#6f6a5e', weight: [0.25, 0.3], lightT: 0.38, shadowT: 0.58,
    min: 0.82, sides: [9, 12], flattened: 0.12,
    grain: [3, 3, 0.34], veins: 0.22, specks: [30, 0.6], cracks: [0, 2],
  },
  { // Basalt: almost black, tight grain, broken by many fractures.
    name: 'basalto',
    tint: '#2d3138', weight: [0.55, 0.3], lightT: 0.26, shadowT: 0.7,
    min: 0.76, sides: [6, 9], flattened: 0.2,
    grain: [6, 2, 0.16], veins: 0.12, specks: [10, 0.15], cracks: [2, 4],
  },
  { // Sandstone: brown and warm, with the strata showing.
    name: 'arenisca',
    tint: '#8a6a45', weight: [0.45, 0.25], lightT: 0.4, shadowT: 0.5,
    min: 0.86, sides: [11, 14], flattened: 0.3,
    grain: [2, 3, 0.28], veins: 0.3, specks: [8, 0.5], cracks: [0, 1],
    strata: true,
  },
  { // Slate: bluish and flat, split along straight planes.
    name: 'pizarra',
    tint: '#49556b', weight: [0.5, 0.25], lightT: 0.3, shadowT: 0.66,
    min: 0.7, sides: [5, 7], flattened: 0.38,
    grain: [8, 2, 0.14], veins: 0.34, specks: [6, 0.4], cracks: [1, 3],
    slabs: true,
  },
  { // Quartzite: almost white and cool, split into a few sharply marked planes.
    name: 'cuarcita',
    tint: '#b9bec9', weight: [0.45, 0.25], lightT: 0.5, shadowT: 0.6,
    min: 0.66, sides: [6, 8], flattened: 0.25,
    grain: [10, 2, 0.12], veins: 0.18, specks: [18, 0.85], cracks: [1, 2],
    picos: true, shine: 0.55,
  },
  { // Conglomerate: dark matrix with pebbles of other stones stuck inside.
    name: 'conglomerado',
    tint: '#5b5248', weight: [0.5, 0.25], lightT: 0.3, shadowT: 0.62,
    min: 0.8, sides: [9, 12], flattened: 0.18,
    grain: [3, 3, 0.3], veins: 0.2, specks: [6, 0.3], cracks: [0, 1],
    pebbles: true,
  },
  { // Limestone: pale, eaten away with pits, and lichen takes hold on it.
    name: 'caliza',
    tint: '#9a978c', weight: [0.4, 0.3], lightT: 0.42, shadowT: 0.52,
    min: 0.84, sides: [10, 13], flattened: 0.16,
    grain: [4, 3, 0.24], veins: 0.26, specks: [14, 0.35], cracks: [0, 2],
    gaps: true, lichen: 0.7,
  },
];
