<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <section class="card">
    <div class="card-body">
      <header v-if="title || subtitle || $slots.actions" class="card-header">
        <div>
          <h3 v-if="title" class="card-title">{{ title }}</h3>
          <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions">
          <slot name="actions" />
        </div>
      </header>
      <slot />
    </div>
  </section>
</template>
