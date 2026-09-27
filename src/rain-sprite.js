// La lluvia y los charcos que deja.
//
// Lo que hace que la lluvia vista desde arriba parezca lluvia no son los
// trazos, es todo lo que la acompaña:
//
//   · El cielo se cierra poco a poco y se abre igual. Lo que se ve no salta de
//     seco a diluvio: `nivel` sube en unos segundos al empezar y baja al escampar.
//   · Las nubes pasan. Manchas de sombra lentas que arrastra el viento.
//   · El suelo se moja y tarda en secarse: se oscurece y se enfría de color.
//   · Las gotas caen HACIA la cámara. Hay tres capas: las lejanas, cortas y
//     finas; las cercanas, largas, gruesas y borrosas. Todas se abren un poco
//     desde el centro de la vista (perspectiva) y se inclinan con el viento.
//   · Cada gota que llega al suelo salpica: un punto, un anillo que se abre y
//     unas gotitas que saltan. En el agua deja ondas.
//   · El chaparrón va a rachas: cortinas más densas que cruzan la pantalla.
//   · De vez en cuando, un relámpago.
//
// Nada guarda partículas: cada gota, salpicadura y onda sale de un hash de su
// índice y de su ciclo, así que no hay memoria que crezca ni azar que gastar.
//
// Las piezas viven en rain-sprite/:
//   · estado.js    lo que se ve (nivel del cielo, suelo mojado), subiendo y bajando suave
//   · suelo.js     el suelo mojado, la luz nublada y las salpicaduras (mundo)
//   · charcos.js   los charcos y las ondas de las gotas en el agua (mundo)
//   · gotas.js     rachas, gotas y relámpago, delante de la cámara (pantalla)
//   · util.js      hash, ruido de nubes, teselas, vista y viento

export { rainLook, rainLevel } from './rain-sprite/estado.js';
export { drawWetGround, drawOvercast, drawSplashes } from './rain-sprite/suelo.js';
export { drawRipples, drawPuddle } from './rain-sprite/charcos.js';
export { drawRainDrops } from './rain-sprite/gotas.js';
