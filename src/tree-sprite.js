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
import { cacheSprite, detail, stamp, seedFor } from './sprite-kit.js';
import { paintTrunk } from './tree-sprite/trunk.js';
import { paintBranches } from './tree-sprite/branches.js';
import { paintCrown } from './tree-sprite/crown.js';
import { realisticCrownLoaded, stampRealisticCrown } from './tree-sprite/realistic-crown.js';
import { swayOf } from './tree-sprite/wind.js';
import { fruitsOf } from './tree-sprite/fruits.js';

const trunks = new Map();     // clave: semilla|radio|escalón de sequía
const crowns = new Map();       // clave: semilla|radio|color|escalón de sequía
const branchings = new Map();     // las puntas que van por encima de la hoja

const STEPS = 8;               // escalones en que se redondea la sequía

export function drawTree(ctx, o, spec, r, wind, now) {
  // Con la cámara cerca se pinta el árbol con más píxeles en vez de estirar el
  // que ya estaba: el radio va multiplicado por la escala de detalle.
  const z = detail();
  const seedOf = seedFor(o);
  const R = Math.round(r * z);
  const step = Math.round(treeAge(o) * STEPS);
  const dry = step / STEPS;

  const trunk = cacheSprite(trunks, `${seedOf}|${R}|${step}`,
    () => paintTrunk(seedOf, R, dry), 120);
  stamp(ctx, trunk, o.x, o.y, z);

  // La copa va suelta del tronco: se tumba a favor del viento y respira con él.
  // Las ramas que asoman entre la hoja se mueven con ella, que es lo suyo.
  const v = swayOf(wind, now, r, seedOf, dry);
  if (realisticCrownLoaded()) {
    stampRealisticCrown(ctx, o, r, v, dry, seedOf);
  } else {
    const crown = cacheSprite(crowns, `${seedOf}|${R}|${spec.color}|${step}`,
      () => paintCrown(seedOf, R, spec.color, dry), 120);
    const tips = cacheSprite(branchings, `${seedOf}|${R}|${step}`,
      () => paintBranches(seedOf, R, dry), 120);
    stamp(ctx, crown, o.x + v.x, o.y + v.y, z);
    stamp(ctx, tips, o.x + v.x, o.y + v.y, z);
  }
  fruitsOf(ctx, o, r, v, dry);
}
