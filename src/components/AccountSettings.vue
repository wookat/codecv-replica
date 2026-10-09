<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import useUserStore from '@/store/modules/user'
import { updateUserInfo } from '@/api/modules/user'
import { getLocalStorage } from '@/common/localstorage'
import PWDUpdate from '@/components/pwd-update/PWDUpdate.vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

const store = useUserStore()
const active = ref('profile')
const saving = ref(false)
const schools = ref<string[]>([])

const sexOptions = ['', '男', '女']

// 生产同款学校 datalist（/api/schools 需登录）
fetch('/api/schools', {
  headers: { Authorization: `Bearer ${(getLocalStorage('TOKEN') as string) || ''}` }
})
  .then(r => r.json())
  .then(d => (schools.value = d?.data || []))
  .catch(() => undefined)

// 打开弹层时先水合 userInfo（会话恢复场景 uid=0 且字段空白，保存前也拦一次）
watch(
  () => props.modelValue,
  v => {
    if (v) void store.ensureHydrated()
  }
)

async function saveProfile() {
  saving.value = true
  try {
    if (!(await store.ensureHydrated())) {
      ElMessage.error('登录态失效，请重新登录')
      return
    }
    const res: any = await updateUserInfo(store.userInfo)
    if (res?.code === 200) {
      ElMessage.success('资料已更新')
      emit('update:modelValue', false)
    } else {
      ElMessage.error(res?.msg || '更新失败')
    }
  } finally {
    saving.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}
void props
</script>

<template>
  <el-dialog :model-value="modelValue" title="账号设置" width="440px" @update:model-value="close">
    <el-tabs v-model="active">
      <el-tab-pane label="个人资料" name="profile">
        <div class="pf-form">
          <label class="f">
            <span>昵称</span>
            <input v-model="store.userInfo.nickName" class="ti" placeholder="展示用昵称" />
          </label>
          <label class="f">
            <span>性别</span>
            <el-select v-model="store.userInfo.sex" placeholder="选择性别">
              <el-option v-for="s in sexOptions" :key="s" :label="s || '保密'" :value="s" />
            </el-select>
          </label>
          <label class="f">
            <span>职业方向</span>
            <input v-model="store.userInfo.professional" class="ti" placeholder="例如：前端开发" />
          </label>
          <label class="f">
            <span>届别</span>
            <input v-model="store.userInfo.graduation" class="ti" placeholder="例如：2027" />
          </label>
          <label class="f">
            <span>学校</span>
            <input
              v-model="store.userInfo.school"
              class="ti"
              list="codecv-schools"
              placeholder="例如：上海交通大学"
            />
            <datalist id="codecv-schools">
              <option v-for="s in schools" :key="s" :value="s" />
            </datalist>
          </label>
          <button class="save-btn" :disabled="saving" @click="saveProfile">
            {{ saving ? '保存中…' : '保存资料' }}
          </button>
        </div>
      </el-tab-pane>
      <el-tab-pane label="修改密码" name="pwd">
        <PWDUpdate @cancel="close" />
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<style lang="scss" scoped>
.pf-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  .f {
    display: flex;
    flex-direction: column;
    gap: 6px;
    span {
      font-size: 13px;
      font-weight: 500;
      color: var(--font-color);
    }
    .ti {
      height: 38px;
      padding: 0 12px;
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      background: var(--body-background);
      color: var(--font-color);
      font-size: 14px;
      outline: none;
      &:focus {
        border-color: var(--theme);
      }
    }
  }
  .save-btn {
    margin-top: 4px;
    height: 38px;
    border: none;
    border-radius: 8px;
    background: var(--theme);
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    &:hover {
      opacity: 0.9;
    }
    &:disabled {
      opacity: 0.6;
    }
  }
}
</style>
