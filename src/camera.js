// The camera: which piece of the world is visible and at what magnification.
//
// The world doesn't change size when zooming: what changes is the window you
// look through. All of the game's drawing goes through a single transform
// (applySets), so nothing else in the code needs to know zoom exists; the only
// thing that does have to know is the mouse, which works in screen pixels
// and needs to translate them into world coordinates (ripe).
//
// The framing never leaves the map: zoomed in, the camera moves within its
// edges; fully zoomed out, it stays centered. That way there's never an empty
// gap around the terrain.

import { CAMERA } from './config.js';

export function createCamera(world) {
  return {
    x: world.width / 2,
    y: world.height / 2,
    zoom: 1,
    follow: false,   // framing locked onto Fagi
  };
}

function limit(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Keeps the center where the view still falls entirely inside the world.
export function fit(cam, canvas, world) {
  cam.zoom = limit(cam.zoom, CAMERA.min, CAMERA.max);
  const vw = canvas.width / cam.zoom;
  const vh = canvas.height / cam.zoom;
  cam.x = vw >= world.width ? world.width / 2 : limit(cam.x, vw / 2, world.width - vw / 2);
  cam.y = vh >= world.height ? world.height / 2 : limit(cam.y, vh / 2, world.height - vh / 2);
  return cam;
}

export function applySets(ctx, cam, canvas) {
  ctx.setTransform(
    cam.zoom, 0, 0, cam.zoom,
    canvas.width / 2 - cam.x * cam.zoom,
    canvas.height / 2 - cam.y * cam.zoom
  );
}

// Back to screen pixels: for the HUD, which must not grow with the zoom.
export function noCamera(ctx) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// Canvas pixel → world point.
export function ripe(cam, canvas, sx, sy) {
  return {
    x: (sx - canvas.width / 2) / cam.zoom + cam.x,
    y: (sy - canvas.height / 2) / cam.zoom + cam.y,
  };
}

// Zoom with the point under the cursor pinned: the wheel zooms toward where
// you're looking, not toward the center of the screen.
export function approach(cam, canvas, world, sx, sy, factor) {
  const before = ripe(cam, canvas, sx, sy);
  cam.zoom = limit(cam.zoom * factor, CAMERA.min, CAMERA.max);
  cam.x = before.x - (sx - canvas.width / 2) / cam.zoom;
  cam.y = before.y - (sy - canvas.height / 2) / cam.zoom;
  fit(cam, canvas, world);
}

// Dragging the map: the offset comes in screen pixels.
export function move(cam, canvas, world, dx, dy) {
  cam.x -= dx / cam.zoom;
  cam.y -= dy / cam.zoom;
  cam.follow = false;   // taking control lets go of Fagi
  fit(cam, canvas, world);
}

export function centerOn(cam, canvas, world, p) {
  cam.x = p.x;
  cam.y = p.y;
  fit(cam, canvas, world);
}

// How many sprite pixels to paint per world pixel. Rounded to an integer
// because every step forces the sprites to be repainted: with half a step
// per frame, smooth zoom would repaint them nonstop.
export function detailOf(cam) {
  return Math.min(CAMERA.maxDetail, Math.max(1, Math.ceil(cam.zoom - 0.02)));
}
