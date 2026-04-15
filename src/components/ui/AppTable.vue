<script setup lang="ts">
export interface TableColumn {
  key: string
  label: string
}

defineProps<{
  columns: TableColumn[]
  rows: Record<string, unknown>[]
}>()
</script>

<template>
  <div class="card table-shell">
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in rows" :key="String(row.id ?? rowIndex)">
            <td v-for="column in columns" :key="column.key">
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
