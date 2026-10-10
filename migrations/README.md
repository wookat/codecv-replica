# D1 migrations

数据库：codecv-db（binding `DB`，见 wrangler.toml）。schema 变更一律新增编号文件，不改旧文件。

## 应用方式

```bash
wrangler d1 execute codecv-db --remote --file migrations/00XX_名称.sql
```

说明：本库在建 migrations/ 目录前已手工建表，未启用 `wrangler d1 migrations` 的
d1_migrations 跟踪表；新增文件继续按 execute --file 逐份应用，文件编号即历史。
迁移文件必须幂等（CREATE TABLE IF NOT EXISTS / ALTER 前自查列存在），可重跑。

当前最新：0013_favorites.sql
