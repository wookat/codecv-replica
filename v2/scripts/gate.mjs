// Phase 0 三条验收门 = CI 硬门（每个 Phase 都过，不只验一回）
//   门1 未编辑 ≡ 原文（vitest serialize 不变量，114 模板）
//   门2 归一化渲染一致（mth(orig) == mth(canon) 114/114 零回归）
//   门3 编辑块无损（vitest normalizeChunk 套件）
// 用法: node scripts/gate.mjs   —— 任一门不过 exit 1
import { execSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REPO = join(ROOT, '..')
mkdirSync(join(ROOT, '.cache'), { recursive: true })
const esbuild = join(ROOT, 'node_modules/.bin/esbuild')
const run = (cmd) => { console.log(`$ ${cmd}`); execSync(cmd, { stdio: 'inherit', cwd: ROOT }) }

// mth 引擎打包（v1 预览引擎真身，.jufe DOM 是皮肤挂载点）
run(`${esbuild} ${join(REPO, 'v2/scripts/mth-entry.ts')} --bundle --format=esm --outfile=${join(ROOT, '.cache/mth-bundle.mjs')}`)
// serial 归一化器打包
run(`${esbuild} ${join(ROOT, 'web/src/core/serial/normalize.ts')} --bundle --format=esm --outfile=${join(ROOT, '.cache/v2-norm.mjs')}`)

// 门1+3: vitest 全套（不变量 + 编辑块）
run('npx vitest run --config vitest.config.ts')
// 门2: 渲染比对
run('node scripts/verify-render.mjs')
console.log('三道验收门全过')
