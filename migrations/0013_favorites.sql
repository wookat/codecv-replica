-- 模板收藏（对齐生产收藏体系：user_id + tpl_type 主键）
CREATE TABLE IF NOT EXISTS tpl_favorites (
  user_id INTEGER NOT NULL,
  tpl_type TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, tpl_type)
);
