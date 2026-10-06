ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN banned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN ban_reason TEXT DEFAULT '';
ALTER TABLE resumes ADD COLUMN review_status TEXT DEFAULT '';

-- 攻略文章管理（种子 posts.json 首次访问时同步进表，之后以 D1 为准）
CREATE TABLE IF NOT EXISTS posts (
  _id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cover TEXT DEFAULT '',
  category TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  content_md TEXT DEFAULT '',
  author TEXT DEFAULT '',
  status TEXT DEFAULT 'published',
  deleted INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  publish_time INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 面经后台字典覆盖：公司/岗位/话题的增改（含 logo）
CREATE TABLE IF NOT EXISTS mj_dict (
  kind TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  extra TEXT DEFAULT '',
  PRIMARY KEY (kind, slug)
);

-- 模板隐藏标记（admin/template/delete）
CREATE TABLE IF NOT EXISTS template_hidden (
  type TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

-- 广告位与广告
CREATE TABLE IF NOT EXISTS ad_spaces (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  space TEXT NOT NULL,
  title TEXT DEFAULT '',
  image TEXT DEFAULT '',
  link TEXT DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 1,
  start_at INTEGER DEFAULT 0,
  end_at INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ads_space ON ads(space);

-- 导出/校对事件（statistics 与 events 页数据源）
CREATE TABLE IF NOT EXISTS export_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  resume_type TEXT DEFAULT '',
  kind TEXT DEFAULT 'pdf',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_export_events_time ON export_events(created_at);
CREATE TABLE IF NOT EXISTS proofread_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  resume_type TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  meta TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_proofread_events_time ON proofread_events(created_at);

-- 面经创作大赛赛季 + 结算结果
CREATE TABLE IF NOT EXISTS admin_seasons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  start_at INTEGER DEFAULT 0,
  end_at INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running',
  results TEXT DEFAULT '',
  created_at INTEGER NOT NULL
);

-- 面经话题管理（topic/save + upload-cover）
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cover TEXT DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
