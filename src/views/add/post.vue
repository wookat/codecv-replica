<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const submitting = ref(false)
const f = reactive({
  title: '',
  description: '',
  cover: '',
  tags: '',
  contentMd: ''
})

const valid = computed(() => f.title.trim().length >= 5 && f.contentMd.trim().length >= 100)

async function submit() {
  if (!valid.value) return ElMessage.warning('标题至少 5 字、正文至少 100 字')
  submitting.value = true
  const list = JSON.parse(localStorage.getItem('codecv-my-posts') || '[]')
  list.unshift({
    _id: 'local-' + Date.now(),
    title: f.title,
    description: f.description,
    cover: f.cover,
    tags: f.tags.split(/[,，\s]+/).filter(Boolean),
    contentMd: f.contentMd,
    status: 'pending',
    create_time: Date.now()
  })
  localStorage.setItem('codecv-my-posts', JSON.stringify(list))
  setTimeout(() => router.replace('/add/success'), 300)
}
</script>

<template>
  <div class="ap-page">
    <h1 class="sr-only">投稿文章_求职攻略投稿_简历经验分享</h1>
    <div class="ap-card">
      <div class="ap-head">
        <h2>投稿攻略文章</h2>
        <p class="sub">分享你的求职攻略 / 简历经验，审核通过后展示在「求职攻略」板块</p>
      </div>
      <el-form label-position="top">
        <el-form-item label="文章标题" required>
          <el-input
            v-model="f.title"
            maxlength="40"
            show-word-limit
            placeholder="一句话讲清文章价值"
          />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input
            v-model="f.description"
            maxlength="120"
            show-word-limit
            placeholder="列表页展示的简介（可选）"
          />
        </el-form-item>
        <el-form-item label="封面图 URL">
          <el-input v-model="f.cover" placeholder="https://…（可选）" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="f.tags" placeholder="多个标签用空格分隔，如：简历 面试 秋招" />
        </el-form-item>
        <el-form-item label="正文（Markdown）" required>
          <el-input
            v-model="f.contentMd"
            type="textarea"
            :rows="14"
            placeholder="# 标题&#10;&#10;正文支持 Markdown 语法…"
          />
        </el-form-item>
        <div class="foot">
          <router-link to="/strategy" class="cancel">取消</router-link>
          <el-button type="primary" :loading="submitting" :disabled="!valid" @click="submit"
            >提交投稿</el-button
          >
        </div>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss">
.ap-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 20px;
  color: var(--font-color);
}
.ap-card {
  background: var(--background);
  border-radius: 16px;
  padding: 28px;
}
.ap-head {
  margin-bottom: 24px;
  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }
  .sub {
    margin-top: 6px;
    font-size: 13px;
    color: #9ca3af;
  }
}
.foot {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  align-items: center;
  .cancel {
    font-size: 14px;
    color: #9ca3af;
    text-decoration: none;
    &:hover {
      color: var(--font-color);
    }
  }
}
</style>
