// Small SVG charts drawn from data, colored only through the page's CSS
// tokens so they follow light and dark.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Lines over generations. series: [{ key, label, values: [..] }]; a value per
// generation. mark: the generation where the world changes.
// xTicks: a label per point instead of its index (shown every `xEvery`);
// yMin: where the axis starts, for values that never come near 0.
export function lineChart(series, { yMax, yMin = 0, yFmt = (v) => v, mark, markLabel = '', xLabel = '', xTicks, xEvery = 1, height = 230, width = 560 } = {}) {
  const W = width, H = height, L = 40, R = 14, T = 14, B = 34;
  const n = Math.max(...series.map((s) => s.values.length));
  const max = yMax ?? Math.max(1e-9, ...series.flatMap((s) => s.values)) * 1.08;
  const x = (g) => L + (g / Math.max(1, n - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - yMin) / (max - yMin)) * (H - T - B);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    const v = yMin + (max - yMin) * f;
    s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`;
    s += `<text class="lbl" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${esc(yFmt(v))}</text>`;
  }
  if (mark != null) {
    s += `<rect x="${x(mark) - 9}" y="${T}" width="18" height="${H - T - B}" fill="var(--accent-soft)" opacity=".8"/>`;
    s += `<text class="lbl" x="${x(mark) + 12}" y="${H - B - 6}" style="fill:var(--accent)">${esc(markLabel)}</text>`;
  }
  for (let g = 0; g < n; g++) {
    if (g % xEvery) continue;
    s += `<text class="lbl" x="${x(g)}" y="${H - B + 16}" text-anchor="middle">${esc(xTicks ? xTicks[g] : g)}</text>`;
  }
  if (xLabel) s += `<text class="lbl" x="${(L + W - R) / 2}" y="${H - 3}" text-anchor="middle">${esc(xLabel)}</text>`;
  s += `<line class="axis" x1="${L}" x2="${W - R}" y1="${y(yMin)}" y2="${y(yMin)}"/>`;
  for (const ser of series) {
    const pts = ser.values.map((v, g) => `${x(g).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    s += `<polyline class="line" points="${pts}" fill="none" stroke="var(--s-${ser.key})" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
    ser.values.forEach((v, g) => {
      s += `<circle cx="${x(g)}" cy="${y(v)}" r="${n > 12 ? 2.2 : 3.2}" fill="var(--surface)" stroke="var(--s-${ser.key})" stroke-width="2"><title>${esc(ser.label)} · ${esc(xTicks ? xTicks[g] : `g${g}`)}: ${esc(yFmt(v))}</title></circle>`;
    });
  }
  return `${s}</svg>`;
}

// Every belief that went from ant to ant, as a line across the generations it
// lived in: green while it was true of that world, red once it was false;
// thicker when more ants carried it.
export function lifelines(genealogy, { generations = 12, mark, limit = 28, labels = {}, width = 560 } = {}) {
  const rows = genealogy
    .filter((b) => b.trail?.length)
    .sort((a, b) => (b.trail.length - a.trail.length) || (b.maxCarriers - a.maxCarriers))
    .slice(0, limit)
    .sort((a, b) => a.bornG - b.bornG || b.trail.length - a.trail.length);
  const W = width, L = width > 700 ? 270 : 190, R = 10, T = 18, rowH = width > 700 ? 18 : 15;
  const H = T + rows.length * rowH + 26;
  const cw = (W - L - R) / generations;
  const x = (g) => L + g * cw;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for (let g = 0; g < generations; g++) {
    s += `<text class="lbl" x="${x(g) + cw / 2}" y="${H - 8}" text-anchor="middle">${g}</text>`;
    if (g % 2 === 0) s += `<rect x="${x(g)}" y="${T - 6}" width="${cw}" height="${rows.length * rowH + 6}" fill="var(--surface-2)"/>`;
  }
  if (mark != null) {
    s += `<line x1="${x(mark)}" x2="${x(mark)}" y1="${T - 12}" y2="${T + rows.length * rowH}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    s += `<text class="lbl" x="${x(mark) + 4}" y="${T - 4}" style="fill:var(--accent)">${esc(labels.change ?? '')}</text>`;
  }
  rows.forEach((b, i) => {
    const yy = T + i * rowH + rowH / 2;
    const name = b.origin.replace(/^[^/]*\//, '').replace(/@\d+$/, '');
    const max = width > 700 ? 40 : 30;
    const short = name.length > max ? `${name.slice(0, max - 1)}…` : name;
    s += `<text class="lbl mono" x="${L - 8}" y="${yy + 3.5}" text-anchor="end">${esc(short)}<title>${esc(name)}</title></text>`;
    for (const t of b.trail) {
      const th = Math.min(11, 3 + t.carriers * 1.6);
      const col = t.false ? 'var(--warn)' : 'var(--leaf)';
      s += `<rect x="${x(t.g) + 1.5}" y="${yy - th / 2}" width="${cw - 3}" height="${th}" rx="${th / 2}" fill="${col}" opacity=".9"><title>${esc(name)} · g${t.g}: ${t.carriers} ${esc(labels.carriers ?? '')}${t.false ? ` · ${esc(labels.false ?? '')}` : ''}</title></rect>`;
    }
  });
  if (!rows.length) s += `<text class="lbl" x="${W / 2}" y="${T + 10}" text-anchor="middle">${esc(labels.empty ?? '')}</text>`;
  return `${s}</svg>`;
}

// Bars side by side: one group per row, one bar per series in it.
// groups: [{ label, values: [..] }]; series: [{ key, label }] (colors by --s-key).
export function groupedBars(groups, series, { yMax, yFmt = (v) => v, height = 220, width = 560 } = {}) {
  const W = width, H = height, L = 8, R = 8, T = 18, B = 40;
  const max = yMax ?? Math.max(1e-9, ...groups.flatMap((g) => g.values)) * 1.12;
  const gw = (W - L - R) / groups.length, bw = Math.min(46, (gw - 18) / series.length);
  const y = (v) => T + (1 - v / max) * (H - T - B);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for (const f of [0.25, 0.5, 0.75, 1]) s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(max * f)}" y2="${y(max * f)}"/>`;
  s += `<line class="axis" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>`;
  groups.forEach((g, i) => {
    const x0 = L + i * gw + (gw - bw * series.length) / 2;
    g.values.forEach((v, j) => {
      if (v == null) return;
      const xx = x0 + j * bw, top = y(Math.max(0, v));
      s += `<rect x="${xx + 2}" y="${top}" width="${bw - 4}" height="${Math.max(1.5, y(0) - top)}" rx="3" fill="var(--s-${series[j].key})"><title>${esc(g.label)} · ${esc(series[j].label)}: ${esc(yFmt(v))}</title></rect>`;
      s += `<text class="val" x="${xx + bw / 2}" y="${top - 5}" text-anchor="middle">${esc(yFmt(v))}</text>`;
    });
    const words = String(g.label).split(' ');
    const half = Math.ceil(words.length / 2);
    const lines = words.length > 3 ? [words.slice(0, half).join(' '), words.slice(half).join(' ')] : [g.label];
    lines.forEach((ln, k) => { s += `<text class="lbl" x="${L + i * gw + gw / 2}" y="${H - B + 16 + k * 13}" text-anchor="middle">${esc(ln)}</text>`; });
  });
  return `${s}</svg>`;
}
