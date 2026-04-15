<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
  }>(),
  {
    variant: 'neutral',
  },
)

const classes = computed(() => `badge badge--${props.variant}`)
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
