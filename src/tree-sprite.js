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

import { TREE, POINT_TYPES } from './config.js';
import { treeAge } from './trees.js';
import { lienzo, mix, azar, semillaDe, ruido, cacheSprite, detalle, estampar } from './sprite-kit.js';

const troncos = new Map();     // clave: semilla|radio|escalón de sequía
const copas = new Map();       // clave: semilla|radio|color|escalón de sequía
const ramajes = new Map();     // las puntas que van por encima de la hoja

// Copa fotográfica de alta resolución. La versión procedural queda como
// respaldo durante la carga y también conserva el árbol funcional sin red.
const copaRealista = new Image();
let copaRealistaLista = false;
copaRealista.onload = () => { copaRealistaLista = true; };
copaRealista.src = '/assets/tree-canopy.webp';

const PASOS = 8;               // escalones en que se redondea la sequía
const BROTES = 4;              // sitios de la copa donde puede colgar fruta
const COPA_SUBE = 0.34;        // cuánto se sienta la copa por encima del centro

const LUZ = -Math.PI * 0.72;   // la misma luz que el suelo, la roca y el nido
const LX = Math.cos(LUZ);
const LY = Math.sin(LUZ);

const CORTEZA = '#4e3620';
const SAVIA = '#8a6b3a';       // hacia donde va la hoja al secarse
const LIQUEN = ['#6c7a52', '#87906a', '#5c6b4a'];

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
  if (copaRealistaLista) {
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

function estamparCopaRealista(ctx, o, r, v, seco, semilla) {
  // Rotación y tamaño nacen de la semilla: incluso compartiendo fotografía no
  // aparecen dos siluetas idénticas. La copa envejece perdiendo saturación y
  // ganando sepia, mientras la transparencia deja ver más ramaje.
  const giro = ((semilla >>> 4) % 6283) / 1000;
  const variacion = 0.92 + ((semilla >>> 13) & 255) / 255 * 0.16;
  // Una copa adulta excede claramente el diámetro del tronco y su zona de
  // colisión. El tamaño anterior se perdía en la vista general del mapa.
  const ancho = r * 2.85 * variacion;
  const alto = ancho * (copaRealista.naturalHeight / copaRealista.naturalWidth);

  ctx.save();
  ctx.translate(o.x + v.x, o.y + v.y - r * 0.12);
  ctx.rotate(giro);
  ctx.globalAlpha = 1 - seco * 0.28;
  ctx.shadowColor = 'rgba(4,8,5,0.72)';
  ctx.shadowBlur = r * 0.18;
  ctx.shadowOffsetX = -LX * r * 0.08;
  ctx.shadowOffsetY = -LY * r * 0.08;
  ctx.filter = `saturate(${1.12 - seco * 0.66}) sepia(${seco * 0.48}) brightness(${1.06 - seco * 0.12})`;
  ctx.drawImage(copaRealista, -ancho / 2, -alto / 2, ancho, alto);
  ctx.restore();
}

// Cuánto se desplaza la copa: una inclinación fija a favor del viento más un
// balanceo lento. Cada árbol lleva su propia fase, así no van todos a la vez.
function vaiven(wind, ahora, r, semilla, seco) {
  const t = ahora / 1000;
  const fase = ((semilla % 1000) / 1000) * Math.PI * 2;
  // Sin hoja hay menos vela: el árbol seco se mueve mucho menos.
  const hoja = 1 - seco * 0.6;
  const empuje = r * 0.035 * hoja;
  const soplo = r * 0.03 * hoja * Math.sin(t * 0.85 + fase) * (0.7 + 0.3 * Math.sin(t * 2.1 + fase));
  const d = empuje + soplo;
  return { x: Math.cos(wind?.angle ?? 0) * d, y: Math.sin(wind?.angle ?? 0) * d * 0.55 };
}

// --- el esqueleto ---------------------------------------------------------

// El ramaje, en coordenadas relativas al centro del árbol. Se calcula aparte de
// quien lo pinta porque lo pintan DOS lienzos —el del tronco, por detrás de la
// hoja, y el de las puntas, por delante— y tienen que salir idénticos. Un mismo
// esqueleto pintado dos veces se lee como una rama que entra en la copa y sale
// por el otro lado; dos esqueletos parecidos se leen como un enredo.
function ramasDe(semilla, R) {
  const rnd = azar((semilla ^ 0x7f4a7c15) >>> 0);
  const inclina = (rnd() - 0.5) * 0.22;
  const x0 = inclina * R;
  const y0 = -R * 0.3;                  // la cruz: donde el fuste se abre
  const segs = [];

  const crecer = (x, y, a, largo, grosor, nivel) => {
    const cx = x + Math.cos(a) * largo * 0.5 + (rnd() - 0.5) * largo * 0.28;
    const cy = y + Math.sin(a) * largo * 0.5 + (rnd() - 0.5) * largo * 0.28;
    const x2 = x + Math.cos(a) * largo;
    const y2 = y + Math.sin(a) * largo;
    segs.push({ x, y, cx, cy, x2, y2, grosor, nivel });
    if (nivel >= 2) return;
    for (const lado of [-1, 1]) {
      crecer(x2, y2, a + lado * (0.3 + rnd() * 0.45),
        largo * (0.52 + rnd() * 0.22), grosor * 0.58, nivel + 1);
    }
  };

  const n = 4 + ((rnd() * 2) | 0);
  for (let i = 0; i < n; i++) {
    // Se abren en abanico hacia arriba, ninguna colgando hacia el suelo.
    const a = -Math.PI / 2 + ((i + 0.5) / n - 0.5) * 2.4 + (rnd() - 0.5) * 0.26;
    // Cortas a propósito: el ramaje vive DENTRO de la copa. Una rama que asoma
    // por encima de la hoja no se lee como rama, se lee como árbol muerto.
    crecer(x0, y0, a, R * (0.26 + rnd() * 0.12), Math.max(1.6, R * 0.13), 0);
  }
  return { inclina, segs, cruz: { x: x0, y: y0 } };
}

// Traza los tramos que pase el filtro. Cada uno lleva su reflejo por el lado de
// la luz: es lo que separa una rama de una raya pintada.
function trazarRamas(ctx, cx, cy, segs, claro, oscuro, filtro, alfa = 1) {
  ctx.lineCap = 'round';
  ctx.globalAlpha = alfa;
  for (const s of segs) {
    if (filtro && !filtro(s)) continue;
    ctx.strokeStyle = oscuro;
    ctx.lineWidth = s.grosor;
    ctx.beginPath();
    ctx.moveTo(cx + s.x, cy + s.y);
    ctx.quadraticCurveTo(cx + s.cx, cy + s.cy, cx + s.x2, cy + s.y2);
    ctx.stroke();

    if (s.grosor > 1.8) {
      const d = s.grosor * 0.3;
      ctx.strokeStyle = claro;
      ctx.lineWidth = s.grosor * 0.32;
      ctx.beginPath();
      ctx.moveTo(cx + s.x + LX * d, cy + s.y + LY * d);
      ctx.quadraticCurveTo(cx + s.cx + LX * d, cy + s.cy + LY * d,
        cx + s.x2 + LX * d, cy + s.y2 + LY * d);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

// --- tronco ---------------------------------------------------------------

function pintarTronco(semilla, R, seco) {
  const rnd = azar((semilla ^ 0x2545f491) >>> 0);
  const pad = Math.ceil(R * 0.6) + 6;
  const S = (R + pad) * 2;
  const cx = S / 2;
  const cy = S / 2;
  const c = lienzo(S, S);
  const ctx = c.getContext('2d');

  const base = mix(CORTEZA, rnd() < 0.5 ? '#6a4b2c' : '#3d2a18', rnd() * 0.5);
  const claro = mix(base, '#d8bc90', 0.5);
  const oscuro = mix(base, '#120c07', 0.62);

  // La sombra del árbol entero: la proyecta la copa, no el tronco.
  ctx.save();
  ctx.translate(cx - LX * R * 0.3, cy - LY * R * 0.3 + R * 0.5);
  ctx.scale(1, 0.4);
  const som = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.15);
  som.addColorStop(0, `rgba(6,8,11,${0.5 - seco * 0.2})`);
  som.addColorStop(1, 'rgba(6,8,11,0)');
  ctx.fillStyle = som;
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ramaje entero, por detrás del fuste: así las ramas nacen de dentro del
  // tronco y no pisan la corteza.
  const { inclina, segs, cruz } = ramasDe(semilla, R);
  trazarRamas(ctx, cx, cy, segs, claro, oscuro);

  // Fuste: grueso abajo, algo menos en la cruz, y abierto en raíces al pisar el
  // suelo. Es la pieza que dice de qué tamaño es el árbol.
  //
  // Y no es un tubo. Un tronco engorda y adelgaza a tramos, tiene nudos y una
  // cara distinta de la otra, así que cada lado se traza por puntos con su
  // propio bulto. Dos curvas limpias y simétricas se leen como cartón.
  const baseY = cy + R * 0.92;
  const altoY = cy + cruz.y;
  const w0 = R * 0.27;
  const w1 = R * 0.15;
  const N = 7;
  const bultos = [[], []];
  for (const b of bultos) for (let i = 0; i <= N; i++) b.push((rnd() - 0.5) * 0.3);

  const ladoDel = (signo, k, encoge = 1) => {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      // El pie no se estrecha: ahí es donde arrancan los contrafuertes.
      const grueso = (w0 + (w1 - w0) * t) * (1 + bultos[k][i]) * encoge;
      pts.push({
        x: cx + inclina * R * t + signo * grueso,
        y: baseY + (altoY - baseY) * t,
      });
    }
    return pts;
  };

  // Curva suave que pasa por los puntos: cada tramo tira hacia el punto medio
  // del siguiente, así no se ven las esquinas.
  const seguir = (pts) => {
    for (let i = 1; i < pts.length - 1; i++) {
      ctx.quadraticCurveTo(pts[i].x, pts[i].y,
        (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  };

  const izq = ladoDel(-1, 0);
  const der = ladoDel(1, 1);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(izq[0].x, izq[0].y);
  seguir(izq);
  ctx.lineTo(der[der.length - 1].x, der[der.length - 1].y);
  seguir([...der].reverse());
  ctx.closePath();
  ctx.clip();

  const vol = ctx.createLinearGradient(cx - w0, 0, cx + w0, 0);
  vol.addColorStop(0, LX < 0 ? claro : oscuro);
  vol.addColorStop(0.42, base);
  vol.addColorStop(1, LX < 0 ? oscuro : claro);
  ctx.fillStyle = vol;
  ctx.fillRect(0, 0, S, S);

  // Corteza. Tres cosas distintas, y las tres hacen falta: los surcos verticales
  // que la recorren de arriba abajo, las escamas cortas que los cruzan —lo que
  // convierte los surcos en placas de corteza en vez de rayas— y el filo claro
  // del canto por donde entra la luz, que redondea el fuste.
  ctx.lineCap = 'round';
  const surcos = 16 + ((rnd() * 10) | 0);
  for (let i = 0; i < surcos; i++) {
    const x = cx - w0 + rnd() * w0 * 2;
    const y0 = altoY + rnd() * (baseY - altoY) * 0.55;
    const y1 = y0 + (baseY - y0) * (0.3 + rnd() * 0.7);
    ctx.strokeStyle = rnd() < 0.58
      ? `rgba(22,14,7,${0.18 + rnd() * 0.26})`
      : `rgba(232,206,162,${0.06 + rnd() * 0.1})`;
    ctx.lineWidth = Math.max(0.8, R * (0.016 + rnd() * 0.034));
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x + (rnd() - 0.5) * R * 0.14, (y0 + y1) / 2, x + (rnd() - 0.5) * R * 0.1, y1);
    ctx.stroke();
  }

  const escamas = 14 + ((rnd() * 10) | 0);
  for (let i = 0; i < escamas; i++) {
    const x = cx - w0 + rnd() * w0 * 2;
    const y = altoY + rnd() * (baseY - altoY);
    const largo = R * (0.04 + rnd() * 0.07);
    ctx.strokeStyle = `rgba(18,11,6,${0.12 + rnd() * 0.18})`;
    ctx.lineWidth = Math.max(0.7, R * 0.012);
    ctx.beginPath();
    ctx.moveTo(x - largo / 2, y);
    ctx.quadraticCurveTo(x, y + (rnd() - 0.5) * R * 0.03, x + largo / 2, y + (rnd() - 0.5) * R * 0.02);
    ctx.stroke();
  }

  // El canto iluminado del fuste: sigue el mismo perfil que la silueta, un poco
  // metido hacia dentro. Si fuera una curva aparte no cuadraría con los bultos.
  const canto = LX < 0 ? ladoDel(-1, 0, 0.9) : ladoDel(1, 1, 0.9);
  ctx.strokeStyle = `rgba(236,212,170,0.22)`;
  ctx.lineWidth = Math.max(1, R * 0.035);
  ctx.beginPath();
  ctx.moveTo(canto[0].x, canto[0].y);
  seguir(canto);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Nudos: la cicatriz que deja una rama que se cayó. Un anillo hundido con su
  // corazón oscuro, y el brillo por donde entra la luz.
  for (let i = 0, n = 1 + ((rnd() * 3) | 0); i < n; i++) {
    const x = cx + (rnd() - 0.5) * w0 * 1.3;
    const y = altoY + rnd() * (baseY - altoY) * 0.85;
    const rad = R * (0.03 + rnd() * 0.035);
    ctx.fillStyle = 'rgba(24,15,7,0.5)';
    ctx.beginPath();
    ctx.ellipse(x, y, rad, rad * 0.75, (rnd() - 0.5) * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mix(base, '#0b0703', 0.55);
    ctx.beginPath();
    ctx.ellipse(x, y, rad * 0.5, rad * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,208,166,0.2)';
    ctx.lineWidth = Math.max(0.6, R * 0.012);
    ctx.beginPath();
    ctx.ellipse(x - LX * rad * 0.15, y - LY * rad * 0.15, rad, rad * 0.75, 0, LUZ - 1.2, LUZ + 1.2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // Liquen: manchas pálidas pegadas al lado de sombra, que es donde agarra.
  for (let i = 0; i < 3 + ((rnd() * 4) | 0); i++) {
    const x = cx - LX * w0 * (0.2 + rnd() * 0.7);
    const y = altoY + rnd() * (baseY - altoY);
    ctx.globalAlpha = 0.1 + rnd() * 0.16;
    ctx.fillStyle = LIQUEN[(rnd() * LIQUEN.length) | 0];
    ctx.beginPath();
    ctx.ellipse(x, y, R * (0.03 + rnd() * 0.05), R * (0.02 + rnd() * 0.04), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Grano de la madera.
  ctx.globalAlpha = 0.24;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(ruido(S, S, rnd, 3, 3), 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();

  // Raíces: contrafuertes que agarran el suelo. Cierran el encuentro del tronco
  // con la tierra, que es lo que más delata a un árbol plantado de mentira. Cada
  // una es una cuña de dos curvas —sube pegada al fuste y baja tendida hasta la
  // tierra—, con su filo claro por donde entra la luz: una punta recta parecería
  // una aleta pegada al tronco, no madera que sale de él.
  const raices = 4 + ((rnd() * 3) | 0);
  for (let i = 0; i < raices; i++) {
    const lado = i % 2 ? 1 : -1;
    const largo = R * (0.1 + rnd() * 0.14);
    const alto = R * (0.1 + rnd() * 0.1);
    const x0 = cx + lado * w0 * 0.7;
    const xf = cx + lado * (w0 + largo);

    ctx.fillStyle = mix(base, '#100b06', 0.2 + rnd() * 0.3);
    ctx.beginPath();
    ctx.moveTo(x0, baseY - alto * 1.8);
    ctx.quadraticCurveTo(cx + lado * (w0 + largo * 0.5), baseY - alto * 0.75, xf, baseY + alto * 0.1);
    ctx.quadraticCurveTo(cx + lado * (w0 + largo * 0.35), baseY + alto * 0.3, x0, baseY + alto * 0.2);
    ctx.closePath();
    ctx.fill();

    // El lomo de la raíz, por donde le da la luz.
    ctx.strokeStyle = `rgba(226,200,158,${0.1 + rnd() * 0.12})`;
    ctx.lineWidth = Math.max(0.7, R * 0.02);
    ctx.beginPath();
    ctx.moveTo(x0, baseY - alto * 1.6);
    ctx.quadraticCurveTo(cx + lado * (w0 + largo * 0.5), baseY - alto * 0.7, xf - lado * largo * 0.15, baseY - alto * 0.05);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // Hojarasca del propio árbol: lo que ha ido soltando cae a sus pies y se
  // amontona ahí. Un tronco que sale de la tierra limpia se lee como plantado
  // ayer; con su alfombra de hoja parece llevar años.
  const caidas = 10 + ((rnd() * 10) | 0);
  for (let i = 0; i < caidas; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.12 + Math.sqrt(rnd()) * 0.52);
    const x = cx + Math.cos(a) * d;
    const y = baseY + Math.sin(a) * d * 0.34;
    const largo = R * (0.05 + rnd() * 0.06);
    const ancho = largo * (0.3 + rnd() * 0.2);
    const giro = rnd() * Math.PI;
    const tono = mix('#6d5227', seco > 0.5 ? '#54401f' : '#5c5c2e', rnd());

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(giro);
    const forma = (dx, dy) => {
      ctx.beginPath();
      ctx.moveTo(-largo / 2 + dx, dy);
      ctx.quadraticCurveTo(dx, -ancho + dy, largo / 2 + dx, dy);
      ctx.quadraticCurveTo(dx, ancho + dy, -largo / 2 + dx, dy);
      ctx.closePath();
    };
    ctx.fillStyle = 'rgba(10,9,7,0.34)';
    forma(-LX * largo * 0.12, -LY * largo * 0.12);
    ctx.fill();
    ctx.globalAlpha = 0.6 + rnd() * 0.3;
    ctx.fillStyle = tono;
    forma(0, 0);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Musgo al pie, por el lado que no ve el sol: ahí es donde aguanta la humedad.
  for (let i = 0, n = 5 + ((rnd() * 6) | 0); i < n; i++) {
    const a = LUZ + Math.PI + (rnd() - 0.5) * 1.8;
    const d = R * (0.1 + rnd() * 0.3);
    ctx.globalAlpha = (0.1 + rnd() * 0.14) * (1 - seco * 0.7);
    ctx.fillStyle = LIQUEN[(rnd() * LIQUEN.length) | 0];
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * d, baseY + Math.sin(a) * d * 0.3,
      R * (0.04 + rnd() * 0.06), R * (0.02 + rnd() * 0.03), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Y la tierra removida alrededor del pie.
  const pie = ctx.createRadialGradient(cx, baseY, 0, cx, baseY, R * 0.55);
  pie.addColorStop(0, 'rgba(38,28,18,0.38)');
  pie.addColorStop(1, 'rgba(38,28,18,0)');
  ctx.fillStyle = pie;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, R * 0.55, R * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  return c;
}

// Las puntas del ramaje, para ir POR ENCIMA de la hoja. Solo los tramos más
// finos, y apagados: se trata de que entre hoja y hoja asome madera, no de
// dibujar un esqueleto encima de la copa. Cuanto más seco el árbol, más se ven,
// que es justo lo que delata al viejo.
function pintarRamaje(semilla, R, seco) {
  const rnd = azar((semilla ^ 0x2545f491) >>> 0);
  const pad = Math.ceil(R * 0.6) + 6;
  const S = (R + pad) * 2;
  const c = lienzo(S, S);
  const ctx = c.getContext('2d');

  const base = mix(CORTEZA, rnd() < 0.5 ? '#6a4b2c' : '#3d2a18', rnd() * 0.5);
  const { segs } = ramasDe(semilla, R);
  trazarRamas(ctx, S / 2, S / 2, segs,
    mix(base, '#d8bc90', 0.45), mix(base, '#120c07', 0.55),
    (s) => s.nivel >= 2, 0.4 + seco * 0.5);
  return c;
}

// --- copa -----------------------------------------------------------------

function pintarCopa(semilla, R, color, seco) {
  const rnd = azar((semilla ^ 0x51ed270b) >>> 0);
  const pad = Math.ceil(R * 0.36) + 5;
  const S = (R + pad) * 2;
  const cx = S / 2;
  const cy = S / 2 - R * COPA_SUBE;   // la hoja se sienta arriba: abajo va el fuste
  const c = lienzo(S, S);
  const ctx = c.getContext('2d');

  // Al secarse la hoja no se vuelve marrón de golpe: pierde verde y gana pardo.
  const hoja = mix(color, SAVIA, seco);
  const fondo = mix(hoja, '#0e1c12', 0.6);
  const medio = mix(hoja, '#0d1a12', 0.22);
  const claro = mix(hoja, '#eef7cd', 0.34);

  // Racimos: la copa no es un círculo, es un montón de masas de hoja que se
  // solapan. Todas caben dentro del radio.
  const alcance = R * 0.72;
  const n = 7 + ((rnd() * 4) | 0);
  const racimos = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.7;
    const rad = alcance * (0.42 + rnd() * 0.2);
    const d = Math.min(alcance - rad * 0.55, alcance * (0.2 + rnd() * 0.55));
    racimos.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.9, r: rad });
  }
  racimos.push({ x: cx + (rnd() - 0.5) * R * 0.1, y: cy - R * 0.06, r: alcance * 0.62 });

  // La silueta de la copa, para que el grano y la sombra no se salgan de ella.
  const recorte = () => {
    ctx.beginPath();
    for (const m of racimos) {
      ctx.moveTo(m.x + m.r, m.y);
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    }
  };

  // Tres pasadas: la masa oscura, el tono medio corrido hacia la luz y los
  // claros solo en lo alto de cada racimo.
  const pasada = (col, escala, hacia, alfa) => {
    ctx.globalAlpha = alfa;
    ctx.fillStyle = col;
    for (const m of racimos) {
      ctx.beginPath();
      ctx.arc(m.x + LX * m.r * hacia, m.y + LY * m.r * hacia, m.r * escala, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  pasada(fondo, 1, 0, 1);
  pasada(medio, 0.82, 0.16, 0.95);
  pasada(claro, 0.5, 0.36, 0.5);

  // Grano de hoja, para que las manchas no queden planas.
  ctx.save();
  recorte();
  ctx.clip();
  ctx.globalAlpha = 0.2;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(ruido(S, S, rnd, 3, 3), 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();

  // Ramillas dentro de la hoja: los palitos de los que cuelgan las hojas. Van
  // antes que ellas, para que la hoja se vea colgada de algo.
  const ramillas = Math.round(R * 0.5);
  ctx.lineCap = 'round';
  for (let i = 0; i < ramillas; i++) {
    const m = racimos[(rnd() * racimos.length) | 0];
    const a = rnd() * Math.PI * 2;
    const x = m.x + Math.cos(a) * m.r * 0.3;
    const y = m.y + Math.sin(a) * m.r * 0.3;
    const largo = m.r * (0.4 + rnd() * 0.5);
    ctx.strokeStyle = `rgba(48,34,20,${0.3 + rnd() * 0.3})`;
    ctx.lineWidth = Math.max(0.6, R * 0.012);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * largo * 0.6, y + Math.sin(a) * largo * 0.5,
      x + Math.cos(a) * largo, y + Math.sin(a) * largo);
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  // Hojas. Son lo que hace que la copa deje de leerse como un montón de
  // círculos: cada una es una hoja, con su lado a la luz, su punta y su nervio
  // si es de las grandes. Salen por todo el canto de los racimos, y unas pocas
  // se despegan y quedan sueltas contra el cielo.
  const hojas = Math.round(R * 7 * (1 - seco * 0.55));
  for (let i = 0; i < hojas; i++) {
    const m = racimos[(rnd() * racimos.length) | 0];
    const a = rnd() * Math.PI * 2;
    const d = m.r * (0.45 + rnd() * 0.62);
    const x = m.x + Math.cos(a) * d;
    const y = m.y + Math.sin(a) * d;
    if (Math.hypot(x - cx, y - cy + R * COPA_SUBE) > R + pad * 0.5) continue;

    const luz = (Math.cos(a) * LX + Math.sin(a) * LY + 1) / 2;   // 1 = da a la luz
    const largo = R * (0.06 + rnd() * 0.07);
    const ancho = largo * (0.36 + rnd() * 0.22);
    const giro = a + (rnd() - 0.5) * 1.1;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(giro);
    const tono = mix(fondo, claro, luz * (0.45 + rnd() * 0.55));

    // Hoja de dos curvas: se estrecha en punta. Un óvalo no se lee como hoja.
    ctx.fillStyle = tono;
    ctx.beginPath();
    ctx.moveTo(-largo * 0.5, 0);
    ctx.quadraticCurveTo(0, -ancho, largo * 0.5, 0);
    ctx.quadraticCurveTo(0, ancho, -largo * 0.5, 0);
    ctx.fill();

    if (largo > R * 0.085) {
      ctx.strokeStyle = mix(tono, '#0d1a12', 0.45);
      ctx.lineWidth = Math.max(0.4, largo * 0.07);
      ctx.beginPath();
      ctx.moveTo(-largo * 0.45, 0);
      ctx.lineTo(largo * 0.45, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.lineWidth = 1;

  // Claros entre la hoja: por ahí se ve el ramaje que va pintado encima.
  // Cuanto más seco, más huecos y más grandes.
  const huecos = Math.round(4 + seco * 8);
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < huecos; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * alcance * 0.85;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.05 + rnd() * 0.1) * (0.7 + seco);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(0,0,0,${0.55 + seco * 0.45})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // La copa se hace sombra a sí misma por abajo, al lado contrario de la luz.
  ctx.save();
  recorte();
  ctx.clip();
  const bajo = ctx.createRadialGradient(
    cx - LX * R * 0.5, cy - LY * R * 0.5, R * 0.1,
    cx - LX * R * 0.5, cy - LY * R * 0.5, R * 1.1
  );
  bajo.addColorStop(0, 'rgba(8,14,10,0.34)');
  bajo.addColorStop(1, 'rgba(8,14,10,0)');
  ctx.fillStyle = bajo;
  ctx.fillRect(0, 0, S, S);
  ctx.restore();

  return c;
}

// --- fruta ----------------------------------------------------------------

// La fruta colgada. Una madura —la que va a caer— y el resto, brotes que
// esperan turno. Cuál madura sale de cuántas lleva soltadas, así que después de
// cada caída le toca a otra rama.
function frutos(ctx, o, r, v, seco) {
  const spec = POINT_TYPES[TREE.fruit];
  if (!spec) return;

  const rnd = azar((semillaDe(o) ^ 0x9e3779b9) >>> 0);
  const listo = 1 - Math.max(0, Math.min(1, (o.timer ?? 0) / TREE.interval));
  const cual = (o.lastDrop ?? 0) % BROTES;
  const verde = mix(spec.color, '#39603a', 0.55);

  for (let i = 0; i < BROTES; i++) {
    // Cuelgan de la mitad de abajo de la copa, que es donde se ven.
    const a = Math.PI * 0.12 + rnd() * Math.PI * 0.76;
    const d = r * (0.24 + rnd() * 0.38);
    const x = o.x + v.x + Math.cos(a) * d;
    const y = o.y + v.y - r * COPA_SUBE + Math.sin(a) * d;

    const t = i === cual ? listo : 0.15 + rnd() * 0.1;
    const rad = spec.radius * (0.35 + t * 0.85) * (1 - seco * 0.5);
    if (rad < 0.8) continue;

    // Rabito: es lo que la sostiene, y lo que se rompe cuando cae.
    ctx.strokeStyle = 'rgba(58,40,24,0.7)';
    ctx.lineWidth = Math.max(1, rad * 0.25);
    ctx.beginPath();
    ctx.moveTo(x, y - rad * 1.7);
    ctx.lineTo(x, y - rad * 0.7);
    ctx.stroke();
    ctx.lineWidth = 1;

    const color = mix(verde, spec.color, t);
    const g = ctx.createRadialGradient(x + LX * rad * 0.4, y + LY * rad * 0.4, 0, x, y, rad * 1.2);
    g.addColorStop(0, mix(color, '#ffffff', 0.35));
    g.addColorStop(0.55, color);
    g.addColorStop(1, mix(color, '#101a12', 0.55));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();

    // La que está a punto se enciende un poco: es el aviso de que va a caer.
    if (i === cual && t > 0.82) {
      const halo = ctx.createRadialGradient(x, y, rad, x, y, rad * 2.4);
      halo.addColorStop(0, `rgba(255,246,214,${(t - 0.82) * 0.9})`);
      halo.addColorStop(1, 'rgba(255,246,214,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, rad * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
