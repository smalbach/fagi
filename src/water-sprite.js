// El lago. Antes el agua era un círculo translúcido con su borde azul; ahora es
// una charca de verdad, y lo que la hace lago son cuatro cosas, no el color:
//
//   · La orilla no es una circunferencia: serpentea. Un borde perfecto se lee
//     como interfaz, no como agua.
//   · Tiene fondo. Hay un hondo oscuro en el medio y un vado claro pegado a la
//     orilla, con arena y piedras que se ven por debajo del agua.
//   · Tiene barro alrededor: la tierra que el agua ha mojado y remueve Fagi al
//     entrar, con guijarros sueltos.
//   · Y se mueve. El brillo del cielo tirita, salen ondas del centro y los
//     juncos de la orilla se doblan con el MISMO viento que arrastra los olores,
//     igual que la copa del árbol.
//
// Lo quieto se pinta una vez en un lienzo (fondo, arena, piedras, barro) y lo
// vivo se dibuja cada fotograma encima, que es poca cosa: unos reflejos, tres
// ondas y los juncos. El círculo que decide dónde se bebe sigue siendo el radio
// del objeto: la orilla dibujada se le ciñe, no manda.
//
// Las piezas viven en water-sprite/:
//   · lago.js        drawLake: elige foto o dibujo y guarda los lienzos
//   · realista.js    el estanque fotográfico con sus reflejos
//   · quieto.js      el lienzo quieto: agua, olas cocidas, canto y barro
//   · lecho.js       lo que se ve del fondo: arena, piedras, algas, cáusticas
//   · superficie.js  lo vivo del agua: luz, rizos, destellos, ondas, motas
//   · juncos.js      los juncos de la orilla, doblados por el viento
//   · forma.js       la luz, los colores y el perfil de la orilla

export { drawLake } from './water-sprite/lake.js';
