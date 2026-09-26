-- Partidas grabadas como eventos: qué se creó, dónde y cuándo. Reproducir es
-- volver a aplicar los eventos en orden, nunca cargar una foto del estado.
CREATE TABLE sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at  timestamptz NOT NULL DEFAULT now(),
  ended_at    timestamptz,
  version     int NOT NULL DEFAULT 1,
  end_reason  text,
  duration    double precision NOT NULL DEFAULT 0,
  age_final   double precision,
  summary     jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX sessions_user_idx ON sessions (user_id, started_at DESC);

CREATE TABLE session_events (
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  seq         int NOT NULL,
  t           double precision NOT NULL,
  type        text NOT NULL,
  obj_id      int,
  x           double precision,
  y           double precision,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (session_id, seq)
);

CREATE INDEX session_events_t_idx ON session_events (session_id, t);
CREATE INDEX session_events_type_idx ON session_events (type);
