// El suelo. Se pinta UNA vez en un lienzo del tamaño del mundo y luego solo se
// estampa: así puede llevar relieve, manchas de tierra y musgo, grano, guijarros
// y matas sin costar nada por fotograma.
//
// No hay "una textura de suelo": hay un terreno. Dos campos de ruido —altura y
// humedad— deciden a la vez el color y la luz de cada trozo, y los detalles se
// siembran donde les toca: las matas donde hay humedad, los guijarros y las
// grietas donde la tierra está seca.
//
// La luz es la misma que la de la roca y el nido: arriba a la izquierda. Es lo
// que hace que las tres cosas parezcan del mismo sitio.
//
// Al final todo se vela hacia el color de fondo: el suelo es escenario, no
// protagonista, y Fagi y los puntos tienen que seguir leyéndose encima.
//
// Las piezas viven en terrain/:
//   · suelo.js     el lienzo cocido del mundo y el orden en que se pinta
//   · relieve.js   campos de ruido, color y luz del terreno, grano y claros
//   · detalles.js  guijarros, matas, hojas, musgo, raíces y grietas
//   · cerca.js     lo que se añade al acercarse: grano de zoom y detalle de cerca
//   · orilla.js    la mancha de humedad alrededor de cada charco
//   · paleta.js    la luz y los colores que comparten todas

export { drawTerrain } from './terrain/suelo.js';
export { drawGranoZoom, drawDetalleCerca } from './terrain/cerca.js';
export { drawShore } from './terrain/orilla.js';
