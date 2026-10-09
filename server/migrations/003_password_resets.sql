-- "Forgot password": one-time links sent by email. As with login sessions,
-- only the token's SHA-256 is stored.
CREATE TABLE password_resets (
  token_hash  text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz
);

CREATE INDEX password_resets_user_idx ON password_resets (user_id);
