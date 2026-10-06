<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { admin } from '@/api/modules/admin'
import { useAdminPage } from './composables'

const router = useRouter()
const { rows, total, page, keyword, loading, load, search, changePage } = useAdminPage(
  admin.postPage
)

async function del(p: any) {
  await ElMessageBox.confirm(`删除攻略「${p.title}」？前台将立即不可见。`, '删除', {
    type: 'warning'
  })
  const res = await admin.postDelete(p._id)
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
        placeholder="搜索标题/分类"
        clearable
        style="width: 240px"
        @keyup.enter="search"
      />
      <el-button type="primary" @click="search">搜索</el-button>
      <el-button type="success" @click="router.push('/admin/post/add')">发布新攻略</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="title" label="标题" min-width="220" />
      <el-table-column prop="category" label="分类" width="110" />
      <el-table-column prop="tags" label="标签" min-width="140" />
      <el-table-column prop="status" label="状态" width="90" />
      <el-table-column prop="view_count" label="阅读" width="80" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            @click="router.push(`/admin/post/edit/${row._id}`)"
            >编辑</el-button
          >
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
