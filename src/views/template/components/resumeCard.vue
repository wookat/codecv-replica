<script setup lang="ts">
import { type TemplateType } from '@/templates/config'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { favoriteToggle } from '@/api/modules/favorite'

const props = defineProps<{ theme: TemplateType; favorited?: boolean }>()
const emit = defineEmits(['toggle-fav'])
const router = useRouter()

const edit = (type: string) => {
  router.push({ path: '/editor', query: { type } })
}

async function toggleFav(e: MouseEvent) {
  e.stopPropagation()
  const r = await favoriteToggle(props.theme.type)
  emit('toggle-fav', { type: props.theme.type, favorited: r.favorited })
  ElMessage.success(
    r.favorited ? (r.cloud ? '已收藏' : '已收藏（登录后可云端同步）') : '已取消收藏'
  )
}
</script>

<template>
  <div class="resume-card" data-aos="zoom-in">
    <button
      class="fav-star"
      :class="{ on: favorited }"
      :title="favorited ? '取消收藏' : '收藏模板'"
      @click="toggleFav"
    >
      {{ favorited ? '★' : '☆' }}
    </button>
    <p class="template-hot" v-show="theme.hot">
      <i class="iconfont icon-hot font-20"></i> {{ theme.hot }}
    </p>
    <div @click="edit(theme.type)">
      <img :src="theme.img" loading="lazy" />
      <div class="resume-card-mask">
        <button class="btn center pointer">使用模板</button>
      </div>
      {{ theme.name }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.resume-card {
  margin: 5px 20px 80px 0;
  width: 185px;
  height: 240px;
  position: relative;
  text-align: center;
  transition: transform 0.4s;
  color: var(--font-color);
  cursor: pointer;

  .fav-star {
    position: absolute;
    top: -25px;
    right: 0;
    z-index: 2;
    border: none;
    background: transparent;
    font-size: 18px;
    line-height: 25px;
    color: #bbb;
    cursor: pointer;
    &.on {
      color: #f5a623;
    }
  }

  .template-hot {
    height: 25px;
    background: var(--background);
    font-size: 12px;
    top: -25px;
    position: absolute;
    text-align: left;
    i {
      color: orangered;
    }
  }

  img {
    width: 100%;
    height: 100%;
    border-radius: 5px;
  }

  .resume-card-mask {
    border-radius: 5px;
    position: absolute;
    height: calc(100% + 25px);
    width: 100%;
    top: 0;
    left: 0;
    display: none;
    background: rgba(0, 0, 0, 0.5);

    button {
      border-radius: 3px;
      color: white;
      background: var(--theme);
    }
  }

  &:hover {
    transform: translateY(10px);
    .resume-card-mask {
      display: block;
    }
  }
}
</style>
