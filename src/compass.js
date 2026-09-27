// Fagi's sense of direction: she knows which way she's heading.
// Careful: on canvas Y grows downward, so "up" is sin(angle) < 0.

import { normalizeAngle } from './vision.js';

// Each heading carries its language key; whoever draws it supplies the text.
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

// One of the 8 directions, based on the current angle.
export function heading(angle) {
  const a = normalizeAngle(angle) + Math.PI * 2;
  const i = Math.round(a / (Math.PI / 4)) % 8;
  return DIRECTIONS[i];
}

// Pure vertical component: rising, falling or level.
export function verticalSense(angle) {
  const dy = Math.sin(angle);
  if (dy < -0.15) return { key: 'dir.rising', arrow: '↑', sign: -1 };
  if (dy > 0.15) return { key: 'dir.falling', arrow: '↓', sign: 1 };
  return { key: 'dir.level', arrow: '–', sign: 0 };
}
