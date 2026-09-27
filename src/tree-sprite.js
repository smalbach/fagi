// El árbol pintado. Tres lienzos, cada uno pintado UNA vez:
//
//   · el tronco, con sus raíces, su corteza y el ramaje que le nace;
//   · la copa, que es hoja;
//   · y las puntas de las ramas otra vez, para pintarlas ENCIMA de la copa.
//
// Ese tercer lienzo es lo que hace que el árbol se lea como madera con hoja y no
// como una mancha verde: el ramaje asoma entre las hojas, con el mismo trazo y
// en el mismo sitio que el de abajo, porque los dos salen del mismo esqueleto
// (ramasDe). Van separados porque hacen cosas distintas al dibujar: el tronco
// está clavado en el suelo, y la copa y sus ramas se mueven con el viento.
//
// Todo lo que se ve cuenta lo que el árbol hace:
//
//   · La copa se inclina a favor del viento. El viento es lo que arrastra los
//     olores, así que mirando cualquier árbol se sabe hacia dónde va el rastro
//     del fruto sin abrir ningún panel.
//   · El fruto que viene se ve madurar colgado de la copa: crece y toma color
//     según se agota la cuenta atrás. Cuando está entero, cae.
//   · Al secarse pierde hoja, se apaga hacia el pardo y se le ve el ramaje: un
//     árbol viejo se reconoce antes de que caiga.
//
// La copa se sienta en la mitad de arriba: por debajo queda el fuste a la vista,
// que es lo que da a entender que hay un árbol y no un arbusto. Todo cabe dentro
// del radio del objeto: lo que se ve es el árbol que hay.

// Las piezas viven en tree-sprite/: el esqueleto del ramaje, el tronco y su
// pie, la copa (procedural y fotográfica), el viento y la fruta. Aquí solo se
// guardan los lienzos ya pintados y se decide qué se estampa y dónde.

import { treeAge } from './trees.js';
import { cacheSprite, detalle, estampar, semillaDe } from './sprite-kit.js';
import { pintarTronco } from './tree-sprite/tronco.js';
import { pintarRamaje } from './tree-sprite/ramaje.js';
import { pintarCopa } from './tree-sprite/copa.js';
import { copaRealistaCargada, estamparCopaRealista } from './tree-sprite/copa-realista.js';
import { vaiven } from './tree-sprite/viento.js';
import { frutos } from './tree-sprite/frutos.js';

const troncos = new Map();     // clave: semilla|radio|escalón de sequía
const copas = new Map();       // clave: semilla|radio|color|escalón de sequía
const ramajes = new Map();     // las puntas que van por encima de la hoja

const PASOS = 8;               // escalones en que se redondea la sequía

export function drawTree(ctx, o, spec, r, wind, ahora) {
  // Con la cámara cerca se pinta el árbol con más píxeles en vez de estirar el
  // que ya estaba: el radio va multiplicado por la escala de detalle.
  const z = detalle();
  const semilla = semillaDe(o);
  const R = Math.round(r * z);
  const paso = Math.round(treeAge(o) * PASOS);
  const seco = paso / PASOS;

  const tronco = cacheSprite(troncos, `${semilla}|${R}|${paso}`,
    () => pintarTronco(semilla, R, seco), 120);
  estampar(ctx, tronco, o.x, o.y, z);

  // La copa va suelta del tronco: se tumba a favor del viento y respira con él.
  // Las ramas que asoman entre la hoja se mueven con ella, que es lo suyo.
  const v = vaiven(wind, ahora, r, semilla, seco);
  if (copaRealistaCargada()) {
    estamparCopaRealista(ctx, o, r, v, seco, semilla);
  } else {
    const copa = cacheSprite(copas, `${semilla}|${R}|${spec.color}|${paso}`,
      () => pintarCopa(semilla, R, spec.color, seco), 120);
    const puntas = cacheSprite(ramajes, `${semilla}|${R}|${paso}`,
      () => pintarRamaje(semilla, R, seco), 120);
    estampar(ctx, copa, o.x + v.x, o.y + v.y, z);
    estampar(ctx, puntas, o.x + v.x, o.y + v.y, z);
  }
  frutos(ctx, o, r, v, seco);
}
