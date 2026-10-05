-- 简历保存历史版本（对照生产 /api/cv/history/page：每条保存一份快照，仅保留近一年）
CREATE TABLE IF NOT EXISTS resume_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  resume_type TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  style TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_resume_versions_user ON resume_versions(user_id, resume_type, created_at DESC);
