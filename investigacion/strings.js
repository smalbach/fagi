// What the page's scripts write, in each language the page comes in. The
// prose is in the HTML of each language; this is only what JS draws.
const ES = {
  formats: { none: 'nada', verdict: 'veredictos', rule: 'razones', evidence: 'razones + evidencia' },
  formatsShort: { none: 'nada', verdict: 'veredictos', rule: 'razones', evidence: '+ evidencia' },
  less: 'menos es mejor', more: 'más es mejor',
  harmTitle: 'Bocados dañinos por hormiga, mundo estable',
  survTitle: 'Supervivientes en la generación de la inversión',
  mythTitle: 'Mitos por hormiga al llegar la inversión',
  labSource: 'Laboratorio · 200 linajes por celda',
  gameSource: 'Juego completo · 75 linajes por formato',
  generation: 'generación', change: 'cambio',
  curves: { alive: 'Supervivientes por hormiga', myths: 'Mitos por hormiga (falsos y nunca vividos)', harmful: 'Bocados dañinos por hormiga', acc: 'Precisión de lo que se enseña al nacer' },
  running: 'Corriendo…', run: 'Correr los 4 formatos', ran: (ms) => `4 linajes en ${ms} ms, en tu navegador`,
  carriers: 'hormigas la llevan', isFalse: 'falsa en ese mundo', empty: 'Ninguna creencia pasó de hormiga a hormiga.',
  beliefs: (n, f) => `${n} creencias transmitidas con «${f}»; se muestran las más longevas`,
  summary: (f, a, m) => `${f}: ${a} de supervivientes en la generación 6 · ${m} mitos por hormiga`,
};

const EN = {
  formats: { none: 'nothing', verdict: 'verdicts', rule: 'reasons', evidence: 'reasons + evidence' },
  formatsShort: { none: 'nothing', verdict: 'verdicts', rule: 'reasons', evidence: '+ evidence' },
  less: 'lower is better', more: 'higher is better',
  harmTitle: 'Harmful bites per ant, steady world',
  survTitle: 'Survivors in the generation of the inversion',
  mythTitle: 'Myths per ant going into the inversion',
  labSource: 'Lab · 200 lineages per cell',
  gameSource: 'Full game · 75 lineages per format',
  generation: 'generation', change: 'change',
  curves: { alive: 'Survivors per ant', myths: 'Myths per ant (false and never lived)', harmful: 'Harmful bites per ant', acc: 'Accuracy of what newborns are taught' },
  running: 'Running…', run: 'Run all 4 formats', ran: (ms) => `4 lineages in ${ms} ms, in your browser`,
  carriers: 'ants carry it', isFalse: 'false in that world', empty: 'No belief went from ant to ant.',
  beliefs: (n, f) => `${n} beliefs passed on with “${f}”; the longest-lived are shown`,
  summary: (f, a, m) => `${f}: ${a} survivors in generation 6 · ${m} myths per ant`,
};

export const LANG = document.documentElement.lang === 'en' ? 'en' : 'es';
export const T = LANG === 'en' ? EN : ES;
export const pct = (v) => `${Math.round(v * 100)}%`;
export const num = (v, d = 2) => (LANG === 'en' ? v.toFixed(d) : v.toFixed(d).replace('.', ','));
