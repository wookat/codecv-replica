/** 登录守卫组合式：页面统一用它做「未登录→去登录页」判断 */
import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, type LocalUser } from '@/utils/auth'

export function useRequireAuth(redirect = '/profile'): { user: Ref<LocalUser | null> } {
  const router = useRouter()
  const user = ref<LocalUser | null>(currentUser())
  if (!user.value) router.replace(redirect)
  return { user }
}
