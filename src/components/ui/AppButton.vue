<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'md' | 'sm'
    block?: boolean
    disabled?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    size: 'md',
    block: false,
    disabled: false,
  },
)

const classes = computed(() =>
  [
    'app-button',
    `app-button--${props.variant}`,
    props.size === 'sm' ? 'app-button--sm' : '',
    props.block ? 'app-button--block' : '',
  ]
    .filter(Boolean)
    .join(' '),
)
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled">
    <slot />
  </button>
</template>
