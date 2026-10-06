import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { execSync, spawn } from 'node:child_process'
import net from 'node:net'

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

function apiServer() {
  let child = null
  const stop = () => { if (child && child.exitCode === null) child.kill('SIGTERM'); child = null }
  return {
    name: 'fagi-api-server',
    apply: 'serve',
    async configureServer(server) {
      const port = Number(process.env.PORT) || 8787
      if (await portBusy(port)) return
      child = spawn(process.execPath, ['--env-file-if-exists=.env', '--watch', 'server/index.js'], {
        cwd: fileURLToPath(new URL('.', import.meta.url)),
        stdio: 'inherit',
      })
      child.on('exit', (code) => { if (code) server.config.logger.error(`[api] exited with code ${code}`) })
      server.httpServer?.once('close', stop)
      process.once('exit', stop)
    },
  }
}

export default defineConfig({
  plugins: [apiServer()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(commit()),
    __APP_BUILT__: JSON.stringify(new Date().toISOString()),
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
