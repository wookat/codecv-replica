-- 分享/面经投稿/评论
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  type TEXT,
  name TEXT,
  content TEXT,
  style TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS mianjing_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT,
  company_slug TEXT,
  company_name TEXT,
  position_slug TEXT,
  grade TEXT,
  batch TEXT,
  round TEXT,
  result TEXT,
  school TEXT,
  major TEXT,
  anonymous INTEGER DEFAULT 0,
  content_md TEXT,
  status TEXT DEFAULT 'pending',
  created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_mj_sub_user ON mianjing_submissions(user_id);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  nickname TEXT,
  content TEXT,
  created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_comments_doc ON comments(doc_id);
