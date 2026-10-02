import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// The build's version: the one in package.json (the .githooks hook bumps it on
// every commit) and the commit it comes from. On Railway there is no .git, but
// Railway itself gives the commit in RAILWAY_GIT_COMMIT_SHA.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
function commit() {
  const railway = process.env.RAILWAY_GIT_COMMIT_SHA
  if (railway) return railway.slice(0, 7)
  try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return '' }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(commit()),
    __APP_BUILT__: JSON.stringify(new Date().toISOString()),
  },
  // Two pages: the game (/) and the research site (/investigacion/), which
  // draws Fagi with the game's own sprite code but loads nothing else of it.
  build: {
    rollupOptions: {
      input: {
        game: fileURLToPath(new URL('./index.html', import.meta.url)),
        research: fileURLToPath(new URL('./investigacion/index.html', import.meta.url)),
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // In development the API is served by `npm run start:dev`; Vite forwards /api to it
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
