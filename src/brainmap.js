// El mapa del cerebro: cómo está decidiendo Fagi AHORA MISMO, y qué ha
// aprendido para llegar hasta ahí. Percibe → Cree → Decide, con el camino que
// de verdad está usando en este instante resaltado sobre el resto.
//
// No calcula nada: solo lee lo que ya calcularon perception.js/brain.js
// (fagi.thought.ranked, con su score y su desglose) y memory.js/learned/
// (fagi.brain.facts, fagi.brain.rules) y lo dibuja. Un lienzo aparte que se
// repinta cada fotograma, como el resto de la pantalla.

import { specOf } from './config.js';
import { labelOf, t } from './i18n.js';
import { TAG_COLOR } from './narrator.js';

const VERDE = '#8fd93d';
const ROJO = '#d95b7e';
const MUTED = '#4a4f5e';
const TEXTO = '#cfd3dd';
const DIM = '#6e7486';

// Punteado fino en memoria corta, trazo entero en memoria larga: el anillo
// de una creencia cambia de estilo según va madurando, sin que nadie tenga
// que leer un número para notarlo.
const ESTILO_ETAPA = {
  corta: { dash: [1.5, 2], width: 1.1 },
  media: { dash: [5, 2], width: 1.4 },
  larga: { dash: [], width: 1.9 },
};

const SENTIDO = { vista: 'eye', olfato: 'nose', memoria: 'memory' };

// La clave detrás de lo que Fagi está haciendo ahora, si hay alguna: la de su
// objetivo actual (comida o agua), o si no, la del rastro que sigue de olfato.
function claveDeIntencion(fagi) {
  if (fagi.target?.type && (fagi.targetKind === 'food' || fagi.targetKind === 'water')) return fagi.target.type;
  if (fagi.trailKey) return fagi.trailKey;
  return null;
}

function reglaActiva(rules, key, verdict) {
  return rules.list.some((r) => !r.retired && r.when.key === key && r.verdict === verdict);
}

export function createBrainMap(canvas, statusEl) {
  if (!canvas) return { update() {} };
  const g = canvas.getContext('2d');
  let cssW = 0;
  let cssH = 0;

  // El lienzo puede cambiar de tamaño con la ventana: se redimensiona solo
  // cuando de verdad hace falta, no en cada fotograma.
  function ajustarTamaño() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === cssW && rect.height === cssH) return;
    cssW = rect.width;
    cssH = rect.height;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function estado(fagi) {
    if (!statusEl) return;
    const activas = fagi.brain.rules.list.filter((r) => !r.retired);
    const retiradas = fagi.brain.rules.list.filter((r) => r.retired);
    statusEl.textContent = t('brainmap.status', {
      beliefs: Object.keys(fagi.brain.facts).length,
      active: activas.length,
      retired: retiradas.length,
      events: fagi.brain.lastRule?.n ?? 0,
    });
  }

  function update(fagi) {
    ajustarTamaño();
    estado(fagi);
    if (cssW === 0 || cssH === 0) return;

    const claves = Object.keys(fagi.brain.facts);
    const th = fagi.thought;
    const ranked = (th?.ranked ?? []).slice(0, 6);

    g.clearRect(0, 0, cssW, cssH);

    if (claves.length === 0 && ranked.length === 0) {
      g.fillStyle = DIM;
      g.font = '11px ui-monospace, monospace';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(t('brainmap.empty'), cssW / 2, cssH / 2);
      return;
    }

    const xPercibe = 22;
    const xCree = cssW * 0.56;
    const xDecide = cssW - 30;
    const yTop = 16;
    const yBottom = cssH - 12;

    const posCree = {};
    claves.forEach((k, i) => {
      posCree[k] = { x: xCree, y: yTop + (i + 0.5) * ((yBottom - yTop) / claves.length) };
    });
    const posPercibe = ranked.map((c, i) => ({
      c, x: xPercibe, y: yTop + (i + 0.5) * ((yBottom - yTop) / Math.max(ranked.length, 1)),
    }));

    const ganadora = claveDeIntencion(fagi);

    // 1. líneas percibe → cree (el candidato es SIEMPRE del mismo tipo que
    // la creencia que consulta: perception.js pone key=tipo del punto)
    g.lineCap = 'round';
    for (const { c, x, y } of posPercibe) {
      const destino = posCree[c.key];
      if (!destino) continue;
      const ganando = c.key === ganadora;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(destino.x, destino.y);
      g.strokeStyle = specOf(c.key)?.color ?? MUTED;
      g.lineWidth = ganando ? 2 : 1;
      g.globalAlpha = ganando ? 0.85 : 0.22;
      g.stroke();
    }
    g.globalAlpha = 1;

    // 2. cree → decide: solo el camino que de verdad está usando ahora,
    // como un hilo que fluye (línea discontinua animada) hacia la decisión.
    const cxDecide = xDecide;
    const cyDecide = cssH / 2;
    if (ganadora && posCree[ganadora]) {
      const o = posCree[ganadora];
      g.beginPath();
      g.moveTo(o.x, o.y);
      g.lineTo(cxDecide, cyDecide);
      g.strokeStyle = '#e6e8ee';
      g.lineWidth = 2;
      g.globalAlpha = 0.75;
      g.setLineDash([4, 3]);
      g.lineDashOffset = -(performance.now() / 45) % 7;
      g.stroke();
      g.setLineDash([]);
      g.globalAlpha = 1;
    }

    // 3. nodos de creencia: color = de qué tipo es; anillo = si le sienta
    // bien (verde) o mal (rojo), y punteado/sólido según cuánto lo lleva
    // sabiendo; insignia = si ya escribió una regla sobre ello.
    for (const k of claves) {
      const r = fagi.brain.facts[k];
      const { x, y } = posCree[k];
      const color = specOf(k)?.color ?? MUTED;
      const radio = 5 + r.confidence * 7;

      g.beginPath();
      g.arc(x, y, radio, 0, Math.PI * 2);
      g.fillStyle = color;
      g.globalAlpha = 0.85;
      g.fill();
      g.globalAlpha = 1;

      const estilo = ESTILO_ETAPA[r.stage] ?? ESTILO_ETAPA.corta;
      g.beginPath();
      g.arc(x, y, radio + 2.5, 0, Math.PI * 2);
      g.strokeStyle = r.value > 0.15 ? VERDE : r.value < -0.15 ? ROJO : MUTED;
      g.lineWidth = estilo.width;
      g.setLineDash(estilo.dash);
      g.stroke();
      g.setLineDash([]);

      if (reglaActiva(fagi.brain.rules, k, 'avoid') || reglaActiva(fagi.brain.rules, k, 'prefer')) {
        g.beginPath();
        g.arc(x + radio * 0.72, y - radio * 0.72, 3, 0, Math.PI * 2);
        g.fillStyle = reglaActiva(fagi.brain.rules, k, 'avoid') ? ROJO : VERDE;
        g.fill();
      }

      g.fillStyle = TEXTO;
      g.font = '9px ui-monospace, monospace';
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillText(labelOf(k), x + radio + 5, y);
    }

    // 4. nodos percibidos, por encima de sus líneas
    for (const { c, x, y } of posPercibe) {
      const color = specOf(c.key)?.color ?? MUTED;
      const ganando = c.key === ganadora;
      g.beginPath();
      g.arc(x, y, 4, 0, Math.PI * 2);
      g.fillStyle = color;
      g.globalAlpha = ganando ? 1 : 0.55;
      g.fill();
      g.globalAlpha = 1;

      const letra = t(`word.${SENTIDO[c.via] ?? 'eye'}`)[0]?.toUpperCase() ?? '';
      g.fillStyle = DIM;
      g.font = '8px ui-monospace, monospace';
      g.textAlign = 'right';
      g.fillText(letra, x - 7, y);
    }

    // 5. nodo Decide: color de la acción actual (misma paleta que el
    // histórico), con un anillo punteado si quien decide es la API externa.
    const colorAccion = TAG_COLOR[th?.action] ?? '#7f869a';
    g.beginPath();
    g.arc(cxDecide, cyDecide, 16, 0, Math.PI * 2);
    g.fillStyle = '#20242e';
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = colorAccion;
    g.stroke();

    if (fagi.directive) {
      g.beginPath();
      g.arc(cxDecide, cyDecide, 20, 0, Math.PI * 2);
      g.strokeStyle = '#4cc9f0';
      g.lineWidth = 1.3;
      g.setLineDash([2, 2]);
      g.stroke();
      g.setLineDash([]);
    }

    g.fillStyle = TEXTO;
    g.font = '8.5px ui-monospace, monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const etiqueta = t(`tag.${th?.action ?? 'explore'}`);
    g.fillText(etiqueta.length > 8 ? etiqueta.slice(0, 7) + '…' : etiqueta, cxDecide, cyDecide);
  }

  return { update };
}
