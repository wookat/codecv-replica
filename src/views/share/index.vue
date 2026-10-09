<script setup lang="ts">
import { mdContentKey } from '@/common/storageKeys'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { allOverlaysHTML, convertDOM } from '@/utils/moduleCombine'
import { templates } from '@/templates/config'
import { applyTemplateTheme, importCSS } from '@/utils'
import { createComment, getShare, listComments, shareView } from '@/api/modules/share'

const route = useRoute()
const html = ref('')
const name = ref('')
const type = ref('')
const viewNum = ref(0)
const shareId = ref('')

interface CommentRow {
  id: number
  nickname: string
  content: string
  created_at: number
}
const comments = ref<CommentRow[]>([])
const draft = ref('')
const posting = ref(false)
const cmtMsg = ref('')

async function loadComments() {
  if (!shareId.value) return
  const res = await listComments(`share-${shareId.value}`)
  if (res?.code === 200) comments.value = res.data || []
}

async function sendComment() {
  const content = draft.value.trim()
  if (!content) return
  posting.value = true
  cmtMsg.value = ''
  const res = await createComment(`share-${shareId.value}`, content)
  posting.value = false
  if (res?.code === 200) {
    draft.value = ''
    loadComments()
  } else if (res?.code === 401) {
    cmtMsg.value = '请先登录后再评论'
  } else {
    cmtMsg.value = res?.msg || '评论失败'
  }
}

function fmtTime(ts: number) {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes()
  )}`
}

const SHARE_KEY = 'codecv-share'

function render(type_: string, name_: string, md: string) {
  type.value = type_
  name.value = name_
  importCSS(type_)
  applyTemplateTheme(type_)
  html.value = convertDOM(md).innerHTML + allOverlaysHTML(type_)
}

onMounted(async () => {
  const id = route.params.id as string
  shareId.value = id
  loadComments()
  // 公开简历分享：/share/<resume_type> 实时内容 + 被查看计数（对照生产 cv.share/view）
  try {
    const res = await shareView(id)
    if (res?.code === 200 && res.data?.content) {
      viewNum.value = res.data.viewNum || 0
      render(res.data.type || id, res.data.name, res.data.content)
      return
    }
  } catch {
    /* 非公开简历回落快照分享 */
  }
  try {
    const res = await getShare(id)
    if (res?.code === 200 && res.data?.content) {
      render(res.data.type, res.data.name, res.data.content)
      return
    }
  } catch {
    /* 服务端失败回落本地 */
  }
  // 本地兜底：同机浏览器生成的分享仍可读
  const reg: Record<string, { type: string; name: string }> = JSON.parse(
    localStorage.getItem(SHARE_KEY) || '{}'
  )
  const s = reg[id]
  if (!s) return
  const raw = localStorage.getItem(mdContentKey(s.type))
  const md = raw ? JSON.parse(raw).value ?? '' : ''
  if (md) render(s.type, s.name, md)
})

const tpl = computed(() => templates.value.find(t => t.type === type.value))
</script>

<template>
  <div class="sh-page">
    <div v-if="html" class="sh-wrap">
      <div class="sh-head">
        <h1>
          {{ name || tpl?.name || '分享的简历' }}
          <span v-if="viewNum" class="view-num">已被查看 {{ viewNum }} 次</span>
        </h1>
        <router-link :to="`/editor/${type}`" class="sh-btn">用同款模板</router-link>
      </div>
      <div class="cv-preview markdown-transform-html jufe" v-html="html"></div>
      <section class="sh-comments">
        <h3>评论（{{ comments.length }}）</h3>
        <ul v-if="comments.length" class="cmt-list">
          <li v-for="c in comments" :key="c.id">
            <b>{{ c.nickname }}</b>
            <span class="cmt-time">{{ fmtTime(c.created_at) }}</span>
            <p>{{ c.content }}</p>
          </li>
        </ul>
        <p v-else class="cmt-none">还没有评论，来抢沙发</p>
        <div class="cmt-box">
          <textarea v-model="draft" maxlength="500" placeholder="说点什么…（登录后可评论）" />
          <button class="sh-btn" :disabled="posting" @click="sendComment">
            {{ posting ? '发送中…' : '发表评论' }}
          </button>
        </div>
        <p v-if="cmtMsg" class="cmt-msg">{{ cmtMsg }}</p>
      </section>
    </div>
    <div v-else class="sh-empty">
      <h2>分享不存在或已过期</h2>
      <router-link to="/jianlimoban" class="sh-btn">去模板中心</router-link>
    </div>
  </div>
</template>

<style lang="scss">
.sh-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
.sh-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--font-color);
    .view-num {
      font-size: 12px;
      font-weight: 400;
      color: #909399;
      margin-left: 10px;
    }
  }
}
.sh-btn {
  display: inline-flex;
  border-radius: 999px;
  background: var(--theme);
  color: #fff;
  font-size: 13px;
  padding: 9px 20px;
  text-decoration: none;
}
.cv-preview {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
.sh-empty {
  text-align: center;
  padding: 80px 20px;
  h2 {
    color: var(--font-color);
    margin-bottom: 24px;
  }
}
</style>
