<script setup lang="ts">
import AppCard from '@/components/ui/AppCard.vue'

defineProps<{
  title: string
  value: string
  caption: string
}>()
</script>

<template>
  <AppCard :title="title">
    <p class="metric-value">{{ value }}</p>
    <p class="metric-caption">{{ caption }}</p>
  </AppCard>
</template>
