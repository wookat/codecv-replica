import type { ComputedRef, MaybeRef } from 'vue'

type ComponentProps<T> = T extends new(...args: any) => { $props: infer P } ? NonNullable<P>
  : T extends (props: infer P, ...args: any) => any ? P
  : {}

declare module 'nuxt/app' {
  interface NuxtLayouts {
    blank: ComponentProps<typeof import("/home/ubuntu/repos/codecv-replica/nuxt-app/layouts/blank.vue").default>,
    default: ComponentProps<typeof import("/home/ubuntu/repos/codecv-replica/nuxt-app/layouts/default.vue").default>,
    toolsonly: ComponentProps<typeof import("/home/ubuntu/repos/codecv-replica/nuxt-app/layouts/toolsonly.vue").default>,
}
  export type LayoutKey = keyof NuxtLayouts extends never ? string : keyof NuxtLayouts
  interface PageMeta {
    layout?: MaybeRef<LayoutKey | false> | ComputedRef<LayoutKey | false>
  }
}