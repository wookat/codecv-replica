-- 用户反馈表：/api/feedback 写入，admin 后台查看
CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  username TEXT,
  field TEXT,
  avatar TEXT,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
