// --- tronco ---------------------------------------------------------------

import { mix, ruido } from '../sprite-kit.js';
import { LUZ, LX, LY, LIQUEN, lienzoDeTronco } from './comun.js';
import { ramasDe, trazarRamas } from './ramaje.js';
import { pintarPie } from './pie.js';

export function pintarTronco(semilla, R, seco) {
  const { rnd, S, c, ctx, base } = lienzoDeTronco(semilla, R);
  const cx = S / 2;
  const cy = S / 2;
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

  pintarPie(ctx, rnd, cx, baseY, w0, R, base, seco);

  return c;
}
