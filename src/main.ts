import { createApp } from 'vue'
import App from './App.vue'
import router from './permission'
import '@/assets/global.scss'
import 'element-plus/theme-chalk/dark/css-vars.css'
import pinia from '@/store'

// 邀请链接落点：?invite=邀请人 暂存，注册时回传（与生产 inviter 字段口径一致）
const inviteParam = new URLSearchParams(location.search).get('invite')
if (inviteParam) localStorage.setItem('INVITE', inviteParam)

createApp(App).use(router).use(pinia).mount('#app')
