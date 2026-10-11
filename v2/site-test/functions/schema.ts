// Drizzle schema — v2 六表（对齐 migrations/0015_v2.sql）
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

export const masterResume = sqliteTable('master_resume', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull().default('我的大简历'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const resumeItem = sqliteTable('resume_item', {
  id: text('id').primaryKey(),
  masterId: text('master_id').notNull(),
  section: text('section').notNull(),
  title: text('title').notNull(),
  sort: integer('sort').notNull().default(0),
  metaJson: text('meta_json').notNull().default('{}'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const itemVariant = sqliteTable('item_variant', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull(),
  label: text('label').notNull().default('默认'),
  contentMd: text('content_md').notNull(),
  createdAt: integer('created_at').notNull(),
})

export const resume = sqliteTable('resume', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  masterId: text('master_id'),
  templateId: text('template_id').notNull(),
  title: text('title').notNull().default(''),
  targetJd: text('target_jd').notNull().default(''),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export const resumeSelection = sqliteTable('resume_selection', {
  resumeId: text('resume_id').notNull(),
  itemId: text('item_id').notNull(),
  variantId: text('variant_id'),
  ord: integer('ord').notNull().default(0),
  overridesJson: text('overrides_json').notNull().default('{}'),
}, t => [primaryKey({ columns: [t.resumeId, t.itemId] })])

export const resumeExtra = sqliteTable('resume_extra', {
  resumeId: text('resume_id').notNull(),
  fieldKey: text('field_key').notNull(),
  valueMd: text('value_md').notNull().default(''),
}, t => [primaryKey({ columns: [t.resumeId, t.fieldKey] })])

// v1 users 表（只读引用，认证用）
export const users = sqliteTable('users', {
  username: text('username').primaryKey(),
  passwordHash: text('password_hash'),
  salt: text('salt'),
})
