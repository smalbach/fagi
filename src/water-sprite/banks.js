// Cached shoreline material: sediment, rounded stones, roots and reeds.
import { canvasOf, cacheSprite, seededRng, mix, detail, stamp } from '../sprite-kit.js';
const banks = new Map();
export function drawBanks(ctx, o, radius, seed, variant) {
  const z = detail();
  const r = Math.round(radius * z);
  const image = cacheSprite(banks, `${seed}|${r}|${variant}`, () => paint(r, seed, variant), 80);
  stamp(ctx, image, o.x, o.y, z);
}
function paint(r, seed, variant) {
  const c = canvasOf(Math.ceil(r * 3.4 + 8), Math.ceil(r * 3.4 + 8));
  const ctx = c.getContext('2d');
  ctx.translate(c.width / 2, c.height / 2);
  const rnd = seededRng(seed ^ 0x71ba9);
  const stones = variant === 'clear' ? 52 : variant === 'clay' ? 12 : 24;
  for (let i = 0; i < stones; i++) {
    const a = rnd() * Math.PI * 2;
    const d = r * (0.98 + rnd() * 0.19);
    const x = Math.cos(a) * d, y = Math.sin(a) * d;
    const size = r * (0.018 + rnd() * 0.05);
    const color = variant === 'clay' ? '#91634b' : variant === 'clear' ? '#999b8c' : '#637057';
    ctx.save(); ctx.translate(x, y); ctx.rotate(rnd() * 6.28);
    ctx.fillStyle = '#101b1470';
    ctx.beginPath(); ctx.ellipse(size * 0.3, size * 0.45, size * 1.1, size * 0.72, 0, 0, 6.29); ctx.fill();
    const g = ctx.createLinearGradient(-size, -size, size, size);
    g.addColorStop(0, mix(color, '#e6dfca', 0.38)); g.addColorStop(0.45, color); g.addColorStop(1, '#29372a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, size, size * 0.68, 0, 0, 6.29); ctx.fill();
    ctx.restore();
  }
  const tufts = variant === 'marsh' ? 24 : variant === 'woodland' ? 9 : 3;
  for (let i = 0; i < tufts; i++) {
    const a = rnd() * 6.28, d = r * (0.97 + rnd() * 0.1);
    const x = Math.cos(a) * d, y = Math.sin(a) * d;
    for (let j = 0; j < 7; j++) {
      const height = r * (0.11 + rnd() * 0.23);
      const lean = (rnd() - 0.5) * height;
      ctx.strokeStyle = mix('#33412b', '#afaa61', rnd() * 0.8);
      ctx.lineWidth = Math.max(0.5, r * 0.009);
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + lean * 0.3, y - height * 0.55, x + lean, y - height); ctx.stroke();
      if (variant === 'marsh' && j % 3 === 0) {
        ctx.strokeStyle = '#57402c'; ctx.lineWidth *= 2.7;
        ctx.beginPath(); ctx.moveTo(x + lean, y - height); ctx.lineTo(x + lean * 0.9, y - height * 0.83); ctx.stroke();
      }
    }
  }
  if (variant === 'clay') {
    ctx.strokeStyle = '#543b2866'; ctx.lineWidth = Math.max(0.5, r * 0.008);
    for (let i = 0; i < 22; i++) {
      const a = rnd() * 6.28;
      ctx.save(); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(r * 1.01, 0); ctx.lineTo(r * 1.1, r * 0.02); ctx.lineTo(r * 1.2, -r * 0.025); ctx.stroke(); ctx.restore();
    }
  }
  return c;
}
