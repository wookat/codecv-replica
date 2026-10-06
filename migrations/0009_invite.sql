ALTER TABLE users ADD COLUMN inviter TEXT DEFAULT '';
CREATE TABLE IF NOT EXISTS invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inviter_id INTEGER NOT NULL,
  invitee_id INTEGER NOT NULL,
  order_no TEXT DEFAULT '',
  commission INTEGER NOT NULL DEFAULT 0,
  settle_status TEXT NOT NULL DEFAULT '未结算',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id);
