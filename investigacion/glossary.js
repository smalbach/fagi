// Glossary tooltips. The glossary section at the end of the page is the single
// source: each entry carries a data-match pattern, and the first time a term
// appears in each section of the prose it gets a dotted underline that shows
// the definition on hover, focus or tap. Optional data-skip (section ids),
// data-in (a selector the term must sit inside) and data-not (exact words to
// leave alone) narrow where an entry applies.
const glossary = document.getElementById('glosario');

// Places where a tooltip would get in the way or break something.
const SKIP = 'a, code, pre, h1, h2, h3, h4, h5, h6, button, label, select, option, textarea, svg, summary, script, style, form, .legend, .num, .where, .source-note, .explorer-grid, .gloss, #glosario, #referencias';

if (glossary) {
  const entries = [...glossary.querySelectorAll('[data-match]')].map((el) => ({
    id: el.id,
    term: el.querySelector('dt').innerHTML,
    def: el.querySelector('dd').innerHTML,
    match: el.dataset.match,
    skip: el.dataset.skip ? el.dataset.skip.split(' ') : [],
    within: el.dataset.in,
    not: el.dataset.not ? el.dataset.not.split(' ') : [],
  }));
  // Longer patterns first, so "salto falso" wins over "salto" at the same spot.
  entries.sort((a, b) => b.match.length - a.match.length);
  const byGroup = entries;
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${entries.map((e) => `(${e.match})`).join('|')})(?![\\p{L}\\p{N}])`, 'giu');

  const main = document.querySelector('main');
  const seen = new Map();
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeValue.trim() && !n.parentElement.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const section = node.parentElement.closest('section');
    if (!section) continue;
    if (!seen.has(section)) seen.set(section, new Set());
    const used = seen.get(section);
    const text = node.nodeValue;
    const frag = document.createDocumentFragment();
    let last = 0;
    re.lastIndex = 0;
    for (let m; (m = re.exec(text));) {
      const k = m.slice(1).findIndex((g) => g !== undefined);
      const e = byGroup[k];
      if (!e || used.has(e.id) || e.not.includes(m[0]) || e.skip.includes(section.id) || (e.within && !node.parentElement.closest(e.within))) continue;
      used.add(e.id);
      frag.append(text.slice(last, m.index));
      const span = document.createElement('span');
      span.className = 'gloss';
      span.tabIndex = 0;
      span.dataset.g = e.id;
      span.textContent = m[0];
      frag.append(span);
      last = m.index + m[0].length;
    }
    if (last) {
      frag.append(text.slice(last));
      node.replaceWith(frag);
    }
  }

  const info = Object.fromEntries(entries.map((e) => [e.id, e]));
  const tip = document.createElement('div');
  tip.id = 'gloss-tip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.append(tip);
  let current = null;

  const place = (el) => {
    const r = el.getBoundingClientRect();
    const gutter = 16;
    const w = Math.min(320, window.innerWidth - gutter * 2);
    tip.style.width = `${w}px`;
    const left = Math.max(gutter, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - gutter));
    tip.style.left = `${left}px`;
    const below = r.bottom + 8;
    const h = tip.offsetHeight;
    tip.style.top = `${below + h > window.innerHeight - gutter && r.top - h - 8 > gutter ? r.top - h - 8 : below}px`;
  };
  const show = (el) => {
    const e = info[el.dataset.g];
    if (!e) return;
    if (current && current !== el) current.removeAttribute('aria-describedby');
    current = el;
    tip.innerHTML = `<b>${e.term}</b>${e.def}`;
    tip.hidden = false;
    el.setAttribute('aria-describedby', 'gloss-tip');
    place(el);
  };
  const hide = () => {
    if (current) current.removeAttribute('aria-describedby');
    current = null;
    tip.hidden = true;
  };

  main.addEventListener('mouseover', (ev) => { const el = ev.target.closest('.gloss'); if (el) show(el); });
  main.addEventListener('mouseout', (ev) => { const el = ev.target.closest('.gloss'); if (el && !el.contains(ev.relatedTarget)) hide(); });
  main.addEventListener('focusin', (ev) => { const el = ev.target.closest('.gloss'); if (el) show(el); });
  main.addEventListener('focusout', (ev) => { if (ev.target.closest('.gloss')) hide(); });
  // Touch screens have no hover: a tap toggles the definition, a tap elsewhere closes it.
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('.gloss');
    if (el) { if (current === el && !tip.hidden && ev.pointerType === 'touch') hide(); else show(el); } else hide();
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') hide(); });
  window.addEventListener('scroll', () => { if (current) place(current); }, { passive: true });
  window.addEventListener('resize', hide);
}
