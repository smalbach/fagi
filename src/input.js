// Entrada del ratón y del teclado.
//
//   clic izquierdo   → coloca lo seleccionado. Con Agua elegida, MUEVE la fuente
//                      que ya existe en vez de crear otra (el mapa tiene una sola).
//   arrastrar        → mueve el objeto de mapa que haya debajo (nido, agua,
//                      árbol, roca).
//   clic derecho     → borra el objeto de mapa que haya debajo.
//   rueda            → zoom, clavado en el punto de debajo del cursor.
//   Mayús + rueda    → agranda o encoge el objeto bajo el cursor.
//   botón central    → arrastra el mapa.
//   flechas / WASD   → mueven la cámara.
//   + · − · 0        → acercar, alejar, volver al mapa entero.
//   F                → la cámara se pega a Fagi (o se suelta).
//
// El ratón trabaja en píxeles del lienzo y el mundo en sus propias coordenadas:
// todo lo que viene del ratón pasa por la cámara antes de tocar el mundo.
//
// `editable = false` (reproduciendo una partida grabada) deja solo la cámara.

import { addPoint, addObject, removeObject, waterSource, nestOf, record } from './world.js';
import { objectAt, radiusOf } from './obstacles.js';
import { TYPE_KEYS, OBJECT_TYPES, CAMERA } from './config.js';
import { ripe, approach, move, fit } from './camera.js';

const SIZE_LIMITS = { min: 18, max: 200 };

// Teclas que mueven la cámara, y hacia dónde.
const PANEO = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1],
};

export function createInput(canvas, world, camera) {
  // selected = clave de POINT_TYPES o de OBJECT_TYPES.
  const state = { selectedType: TYPE_KEYS[0], editable: true };
  const pressed = new Set();

  // Del lienzo puede verse una versión escalada por CSS: este factor lo deshace.
  function scaleOf() {
    const rect = canvas.getBoundingClientRect();
    return { k: canvas.width / rect.width, rect };
  }

  // Devuelve el punto del MUNDO bajo el cursor, y también el del lienzo, que es
  // el que necesita el zoom para saber sobre qué pixel clavarse.
  function worldPoint(e) {
    const { k, rect } = scaleOf();
    const sx = (e.clientX - rect.left) * k;
    const sy = (e.clientY - rect.top) * k;
    return { ...ripe(camera, canvas, sx, sy), sx, sy };
  }

  function move(obj, x, y) {
    obj.x = x; obj.y = y;
    record(world, 'obj_move', { id: obj.id, x, y });
  }

  // Arrastrar con el izquierdo mueve el objeto de debajo. Hasta que el ratón
  // no se aleja unos píxeles es un clic normal, que coloca.
  let grip = null;
  let justDragged = false;
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !state.editable) return;
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
    // Mientras se arrastra no se graba cada píxel: solo donde se suelta.
    grip.obj.x = Math.max(0, Math.min(world.width, p.x + grip.dx));
    grip.obj.y = Math.max(0, Math.min(world.height, p.y + grip.dy));
  });
  window.addEventListener('mouseup', () => {
    if (!grip) return;
    if (grip.moving) {
      move(grip.obj, grip.obj.x, grip.obj.y);
      justDragged = true;
      canvas.style.cursor = 'crosshair';
    }
    grip = null;
  });

  canvas.addEventListener('click', (e) => {
    if (justDragged) { justDragged = false; return; }
    if (!state.editable) return;
    const { x, y } = worldPoint(e);

    // De agua y nido solo hay uno: el clic los MUEVE en vez de duplicarlos.
    const uniques = { water: waterSource, nest: nestOf };
    if (uniques[state.selectedType]) {
      const existing = uniques[state.selectedType](world);
      if (existing) { move(existing, x, y); return; }
      addObject(world, x, y, state.selectedType, undefined, 'user');
      return;
    }

    if (OBJECT_TYPES[state.selectedType]) addObject(world, x, y, state.selectedType, undefined, 'user');
    else addPoint(world, x, y, state.selectedType, 'user');
  });

  // Clic derecho: quitar el objeto del mapa que haya debajo.
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!state.editable) return;
    const { x, y } = worldPoint(e);
    const obj = objectAt(world, x, y);
    if (obj) removeObject(world, obj, 'user');
  });

  // Rueda: zoom. Con Mayús, el tamaño del objeto de debajo, que es lo que hacía
  // antes la rueda sola.
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

  // Arrastrar con el botón central: el izquierdo ya coloca cosas y el derecho las
  // borra, así que el paneo se queda con el que no hace nada más.
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

  // Teclado. Escribiendo en un campo de los ajustes no se toca la cámara.
  const writing = (e) => ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName);

  window.addEventListener('keydown', (e) => {
    if (writing(e)) return;
    const center = { sx: canvas.width / 2, sy: canvas.height / 2 };

    if (PANEO[e.key]) { pressed.add(e.key); e.preventDefault(); return; }

    if (e.key === '+' || e.key === '=') approach(camera, canvas, world, center.sx, center.sy, CAMERA.step);
    else if (e.key === '-' || e.key === '_') approach(camera, canvas, world, center.sx, center.sy, 1 / CAMERA.step);
    else if (e.key === '0') { camera.zoom = CAMERA.min; camera.follow = false; fit(camera, canvas, world); }
    else if (e.key === 'f' || e.key === 'F') camera.follow = !camera.follow;
  });

  window.addEventListener('keyup', (e) => pressed.delete(e.key));
  window.addEventListener('blur', () => pressed.clear());

  // Paneo con teclas: va por fotograma, no por pulsación, para que se mueva
  // suave mientras la tecla siga abajo.
  state.pan = (dt) => {
    let dx = 0;
    let dy = 0;
    for (const k of pressed) {
      const v = PANEO[k];
      if (v) { dx += v[0]; dy += v[1]; }
    }
    if (!dx && !dy) return;
    const step = CAMERA.keysDown * dt;
    move(camera, canvas, world, -dx * step, -dy * step);
  };

  return state;
}

export { SIZE_LIMITS };
