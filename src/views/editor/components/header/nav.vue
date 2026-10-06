<script setup lang="ts">
import nav from '@/common/nav/nav'
import useEditorStore from '@/store/modules/editor'

defineEmits(['import-md', 'ai-helper'])

const editorStore = useEditorStore()
// 生产使用教程链接随编辑模式切换：所见即所得→rich 指南，markdown→md 指南
function tutorHref() {
  return editorStore.writable
    ? 'https://www.yuque.com/xiongleixin/saqnu1/rxhlykmem82qbb8m'
    : 'https://www.yuque.com/xiongleixin/saqnu1/sl2ai75t6xgbhg86'
}
</script>

<template>
  <ul class="nav">
    <li v-for="(navItem, idx) in nav" :key="idx">
      <!-- 导入简历：生产同款直接唤起文件选择，tooltip「导入上次编写的MD」 -->
      <template v-if="navItem.file">
        <el-tooltip content="导入上次编写的MD">
          <label for="import_md" class="nav-label">
            {{ navItem.name }}
            <input accept=".md" id="import_md" type="file" @change="$emit('import-md', $event)" />
          </label>
        </el-tooltip>
      </template>
      <!-- 使用教程：双链接随模式切换 -->
      <a v-else-if="navItem.tutor" :href="tutorHref()" target="_blank" rel="noopener noreferrer">
        {{ navItem.name }}
      </a>
      <span v-else-if="navItem.act === 'ai'" class="ai-link" @click="$emit('ai-helper')">
        {{ navItem.name }}<i class="hot-tag">🔥</i>
      </span>
      <a v-else-if="navItem.external" :href="navItem.path" target="_blank" rel="noopener noreferrer"
        >{{ navItem.name }}<i v-if="navItem.hot" class="hot-tag">🔥</i></a
      >
      <router-link v-else :to="navItem.path || ''"
        >{{ navItem.name }}<i v-if="navItem.hot" class="hot-tag">🔥</i></router-link
      >
    </li>
  </ul>
</template>

<style lang="scss" scoped>
#import_md {
  width: 0;
  height: 0;
}
.nav-label {
  cursor: pointer;
}
.nav {
  font-weight: 500;
  margin-right: 20px;
  li {
    margin-right: 10px;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
}
.hot-tag {
  font-style: normal;
  font-size: 10px;
  margin-left: 1px;
  vertical-align: super;
}
.ai-link {
  cursor: pointer;
  color: var(--theme);
}
</style>
