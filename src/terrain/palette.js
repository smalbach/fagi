// The ground's light and colors. The light is the same as the rock's and the
// nest's: top left.

export const LIGHT = -Math.PI * 0.72;
export const LX = Math.cos(LIGHT);
export const LY = Math.sin(LIGHT);

// Palette in channels, not hex: the color pass runs per pixel and mixes these
// thousands of times.
export const SOIL = [72, 63, 49];   // bare earth, brown and dull
export const DRY_TONE   = [98, 83, 57];   // high and exposed: dust, lighter
export const MOSS  = [49, 70, 43];   // low and damp: dirty green
export const GRAVEL  = [82, 77, 65];   // gravel: earthy gray, not concrete
export const LEAF   = ['#5d6b46', '#6e7b4c', '#495c3d', '#7a7f4e'];  // tufts
export const BRANCH   = ['#4a3a28', '#5c4831', '#3d3020'];             // litter
export const DRY   = ['#6b5227', '#7d5c2c', '#54401f', '#6a5a30'];  // fallen leaves
export const MOSS_T = ['#3f5c34', '#4a6b3c', '#35502f'];            // moss
