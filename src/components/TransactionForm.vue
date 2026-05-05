<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { BankAccount } from '@/types/account'
import { useCurrentUser } from '@/composables/useCurrentUser'
import type { CreateTransactionPayload } from '@/types/transaction'

const props = defineProps({
  accounts: {
    type: Array as () => BankAccount[],
    required: true,
  },
  defaultFromIban: {
    type: String,
    default: '',
  },
  submitLabel: {
    type: String,
    default: 'Send transfer',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (event: 'submit', payload: CreateTransactionPayload): void
}>()

const fromAccountIban = ref(props.defaultFromIban || props.accounts[0]?.iban || '')
const toAccountIban = ref('')
const amount = ref('')
const description = ref('')
const initiatorId = useCurrentUser().userId
const error = ref('')

watch(
  () => props.defaultFromIban,
  (value) => {
    if (value) {
      fromAccountIban.value = value
    }
  },
)

const sortedAccounts = computed(() => [...props.accounts])

function validateForm() {
  if (!fromAccountIban.value.trim()) {
    error.value = 'Choose a source account.'
    return false
  }

  if (!toAccountIban.value.trim()) {
    error.value = 'Enter a destination IBAN.'
    return false
  }

  if (amount.value.trim().length === 0 || Number(amount.value) <= 0) {
    error.value = 'Enter a positive amount.'
    return false
  }

  error.value = ''
  return true
}

function submit() {
  if (!validateForm()) {
    return
  }

  emit('submit', {
    fromAccountIban: fromAccountIban.value,
    toAccountIban: toAccountIban.value.trim(),
    initiatorId: initiatorId.value,
    amount: Number(amount.value.trim()),
    description: description.value.trim() || undefined,
  })
}
</script>

<template>
  <div class="stack-sm">
    <div class="input-group">
      <label class="input-label">From account</label>
      <select v-model="fromAccountIban" class="input-control" :disabled="props.disabled || props.accounts.length === 0">
        <option value="" disabled>Select account</option>
        <option v-for="account in sortedAccounts" :key="account.iban" :value="account.iban">
          {{ account.name }} — {{ account.iban }}
        </option>
      </select>
    </div>

    <AppInput v-model="toAccountIban" label="To IBAN" type="text" />
    <AppInput v-model="amount" label="Amount" type="number" step="0.01" />
    <AppInput v-model="description" label="Description (optional)" type="text" />

    <span v-if="error" class="input-error">{{ error }}</span>

    <AppButton :disabled="props.disabled" @click="submit()">{{ props.submitLabel }}</AppButton>
  </div>
</template>
