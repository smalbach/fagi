// Mouse and keyboard input.
//
//   left click       → places the selected item. With Water chosen, it MOVES the
//                      existing source instead of creating another (the map has one).
//                      On a Fagi, or with Inspect chosen (always while replaying),
//                      it shows everything about what is there (inspect.js).
//   drag             → moves the map object underneath (nest, water,
//                      tree, rock).
//   right click      → deletes the map object underneath.
//   wheel            → zoom, pinned to the point under the cursor.
//   Shift + wheel    → grows or shrinks the object under the cursor.
//   middle button    → drags the map.
//   arrows / WASD    → move the camera.
//   + · − · 0        → zoom in, zoom out, back to the whole map.
//   F                → the camera sticks to Fagi (or lets go).
//
// The mouse works in canvas pixels and the world in its own coordinates:
// everything that comes from the mouse goes through the camera before touching
// the world.
//
// `editable = false` (replaying a recorded game) leaves only the camera.

import { addPoint, addObject, removeObject, waterSource, nestOf, record } from './world.js';
import { objectAt, radiusOf } from './obstacles.js';
import { TYPE_KEYS, OBJECT_TYPES, CAMERA } from './config.js';
import { ripe, approach, move, fit } from './camera.js';

const SIZE_LIMITS = { min: 18, max: 200 };

// Keys that move the camera, and in which direction.
const PAN_KEYS = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1],
};

// Not a type to place: the tool that asks Fagi what she thinks of a fruit (ask.js).
export const ASK = 'ask';
// Nor this one: the tool that shows everything about what is clicked (inspect.js).
export const INSPECT = 'inspect';

export function createInput(canvas, world, camera) {
  // selected = a POINT_TYPES or OBJECT_TYPES key, ASK or INSPECT.
  // onAsk(x, y) = what to do when asking at a world point (main.js sets it).
  // onInspect(x, y) = show what is there; pickFagi(x, y) = select a Fagi if
  // one is there (true), so a click on her never drops food on her.
  const state = { selectedType: TYPE_KEYS[0], editable: true };
  const pressed = new Set();

  // The canvas may be shown scaled by CSS: this factor undoes that.
  function scaleOf() {
    const rect = canvas.getBoundingClientRect();
    return { k: canvas.width / rect.width, rect };
  }

  // Returns the WORLD point under the cursor, and also the canvas one, which is
  // what the zoom needs to know which pixel to pin to.
  function worldPoint(e) {
    const { k, rect } = scaleOf();
    const sx = (e.clientX - rect.left) * k;
    const sy = (e.clientY - rect.top) * k;
    return { ...ripe(camera, canvas, sx, sy), sx, sy };
  }

  function moveObject(obj, x, y) {
    obj.x = x; obj.y = y;
    record(world, 'obj_move', { id: obj.id, x, y });
  }

  // Dragging with the left button moves the object underneath. Until the mouse
  // moves a few pixels away it's a normal click, which places.
  let grip = null;
  let justDragged = false;
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !state.editable || state.selectedType === ASK) return;
    const p = worldPoint(e);
    const obj = objectAt(world, p.x, p.y);
    if (obj) grip = { obj, x0: e.clientX, y0: e.clientY, dx: obj.x - p.x, dy: obj.y - p.y, moving: false };
  });
  window.addEventListener('mousemove', (e) => {
    if (!grip) return;
    if (!grip.moving && Math.hypot(e.clientX - grip.x0, e.clientY - grip.y0) < 5) return;
    grip.moving = true;
    canvas.style.cursor = 'grabbing';
    const p = worldPoint(e);
    // While dragging, not every pixel is recorded: only where it's dropped.
    grip.obj.x = Math.max(0, Math.min(world.width, p.x + grip.dx));
    grip.obj.y = Math.max(0, Math.min(world.height, p.y + grip.dy));
  });
  window.addEventListener('mouseup', () => {
    if (!grip) return;
    if (grip.moving) {
      moveObject(grip.obj, grip.obj.x, grip.obj.y);
      justDragged = true;
      canvas.style.cursor = 'crosshair';
    }
    grip = null;
  });

  canvas.addEventListener('click', (e) => {
    if (justDragged) { justDragged = false; return; }
    // Asking and inspecting change nothing in the world: they work while replaying too.
    if (state.selectedType === ASK) { const p = worldPoint(e); state.onAsk?.(p.x, p.y); return; }
    if (state.selectedType === INSPECT || !state.editable) { const p = worldPoint(e); state.onInspect?.(p.x, p.y); return; }
    const { x, y } = worldPoint(e);
    if (state.pickFagi?.(x, y)) return;

    // There's only one water and one nest: the click MOVES them instead of duplicating them.
    const uniques = { water: waterSource, nest: nestOf };
    if (uniques[state.selectedType]) {
      const existing = uniques[state.selectedType](world);
      if (existing) { moveObject(existing, x, y); return; }
      addObject(world, x, y, state.selectedType, undefined, 'user');
      return;
    }

    if (OBJECT_TYPES[state.selectedType]) addObject(world, x, y, state.selectedType, undefined, 'user');
    else addPoint(world, x, y, state.selectedType, 'user');
  });

  // Right click: remove the map object underneath.
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!state.editable) return;
    const { x, y } = worldPoint(e);
    const obj = objectAt(world, x, y);
    if (obj) removeObject(world, obj, 'user');
  });

  // Wheel: zoom. With Shift, the size of the object underneath, which is what
  // the wheel alone used to do.
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = worldPoint(e);

    if (e.shiftKey) {
      if (!state.editable) return;
      const obj = objectAt(world, p.x, p.y);
      if (!obj) return;
      const step = e.deltaY < 0 ? 6 : -6;
      obj.r = Math.max(SIZE_LIMITS.min, Math.min(SIZE_LIMITS.max, radiusOf(obj) + step));
      record(world, 'obj_resize', { id: obj.id, r: obj.r });
      return;
    }

    approach(camera, canvas, world, p.sx, p.sy, e.deltaY < 0 ? CAMERA.step : 1 / CAMERA.step);
  }, { passive: false });

  // Drag with the middle button: the left one already places things and the right
  // one deletes them, so panning gets the one that does nothing else.
  let drag = null;
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 1) return;
    e.preventDefault();
    drag = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });

  window.addEventListener('mousemove', (e) => {
    if (!drag) return;
    const { k } = scaleOf();
    move(camera, canvas, world, (e.clientX - drag.x) * k, (e.clientY - drag.y) * k);
    drag = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => {
    if (!drag) return;
    drag = null;
    canvas.style.cursor = 'crosshair';
  });

  // Keyboard. While typing in a settings field the camera is left alone.
  const writing = (e) => ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName);

  window.addEventListener('keydown', (e) => {
    if (writing(e)) return;
    const center = { sx: canvas.width / 2, sy: canvas.height / 2 };

    if (PAN_KEYS[e.key]) { pressed.add(e.key); e.preventDefault(); return; }

    if (e.key === '+' || e.key === '=') approach(camera, canvas, world, center.sx, center.sy, CAMERA.step);
    else if (e.key === '-' || e.key === '_') approach(camera, canvas, world, center.sx, center.sy, 1 / CAMERA.step);
    else if (e.key === '0') { camera.zoom = CAMERA.min; camera.follow = false; fit(camera, canvas, world); }
    else if (e.key === 'f' || e.key === 'F') camera.follow = !camera.follow;
  });

  window.addEventListener('keyup', (e) => pressed.delete(e.key));
  window.addEventListener('blur', () => pressed.clear());

  // Key panning: it goes per frame, not per keypress, so it moves smoothly
  // while the key stays down.
  state.pan = (dt) => {
    let dx = 0;
    let dy = 0;
    for (const k of pressed) {
      const v = PAN_KEYS[k];
      if (v) { dx += v[0]; dy += v[1]; }
    }
    if (!dx && !dy) return;
    const step = CAMERA.keysDown * dt;
    move(camera, canvas, world, -dx * step, -dy * step);
  };

  return state;
}

export { SIZE_LIMITS };
