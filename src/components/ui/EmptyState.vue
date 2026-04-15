<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <div class="empty-state">
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <div v-if="$slots.default" class="button-group" style="justify-content: center; margin-top: 1rem;">
      <slot />
    </div>
  </div>
</template>
