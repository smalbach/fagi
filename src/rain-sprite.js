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

const LUZ = -Math.PI * 0.72;   // la misma luz que el resto del mundo

// ── Estado de lo que se ve (no del mundo): sube y baja suave ────────────────

const cielo = { nivel: 0, mojado: 0, antes: null };

const SUBE = 4;        // s que tarda en cerrarse el cielo
const BAJA = 6;        // s que tarda en abrirse
const MOJA = 14;       // s hasta el suelo empapado
const SECA = 60;       // s hasta el suelo seco

// Una vez por fotograma, antes de pintar nada de lluvia.
export function rainLook(world, ahora) {
  const dt = cielo.antes == null ? 0 : Math.min(0.1, Math.max(0, (ahora - cielo.antes) / 1000));
  cielo.antes = ahora;
  const on = !!world.rain?.on;
  cielo.nivel = on ? Math.min(1, cielo.nivel + dt / SUBE) : Math.max(0, cielo.nivel - dt / BAJA);
  cielo.mojado = on ? Math.min(1, cielo.mojado + dt / MOJA) : Math.max(0, cielo.mojado - dt / SECA);
  return cielo.nivel;
}

export const rainLevel = () => cielo.nivel;

// ── Utilidades ──────────────────────────────────────────────────────────────

function hash(a, b, s = 0) {
  const x = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453;
  return x - Math.floor(x);
}

const suave = (x) => x * x * (3 - 2 * x);

// Ruido fractal que se repite sin costuras: sirve para nubes y para rachas.
let texturaRuido = null;
function ruido() {
  if (texturaRuido) return texturaRuido;
  const N = 256;
  const c = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(N, N)
    : Object.assign(document.createElement('canvas'), { width: N, height: N });
  const g = c.getContext('2d');
  const img = g.createImageData(N, N);
  const octava = (x, y, celdas, semilla) => {
    const fx = (x / N) * celdas;
    const fy = (y / N) * celdas;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = suave(fx - x0);
    const ty = suave(fy - y0);
    const v = (i, j) => hash(((x0 + i) % celdas + celdas) % celdas, ((y0 + j) % celdas + celdas) % celdas, semilla);
    const a = v(0, 0) + (v(1, 0) - v(0, 0)) * tx;
    const b = v(0, 1) + (v(1, 1) - v(0, 1)) * tx;
    return a + (b - a) * ty;
  };
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const n = octava(x, y, 4, 1) * 0.55 + octava(x, y, 8, 2) * 0.27 + octava(x, y, 16, 3) * 0.13 + octava(x, y, 32, 4) * 0.05;
      const k = (y * N + x) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = 255;
      img.data[k + 3] = Math.round(Math.max(0, Math.min(1, (n - 0.35) * 2.2)) * 255);
    }
  }
  g.putImageData(img, 0, 0);
  texturaRuido = c;
  return c;
}

// Teselas del ruido, escaladas y desplazadas, cubriendo el rectángulo dado.
function teselar(ctx, img, lado, ox, oy, x0, y0, x1, y1) {
  const sx = x0 - ((((x0 - ox) % lado) + lado) % lado);
  const sy = y0 - ((((y0 - oy) % lado) + lado) % lado);
  for (let y = sy; y < y1; y += lado) {
    for (let x = sx; x < x1; x += lado) ctx.drawImage(img, x, y, lado, lado);
  }
}

// Cuántos píxeles del lienzo caben en un píxel de la pantalla. El lienzo mide
// lo que el mundo y el navegador lo encoge: sin esto una línea fina se pierde.
function pantalla(canvas) {
  const w = canvas.clientWidth || canvas.width;
  return Math.max(1, canvas.width / w);
}

// Lo que la cámara deja ver, en coordenadas de mundo.
function vista(ctx) {
  const m = ctx.getTransform();
  const z = m.a || 1;
  const x0 = -m.e / z;
  const y0 = -m.f / z;
  return { x0, y0, x1: x0 + ctx.canvas.width / z, y1: y0 + ctx.canvas.height / z, z };
}

function vientoDe(world) {
  const a = world.wind?.angle ?? 0;
  return { x: Math.cos(a) * 0.85, y: Math.sin(a) * 0.85 };
}

// ── Suelo: mojado y bajo las nubes (en coordenadas de mundo) ────────────────

// Va después del terreno y antes de los objetos: es el suelo lo que se moja.
export function drawWetGround(ctx, world) {
  const w = cielo.mojado;
  if (w <= 0) return;
  ctx.save();
  // Tierra mojada: más oscura y más fría.
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(118,128,142,${(w * 0.55).toFixed(3)})`;
  ctx.fillRect(0, 0, world.width, world.height);
  // Y brilla un poco donde refleja el cielo: manchas de brillo quietas.
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = w * 0.07;
  teselar(ctx, ruido(), 180, 37, 91, 0, 0, world.width, world.height);
  ctx.restore();
}

// Por encima de todo lo del mundo: la luz del día nublado y las nubes que pasan.
export function drawOvercast(ctx, world, ahora) {
  const n = cielo.nivel;
  if (n <= 0) return;
  const v = vientoDe(world);
  const t = ahora / 1000;
  ctx.save();
  // Luz apagada y azulada.
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(138,148,168,${(n * 0.7).toFixed(3)})`;
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(22,30,42,${(n * 0.12).toFixed(3)})`;
  ctx.fillRect(0, 0, world.width, world.height);
  // Sombras de nube, grandes y lentas, a favor del viento.
  ctx.globalCompositeOperation = 'multiply';
  ctx.filter = 'invert(1) brightness(0.55)';
  ctx.globalAlpha = n * 0.32;
  teselar(ctx, ruido(), 900, v.x * t * 9, v.y * t * 9, 0, 0, world.width, world.height);
  ctx.restore();
}

// ── Salpicaduras en el suelo (mundo) ────────────────────────────────────────

const SALPICA_POR_PX2 = 380 / (1280 * 860);   // a pleno chaparrón

export function drawSplashes(ctx, world, ahora) {
  const n = cielo.nivel;
  if (n <= 0.02) return;
  const { x0, y0, x1, y1, z } = vista(ctx);
  // Nunca más pequeñas que lo que se distingue en pantalla.
  const k = Math.max(1, pantalla(ctx.canvas) / z);
  const ax = Math.max(0, x0);
  const ay = Math.max(0, y0);
  const bx = Math.min(world.width, x1);
  const by = Math.min(world.height, y1);
  const area = (bx - ax) * (by - ay);
  const cuantas = Math.min(700, Math.max(30, Math.round(area * SALPICA_POR_PX2 * n)));
  const t = ahora / 1000;

  ctx.save();
  ctx.lineCap = 'round';
  const anillos = new Path2D();
  const gotitas = new Path2D();
  const puntos = new Path2D();
  for (let i = 0; i < cuantas; i++) {
    const vida = 0.32 + hash(i, 0, 5) * 0.22;
    const u = t / vida + hash(i, 0, 6);
    const ciclo = Math.floor(u);
    const p = u - ciclo;
    // Algunas veces no cae aquí: rompe la regularidad.
    if (hash(i, ciclo, 9) > 0.8) continue;
    const x = ax + hash(i, ciclo, 1) * (bx - ax);
    const y = ay + hash(i, ciclo, 2) * (by - ay);
    const tam = (0.9 + hash(i, ciclo, 3) * 1.3) * k;
    if (p < 0.12) {
      // El impacto: un puntito claro.
      puntos.moveTo(x + tam * 0.6, y);
      puntos.arc(x, y, tam * 0.6, 0, Math.PI * 2);
    }
    // El anillo que se abre, algo aplastado por la luz rasante.
    const r = tam * (0.6 + suave(p) * 3.2);
    anillos.moveTo(x + r, y);
    anillos.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2);
    // La corona: unas gotitas que saltan y vuelven a caer.
    if (p < 0.6) {
      const q = p / 0.6;
      const k = 3 + Math.floor(hash(i, ciclo, 4) * 3);
      for (let j = 0; j < k; j++) {
        const a = (j / k) * Math.PI * 2 + hash(i, ciclo, 10 + j) * 0.9;
        const d = tam * (1 + q * 4.5);
        const gx = x + Math.cos(a) * d;
        const gy = y + Math.sin(a) * d * 0.8 - Math.sin(q * Math.PI) * tam * 2.2;
        const gr = 0.4 * k * (1 - q * 0.6);
        gotitas.moveTo(gx + gr, gy);
        gotitas.arc(gx, gy, gr, 0, Math.PI * 2);
      }
    }
  }
  ctx.strokeStyle = `rgba(205,222,238,${(0.42 * n).toFixed(3)})`;
  ctx.lineWidth = 0.7 * k;
  ctx.stroke(anillos);
  ctx.fillStyle = `rgba(225,236,248,${(0.4 * n).toFixed(3)})`;
  ctx.fill(gotitas);
  ctx.fillStyle = `rgba(240,246,255,${(0.85 * n).toFixed(3)})`;
  ctx.fill(puntos);
  ctx.restore();
}

// ── Ondas en el agua (mundo) ────────────────────────────────────────────────

// Ondas de gotas en una superficie de agua de radio r. Densidad según el área.
export function drawRipples(ctx, o, r, intensidad, ahora) {
  if (!(intensidad > 0.02)) return;
  const cuantas = Math.min(40, Math.max(3, Math.round((r * r) / 60 * intensidad)));
  const t = ahora / 1000;
  const semilla = (o.id ?? 0) * 13.7;
  const k = Math.max(1, pantalla(ctx.canvas) / (ctx.getTransform().a || 1));
  ctx.save();
  ctx.lineWidth = 0.75 * k;
  for (let i = 0; i < cuantas; i++) {
    const vida = 0.9 + hash(i, semilla, 1) * 0.7;
    const u = t / vida + hash(i, semilla, 2);
    const ciclo = Math.floor(u);
    const p = u - ciclo;
    const a = hash(i + semilla, ciclo, 3) * Math.PI * 2;
    const d = Math.sqrt(hash(i + semilla, ciclo, 4)) * r * 0.82;
    const x = o.x + Math.cos(a) * d;
    const y = o.y + Math.sin(a) * d;
    const rr = 0.8 + p * (2.5 + hash(i, ciclo, 5) * 3.5);
    // Que la onda no se salga del agua.
    if (d + rr > r * 0.92) continue;
    const alfa = (1 - p) * (1 - p) * 0.75 * intensidad;
    ctx.strokeStyle = `rgba(215,232,244,${alfa.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rr, rr * 0.85, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Una segunda onda más pequeña detrás de la primera.
    if (p > 0.25) {
      ctx.strokeStyle = `rgba(215,232,244,${(alfa * 0.6).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, rr * 0.55, rr * 0.47, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // El golpe de la gota, al principio.
    if (p < 0.08) {
      ctx.fillStyle = `rgba(240,248,255,${(0.6 * intensidad).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.8 * k, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Un charco: agua turbia, más clara hacia el borde, con el reflejo del cielo
// del lado de la luz. Si está lloviendo, las gotas le hacen ondas.
export function drawPuddle(ctx, o, r, intensidad, ahora) {
  ctx.save();
  const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
  g.addColorStop(0, 'rgba(58,78,84,0.85)');
  g.addColorStop(0.75, 'rgba(78,98,96,0.8)');
  g.addColorStop(1, 'rgba(96,104,88,0.35)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(o.x, o.y, r, r * 0.86, (o.id % 7) * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Reflejo del cielo: más apagado cuando está nublado.
  ctx.fillStyle = `rgba(200,220,235,${(0.16 * (1 - (intensidad || 0) * 0.5)).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(o.x + Math.cos(LUZ) * r * 0.35, o.y + Math.sin(LUZ) * r * 0.35, r * 0.45, r * 0.18, LUZ + Math.PI / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawRipples(ctx, o, r * 0.95, Number(intensidad) || 0, ahora);
}

// ── Lo que cae entre la cámara y el suelo (en píxeles de pantalla) ──────────

// Tres capas de profundidad. `n` por cada 1280×860 px de pantalla.
const CAPAS = [
  { n: 560, largo: 11, ancho: 0.9, alfa: 0.34, vida: [0.18, 0.3], abre: 0.05 },
  { n: 280, largo: 24, ancho: 1.3, alfa: 0.42, vida: [0.14, 0.22], abre: 0.09 },
  { n: 60, largo: 52, ancho: 2.6, alfa: 0.24, vida: [0.1, 0.16], abre: 0.16 },
];

// Va con la cámara quitada: las gotas están delante de ella, no en el suelo.
export function drawRainDrops(ctx, world, ahora) {
  const n = cielo.nivel;
  if (n <= 0.01) return;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const v = vientoDe(world);
  const t = ahora / 1000;
  const escala = (W * H) / (1280 * 860);
  const k = pantalla(ctx.canvas);

  ctx.save();
  ctx.lineCap = 'round';

  // Rachas: cortinas de lluvia más densa que cruzan la vista con el viento.
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = n * 0.1;
  teselar(ctx, ruido(), 520, v.x * t * 160, v.y * t * 160 + t * 30, 0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  CAPAS.forEach((capa, c) => {
    const cuantas = Math.round(capa.n * escala * n);
    // Tres tandas de brillo por capa: una gota se enciende y se apaga.
    const tandas = [new Path2D(), new Path2D(), new Path2D()];
    for (let i = 0; i < cuantas; i++) {
      const vida = capa.vida[0] + hash(i, c, 1) * (capa.vida[1] - capa.vida[0]);
      const u = t / vida + hash(i, c, 2);
      const ciclo = Math.floor(u);
      const p = u - ciclo;
      const x = hash(i, ciclo + c * 7919, 3) * (W + 80) - 40;
      const y = hash(i, ciclo + c * 7919, 4) * (H + 80) - 40;
      // Dirección: el viento más la huida desde el centro (cae hacia nosotros).
      const dx = v.x + (x - cx) / W * capa.abre * 10;
      const dy = v.y + (y - cy) / H * capa.abre * 10 + 0.35;
      const m = Math.hypot(dx, dy) || 1;
      const largo = capa.largo * k * (0.75 + hash(i, ciclo, 5) * 0.5);
      const hx = x + (dx / m) * largo * p * 1.4;
      const hy = y + (dy / m) * largo * p * 1.4;
      const tb = p < 0.2 || p > 0.8 ? 0 : p < 0.35 || p > 0.65 ? 1 : 2;
      tandas[tb].moveTo(hx - (dx / m) * largo, hy - (dy / m) * largo);
      tandas[tb].lineTo(hx, hy);
    }
    ctx.lineWidth = capa.ancho * k;
    [0.35, 0.7, 1].forEach((k, j) => {
      ctx.strokeStyle = `rgba(206,222,240,${(capa.alfa * k * (0.5 + n * 0.5)).toFixed(3)})`;
      ctx.stroke(tandas[j]);
    });
  });

  // Relámpago: en ventanas de 25 s, a veces uno, con su parpadeo doble.
  if (n > 0.6) {
    const ventana = Math.floor(t / 25);
    if (hash(ventana, 0, 21) < 0.45) {
      const cuando = ventana * 25 + 3 + hash(ventana, 0, 22) * 19;
      const d = t - cuando;
      if (d > 0 && d < 0.9) {
        const f = Math.max(0, 1 - d / 0.08) * 0.7 + (d > 0.14 ? Math.exp(-(d - 0.14) * 6) : 0);
        ctx.fillStyle = `rgba(220,228,255,${(Math.min(1, f) * 0.32 * n).toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
  }
  ctx.restore();
}
