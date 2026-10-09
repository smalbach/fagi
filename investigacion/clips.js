// The clips filmed from a game session (section 06, scripts/site-clips.js):
// each plays while it is on screen and stops when it leaves, so only what is
// being looked at downloads and decodes. With reduced motion nothing plays by
// itself; a click plays or pauses, ⤢ opens it large.

import { T } from './strings.js';

const videos = [...document.querySelectorAll('video[data-clip]')];
const still = matchMedia('(prefers-reduced-motion: reduce)');
const frameOf = (v) => v.closest('.clip-frame');
const paused = new WeakSet();   // stopped by the reader: scrolling never restarts them

function play(v) {
  v.play().then(() => frameOf(v).classList.remove('paused')).catch(() => frameOf(v).classList.add('paused'));
}
function stop(v) {
  v.pause();
  frameOf(v).classList.add('paused');
}

// On screen: a third of it, or a third of the window for one taller than that.
const onScreen = (e) => e.isIntersecting
  && e.intersectionRect.height >= Math.min(e.boundingClientRect.height, innerHeight) / 3;
const seen = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const v = e.target;
    if (onScreen(e)) { if (v.paused && !still.matches && !paused.has(v)) play(v); }
    else if (!v.paused) v.pause();
  }
}, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1] });

for (const v of videos) {
  frameOf(v).classList.add('paused');
  seen.observe(v);
  v.addEventListener('click', () => {
    if (v.paused) { paused.delete(v); play(v); } else { paused.add(v); stop(v); }
  });
  frameOf(v).querySelector('.clip-zoom')?.addEventListener('click', () => open(v));
}

// Large: the same clip in a dialog, with the browser's controls.
let dialog = null;
function open(v) {
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.className = 'clip-dialog';
    dialog.innerHTML = `<video controls loop muted playsinline></video><button type="button" aria-label="${T.clipClose}">✕</button>`;
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => dialog.querySelector('video').pause());
    document.body.append(dialog);
  }
  const big = dialog.querySelector('video');
  big.src = v.currentSrc || v.querySelector('source').src;
  big.poster = v.poster;
  big.setAttribute('aria-label', v.getAttribute('aria-label') ?? '');
  big.currentTime = v.currentTime || 0;
  if (!v.paused) v.pause();
  dialog.showModal();
  big.play().catch(() => {});
}
