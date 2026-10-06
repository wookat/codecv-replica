<script setup lang="ts">
// 广告 CRUD：按广告位过滤
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { admin } from '@/api/modules/admin'
import { fmtTime } from './composables'

const rows = ref<any[]>([])
const spaces = ref<any[]>([])
const space = ref('')
const editOpen = ref(false)
const editing = ref<Record<string, any>>({})

async function load() {
  const res = await admin.adQuery(space.value || undefined)
  if (res?.code === 200) rows.value = res.data || []
}
onMounted(async () => {
  const res = await admin.adSpaces()
  if (res?.code === 200) spaces.value = res.data || []
  load()
})

function openEdit(a: any) {
  editing.value = { status: 1, sort: 0, ...a }
  editOpen.value = true
}
async function save() {
  const res = await admin.adSave(editing.value)
  if (res?.code === 200) {
    ElMessage.success('已保存')
    editOpen.value = false
    load()
  }
}
async function del(a: any) {
  await ElMessageBox.confirm(`删除广告「${a.title || a.id}」？`, '删除', { type: 'warning' })
  const res = await admin.adDelete(a.id)
  if (res?.code === 200) {
    ElMessage.success('已删除')
    load()
  }
}
function onImg(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  const r = new FileReader()
  r.onload = () => (editing.value.image = String(r.result))
  r.readAsDataURL(f)
}
</script>

<template>
  <div class="panel">
    <div class="bar">
      <el-select
        v-model="space"
        placeholder="全部广告位"
        clearable
        style="width: 200px"
        @change="load"
      >
        <el-option v-for="s in spaces" :key="s.code" :label="s.name" :value="s.code" />
      </el-select>
      <el-button type="success" @click="openEdit({})">新建广告</el-button>
    </div>
    <el-table :data="rows" size="small">
      <el-table-column label="图" width="90">
        <template #default="{ row }"
          ><img v-if="row.image" :src="row.image" class="img"
        /></template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="150" />
      <el-table-column prop="space" label="广告位" width="140" />
      <el-table-column prop="link" label="链接" min-width="160" show-overflow-tooltip />
      <el-table-column prop="sort" label="排序" width="70" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'info'" size="small">{{
            row.status ? '启用' : '停用'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建" width="160">
        <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <el-dialog v-model="editOpen" title="广告" width="480px">
    <el-form label-width="90px">
      <el-form-item label="广告位">
        <el-select v-model="editing.space" style="width: 220px">
          <el-option v-for="s in spaces" :key="s.code" :label="s.name" :value="s.code" />
        </el-select>
      </el-form-item>
      <el-form-item label="标题"><el-input v-model="editing.title" /></el-form-item>
      <el-form-item label="图片">
        <input type="file" accept="image/*" @change="onImg" />
        <img v-if="editing.image" :src="editing.image" class="img big" />
      </el-form-item>
      <el-form-item label="链接"
        ><el-input v-model="editing.link" placeholder="https://..."
      /></el-form-item>
      <el-form-item label="排序"><el-input-number v-model="editing.sort" :min="0" /></el-form-item>
      <el-form-item label="启用"
        ><el-switch v-model="editing.status" :active-value="1" :inactive-value="0"
      /></el-form-item>
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
  gap: 10px;
  margin-bottom: 14px;
}
.img {
  width: 60px;
  height: 36px;
  object-fit: cover;
  border-radius: 6px;
  &.big {
    display: block;
    width: 220px;
    height: auto;
    margin-top: 8px;
  }
}
</style>
