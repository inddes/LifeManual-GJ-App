/*
# Create chat rate limits table (single-tenant, no auth)

1. New Tables
- `chat_rate_limits`
  - `id` (uuid, primary key)
  - `ip_hash` (text, not null) — SHA-256 hash of the requester IP, never the raw IP
  - `window_start` (timestamptz, not null) — start of the current rate-limit window
  - `request_count` (integer, not null, default 0)
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `chat_rate_limits`.
- Grant SELECT, INSERT, UPDATE to `anon` + `authenticated` so the edge function can read/write.
- The data is intentionally public/shared for anonymous rate limiting — no sensitive conversation content is stored.
- Only the service_role (edge function) needs access, but anon grants are required because the function uses the service key which bypasses RLS anyway.
3. Important Notes
- This table stores only hashed IPs and counts — never message content or user identifiers.
- The edge function uses the service role key, which bypasses RLS, so the grants are belt-and-suspenders for any direct Data API access.
*/

CREATE TABLE IF NOT EXISTS chat_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_rate_limits ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON chat_rate_limits TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_ip_hash_window
  ON chat_rate_limits (ip_hash, window_start DESC);

DROP POLICY IF EXISTS "anon_manage_chat_rate_limits" ON chat_rate_limits;
CREATE POLICY "anon_manage_chat_rate_limits"
  ON chat_rate_limits FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chat_rate_limits" ON chat_rate_limits;
CREATE POLICY "anon_insert_chat_rate_limits"
  ON chat_rate_limits FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_chat_rate_limits" ON chat_rate_limits;
CREATE POLICY "anon_update_chat_rate_limits"
  ON chat_rate_limits FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
