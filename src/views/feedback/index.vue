<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AsideRail from '@/components/AsideRail.vue'

interface FeedbackItem {
  content: string
  reply?: string
  avatar: string
  field: string
  time?: number | string
  mine?: boolean
}

const content = ref('')
const field = ref('')
const avatar = ref('/static/png/avatar1-155VfYeO.png')
const list = ref<FeedbackItem[]>([])
const current = ref(1)
const PAGE_SIZE = 6
const shown = computed(() =>
  list.value.slice((current.value - 1) * PAGE_SIZE, current.value * PAGE_SIZE)
)

const AVATARS = [
  '/static/png/avatar1-155VfYeO.png',
  '/static/png/avatar2-Dk7PWhs9.png',
  '/static/png/avatar3-CKCfc60R.png',
  '/static/png/avatar4-D4xNvzs7.png',
  '/static/png/avatar5-CkIdX3WU.png',
  '/static/png/avatar6-CPIstjYR.png'
]

const LOCAL_KEY = 'codecv-feedbacks'

onMounted(async () => {
  const local: FeedbackItem[] = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
  const seed: FeedbackItem[] =
    (await fetch('/seeds/feedbacks.json')
      .then(r => r.json())
      .catch(() => [])) ?? []
  list.value = [...local, ...seed]
})

function submit() {
  if (content.value.trim().length < 5) return ElMessage.warning('反馈内容至少 5 个字')
  const item: FeedbackItem = {
    content: content.value.trim(),
    field: field.value.trim() || '匿名',
    avatar: avatar.value,
    time: Date.now(),
    mine: true
  }
  const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
  local.unshift(item)
  localStorage.setItem(LOCAL_KEY, JSON.stringify(local))
  list.value.unshift(item)
  content.value = ''
  ElMessage.success('感谢反馈，我们会认真阅读')
}
</script>

<template>
  <div class="fb-page">
    <h1 class="sr-only">用户反馈_使用体验_产品建议_简历制作工具评价_用户评价</h1>
    <div class="feedback">
      <div class="feedback-main">
        <section class="edit">
          <textarea
            v-model="content"
            placeholder="您的意见是我们慢慢改进的关键～"
            maxlength="500"
            class="ta"
          ></textarea>
          <input
            v-model="field"
            type="text"
            maxlength="20"
            class="fi"
            placeholder="您属于什么专业领域"
          />
          <div class="avatars">
            <img
              v-for="a in AVATARS"
              :key="a"
              :src="a"
              alt="用户头像"
              :class="{ picked: avatar === a }"
              @click="avatar = a"
            />
          </div>
          <button class="submit" :disabled="!content.trim()" @click="submit">我要反馈</button>
        </section>

        <section class="mt-10 said">
          <h3>✨ 看看大家都说了什么</h3>
          <ul class="suggests">
            <li v-for="(f, i) in shown" :key="i">
              <p class="fc">{{ f.content }}</p>
              <p v-if="f.reply" class="fr">
                <sub>{{ f.reply }}</sub>
              </p>
              <p class="fu">
                <img :src="f.avatar" alt="评论用户头像" loading="lazy" />
                <sub>{{ f.field }}</sub>
                <sub>{{ f.mine ? '刚刚' : f.time }}</sub>
              </p>
            </li>
          </ul>
          <div v-if="list.length > PAGE_SIZE" class="fb-pager">
            <el-pagination
              v-model:current-page="current"
              :page-size="PAGE_SIZE"
              :pager-count="5"
              :total="list.length"
              background
              small
              layout="prev, pager, next"
            />
          </div>
        </section>
      </div>
      <AsideRail>
        <div class="qr-card">
          <p class="qr-title">问题反馈微信群</p>
          <img src="/prod-assets/feedback-qr.png" alt="问题反馈微信群" />
          <p class="qr-cap">有遇到问题可以加群反馈，客服24h在线</p>
        </div>
      </AsideRail>
    </div>
  </div>
</template>

<style lang="scss">
.fb-page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 20px 30px;
  color: var(--font-color);
}
.feedback {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.feedback-main {
  flex: 1;
  min-width: 0;
  background: var(--background);
  border-radius: 12px;
  padding: 20px 20px 52px;
}
.feedback > .rail-aside {
  width: 220px;
  @media (max-width: 900px) {
    display: none;
  }
}
.qr-card {
  background: var(--background);
  border-radius: 12px;
  padding: 14px;
  .qr-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--theme);
    margin: 0;
  }
  img {
    width: 100%;
    display: block;
    border-radius: 8px;
    margin-top: 8px;
  }
  .qr-cap {
    margin: 8px 0 0;
    font-size: 12px;
    color: #6b7280;
    text-align: center;
  }
}

.edit {
  .ta {
    display: block;
    width: 100%;
    min-height: 108px;
    border: none;
    border-radius: 6px;
    background: var(--body-background);
    padding: 12px;
    font-size: 14px;
    color: var(--writable-font-color);
    resize: none;
    outline: none;
    &:focus {
      outline: 2px solid var(--theme);
    }
  }
  .fi {
    margin-top: 14px;
    display: block;
    border: none;
    background: var(--body-background);
    color: var(--writable-font-color);
    padding: 12px;
    border-radius: 6px;
    font-size: 14px;
    outline: none;
    &:focus {
      outline: 2px solid var(--theme);
    }
  }
  .avatars {
    margin-top: 12px;
    img {
      width: 40px;
      height: 40px;
      border-radius: 999px;
      opacity: 0.6;
      margin-right: 20px;
      &:first-child {
        width: 44px;
        height: 44px;
      }
      cursor: pointer;
      transition: all 0.2s;
      &.picked,
      &:hover {
        opacity: 1;
        transform: scale(1.08);
      }
      &.picked {
        outline: 2px solid var(--theme);
      }
    }
  }
  .submit {
    margin-top: 12px;
    border: none;
    background: var(--theme);
    color: #fff;
    padding: 8px 14px;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    &:hover:not(:disabled) {
      opacity: 0.85;
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
.said {
  margin-top: 40px;
  h3 {
    font-size: 14px;
    margin: 0 0 24px 4px;
    font-weight: 500;
  }
}
.fb-pager {
  margin-top: 32px;
}
.suggests {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
  list-style: none;
  padding: 0;
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
  li {
    display: flex;
    flex-direction: column;
    background: var(--body-background);
    padding: 20px;
    border-radius: 12px;
  }
  .fc {
    flex: 1;
    font-size: 14px;
    line-height: 1.9;
    color: var(--writable-font-color);
    margin: 0;
  }
  .fr {
    margin: 8px 0 4px;
    sub {
      font-size: 12px;
      color: #3b82f6;
    }
  }
  .fu {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin: 8px 0 0;
    img {
      width: 40px;
    }
    sub {
      font-size: 12px;
      color: #9ca3af;
      margin-left: 6px;
    }
  }
}
</style>
