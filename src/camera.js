// La cámara: qué trozo del mundo se ve y con cuánto aumento.
//
// El mundo no cambia de tamaño al hacer zoom: lo que cambia es la ventana por la
// que se mira. Todo el dibujo del juego pasa por una sola transformación
// (aplicar), así que nada más en el código tiene que saber que existe el zoom;
// lo único que sí tiene que enterarse es el ratón, que trabaja en píxeles de
// pantalla y necesita traducirlos a coordenadas de mundo (aPunto).
//
// El encuadre nunca se sale del mapa: acercada, la cámara se mueve dentro de sus
// bordes; alejada del todo, se queda centrada. Así no aparece nunca un vacío
// alrededor del terreno.

import { CAMERA } from './config.js';

export function createCamera(world) {
  return {
    x: world.width / 2,
    y: world.height / 2,
    zoom: 1,
    follow: false,   // encuadre pegado a Fagi
  };
}

function limit(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Deja el centro donde la vista siga cayendo entera dentro del mundo.
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

// Vuelve a píxeles de pantalla: para el HUD, que no debe crecer con el zoom.
export function noCamera(ctx) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// Píxel del lienzo → punto del mundo.
export function ripe(cam, canvas, sx, sy) {
  return {
    x: (sx - canvas.width / 2) / cam.zoom + cam.x,
    y: (sy - canvas.height / 2) / cam.zoom + cam.y,
  };
}

// Zoom con el punto de debajo del cursor clavado: la rueda acerca hacia donde se
// está mirando, no hacia el centro de la pantalla.
export function approach(cam, canvas, world, sx, sy, factor) {
  const before = ripe(cam, canvas, sx, sy);
  cam.zoom = limit(cam.zoom * factor, CAMERA.min, CAMERA.max);
  cam.x = before.x - (sx - canvas.width / 2) / cam.zoom;
  cam.y = before.y - (sy - canvas.height / 2) / cam.zoom;
  fit(cam, canvas, world);
}

// Arrastrar el mapa: el desplazamiento viene en píxeles de pantalla.
export function move(cam, canvas, world, dx, dy) {
  cam.x -= dx / cam.zoom;
  cam.y -= dy / cam.zoom;
  cam.follow = false;   // tomar el mando suelta a Fagi
  fit(cam, canvas, world);
}

export function centerOn(cam, canvas, world, p) {
  cam.x = p.x;
  cam.y = p.y;
  fit(cam, canvas, world);
}

// Cuántos píxeles de sprite hay que pintar por píxel de mundo. Se redondea a
// entero porque cada escalón obliga a repintar los sprites: con medio escalón
// por frame el zoom suave los repintaría sin parar.
export function detailOf(cam) {
  return Math.min(CAMERA.maxDetail, Math.max(1, Math.ceil(cam.zoom - 0.02)));
}
