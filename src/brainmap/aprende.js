// 5. Aprende — la última experiencia: qué probó, qué sintió, cómo movió la
// creencia y qué regla escribió o revisó (o cuánto le falta para escribirla).

import { specOf, LEARN } from '../config.js';
import { labelOf, t } from '../i18n.js';
import { VERDE, ROJO, MORADO, TEXTO, DIM } from './paleta.js';
import { pesoDe, cambioDe, signo } from './lectura.js';

export function pintarAprende(pinceles, fagi, y) {
  const { s, texto, cadena, cabecera } = pinceles;
  const { W, pad, lineH } = pinceles.medidas();
  const lastRule = fagi.brain.lastRule;
  const ep = fagi.lastEpisode;

  cabecera(5, t('brainmap.sec.learn'), y, W, pad);
  y += 18 * s;
  if (!ep) {
    texto(t('brainmap.noEpisode'), pad, y, { size: 9.5, color: DIM });
    return y + lineH;
  }

  const items = [];
  const color = specOf(ep.key)?.color ?? DIM;
  items.push({ text: t(`brainmap.ep.${ep.action}`, { what: labelOf(ep.key) }), color, bold: true });
  const sens = (ep.sensations ?? []).filter((x) => x.sense !== 'peril' && x.sense !== 'contradiccion')
    .map((x) => t(`sense.${x.sense}`, { v: x.sense === 'hunger' || x.sense === 'thirst' ? signo(x.v, 0) : x.v }));
  if (ep.pending && ep.action === 'drink' && !cambioDe(ep)) {
    items.push({ text: t('brainmap.pending'), color: DIM });
  } else {
    items.push({ text: sens.length ? t('brainmap.felt', { list: sens.join(', ') }) : t('brainmap.feltNothing'), color: TEXTO });
    items.push({ text: t('brainmap.reward', { v: signo(ep.reward ?? 0) }), color: (ep.reward ?? 0) >= 0 ? VERDE : ROJO, filled: true, bold: true });
    if (ep.correction) items.push({ text: t('brainmap.correction', { v: signo(ep.correction) }), color: ROJO, filled: true });
    const cb = cambioDe(ep);
    if (cb?.before && cb?.after) {
      items.push({
        text: `${t('brainmap.belief', { from: signo(cb.before.value), to: signo(cb.after.value) })} · ${t(`brainmap.kind.${cb.kind}`)} · ${t(`stage.${cb.after.stage}`)}`,
        color: MORADO,
      });
    }
    if (ep.pending) items.push({ text: t('brainmap.watching'), color: DIM });
  }
  // La regla que salió de ahí, o cuánto le falta para escribirla.
  const r = fagi.brain.facts[ep.key];
  if (lastRule?.key === ep.key && lastRule.id) {
    items.push({ text: t('brainmap.ruleWritten', { id: lastRule.id, kind: t(`brainmap.rk.${lastRule.kind}`) }),
      color: lastRule.verdict === 'avoid' ? ROJO : VERDE, filled: lastRule.kind !== 'retirada', bold: true });
  } else if (r) {
    const w = pesoDe(r);
    const falta = w >= 0 ? LEARN.preferFrom : LEARN.avoidFrom;
    items.push({ text: t('brainmap.noRuleYet', { w: Math.abs(w).toFixed(2), need: falta.toFixed(2) }), color: DIM });
  }
  return cadena(items, pad, y, W - pad, lineH + 2 * s) + lineH;
}
