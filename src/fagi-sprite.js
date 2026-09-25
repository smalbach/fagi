// El dibujo de Fagi. Solo pinta: no sabe nada de reglas ni de decisiones.
//
// Fagi es una hormiga, y se dibuja como tal: tres partes de verdad —gáster,
// mesosoma y cabeza— unidas por el peciolo, que es la cintura que solo tienen
// las hormigas y lo que más las delata desde arriba. Seis patas de tres tramos
// que caminan en trípode, antenas acodadas —escapo y funículo, como las de
// verdad— y una hoja verde a la espalda, que es lo que le da carácter y sirve
// igual de logo.
//
// Se pinta con trazo, no con imagen guardada: la cámara la agranda hasta cuatro
// veces y una hormiga estirada se vería antes que cualquier otra cosa.
//
// La luz es la MISMA que la del suelo, la roca y el árbol: arriba a la
// izquierda del mundo. Como el cuerpo gira, dentro del dibujo la luz tiene que
// girar al revés (`luzLocal`), o al darse la vuelta el brillo la seguiría y se
// leería como plástico.

import { POINT_TYPES } from './config.js';
import { mix, azar } from './sprite-kit.js';

const LUZ = -Math.PI * 0.72;

// Quitina: no es un color, es un material. De cada tono salen el claro del
// lomo, el oscuro del canto y el brillo especular, que es lo que hace que se
// lea como caparazón duro y no como goma pintada.
const PIEL = {
  gaster: '#c9752f', torax: '#d4833c', cabeza: '#dd9146',
  patas: '#8d5327', punta: '#f6d39b', brillo: '#ffe9c4',
};
const MUERTA = {
  gaster: '#4e525f', torax: '#555a67', cabeza: '#5c6170',
  patas: '#42464f', punta: '#787d8a', brillo: '#9aa0ad',
};
const HOJA = { relleno: '#5aa869', nervio: '#3d7e4c', luz: '#9fd9a4' };
const HOJA_MUERTA = { relleno: '#525c57', nervio: '#414a46', luz: '#77827c' };

// Azar fijo: el moteado y los pelos tienen que salir IGUALES en cada fotograma,
// o la hormiga herviría.
const GRANO = 0x5f3a1c7b;

export function drawFagi(ctx, fagi) {
  const vivo = fagi.alive;
  const c = vivo ? PIEL : MUERTA;
  const hoja = vivo ? HOJA : HOJA_MUERTA;
  const paso = vivo ? fagi.stride * 0.07 : 0;

  ctx.save();
  ctx.translate(fagi.x, fagi.y);
  ctx.rotate(fagi.angle);              // +x es hacia delante

  // La luz del mundo, vista desde dentro del cuerpo.
  const L = luzLocal(fagi.angle);

  sombra(ctx, L, vivo);

  // Andar no es solo mover las patas: el cuerpo cabecea a cada trípode. Muy
  // poco —medio grado— pero es lo que separa caminar de deslizarse.
  const bamboleo = vivo ? Math.sin(paso) * 0.035 : 0;
  ctx.rotate(bamboleo);

  drawLegs(ctx, paso, c, L, vivo);
  drawBody(ctx, c, hoja, L, vivo);
  drawAntennas(ctx, fagi, paso, c, L, vivo);
  if (fagi.carrying) drawCarried(ctx, fagi.carrying.type, L);

  ctx.restore();
}

// --- luz ------------------------------------------------------------------

// El cuerpo gira; la luz del mundo no. Dentro del dibujo hay que girarla al
// revés para que el lomo brille siempre por el mismo lado del mapa.
function luzLocal(angle) {
  const a = LUZ - angle;
  return { x: Math.cos(a), y: Math.sin(a) };
}

// Volumen de una pieza de quitina: claro por donde entra la luz, el tono propio
// en medio y el canto apagado al otro lado.
function coraza(ctx, x, y, r, base, L, luzT = 0.42, sombraT = 0.6) {
  const g = ctx.createRadialGradient(
    x + L.x * r * 0.5, y + L.y * r * 0.5, r * 0.08,
    x, y, r * 1.18
  );
  g.addColorStop(0, mix(base, '#fff0d4', luzT));
  g.addColorStop(0.46, base);
  g.addColorStop(1, mix(base, '#150c06', sombraT));
  return g;
}

// El filo iluminado de una pieza: solo el arco que da a la luz. Se pinta con el
// recorte de la silueta ya puesto, así que el trazo se come hacia dentro y no
// engorda el contorno.
function filo(ctx, ruta, x, y, r, color, alfa, ancho) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  const a = Math.atan2(L_TMP.y, L_TMP.x);
  ctx.arc(x, y, r * 2.2, a - 1.15, a + 1.15);
  ctx.closePath();
  ctx.clip();
  ruta(ctx);
  ctx.strokeStyle = color;
  ctx.globalAlpha = alfa;
  ctx.lineWidth = ancho;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}
let L_TMP = { x: 0, y: 0 };

// El canto de la pieza: una línea oscura finísima alrededor. Es lo que recorta
// la quitina contra el suelo; sin ella el degradado solo se lee como peluche.
function contorno(ctx, ruta, ancho) {
  ruta(ctx);
  ctx.strokeStyle = 'rgba(26,13,5,0.55)';
  ctx.lineWidth = ancho;
  ctx.stroke();
  ctx.lineWidth = 1;
}

// --- sombra ---------------------------------------------------------------

// La sombra que deja en el suelo: una sola mancha para todo el cuerpo, tendida
// al lado contrario de la luz. Sin ella la hormiga flota.
function sombra(ctx, L, vivo) {
  ctx.save();
  ctx.translate(-L.x * 2.6, -L.y * 2.6);
  ctx.rotate(0.06);
  const g = ctx.createRadialGradient(-3, 0, 1.5, -3, 0, 15);
  g.addColorStop(0, `rgba(6,8,11,${vivo ? 0.42 : 0.3})`);
  g.addColorStop(0.55, 'rgba(6,8,11,0.18)');
  g.addColorStop(1, 'rgba(6,8,11,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(-3, 0, 15, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// --- siluetas -------------------------------------------------------------

// El gáster: un huevo con la punta atrás, no un círculo. La punta es lo que da
// el sentido de la marcha cuando se la ve de lejos.
function gasterPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-3.4, 0);
  ctx.bezierCurveTo(-4.0, -4.3, -7.2, -6.3, -10.4, -6.1);
  ctx.bezierCurveTo(-13.6, -5.9, -16.0, -3.4, -16.4, 0);
  ctx.bezierCurveTo(-16.0, 3.4, -13.6, 5.9, -10.4, 6.1);
  ctx.bezierCurveTo(-7.2, 6.3, -4.0, 4.3, -3.4, 0);
  ctx.closePath();
}

// El mesosoma: el bloque del que salen las patas. Jorobado por delante
// —el pronoto— y caído por detrás, donde arranca la cintura.
function mesosomaPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-1.4, 0);
  ctx.bezierCurveTo(-1.6, -2.6, 0.4, -3.9, 2.4, -3.8);
  ctx.bezierCurveTo(4.2, -3.7, 5.3, -2.6, 5.5, -1.1);
  ctx.bezierCurveTo(5.7, 0, 5.7, 0, 5.5, 1.1);
  ctx.bezierCurveTo(5.3, 2.6, 4.2, 3.7, 2.4, 3.8);
  ctx.bezierCurveTo(0.4, 3.9, -1.6, 2.6, -1.4, 0);
  ctx.closePath();
}

// La cabeza: ancha por detrás y estrechada hacia la boca. Vista desde arriba es
// lo que distingue a una hormiga de un escarabajo.
function cabezaPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(5.8, -2.1);
  ctx.bezierCurveTo(5.8, -4.3, 7.2, -5.0, 8.8, -4.9);
  ctx.bezierCurveTo(10.3, -4.8, 11.2, -3.4, 11.4, -1.7);
  ctx.bezierCurveTo(11.6, -0.6, 11.6, 0.6, 11.4, 1.7);
  ctx.bezierCurveTo(11.2, 3.4, 10.3, 4.8, 8.8, 4.9);
  ctx.bezierCurveTo(7.2, 5.0, 5.8, 4.3, 5.8, 2.1);
  ctx.closePath();
}

// --- patas ----------------------------------------------------------------

// Tres pares, y cada pata tres tramos: fémur, tibia y tarso. El tarso es el que
// toca el suelo, y por eso lleva su pisada debajo.
const PATAS = [
  { x: 4.0, base: 0.78, femur: 5.6, tibia: 6.2, tarso: 3.2 },   // delanteras
  { x: 1.2, base: 1.52, femur: 5.8, tibia: 6.6, tarso: 3.4 },   // medias
  { x: -1.4, base: 2.22, femur: 6.0, tibia: 6.8, tarso: 3.6 },  // traseras
];

function drawLegs(ctx, paso, c, L, vivo) {
  const oscuro = mix(c.patas, '#120a05', 0.45);
  const claro = mix(c.patas, '#ffe2b4', 0.4);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  for (let i = 0; i < PATAS.length; i++) {
    const pata = PATAS[i];
    for (const lado of [-1, 1]) {
      // Trípode: (delantera izq, media der, trasera izq) van en la misma fase.
      const desfase = ((i + (lado > 0 ? 1 : 0)) % 2) * Math.PI;
      const ciclo = Math.sin(paso + desfase);
      const balanceo = vivo ? ciclo * 0.26 : -0.5;
      const ang = (pata.base + balanceo) * lado;

      // La pata que va en el aire se estira un poco menos y se despega: es lo
      // que hace que se vea caminar y no patalear.
      const vuela = vivo ? Math.max(0, ciclo) : 0;
      const rodillaX = pata.x + Math.cos(ang) * pata.femur;
      const rodillaY = Math.sin(ang) * pata.femur;
      const angT = ang + (0.85 - vuela * 0.22) * lado;
      const tobilloX = rodillaX + Math.cos(angT) * pata.tibia;
      const tobilloY = rodillaY + Math.sin(angT) * pata.tibia;
      const angP = angT + (0.55 + vuela * 0.5) * lado;
      const pieX = tobilloX + Math.cos(angP) * pata.tarso;
      const pieY = tobilloY + Math.sin(angP) * pata.tarso;

      // La pisada: solo la que apoya deja sombra, y se le pega al suelo.
      if (vuela < 0.35) {
        ctx.fillStyle = `rgba(8,10,14,${0.3 * (1 - vuela / 0.35)})`;
        ctx.beginPath();
        ctx.ellipse(pieX - L.x * 0.8, pieY - L.y * 0.8, 1.5, 1.0, angP, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cada tramo más fino que el anterior, y el de arriba con su reflejo: una
      // pata de grosor único se lee como alambre.
      const tramo = (x0, y0, x1, y1, w) => {
        ctx.strokeStyle = oscuro;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.strokeStyle = claro;
        ctx.globalAlpha = 0.42;
        ctx.lineWidth = w * 0.38;
        ctx.beginPath();
        ctx.moveTo(x0 + L.x * w * 0.26, y0 + L.y * w * 0.26);
        ctx.lineTo(x1 + L.x * w * 0.26, y1 + L.y * w * 0.26);
        ctx.stroke();
        ctx.globalAlpha = 1;
      };

      tramo(pata.x, 0, rodillaX, rodillaY, 2.4);
      tramo(rodillaX, rodillaY, tobilloX, tobilloY, 1.7);

      // El tarso es fino y sin reflejo: casi un pelo.
      ctx.strokeStyle = oscuro;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(tobilloX, tobilloY);
      ctx.quadraticCurveTo(
        tobilloX + Math.cos(angP) * pata.tarso * 0.6,
        tobilloY + Math.sin(angP) * pata.tarso * 0.6,
        pieX, pieY
      );
      ctx.stroke();

      // La coxa: el muñón grueso donde la pata se enchufa al cuerpo. Sin él las
      // patas parecen clavadas con alfileres.
      ctx.fillStyle = mix(c.patas, '#ffe2b4', 0.18);
      ctx.beginPath();
      ctx.ellipse(pata.x + Math.cos(ang) * 1.6, Math.sin(ang) * 1.6, 1.7, 1.2, ang, 0, Math.PI * 2);
      ctx.fill();

      // Espinas de la tibia: dos pelos tiesos por tramo. Son diminutos y hacen
      // más por el bicho que cualquier otro detalle.
      if (vivo) {
        ctx.strokeStyle = `rgba(${c === PIEL ? '60,34,16' : '40,44,52'},0.55)`;
        ctx.lineWidth = 0.6;
        for (const f of [0.4, 0.75]) {
          const sx = rodillaX + (tobilloX - rodillaX) * f;
          const sy = rodillaY + (tobilloY - rodillaY) * f;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.cos(angT + 1.4 * lado) * 1.8, sy + Math.sin(angT + 1.4 * lado) * 1.8);
          ctx.stroke();
        }
      }
    }
  }
  ctx.lineWidth = 1;
}

export function elipse(ctx, x, y, rx, ry, fill, rot = 0) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

// --- cuerpo ---------------------------------------------------------------

function drawBody(ctx, c, hoja, L, vivo) {
  L_TMP = L;
  const rnd = azar(GRANO);

  gaster(ctx, c, L, vivo, rnd);
  drawHoja(ctx, hoja, L);
  peciolo(ctx, c, L);
  mesosoma(ctx, c, L);
  cabeza(ctx, c, L, vivo, rnd);
}

// El gáster: la pieza grande, y la que más luz recoge. Lleva los terguitos
// —los anillos del abdomen— porque un huevo liso se lee como una gota.
function gaster(ctx, c, L, vivo, rnd) {
  ctx.save();
  gasterPath(ctx);
  ctx.clip();

  ctx.fillStyle = coraza(ctx, -9.6, 0, 7.4, c.gaster, L, 0.34, 0.66);
  ctx.fillRect(-18, -8, 18, 16);

  // Terguitos: los anillos del abdomen. Cada uno monta sobre el de detrás, así
  // que la costura se comba hacia la cola y lleva su labio claro delante. Van
  // tenues a propósito: marcados se leen como las rayas de una pelota.
  ctx.lineCap = 'butt';
  for (const [x, ry] of [[-7.6, 5.7], [-10.8, 5.2], [-13.6, 3.9]]) {
    ctx.strokeStyle = 'rgba(40,20,8,0.24)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(x + 2.4, 0, 2.4, ry, 0, Math.PI * 0.62, Math.PI * 1.38);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,226,176,0.12)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(x + 3.1, 0, 2.4, ry, 0, Math.PI * 0.62, Math.PI * 1.38);
    ctx.stroke();
  }
  ctx.lineCap = 'round';

  // Grano de la quitina: picadura fina, ni dos puntos iguales.
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * 6.4;
    ctx.fillStyle = rnd() < 0.5
      ? `rgba(58,28,10,${0.06 + rnd() * 0.12})`
      : `rgba(255,232,190,${0.04 + rnd() * 0.08})`;
    ctx.beginPath();
    ctx.arc(-9.8 + Math.cos(a) * d, Math.sin(a) * d * 0.85, 0.32 + rnd() * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // El brillo especular: una mancha pequeña, alargada y muy clara por donde
  // entra la luz. Es lo único que dice "esto es duro y pulido".
  if (vivo) {
    ctx.save();
    ctx.translate(-9.8 + L.x * 3.4, L.y * 3.0);
    ctx.rotate(Math.atan2(L.y, L.x) + Math.PI / 2);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 3.2);
    g.addColorStop(0, `rgba(255,240,214,0.34)`);
    g.addColorStop(1, 'rgba(255,240,214,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  contorno(ctx, gasterPath, 0.75);
  filo(ctx, gasterPath, -9.8, 0, 7.4, mix(c.gaster, '#ffeccb', 0.6), 0.32, 0.9);

  // Pelos del gáster: cortos, tiesos y solo por el canto. Se ven contra el
  // suelo y son la diferencia entre un bicho y una pieza de plástico.
  if (!vivo) return;
  ctx.strokeStyle = 'rgba(70,38,16,0.5)';
  ctx.lineWidth = 0.55;
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (0.35 + (i / 10) * 1.3) * (i % 2 ? 1 : -1);
    const x = -9.8 + Math.cos(a) * 6.6;
    const y = Math.sin(a) * 5.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * 1.9, y + Math.sin(a) * 1.9);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

// El peciolo: los dos nuditos de la cintura. Es el rasgo que solo tienen las
// hormigas, y desde arriba es lo que separa el gáster del tórax en vez de que
// se toquen dos óvalos.
function peciolo(ctx, c, L) {
  // La sombra que el gáster y el tórax echan sobre el hueco.
  ctx.fillStyle = 'rgba(24,12,5,0.45)';
  ctx.beginPath();
  ctx.ellipse(-2.5, 0, 2.4, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const [x, r] of [[-3.0, 1.55], [-1.5, 1.35]]) {
    ctx.fillStyle = coraza(ctx, x, 0, r, mix(c.torax, '#2a1708', 0.18), L, 0.4, 0.55);
    ctx.beginPath();
    ctx.ellipse(x, 0, r, r * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// El mesosoma, con su joroba y su cuello. El surco que lo cruza es la sutura
// que separa el pronoto del resto.
function mesosoma(ctx, c, L) {
  ctx.save();
  mesosomaPath(ctx);
  ctx.clip();

  ctx.fillStyle = coraza(ctx, 2.0, 0, 4.4, c.torax, L, 0.4, 0.62);
  ctx.fillRect(-3, -6, 11, 12);

  ctx.strokeStyle = 'rgba(46,24,10,0.4)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(-0.6, 0, 3.4, 4.4, 0, -1.1, 1.1);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,228,182,0.2)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.ellipse(-1.2, 0, 3.4, 4.4, 0, -1.05, 1.05);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.restore();

  contorno(ctx, mesosomaPath, 0.6);
  filo(ctx, mesosomaPath, 2.0, 0, 4.4, mix(c.torax, '#ffeccb', 0.7), 0.45, 1);

  // El cuello: el hueco oscuro por donde la cabeza se mete en el tórax.
  ctx.fillStyle = 'rgba(28,14,6,0.5)';
  ctx.beginPath();
  ctx.ellipse(5.7, 0, 1.3, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

// La cabeza: coraza, ojos compuestos, frente y mandíbulas.
function cabeza(ctx, c, L, vivo, rnd) {
  ctx.save();
  cabezaPath(ctx);
  ctx.clip();

  ctx.fillStyle = coraza(ctx, 8.4, 0, 4.7, c.cabeza, L, 0.4, 0.62);
  ctx.fillRect(4, -6, 10, 12);

  // Los tres ocelos y el surco frontal: la frente de una hormiga no es lisa.
  ctx.strokeStyle = 'rgba(52,26,10,0.34)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(6.6, 0);
  ctx.lineTo(10.6, 0);
  ctx.stroke();

  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * 4.0;
    ctx.fillStyle = `rgba(60,30,12,${0.05 + rnd() * 0.1})`;
    ctx.beginPath();
    ctx.arc(8.4 + Math.cos(a) * d, Math.sin(a) * d * 0.9, 0.3 + rnd() * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  contorno(ctx, cabezaPath, 0.6);
  filo(ctx, cabezaPath, 8.4, 0, 4.7, mix(c.cabeza, '#ffeccb', 0.7), 0.45, 1);

  // El clípeo: la placa de la boca, un poco más clara y encajada al frente.
  ctx.fillStyle = mix(c.cabeza, '#ffdca8', 0.24);
  ctx.beginPath();
  ctx.moveTo(10.2, -1.9);
  ctx.quadraticCurveTo(11.9, -1.2, 11.9, 0);
  ctx.quadraticCurveTo(11.9, 1.2, 10.2, 1.9);
  ctx.quadraticCurveTo(10.9, 0, 10.2, -1.9);
  ctx.fill();

  ojos(ctx, L, vivo);
  mandibulas(ctx, c, L);
}

// Ojos compuestos: pequeños, mates y a los lados de la cabeza, no al frente.
// El ojo de una obrera es una pastilla diminuta; una canica negra y brillante
// convierte al bicho en un muñeco.
function ojos(ctx, L, vivo) {
  for (const lado of [-1, 1]) {
    const x = 7.9;
    const y = 3.5 * lado;
    const giro = 0.4 * lado;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(giro);

    // El reborde: el ojo va encajado en la cabeza, no pegado encima.
    ctx.fillStyle = 'rgba(46,24,10,0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.55, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mate y pardo, no negro charol: el ojo compuesto no refleja como un cristal.
    const g = ctx.createRadialGradient(L.x * 0.5, L.y * 0.4, 0.1, 0, 0, 1.3);
    g.addColorStop(0, vivo ? '#4f4234' : '#565b66');
    g.addColorStop(0.6, vivo ? '#2e241a' : '#43474f');
    g.addColorStop(1, vivo ? '#17100a' : '#2f323a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.25, 0.95, 0, 0, Math.PI * 2);
    ctx.fill();

    // Facetas: dos rayitas cruzadas, lo justo para que no sea una gota lisa.
    ctx.strokeStyle = 'rgba(255,240,214,0.1)';
    ctx.lineWidth = 0.25;
    for (const i of [-0.45, 0.45]) {
      ctx.beginPath();
      ctx.moveTo(-1.05, i);
      ctx.lineTo(1.05, i);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * 1.3, -0.8);
      ctx.lineTo(i * 1.3, 0.8);
      ctx.stroke();
    }

    // Un punto de cielo, pequeño: brilla, pero no como un ojo de muñeco.
    if (vivo) {
      ctx.fillStyle = 'rgba(224,232,242,0.42)';
      ctx.beginPath();
      ctx.ellipse(L.x * 0.55, L.y * 0.45, 0.3, 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// Mandíbulas: dos hoces dentadas que se cruzan por delante de la boca. Son la
// herramienta con la que Fagi carga, así que se dibujan como tal.
function mandibulas(ctx, c, L) {
  const oscuro = mix(c.patas, '#0f0803', 0.35);
  for (const lado of [-1, 1]) {
    ctx.save();
    ctx.scale(1, lado);

    // La hoz: sale ancha de la cabeza, se curva hacia fuera y cierra en punta
    // cruzando por delante de la boca. El canto de dentro va dentado.
    ctx.fillStyle = mix(c.patas, '#3b2009', 0.25);
    ctx.beginPath();
    ctx.moveTo(10.6, 0.9);
    ctx.quadraticCurveTo(13.4, 3.1, 15.8, 0.9);   // canto de fuera
    ctx.quadraticCurveTo(15.2, 0.2, 14.4, -0.1);  // la punta, cruzada
    ctx.quadraticCurveTo(13.6, 1.1, 12.5, 0.8);   // dientes de dentro
    ctx.quadraticCurveTo(11.8, 0.6, 11.0, 0.0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(22,12,4,0.55)';
    ctx.lineWidth = 0.4;
    ctx.stroke();

    // El lomo de la mandíbula, por donde le da la luz.
    ctx.strokeStyle = mix(c.patas, '#ffe2b4', 0.5);
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(11.2, 1.05);
    ctx.quadraticCurveTo(13.4, 2.6, 15.3, 0.9);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  ctx.lineWidth = 1;
}

// La hoja que carga a la espalda. Va apoyada en el gáster, así que echa su
// propia sombra encima: sin ella parecería pintada en el caparazón.
function drawHoja(ctx, hoja, L) {
  ctx.save();
  ctx.translate(-10.4, -0.5);
  ctx.rotate(0.62);

  ctx.fillStyle = 'rgba(20,12,6,0.4)';
  ctx.beginPath();
  ctx.ellipse(-L.x * 1.3, -L.y * 1.3, 5.6, 3.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hoja de dos curvas: con punta y con rabo, no un óvalo.
  const forma = () => {
    ctx.beginPath();
    ctx.moveTo(-4.9, 0);
    ctx.bezierCurveTo(-2.9, -2.7, 2.1, -2.6, 5.0, 0);
    ctx.bezierCurveTo(2.1, 2.6, -2.9, 2.7, -4.9, 0);
    ctx.closePath();
  };

  forma();
  const g = ctx.createLinearGradient(L.x * -5, L.y * -3, L.x * 5, L.y * 3);
  g.addColorStop(0, mix(hoja.relleno, '#0e2414', 0.45));
  g.addColorStop(0.55, hoja.relleno);
  g.addColorStop(1, hoja.luz);
  ctx.fillStyle = g;
  ctx.fill();

  // Nervio central y secundarios: es lo que la hace hoja y no pegatina.
  // Doblada por el nervio: media hoja mira a la luz y la otra media se queda a
  // la sombra. Es lo que la separa del caparazón en el que se apoya.
  ctx.save();
  forma();
  ctx.clip();
  ctx.fillStyle = 'rgba(12,26,16,0.34)';
  ctx.beginPath();
  ctx.moveTo(-5.2, 0);
  ctx.quadraticCurveTo(0, -0.4, 5.2, 0);
  ctx.lineTo(5.2, 3.2);
  ctx.lineTo(-5.2, 3.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = hoja.nervio;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-4.7, 0);
  ctx.quadraticCurveTo(0, -0.4, 4.9, 0);
  ctx.stroke();

  // Y su canto, para que no se funda con la hormiga.
  forma();
  ctx.strokeStyle = 'rgba(18,34,22,0.45)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.lineWidth = 0.4;
  ctx.globalAlpha = 0.7;
  for (let i = -2; i <= 2; i++) {
    const x = i * 1.5;
    for (const lado of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x, -0.1 * i);
      ctx.quadraticCurveTo(x + 1.0, lado * 1.2, x + 1.5, lado * 2.2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
  ctx.restore();
}

// Lo que lleva a cuestas: agarrado por las mandíbulas, con su volumen y su
// sombra sobre la cabeza.
function drawCarried(ctx, type, L) {
  const spec = POINT_TYPES[type];
  const r = spec.radius + 1;
  const x = 14.6;

  ctx.fillStyle = 'rgba(14,9,5,0.4)';
  ctx.beginPath();
  ctx.ellipse(x - L.x * r * 0.5, -L.y * r * 0.5, r * 0.95, r * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  const g = ctx.createRadialGradient(x + L.x * r * 0.45, L.y * r * 0.45, r * 0.1, x, 0, r * 1.2);
  g.addColorStop(0, mix(spec.color, '#ffffff', 0.45));
  g.addColorStop(0.5, spec.color);
  g.addColorStop(1, mix(spec.color, '#100a06', 0.55));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, 0, r, 0, Math.PI * 2);
  ctx.fill();
}

// --- antenas --------------------------------------------------------------

// Las antenas son su olfato: al rastrear un olor se abren y se inclinan hacia
// el lado por el que le llega más fuerte. Van acodadas —escapo recto, codo y
// funículo curvo— porque así son las de las hormigas y no las de un caracol.
function drawAntennas(ctx, fagi, paso, c, L, vivo) {
  const rastreando = fagi.targetKind === 'scent';
  const abre = rastreando ? 0.85 : 0.6;
  const sesgo = rastreando ? fagi.castSide * 0.2 : 0;
  const tiemblo = vivo ? Math.sin(paso * 0.8) * 0.13 : -0.35;

  const oscuro = mix(c.patas, '#120a05', 0.35);
  const claro = mix(c.patas, '#ffe2b4', 0.4);
  ctx.lineCap = 'round';

  for (const lado of [-1, 1]) {
    const a = (abre + tiemblo) * lado + sesgo;
    const bx = 10.0;
    const by = 1.6 * lado;
    // Escapo: el primer tramo, recto y grueso, desde el hueco de la antena.
    const codoX = bx + Math.cos(a) * 5.4;
    const codoY = by + Math.sin(a) * 5.4;
    // Funículo: el segundo, más fino, que se dobla hacia delante.
    const b = a + 0.5 * lado - 0.35;
    const puntaX = codoX + Math.cos(b) * 6.2;
    const puntaY = codoY + Math.sin(b) * 6.2;

    ctx.strokeStyle = oscuro;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(codoX, codoY);
    ctx.stroke();

    ctx.strokeStyle = claro;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.moveTo(bx + L.x * 0.4, by + L.y * 0.4);
    ctx.lineTo(codoX + L.x * 0.4, codoY + L.y * 0.4);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = oscuro;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(codoX, codoY);
    ctx.quadraticCurveTo(
      codoX + Math.cos(b) * 3.4,
      codoY + Math.sin(b) * 3.4 - 0.8 * lado,
      puntaX, puntaY
    );
    ctx.stroke();

    // La maza: el funículo no acaba en bola, se va engordando en los últimos
    // artejos. Una punta redonda y clara se lee como cerilla.
    const maza = mix(c.punta, c.patas, 0.45);
    ctx.strokeStyle = maza;
    ctx.lineWidth = 1.45;
    ctx.beginPath();
    ctx.moveTo(codoX + Math.cos(b) * 4.4, codoY + Math.sin(b) * 4.4);
    ctx.lineTo(puntaX, puntaY);
    ctx.stroke();

    ctx.fillStyle = mix(maza, '#fff0d4', 0.3);
    ctx.beginPath();
    ctx.ellipse(puntaX, puntaY, 0.95, 0.72, b, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 1;
}
