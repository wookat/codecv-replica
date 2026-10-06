<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { admin } from '@/api/modules/admin'
import { useAdminPage } from './composables'

const { rows, total, page, keyword, loading, load, search, changePage } = useAdminPage(
  admin.templatePage,
  30
)

async function del(t: any) {
  await ElMessageBox.confirm(`下架模板「${t.name}」？前台模板中心将隐藏该模板。`, '下架', {
    type: 'warning'
  })
  const res = await admin.templateDelete(t.type)
  if (res?.code === 200) {
    ElMessage.success('已下架')
    load()
  }
}
</script>

<template>
  <div class="panel">
    <div class="bar">
      <el-input
        v-model="keyword"
        placeholder="搜索模板名"
        clearable
        style="width: 240px"
        @keyup.enter="search"
      />
      <el-button type="primary" @click="search">搜索</el-button>
    </div>
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="type" label="type" width="200" />
      <el-table-column prop="name" label="名称" min-width="180" />
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.hidden" type="danger" size="small">已下架</el-tag>
          <el-tag v-else type="success" size="small">在架</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button v-if="!row.hidden" link type="danger" size="small" @click="del(row)"
            >下架</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      layout="total, prev, pager, next"
      :total="total"
      :page-size="30"
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
