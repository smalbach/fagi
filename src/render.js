// Drawing: terrain, vision cone, points and Fagi.
//
// All of the world's drawing goes through the camera transform, so no sprite
// module knows zoom exists: they keep painting in world coordinates. The only
// thing they do find out about is the DETAIL scale, which tells them how many
// pixels to paint their canvas with so that zooming in doesn't stretch an old
// image. The HUD (the coordinates, the magnification) is drawn without the
// camera or with the font divided by the zoom, so it doesn't grow with it.

import { cycleAt } from './cycle.js';
import { FAGI, POINT_TYPES, OBJECT_TYPES, CYCLE, PLUME } from './config.js';
import { heading } from './compass.js';
import { viewRangeOf, fovOf } from './vision.js';
import { activeEffects } from './effects.js';
import { isWater, isNest, isTree, radiusOf } from './obstacles.js';
import { colorOf, toRGB } from './colors.js';
import { drawFagi, ellipse } from './fagi-sprite.js';
import { scentSources, scentFromSourceAt } from './smell.js';
import { drawRock } from './rock-sprite.js';
import { drawThing } from './thing-sprite.js';
import { drawNest, drawNestMouth } from './nest-sprite.js';
import { drawTree } from './tree-sprite.js';
import { drawFruit } from './fruit-sprite.js';
import { drawTerrain, drawShore, drawZoomGrain, drawNearDetail } from './terrain.js';
import { drawLake } from './water-sprite.js';
import { drawPuddle, drawRipples, drawWetGround, drawOvercast, drawSplashes, drawRainDrops, rainLook, rainFalling } from './rain-sprite.js';
import { setDetail, cacheSprite, canvasOf } from './sprite-kit.js';
import { climateLook, drawSeasonGround, drawFrostSnow, drawIce } from './climate-sprite.js';
import { drawMud } from './mud-sprite.js';
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

// `mark`: { x, y, r } of what the inspector has selected (inspect.js), or null.
// `editing`: the map object selected for editing (input.js), or null.
export function render(ctx, world, fagi, camera, mark = null, editing = null) {
  setDetail(detailOf(camera));
  applySets(ctx, camera, ctx.canvas);
  const rain = rainLook(world, (world.time ?? 0) * 1000);
  climateLook(world);
  scene(ctx, world, fagi, camera, rain);
  if (mark) drawMark(ctx, mark, camera.zoom);
  if (editing && world.objects.includes(editing)) drawEditing(ctx, editing, camera.zoom);
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
  // The season on the vegetation: autumn ochre, winter dormancy, summer drought,
  // and the leaves the broadleaf trees have dropped (climate-sprite.js).
  drawSeasonGround(ctx, world);
  // Wet ground takes a while to dry, so it's drawn even when it's no longer raining.
  drawWetGround(ctx, world);
  // Heavy mud patches and trails paved by repeated passage (niche construction).
  for (const m of world.mud ?? []) drawMud(ctx, m);
  // Rime and snow settle over all of that, under the objects.
  drawFrostSnow(ctx, world);

  // A shared shadow ties every object to the same ground and the same light.
  // The sprites keep their fine contact shadows; this is the ambient shadow,
  // wide and soft, that makes height readable from afar.
  drawGroundShadows(ctx, world);

  const noses = smellers(world, fagi);
  const fade = trailFade();
  for (const source of scentSources(world)) {
    const { src, key } = source;
    // Hidden trails (PLUME.show = 0) show only while some Fagi smells them,
    // fading in and out instead of blinking.
    const alpha = trailAlpha(src, PLUME.show === 1 || noses.some((a) => scentFromSourceAt(a, source, a.x, a.y) > 0), fade);
    if (alpha <= 0) continue;
    // The trail takes the source's color, and an overripe fruit drags its
    // smell toward the toxic one's even before it has fully rotted.
    // The tree is a special case: it advertises the fruit it bears, but it doesn't
    // rot, so it takes the fruit's plain color and isn't asked about ripeness.
    const color = POINT_TYPES[src.type] ? colorOf(src)
      : POINT_TYPES[key] ? POINT_TYPES[key].color
      : OBJECT_TYPES[key].color;
    drawTrail(ctx, src, color, alpha);
  }

  // Without Fagi (while setting up a session) only the map is drawn.
  const inside = fagi ? hidden(fagi, world) : false;
  foreground(ctx, world, fagi, camera, inside);
  // The overcast daylight and its clouds fall on everything, Fagi included.
  if (rain > 0) {
    drawOvercast(ctx, world, performance.now());
    drawSplashes(ctx, world, performance.now());
  }
  // And the night over all of it (cycle.js): the same clock the simulation reads.
  drawNight(ctx, world);
}

// Darkness as a cool multiply, deepest at minimum light; a warm veil at dawn
// and dusk, while the light is between.
function drawNight(ctx, world) {
  if (!CYCLE.enabled) return;
  const sky = cycleAt(world.time);
  const dark = Math.min(1, (1 - sky.light) / (1 - CYCLE.minLight));
  if (dark <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(52,64,120,${(dark * 0.78).toFixed(3)})`;
  ctx.fillRect(0, 0, world.width, world.height);
  const twilight = dark * (1 - dark) * 4;   // 0 at full day or night, 1 halfway
  if (twilight > 0.02) {
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = `rgba(255,150,90,${(twilight * 0.35).toFixed(3)})`;
    ctx.fillRect(0, 0, world.width, world.height);
  }
  ctx.restore();
}

function foreground(ctx, world, fagi, camera, inside) {

  drawPheromone(ctx, world);
  for (const o of world.objects) drawObject(ctx, o, inside, world.wind, rainFalling(), world.time);
  for (const p of world.points) drawFruit(ctx, p);
  // Her sisters (colony.js), under her: the one you follow stays on top.
  for (const s of world.colony?.ants ?? []) {
    if (!s.sister || (s.alive && s.thought && hidden(s, world))) continue;
    drawFagi(ctx, s);
    if (!world.immersive) drawSisterId(ctx, s);
  }
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
  // A thing she is taking home for the nest (things.js), held in front of her.
  if (fagi.hauling) {
    const hx = fagi.x + Math.cos(fagi.angle) * 9;
    const hy = fagi.y + Math.sin(fagi.angle) * 9;
    drawThing(ctx, { id: fagi.hauling.id, x: hx, y: hy, look: fagi.hauling.look }, 5, world.time);
  }
  drawBuffRings(ctx, fagi);
  if (!world.immersive) drawCoords(ctx, fagi, camera.zoom);
}

// The inspector's selection: a dashed ring that turns slowly, the same
// thickness at every zoom.
function drawMark(ctx, { x, y, r }, zoom) {
  const t = performance.now() / 1000;
  ctx.save();
  ctx.lineWidth = 1.6 / zoom;
  ctx.setLineDash([5 / zoom, 4 / zoom]);
  ctx.lineDashOffset = -t * 12 / zoom;
  ctx.strokeStyle = 'rgba(255,236,150,0.95)';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(x, y, r + Math.sin(t * 3) * 1.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// The object being edited: a solid ring at its edge and, on the right, the
// handle that resizes it, with its radius beside it. Screen-sized at any zoom.
function drawEditing(ctx, obj, zoom) {
  const r = radiusOf(obj);
  ctx.save();
  ctx.lineWidth = 1.4 / zoom;
  ctx.strokeStyle = 'rgba(140,210,255,0.9)';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(obj.x, obj.y);
  ctx.lineTo(obj.x + r, obj.y);
  ctx.setLineDash([3 / zoom, 3 / zoom]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#8cd2ff';
  ctx.strokeStyle = '#10202c';
  ctx.beginPath();
  ctx.arc(obj.x + r, obj.y, 6 / zoom, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = `600 ${(11 / zoom).toFixed(2)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(230,240,250,0.95)';
  ctx.fillText(`r ${Math.round(r)}`, obj.x + r + 10 / zoom, obj.y - 8 / zoom);
  ctx.restore();
}

// Which sister it is, small, above her: 'Fagi 3' in the narration is this one.
function drawSisterId(ctx, s) {
  ctx.save();
  ctx.font = '600 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(230,232,238,0.85)';
  ctx.strokeStyle = 'rgba(20,22,28,0.8)';
  ctx.lineWidth = 3;
  const label = s.name ? `${s.name.given} · ${s.id}` : String(s.id);
  ctx.strokeText(label, s.x, s.y - 12);
  ctx.fillText(label, s.x, s.y - 12);
  ctx.restore();
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
  if (!world.pheromone.length) return;
  // Only the marks inside the view: a long-used trail leaves hundreds of them.
  const { x0, y0, x1, y1 } = viewBounds(ctx, PHERO_REACH);
  for (const m of world.pheromone) {
    if (m.x < x0 || m.x > x1 || m.y < y0 || m.y > y1) continue;
    const a = Math.max(0, Math.min(1, m.life / 45));
    const level = Math.round(a * PHERO_LEVELS);
    if (level === 0) continue;
    ctx.drawImage(dropletSprite(level), m.x - PHERO_REACH, m.y - PHERO_REACH, PHERO_REACH * 2, PHERO_REACH * 2);
  }
}

// The droplet is the same everywhere but for how dry it is, so it is painted
// once per step of dryness and then only stamped: building three gradients
// per mark per frame was the slowest thing on a well-used trail.
const PHERO_REACH = 7.2;     // world radius of the wet stain, the widest part
const PHERO_LEVELS = 32;     // steps of dryness; finer can't be told apart
const PHERO_RES = 4;         // sprite pixels per world pixel: crisp up to zoom 4
const dropletSprites = new Map();

function dropletSprite(level) {
  return cacheSprite(dropletSprites, level, () => {
    const a = level / PHERO_LEVELS;
    const size = Math.ceil(PHERO_REACH * 2 * PHERO_RES);
    const img = canvasOf(size, size);
    const c = img.getContext('2d');
    c.scale(size / (PHERO_REACH * 2), size / (PHERO_REACH * 2));
    c.translate(PHERO_REACH, PHERO_REACH);

    // The wet earth around it: wider than the droplet and fainter.
    const wetness = c.createRadialGradient(0, 0, 0.8, 0, 0, PHERO_REACH);
    wetness.addColorStop(0, `rgba(46,33,10,${a * 0.48})`);
    wetness.addColorStop(1, 'rgba(46,33,10,0)');
    c.fillStyle = wetness;
    c.beginPath();
    c.arc(0, 0, PHERO_REACH, 0, Math.PI * 2);
    c.fill();

    // The droplet's body.
    const drop = c.createRadialGradient(LX * 1.2, LY * 1.2, 0.25, 0, 0, 4.1);
    drop.addColorStop(0, `rgba(226,192,84,${a * 0.55})`);
    drop.addColorStop(0.6, `rgba(201,162,39,${a * 0.42})`);
    drop.addColorStop(1, `rgba(150,116,26,${a * 0.18})`);
    c.fillStyle = drop;
    c.beginPath();
    c.ellipse(0, 0, 3.9, 3.2, 0, 0, Math.PI * 2);
    c.fill();

    // The speck of sky on its back: it goes before the stain, just as when a
    // droplet dries the first thing lost is the shine.
    c.fillStyle = `rgba(255,246,214,${a * a * 0.45})`;
    c.beginPath();
    c.ellipse(LX * 1.25, LY * 1.1, 1.2, 0.82, 0, 0, Math.PI * 2);
    c.fill();
    return img;
  });
}

// The piece of the world on screen under the current transform, widened by
// `pad` so something half in view is still drawn.
function viewBounds(ctx, pad = 0) {
  const t = ctx.getTransform();
  const x0 = -t.e / t.a, y0 = -t.f / t.d;
  return {
    x0: x0 - pad, y0: y0 - pad,
    x1: x0 + ctx.canvas.width / t.a + pad, y1: y0 + ctx.canvas.height / t.d + pad,
  };
}

// Each thing on the map is painted by its own module: the lake, the rock, the nest and the tree.
// `busy` is Fagi sleeping inside the nest.
function drawObject(ctx, o, busy, wind, raining, time) {
  const spec = OBJECT_TYPES[o.type];
  const r = radiusOf(o);
  if (spec.shallow) {
    drawPuddle(ctx, o, r, raining, performance.now());
    drawIce(ctx, o, r * 0.9);
  } else if (isWater(o)) {
    drawLake(ctx, o, spec, r, wind, performance.now());
    drawRipples(ctx, o, r * 0.8, raining, performance.now());
    drawIce(ctx, o, r * 0.78);
  } else if (isNest(o)) {
    drawNest(ctx, o, spec, r);
    drawNestMouth(ctx, o, r, busy, performance.now());
    // Its lining (things.js): what was carried in, around the rim.
    (o.lining ?? []).forEach((item, i, all) => {
      const a = (i / Math.max(3, all.length)) * Math.PI * 2 + 0.6;
      drawThing(ctx, { id: item.id, x: o.x + Math.cos(a) * r * 0.62, y: o.y + Math.sin(a) * r * 0.62, look: item.look }, 6, time);
    });
  } else if (isTree(o)) {
    drawTree(ctx, o, spec, r, wind, performance.now());
  } else if (spec.kind === 'thing') {
    drawThing(ctx, o, r, time);
  } else {
    drawRock(ctx, o, spec, r);
  }
}

// Who can be smelling a trail: Fagi and her living sisters.
function smellers(world, fagi) {
  const out = [];
  if (fagi?.alive && fagi.effects) out.push(fagi);
  for (const s of world.colony?.ants ?? []) if (s.alive && s.effects && s !== fagi) out.push(s);
  return out;
}

// How much of a trail shows, eased toward 1 while smelled and toward 0 after.
// Kept per source, by drawing time: it's only the picture, never the world.
const trailSeen = new WeakMap();
const TRAIL_IN = 0.25;          // seconds to appear
const TRAIL_OUT = 1.2;          // seconds to fade once no one smells it
let lastTrailFrame = 0;

function trailFade() {
  const now = performance.now();
  const dt = lastTrailFrame ? Math.min(0.25, (now - lastTrailFrame) / 1000) : 0;
  lastTrailFrame = now;
  return dt;
}

function trailAlpha(src, smelled, dt) {
  const before = trailSeen.get(src) ?? (smelled ? 1 : 0);
  const now = smelled
    ? Math.min(1, before + dt / TRAIL_IN)
    : Math.max(0, before - dt / TRAIL_OUT);
  trailSeen.set(src, now);
  return now;
}

// The scent thread: a single line that leaves the source and grows across the
// map. It's drawn in segments so it fades as it moves away from the source.
// `alpha` fades the whole thread in and out.
function drawTrail(ctx, src, color, alpha = 1) {
  const nodes = src.trail?.nodes;
  if (!nodes || nodes.length < 2) return;

  const [r, g, b] = toRGB(color);
  ctx.lineCap = 'round';
  for (let i = 1; i < nodes.length; i++) {
    const t = i / nodes.length;
    ctx.lineWidth = 4.2;
    ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - t) * 0.16 * alpha})`;
    ctx.beginPath();
    ctx.moveTo(nodes[i - 1].x, nodes[i - 1].y);
    ctx.lineTo(nodes[i].x, nodes[i].y);
    ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - t) * 0.75 * alpha})`;
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
