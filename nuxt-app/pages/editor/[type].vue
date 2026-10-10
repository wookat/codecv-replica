<script setup lang="ts">
const route = useRoute()
await navigateTo({ path: '/editor', query: { type: route.params.type } })
</script>
<template><div /></template>
