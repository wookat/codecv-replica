CREATE TABLE IF NOT EXISTS checkins (
  user_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
