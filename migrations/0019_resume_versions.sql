CREATE TABLE IF NOT EXISTS resume_version (
  id TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL,
  content_md TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rv_resume ON resume_version(resume_id, created_at DESC);
