<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description: string
    layout?: 'stack' | 'inline'
  }>(),
  {
    layout: 'stack',
  },
)
</script>

<template>
  <header class="page-header" :class="{ 'page-header--inline': layout === 'inline' }">
    <div>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <div v-if="$slots.actions">
      <slot name="actions" />
    </div>
  </header>
</template>
