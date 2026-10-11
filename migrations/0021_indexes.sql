CREATE INDEX IF NOT EXISTS idx_resume_user ON resume(user_id);
CREATE INDEX IF NOT EXISTS idx_master_user ON master_resume(user_id);
CREATE INDEX IF NOT EXISTS idx_item_master ON resume_item(master_id);
CREATE INDEX IF NOT EXISTS idx_variant_item ON item_variant(item_id);
CREATE INDEX IF NOT EXISTS idx_sel_resume ON resume_selection(resume_id);
CREATE INDEX IF NOT EXISTS idx_extra_resume ON resume_extra(resume_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id);
