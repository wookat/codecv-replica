-- 面经/攻略互动（对齐生产 /api/engagement）：点赞收藏 + 评论回复
CREATE TABLE IF NOT EXISTS reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, target_type, target_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);

ALTER TABLE comments ADD COLUMN parent_id INTEGER NOT NULL DEFAULT 0;
