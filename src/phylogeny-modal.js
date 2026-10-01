// Phylogeny Modal: Visual interactive inspection of the evolutionary code tree.
// (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md, Phase 5)

import { summarizePhylogeny, renderPhylogenyMermaid, exportPhylogenyJson, phylogenyOf } from './phylogeny.js';
import { getLang, onLangChange } from './i18n.js';

const L = (en, es) => (getLang() === 'es' ? es : en);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createPhylogenyModal(worldGetter) {
  if (typeof document === 'undefined') return { open() {}, close() {}, update() {} };

  const overlay = document.getElementById('phylogeny-overlay');
  const btnOpen = document.getElementById('btn-phylogeny');
  const btnClose = document.getElementById('btn-phy-close');
  const btnMermaid = document.getElementById('btn-phy-copy-mermaid');
  const btnJson = document.getElementById('btn-phy-export-json');
  const metricsEl = document.getElementById('phylogeny-metrics');
  const treeEl = document.getElementById('phylogeny-tree');

  if (!overlay || !btnOpen) return { open() {}, close() {}, update() {} };

  function getWorld() {
    return typeof worldGetter === 'function' ? worldGetter() : worldGetter;
  }

  let lastPaintTime = 0;

  function open() {
    overlay.hidden = false;
    paint(true);
  }

  function close() {
    overlay.hidden = true;
  }

  function paint(force = false) {
    if (overlay.hidden) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (!force && now - lastPaintTime < 500) return;
    lastPaintTime = now;

    const world = getWorld();
    if (!world) return;

    const summary = summarizePhylogeny(world);
    const phy = phylogenyOf(world);

    // 1. Render Metrics Bar
    if (metricsEl) {
      metricsEl.innerHTML = `
        <div class="phy-stat-card">
          <span class="phy-stat-val">${summary.totalInnovations}</span>
          <span class="phy-stat-lbl">${L('Total Innovations', 'Innovaciones Totales')}</span>
        </div>
        <div class="phy-stat-card" style="border-top-color:#8fd93d;">
          <span class="phy-stat-val" style="color:#8fd93d;">${summary.bySource.self}</span>
          <span class="phy-stat-lbl">${L('🧠 Self-Synthesized', '🧠 Propias (Día)')}</span>
        </div>
        <div class="phy-stat-card" style="border-top-color:#8f7fd0;">
          <span class="phy-stat-val" style="color:#8f7fd0;">${summary.bySource.night}</span>
          <span class="phy-stat-lbl">${L('🌙 Dream Syntheses', '🌙 Sueños (Noche)')}</span>
        </div>
        <div class="phy-stat-card" style="border-top-color:#3d8fd9;">
          <span class="phy-stat-val" style="color:#3d8fd9;">${summary.bySource.told}</span>
          <span class="phy-stat-lbl">${L('👥 Cultural Traditions', '👥 Transmisión Cultural')}</span>
        </div>
        <div class="phy-stat-card">
          <span class="phy-stat-val">${summary.activeEntitiesWithCode}</span>
          <span class="phy-stat-lbl">${L('Entities with Code', 'Entidades con Código')}</span>
        </div>
      `;
    }

    // 2. Render Visual Tree / Timeline
    if (treeEl) {
      if (!phy.nodes.size) {
        treeEl.innerHTML = `
          <div class="phy-empty">
            <p>🌱 <b>${L('Innate Primordial Hierarchy', 'Jerarquía Primordial Innata')}</b></p>
            <p class="phy-hint">${L(
              'No code mutations yet. When entities encounter daytime crises (storms, hunger, heat) or consolidate during night rest, self-written lines will branch out here in real time.',
              'No hay mutaciones de código todavía. Cuando las entidades enfrenten crisis diurnas (tormentas, hambre, calor) o consoliden durante el descanso nocturno, las líneas auto-programadas se ramificarán aquí en tiempo real.'
            )}</p>
          </div>
        `;
        return;
      }

      const nodes = Array.from(phy.nodes.values()).reverse();
      const itemsHtml = nodes.map((node) => {
        const badgeColor = node.source === 'night' ? '#8f7fd0' : node.source === 'told' ? '#3d8fd9' : '#8fd93d';
        const badgeText = node.source === 'night' ? '🌙 NIGHT' : node.source === 'told' ? '👥 TOLD' : '🧠 SELF';
        const chainHtml = node.chain && node.chain.length
          ? `<span class="phy-chain"> [macro: ${node.chain.map(esc).join(' → ')}]</span>`
          : '';
        const parentHtml = node.parentId
          ? `<div class="phy-parent">↳ ${L('specializes', 'especializa a')}: <code>${esc(node.parentId)}</code></div>`
          : '';

        return `
          <div class="phy-node-card">
            <div class="phy-node-head">
              <span class="phy-badge" style="background:${badgeColor};">${badgeText}</span>
              <code class="phy-code-id">${esc(node.id)}</code>${chainHtml}
              <span class="phy-meta">Fagi #${node.who} · Gen ${node.generation} @ ${node.time}s</span>
            </div>
            ${parentHtml}
            ${node.why ? `<div class="phy-why">${esc(node.why)}</div>` : ''}
          </div>
        `;
      }).join('');

      treeEl.innerHTML = `<div class="phy-node-list">${itemsHtml}</div>`;
    }
  }

  // Event Listeners
  btnOpen.addEventListener('click', open);
  btnClose?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) close();
  });

  btnMermaid?.addEventListener('click', () => {
    const world = getWorld();
    if (!world || !navigator.clipboard) return;
    const mmd = renderPhylogenyMermaid(world);
    navigator.clipboard.writeText(mmd).then(() => {
      const old = btnMermaid.textContent;
      btnMermaid.textContent = '✓ Copied!';
      setTimeout(() => { btnMermaid.textContent = old; }, 1500);
    });
  });

  btnJson?.addEventListener('click', () => {
    const world = getWorld();
    if (!world) return;
    const json = exportPhylogenyJson(world);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fagi-phylogeny-${Math.round(world.time ?? 0)}s.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  onLangChange(() => {
    if (!overlay.hidden) paint();
  });

  return { open, close, update: paint };
}
