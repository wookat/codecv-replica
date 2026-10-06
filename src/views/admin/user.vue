<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { admin } from '@/api/modules/admin'
import { useAdminPage, fmtTime } from './composables'

const { rows, total, page, keyword, loading, load, search, changePage } = useAdminPage(
  admin.userPage
)

const editOpen = ref(false)
const editing = ref<Record<string, any>>({})
function openEdit(u: any) {
  editing.value = { ...u }
  editOpen.value = true
}
async function saveEdit() {
  const res = await admin.userEdit(editing.value)
  if (res?.code === 200) {
    ElMessage.success('已保存')
    editOpen.value = false
    load()
  } else ElMessage.error(res?.msg || '保存失败')
}
async function ban(u: any) {
  const { value } = await ElMessageBox.prompt('封禁原因', `封禁 ${u.username}`, {
    inputValue: ''
  })
  const res = await admin.userBan(u.uid, value || '')
  if (res?.code === 200) {
    ElMessage.success('已封禁')
    load()
  }
}
async function unban(u: any) {
  const res = await admin.userUnban(u.uid)
  if (res?.code === 200) {
    ElMessage.success('已解禁')
    load()
  }
}
async function del(u: any) {
  await ElMessageBox.confirm(`删除用户 ${u.username}？其简历数据将保留但不可登录。`, '删除', {
    type: 'warning'
  })
  const res = await admin.userDelete(u.uid)
  if (res?.code === 200) {
    ElMessage.success('已删除')
    load()
  }
}
</script>

<template>
  <div class="panel">
    <div class="bar">
      <el-input
        v-model="keyword"
        placeholder="搜索用户名/昵称"
        clearable
        style="width: 240px"
        @keyup.enter="search"
      />
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="uid" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="140" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column label="会员到期" width="170">
        <template #default="{ row }">{{ row.vipExpire ? fmtTime(row.vipExpire) : '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.banned" type="danger" size="small">已封禁</el-tag>
          <el-tag v-else-if="row.isAdmin" type="warning" size="small">管理员</el-tag>
          <el-tag v-else size="small" type="success">正常</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="170">
        <template #default="{ row }">{{ fmtTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="!row.banned" link type="warning" size="small" @click="ban(row)"
            >封禁</el-button
          >
          <el-button v-else link type="success" size="small" @click="unban(row)">解禁</el-button>
          <el-button link type="danger" size="small" @click="del(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      layout="total, prev, pager, next"
      :total="total"
      :page-size="20"
      :current-page="page"
      @current-change="changePage"
    />
  </div>

  <el-dialog v-model="editOpen" title="编辑用户" width="480px">
    <el-form label-width="90px">
      <el-form-item label="昵称"><el-input v-model="editing.nickname" /></el-form-item>
      <el-form-item label="学校"><el-input v-model="editing.school" /></el-form-item>
      <el-form-item label="专业"><el-input v-model="editing.professional" /></el-form-item>
      <el-form-item label="届别"><el-input v-model="editing.graduation" /></el-form-item>
      <el-form-item label="会员到期">
        <el-date-picker
          v-model="editing.vipExpire"
          type="datetime"
          value-format="x"
          placeholder="留空表示非会员"
        />
      </el-form-item>
      <el-form-item label="管理员"
        ><el-switch v-model="editing.isAdmin" :active-value="1" :inactive-value="0"
      /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editOpen = false">取消</el-button>
      <el-button type="primary" @click="saveEdit">保存</el-button>
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
.el-pagination {
  margin-top: 14px;
  justify-content: flex-end;
}
</style>
