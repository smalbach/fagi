// 4. Decide — la acción, su porqué, y si algo nuevo le hizo replantearse.

import { t, tx } from '../i18n.js';
import { TAG_COLOR, rethinkLine, legLine } from '../narrator.js';
import { AMARILLO, TEXTO, DIM } from './paleta.js';

export function pintarDecide(pinceles, fagi, y) {
  const { s, texto, chip, cabecera } = pinceles;
  const { W, pad, gap, lineH } = pinceles.medidas();
  const th = fagi.thought ?? {};

  cabecera(4, t('brainmap.sec.decide'), y, W, pad);
  y += 18 * s;
  const colorAccion = TAG_COLOR[th.action] ?? '#7f869a';
  let x = pad;
  x += chip(t(`tag.${th.action ?? 'explore'}`), x, y, colorAccion, { filled: true, bold: true }) + gap;
  x += texto(t(`action.${th.action ?? 'explore'}`), x, y, { bold: true, size: 11, maxW: W - pad - x }) + gap;
  if (fagi.directive && x < W - pad - 40 * s) chip(t('brainmap.api'), x, y, '#4cc9f0');
  y += lineH;
  texto(tx(th.reason), pad, y, { size: 9.5, color: TEXTO, maxW: W - pad * 2 });
  y += lineH * 0.9;

  // Si algo nuevo le hizo replantearse lo que estaba haciendo.
  const r = th.rethink ?? fagi.rethink;
  const linea = r ? rethinkLine(r, th) : null;
  if (linea) {
    const xx = pad + chip(t('tag.rethink'), pad, y, AMARILLO, { size: 8.5 }) + gap;
    texto(tx(linea.text), xx, y, { size: 9.5, color: TEXTO, maxW: W - pad - xx });
    y += lineH * 0.85;
    texto(tx(linea.detail), xx, y, { size: 9, color: DIM, maxW: W - pad - xx });
  } else {
    texto(t('brainmap.noNews'), pad, y, { size: 9.5, color: DIM });
    y += lineH * 0.85;
  }
  y += lineH * 0.9;

  // Explorando: por qué tramo va y por qué lo eligió.
  if (th.action === 'explore' && fagi.legChoice) {
    const l = legLine(fagi.legChoice);
    texto(`${t('word.leg')} ${fagi.exploreLegs ?? ''} · ${tx(l.text)} · ${tx(l.detail)}`, pad, y,
      { size: 9, color: DIM, maxW: W - pad * 2 });
  } else if (th.action === 'explore') {
    texto(`${t('word.leg')} ${fagi.exploreLegs ?? 0}`, pad, y, { size: 9, color: DIM });
  }
  return y + lineH;
}
