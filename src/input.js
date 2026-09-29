// Mouse and keyboard input.
//
//   left click       → places the selected item. With Nest chosen, it MOVES the
//                      existing nest instead of creating another (the map has one).
//                      A tree chosen with a fruit ('tree:<fruit>') bears that fruit.
//                      On an object with a map object chosen, it selects that
//                      object for editing instead of piling another on it.
//                      On a Fagi, or with Inspect chosen (always while replaying),
//                      it shows everything about what is there (inspect.js).
//   drag             → moves the map object underneath (nest, water,
//                      tree, rock), and selects it for editing.
//   edit handle      → the dot on the right edge of the selected object:
//                      dragging it grows or shrinks it. [ and ] do the same,
//                      Delete removes it, Esc lets it go.
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

import { addPoint, addObject, removeObject, nestOf, record } from './world.js';
import { objectAt, radiusOf } from './obstacles.js';
import { OBJECT_TYPES, CAMERA } from './config.js';
import { ripe, approach, move, fit, minZoom } from './camera.js';

const SIZE_LIMITS = { min: 8, max: 800 };

// A palette key for a tree that bears a given fruit.
export const TREE_PREFIX = 'tree:';

// Where the edit handle of an object sits, in world coordinates.
export const handleOf = (obj) => ({ x: obj.x + radiusOf(obj), y: obj.y });

// Sets an object's radius, as the world keeps it (a puddle's lives in `size`).
function resize(world, obj, r) {
  obj.r = Math.round(Math.max(SIZE_LIMITS.min, Math.min(SIZE_LIMITS.max, r)));
  if (obj.size != null) obj.size = obj.r;
  return obj.r;
}

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
  // selected = a POINT_TYPES or OBJECT_TYPES key, ASK, INSPECT or null
  // (nothing chosen yet: a click only picks a map object to edit).
  // onAsk(x, y) = what to do when asking at a world point (main.js sets it).
  // onInspect(x, y) = show what is there; pickFagi(x, y) = select a Fagi if
  // one is there (true), so a click on her never drops food on her.
  // editing = the map object selected for editing (moved, resized, removed).
  const state = { selectedType: null, editable: true, editing: null };
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
  // The selected object is gone (eaten by the rain, removed, a new map): let it go.
  const editing = () => (state.editing && world.objects.includes(state.editing) ? state.editing : (state.editing = null));

  // Is the point on the selected object's edit handle? Its size is in screen pixels.
  function onHandle(p) {
    const obj = editing();
    if (!obj) return false;
    const h = handleOf(obj);
    return Math.hypot(p.x - h.x, p.y - h.y) <= 10 / camera.zoom;
  }

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !state.editable || state.selectedType === ASK) return;
    const p = worldPoint(e);
    if (onHandle(p)) {
      grip = { obj: state.editing, x0: e.clientX, y0: e.clientY, sizing: true, moving: false };
      return;
    }
    const obj = objectAt(world, p.x, p.y);
    if (obj) grip = { obj, x0: e.clientX, y0: e.clientY, dx: obj.x - p.x, dy: obj.y - p.y, moving: false };
  });
  canvas.addEventListener('mousemove', (e) => {
    if (grip || !state.editable) return;
    canvas.style.cursor = onHandle(worldPoint(e)) ? 'ew-resize' : 'crosshair';
  });
  window.addEventListener('mousemove', (e) => {
    if (!grip) return;
    if (!grip.moving && Math.hypot(e.clientX - grip.x0, e.clientY - grip.y0) < 5) return;
    grip.moving = true;
    const p = worldPoint(e);
    if (grip.sizing) {
      canvas.style.cursor = 'ew-resize';
      resize(world, grip.obj, Math.hypot(p.x - grip.obj.x, p.y - grip.obj.y));
      return;
    }
    canvas.style.cursor = 'grabbing';
    state.editing = grip.obj;
    // While dragging, not every pixel is recorded: only where it's dropped.
    grip.obj.x = Math.max(0, Math.min(world.width, p.x + grip.dx));
    grip.obj.y = Math.max(0, Math.min(world.height, p.y + grip.dy));
  });
  window.addEventListener('mouseup', () => {
    if (!grip) return;
    if (grip.moving) {
      if (grip.sizing) record(world, 'obj_resize', { id: grip.obj.id, r: grip.obj.r });
      else moveObject(grip.obj, grip.obj.x, grip.obj.y);
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

    const sel = state.selectedType;
    // Nothing chosen: nothing is placed, a click on an object selects it.
    if (!sel) { state.editing = objectAt(world, x, y); return; }
    const tree = sel.startsWith(TREE_PREFIX);
    const placesObject = tree || Boolean(OBJECT_TYPES[sel]);
    // With a map object chosen, a click on another one selects it for editing:
    // objects don't pile up. Food still falls anywhere, a tree's crown included.
    const under = objectAt(world, x, y);
    if (placesObject && under) { state.editing = under; return; }
    if (!under) state.editing = null;

    // There's only one nest: the click MOVES it instead of duplicating it.
    if (sel === 'nest') {
      const existing = nestOf(world);
      if (existing) { moveObject(existing, x, y); return; }
      state.editing = addObject(world, x, y, sel, undefined, 'user');
      return;
    }

    if (tree) {
      const obj = addObject(world, x, y, 'tree', undefined, 'user');
      obj.fruit = sel.slice(TREE_PREFIX.length);
      record(world, 'obj_fruit', { id: obj.id, what: obj.fruit });
      state.editing = obj;
    } else if (OBJECT_TYPES[sel]) state.editing = addObject(world, x, y, sel, undefined, 'user');
    else addPoint(world, x, y, sel, 'user');
  });

  // Right click: remove the map object underneath.
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!state.editable) return;
    const { x, y } = worldPoint(e);
    const obj = objectAt(world, x, y);
    if (obj) removeObject(world, obj, 'user');
    if (obj === state.editing) state.editing = null;
  });

  // Wheel: zoom. With Shift, the size of the object underneath, which is what
  // the wheel alone used to do.
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = worldPoint(e);

    if (e.shiftKey) {
      if (!state.editable) return;
      const obj = objectAt(world, p.x, p.y) ?? editing();
      if (!obj) return;
      // In proportion: a big lake grows by more than a pebble per notch.
      const step = Math.max(4, radiusOf(obj) * 0.08) * (e.deltaY < 0 ? 1 : -1);
      resize(world, obj, radiusOf(obj) + step);
      record(world, 'obj_resize', { id: obj.id, r: obj.r });
      state.editing = obj;
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

    // The selected object: grow, shrink, remove, let go.
    const obj = state.editable ? editing() : null;
    if (obj && (e.key === '[' || e.key === ']')) {
      resize(world, obj, radiusOf(obj) * (e.key === ']' ? 1.1 : 1 / 1.1));
      record(world, 'obj_resize', { id: obj.id, r: obj.r });
      return;
    }
    if (obj && (e.key === 'Delete' || e.key === 'Backspace')) {
      removeObject(world, obj, 'user');
      state.editing = null;
      e.preventDefault();
      return;
    }
    if (e.key === 'Escape') state.editing = null;

    if (e.key === '+' || e.key === '=') approach(camera, canvas, world, center.sx, center.sy, CAMERA.step);
    else if (e.key === '-' || e.key === '_') approach(camera, canvas, world, center.sx, center.sy, 1 / CAMERA.step);
    else if (e.key === '0') { camera.zoom = minZoom(canvas, world); camera.follow = false; fit(camera, canvas, world); }
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
