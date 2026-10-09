import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { execSync, spawn } from 'node:child_process'
import net from 'node:net'
import { frontDoor } from './server/front-door.js'

// The build's version: the one in package.json (the .githooks hook bumps it on
// every commit) and the commit it comes from. On Railway there is no .git, but
// Railway itself gives the commit in RAILWAY_GIT_COMMIT_SHA.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
function commit() {
  const railway = process.env.RAILWAY_GIT_COMMIT_SHA
  if (railway) return railway.slice(0, 7)
  try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return '' }
}

// In development, `npm run dev` also starts the API (`npm run start:dev`) if
// nothing is listening on :8787 yet, so the game never boots without its
// account/Postgres server. If the API is already running, it is left alone.
function portBusy(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1')
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('error', () => resolve(false))
  })
}

// Vite restarts itself when its config changes and loads this file anew; the
// API it started is kept on globalThis so a restart reuses it instead of
// killing it (killing it left the game unable to reach the server).
function apiServer() {
  return {
    name: 'fagi-api-server',
    apply: 'serve',
    async configureServer(server) {
      const running = globalThis.__fagiApi
      if (running && running.exitCode === null) return
      const port = Number(process.env.PORT) || 8787
      if (await portBusy(port)) return
      const child = spawn(process.execPath, ['--env-file-if-exists=.env', '--watch', 'server/index.js'], {
        cwd: fileURLToPath(new URL('.', import.meta.url)),
        stdio: 'inherit',
      })
      globalThis.__fagiApi = child
      child.on('exit', (code) => { if (code) server.config.logger.error(`[api] exited with code ${code}`) })
      process.once('exit', () => { if (child.exitCode === null) child.kill('SIGTERM') })
    },
  }
}

// As in production (server/app.js, server/front-door.js): / and /en/ are the
// research site, the game is at /jugar (Vite serves the game's index.html for
// any path it doesn't know).
function siteAtRoot() {
  const route = (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    const door = frontDoor(req.url)
    if (door?.redirect) { res.statusCode = 301; res.setHeader('Location', door.redirect); return res.end() }
    if (door?.page) req.url = `/${door.page}`
    next()
  }
  return {
    name: 'fagi-site-at-root',
    configureServer(server) { server.middlewares.use(route) },
    configurePreviewServer(server) { server.middlewares.use(route) },
  }
}

export default defineConfig({
  plugins: [siteAtRoot(), apiServer()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(commit()),
    __APP_BUILT__: JSON.stringify(new Date().toISOString()),
  },
  // The game (served at /jugar) and the research site (served at / and /en/), which
  // draws Fagi with the game's own sprite code but loads nothing else of it.
  build: {
    rollupOptions: {
      input: {
        game: fileURLToPath(new URL('./index.html', import.meta.url)),
        research: fileURLToPath(new URL('./investigacion/index.html', import.meta.url)),
        researchEn: fileURLToPath(new URL('./investigacion/en/index.html', import.meta.url)),
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // In development the API is served by `npm run start:dev` (started by the
    // plugin above when missing); Vite forwards /api to it
    // so everything comes from the same origin, as in production, and the cookie works.
    proxy: { '/api': 'http://localhost:8787' },
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    // Railway puts the game behind a *.up.railway.app domain (or a custom one):
    // without this Vite rejects the Host header for not being localhost.
    allowedHosts: true,
  },
})
