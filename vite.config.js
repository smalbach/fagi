import { defineConfig } from 'vite'

export default defineConfig({
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
