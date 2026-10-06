<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { admin } from '@/api/modules/admin'
import { useAdminPage, fmtTime } from './composables'

const { rows, total, page, loading, load, changePage } = useAdminPage(admin.vipCodePage)

const addOpen = ref(false)
const addForm = ref({ count: 10, days: 30 })
async function gen() {
  const res = await admin.vipCodeAdd(addForm.value)
  if (res?.code === 200) {
    ElMessage.success(res.message || '已生成')
    addOpen.value = false
    load()
    const codes = (res.data?.codes || []).join('\n')
    if (codes) {
      await ElMessageBox.alert(
        `<pre style="user-select:all">${codes}</pre>`,
        '新会员码（可复制）',
        {
          dangerouslyUseHTMLString: true
        }
      )
    }
  }
}
async function del(c: any) {
  await ElMessageBox.confirm(`删除会员码 ${c.code}？`, '删除', { type: 'warning' })
  const res = await admin.vipCodeDelete(c.code)
  if (res?.code === 200) {
    ElMessage.success('已删除')
    load()
  }
}
</script>

<template>
  <div class="panel">
    <div class="bar"><el-button type="success" @click="addOpen = true">生成会员码</el-button></div>
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="code" label="会员码" min-width="180" />
      <el-table-column prop="days" label="天数" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.used_by ? 'info' : 'success'" size="small">
            {{ row.used_by ? `已用 · ${row.usedByName || row.used_by}` : '未使用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="使用时间" width="170">
        <template #default="{ row }">{{ row.used_at ? fmtTime(row.used_at) : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
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

  <el-dialog v-model="addOpen" title="生成会员码" width="400px">
    <el-form label-width="90px">
      <el-form-item label="数量"
        ><el-input-number v-model="addForm.count" :min="1" :max="100"
      /></el-form-item>
      <el-form-item label="有效天数"
        ><el-input-number v-model="addForm.days" :min="1" :max="3650"
      /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="addOpen = false">取消</el-button>
      <el-button type="primary" @click="gen">生成</el-button>
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
.el-pagination {
  margin-top: 14px;
  justify-content: flex-end;
}
</style>
