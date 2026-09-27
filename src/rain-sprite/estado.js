// ── Estado de lo que se ve (no del mundo): sube y baja suave ────────────────
//
// Uno solo para toda la lluvia: lo lee cada capa que se pinta.
//
// `nivel` es el cielo (nubes, luz apagada) y se abre despacio al escampar.
// `gotas` es lo que cae (gotas, salpicaduras, ondas): sube con el cielo, pero
// al escampar se corta casi en seco. Si no, se seguía viendo llover unos
// segundos con el mundo ya seco, y Fagi parecía salir del nido bajo la lluvia.

export const cielo = { nivel: 0, gotas: 0, mojado: 0, antes: null };

const SUBE = 4;        // s que tarda en cerrarse el cielo
const BAJA = 6;        // s que tarda en abrirse
const CESA = 0.6;      // s que tardan en dejar de caer las gotas
const MOJA = 14;       // s hasta el suelo empapado
const SECA = 60;       // s hasta el suelo seco

// Una vez por fotograma, antes de pintar nada de lluvia.
export function rainLook(world, ahora) {
  const dt = cielo.antes == null ? 0 : Math.min(0.1, Math.max(0, (ahora - cielo.antes) / 1000));
  cielo.antes = ahora;
  const on = !!world.rain?.on;
  cielo.nivel = on ? Math.min(1, cielo.nivel + dt / SUBE) : Math.max(0, cielo.nivel - dt / BAJA);
  cielo.gotas = on ? cielo.nivel : Math.max(0, cielo.gotas - dt / CESA);
  cielo.mojado = on ? Math.min(1, cielo.mojado + dt / MOJA) : Math.max(0, cielo.mojado - dt / SECA);
  return cielo.nivel;
}

export const rainLevel = () => cielo.nivel;
export const rainFalling = () => cielo.gotas;
