CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  pwd_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  nickname TEXT DEFAULT '',
  sex TEXT DEFAULT '',
  professional TEXT DEFAULT '',
  graduation TEXT DEFAULT '',
  school TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  origin TEXT DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS resumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  resume_type TEXT DEFAULT '',
  md TEXT DEFAULT '',
  style TEXT DEFAULT '',
  link TEXT DEFAULT '',
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_no TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  paid_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
