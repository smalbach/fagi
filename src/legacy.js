// Old saves spoke Spanish. Learned-code files, the browser's recoverable copy
// and recorded sessions made before the codebase moved to English carry keys
// like 'toxico', 'nido' or 'evitar-toxico'. This maps them to today's names so
// they still load; anything already in English passes through untouched.

const LEGACY = {
  agua: 'water', arbol: 'tree', charco: 'puddle', chispa: 'spark', nido: 'nest',
  ojo: 'eye', resina: 'resin', roca: 'rock', toxico: 'toxic', hondo: 'deep',
  lluvia: 'rain', presion: 'pressure', feromona: 'pheromone', vista: 'sight',
  olfato: 'smell', memoria: 'memory', antenas: 'antennae', corta: 'short',
  media: 'medium', larga: 'long', confirma: 'confirms', contradice: 'contradicts',
  primera: 'first', repite: 'repeats', nueva: 'new', retirada: 'retired',
  revisada: 'revised', evitar: 'avoid', preferir: 'prefer', contradiccion: 'contradiction',
};

// Only identifier-like strings are keys; prose is left alone.
const KEYLIKE = /^[A-Za-z0-9_.:>-]+$/;

export function modernKey(s) {
  if (typeof s !== 'string' || !KEYLIKE.test(s)) return s;
  return s.split(/([.:>-])/).map((seg) => LEGACY[seg] ?? seg).join('');
}

// Deep copy with every key-like string and object key modernized.
export function modernize(value) {
  if (typeof value === 'string') return modernKey(value);
  if (Array.isArray(value)) return value.map(modernize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[modernKey(k)] = modernize(v);
    return out;
  }
  return value;
}
