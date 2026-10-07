// Shared form controls (styles/controls.css draws them).
//
//   - makeSlider: a slider for dragging plus a box to type the exact number.
//   - sliderize: turns an <input type=number|range> already in the page into
//     one of those, in place: the original stays (hidden) as the holder of the
//     value, so code that reads or writes its .value, or listens for its
//     input/change, keeps working untouched.
//   - makeChoice: a segmented control for a setting with a few named values.
//
// Checkboxes need nothing: controls.css draws every one as a switch.

const valueProp = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

const decimalsOf = (step) => (String(step).split('.')[1] ?? '').length;

// `onInput(v)` while it moves or is typed; `onCommit(v)` when let go / left.
// The box shows the exact value; the slider, as close as its step allows.
export function makeSlider({ min, max, step = 1, value = min, suffix = '', onInput, onCommit }) {
  const el = document.createElement('span');
  el.className = 'ns';
  const range = document.createElement('input');
  range.type = 'range';
  range.className = 'ns-range';
  const box = document.createElement('input');
  box.type = 'number';
  box.className = 'ns-box';
  box.inputMode = 'decimal';
  for (const input of [range, box]) { input.min = min; input.max = max; input.step = step; }
  box.title = `${min} – ${max}`;
  el.append(range, box);
  if (suffix) {
    const unit = document.createElement('span');
    unit.className = 'ns-unit';
    unit.textContent = suffix;
    el.append(unit);
  }

  const places = decimalsOf(step);
  const clamp = (v) => Math.min(max, Math.max(min, v));
  let current = value;
  const fill = () => {
    const at = max > min ? (Number(range.value) - min) / (max - min) : 0;
    range.style.setProperty('--fill', `${at * 100}%`);
  };
  const set = (v) => {
    current = v;
    range.value = v;
    // Not while typing in it: rewriting "0." as "0" would eat the point.
    if (document.activeElement !== box) box.value = v;
    fill();
  };

  range.addEventListener('input', () => {
    // The slider's own value, without the float noise of its step.
    current = Number(Number(range.value).toFixed(places));
    box.value = current;
    fill();
    onInput?.(current);
  });
  range.addEventListener('change', () => onCommit?.(current));
  box.addEventListener('input', () => {
    // Empty (being cleared to type another number): it's not 0.
    if (box.value.trim() === '') return;
    const v = Number(box.value);
    if (!Number.isFinite(v)) return;
    current = clamp(v);
    range.value = current;
    fill();
    onInput?.(current);
  });
  // On leaving it shows what really stuck (clamped, or the last one if empty).
  box.addEventListener('change', () => { box.value = current; onCommit?.(current); });
  // Enter confirms the number, it doesn't submit the form around it.
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); box.blur(); }
  });

  set(value);
  return { el, range, box, set, get: () => current };
}

// The page's input becomes a slider with a box; see the top of the file.
export function sliderize(input, { suffix = '' } = {}) {
  if (input.dataset.sliderized) return null;
  input.dataset.sliderized = '1';
  const read = () => Number(valueProp.get.call(input));
  input.type = 'number';
  const tell = (type, v) => {
    valueProp.set.call(input, String(v));
    input.dispatchEvent(new Event(type, { bubbles: true }));
  };
  const s = makeSlider({
    min: Number(input.min), max: Number(input.max), step: Number(input.step) || 1, value: read(), suffix,
    onInput: (v) => tell('input', v),
    onCommit: (v) => tell('change', v),
  });
  input.hidden = true;
  input.after(s.el);
  // A value written from code shows up in the slider and the box.
  Object.defineProperty(input, 'value', {
    configurable: true,
    get() { return valueProp.get.call(this); },
    set(v) { valueProp.set.call(this, v); s.set(read()); },
  });
  return s;
}

// options: [{ value, label, title? }]. `onInput(value)` on a click.
export function makeChoice({ options, value, onInput }) {
  const el = document.createElement('span');
  el.className = 'seg';
  el.role = 'radiogroup';
  const buttons = options.map((o) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.role = 'radio';
    btn.textContent = o.label;
    if (o.title) btn.title = o.title;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      set(o.value);
      onInput?.(o.value);
    });
    el.append(btn);
    return { btn, value: o.value };
  });
  function set(v) {
    for (const b of buttons) {
      b.btn.classList.toggle('on', b.value === v);
      b.btn.ariaChecked = String(b.value === v);
      b.btn.tabIndex = b.value === v ? 0 : -1;
    }
  }
  el.addEventListener('keydown', (event) => {
    const index = buttons.findIndex(({ btn }) => btn === event.target);
    if (index < 0) return;
    let next;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[next].btn.focus();
    buttons[next].btn.click();
  });
  set(value);
  return { el, set };
}
