// Los pinceles del mapa del cerebro: el lienzo, su tamaño, la escala de letra
// y los trazos básicos (texto, cajas, etiquetas, barras, cabeceras) con los
// que se dibuja cada sección. Todas las secciones pintan con el mismo juego,
// así que comparten un solo estado: el contexto 2D, `s`, `dpr` y el tamaño.

import { TEXTO, DIM } from './paleta.js';

export function crearPinceles(canvas) {
  const g = canvas.getContext('2d');
  const p = {
    g,
    cssW: 0,
    cssH: 0,
    dpr: 1,
    s: 1,   // escala de letra: el panel ampliado se lee de lejos
  };

  // El ancho lo pone el panel; el alto, lo que haya que dibujar.
  function ajustar(alto) {
    const ancho = canvas.getBoundingClientRect().width;
    if (ancho === p.cssW && alto === p.cssH) return false;
    p.cssW = ancho;
    p.cssH = alto;
    canvas.style.height = `${alto}px`;
    p.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(p.cssW * p.dpr));
    canvas.height = Math.max(1, Math.round(p.cssH * p.dpr));
    return true;
  }

  // Empieza un fotograma: la escala sale del ancho, y el lienzo, limpio.
  function empezar() {
    const W = p.cssW;
    p.s = Math.max(0.95, Math.min(1.6, W / 380));
    g.setTransform(p.dpr, 0, 0, p.dpr, 0, 0);
    g.clearRect(0, 0, W, p.cssH);
    g.lineCap = 'round';
  }

  // Las medidas comunes a todas las secciones, a la escala de ahora.
  function medidas() {
    const { s } = p;
    return { W: p.cssW, pad: 10 * s, gap: 6 * s, lineH: 19 * s };
  }

  const font = (px, bold = false) => `${bold ? '600 ' : ''}${(px * p.s).toFixed(1)}px ui-monospace, SFMono-Regular, Menlo, monospace`;

  function texto(str, x, y, { size = 10.5, color = TEXTO, align = 'left', bold = false, maxW = 0 } = {}) {
    g.font = font(size, bold);
    g.fillStyle = color;
    g.textAlign = align;
    g.textBaseline = 'middle';
    let txt = String(str ?? '');
    if (maxW > 0 && g.measureText(txt).width > maxW) {
      while (txt.length > 1 && g.measureText(`${txt}…`).width > maxW) txt = txt.slice(0, -1);
      txt += '…';
    }
    g.fillText(txt, x, y);
    return g.measureText(txt).width;
  }

  function ancho(str, size = 10.5, bold = false) {
    g.font = font(size, bold);
    return g.measureText(String(str)).width;
  }

  function caja(x, y, w, h, r, fill, stroke, lw = 1) {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
  }

  // Una etiqueta con fondo. Devuelve su ancho.
  function chip(str, x, y, color, { filled = false, size = 9.5, bold = false, dim = false } = {}) {
    const { s } = p;
    const w = ancho(str, size, bold) + 10 * s;
    const h = 15 * s;
    g.globalAlpha = dim ? 0.45 : 1;
    caja(x, y - h / 2, w, h, 4 * s, filled ? color : '#20242e', filled ? null : color, 1);
    texto(str, x + 5 * s, y, { size, color: filled ? '#10131a' : color, bold });
    g.globalAlpha = 1;
    return w;
  }

  // Varias etiquetas unidas por flechas, saltando de línea si no caben.
  function cadena(items, x0, y0, maxX, lineH) {
    const { s } = p;
    let x = x0;
    let y = y0;
    items.forEach((it, i) => {
      const w = ancho(it.text, 9.5, it.bold) + 10 * s;
      const flecha = i > 0 ? ancho(' → ', 9.5) : 0;
      if (i > 0 && x + flecha + w > maxX) { x = x0; y += lineH; }
      else if (i > 0) { texto('→', x + flecha / 2, y, { color: DIM, align: 'center' }); x += flecha; }
      x += chip(it.text, x, y, it.color, { filled: it.filled, bold: it.bold });
    });
    return y;
  }

  function cabecera(n, titulo, y, W, pad) {
    texto(`${n} · ${titulo.toUpperCase()}`, pad, y, { size: 9, color: DIM, bold: true });
    const w = ancho(`${n} · ${titulo.toUpperCase()}`, 9, true);
    g.beginPath();
    g.moveTo(pad + w + 6 * p.s, y);
    g.lineTo(W - pad, y);
    g.strokeStyle = '#262a35';
    g.lineWidth = 1;
    g.stroke();
  }

  function barra(x, y, w, h, frac, color) {
    caja(x, y, w, h, h / 2, '#2a2e3a');
    if (frac > 0) caja(x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2, color);
  }

  return Object.assign(p, { ajustar, empezar, medidas, texto, ancho, caja, chip, cadena, cabecera, barra });
}
