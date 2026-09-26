// Dibujo: terreno, cono de visión, puntos y Fagi.
//
// Todo el dibujo del mundo pasa por la transformación de la cámara, así que
// ningún módulo de sprite sabe que existe el zoom: siguen pintando en
// coordenadas de mundo. Lo único que sí se enteran es de la escala de DETALLE,
// que les dice con cuántos píxeles pintar su lienzo para que acercarse no estire
// una imagen vieja. El HUD (las coordenadas, el aumento) se dibuja ya sin cámara
// o con la letra dividida por el zoom, para que no crezca con él.

import { FAGI, POINT_TYPES, OBJECT_TYPES } from './config.js';
import { heading } from './compass.js';
import { viewRangeOf, fovOf } from './vision.js';
import { activeEffects } from './effects.js';
import { isWater, isNest, isTree, radiusOf } from './obstacles.js';
import { colorDe, aRGB } from './colors.js';
import { drawFagi, elipse } from './fagi-sprite.js';
import { scentSources } from './smell.js';
import { drawRock } from './rock-sprite.js';
import { drawNest, drawNestMouth } from './nest-sprite.js';
import { drawTree } from './tree-sprite.js';
import { drawFruit } from './fruit-sprite.js';
import { drawTerrain, drawShore, drawGranoZoom, drawDetalleCerca } from './terrain.js';
import { drawLake } from './water-sprite.js';
import { setDetalle } from './sprite-kit.js';
import { aplicar, sinCamara, detalleDe } from './camera.js';
import { nestUnder } from './nest.js';

// La luz del mundo, la misma que la del suelo, la roca y el árbol. Aquí la
// necesitan las pocas cosas que no pinta un módulo de sprite.
const LUZ = -Math.PI * 0.72;
const LX = Math.cos(LUZ);
const LY = Math.sin(LUZ);

// Descansando dentro del nido no se la ve: está bajo tierra. Ni ella, ni su
// cono de visión, ni las etiquetas que la siguen.
function escondida(fagi, world) {
  return fagi.alive && fagi.thought?.action === 'rest' && !!nestUnder(fagi, world);
}

export function render(ctx, world, fagi, camera) {
  setDetalle(detalleDe(camera));
  aplicar(ctx, camera, ctx.canvas);
  escena(ctx, world, fagi, camera);
  sinCamara(ctx);
  drawZoom(ctx, camera);
}

function escena(ctx, world, fagi, camera) {
  drawTerrain(ctx, world);
  // Lo que el suelo pierde al estirarse con el zoom: el grano, en píxeles de
  // pantalla, y las cosas pequeñas —chinas, briznas, hoja— en píxeles de mundo.
  drawGranoZoom(ctx, camera.zoom);
  drawDetalleCerca(ctx, world, camera, ctx.canvas);
  // La tierra mojada va antes que las estelas y que todo lo demás: es suelo.
  for (const o of world.objects) if (isWater(o)) drawShore(ctx, o, radiusOf(o));

  // Una sombra común ata todos los objetos al mismo suelo y a la misma luz.
  // Los sprites conservan sus sombras finas de contacto; esta es la sombra
  // ambiental, ancha y blanda, que hace legible la altura desde lejos.
  drawGroundShadows(ctx, world);

  for (const { src, key } of scentSources(world)) {
    // La estela va del color de la fuente, y una fruta que se pasa arrastra su
    // olor hacia el del tóxico antes incluso de pudrirse del todo.
    // El árbol es un caso aparte: anuncia el fruto que da, pero él no se pudre,
    // así que va del color liso del fruto y no se le pregunta por su madurez.
    const color = POINT_TYPES[src.type] ? colorDe(src)
      : POINT_TYPES[key] ? POINT_TYPES[key].color
      : OBJECT_TYPES[key].color;
    drawTrail(ctx, src, color);
  }

  // Sin Fagi (preparando una sesión) solo se dibuja el mapa.
  const dentro = fagi ? escondida(fagi, world) : false;

  drawPheromone(ctx, world);
  for (const o of world.objects) drawObject(ctx, o, dentro, world.wind);
  for (const p of world.points) drawFruit(ctx, p);
  if (!fagi) return;

  // El cono es percepción, no depuración: debe verse también en el modo limpio.
  if (!dentro) drawVisionCone(ctx, fagi);

  if (dentro) {
    drawSleepMark(ctx, nestUnder(fagi, world));
    return;
  }

  // Solo se dibuja la línea al objetivo cuando SABE dónde está (lo ve).
  // Rastreando un olor no lo sabe: se marca el último sitio donde olía.
  if (!world.immersive && fagi.targetKind === 'scent') drawScentMark(ctx, fagi);
  else if (!world.immersive && fagi.target) drawTargetLine(ctx, fagi);
  else if (!world.immersive && fagi.thought?.action === 'explore' && fagi.exploreTarget) drawLeg(ctx, fagi);
  drawFagi(ctx, fagi);
  drawBuffRings(ctx, fagi);
  if (!world.immersive) drawCoords(ctx, fagi, camera.zoom);
}

function drawGroundShadows(ctx, world) {
  for (const o of world.objects) {
    if (isWater(o)) continue;
    const r = radiusOf(o);
    const arbol = isTree(o);
    const largo = arbol ? r * 1.72 : r * 0.7;
    const ancho = arbol ? r * 0.52 : r * 0.34;
    const distancia = arbol ? r * 0.82 : r * 0.22;
    const x = o.x - LX * distancia;
    const y = o.y - LY * distancia;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(-LY, -LX));
    ctx.scale(1, ancho / largo);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, largo);
    g.addColorStop(0, arbol ? 'rgba(8,12,9,0.28)' : 'rgba(8,10,12,0.22)');
    g.addColorStop(0.55, arbol ? 'rgba(8,12,9,0.14)' : 'rgba(8,10,12,0.1)');
    g.addColorStop(1, 'rgba(8,10,12,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, largo, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Lo único que delata que está dentro: tres zetas subiendo de la boca.
function drawSleepMark(ctx, nido) {
  const t = performance.now() / 1000;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < 3; i++) {
    const fase = (t * 0.45 + i / 3) % 1;
    ctx.fillStyle = `rgba(226,205,167,${Math.sin(fase * Math.PI) * 0.6})`;
    ctx.fillText(
      'z',
      nido.x + 8 + fase * 10,
      nido.y - 10 - fase * 22
    );
  }
  ctx.textAlign = 'left';
}

// El aumento, abajo a la izquierda, y si la cámara va pegada a Fagi. Con el mapa
// entero a la vista no hace falta decir nada.
function drawZoom(ctx, camera) {
  if (camera.zoom <= 1.001 && !camera.seguir) return;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(240,242,248,0.5)';
  ctx.textAlign = 'left';
  ctx.fillText(
    `×${camera.zoom.toFixed(1)}${camera.seguir ? '  ⦿ Fagi' : ''}`,
    12, ctx.canvas.height - 12
  );
}

// Coordenadas y rumbo pegados a Fagi, para seguir por dónde avanza. La letra se
// divide por el zoom: sigue midiendo lo mismo en pantalla estando cerca o lejos.
function drawCoords(ctx, fagi, zoom = 1) {
  const dir = heading(fagi.angle);
  const text = `${Math.round(fagi.x)}, ${Math.round(fagi.y)} ${dir.arrow}`
    + (fagi.drinking ? ' bebiendo' : '');
  ctx.font = `${(11 / zoom).toFixed(2)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(240,242,248,0.65)';
  ctx.textAlign = 'center';
  ctx.fillText(text, fagi.x, fagi.y - FAGI.radius - 8 / zoom);
  ctx.textAlign = 'left';
}

function drawVisionCone(ctx, fagi) {
  const half = fovOf(fagi) / 2;
  const alcance = viewRangeOf(fagi);
  const luz = ctx.createRadialGradient(fagi.x, fagi.y, 0, fagi.x, fagi.y, alcance);
  luz.addColorStop(0, fagi.alive ? 'rgba(224,238,209,0.22)' : 'rgba(255,255,255,0.03)');
  luz.addColorStop(0.72, fagi.alive ? 'rgba(213,230,199,0.13)' : 'rgba(255,255,255,0.02)');
  luz.addColorStop(1, 'rgba(213,230,199,0.045)');
  ctx.fillStyle = luz;
  ctx.beginPath();
  ctx.moveTo(fagi.x, fagi.y);
  ctx.arc(fagi.x, fagi.y, alcance, fagi.angle - half, fagi.angle + half);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = fagi.alive ? 'rgba(226,242,211,0.34)' : 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

// Las marcas de feromona que ha dejado la propia Fagi. Se apagan al evaporarse.
//
// No es un punto pintado: es una gota. Moja la tierra a su alrededor, tiene
// cuerpo y le brilla el lomo por donde entra la luz —la misma luz del suelo y
// de la roca—. Al evaporarse pierde antes el brillo que la mancha, que es el
// orden en que se seca una gota de verdad.
function drawPheromone(ctx, world) {
  for (const m of world.pheromone) {
    const a = Math.max(0, Math.min(1, m.life / 45));

    // La tierra mojada alrededor: más ancha que la gota y más tenue.
    const mojado = ctx.createRadialGradient(m.x, m.y, 0.8, m.x, m.y, 7.2);
    mojado.addColorStop(0, `rgba(46,33,10,${a * 0.48})`);
    mojado.addColorStop(1, 'rgba(46,33,10,0)');
    ctx.fillStyle = mojado;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 7.2, 0, Math.PI * 2);
    ctx.fill();

    // El cuerpo de la gota.
    const gota = ctx.createRadialGradient(
      m.x + LX * 1.2, m.y + LY * 1.2, 0.25, m.x, m.y, 4.1
    );
    gota.addColorStop(0, `rgba(226,192,84,${a * 0.55})`);
    gota.addColorStop(0.6, `rgba(201,162,39,${a * 0.42})`);
    gota.addColorStop(1, `rgba(150,116,26,${a * 0.18})`);
    ctx.fillStyle = gota;
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, 3.9, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // El punto de cielo en el lomo: se va antes que la mancha, igual que al
    // secarse una gota lo primero que se pierde es el brillo.
    ctx.fillStyle = `rgba(255,246,214,${a * a * 0.45})`;
    ctx.beginPath();
    ctx.ellipse(m.x + LX * 1.25, m.y + LY * 1.1, 1.2, 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Cada cosa del mapa la pinta su módulo: el lago, la roca, el nido y el árbol.
// `ocupado` es Fagi durmiendo dentro del nido.
function drawObject(ctx, o, ocupado, wind) {
  const spec = OBJECT_TYPES[o.type];
  const r = radiusOf(o);
  if (isWater(o)) {
    drawLake(ctx, o, spec, r, wind, performance.now());
  } else if (isNest(o)) {
    drawNest(ctx, o, spec, r);
    drawNestMouth(ctx, o, r, ocupado, performance.now());
  } else if (isTree(o)) {
    drawTree(ctx, o, spec, r, wind, performance.now());
  } else {
    drawRock(ctx, o, spec, r);
  }
}

// El hilo de olor: una sola línea que sale de la fuente y va creciendo por el
// mapa. Se dibuja por tramos para que se apague según se aleja de la fuente.
function drawTrail(ctx, src, color) {
  const nodes = src.trail?.nodes;
  if (!nodes || nodes.length < 2) return;

  const [r, g, b] = aRGB(color);
  ctx.lineCap = 'round';
  for (let i = 1; i < nodes.length; i++) {
    const t = i / nodes.length;
    ctx.lineWidth = 4.2;
    ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - t) * 0.16})`;
    ctx.beginPath();
    ctx.moveTo(nodes[i - 1].x, nodes[i - 1].y);
    ctx.lineTo(nodes[i].x, nodes[i].y);
    ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - t) * 0.75})`;
    ctx.beginPath();
    ctx.moveTo(nodes[i - 1].x, nodes[i - 1].y);
    ctx.lineTo(nodes[i].x, nodes[i].y);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}

function drawTargetLine(ctx, fagi) {
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(fagi.x, fagi.y);
  ctx.lineTo(fagi.target.x, fagi.target.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Explorando: el punto de su campo de visión al que va este tramo. Al llegar
// elige el siguiente con lo que vea entonces.
function drawLeg(ctx, fagi) {
  const w = fagi.exploreTarget;
  ctx.strokeStyle = 'rgba(240,199,94,0.35)';
  ctx.setLineDash([2, 5]);
  ctx.beginPath();
  ctx.moveTo(fagi.x, fagi.y);
  ctx.lineTo(w.x, w.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(w.x, w.y, 4, 0, Math.PI * 2);
  ctx.stroke();
}

// Cruz en el último punto donde le llegó el olor: es a donde vuelve si lo pierde.
function drawScentMark(ctx, fagi) {
  const p = fagi.lastScent;
  if (!p) return;
  ctx.strokeStyle = 'rgba(232,163,61,0.5)';
  ctx.beginPath();
  ctx.moveTo(p.x - 5, p.y); ctx.lineTo(p.x + 5, p.y);
  ctx.moveTo(p.x, p.y - 5); ctx.lineTo(p.x, p.y + 5);
  ctx.stroke();
}

// Un anillo por buff activo, del color del alimento que lo dio.
function drawBuffRings(ctx, fagi) {
  const list = activeEffects(fagi);
  ctx.lineWidth = 2;
  list.forEach((fx, i) => {
    ctx.globalAlpha = Math.min(1, fx.time / 1.5); // parpadea al expirar
    ctx.strokeStyle = fx.color;
    ctx.beginPath();
    ctx.arc(fagi.x, fagi.y, FAGI.radius + 4 + i * 4, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}
