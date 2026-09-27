// La luz y los colores del suelo. La luz es la misma que la de la roca y el
// nido: arriba a la izquierda.

export const LIGHT = -Math.PI * 0.72;
export const LX = Math.cos(LIGHT);
export const LY = Math.sin(LIGHT);

// Paleta en canales, no en hex: el paso de color va por píxel y aquí se mezcla
// miles de veces.
export const SOIL = [72, 63, 49];   // tierra desnuda, parda y apagada
export const DRY_TONE   = [98, 83, 57];   // lo alto y expuesto: polvo, más claro
export const MOSS  = [49, 70, 43];   // lo bajo y húmedo: verde sucio
export const GRAVEL  = [82, 77, 65];   // pedregal: gris terroso, no cemento
export const LEAF   = ['#5d6b46', '#6e7b4c', '#495c3d', '#7a7f4e'];  // matas
export const BRANCH   = ['#4a3a28', '#5c4831', '#3d3020'];             // hojarasca
export const DRY   = ['#6b5227', '#7d5c2c', '#54401f', '#6a5a30'];  // hoja caída
export const MOSS_T = ['#3f5c34', '#4a6b3c', '#35502f'];            // musgo
