// Uses the actual sprite painters for previews; no second set of illustrations.
import { APPEARANCES } from './object-appearance.js';
import { setObjectAppearance } from './world.js';
import { OBJECT_TYPES, TREE } from './config.js';
import { getLang, onLangChange, labelOf } from './i18n.js';
import { drawRock } from './rock-sprite.js';
import { drawTree } from './tree-sprite.js';
import { drawLake } from './water-sprite.js';
import { drawNest, drawNestMouth } from './nest-sprite.js';

export function createAppearanceEditor(input, world) {
  const root = document.getElementById('appearance-editor');
  const L = (en, es) => getLang() === 'es' ? es : en;
  let signature = '';
  let previews = [];
  let paintedAt = 0;
  function target() {
    const object = world.objects.includes(input.editing) ? input.editing : null;
    const type = object?.type ?? (input.selectedType?.startsWith('tree:') ? 'tree' : input.selectedType);
    return { object, type };
  }
  function update(force = false) {
    const { object, type } = target();
    root.hidden = !input.editable || !APPEARANCES[type];
    if (root.hidden) { signature = ''; return; }
    const value = object ? object.appearance ?? 'auto' : input.appearances[type] ?? 'auto';
    const fruit = object?.fruit ?? (input.selectedType?.startsWith('tree:') ? input.selectedType.slice(5) : TREE.fruit);
    const key = `${object?.id ?? 'new'}|${type}|${value}|${getLang()}|${fruit}`;
    if (force || signature !== key) {
      signature = key;
      root.replaceChildren(); previews = [];
      const heading = document.createElement('p'); heading.className = 'appearance-heading';
      heading.textContent = object
        ? L(`Selected ${labelOf(type)} · #${object.id}`, `${labelOf(type)} seleccionado · #${object.id}`)
        : L(`Appearance · next ${labelOf(type)}`, `Aspecto · próximo ${labelOf(type)}`);
      root.append(heading);
      const grid = document.createElement('div'); grid.className = 'appearance-grid';
      grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', L('Object appearance', 'Aspecto del objeto'));
      for (const [id, en, es] of [['auto', 'Natural variety', 'Variedad natural'], ...APPEARANCES[type]]) {
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'appearance-option'; button.setAttribute('aria-pressed', String(value === id));
        const canvas = document.createElement('canvas'); canvas.width = 144; canvas.height = 112;
        canvas.setAttribute('aria-hidden', 'true');
        const name = document.createElement('span'); name.textContent = L(en, es);
        button.append(canvas, name);
        button.addEventListener('click', () => {
          input.appearances[type] = id;
          if (object) setObjectAppearance(world, object, id);
          update(true);
          root.querySelectorAll('.appearance-option')[[...grid.children].indexOf(button)]?.focus({ preventScroll: true });
        });
        grid.append(button);
        const sample = { type, seed: 73931, x: 72, y: 57, r: 28, appearance: id, fruit, born: 0, timer: TREE.interval };
        previews.push({ canvas, sample });
      }
      root.append(grid);
      const hint = document.createElement('p'); hint.className = 'help';
      hint.textContent = L('Visual only: keeps size, food and behavior. Your choice also applies to the next object you place.',
        'Solo cambia el aspecto: conserva tamaño, alimento y comportamiento. La elección también se usa al colocar el siguiente objeto.');
      root.append(hint);
      if (object) {
        const done = document.createElement('button'); done.type = 'button';
        done.textContent = L('Done editing appearance', 'Terminar de editar aspecto');
        done.addEventListener('click', () => { input.editing = null; update(true); }); root.append(done);
      }
      paint();
    } else if (performance.now() - paintedAt > 1500) paint(); // async photographic assets may now be ready
  }
  function paint() {
    paintedAt = performance.now();
    for (const { canvas, sample } of previews) {
      const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
      const spec = OBJECT_TYPES[sample.type];
      if (sample.type === 'rock') drawRock(ctx, sample, spec, sample.r);
      else if (sample.type === 'tree') drawTree(ctx, sample, spec, sample.r, { angle: 0, strength: 0 }, 0);
      else if (sample.type === 'water') drawLake(ctx, sample, spec, sample.r, { angle: 0, strength: 0 }, 0);
      else { drawNest(ctx, sample, spec, sample.r); drawNestMouth(ctx, sample, sample.r, false, 0); }
    }
  }
  onLangChange(() => update(true));
  return { update };
}
