<script setup lang="ts">
// 广告位 CRUD
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { admin } from '@/api/modules/admin'

const rows = ref<any[]>([])
const editOpen = ref(false)
const editing = ref<Record<string, any>>({})

async function load() {
  const res = await admin.adSpaces()
  if (res?.code === 200) rows.value = res.data || []
}
onMounted(load)

function openEdit(s: any) {
  editing.value = { ...s }
  editOpen.value = true
}
async function save() {
  const res = await admin.adSpaceSave(editing.value)
  if (res?.code === 200) {
    ElMessage.success('已保存')
    editOpen.value = false
    load()
  }
}
async function del(s: any) {
  await ElMessageBox.confirm(`删除广告位「${s.name}」？其下广告一并删除。`, '删除', {
    type: 'warning'
  })
  const res = await admin.adSpaceDelete(s.code)
  if (res?.code === 200) {
    ElMessage.success('已删除')
    load()
  }
}
</script>

<template>
  <div class="panel">
    <div class="bar"><el-button type="success" @click="openEdit({})">新建广告位</el-button></div>
    <el-table :data="rows" size="small">
      <el-table-column prop="code" label="编码" width="180" />
      <el-table-column prop="name" label="名称" min-width="160" />
      <el-table-column prop="position" label="位置" min-width="140" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <el-dialog v-model="editOpen" title="广告位" width="440px">
    <el-form label-width="90px">
      <el-form-item label="编码"
        ><el-input v-model="editing.code" :disabled="!!editing._exists"
      /></el-form-item>
      <el-form-item label="名称"><el-input v-model="editing.name" /></el-form-item>
      <el-form-item label="位置"
        ><el-input v-model="editing.position" placeholder="如：首页右侧栏 / 模板中心顶部"
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
  justify-content: flex-end;
  margin-bottom: 14px;
}
</style>
