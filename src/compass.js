// Sentido de orientación de Fagi: sabe hacia dónde va.
// Ojo: en canvas la Y crece hacia abajo, así que "arriba" es sin(angle) < 0.

import { normalizeAngle } from './vision.js';

// Cada rumbo lleva su clave de idioma; el texto lo pone quien lo pinta.
const DIRECTIONS = [
  { key: 'dir.right',     arrow: '→' },
  { key: 'dir.downRight', arrow: '↘' },
  { key: 'dir.down',      arrow: '↓' },
  { key: 'dir.downLeft',  arrow: '↙' },
  { key: 'dir.left',      arrow: '←' },
  { key: 'dir.upLeft',    arrow: '↖' },
  { key: 'dir.up',        arrow: '↑' },
  { key: 'dir.upRight',   arrow: '↗' },
];

// Una de las 8 direcciones, según el ángulo actual.
export function heading(angle) {
  const a = normalizeAngle(angle) + Math.PI * 2;
  const i = Math.round(a / (Math.PI / 4)) % 8;
  return DIRECTIONS[i];
}

// Componente vertical pura: sube, baja o va plano.
export function verticalSense(angle) {
  const dy = Math.sin(angle);
  if (dy < -0.15) return { key: 'dir.rising', arrow: '↑', sign: -1 };
  if (dy > 0.15) return { key: 'dir.falling', arrow: '↓', sign: 1 };
  return { key: 'dir.level', arrow: '–', sign: 0 };
}
