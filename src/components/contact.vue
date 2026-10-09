<script setup lang="ts">
import ToastModal from '@/components/toast-modal/toastModal.vue'

defineProps<{ open: boolean }>()
const emit = defineEmits(['toggle'])
</script>

<template>
  <toast-modal width="360px" v-if="open" :flag="open" @close="emit('toggle')">
    <div class="contact-body">
      <p>遇到问题或有建议？</p>
      <router-link class="contact-link" to="/feedback">前往意见反馈页</router-link>
    </div>
  </toast-modal>
</template>
