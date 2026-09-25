// La fruta envejece. Pasado su tiempo se pudre: cambia de tipo a tóxico y desde
// ese momento TODO lo suyo (efecto, recompensa, aroma, color) sale de la ficha
// del tóxico. Fagi no lo sabe: solo aprende cuando lo prueba.
//
// Lo podrido también tiene su reloj: cuando se le acaba la vida al tóxico se
// deshace y se va del mapa, con su estela y todo.

import { POINT_TYPES, FRUIT } from './config.js';
import { removePoint } from './world.js';

export function updateFood(world, dt) {
  // De atrás hacia delante: alguno se borra por el camino.
  for (let i = world.points.length - 1; i >= 0; i--) {
    const p = world.points[i];
    p.age = (p.age ?? 0) + dt;

    const vida = POINT_TYPES[p.type].life ?? 0;
    if (vida <= 0 || p.age < vida) continue;

    // Lo podrido no se pudre otra vez: desaparece.
    if (p.type === FRUIT.rot) {
      removePoint(world, p);
      continue;
    }

    p.type = FRUIT.rot;
    p.age = 0;
    p.podrido = true;
    // El rastro no se borra: sigue por donde iba, pero a partir de ahora
    // huele y se ve como lo que es. De eso se encarga smell.js.
  }
}

// 0 = recién caída, 1 = a punto de pudrirse (o de desaparecer, si ya está
// podrida). Sirve para el dibujo.
export function ripeness(p) {
  const vida = POINT_TYPES[p.type].life ?? 0;
  if (vida <= 0) return 0;
  return Math.min(1, (p.age ?? 0) / vida);
}
