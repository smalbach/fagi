// Fagi's colors, alive and dead.
//
// Chitin: it is not a color, it is a material. Each tone yields the light of
// the back, the dark of the edge and the specular shine, which is what makes
// it read as a hard shell and not as painted rubber.
export const SKIN = {
  gaster: '#b9692c', thorax: '#cf853f', head: '#c47634',
  legs: '#b8743a', tip: '#d9a86a', shine: '#ffe9c4',
};
// A male is a shade darker and duller, as in real colonies; never enough to
// read as a different species.
export const SKIN_MALE = {
  gaster: '#94501f', thorax: '#ad6630', head: '#a05a29',
  legs: '#94592c', tip: '#c8955c', shine: '#f6dcb4',
};
export const DEAD = {
  gaster: '#4e525f', thorax: '#555a67', head: '#5c6170',
  legs: '#42464f', tip: '#787d8a', shine: '#9aa0ad',
};
export const LEAF = { fill: '#4d8f4f', vein: '#a9d69a', light: '#8cc47c' };
export const DEAD_LEAF = { fill: '#525c57', vein: '#414a46', light: '#77827c' };
