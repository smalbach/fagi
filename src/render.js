// Drawing: terrain, vision cone, points and Fagi.
//
// All of the world's drawing goes through the camera transform, so no sprite
// module knows zoom exists: they keep painting in world coordinates. The only
// thing they do find out about is the DETAIL scale, which tells them how many
// pixels to paint their canvas with so that zooming in doesn't stretch an old
// image. The HUD (the coordinates, the magnification) is drawn without the
// camera or with the font divided by the zoom, so it doesn't grow with it.

import { FAGI, POINT_TYPES, OBJECT_TYPES } from './config.js';
import { heading } from './compass.js';
import { viewRangeOf, fovOf } from './vision.js';
import { activeEffects } from './effects.js';
import { isWater, isNest, isTree, radiusOf } from './obstacles.js';
import { colorOf, toRGB } from './colors.js';
import { drawFagi, ellipse } from './fagi-sprite.js';
import { scentSources } from './smell.js';
import { drawRock } from './rock-sprite.js';
import { drawNest, drawNestMouth } from './nest-sprite.js';
import { drawTree } from './tree-sprite.js';
import { drawFruit } from './fruit-sprite.js';
import { drawTerrain, drawShore, drawZoomGrain, drawNearDetail } from './terrain.js';
import { drawLake } from './water-sprite.js';
import { drawPuddle, drawRipples, drawWetGround, drawOvercast, drawSplashes, drawRainDrops, rainLook, rainFalling } from './rain-sprite.js';
import { setDetail } from './sprite-kit.js';
import { applySets, noCamera, detailOf } from './camera.js';
import { nestUnder } from './nest.js';

// The world's light, the same as the ground's, the rock's and the tree's. Here
// it's needed by the few things that no sprite module paints.
const LIGHT = -Math.PI * 0.72;
const LX = Math.cos(LIGHT);
const LY = Math.sin(LIGHT);

// Resting inside the nest she can't be seen: she's underground. Neither she,
// nor her vision cone, nor the labels that follow her.
function hidden(fagi, world) {
  return fagi.alive && fagi.thought?.action === 'rest' && !!nestUnder(fagi, world);
}

export function render(ctx, world, fagi, camera) {
  setDetail(detailOf(camera));
  applySets(ctx, camera, ctx.canvas);
  const rain = rainLook(world, performance.now());
  scene(ctx, world, fagi, camera, rain);
  noCamera(ctx);
  // The drops fall between the camera and the ground: they don't grow with the zoom.
  if (rain > 0) drawRainDrops(ctx, world, performance.now());
  drawZoom(ctx, camera);
}

function scene(ctx, world, fagi, camera, rain) {
  drawTerrain(ctx, world);
  // What the ground loses when stretched by the zoom: the grain, in screen
  // pixels, and the small things —pebbles, blades of grass, leaves— in world pixels.
  drawZoomGrain(ctx, camera.zoom);
  drawNearDetail(ctx, world, camera, ctx.canvas);
  // The wet earth goes before the scent trails and everything else: it's ground.
  for (const o of world.objects) if (isWater(o)) drawShore(ctx, o, radiusOf(o));
  // Wet ground takes a while to dry, so it's drawn even when it's no longer raining.
  drawWetGround(ctx, world);

  // A shared shadow ties every object to the same ground and the same light.
  // The sprites keep their fine contact shadows; this is the ambient shadow,
  // wide and soft, that makes height readable from afar.
  drawGroundShadows(ctx, world);

  for (const { src, key } of scentSources(world)) {
    // The trail takes the source's color, and an overripe fruit drags its
    // smell toward the toxic one's even before it has fully rotted.
    // The tree is a special case: it advertises the fruit it bears, but it doesn't
    // rot, so it takes the fruit's plain color and isn't asked about ripeness.
    const color = POINT_TYPES[src.type] ? colorOf(src)
      : POINT_TYPES[key] ? POINT_TYPES[key].color
      : OBJECT_TYPES[key].color;
    drawTrail(ctx, src, color);
  }

  // Without Fagi (while setting up a session) only the map is drawn.
  const inside = fagi ? hidden(fagi, world) : false;
  foreground(ctx, world, fagi, camera, inside);
  // The overcast daylight and its clouds fall on everything, Fagi included.
  if (rain > 0) {
    drawOvercast(ctx, world, performance.now());
    drawSplashes(ctx, world, performance.now());
  }
}

function foreground(ctx, world, fagi, camera, inside) {

  drawPheromone(ctx, world);
  for (const o of world.objects) drawObject(ctx, o, inside, world.wind, rainFalling());
  for (const p of world.points) drawFruit(ctx, p);
  if (!fagi) return;

  // The cone is perception, not debugging: it must show in clean mode too.
  if (!inside) drawVisionCone(ctx, fagi);

  if (inside) {
    drawSleepMark(ctx, nestUnder(fagi, world));
    return;
  }

  // The line to the target is only drawn when she KNOWS where it is (she sees it).
  // Tracking a smell she doesn't know: the last spot where she smelled it is marked.
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
    const tree = isTree(o);
    const length = tree ? r * 1.72 : r * 0.7;
    const width = tree ? r * 0.52 : r * 0.34;
    const distance = tree ? r * 0.82 : r * 0.22;
    const x = o.x - LX * distance;
    const y = o.y - LY * distance;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(-LY, -LX));
    ctx.scale(1, width / length);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, length);
    g.addColorStop(0, tree ? 'rgba(8,12,9,0.28)' : 'rgba(8,10,12,0.22)');
    g.addColorStop(0.55, tree ? 'rgba(8,12,9,0.14)' : 'rgba(8,10,12,0.1)');
    g.addColorStop(1, 'rgba(8,10,12,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, length, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// The only giveaway that she's inside: three z's rising from the mouth.
function drawSleepMark(ctx, nestObj) {
  const t = performance.now() / 1000;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.45 + i / 3) % 1;
    ctx.fillStyle = `rgba(226,205,167,${Math.sin(phase * Math.PI) * 0.6})`;
    ctx.fillText(
      'z',
      nestObj.x + 8 + phase * 10,
      nestObj.y - 10 - phase * 22
    );
  }
  ctx.textAlign = 'left';
}

// The magnification, bottom left, and whether the camera is locked onto Fagi. With
// the whole map in view there's no need to say anything.
function drawZoom(ctx, camera) {
  if (camera.zoom <= 1.001 && !camera.follow) return;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(240,242,248,0.5)';
  ctx.textAlign = 'left';
  ctx.fillText(
    `×${camera.zoom.toFixed(1)}${camera.follow ? '  ⦿ Fagi' : ''}`,
    12, ctx.canvas.height - 12
  );
}

// Coordinates and heading attached to Fagi, to follow where she's going. The font
// is divided by the zoom: it stays the same size on screen, near or far.
function drawCoords(ctx, fagi, zoom = 1) {
  const dir = heading(fagi.angle);
  const text = `${Math.round(fagi.x)}, ${Math.round(fagi.y)} ${dir.arrow}`
    + (fagi.drinking ? ' drinking' : '');
  ctx.font = `${(11 / zoom).toFixed(2)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(240,242,248,0.65)';
  ctx.textAlign = 'center';
  ctx.fillText(text, fagi.x, fagi.y - FAGI.radius - 8 / zoom);
  ctx.textAlign = 'left';
}

function drawVisionCone(ctx, fagi) {
  const half = fovOf(fagi) / 2;
  const scope = viewRangeOf(fagi);
  const light = ctx.createRadialGradient(fagi.x, fagi.y, 0, fagi.x, fagi.y, scope);
  light.addColorStop(0, fagi.alive ? 'rgba(224,238,209,0.22)' : 'rgba(255,255,255,0.03)');
  light.addColorStop(0.72, fagi.alive ? 'rgba(213,230,199,0.13)' : 'rgba(255,255,255,0.02)');
  light.addColorStop(1, 'rgba(213,230,199,0.045)');
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.moveTo(fagi.x, fagi.y);
  ctx.arc(fagi.x, fagi.y, scope, fagi.angle - half, fagi.angle + half);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = fagi.alive ? 'rgba(226,242,211,0.34)' : 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

// The pheromone marks Fagi herself has left. They fade as they evaporate.
//
// It isn't a painted dot: it's a droplet. It wets the earth around it, has
// body and its back shines where the light hits —the same light as the ground
// and the rock—. As it evaporates it loses its shine before its stain, which is
// the order in which a real droplet dries.
function drawPheromone(ctx, world) {
  for (const m of world.pheromone) {
    const a = Math.max(0, Math.min(1, m.life / 45));

    // The wet earth around it: wider than the droplet and fainter.
    const wetness = ctx.createRadialGradient(m.x, m.y, 0.8, m.x, m.y, 7.2);
    wetness.addColorStop(0, `rgba(46,33,10,${a * 0.48})`);
    wetness.addColorStop(1, 'rgba(46,33,10,0)');
    ctx.fillStyle = wetness;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 7.2, 0, Math.PI * 2);
    ctx.fill();

    // The droplet's body.
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

    // The speck of sky on its back: it goes before the stain, just as when a
    // droplet dries the first thing lost is the shine.
    ctx.fillStyle = `rgba(255,246,214,${a * a * 0.45})`;
    ctx.beginPath();
    ctx.ellipse(m.x + LX * 1.25, m.y + LY * 1.1, 1.2, 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Each thing on the map is painted by its own module: the lake, the rock, the nest and the tree.
// `busy` is Fagi sleeping inside the nest.
function drawObject(ctx, o, busy, wind, raining) {
  const spec = OBJECT_TYPES[o.type];
  const r = radiusOf(o);
  if (spec.shallow) {
    drawPuddle(ctx, o, r, raining, performance.now());
  } else if (isWater(o)) {
    drawLake(ctx, o, spec, r, wind, performance.now());
    drawRipples(ctx, o, r * 0.8, raining, performance.now());
  } else if (isNest(o)) {
    drawNest(ctx, o, spec, r);
    drawNestMouth(ctx, o, r, busy, performance.now());
  } else if (isTree(o)) {
    drawTree(ctx, o, spec, r, wind, performance.now());
  } else {
    drawRock(ctx, o, spec, r);
  }
}

// The scent thread: a single line that leaves the source and grows across the
// map. It's drawn in segments so it fades as it moves away from the source.
function drawTrail(ctx, src, color) {
  const nodes = src.trail?.nodes;
  if (!nodes || nodes.length < 2) return;

  const [r, g, b] = toRGB(color);
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

// Exploring: the point in her field of view this leg heads for. On arriving
// she picks the next one based on what she sees then.
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

// Cross at the last point where the smell reached her: it's where she returns if she loses it.
function drawScentMark(ctx, fagi) {
  const p = fagi.lastScent;
  if (!p) return;
  ctx.strokeStyle = 'rgba(232,163,61,0.5)';
  ctx.beginPath();
  ctx.moveTo(p.x - 5, p.y); ctx.lineTo(p.x + 5, p.y);
  ctx.moveTo(p.x, p.y - 5); ctx.lineTo(p.x, p.y + 5);
  ctx.stroke();
}

// One ring per active buff, in the color of the food that gave it.
function drawBuffRings(ctx, fagi) {
  const list = activeEffects(fagi);
  ctx.lineWidth = 2;
  list.forEach((fx, i) => {
    ctx.globalAlpha = Math.min(1, fx.time / 1.5); // flickers as it expires
    ctx.strokeStyle = fx.color;
    ctx.beginPath();
    ctx.arc(fagi.x, fagi.y, FAGI.radius + 4 + i * 4, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}
