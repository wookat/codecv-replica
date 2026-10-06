<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { admin } from '@/api/modules/admin'
import { useAdminPage, fmtTime } from './composables'

const status = ref('')
const { rows, total, page, keyword, loading, load, search, changePage } = useAdminPage(p =>
  admin.mianjingPage({ ...p, status: status.value })
)

const editOpen = ref(false)
const editing = ref<Record<string, any>>({})
async function openEdit(m: any) {
  const res = await admin.mianjingGet(m.id)
  if (res?.code === 200) {
    editing.value = res.data
    editOpen.value = true
  }
}
async function saveEdit() {
  const f = { ...editing.value }
  delete f.username
  delete f.nickname
  const res = await admin.mianjingSave(f)
  if (res?.code === 200) {
    ElMessage.success('已保存')
    editOpen.value = false
    load()
  } else ElMessage.error(res?.msg || '保存失败')
}
async function review(m: any, st: string) {
  const res = await admin.mianjingReview(m.id, st)
  if (res?.code === 200) {
    ElMessage.success(st === 'approved' ? '已通过，前台可见' : '已驳回')
    load()
  }
}
</script>

<template>
  <div class="panel">
    <div class="bar">
      <el-input
        v-model="keyword"
        placeholder="搜索标题/公司"
        clearable
        style="width: 220px"
        @keyup.enter="search"
      />
      <el-select
        v-model="status"
        placeholder="全部状态"
        clearable
        style="width: 140px"
        @change="search"
      >
        <el-option label="待审核" value="pending" />
        <el-option label="已通过" value="approved" />
        <el-option label="已驳回" value="rejected" />
      </el-select>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="title" label="标题" min-width="200" />
      <el-table-column prop="company_name" label="公司" width="120" />
      <el-table-column label="轮次" width="90">
        <template #default="{ row }">{{ row.round }}</template>
      </el-table-column>
      <el-table-column label="作者" width="120">
        <template #default="{ row }">{{
          row.anonymous ? '匿名' : row.nickname || row.username
        }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag
            :type="
              row.status === 'approved'
                ? 'success'
                : row.status === 'rejected'
                ? 'danger'
                : 'warning'
            "
            size="small"
          >
            {{
              row.status === 'approved' ? '已通过' : row.status === 'rejected' ? '已驳回' : '待审核'
            }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="投稿时间" width="165">
        <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status !== 'approved'"
            link
            type="success"
            size="small"
            @click="review(row, 'approved')"
            >通过</el-button
          >
          <el-button
            v-if="row.status !== 'rejected'"
            link
            type="warning"
            size="small"
            @click="review(row, 'rejected')"
            >驳回</el-button
          >
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
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

  <el-dialog v-model="editOpen" title="编辑投稿" width="720px">
    <el-form label-width="90px">
      <el-form-item label="标题"><el-input v-model="editing.title" /></el-form-item>
      <el-form-item label="公司"
        ><el-input v-model="editing.company_name" style="max-width: 240px"
      /></el-form-item>
      <el-form-item label="轮次"
        ><el-input v-model="editing.round" style="max-width: 160px"
      /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="editing.status" style="width: 160px">
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
      </el-form-item>
      <el-form-item label="正文">
        <el-input
          v-model="editing.content_md"
          type="textarea"
          :rows="14"
          style="font-family: monospace"
        />
      </el-form-item>
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
