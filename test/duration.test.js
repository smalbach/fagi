import test from 'node:test';
import assert from 'node:assert/strict';

import { formatClock, formatDuration, setLang, t } from '../src/i18n.js';

test('formatDuration deja los tiempos cortos en segundos', () => {
  assert.equal(formatDuration(0), '0s');
  assert.equal(formatDuration(42), '42s');
  assert.equal(formatDuration(59.4), '59s');
  assert.equal(formatDuration(9.55, { precise: true }), '9.6s');
});

test('formatDuration reparte en dos unidades como máximo', () => {
  assert.equal(formatDuration(90), '1m 30s');
  assert.equal(formatDuration(125), '2m 05s');
  assert.equal(formatDuration(3900), '1h 05m');
  assert.equal(formatDuration(7325), '2h 02m');
  assert.equal(formatDuration(180000), '2d 02h');
});

test('formatDuration se salta la unidad pequeña cuando es cero', () => {
  assert.equal(formatDuration(300), '5m');
  assert.equal(formatDuration(3600), '1h');
  assert.equal(formatDuration(86400), '1d');
});

test('formatDuration redondea antes de repartir, no después', () => {
  assert.equal(formatDuration(59.7), '1m');
  assert.equal(formatDuration(59.7, { precise: true }), '59.7s');
});

test('formatDuration aguanta valores raros', () => {
  for (const malo of [undefined, null, NaN, -5, 'x']) {
    assert.equal(formatDuration(malo), '0s');
  }
});

test('formatClock conserva los segundos, que es lo que ordena el histórico', () => {
  assert.equal(formatClock(12.4), '12.4s');
  assert.equal(formatClock(90), '1:30');
  assert.equal(formatClock(3725), '1:02:05');
  assert.equal(formatClock(180000), '50:00:00');
});

test('t() formatea un parámetro de duración en cualquier idioma', () => {
  setLang('en');
  assert.equal(t('log.diedSub', { age: { dur: 95 }, eaten: 3 }), 'lived 1m 35s, ate 3');
  setLang('es');
  assert.equal(t('log.diedSub', { age: { dur: 95 }, eaten: 3 }), 'vivió 1m 35s, comió 3');
  assert.equal(t('reason.memory', { sec: { dur: 1.44, precise: true } }),
    'lo perdió de vista, insiste 1.4s más');
  setLang('en');
});
