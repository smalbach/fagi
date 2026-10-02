// The hero picture: a few Fagis drawn by the game's own sprite code, walking
// between the nest and fruit, leaving a trail that fades. Only the drawing is
// the game's; the walking here is a toy, not the simulation.
import { drawFagi } from '../src/fagi-sprite.js';
import { paintFruitPreview } from '../src/fruit-sprite.js';

const FRUITS = [
  { painter: 'berry', color: '#c0392b' },
  { painter: 'resin', color: '#e0a526' },
  { painter: 'spark', color: '#7fb3d5' },
  { painter: 'eye', color: '#8e44ad' },
];

export function startHero(canvas) {
  const ctx = canvas.getContext('2d');
  const W = 600, H = 600;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr; canvas.height = H * dpr;

  const nest = { x: W / 2, y: H / 2 + 20 };
  const fruit = [
    { x: 110, y: 120, ...FRUITS[0] }, { x: 490, y: 140, ...FRUITS[1] },
    { x: 470, y: 470, ...FRUITS[2] }, { x: 120, y: 450, ...FRUITS[3] },
    { x: 300, y: 80, ...FRUITS[0] },
  ];
  const trail = [];
  const ants = Array.from({ length: 5 }, (_, i) => ({
    x: nest.x + Math.cos(i) * 30, y: nest.y + Math.sin(i) * 30, angle: i,
    sex: i === 3 ? 'male' : 'female', alive: true, stride: 0, castSide: 1,
    carrying: null, temperature: 24, hunger: 20 + i * 12, thirst: 10, energy: 90,
    thermalStress: 0, age: 0, thought: { action: 'explore' },
    goal: fruit[i % fruit.length], speed: 34 + i * 4, wobble: Math.random() * 6,
  }));

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = performance.now();

  function step(dt, t) {
    for (const a of ants) {
      const g = a.carrying ? nest : a.goal;
      const dx = g.x - a.x, dy = g.y - a.y, d = Math.hypot(dx, dy);
      const want = Math.atan2(dy, dx) + Math.sin(t * 1.3 + a.wobble) * 0.35;
      let turn = ((want - a.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      a.angle += Math.max(-2.5 * dt, Math.min(2.5 * dt, turn));
      a.x += Math.cos(a.angle) * a.speed * dt;
      a.y += Math.sin(a.angle) * a.speed * dt;
      a.stride += a.speed * dt * 0.28;
      a.age = t;
      if (d < 14) {
        if (a.carrying) {
          a.carrying = null; a.thought = { action: 'explore' };
          a.goal = fruit[(Math.random() * fruit.length) | 0];
        } else {
          a.carrying = { type: 'nectar' }; a.thought = { action: 'carry' };
        }
      }
      if (a.carrying && Math.random() < dt * 9) trail.push({ x: a.x, y: a.y, life: 1 });
    }
    for (const p of trail) p.life -= dt * 0.12;
    while (trail.length && trail[0].life <= 0) trail.shift();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createRadialGradient(W * .4, H * .35, 40, W / 2, H / 2, W * .75);
    g.addColorStop(0, '#5f4d37'); g.addColorStop(1, '#2b2319');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // pebbles, fixed
    for (let i = 0; i < 90; i++) {
      const x = (i * 197) % W, y = (i * 389) % H, r = 1 + (i % 4);
      ctx.fillStyle = `rgba(${150 + (i % 5) * 12},${125 + (i % 3) * 10},95,${0.12 + (i % 3) * 0.05})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    // pheromone trail
    for (const p of trail) {
      ctx.fillStyle = `rgba(230, 170, 90, ${p.life * 0.35})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 7); ctx.fill();
    }
    // nest
    ctx.fillStyle = '#1c160f';
    ctx.beginPath(); ctx.ellipse(nest.x, nest.y, 26, 18, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(160,130,90,.6)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(nest.x, nest.y, 32, 23, 0, 0, 7); ctx.stroke();
    for (const f of fruit) paintFruitPreview(ctx, f, f.x, f.y, 9);
    for (const a of ants) {
      ctx.save();
      ctx.translate(a.x, a.y); ctx.scale(2.2, 2.2); ctx.translate(-a.x, -a.y);
      drawFagi(ctx, a);
      ctx.restore();
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    step(dt, now / 1000);
    draw();
    if (!reduce) requestAnimationFrame(frame);
  }
  if (reduce) { for (let i = 0; i < 120; i++) step(1 / 30, i / 30); draw(); }
  else requestAnimationFrame(frame);
}
