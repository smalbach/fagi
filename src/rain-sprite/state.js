// ── Estado de lo que se ve (no del mundo): sube y baja suave ────────────────
//
// Uno solo para toda la lluvia: lo lee cada capa que se pinta.
//
// `nivel` es el cielo (nubes, luz apagada) y se abre despacio al escampar.
// `gotas` es lo que cae (gotas, salpicaduras, ondas): sube con el cielo, pero
// al escampar se corta casi en seco. Si no, se seguía viendo llover unos
// segundos con el mundo ya seco, y Fagi parecía salir del nido bajo la lluvia.

export const sky = { level: 0, drops: 0, wetness: 0, before: null };

const RISE = 4;        // s que tarda en cerrarse el cielo
const LOW = 6;        // s que tarda en abrirse
const STOP_SECS = 0.6;      // s que tardan en dejar de caer las gotas
const WETS = 14;       // s hasta el suelo empapado
const DRY = 60;       // s hasta el suelo seco

// Una vez por fotograma, antes de pintar nada de lluvia.
export function rainLook(world, now) {
  const dt = sky.before == null ? 0 : Math.min(0.1, Math.max(0, (now - sky.before) / 1000));
  sky.before = now;
  const on = !!world.rain?.on;
  sky.level = on ? Math.min(1, sky.level + dt / RISE) : Math.max(0, sky.level - dt / LOW);
  sky.drops = on ? sky.level : Math.max(0, sky.drops - dt / STOP_SECS);
  sky.wetness = on ? Math.min(1, sky.wetness + dt / WETS) : Math.max(0, sky.wetness - dt / DRY);
  return sky.level;
}

export const rainLevel = () => sky.level;
export const rainFalling = () => sky.drops;
