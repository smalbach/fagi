// El nido: un hormiguero de tierra excavada. Igual que la roca, el montículo se
// pinta UNA vez en su propio lienzo y luego solo se estampa; lo único que se
// repinta cada fotograma es la boca, que respira cuando Fagi duerme dentro.
//
// Un hormiguero no tiene canto: es tierra suelta amontonada, así que el borde
// no se dibuja, se desvanece. Todo el volumen se construye con manchas blandas
// y una máscara irregular, para que no se lea como un disco.
//
// El montículo llena el radio de uso del nido: lo que se ve es exactamente la
// zona donde Fagi está "en casa".

import { lienzo, mix, azar, semillaDe, ruido, detalle, estampar } from './sprite-kit.js';

const sprites = new Map();   // clave: semilla|radio|color

const BOCA = 0.17;           // la boca, en fracción del radio
const LUZ = -Math.PI * 0.72; // misma luz que las rocas: arriba a la izquierda
const LX = Math.cos(LUZ);
const LY = Math.sin(LUZ);

export function drawNest(ctx, o, spec, r) {
  const z = detalle();
  const img = spriteDe(semillaDe(o), Math.round(r * z), spec.color);
  estampar(ctx, img, o.x, o.y, z);
}

// La boca por dentro. Se pinta aparte del montículo porque late: con Fagi
// dentro se le enciende un rescoldo tenue que sube y baja como una respiración.
export function drawNestMouth(ctx, o, r, ocupado, ahora) {
  const rb = r * BOCA;

  // El agujero: negro en el centro y con la pared del túnel algo menos negra
  // por el lado que le entra la luz.
  const tunel = ctx.createRadialGradient(
    o.x - LX * rb * 0.45, o.y - LY * rb * 0.45, rb * 0.15,
    o.x, o.y, rb * 1.05
  );
  tunel.addColorStop(0, '#000000');
  tunel.addColorStop(0.7, '#0c0a08');
  tunel.addColorStop(1, '#221a12');
  ctx.fillStyle = tunel;
  ctx.beginPath();
  ctx.ellipse(o.x, o.y, rb, rb * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();

  if (ocupado) {
    const late = 0.5 + 0.5 * Math.sin(ahora / 900);
    const brasa = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, rb * 1.6);
    brasa.addColorStop(0, `rgba(226,168,74,${0.08 + late * 0.14})`);
    brasa.addColorStop(1, 'rgba(226,168,74,0)');
    ctx.fillStyle = brasa;
    ctx.beginPath();
    ctx.arc(o.x, o.y, rb * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function spriteDe(semilla, r, color) {
  const clave = `${semilla}|${r}|${color}`;
  const guardado = sprites.get(clave);
  if (guardado) return guardado;
  const img = pintarNido(semilla, r, color);
  sprites.set(clave, img);
  return img;
}

// Una mancha blanda: se usan a montones, para el bulto y para la máscara.
function mancha(ctx, x, y, rad, alfa, color = '255,255,255') {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
  g.addColorStop(0, `rgba(${color},${alfa})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fill();
}

// La silueta: un montón de tierra, no un círculo. Se hace con manchas sueltas
// repartidas por el borde, así que el contorno queda roto y deshilachado, y
// además se difumina hacia fuera. Nunca pasa del radio.
function mascara(S, r, rnd) {
  const c = lienzo(S, S);
  const ctx = c.getContext('2d');
  const cx = S / 2;
  const cy = S / 2;

  const cuerpo = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 0.97);
  cuerpo.addColorStop(0, 'rgba(255,255,255,1)');
  cuerpo.addColorStop(0.62, 'rgba(255,255,255,0.97)');
  cuerpo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = cuerpo;
  ctx.fillRect(0, 0, S, S);

  // Lengüetas de tierra: el montón no acaba a la misma distancia por todos
  // lados. Unas comen hacia dentro y otras asoman, siempre dentro del radio.
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + rnd() * 0.2;
    const d = r * (0.6 + rnd() * 0.22);
    mancha(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.13 + rnd() * 0.16), 0.5 + rnd() * 0.4);
  }

  // Y se le comen mordiscos al borde para que no quede una orla regular.
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2;
    const d = r * (0.84 + rnd() * 0.2);
    mancha(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.1 + rnd() * 0.2), 0.5 + rnd() * 0.5);
  }
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

function pintarNido(semilla, r, color) {
  const rnd = azar(semilla);
  const pad = Math.ceil(r * 0.45) + 8;
  const S = (r + pad) * 2;
  const cx = S / 2;
  const cy = S / 2;
  const rb = r * BOCA;

  // Tierra removida: parda y apagada, con una pizca del ocre del nido para que
  // se lea como suya y no como otra piedra más.
  const tierra = mix('#5b452e', color, 0.12);
  const claro = mix(tierra, '#d8bd90', 0.55);
  const oscuro = mix(tierra, '#171109', 0.62);

  // --- El montículo, en su propio lienzo, para poder recortarlo con la máscara.
  const m = lienzo(S, S);
  const mc = m.getContext('2d');

  mc.fillStyle = tierra;
  mc.fillRect(0, 0, S, S);

  // Volumen del cono. La parte alta es el aro de alrededor de la boca: hacia
  // fuera baja al suelo, y hacia dentro cae al agujero.
  const cono = mc.createRadialGradient(cx, cy, rb * 1.1, cx, cy, r);
  cono.addColorStop(0, mix(tierra, '#cdae7d', 0.3));
  cono.addColorStop(0.35, mix(tierra, '#8a6c46', 0.25));
  cono.addColorStop(0.75, tierra);
  cono.addColorStop(1, oscuro);
  mc.fillStyle = cono;
  mc.fillRect(0, 0, S, S);

  // La luz de un lado: bulto, no diana.
  const lado = mc.createLinearGradient(cx + LX * r, cy + LY * r, cx - LX * r, cy - LY * r);
  lado.addColorStop(0, 'rgba(255,240,210,0.34)');
  lado.addColorStop(0.42, 'rgba(0,0,0,0)');
  lado.addColorStop(1, 'rgba(10,8,6,0.52)');
  mc.fillStyle = lado;
  mc.fillRect(0, 0, S, S);

  // Terrones: manchas blandas, unas a la luz y otras a la sombra. Son las que
  // rompen el tono liso y hacen que parezca tierra echada a paladas.
  for (let i = 0; i < 34; i++) {
    const a = rnd() * Math.PI * 2;
    const d = rb * 1.2 + Math.sqrt(rnd()) * (r * 0.95 - rb * 1.2);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = r * (0.06 + rnd() * 0.14);
    const luzTerron = rnd() < 0.5;
    mancha(mc, x - LX * rad * 0.3, y - LY * rad * 0.3, rad, luzTerron ? 0.1 : 0.16,
      luzTerron ? '236,214,175' : '22,17,11');
  }

  // Grano: arena fina encima de terrón gordo.
  mc.globalAlpha = 0.5;
  mc.globalCompositeOperation = 'overlay';
  mc.drawImage(ruido(S, S, rnd, 3, 3), 0, 0);
  mc.globalAlpha = 0.45;
  mc.globalCompositeOperation = 'soft-light';
  mc.drawImage(ruido(S, S, rnd, Math.max(5, r >> 2), 2), 0, 0);
  mc.globalCompositeOperation = 'source-over';
  mc.globalAlpha = 1;

  // Chinas sueltas: un punto de luz con su sombra pegada debajo.
  for (let i = 0; i < 18 + ((rnd() * 10) | 0); i++) {
    const a = rnd() * Math.PI * 2;
    const d = rb * 1.4 + Math.sqrt(rnd()) * (r * 0.9 - rb * 1.4);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = r * (0.012 + rnd() * 0.028);
    mc.fillStyle = 'rgba(18,13,8,0.35)';
    mc.beginPath();
    mc.arc(x - LX * rad * 0.9, y - LY * rad * 0.9, rad * 1.1, 0, Math.PI * 2);
    mc.fill();
    mc.fillStyle = mix(claro, tierra, 0.25 + rnd() * 0.5);
    mc.beginPath();
    mc.arc(x, y, rad, 0, Math.PI * 2);
    mc.fill();
  }

  // La luz se repasa DESPUÉS del grano: si no, la arena aplana el bulto y el
  // montón se queda en una mancha lisa.
  const relieve = mc.createRadialGradient(
    cx + LX * r * 0.5, cy + LY * r * 0.5, r * 0.08,
    cx, cy, r * 1.05
  );
  relieve.addColorStop(0, 'rgba(255,240,208,0.2)');
  relieve.addColorStop(0.5, 'rgba(0,0,0,0)');
  relieve.addColorStop(1, 'rgba(12,9,6,0.5)');
  mc.fillStyle = relieve;
  mc.fillRect(0, 0, S, S);

  // Dos o tres sombras anchas en la ladera oscura: el montón no es liso.
  for (let i = 0; i < 3; i++) {
    const a = LUZ + Math.PI + (rnd() - 0.5) * 1.6;
    const d = r * (0.35 + rnd() * 0.4);
    mancha(mc, cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.25 + rnd() * 0.2), 0.16, '14,10,6');
  }

  // Caminos gastados que bajan de la boca: la tierra pisada se aclara y se
  // alisa. Se dibujan borrosos porque son huella, no surco.
  mc.save();
  mc.filter = `blur(${Math.max(1, r * 0.05)}px)`;
  mc.lineCap = 'round';
  for (let i = 0, n = 2 + ((rnd() * 3) | 0); i < n; i++) {
    let a = rnd() * Math.PI * 2;
    let x = cx + Math.cos(a) * rb * 1.3;
    let y = cy + Math.sin(a) * rb * 1.3;
    mc.strokeStyle = `rgba(222,199,158,${0.06 + rnd() * 0.06})`;
    mc.lineWidth = r * (0.06 + rnd() * 0.05);
    mc.beginPath();
    mc.moveTo(x, y);
    for (let s = 0; s < 4; s++) {
      a += (rnd() - 0.5) * 0.5;
      x += Math.cos(a) * r * 0.28;
      y += Math.sin(a) * r * 0.28;
      mc.lineTo(x, y);
    }
    mc.stroke();
  }
  mc.restore();

  // El cráter: el labio levantado alrededor del agujero, iluminado por un lado
  // y en sombra por el otro, y el embudo cayendo hacia dentro.
  mc.save();
  mc.filter = `blur(${Math.max(1, r * 0.04)}px)`;
  mc.lineWidth = rb * 0.7;
  mc.strokeStyle = 'rgba(244,227,192,0.42)';
  mc.beginPath();
  mc.arc(cx, cy, rb * 1.45, LUZ - 1.5, LUZ + 1.5);
  mc.stroke();
  mc.strokeStyle = 'rgba(14,10,6,0.5)';
  mc.beginPath();
  mc.arc(cx, cy, rb * 1.45, LUZ + 1.6, LUZ - 1.6);
  mc.stroke();
  mc.restore();

  const embudo = mc.createRadialGradient(cx, cy, rb * 0.85, cx, cy, rb * 1.9);
  embudo.addColorStop(0, 'rgba(9,7,4,0.78)');
  embudo.addColorStop(0.5, 'rgba(9,7,4,0.26)');
  embudo.addColorStop(1, 'rgba(9,7,4,0)');
  mc.fillStyle = embudo;
  mc.beginPath();
  mc.arc(cx, cy, rb * 1.9, 0, Math.PI * 2);
  mc.fill();

  // Recorte: la tierra solo existe donde dice la máscara.
  mc.globalCompositeOperation = 'destination-in';
  mc.drawImage(mascara(S, r, rnd), 0, 0);
  mc.globalCompositeOperation = 'source-over';

  // --- Y ahora se monta todo: sombra en el suelo, montículo, tierra esparcida.
  const c = lienzo(S, S);
  const ctx = c.getContext('2d');

  ctx.save();
  ctx.translate(cx - LX * r * 0.12, cy - LY * r * 0.12 + r * 0.1);
  ctx.scale(1, 0.6);
  mancha(ctx, 0, 0, r * 1.15, 0.4, '6,7,10');
  ctx.restore();

  ctx.drawImage(m, 0, 0);

  // Granos sueltos fuera del montón: lo que salta al cavar. Van encima, y
  // difuminan el final del montículo contra el suelo.
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2;
    const d = r * (0.88 + Math.sqrt(rnd()) * 0.34);
    ctx.fillStyle = rnd() < 0.5
      ? `rgba(126,101,68,${0.1 + rnd() * 0.18})`
      : `rgba(52,40,27,${0.12 + rnd() * 0.2})`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.009 + rnd() * 0.018), 0, Math.PI * 2);
    ctx.fill();
  }

  // Alguna ramita o aguja seca caída sobre el montón.
  ctx.lineCap = 'round';
  for (let i = 0, n = 2 + ((rnd() * 2) | 0); i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = r * (0.4 + rnd() * 0.45);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const ang = rnd() * Math.PI;
    const len = r * (0.1 + rnd() * 0.14);
    ctx.strokeStyle = rnd() < 0.5 ? 'rgba(104,82,52,0.5)' : 'rgba(88,97,61,0.45)';
    ctx.lineWidth = Math.max(1, r * 0.025);
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(ang) * len, y - Math.sin(ang) * len);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.lineWidth = 1;

  return c;
}
