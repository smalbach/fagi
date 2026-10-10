// Whether a panel is on screen, without asking the page every frame.
//
// The side panels (brain map, body map, mental map, the reasoning, the
// learned code) used to be painted every frame whatever their state: in a
// tab not shown, collapsed, or scrolled out of sight on a phone. Measuring
// each one to find out (getBoundingClientRect) forced the browser to lay the
// page out again in the middle of the frame. An IntersectionObserver is told
// by the browser itself when the element appears or disappears —a hidden tab,
// a collapsed pane and the console closed are all display:none—, so asking
// costs nothing. A panel that comes back into view is painted on its next turn.

export function watchShown(el) {
  if (!el || typeof IntersectionObserver === 'undefined') return () => true;
  let shown = false;
  new IntersectionObserver((entries) => {
    for (const e of entries) shown = e.isIntersecting;
  }).observe(el);
  return () => shown;
}

// At most one call every `ms`: what a canvas panel needs to look alive. The
// simulation runs at 60 frames a second; nobody reads a diagram that fast.
export function every(ms) {
  let last = -Infinity;
  return () => {
    const now = performance.now();
    if (now - last < ms) return false;
    last = now;
    return true;
  };
}
