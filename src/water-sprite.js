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

import { LAKE } from './config.js';
import { lienzo, mix, azar, semillaDe, ruido, cacheSprite, detalle, estampar } from './sprite-kit.js';

const lagos = new Map();       // clave: semilla|radio|detalle

// Estanque fotográfico. El motor procedural sigue disponible como respaldo;
// cuando la imagen termina de cargar se usa esta base y se añaden encima unas
// ondas vivas muy sutiles para que no parezca una fotografía inmóvil.
const lagoRealista = new Image();
let lagoRealistaListo = false;
lagoRealista.onload = () => { lagoRealistaListo = true; };
lagoRealista.src = '/assets/pond-natural.webp';

const LUZ = -Math.PI * 0.72;   // la misma luz que el suelo, la roca y el árbol
const LX = Math.cos(LUZ);
const LY = Math.sin(LUZ);

const HONDO = '#16384a';       // el centro, donde no se ve el fondo
const MEDIO = '#1f5f79';       // agua con fondo lejano
const VADO = '#5c8f86';        // el poco fondo de la orilla, verdoso
const ARENA = '#7d7154';
const BARRO = '#2e281e';
const JUNCO = ['#5a6e3f', '#6b7d47', '#475a37'];

// La orilla de un lago: un círculo al que se le suman tres ondas lentas. Las
// mismas para el lienzo quieto y para lo que se dibuja vivo encima, así que el
// perfil se saca de la semilla y no del azar de cada pasada.
function perfil(semilla, mezcla, amplitud) {
  const rnd = azar((semilla ^ mezcla) >>> 0);
  const ondas = [];
  for (let i = 0; i < 3; i++) {
    ondas.push({
      k: 2 + i * 2 + ((rnd() * 2) | 0),
      amp: (amplitud / (i + 1)) * (0.7 + rnd() * 0.6),
      fase: rnd() * Math.PI * 2,
    });
  }
  return (a) => {
    let v = 1;
    for (const o of ondas) v += Math.sin(a * o.k + o.fase) * o.amp;
    return v;
  };
}

// Traza el contorno en el contexto que se le dé. 72 tramos: a este tamaño ya no
// se distinguen de una curva.
function contorno(ctx, cx, cy, r, forma, pasos = 72) {
  ctx.beginPath();
  for (let i = 0; i <= pasos; i++) {
    const a = (i / pasos) * Math.PI * 2;
    const rr = r * forma(a);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawLake(ctx, o, spec, r, wind, ahora) {
  if (lagoRealistaListo) {
    dibujarLagoRealista(ctx, o, r, wind, ahora);
    return;
  }
  const z = detalle();
  const semilla = semillaDe(o);
  const img = cacheSprite(lagos, `${semilla}|${Math.round(r)}|${z}`,
    () => pintarLago(semilla, Math.round(r), spec.color, z), 24);
  estampar(ctx, img, o.x, o.y, z);

  superficie(ctx, o, r, semilla, wind, ahora);
  juncos(ctx, o, r, semilla, wind, ahora);
}

function dibujarLagoRealista(ctx, o, r, wind, ahora) {
  const semilla = semillaDe(o) >>> 0;
  const giro = (((semilla >>> 7) & 255) / 255 - 0.5) * 0.18;
  const lado = r * (2.82 + ((semilla >>> 16) & 31) / 240);

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(giro);
  ctx.shadowColor = 'rgba(9,13,10,0.58)';
  ctx.shadowBlur = r * 0.15;
  ctx.filter = 'saturate(1.12) brightness(0.93) contrast(1.14)';
  // Se estampa cuadrado a propósito: el original ancho se vuelve una charca
  // compacta e irregular y encaja mejor con el radio real donde Fagi bebe.
  ctx.drawImage(lagoRealista, -lado / 2, -lado / 2, lado, lado);
  ctx.restore();

  // Reflejos móviles contenidos en la zona central del agua. No repintan la
  // costa ni producen el viejo disco azul: solo alteran la superficie.
  const t = ahora / 1000;
  const viento = wind?.angle ?? 0;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(viento);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.78, r * 0.62, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const fase = (semilla % 997) * 0.01 + i * 1.73;
    const y = Math.sin(fase * 2.1) * r * 0.48;
    const x = ((t * (3.2 + i * 0.17) + i * r * 0.29) % (r * 1.7)) - r * 0.85;
    const largo = r * (0.12 + (i % 3) * 0.035);
    const alfa = 0.07 + Math.max(0, Math.sin(t * 0.85 + fase)) * 0.08;
    ctx.strokeStyle = `rgba(220,239,235,${alfa})`;
    ctx.lineWidth = Math.max(0.65, r * 0.009);
    ctx.beginPath();
    ctx.moveTo(x, y - largo / 2);
    ctx.quadraticCurveTo(x + r * 0.025, y, x, y + largo / 2);
    ctx.stroke();
  }

  const brillo = ctx.createRadialGradient(
    LX * r * 0.35, LY * r * 0.35, 0,
    LX * r * 0.2, LY * r * 0.2, r * 0.95
  );
  brillo.addColorStop(0, `rgba(222,239,236,${0.08 + Math.sin(t * 0.3) * 0.02})`);
  brillo.addColorStop(1, 'rgba(222,239,236,0)');
  ctx.fillStyle = brillo;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

// --- lo quieto ------------------------------------------------------------

function pintarLago(semilla, R, color, z) {
  const rnd = azar((semilla ^ 0x3c6ef372) >>> 0);
  const H = Math.ceil(R * (1 + LAKE.orillaAncho) + 8);
  const S = H * 2 * z;
  const c = lienzo(S, S);
  const ctx = c.getContext('2d');
  ctx.scale(z, z);            // a partir de aquí se piensa en píxeles de mundo
  const cx = H;
  const cy = H;

  const orilla = perfil(semilla, 0x51ed270b, LAKE.bordeOnda);
  const hondo = perfil(semilla, 0x2f9a1c07, LAKE.bordeOnda * 1.8);

  barro(ctx, cx, cy, R, orilla, rnd);

  // De aquí en adelante, todo dentro del agua.
  ctx.save();
  contorno(ctx, cx, cy, R, orilla);
  ctx.clip();

  // El hondo no cae en el centro geométrico: un lago tiene la parte honda donde
  // le toca, y un degradado centrado se lee como una diana.
  const desvio = rnd() * Math.PI * 2;
  const ox = cx + Math.cos(desvio) * R * 0.16;
  const oy = cy + Math.sin(desvio) * R * 0.13;

  // El fondo: claro y verdoso en el vado, azul oscuro al ganar hondo.
  const agua = ctx.createRadialGradient(ox, oy, R * 0.12, cx, cy, R);
  agua.addColorStop(0, HONDO);
  agua.addColorStop(0.45, mix(HONDO, MEDIO, 0.7));
  agua.addColorStop(0.72, MEDIO);
  agua.addColorStop(0.9, mix(VADO, ARENA, 0.22));
  agua.addColorStop(1, mix(VADO, ARENA, 0.45));
  ctx.fillStyle = agua;
  ctx.fillRect(0, 0, S, S);

  // Arena del vado: una franja pegada a la orilla, rota a manchas.
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.82 + rnd() * 0.16);
    ctx.globalAlpha = 0.06 + rnd() * 0.1;
    ctx.fillStyle = ARENA;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d,
      R * (0.07 + rnd() * 0.1), R * (0.04 + rnd() * 0.06), a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Piedras del fondo: se ven a través del agua, así que van apagadas y con el
  // brillo por donde entra la luz. Solo junto a la orilla: en el hondo no se ven.
  for (let i = 0; i < LAKE.piedras; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.55 + rnd() * 0.36);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.025 + rnd() * 0.045);
    const hundida = 0.5 + (d / R) * 0.5;      // más cerca de la orilla, más nítida
    ctx.globalAlpha = 0.2 + hundida * 0.35;
    ctx.fillStyle = mix('#6b6a5e', '#3b4a4a', rnd() * 0.7);
    ctx.beginPath();
    ctx.ellipse(x, y, rad, rad * (0.6 + rnd() * 0.3), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(214,228,214,0.25)';
    ctx.lineWidth = Math.max(0.4, rad * 0.22);
    ctx.beginPath();
    ctx.ellipse(x, y, rad * 0.82, rad * 0.5, 0, LUZ - 1.1, LUZ + 1.1);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;

  // Algas: manchas oscuras pegadas a la orilla, que es donde hay poco fondo y
  // luz suficiente. Son lo que quita al agua la cara de disco pintado.
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.66 + rnd() * 0.3);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.06 + rnd() * 0.12);
    ctx.globalAlpha = 0.1 + rnd() * 0.18;
    ctx.fillStyle = mix('#33523f', '#1d3230', rnd());
    ctx.beginPath();
    for (let j = 0; j <= 12; j++) {
      const b = (j / 12) * Math.PI * 2;
      const rr = rad * (0.6 + Math.sin(b * 3 + a) * 0.25 + rnd() * 0.2);
      const px = x + Math.cos(b) * rr;
      const py = y + Math.sin(b) * rr * 0.8;
      if (j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // El escalón del hondo: donde el fondo cae de golpe se ve un borde oscuro.
  ctx.globalAlpha = 0.28;
  contorno(ctx, ox, oy, R * LAKE.hondoDesde, hondo, 48);
  const pozo = ctx.createRadialGradient(ox, oy, R * LAKE.hondoDesde * 0.4, ox, oy, R * LAKE.hondoDesde);
  pozo.addColorStop(0, 'rgba(6,20,28,0.4)');
  pozo.addColorStop(1, 'rgba(6,20,28,0)');
  ctx.fillStyle = pozo;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Olas. Trazos largos y tumbados, tenues y torcidos, repartidos por toda la
  // superficie: es la textura que dice "esto es agua" antes que el color. Van
  // cocidas en el lienzo porque son muchas; lo que se mueve luego encima son
  // solo los reflejos.
  ctx.lineCap = 'round';
  for (let i = 0; i < 60; i++) {
    const y = cy + (rnd() - 0.5) * R * 2;
    const x = cx + (rnd() - 0.5) * R * 1.7;
    const largo = R * (0.08 + rnd() * 0.18);
    const claro = rnd() < 0.55;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rnd() - 0.5) * 0.5);     // ninguna acaba paralela a la de al lado
    ctx.strokeStyle = claro
      ? `rgba(206,232,238,${0.03 + rnd() * 0.05})`
      : `rgba(10,30,40,${0.03 + rnd() * 0.06})`;
    ctx.lineWidth = Math.max(0.6, R * (0.006 + rnd() * 0.012));
    ctx.beginPath();
    ctx.moveTo(-largo / 2, 0);
    ctx.bezierCurveTo(
      -largo * 0.2, -largo * 0.22 * (rnd() + 0.4),
      largo * 0.2, largo * 0.22 * (rnd() + 0.4),
      largo / 2, 0
    );
    ctx.stroke();
    ctx.restore();
  }
  ctx.lineWidth = 1;

  // Cáusticas del vado: la red de luz que el sol dibuja en el fondo de poca
  // agua. Solo donde se ve el fondo —en el hondo no llega—, y es lo que hace
  // que la orilla se lea como agua POCO PROFUNDA y no como pintura clara.
  for (let i = 0; i < LAKE.causticas; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.62 + rnd() * 0.33);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const largo = R * (0.05 + rnd() * 0.1);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rnd() * Math.PI);
    ctx.strokeStyle = `rgba(228,246,238,${0.05 + rnd() * 0.08})`;
    ctx.lineWidth = Math.max(0.5, R * 0.007);
    ctx.beginPath();
    ctx.moveTo(-largo / 2, 0);
    ctx.quadraticCurveTo(0, largo * (rnd() - 0.5) * 0.9, largo / 2, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.lineWidth = 1;

  // Manchas de fondo: el fondo de una charca no está a la misma hondura por
  // todas partes. Unas manchas anchas y muy tenues bastan para que el azul deje
  // de leerse como una capa de pintura.
  for (let i = 0; i < 20; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * R * 0.9;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.14 + rnd() * 0.26);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const hondo = rnd() < 0.55;
    g.addColorStop(0, hondo ? 'rgba(10,34,46,0.16)' : 'rgba(126,150,128,0.1)');
    g.addColorStop(1, hondo ? 'rgba(10,34,46,0)' : 'rgba(126,150,128,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grano del agua: rompe el degradado, que si no se ve como plástico. Celda
  // grande y flojo: apretado se le ve la rejilla del ruido y parece plástico de
  // burbujas, que es peor que el degradado liso.
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(ruido(Math.ceil(S / z), Math.ceil(S / z), rnd, 7, 4), 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  // Sombra de la orilla sobre el agua: el agua pegada a la tierra está en
  // penumbra por el lado que da la luz.
  const penumbra = ctx.createRadialGradient(
    cx + LX * R * 0.25, cy + LY * R * 0.25, R * 0.55,
    cx + LX * R * 0.25, cy + LY * R * 0.25, R * 1.12
  );
  penumbra.addColorStop(0, 'rgba(10,22,26,0)');
  penumbra.addColorStop(1, 'rgba(10,22,26,0.38)');
  ctx.fillStyle = penumbra;
  ctx.fillRect(0, 0, S, S);
  ctx.restore();

  // El canto del agua. Una línea entera y clara alrededor se lee como el borde
  // de una pompa, así que va por tramos: espuma donde rompe y nada donde no.
  // Debajo, apagadísimo, el color con el que el agua figura en el panel.
  contorno(ctx, cx, cy, R, orilla);
  ctx.strokeStyle = mix(color, '#0d2530', 0.5);
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = Math.max(0.8, R * 0.015);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const a0 = rnd() * Math.PI * 2;
    const largo = 0.2 + rnd() * 0.5;          // en radianes
    ctx.beginPath();
    for (let j = 0; j <= 10; j++) {
      const a = a0 + (j / 10) * largo;
      const rr = R * orilla(a);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(206,228,226,${0.1 + rnd() * 0.14})`;
    ctx.lineWidth = Math.max(0.8, R * (0.012 + rnd() * 0.016));
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  return c;
}

// La tierra mojada de alrededor, con guijarros. Va por fuera del agua: es lo que
// separa el lago del suelo seco sin que parezca pegado con tijera.
function barro(ctx, cx, cy, R, orilla, rnd) {
  const fuera = perfil(rnd() * 1e9 | 0, 0x1b873593, LAKE.bordeOnda * 1.4);
  const ancho = 1 + LAKE.orillaAncho;

  ctx.save();
  contorno(ctx, cx, cy, R * ancho, fuera);
  contorno(ctx, cx, cy, R, orilla);          // el agua queda fuera del relleno
  ctx.clip('evenodd');
  const anillo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * ancho);
  anillo.addColorStop(0, 'rgba(38,32,23,0.85)');
  anillo.addColorStop(0.45, 'rgba(48,41,29,0.55)');
  anillo.addColorStop(1, 'rgba(48,41,29,0)');
  ctx.fillStyle = anillo;
  ctx.fillRect(0, 0, R * 4, R * 4);

  // Guijarros de la orilla, medio enterrados en el barro.
  for (let i = 0; i < 24; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (1.0 + rnd() * LAKE.orillaAncho);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.02 + rnd() * 0.035);
    ctx.fillStyle = 'rgba(12,12,14,0.35)';
    ctx.beginPath();
    ctx.ellipse(x - LX * rad * 0.5, y - LY * rad * 0.5, rad * 1.1, rad * 0.75, a, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mix('#6a6458', BARRO, rnd() * 0.6);
    ctx.beginPath();
    ctx.ellipse(x, y, rad, rad * 0.68, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// --- lo vivo --------------------------------------------------------------

// Reflejos y ondas. Todo recortado al agua, para que nada se salga a la tierra.
function superficie(ctx, o, r, semilla, wind, ahora) {
  const t = ahora / 1000;
  const orilla = perfil(semilla, 0x51ed270b, LAKE.bordeOnda);
  const va = wind?.angle ?? 0;

  ctx.save();
  contorno(ctx, o.x, o.y, r, orilla);
  ctx.clip();

  // La sábana de luz del cielo: entra por donde entra la luz y respira.
  const respira = 0.8 + Math.sin(t * 0.35) * 0.2;
  const luz = ctx.createRadialGradient(
    o.x + LX * r * 0.45, o.y + LY * r * 0.45, 0,
    o.x + LX * r * 0.3, o.y + LY * r * 0.3, r * 1.1
  );
  luz.addColorStop(0, `rgba(226,240,246,${0.16 * respira})`);
  luz.addColorStop(0.5, `rgba(160,200,214,${0.07 * respira})`);
  luz.addColorStop(1, 'rgba(160,200,214,0)');
  ctx.fillStyle = luz;
  ctx.fillRect(o.x - r * 1.2, o.y - r * 1.2, r * 2.4, r * 2.4);

  // Bandas de cielo: franjas anchas y tenues que cruzan el agua y se arrastran
  // despacio. Es el reflejo, y es lo que separa una superficie de un disco.
  for (let i = 0; i < 2; i++) {
    const fase = i * 2.1;
    const y = o.y + (i - 0.5) * r * 0.5 + Math.sin(t * 0.18 + fase) * r * 0.05;
    const banda = ctx.createLinearGradient(0, y - r * 0.14, 0, y + r * 0.14);
    banda.addColorStop(0, 'rgba(214,236,244,0)');
    banda.addColorStop(0.5, `rgba(214,236,244,${0.028 + 0.018 * Math.sin(t * 0.3 + fase)})`);
    banda.addColorStop(1, 'rgba(214,236,244,0)');
    ctx.fillStyle = banda;
    ctx.fillRect(o.x - r * 1.2, y - r * 0.14, r * 2.4, r * 0.28);
  }

  // Rizo del viento: la superficie de una charca no tiembla al azar, se riza en
  // crestas cortas perpendiculares al viento que corren en su dirección. Es lo
  // que ata el agua al MISMO viento que dobla los juncos y arrastra los olores.
  //
  // Las crestas van repartidas al azar, no en rejilla: alineadas se leen como
  // rayones, y una charca rayada no parece agua.
  const riza = azar((semilla ^ 0x1f83d9ab) >>> 0);
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(va);
  ctx.lineCap = 'round';
  for (let i = 0; i < LAKE.rizos; i++) {
    const y = (riza() - 0.5) * r * 1.9;
    // Cada cresta corre a lo suyo y vuelve a entrar por el otro lado.
    const x = ((riza() + t * (0.02 + riza() * 0.03)) % 1 - 0.5) * r * 2;
    if (Math.hypot(x, y) > r * 0.95) continue;
    const largo = r * (0.05 + riza() * 0.08);
    const alfa = 0.04 + 0.05 * Math.max(0, Math.sin(t * 1.1 + y * 0.25));
    ctx.strokeStyle = `rgba(214,238,244,${alfa})`;
    ctx.lineWidth = Math.max(0.5, r * 0.007);
    ctx.beginPath();
    ctx.moveTo(x, y - largo / 2);
    ctx.quadraticCurveTo(x + r * 0.022, y, x, y + largo / 2);
    ctx.stroke();
    // Y su sombra justo detrás: una cresta sin valle no levanta.
    ctx.strokeStyle = `rgba(8,26,34,${alfa * 0.7})`;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.012, y - largo / 2);
    ctx.quadraticCurveTo(x + r * 0.01, y, x - r * 0.012, y + largo / 2);
    ctx.stroke();
  }
  ctx.restore();

  // Destellos: rayitas tumbadas que se encienden y se apagan cada una a su aire.
  // Es lo que hace que el agua parezca moverse aunque no se mueva nada.
  const rnd = azar((semilla ^ 0x7c3af219) >>> 0);
  ctx.lineCap = 'round';
  for (let i = 0; i < LAKE.destellos; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.85;
    const fase = rnd() * Math.PI * 2;
    const largo = r * (0.1 + rnd() * 0.16);
    const alfa = Math.max(0, Math.sin(t * (0.5 + rnd() * 0.5) + fase)) ** 3;
    if (alfa < 0.02) continue;
    const x = o.x + Math.cos(a) * d + Math.sin(t * 0.6 + fase) * r * 0.02;
    const y = o.y + Math.sin(a) * d * 0.9;
    ctx.strokeStyle = `rgba(232,246,250,${alfa * 0.2})`;
    ctx.lineWidth = Math.max(0.7, r * 0.014);
    ctx.beginPath();
    ctx.moveTo(x - largo / 2, y);
    ctx.quadraticCurveTo(x, y - r * 0.02, x + largo / 2, y);
    ctx.stroke();
  }

  // Ondas: círculos que nacen en un punto y se abren hasta apagarse. Van
  // serpenteados con el mismo truco que la orilla y muy tenues: una
  // circunferencia limpia sobre el agua se lee como un dibujo, no como una onda.
  for (let i = 0; i < LAKE.ondas; i++) {
    const cxo = o.x + (rnd() - 0.5) * r * 0.9;
    const cyo = o.y + (rnd() - 0.5) * r * 0.8;
    const forma = perfil(semilla ^ (i * 0x45d9f3b), 0x119de1f3, 0.025);
    const periodo = 3.4 + rnd() * 2.6;
    const paso = ((t + i * 1.7) % periodo) / periodo;
    const rad = r * (0.08 + paso * 0.5);
    // Se apaga al nacer y al morir: una onda que aparece de golpe se ve dibujada.
    const vida = Math.sin(paso * Math.PI) * (1 - paso);
    ctx.strokeStyle = `rgba(216,238,242,${vida * 0.1})`;
    ctx.lineWidth = Math.max(0.5, r * 0.009 * (1 - paso * 0.5));
    contorno(ctx, cxo, cyo, rad, forma, 44);
    ctx.stroke();
    // Y el valle que la sigue por dentro.
    ctx.strokeStyle = `rgba(8,26,34,${vida * 0.07})`;
    ctx.lineWidth = Math.max(0.5, r * 0.008);
    contorno(ctx, cxo, cyo, rad * 0.93, forma, 44);
    ctx.stroke();
  }

  // Lo que flota: motas de polen y trocitos de hoja que el viento arrastra por
  // la superficie y se amontonan en la orilla de sotavento. Son diminutas y son
  // lo que separa un agua viva de un cristal azul.
  for (let i = 0; i < LAKE.motas; i++) {
    const a = rnd() * Math.PI * 2;
    const base = Math.sqrt(rnd()) * r * 0.9;
    const deriva = ((t * 0.05 + rnd()) % 1);
    const x = o.x + Math.cos(a) * base + Math.cos(va) * deriva * r * 0.5;
    const y = o.y + Math.sin(a) * base * 0.92 + Math.sin(va) * deriva * r * 0.5;
    if (Math.hypot(x - o.x, y - o.y) > r * 0.97) continue;
    const rad = r * (0.006 + rnd() * 0.012);
    ctx.fillStyle = rnd() < 0.5
      ? `rgba(206,196,142,${0.18 + rnd() * 0.2})`
      : `rgba(70,84,58,${0.2 + rnd() * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rad * 1.4, rad, a, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.lineWidth = 1;
  ctx.restore();
}

// Juncos de la orilla. Se doblan a favor del viento —el mismo que lleva los
// olores— y cabecean despacio, cada mata con su fase.
function juncos(ctx, o, r, semilla, wind, ahora) {
  const t = ahora / 1000;
  const rnd = azar((semilla ^ 0x9e3779b1) >>> 0);
  const orilla = perfil(semilla, 0x51ed270b, LAKE.bordeOnda);
  const vx = Math.cos(wind?.angle ?? 0);
  const vy = Math.sin(wind?.angle ?? 0) * 0.6;

  ctx.lineCap = 'round';
  for (let i = 0; i < LAKE.juncos; i++) {
    const a = rnd() * Math.PI * 2;
    if (rnd() < 0.35) continue;               // no rodean el lago entero
    const d = r * orilla(a) * (0.97 + rnd() * 0.12);
    const x = o.x + Math.cos(a) * d;
    const y = o.y + Math.sin(a) * d;
    const alto = r * (0.11 + rnd() * 0.12);
    const fase = rnd() * Math.PI * 2;
    const dobla = 0.5 + Math.sin(t * 1.3 + fase) * 0.3;
    const tono = JUNCO[(rnd() * JUNCO.length) | 0];

    ctx.fillStyle = 'rgba(10,16,14,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y, alto * 0.35, alto * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    const briznas = 3 + ((rnd() * 3) | 0);
    for (let j = 0; j < briznas; j++) {
      const largo = alto * (0.7 + rnd() * 0.7);
      const px = x + (rnd() - 0.5) * alto * 0.4;
      const tx = px + vx * largo * dobla * 0.8;
      const ty = y - largo + vy * largo * dobla * 0.5;
      ctx.strokeStyle = tono;
      ctx.globalAlpha = 0.55 + rnd() * 0.4;
      ctx.lineWidth = Math.max(0.6, alto * 0.085);
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.quadraticCurveTo(px + vx * largo * dobla * 0.2, y - largo * 0.6, tx, ty);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.lineWidth = 1;
}
