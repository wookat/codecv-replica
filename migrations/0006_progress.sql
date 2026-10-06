-- 投递进度（对齐生产 /api/progress）：记录 + 状态事件时间线
CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  post TEXT NOT NULL DEFAULT '',
  work_location TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '已投递',
  channel TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  mark TEXT NOT NULL DEFAULT '',
  snapshot TEXT NOT NULL DEFAULT '{}',
  post_time INTEGER NOT NULL DEFAULT 0,
  update_time INTEGER NOT NULL DEFAULT 0,
  create_time INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);

CREATE TABLE IF NOT EXISTS progress_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  progress_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  time INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_progress_events_pid ON progress_events(progress_id);
