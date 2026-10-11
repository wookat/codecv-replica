-- v2 大简历数据模型（设计文档 §四）：老表不动，新增六表
CREATE TABLE IF NOT EXISTS master_resume (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '我的大简历',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_master_user ON master_resume(user_id);

-- 大简历条目：经历/项目/奖项/技能等素材（section 分类）
CREATE TABLE IF NOT EXISTS resume_item (
  id TEXT PRIMARY KEY,
  master_id TEXT NOT NULL REFERENCES master_resume(id) ON DELETE CASCADE,
  section TEXT NOT NULL,           -- education|internship|project|award|skill|selfeval|other
  title TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  meta_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_item_master ON resume_item(master_id, sort);

-- 条目多版本写法：同一全栈项目对前端岗/后端岗各写一版
CREATE TABLE IF NOT EXISTS item_variant (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES resume_item(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '默认',  -- '默认'|'前端版'|'后端版'…
  content_md TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_variant_item ON item_variant(item_id);

-- 具体简历：模板 + 目标岗位/JD + 指向某份大简历
CREATE TABLE IF NOT EXISTS resume (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  master_id TEXT REFERENCES master_resume(id) ON DELETE SET NULL,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  target_jd TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_resume_user ON resume(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_master ON resume(master_id);

-- 选取清单：哪几个条目 × 各用哪个版本，ord 为简历内排序
CREATE TABLE IF NOT EXISTS resume_selection (
  resume_id TEXT NOT NULL REFERENCES resume(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES resume_item(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES item_variant(id) ON DELETE SET NULL,
  ord INTEGER NOT NULL DEFAULT 0,
  overrides_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (resume_id, item_id)
);

-- 模板补充字段：皮肤 schema 要求的额外内容（如有的模板要时间有的不要）
CREATE TABLE IF NOT EXISTS resume_extra (
  resume_id TEXT NOT NULL REFERENCES resume(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  value_md TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (resume_id, field_key)
);
