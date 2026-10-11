CREATE TABLE IF NOT EXISTS ops_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,        -- api_error|export_fail|ai_fail|login_fail
  detail TEXT DEFAULT '',
  username TEXT DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ops_kind ON ops_events(kind, created_at);
