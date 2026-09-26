# fagi

Un solo servidor Node (`server/`) sirve el juego ya construido (`dist/`) y la
API bajo `/api`: cuentas, lista de espera y sesiones grabadas en Postgres.

## En local

```bash
cp .env.example .env   # y pon tu DATABASE_URL y tu ADMIN_EMAIL
npm install
npm run start:dev      # API en :8787 (aplica las migraciones sola)
npm run dev            # juego en :5173; Vite le pasa /api a la API
```

La cuenta que se registre con `ADMIN_EMAIL` nace aprobada y como admin. Las
demás quedan en lista de espera hasta que el admin las aprueba desde el botón
**Admin** de la pantalla de sesiones. Para hacer admin a otra cuenta ya
registrada: `npm run make-admin -- correo@ejemplo.com`.

`npm test` corre todo. Los tests del servidor necesitan `DATABASE_URL_TEST`
(una base aparte: se **borra entera** en cada test); sin ella se saltan.

## En Railway

1. Añade un servicio Postgres al proyecto y, en el servicio del juego, la
   variable `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
2. En el servicio del juego: `ADMIN_EMAIL` y `NODE_ENV=production` (cookies
   solo por HTTPS).
3. `railway.json` construye con `npm run build` y arranca con `npm start`.

## Sesiones

Cada partida se graba como una lista de eventos (`src/recorder/`), no como
fotos del estado: qué se creó, dónde y cuándo (nido, agua, árboles, rocas,
cada fruta y de qué árbol cayó), qué desapareció y por qué, cada ajuste
tocado, el viento, la feromona y el recorrido de Fagi cada medio segundo.
Reproducir es volver a aplicar esos eventos en orden. El catálogo está en
`src/recorder/events.js`; las tablas en `server/migrations/`.
