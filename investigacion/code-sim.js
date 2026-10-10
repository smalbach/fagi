// A scripted re-enactment of the game's "Learned code" panel
// (src/learned/panel.js): the module Fagi writes as she learns, one rule per
// line, with where each rule came from — her own experience, a sister who
// told her, or her mother. It plays three generations to show what
// inheriting means: the daughter is spared dangerous tries, and a wrong rule
// nobody tries again passes on intact. The rule lines are shortened from the
// real format and the script is fixed: it illustrates the panel, it is not
// data from an experiment.

const LANG = document.documentElement.lang === 'en' ? 'en' : 'es';
const L = (es, en) => (LANG === 'en' ? en : es);

// Tag shown next to each rule: text and theme color.
const TAGS = {
  learned: { text: L('aprendida', 'learned'), color: '--blue' },
  told: { text: L('contada · hermana', 'told · sister'), color: '--accent-2' },
  inherited: { text: L('heredada', 'inherited'), color: '--violet' },
  saved: { text: L('heredada · la salva', 'inherited · saves her'), color: '--leaf' },
  confirmed: { text: L('heredada · confirmada', 'inherited · confirmed'), color: '--leaf' },
  revised: { text: L('heredada · revisada', 'inherited · revised'), color: '--blue' },
  mistake: { text: L('error heredado', 'inherited mistake'), color: '--warn' },
  retired: { text: L('retirada', 'retired'), color: '--ink-3' },
};

// Each step changes the module. `add`: new rules [id, weight, tries, tag].
// `set`: changes to existing rules { id: { w, tries, tag, retired } }.
// `inherit`: the daughter is born — active rules pass on with tries at zero.
const STEPS = [
  { sec: 0.5, gen: 1, age: 0, cap: L('Nace Fagi. Su código está vacío: no trae nada escrito.', 'Fagi is born. Her code is empty: nothing comes written.') },
  { sec: 0.7, age: 40, cap: L('Prueba una baya verde: es dulce y le quita el hambre. Escribe su primera regla.', 'She tries a green berry: sweet, it eases her hunger. She writes her first rule.'),
    add: [['prefer-sweet', 0.31, 1, 'learned']] },
  { sec: 0.7, age: 95, cap: L('Una baya morada la enferma. Regla nueva: evitarla.', 'A purple berry makes her sick. New rule: avoid it.'),
    add: [['avoid-purple', -0.42, 1, 'learned']] },
  { sec: 0.8, age: 160, cap: L('Una hermana le cuenta que lo verde alimenta. La anota con menos confianza.', 'A sister tells her green things feed. She notes it with less trust.'),
    add: [['prefer-green', 0.22, 0, 'told']] },
  { sec: 0.8, age: 260, cap: L('Cada prueba que sale bien refuerza la regla.', 'Every try that goes well strengthens the rule.'),
    set: { 'prefer-sweet': { w: 0.52, tries: 12 }, 'prefer-green': { w: 0.41, tries: 5 } } },
  { sec: 0.9, age: 340, cap: L('Una fruta roja la daña una sola vez. Escribe «evitar lo rojo»… y deja de probarlo.', 'A red fruit harms her once. She writes "avoid red"… and stops trying it.'),
    add: [['avoid-red', -0.35, 1, 'learned']] },
  { sec: 0.9, age: 420, cap: L('Con los días acumula más reglas.', 'Over the days she piles up more rules.'),
    add: [['prefer-orb', 0.19, 1, 'learned'], ['avoid-rain', -0.2, 3, 'learned']] },
  { sec: 1.0, age: 530, cap: L('El orbe amarillo no cumple: retira la regla, que queda comentada.', 'The yellow orb does not deliver: she retires the rule, which stays commented out.'),
    set: { 'prefer-orb': { w: 0.04, tries: 3, retired: true, tag: 'retired' } } },
  { sec: 1.0, age: 690, cap: L('Ya sabe protegerse del calor y dónde hay néctar.', 'Now she knows to shelter from heat and where nectar is.'),
    add: [['avoid-heat', -0.33, 24, 'learned'], ['prefer-nectar', 0.6, 6, 'learned']],
    set: { 'avoid-rain': { w: -0.48, tries: 11 } } },
  { sec: 1.3, age: 812, end: true, cap: L('Muere a los 812 s. Su código activo pasa a su hija; lo retirado, no.', 'She dies at 812 s. Her active code passes to her daughter; what she retired does not.') },

  { sec: 1.2, gen: 2, age: 0, inherit: true, cap: L('La hija nace con 7 reglas que nunca probó.', 'The daughter is born with 7 rules she never tried.') },
  { sec: 1.2, age: 120, cap: L('Pasa junto a una baya morada y no la come: no tuvo que enfermarse para saberlo.', 'She passes a purple berry and does not eat it: she did not have to get sick to know.'),
    set: { 'avoid-purple': { tag: 'saved' } } },
  { sec: 1.2, age: 300, cap: L('Lo dulce se confirma al probarlo. Y revisa otra: la lluvia no es tan mala.', 'Sweet things hold up when she tries them. And she revises another: rain is not so bad.'),
    set: { 'prefer-sweet': { w: 0.61, tries: 6, tag: 'confirmed' }, 'avoid-rain': { w: -0.12, tries: 4, tag: 'revised' } } },
  { sec: 1.5, age: 520, cap: L('Pero en su zona las frutas rojas son buenas. Nunca las prueba, así que la regla nunca se corrige.', 'But in her area red fruit is good. She never tries it, so the rule never gets corrected.'),
    set: { 'avoid-red': { tag: 'mistake' } } },
  { sec: 1.3, age: 640, end: true, cap: L('Muere a los 640 s. Pasa lo que confirmó… y su error.', 'She dies at 640 s. She passes on what she confirmed… and her mistake.') },

  { sec: 2.6, gen: 3, age: 0, inherit: true, cap: L('La nieta también nace evitando lo rojo. Así se heredan los errores.', 'The granddaughter is born avoiding red too. That is how mistakes are inherited.'),
    keepTag: { 'avoid-red': 'mistake' } },
];

const CHARS_PER_MS = 0.12; // typing speed of a new line

function fmtW(w) {
  const s = Math.abs(w).toFixed(2);
  return (w < 0 ? '−' : '+') + s;
}

function ruleText(r) {
  const body = `rule('${r.id}', { weight: ${fmtW(r.w)}, tries: ${r.tries} }),`;
  return r.retired ? `// ${body}` : body;
}

function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }

export function startCodeSim(box, caption, meter) {
  if (!box) return;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let step = -1;
  let stepStart = 0;
  let gen = 1;
  let age = 0;
  let ended = false;
  let rules = [];
  const lines = new Map(); // rule id -> { el, code, tag, typedAt }

  const head = document.createElement('div');
  head.className = 'cs-line cs-comment';
  const open = document.createElement('div');
  open.className = 'cs-line';
  open.innerHTML = '<span class="cs-kw">export default</span> [';
  const list = document.createElement('div');
  list.className = 'cs-list';
  const close = document.createElement('div');
  close.className = 'cs-line';
  close.textContent = '];';
  const foot = document.createElement('div');
  foot.className = 'cs-line cs-comment cs-foot';
  box.replaceChildren(head, open, list, close, foot);

  function headText() {
    const active = rules.filter((r) => !r.retired).length;
    const retired = rules.length - active;
    return `// ${L('Código aprendido por Fagi', 'Code learned by Fagi')} · ${L('generación', 'generation')} ${gen} · ${L('edad', 'age')} ${age} s · ${active} ${L(active === 1 ? 'activa' : 'activas', 'active')}, ${retired} ${L(retired === 1 ? 'retirada' : 'retiradas', 'retired')}`;
  }

  function paintMeter() {
    if (!meter) return;
    const active = rules.filter((r) => !r.retired);
    const inh = active.filter((r) => r.inherited).length;
    const bad = active.filter((r) => r.tag === 'mistake').length;
    meter.textContent = [
      `${L('generación', 'generation')} ${gen}`,
      L(plural(active.length, 'regla activa', 'reglas activas'), plural(active.length, 'active rule', 'active rules')),
      L(plural(inh, 'heredada', 'heredadas'), `${inh} inherited`),
      L(plural(bad, 'error heredado', 'errores heredados'), plural(bad, 'inherited mistake', 'inherited mistakes')),
    ].join(' · ');
  }

  function lineFor(r, now) {
    let row = lines.get(r.id);
    if (!row) {
      const el = document.createElement('div');
      el.className = 'cs-line cs-rule';
      const code = document.createElement('span');
      code.className = 'cs-code';
      const tag = document.createElement('span');
      tag.className = 'cs-tag';
      el.append(code, tag);
      list.append(el);
      row = { el, code, tag, typedAt: reduced ? -Infinity : now, text: '' };
      lines.set(r.id, row);
    }
    return row;
  }

  function flash(row) {
    if (reduced) return;
    row.el.classList.remove('cs-flash');
    void row.el.offsetWidth; // restart the animation
    row.el.classList.add('cs-flash');
  }

  function paintRule(r, now, changed) {
    const row = lineFor(r, now);
    row.text = ruleText(r);
    row.el.classList.toggle('cs-retired', !!r.retired);
    const tag = TAGS[r.tag];
    row.tag.textContent = tag.text;
    row.tag.style.setProperty('--tag', `var(${tag.color})`);
    if (changed) flash(row);
  }

  function applyStep(s, now) {
    ended = false;
    if (s.gen) gen = s.gen;
    if (s.inherit) {
      const keep = rules.filter((r) => !r.retired).map((r) => ({
        ...r, tries: 0, inherited: true,
        tag: s.keepTag?.[r.id] ?? 'inherited',
      }));
      rules = keep;
      list.replaceChildren();
      lines.clear();
      for (const r of rules) paintRule(r, now, false);
    }
    if (s.gen === 1 && !s.inherit) {
      rules = [];
      list.replaceChildren();
      lines.clear();
    }
    age = s.age;
    for (const [id, w, tries, tag] of s.add ?? []) {
      const r = { id, w, tries, tag };
      rules.push(r);
      paintRule(r, now, false);
    }
    for (const [id, ch] of Object.entries(s.set ?? {})) {
      const r = rules.find((x) => x.id === id);
      if (!r) continue;
      Object.assign(r, ch);
      paintRule(r, now, true);
    }
    if (s.end) ended = true;
    head.textContent = headText();
    foot.textContent = ended ? `// ${L('fin de la generación', 'end of generation')} ${gen}` : '';
    box.classList.toggle('cs-ended', ended);
    if (caption) caption.textContent = s.cap;
    paintMeter();
  }

  function typeLines(now) {
    for (const row of lines.values()) {
      const n = Math.floor((now - row.typedAt) * CHARS_PER_MS);
      const shown = n >= row.text.length ? row.text : row.text.slice(0, Math.max(0, n));
      if (row.code.textContent !== shown) row.code.textContent = shown;
      row.tag.classList.toggle('cs-tag-on', n >= row.text.length);
    }
  }

  let raf = 0;
  let running = false;
  let pausedAt = 0;
  function frame(now) {
    if (step < 0 || now - stepStart >= STEPS[step].sec * 1000) {
      step = (step + 1) % STEPS.length;
      stepStart = now;
      box.classList.remove('cs-fade');
      applyStep(STEPS[step], now);
    }
    if (step === STEPS.length - 1 && !reduced && now - stepStart > STEPS[step].sec * 1000 - 500) box.classList.add('cs-fade');
    typeLines(now);
    if (running) raf = requestAnimationFrame(frame);
  }

  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) {
      running = true;
      // Resume the step where it was instead of skipping ahead.
      if (pausedAt) {
        const gap = performance.now() - pausedAt;
        stepStart += gap;
        for (const row of lines.values()) row.typedAt += gap;
      }
      raf = requestAnimationFrame(frame);
    } else if (!entry.isIntersecting && running) {
      running = false;
      pausedAt = performance.now();
      cancelAnimationFrame(raf);
    }
  }).observe(box);
}
