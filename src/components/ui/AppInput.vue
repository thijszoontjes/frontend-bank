<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    modelValue: string
    label: string
    type?: string
    placeholder?: string
    hint?: string
    error?: string | null
    autocomplete?: string
  }>(),
  {
    type: 'text',
    placeholder: '',
    hint: '',
    error: null,
    autocomplete: 'off',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = useId()
</script>

<template>
  <label class="input-group" :for="inputId">
    <span class="input-label">{{ label }}</span>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      class="input-control"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="error" class="input-error">{{ error }}</span>
    <span v-else-if="hint" class="input-hint">{{ hint }}</span>
  </label>
</template>
