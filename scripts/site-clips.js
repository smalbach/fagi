// The research site's clips (public/investigacion/media/<lang>/*.webm, served at /investigacion/media): a real game
// session, filmed in a headless browser. Nothing is staged: the game runs in
// local mode (no account server), the world goes on as it always does, and
// each clip is a stretch of that session cropped to one panel.
//
//   npm run build
//   npm run site-clips                 # both languages
//   npm run site-clips -- --lang es    # one
//
// Needs playwright-core (devDependency) and a Chromium from Playwright
// (`npx playwright-core install chromium`, or --chrome <path>). The video is
// encoded with the ffmpeg Playwright ships (VP8 .webm, no sound).
//
// How a session is filmed:
//   1. time-lapse: from the first second, the whole map through one year
//      (3600 s of game). The world runs `__fagiPace` steps per frame drawn
//      (src/main.js): fast in dry weather, slower while it rains, so the
//      showers and their puddles are seen. A label on the map says the day,
//      the season and the weather.
//   2. by then the colony has a year of life behind it: the one followed has
//      beliefs, rules, organs and a mental map. Each panel is filmed in real
//      time (pace 1), enlarged with the game's own "Enlarge" (.brainmap-big)
//      and scrolled slowly where it is taller than the screen.

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const LANGS = arg('lang') ? [arg('lang')] : ['es', 'en'];
const PORT = Number(arg('port', 4199));
const OUT = arg('out', 'public/investigacion/media');   // copied by the build to /investigacion/media
const YEAR = Number(arg('year', 3600));          // game seconds the time-lapse covers
const ONLY = arg('only')?.split(',');            // e.g. --only ahora-mismo,historico
const want = (name) => !ONLY || ONLY.includes(name);
const VIEW = { width: 1440, height: 900 };
const DPR = 2;
const QUICK = process.argv.includes('--quick');   // a short trial run
const ms = (n) => (QUICK ? n / 5 : n);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- tools: browser, server, ffmpeg ---

function chromePath() {
  if (arg('chrome')) return arg('chrome');
  const base = join(homedir(), 'Library/Caches/ms-playwright');
  const dirs = existsSync(base) ? readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse() : [];
  for (const d of dirs) {
    for (const p of [
      'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
      'chrome-linux/chrome',
    ]) if (existsSync(join(base, d, p))) return join(base, d, p);
  }
  return undefined;   // playwright-core's own
}

function ffmpegPath() {
  if (arg('ffmpeg')) return arg('ffmpeg');
  const base = join(homedir(), 'Library/Caches/ms-playwright');
  const dirs = existsSync(base) ? readdirSync(base).filter((d) => d.startsWith('ffmpeg')).sort().reverse() : [];
  for (const d of dirs) {
    for (const f of ['ffmpeg-mac', 'ffmpeg-linux']) if (existsSync(join(base, d, f))) return join(base, d, f);
  }
  return 'ffmpeg';
}

async function serve() {
  try { await fetch(`http://localhost:${PORT}/jugar`); return null; } catch { /* not up yet */ }
  const child = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    await sleep(200);
    try { await fetch(`http://localhost:${PORT}/jugar`); return child; } catch { /* still starting */ }
  }
  throw new Error('vite preview did not start (did you run `npm run build`?)');
}

// Width and height of a JPEG, from its SOF marker.
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}

// Frames → .webm, cropped to `crop` (CSS px) and scaled to `width`.
function encode(frames, { crop, width, fps, file, busy = false }) {
  return new Promise((resolve, reject) => {
    const size = jpegSize(frames[0]);
    const k = size.w / VIEW.width;
    const c = {
      w: Math.floor((crop.w * k) / 2) * 2, h: Math.floor((crop.h * k) / 2) * 2,
      x: Math.round(crop.x * k), y: Math.round(crop.y * k),
    };
    const ff = spawn(ffmpegPath(), [
      '-loglevel', 'error', '-y',
      '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(fps), '-i', 'pipe:0',
      '-vf', `crop=${c.w}:${c.h}:${c.x}:${c.y},scale=${width}:-2`,
      // Panels are mostly still text: sharp at little cost. The map changes
      // everywhere at once (a time-lapse, the rain): capped harder.
      '-c:v', 'libvpx', ...(busy
        ? ['-b:v', '900k', '-maxrate', '1100k', '-bufsize', '2200k', '-crf', '22', '-qmin', '10', '-qmax', '50']
        : ['-b:v', '600k', '-maxrate', '900k', '-bufsize', '1800k', '-crf', '16', '-qmin', '4', '-qmax', '48']),
      '-deadline', 'good', '-cpu-used', '3', '-auto-alt-ref', '0', '-an', file,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    ff.on('error', reject);
    ff.on('close', (code) => (code ? reject(new Error(`ffmpeg ${code} on ${file}`)) : resolve()));
    (async () => {
      for (const f of frames) if (!ff.stdin.write(f)) await new Promise((r) => ff.stdin.once('drain', r));
      ff.stdin.end();
    })();
  });
}

// One cropped still (the clip's poster): the browser crops and re-encodes it
// (Playwright's ffmpeg has no JPEG encoder).
async function poster(page, frame, { crop, width, file }) {
  const b64 = await page.evaluate(async ({ src, crop, width, viewW }) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const k = img.naturalWidth / viewW;
    const c = document.createElement('canvas');
    c.width = width;
    c.height = Math.round((width * crop.h) / crop.w);
    c.getContext('2d').drawImage(img, crop.x * k, crop.y * k, crop.w * k, crop.h * k, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.82).split(',')[1];
  }, { src: `data:image/jpeg;base64,${frame.toString('base64')}`, crop, width, viewW: VIEW.width });
  writeFileSync(file, Buffer.from(b64, 'base64'));
}

// --- filming ---

// Records the page while `act` runs. `real`: frames resampled to `fps` by
// their timestamps (what was on screen at each tick); otherwise every frame
// drawn becomes one frame of the clip (a time-lapse).
async function film(page, cdp, act, { real = true, fps = 30 } = {}) {
  const shots = [];
  const onFrame = async ({ data, metadata, sessionId }) => {
    shots.push({ buf: Buffer.from(data, 'base64'), t: metadata.timestamp });
    try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch { /* stopped */ }
  };
  cdp.on('Page.screencastFrame', onFrame);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, everyNthFrame: 1 });
  await act();
  await cdp.send('Page.stopScreencast');
  cdp.off('Page.screencastFrame', onFrame);
  if (!shots.length) throw new Error('no frames');
  if (!real) return shots.map((s) => s.buf);
  const out = [];
  const t0 = shots[0].t;
  const t1 = shots.at(-1).t;
  let j = 0;
  for (let t = t0; t <= t1; t += 1 / fps) {
    while (j + 1 < shots.length && shots[j + 1].t <= t) j++;
    out.push(shots[j].buf);
  }
  return out;
}

async function rect(page, sel) {
  const r = await page.locator(sel).first().boundingBox();
  if (!r) throw new Error(`not on screen: ${sel}`);
  return { x: r.x, y: r.y, w: r.width, h: r.height };
}

// Scrolls `sel` from top to bottom over `ms`, pausing at both ends.
async function scrollThrough(page, sel, ms) {
  await page.evaluate(async ({ sel, ms }) => {
    const el = document.querySelector(sel);
    const max = el.scrollHeight - el.clientHeight;
    const pause = Math.min(2500, ms * 0.15);
    await new Promise((r) => setTimeout(r, pause));
    const t0 = performance.now();
    const run = ms - 2 * pause;
    await new Promise((done) => {
      function tick(now) {
        const p = Math.min(1, (now - t0) / run);
        el.scrollTop = max * (0.5 - 0.5 * Math.cos(Math.PI * p));
        if (p < 1) requestAnimationFrame(tick); else done();
      }
      requestAnimationFrame(tick);
    });
    await new Promise((r) => setTimeout(r, pause));
  }, { sel, ms });
}

const probe = (page) => page.evaluate(() => globalThis.__fagiProbe?.());
const pace = (page, n) => page.evaluate((v) => { globalThis.__fagiPace = v; }, n);

const LABEL = {
  es: { year: 'Año', day: 'Día', night: 'noche', summer: 'verano', autumn: 'otoño', winter: 'invierno', rain: 'lluvia' },
  en: { year: 'Year', day: 'Day', night: 'night', summer: 'summer', autumn: 'autumn', winter: 'winter', rain: 'rain' },
};

// The label over the map during the time-lapse: day, season, weather, air.
async function showLabel(page, lang) {
  await page.evaluate((L) => {
    const box = document.getElementById('canvas').getBoundingClientRect();
    const el = document.createElement('div');
    el.id = 'clip-label';
    Object.assign(el.style, {
      position: 'fixed', left: `${box.left + 14}px`, top: `${box.top + 14}px`, zIndex: 99,
      font: '600 15px/1.2 ui-sans-serif, system-ui, sans-serif', color: '#f3efe6',
      background: 'rgba(14,16,22,.72)', padding: '7px 12px', borderRadius: '8px',
      letterSpacing: '.02em', pointerEvents: 'none',
    });
    document.body.append(el);
    const tick = () => {
      const p = globalThis.__fagiProbe();
      const parts = [`${L.year} ${p.year ?? 1}`, `${L.day} ${p.day}${p.night ? ` · ${L.night}` : ''}`];
      if (p.season) parts.push(L[p.season]);
      if (p.rain) parts.push(`☔ ${L.rain}`);
      parts.push(`${Math.round(p.air)} °C`);
      el.textContent = parts.join('  ·  ');
      requestAnimationFrame(tick);
    };
    tick();
  }, LABEL[lang]);
}

async function session(browser, lang) {
  const dir = join(OUT, lang);
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: DPR });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  // No account server: the game offers local play.
  await page.route('**/api/**', (r) => r.abort());
  await page.addInitScript((l) => {
    try {
      localStorage.clear();
      localStorage.setItem('fagi.lang', l);
    } catch { /* fine */ }
  }, lang);
  await page.goto(`http://localhost:${PORT}/jugar`);
  await page.click('#btn-local-play');
  await sleep(800);
  await page.click('#btn-start');
  await sleep(1500);
  const cdp = await page.context().newCDPSession(page);
  const save = async (name, frames, crop, width, { fps = 30, busy = false } = {}) => {
    const file = join(dir, `${name}.webm`);
    await encode(frames, { crop, width, fps, file, busy });
    await poster(page, frames[Math.floor(frames.length * 0.6)], { crop, width, file: join(dir, `${name}.jpg`) });
    console.log(`  ${file}  (${frames.length} frames, ${(frames.length / fps).toFixed(1)} s)`);
  };

  // 1. The year, as a time-lapse (or, when it is not wanted, the same year run
  //    unfilmed and as fast as it goes).
  const began = Date.now();
  const map = await rect(page, '#canvas');
  if (want('timelapse')) {
    console.log(`[${lang}] time-lapse of one year…`);
    await showLabel(page, lang);
    const lapse = await film(page, cdp, async () => {
      for (;;) {
        const p = await probe(page);
        if (p.time >= YEAR) break;
        await pace(page, p.rain ? 6 : 54);
        await sleep(150);
      }
    }, { real: false });
    await pace(page, 1);
    await page.evaluate(() => document.getElementById('clip-label')?.remove());
    // About 60 s at most: drop frames evenly if there are more.
    const keep = Math.max(1, Math.ceil(lapse.length / (60 * 30)));
    await save('timelapse', lapse.filter((_, i) => i % keep === 0), map, 1024, { busy: true });
  } else {
    console.log(`[${lang}] one year, unfilmed…`);
    await pace(page, 120);
    while ((await probe(page)).time < YEAR) await sleep(500);
  }

  // The one followed may have just been born (the one before died during the
  // year): the world goes on, fast, until she has lived a while.
  await pace(page, 30);
  for (let i = 0; i < 400; i++) {
    const q = await probe(page);
    if (q.age >= 900 && q.beliefs >= 8) break;
    await sleep(500);
  }
  await pace(page, 1);
  const p = await probe(page);
  console.log(`[${lang}] after the year: age ${Math.round(p.age)} s, ${p.beliefs} beliefs, ${p.rules} rules, ${p.season} (${((Date.now() - began) / 1000).toFixed(0)} s so far)`);

  // 2. A stretch of the session as it is played: the whole screen, the camera
  //    following her up close.
  await page.mouse.move(map.x + map.w / 2, map.y + map.h / 2);
  await page.keyboard.press('f');
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -240); await sleep(80); }
  await sleep(1200);
  if (want('sesion')) await save('sesion', await film(page, cdp, () => sleep(ms(22000))), { x: 0, y: 0, w: VIEW.width, h: VIEW.height }, 1200, { busy: true });

  // 3. The panels, one by one, enlarged as the game's "Enlarge" does it.
  const big = async (pane, on) => page.evaluate(({ pane, on }) => {
    document.querySelector(`.pane[data-pane="${pane}"]`).classList.toggle('brainmap-big', on);
  }, { pane, on });
  const tab = async (name) => { await page.click(`#console-tabs [data-tab="${name}"]`); await sleep(500); };
  // `zoom`: the text panels fill a fraction of the enlarged pane at the game's
  // size, so their text is enlarged (as the game's A+ does) to be read.
  const panel = async (name, tabName, pane, ms, { width = 1280, zoom = 1 } = {}) => {
    if (!want(name)) return;
    await tab(tabName);
    await big(pane, true);
    await page.evaluate(({ pane, zoom }) => {
      document.querySelector(`.pane[data-pane="${pane}"] .pane-body`).style.zoom = zoom === 1 ? '' : String(zoom);
    }, { pane, zoom });
    await sleep(900);
    const sel = `.pane[data-pane="${pane}"]`;
    const crop = await rect(page, sel);
    const body = `${sel} .pane-body`;
    const tall = await page.evaluate((s) => { const el = document.querySelector(s); el.scrollTop = 0; return el.scrollHeight > el.clientHeight + 40; }, body);
    const frames = await film(page, cdp, () => (tall ? scrollThrough(page, body, ms) : sleep(ms)));
    await big(pane, false);
    await page.evaluate((pane) => { document.querySelector(`.pane[data-pane="${pane}"] .pane-body`).style.zoom = ''; }, pane);
    await save(name, frames, crop, width);
  };
  console.log(`[${lang}] panels…`);
  await panel('ahora-mismo', 'live', 'now', ms(14000), { zoom: 1.9 });
  await panel('mapa-cerebro', 'live', 'brainmap', ms(34000));
  await panel('mapa-cuerpo', 'body', 'bodymap', ms(18000));
  await panel('mapa-mental', 'body', 'mentalmap', ms(16000));
  await panel('codigo-aprendido', 'history', 'code', ms(22000));
  await panel('historico', 'history', 'log', ms(20000), { zoom: 1.6 });
  await page.close();
}

const server = await serve();
const browser = await chromium.launch({ executablePath: chromePath() });
try {
  for (const lang of LANGS) await session(browser, lang);
  writeFileSync(join(OUT, 'README.md'), `Clips filmed by scripts/site-clips.js on ${new Date().toISOString().slice(0, 10)} from real local game sessions (one per language; `--only` re-films some clips in a new session).\n`);
} finally {
  await browser.close();
  server?.kill();
}
