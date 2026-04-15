<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>

<template>
  <div class="loading-state">
    <div class="loading-spinner" />
    <p>{{ label ?? 'Data is loading...' }}</p>
  </div>
</template>
