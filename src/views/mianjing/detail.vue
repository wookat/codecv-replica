<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  mianjingDetail,
  mianjingList,
  mianjingMeta,
  MianjingCompany,
  MianjingItem
} from '@/api/modules/site'
import {
  engagementComment,
  engagementCommentDelete,
  engagementComments,
  engagementReaction,
  engagementState,
  EngageComment
} from '@/api/modules/engagement'
import { extractToc, localAsset, logoColor, renderArticle, TocItem } from '@/utils/article'
import { currentUser } from '@/utils/auth'
import { fmtCN } from '@/utils/time'
import LoginModal from '@/components/LoginModal.vue'
import { fetchUserInfo } from '@/api/modules/cloudResume'

const route = useRoute()
const doc = ref<MianjingItem | null>(null)
const company = ref<MianjingCompany | null>(null)
const hotList = ref<MianjingItem[]>([])
const toc = ref<TocItem[]>([])
const html = ref('')
const loading = ref(true)
const progress = ref(0)
// 点赞/收藏 → 真实 engagement 后端（对齐生产 like-count/fav-count/已收藏提示）
const liked = ref(false)
const fav = ref(false)
const likeCount = ref(0)
const commentCount = ref(0)

async function toggleReact(kind: 'like' | 'fav') {
  if (!currentUser()) {
    loginModal.value = true
    return
  }
  const res = await engagementReaction('mianjing', docId.value, kind)
  if (!res) return ElMessage.error('操作失败，请重试')
  if (kind === 'like') liked.value = res.active
  else {
    fav.value = res.active
    ElMessage.success(res.active ? '已收藏，可在「我的面经-我的收藏」查看' : '已取消收藏')
  }
  likeCount.value = res.likeCount
  commentCount.value = res.commentCount
}

// ---- 评论区（生产同款：快捷回复/回复/删除） ----
type Cmt = EngageComment
const comments = ref<Cmt[]>([])
const cmtDraft = ref('')
const cmtPosting = ref(false)
const replyTo = ref<Cmt | null>(null)
const myUid = ref(0)
const loginModal = ref(false)
const docId = computed(() => String(route.params.docId))

const QUICK = [
  '感谢分享，收藏了！',
  '同批投递，沾沾好运',
  '题目很全，马住慢慢看',
  '求后续结果，蹲一个'
]
const quick = (t: string) => (cmtDraft.value = t)

const cmtFmt = (ts: number) => fmtCN(ts, true)

async function loadComments() {
  comments.value = await engagementComments('mianjing', docId.value)
  commentCount.value = comments.value.length
}

async function postComment() {
  const text = cmtDraft.value.trim()
  if (!text) return ElMessage.warning('先写点内容吧')
  if (!currentUser()) {
    loginModal.value = true
    return
  }
  cmtPosting.value = true
  try {
    const res = await engagementComment('mianjing', docId.value, text, replyTo.value?.id || 0)
    if (res?.code === 401) {
      loginModal.value = true
      return
    }
    if (res?.code !== 200) return ElMessage.error(res?.msg || '评论失败')
    cmtDraft.value = ''
    replyTo.value = null
    ElMessage.success('评论成功')
    await loadComments()
  } finally {
    cmtPosting.value = false
  }
}

async function delComment(c: Cmt) {
  const res = await engagementCommentDelete(c.id)
  if (res.code === 200) {
    ElMessage.success('评论已删除')
    loadComments()
  } else ElMessage.error(res.msg || '删除失败')
}

function gotoComments() {
  document.getElementById('mj-comments')?.scrollIntoView({ behavior: 'smooth' })
}

const batchLabel = computed(() => {
  const m = doc.value
  if (!m) return ''
  const g = m.grade ? `${String(m.grade).slice(2)}届` : ''
  const b =
    { qiuzhao: '秋招', chunzhao: '春招', shuqi: '暑期实习', richang: '日常实习', shezhao: '社招' }[
      m.batch as string
    ] ?? m.batch
  return `${g}${b}`
})

const readMins = computed(() => Math.max(1, Math.round((doc.value?.contentMd?.length ?? 0) / 500)))

const AV_FILE: Record<number, string> = {
  1: 'avatar1-155VfYeO.png',
  6: 'avatar6-CPIstjYR.png'
}
const authorAvatar = computed(() => {
  const av = doc.value?.author?.av
  const f = (av && AV_FILE[av]) || (av ? `avatar${av}.png` : 'avatar1-155VfYeO.png')
  return `/prod-assets/${f}`
})

const publishLabel = computed(() => (doc.value?.publishTime ? fmtCN(doc.value.publishTime) : ''))

function onScroll() {
  const el = document.documentElement
  const h = el.scrollHeight - el.clientHeight
  progress.value = h > 0 ? Math.min(1, el.scrollTop / h) : 0
}

function toComments() {
  document.getElementById('mj-comments')?.scrollIntoView({ behavior: 'smooth' })
}
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function copyLink() {
  navigator.clipboard?.writeText(location.href).then(() => ElMessage.success('链接已复制'))
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  const id = route.params.docId as string
  try {
    const res = await mianjingDetail(id)
    doc.value = res?.data ?? null
    if (doc.value?.title && route.name === 'mianjing-detail')
      document.title = `${doc.value.title} - CodeCV简历`
    if (doc.value?.contentMd) {
      html.value = renderArticle(doc.value.contentMd as string)
      toc.value = extractToc(doc.value.contentMd as string)
    }
    const companySlug = doc.value?.companySlug
    if (companySlug) {
      const cs = await mianjingMeta('companies')
      company.value = (cs?.data ?? []).find((c: MianjingCompany) => c.slug === companySlug) ?? null
    }
    mianjingList({ pageSize: 60 })
      .then(lr => {
        hotList.value = (lr?.data ?? [])
          .filter((x: MianjingItem) => x._id !== doc.value?._id)
          .sort((a: MianjingItem, b: MianjingItem) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
          .slice(0, 6)
      })
      .catch((e: unknown) => console.warn('获取最热面经失败:', e))
    loadComments()
    engagementState('mianjing', docId.value).then(s => {
      if (s) {
        liked.value = s.liked
        fav.value = s.faved
        likeCount.value = s.likeCount
        commentCount.value = s.commentCount
      }
    })
    fetchUserInfo().then(info => {
      if (info) myUid.value = info.uid
    })
  } catch (e) {
    console.error('获取面经详情失败:', e)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="mj-page mj-detail">
    <div class="read-progress" :style="{ transform: `scaleX(${progress})` }"></div>

    <div class="dock">
      <button
        class="dock-btn"
        :class="{ on: liked }"
        aria-label="点赞"
        @click="toggleReact('like')"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"
          />
          <path d="M7 10v12" />
        </svg>
        <span v-if="likeCount" class="dock-cnt">{{ likeCount }}</span>
      </button>
      <button class="dock-btn" aria-label="评论" @click="gotoComments">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
          />
        </svg>
      </button>
      <button class="dock-btn" aria-label="收藏" :class="{ on: fav }" @click="toggleReact('fav')">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
          />
        </svg>
      </button>
      <button class="dock-btn" aria-label="复制链接分享" @click="copyLink">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
          <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
        </svg>
      </button>
    </div>

    <div v-loading="loading">
      <template v-if="doc">
        <nav class="crumb" aria-label="面包屑">
          <router-link to="/mianjing">面经</router-link>
          <svg
            class="sep"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <router-link :to="`/mianjing/c/${doc.companySlug}`">{{ doc.companyName }}</router-link>
          <svg
            class="sep"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span>{{ batchLabel }}</span>
          <svg
            class="sep"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span>{{ doc.positionName }}</span>
        </nav>

        <div class="mj-main">
          <article class="flex-1 min-w-0">
            <div class="d-card">
              <div class="author-card">
                <img :src="authorAvatar" alt="" loading="lazy" />
                <div class="flex-1 min-w-0">
                  <p class="an">{{ doc.author?.nickName || '匿名投稿' }}</p>
                  <p class="am">
                    发布于 {{ publishLabel }}
                    <template v-if="doc.author?.school"> · {{ doc.author.school }}</template>
                    <template v-if="doc.author?.major"> · {{ doc.author.major }}</template>
                  </p>
                </div>
              </div>

              <h1 class="d-title">{{ doc.title }}</h1>

              <div class="meta-strip">
                <span class="mj-chip mj-chip--amber">{{ doc.result }}</span>
                <span
                  ><span class="mlabel">批次</span
                  ><router-link
                    class="mlink"
                    :to="`/mianjing/c/${doc.companySlug}/${doc.batch}-${doc.grade}`"
                    >{{ batchLabel }}</router-link
                  ></span
                >
                <span
                  ><span class="mlabel">岗位</span
                  ><router-link class="mlink" :to="`/mianjing?position=${doc.positionSlug}`">{{
                    doc.positionName
                  }}</router-link></span
                >
                <span
                  ><span class="mlabel">轮次</span><span class="mlink">{{ doc.round }}</span></span
                >
                <span class="tail"
                  >{{ doc.questionCount ?? '—' }} 道真题 · 约 {{ readMins }} 分钟读完</span
                >
              </div>

              <details v-if="toc.length" class="mtoc">
                <summary>
                  <svg
                    class="ic"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M8 5h13" />
                    <path d="M13 12h8" />
                    <path d="M13 19h8" />
                    <path d="M3 10a2 2 0 0 0 2 2h3" />
                    <path d="M3 5v12a2 2 0 0 0 2 2h3" />
                  </svg>
                  <span>本篇目录（{{ toc.length }} 节）</span>
                </summary>
                <div class="mtoc-list">
                  <button
                    v-for="t in toc"
                    :key="t.id"
                    class="toc-item"
                    :class="{ h3: t.level === 3 }"
                    @click="scrollTo(t.id)"
                  >
                    {{ t.text }}
                  </button>
                </div>
              </details>

              <div class="mj-article" v-html="html"></div>

              <!-- 互动条（生产同款：文章末 有用/收藏/评论/分享 + 浏览数） -->
              <div class="mj-react-bar">
                <button class="mj-react" :class="{ on: liked }" @click="toggleReact('like')">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"
                    />
                    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                  有用<template v-if="likeCount"> {{ likeCount }}</template>
                </button>
                <button class="mj-react" :class="{ on: fav }" @click="toggleReact('fav')">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  收藏
                </button>
                <button class="mj-react" @click="toComments">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                    />
                  </svg>
                  评论
                </button>
                <button class="mj-react" @click="copyLink">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <path d="m16 6-4-4-4 4" />
                    <path d="M12 2v13" />
                  </svg>
                  分享
                </button>
                <span class="mj-views">{{ doc?.viewCount ?? 0 }} 次浏览</span>
              </div>

              <!-- 评论区（生产：评论在文章卡内、透明容器） -->
              <section id="mj-comments" class="cmt-card">
                <div class="cmt-head">
                  <h2 class="cmt-title">全部评论</h2>
                  <div class="cmt-tabs">
                    <button class="on">推荐</button>
                    <button>最新</button>
                  </div>
                </div>
                <div class="cmt-input">
                  <div class="cmt-quick">
                    <span class="q-label">快捷回复</span>
                    <button v-for="q in QUICK" :key="q" class="q-chip" @click="quick(q)">
                      {{ q }}
                    </button>
                  </div>
                  <div v-if="replyTo" class="cmt-replying">
                    回复 {{ replyTo.nickname }}：{{ replyTo.content.slice(0, 30) }}
                    <span class="cancel" @click="replyTo = null">取消回复</span>
                  </div>
                  <div class="cmt-edit">
                    <img class="cmt-av" src="/prod-assets/avatar1-155VfYeO.png" alt="" />
                    <div class="cmt-main">
                      <textarea
                        v-model="cmtDraft"
                        maxlength="500"
                        :placeholder="
                          replyTo ? `回复 ${replyTo.nickname}…` : '写下你的看法、补充或提问…'
                        "
                      ></textarea>
                    </div>
                  </div>
                  <div class="cmt-bar">
                    <span class="cmt-hint">{{ cmtDraft.length }}/500</span>
                    <button class="mj-btn sm" :disabled="cmtPosting" @click="postComment">
                      {{ cmtPosting ? '发布中…' : '评论' }}
                    </button>
                  </div>
                </div>
                <ul v-if="comments.length" class="cmt-list">
                  <li v-for="c in comments" :key="c.id">
                    <img
                      :src="`/prod-assets/${
                        AV_FILE[((c.id ?? 0) % 6) + 1] ??
                        'avatar' + (((c.id ?? 0) % 6) + 1) + '.png'
                      }`"
                      class="c-av-img"
                      alt=""
                    />
                    <div class="c-body">
                      <p class="c-meta">
                        <b>{{ c.nickname || '匿名用户' }}</b>
                        <time>{{ cmtFmt(c.created_at) }}</time>
                        <button class="c-op" @click="replyTo = c">回复</button>
                        <button
                          v-if="c.user_id === myUid"
                          class="c-op danger"
                          @click="delComment(c)"
                        >
                          删除
                        </button>
                      </p>
                      <p v-if="c.parent_id" class="c-quote">
                        回复 {{ c.parent_nickname }}：{{ (c.parent_content || '').slice(0, 50) }}
                      </p>
                      <p class="c-text">{{ c.content }}</p>
                    </div>
                  </li>
                </ul>
                <div v-else class="cmt-empty-box">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                    />
                  </svg>
                  <p class="cmt-empty">还没有评论，来抢沙发～</p>
                </div>
              </section>
            </div>

            <!-- 底部CTA（生产同款） -->
            <div class="d-card cta-card">
              <div class="cta-text">
                <h3>面试稳了，简历也得过硬</h3>
                <p>专业模板 + AI 润色，拒绝花里胡哨，快速产出一份能过筛的简历</p>
              </div>
              <div class="cta-btns">
                <router-link to="/edit/new" class="mj-btn">去做简历</router-link>
                <router-link to="/mianjing/write" class="mj-btn ghost">分享面经</router-link>
              </div>
            </div>
          </article>

          <aside class="mj-aside">
            <div v-if="company" class="aside-card">
              <router-link :to="`/mianjing/c/${company.slug}`" class="comp-card">
                <span
                  class="mj-logo lg"
                  :style="{ '--mj-logo-bg': logoColor(company.slug) } as any"
                >
                  <img
                    v-if="company.logo"
                    :src="localAsset(company.logo)"
                    :alt="company.name"
                    class="mj-logo-img"
                  />
                  <template v-else>{{ company.name[0] }}</template>
                </span>
                <span>
                  <b>{{ company.name }}</b>
                  <p class="cc-sub">面经合集</p>
                </span>
              </router-link>
              <router-link :to="`/mianjing/c/${company.slug}`" class="comp-btn"
                >查看该公司全部面经</router-link
              >
            </div>
            <div v-if="toc.length" class="aside-card toc-card">
              <strong class="aside-title">目录</strong>
              <a
                v-for="t in toc"
                :key="t.id"
                class="toc-item"
                :class="{ h3: t.level === 3 }"
                @click="scrollTo(t.id)"
                >{{ t.text }}</a
              >
            </div>
            <div v-if="doc.related?.length" class="aside-card">
              <strong class="aside-title">相关面经</strong>
              <router-link
                v-for="r in doc.related"
                :key="r._id"
                :to="`/mianjing/p/${r._id}`"
                class="hot-row"
              >
                <span class="t">{{ r.title }}</span>
                <span class="v">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {{ r.viewCount ?? 0 }}
                </span>
              </router-link>
            </div>
            <div v-if="hotList.length" class="aside-card">
              <strong class="aside-title">最热面经</strong>
              <router-link
                v-for="(r, i) in hotList"
                :key="r._id"
                :to="`/mianjing/p/${r._id}`"
                class="hot-row"
              >
                <span class="rank" :class="{ top: i < 3 }">{{ i + 1 }}</span>
                <span class="t">{{ r.title }}</span>
                <span class="v">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {{ r.viewCount ?? 0 }}
                </span>
              </router-link>
            </div>
          </aside>
        </div>
      </template>
      <el-empty v-else-if="!loading" description="面经不存在或已删除" />
    </div>
    <LoginModal v-if="loginModal" @close="loginModal = false" />
  </div>
</template>

<style lang="scss">
@import './mianjing.scss';

.mtoc {
  margin-top: 20px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
  summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    font-size: 13px;
    cursor: pointer;
    list-style: none;
    &::-webkit-details-marker {
      display: none;
    }
    .ic {
      width: 16px;
      height: 16px;
    }
  }
  .mtoc-list {
    padding: 0 12px 12px;
    .toc-item {
      display: block;
      width: 100%;
      text-align: left;
      border: none;
      background: transparent;
      padding: 5px 10px 5px 28px;
      font-size: 13px;
      color: var(--font-color);
      opacity: 0.65;
      cursor: pointer;
      border-radius: 8px;
      &.h3 {
        padding-left: 44px;
      }
      &:hover {
        color: var(--theme);
        opacity: 1;
      }
    }
  }
  @media (min-width: 1024px) {
    display: none;
  }
}
.comp-card {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--font-color);
  .cc-sub {
    font-size: 12px;
    opacity: 0.5;
    margin-top: 2px;
  }
}
.comp-btn {
  display: block;
  margin-top: 14px;
  padding: 10px 0;
  border-radius: 999px;
  background: rgba(255, 107, 53, 0.12);
  color: var(--theme);
  font-size: 14px;
  text-align: center;
  text-decoration: none;
  &:hover {
    background: var(--theme);
    color: #fff;
  }
}
.cmt-card {
  margin-top: 48px;
  .cmt-head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    height: 32px;
    margin: 0;
  }
  .cmt-tabs {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 2px;
    border-radius: 999px;
    padding: 4px;
    background: rgba(0, 0, 0, 0.05);
    button {
      border: none;
      padding: 4px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 500;
      color: var(--font-color);
      opacity: 0.6;
      background: transparent;
      cursor: pointer;
      &:hover {
        opacity: 1;
      }
      &.on {
        background: var(--background);
        color: var(--theme);
        opacity: 1;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }
    }
  }
  .cmt-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }
  .mj-react-bar {
    margin-top: 36px;
    display: flex;
    align-items: center;
    height: 36px;
    .mj-react {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 12px;
      border: none;
      border-radius: 999px;
      background: transparent;
      font-size: 14px;
      color: var(--font-color);
      cursor: pointer;
      svg {
        width: 16px;
        height: 16px;
      }
      &:hover {
        color: var(--theme);
        background: rgba(255, 107, 53, 0.08);
      }
      &.on {
        color: var(--theme);
      }
    }
    .mj-views {
      margin-left: auto;
      font-size: 12px;
      opacity: 0.5;
    }
  }
  .cmt-input {
    margin-top: 20px;
    padding: 20px;
    border-radius: 16px;
    background: var(--body-background);
    .cmt-edit {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      margin-top: 12px;
    }
    .cmt-av {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      flex-shrink: 0;
      object-fit: cover;
    }
    .cmt-main {
      flex: 1;
      min-width: 0;
    }
    .cmt-quick {
      margin-top: 0;
    }
  }
  .cmt-input textarea {
    height: 84px;
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: var(--body-background);
    color: var(--font-color);
    font-size: 14px;
    line-height: 1.7;
    outline: none;
    resize: vertical;
    box-sizing: border-box;
    &:focus {
      border-color: var(--theme);
    }
  }
  .cmt-bar {
    margin-top: 6px;
    height: 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .cmt-hint {
      font-size: 12px;
      opacity: 0.45;
    }
    .mj-btn.sm {
      padding: 7px 18px;
      font-size: 13px;
    }
  }
  .cmt-list {
    list-style: none;
    padding: 0;
    margin: 18px 0 0;
    li {
      display: flex;
      gap: 10px;
      padding: 12px 0;
      border-top: 1px solid rgba(0, 0, 0, 0.06);
    }
    .c-av-img {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      flex-shrink: 0;
    }
    .c-av {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
      border-radius: 999px;
      background: rgba(255, 107, 53, 0.14);
      color: var(--theme);
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .c-meta {
      display: flex;
      align-items: baseline;
      gap: 10px;
      font-size: 13px;
      time {
        font-size: 12px;
        opacity: 0.45;
      }
    }
    .c-text {
      margin-top: 4px;
      font-size: 14px;
      line-height: 1.7;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
  .cmt-empty-box {
    margin-top: 28px;
    height: 149px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    svg {
      width: 40px;
      height: 40px;
      color: #c0c4cc;
    }
  }
  .cmt-empty {
    margin: 0;
    font-size: 13px;
    opacity: 0.45;
    text-align: center;
  }
}
.cta-card {
  margin-top: 40px;
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
  box-sizing: border-box;
  height: 81px;
  padding: 0 20px;
  .cta-text {
    flex: 1;
    min-width: 0;
  }
  h3 {
    margin: 0;
    font-size: 15px;
    line-height: 21px;
  }
  p {
    margin: 4px 0 0;
    font-size: 12px;
    line-height: 16px;
    color: #6b7280;
  }
  .cta-btns {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
    .mj-btn.ghost {
      background: transparent;
      color: var(--theme);
      border: 1px solid var(--theme);
    }
  }
}
.dock-btn {
  position: relative;
}
.dock-cnt {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--theme);
  color: #fff;
  font-size: 10px;
  line-height: 16px;
  padding: 0 4px;
  text-align: center;
}
.cmt-quick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 40px;
  height: 25px;
  .q-label {
    font-size: 13px;
    color: #1e293b;
    margin-right: 4px;
  }
  .q-chip {
    border: 1px solid #e2e4e9;
    background: #fff;
    border-radius: 999px;
    padding: 0 14px;
    height: 25px;
    font-size: 12px;
    cursor: pointer;
    color: var(--font-color);
    &:hover {
      border-color: var(--theme);
      color: var(--theme);
    }
  }
}
.cmt-replying {
  font-size: 12px;
  color: #909399;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  .cancel {
    color: var(--theme);
    cursor: pointer;
    margin-left: 8px;
  }
}
.c-op {
  border: none;
  background: none;
  color: #b5b8bf;
  font-size: 12px;
  cursor: pointer;
  padding: 0 4px;
  &:hover {
    color: var(--theme);
  }
  &.danger:hover {
    color: #f56c6c;
  }
}
.c-quote {
  font-size: 12px;
  color: #909399;
  background: rgba(0, 0, 0, 0.04);
  border-left: 3px solid #ddd;
  border-radius: 4px;
  padding: 6px 10px;
  margin: 6px 0;
}
</style>
