-- Phase 4: 简历 md 内容列——MCP/编辑器写回的整文 md（空 = 用 selections 现场合成）
ALTER TABLE resume ADD COLUMN content_md TEXT NOT NULL DEFAULT '';
