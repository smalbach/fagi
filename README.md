# fagi

A single Node server (`server/`) serves the already built game (`dist/`) and the
API under `/api`: accounts, waitlist and recorded sessions in Postgres.

## Locally

```bash
cp .env.example .env   # and set your DATABASE_URL and your ADMIN_EMAIL
npm install
npm run start:dev      # API on :8787 (applies the migrations on its own)
npm run dev            # game on :5173; Vite forwards /api to the API
```

The account that signs up with `ADMIN_EMAIL` starts out approved and as admin. The
rest stay on the waitlist until the admin approves them from the
**Admin** button on the sessions screen. To make another already registered
account an admin: `npm run make-admin -- email@example.com`.

`npm test` runs everything. The server tests need `DATABASE_URL_TEST`
(a separate database: it is **wiped entirely** on every test); without it they are skipped.

## On Railway

1. Add a Postgres service to the project and, in the game's service, the
   variable `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
2. In the game's service: `ADMIN_EMAIL` and `NODE_ENV=production` (cookies
   over HTTPS only).
3. `railway.json` builds with `npm run build` and starts with `npm start`.

## Sessions

Each game is recorded as a list of events (`src/recorder/`), not as
snapshots of the state: what was created, where and when (nest, water, trees, rocks,
each fruit and which tree it fell from), what disappeared and why, every setting
touched, the wind, the pheromone and Fagi's path every half second.
Replaying means re-applying those events in order. The catalogue is in
`src/recorder/events.js`; the tables in `server/migrations/`.

## Research site

`investigacion/` is a static page about the project (questions, methods,
preregistered results, references), in Spanish and in English (`investigacion/en/`).
The build serves it at `/investigacion/` next to the game. It draws Fagi with the
game's sprites and runs the lab of the main study (`research/lab/`) in the reader's
browser. Its per-generation curves come from `npm run site-data`, which reruns the
main cell with the study's own seeds.
