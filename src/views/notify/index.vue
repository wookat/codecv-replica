<script setup lang="ts">
// 通知中心：站内通知列表 + 单条/全部已读
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Notice, notifyList, notifyRead } from '@/api/modules/notification'
import { currentUser } from '@/utils/auth'

const router = useRouter()
const list = ref<Notice[]>([])
const loading = ref(true)
const marking = ref(false)

const fmt = (ts: number) => new Date(ts).toLocaleString('zh-CN', { hour12: false })

async function load() {
  loading.value = true
  list.value = await notifyList()
  loading.value = false
}

async function open(n: Notice) {
  if (!n.is_read) {
    await notifyRead(n.id)
    n.is_read = 1
  }
  if (n.link) router.push(n.link)
}

async function readAll() {
  marking.value = true
  await notifyRead()
  list.value.forEach(n => (n.is_read = 1))
  marking.value = false
  ElMessage.success('已全部标记为已读')
}

onMounted(async () => {
  if (!currentUser()) {
    router.replace('/login')
    return
  }
  await load()
})
</script>

<template>
  <div class="notify-page">
    <div class="np-inner">
      <div class="np-head">
        <h1>通知中心</h1>
        <button v-if="list.some(n => !n.is_read)" class="mark" :disabled="marking" @click="readAll">
          全部已读
        </button>
      </div>
      <div v-loading="loading">
        <ul v-if="list.length" class="np-list">
          <li
            v-for="n in list"
            :key="n.id"
            class="np-item"
            :class="{ unread: !n.is_read, clickable: !!n.link }"
            @click="open(n)"
          >
            <span class="dot" v-if="!n.is_read"></span>
            <div class="np-body">
              <b>{{ n.title }}</b>
              <p v-if="n.content">{{ n.content }}</p>
              <time>{{ fmt(n.created_at) }}</time>
            </div>
            <span v-if="n.link" class="go">→</span>
          </li>
        </ul>
        <p v-else class="np-empty">暂无通知</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.notify-page {
  min-height: calc(100vh - 60px);
  background: var(--body-background);
  padding: 32px 20px 80px;
}
.np-inner {
  max-width: 720px;
  margin: 0 auto;
}
.np-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  h1 {
    font-size: 22px;
    font-weight: 700;
  }
  .mark {
    border: 1px solid var(--theme);
    color: var(--theme);
    background: none;
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 13px;
    cursor: pointer;
    &:hover {
      background: var(--theme);
      color: #fff;
    }
  }
}
.np-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.np-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--background);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 14px 18px;
  &.clickable {
    cursor: pointer;
    &:hover {
      border-color: var(--theme);
    }
  }
  &.unread {
    border-left: 3px solid var(--theme);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #f56c6c;
    margin-top: 8px;
    flex-shrink: 0;
  }
  .np-body {
    flex: 1;
    b {
      font-size: 14px;
    }
    p {
      font-size: 13px;
      color: #6b7280;
      margin: 4px 0;
      white-space: pre-wrap;
    }
    time {
      font-size: 12px;
      color: #b5b8bf;
    }
  }
  .go {
    color: #b5b8bf;
  }
}
.np-empty {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 80px 0;
}
</style>
