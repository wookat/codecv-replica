<script setup lang="ts">
// 话题管理：topics 表 CRUD + 封面上传（dataUrl）
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { admin } from '@/api/modules/admin'

const topics = ref<any[]>([])
const editOpen = ref(false)
const editing = ref<Record<string, any>>({})

async function load() {
  // 话题列表从面经字典读（种子 ∪ mj_dict），加上 D1 topics 表的自有话题
  const res = await admin.mianjingDict()
  if (res?.code === 200) {
    topics.value = (res.data.topics || []).map((t: any) => ({
      ...t,
      _admin: false
    }))
  }
}
onMounted(load)

function openEdit(t: any) {
  editing.value = { ...t }
  editOpen.value = true
}
async function save() {
  const res = editing.value.slug
    ? await admin.mianjingSaveDict({
        kind: 'topic',
        slug: editing.value.slug,
        name: editing.value.name,
        logo: editing.value.cover || editing.value.logo || '',
        extra: JSON.stringify({ cover: editing.value.cover || '' })
      })
    : await admin.topicSave(editing.value)
  if (res?.code === 200) {
    ElMessage.success('已保存')
    editOpen.value = false
    load()
  }
}
function onCover(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  const r = new FileReader()
  r.onload = () => (editing.value.cover = String(r.result))
  r.readAsDataURL(f)
}
</script>

<template>
  <div class="panel">
    <div class="bar"><el-button type="success" @click="openEdit({})">新建话题</el-button></div>
    <el-table :data="topics" size="small">
      <el-table-column label="封面" width="80">
        <template #default="{ row }">
          <img v-if="row.cover || row.logo" :src="row.cover || row.logo" class="cov" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="话题名" min-width="160" />
      <el-table-column prop="slug" label="slug" width="160" />
      <el-table-column prop="count" label="文章数" width="90" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <el-dialog v-model="editOpen" title="编辑话题" width="480px">
    <el-form label-width="90px">
      <el-form-item label="名称"><el-input v-model="editing.name" /></el-form-item>
      <el-form-item v-if="!editing.slug" label="slug"
        ><el-input v-model="editing.slug"
      /></el-form-item>
      <el-form-item label="封面">
        <input type="file" accept="image/*" @change="onCover" />
        <img v-if="editing.cover" :src="editing.cover" class="cov big" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editOpen = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.panel {
  background: #fff;
  border-radius: 14px;
  padding: 16px 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}
.bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
}
.cov {
  width: 44px;
  height: 30px;
  object-fit: cover;
  border-radius: 6px;
  &.big {
    display: block;
    width: 160px;
    height: auto;
    margin-top: 8px;
  }
}
</style>
