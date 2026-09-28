// Fagi's colors (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §5.2).
//
// A made-up organism, so no animal's colors: a soft teal mantle that stands
// out against brown soil, membranes a shade lighter and see-through, and a
// core that glows. Female and male differ a little in hue, never enough to
// read as a costume. Dead, everything goes ash-grey and the core goes out.
export const MANTLE = {
  female: { base: '#3f8a86', rim: '#9fe0d2', dark: '#173d3c', membrane: '#7cc9bd' },
  male: { base: '#3b7a93', rim: '#9fd3e6', dark: '#16344a', membrane: '#79b7d4' },
  none: { base: '#3e8290', rim: '#9fdadc', dark: '#163a43', membrane: '#7bc0c9' },
};
export const DEAD = { base: '#5a5f68', rim: '#8b909a', dark: '#2a2d33', membrane: '#6d727b' };

// The core, from well (cool green) to failing (amber, then red).
export const CORE = { well: '#8ff7d4', strained: '#ffc15e', failing: '#ff5d4d' };

export const FILAMENT = { alive: '#27504f', dead: '#3b3e44' };
