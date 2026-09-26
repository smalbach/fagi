import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

// La versión del build: la de package.json (el hook de .githooks la sube en
// cada commit) y el commit del que sale. En Railway no hay .git, pero él mismo
// da el commit en RAILWAY_GIT_COMMIT_SHA.
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
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // En desarrollo la API la sirve `npm run start:dev`; Vite le pasa /api para
    // que todo salga del mismo origen, como en producción, y la cookie valga.
    proxy: { '/api': 'http://localhost:8787' },
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    // Railway pone el juego detrás de un dominio *.up.railway.app (o uno propio):
    // sin esto Vite rechaza el Host header por no ser localhost.
    allowedHosts: true,
  },
})
