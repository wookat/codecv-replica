<script setup lang="ts">
// /admin/resume/:id — 简历内容编辑（name/md/style）
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { admin } from '@/api/modules/admin'

const route = useRoute()
const router = useRouter()
const id = String(route.params.id)
const row = ref<Record<string, any>>({})
const loading = ref(true)

onMounted(async () => {
  const res = await admin.resumeGet(id)
  if (res?.code === 200) row.value = res.data
  loading.value = false
})
async function save() {
  const res = await admin.resumeEdit({
    id,
    name: row.value.name,
    md: row.value.md,
    style: row.value.style,
    is_public: row.value.is_public
  })
  if (res?.code === 200) ElMessage.success('已保存')
  else ElMessage.error(res?.msg || '保存失败')
}
</script>

<template>
  <div v-loading="loading" class="panel">
    <el-form label-width="90px">
      <el-form-item label="简历名"
        ><el-input v-model="row.name" style="max-width: 400px"
      /></el-form-item>
      <el-form-item label="模板 type"
        ><el-input v-model="row.resume_type" disabled style="max-width: 400px"
      /></el-form-item>
      <el-form-item label="公开分享"
        ><el-switch v-model="row.is_public" :active-value="1" :inactive-value="0"
      /></el-form-item>
      <el-form-item label="Markdown">
        <el-input v-model="row.md" type="textarea" :rows="18" style="font-family: monospace" />
      </el-form-item>
      <el-form-item label="Style">
        <el-input v-model="row.style" type="textarea" :rows="6" style="font-family: monospace" />
      </el-form-item>
    </el-form>
    <div class="ops">
      <el-button @click="router.back()">返回</el-button>
      <el-button type="primary" @click="save">保存</el-button>
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
