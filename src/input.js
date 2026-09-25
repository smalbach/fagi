// Entrada del ratón y del teclado.
//
//   clic izquierdo   → coloca lo seleccionado. Con Agua elegida, MUEVE la fuente
//                      que ya existe en vez de crear otra (el mapa tiene una sola).
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

import { addPoint, addObject, removeObject, waterSource, nestOf } from './world.js';
import { objectAt, radiusOf } from './obstacles.js';
import { TYPE_KEYS, OBJECT_TYPES, CAMERA } from './config.js';
import { aPunto, acercar, mover, encajar } from './camera.js';

const SIZE_LIMITS = { min: 18, max: 200 };

// Teclas que mueven la cámara, y hacia dónde.
const PANEO = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1],
};

export function createInput(canvas, world, camera) {
  // selected = clave de POINT_TYPES o de OBJECT_TYPES.
  const state = { selectedType: TYPE_KEYS[0] };
  const pulsadas = new Set();

  // Del lienzo puede verse una versión escalada por CSS: este factor lo deshace.
  function escala() {
    const rect = canvas.getBoundingClientRect();
    return { k: canvas.width / rect.width, rect };
  }

  // Devuelve el punto del MUNDO bajo el cursor, y también el del lienzo, que es
  // el que necesita el zoom para saber sobre qué pixel clavarse.
  function puntoMundo(e) {
    const { k, rect } = escala();
    const sx = (e.clientX - rect.left) * k;
    const sy = (e.clientY - rect.top) * k;
    return { ...aPunto(camera, canvas, sx, sy), sx, sy };
  }

  canvas.addEventListener('click', (e) => {
    const { x, y } = puntoMundo(e);

    // De agua y nido solo hay uno: el clic los MUEVE en vez de duplicarlos.
    const unicos = { agua: waterSource, nido: nestOf };
    if (unicos[state.selectedType]) {
      const existente = unicos[state.selectedType](world);
      if (existente) { existente.x = x; existente.y = y; return; }
      addObject(world, x, y, state.selectedType);
      return;
    }

    if (OBJECT_TYPES[state.selectedType]) addObject(world, x, y, state.selectedType);
    else addPoint(world, x, y, state.selectedType);
  });

  // Clic derecho: quitar el objeto del mapa que haya debajo.
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const { x, y } = puntoMundo(e);
    const obj = objectAt(world, x, y);
    if (obj) removeObject(world, obj);
  });

  // Rueda: zoom. Con Mayús, el tamaño del objeto de debajo, que es lo que hacía
  // antes la rueda sola.
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = puntoMundo(e);

    if (e.shiftKey) {
      const obj = objectAt(world, p.x, p.y);
      if (!obj) return;
      const paso = e.deltaY < 0 ? 6 : -6;
      obj.r = Math.max(SIZE_LIMITS.min, Math.min(SIZE_LIMITS.max, radiusOf(obj) + paso));
      return;
    }

    acercar(camera, canvas, world, p.sx, p.sy, e.deltaY < 0 ? CAMERA.paso : 1 / CAMERA.paso);
  }, { passive: false });

  // Arrastrar con el botón central: el izquierdo ya coloca cosas y el derecho las
  // borra, así que el paneo se queda con el que no hace nada más.
  let arrastre = null;
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 1) return;
    e.preventDefault();
    arrastre = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });

  window.addEventListener('mousemove', (e) => {
    if (!arrastre) return;
    const { k } = escala();
    mover(camera, canvas, world, (e.clientX - arrastre.x) * k, (e.clientY - arrastre.y) * k);
    arrastre = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => {
    if (!arrastre) return;
    arrastre = null;
    canvas.style.cursor = 'crosshair';
  });

  // Teclado. Escribiendo en un campo de los ajustes no se toca la cámara.
  const escribiendo = (e) => ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName);

  window.addEventListener('keydown', (e) => {
    if (escribiendo(e)) return;
    const centro = { sx: canvas.width / 2, sy: canvas.height / 2 };

    if (PANEO[e.key]) { pulsadas.add(e.key); e.preventDefault(); return; }

    if (e.key === '+' || e.key === '=') acercar(camera, canvas, world, centro.sx, centro.sy, CAMERA.paso);
    else if (e.key === '-' || e.key === '_') acercar(camera, canvas, world, centro.sx, centro.sy, 1 / CAMERA.paso);
    else if (e.key === '0') { camera.zoom = CAMERA.min; camera.seguir = false; encajar(camera, canvas, world); }
    else if (e.key === 'f' || e.key === 'F') camera.seguir = !camera.seguir;
  });

  window.addEventListener('keyup', (e) => pulsadas.delete(e.key));
  window.addEventListener('blur', () => pulsadas.clear());

  // Paneo con teclas: va por fotograma, no por pulsación, para que se mueva
  // suave mientras la tecla siga abajo.
  state.pan = (dt) => {
    let dx = 0;
    let dy = 0;
    for (const k of pulsadas) {
      const v = PANEO[k];
      if (v) { dx += v[0]; dy += v[1]; }
    }
    if (!dx && !dy) return;
    const paso = CAMERA.teclas * dt;
    mover(camera, canvas, world, -dx * paso, -dy * paso);
  };

  return state;
}

export { SIZE_LIMITS };
