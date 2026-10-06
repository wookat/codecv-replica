<script setup lang="ts">
// /admin/post/add | /admin/post/edit/:id — 攻略编辑表单
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { admin } from '@/api/modules/admin'

const route = useRoute()
const router = useRouter()
const id = route.params.id ? String(route.params.id) : ''
const form = ref({
  title: '',
  cover: '',
  category: '',
  tags: '',
  summary: '',
  author: 'CodeCV',
  content_md: ''
})

onMounted(async () => {
  if (!id) return
  const res = await admin.postPage({ pageSize: 500 })
  const hit = res?.data?.list?.find((p: any) => p._id === id)
  if (hit) {
    const d = await fetch(`/api/post/detail?id=${encodeURIComponent(id)}`).then(r => r.json())
    form.value = {
      title: hit.title || '',
      cover: hit.cover || '',
      category: hit.category || '',
      tags: hit.tags || '',
      summary: hit.summary || '',
      author: hit.author || 'CodeCV',
      content_md: d?.data?.contentMd || hit.content_md || ''
    }
  }
})

async function save() {
  const res = id
    ? await admin.postEdit({ _id: id, ...form.value })
    : await admin.postAdd(form.value)
  if (res?.code === 200) {
    ElMessage.success(id ? '已保存' : '已发布')
    router.replace('/admin/post')
  } else ElMessage.error(res?.msg || '保存失败')
}
</script>

<template>
  <div class="panel">
    <el-form label-width="90px">
      <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
      <el-form-item label="封面图"
        ><el-input v-model="form.cover" placeholder="图片 URL 或 dataUrl"
      /></el-form-item>
      <el-form-item label="分类"
        ><el-input v-model="form.category" style="max-width: 240px"
      /></el-form-item>
      <el-form-item label="标签"
        ><el-input v-model="form.tags" placeholder="逗号分隔"
      /></el-form-item>
      <el-form-item label="摘要"
        ><el-input v-model="form.summary" type="textarea" :rows="3"
      /></el-form-item>
      <el-form-item label="作者"
        ><el-input v-model="form.author" style="max-width: 240px"
      /></el-form-item>
      <el-form-item label="正文 Markdown">
        <el-input
          v-model="form.content_md"
          type="textarea"
          :rows="18"
          style="font-family: monospace"
        />
      </el-form-item>
    </el-form>
    <div class="ops">
      <el-button @click="router.back()">返回</el-button>
      <el-button type="primary" @click="save">{{ id ? '保存' : '发布' }}</el-button>
    </div>
  </div>
</template>

<style scoped>
.panel {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}
.ops {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
