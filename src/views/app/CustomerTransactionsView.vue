<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppBadge from '@/components/ui/AppBadge.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import TransactionForm from '@/components/TransactionForm.vue'
import TransactionList from '@/components/TransactionList.vue'
import { services } from '@/services'
import { useAccountStore } from '@/stores/account'
import { useTransactionStore } from '@/stores/transaction'
import { toErrorMessage } from '@/utils/format'
import type { CreateTransactionPayload } from '@/types/transaction'
import type { UserProfile } from '@/types/user'

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()
const transactionStore = useTransactionStore()

const selectedUserId = computed(() => String(route.params.userId ?? ''))
const selectedUser = ref<UserProfile | null>(null)
const pageError = ref('')
const submitError = ref('')
const submitMessage = ref('')
const isSubmitting = ref(false)
const isLoading = ref(false)

const accounts = computed(() => accountStore.accounts)

async function loadCustomerTransactions() {
  if (!selectedUserId.value) {
    return
  }

  pageError.value = ''
  isLoading.value = true

  try {
    selectedUser.value = await services.user.getUserById(selectedUserId.value)
    await accountStore.load(selectedUserId.value)
    await transactionStore.load(selectedUserId.value)
  } catch (caughtError) {
    pageError.value = toErrorMessage(caughtError)
  } finally {
    isLoading.value = false
  }
}

async function handleCreate(payload: CreateTransactionPayload) {
  submitError.value = ''
  submitMessage.value = ''
  isSubmitting.value = true

  try {
    const transaction = await services.transaction.createTransaction(payload)
    transactionStore.add(transaction)
    submitMessage.value = 'Transfer successfully created.'
  } catch (caughtError) {
    submitError.value = toErrorMessage(caughtError)
  } finally {
    isSubmitting.value = false
  }
}

function backToUsers() {
  router.push({ name: 'users' })
}

onMounted(loadCustomerTransactions)
</script>

<template>
  <div class="page-stack">
    <PageHeader
      :title="selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Customer transactions'"
      description="This page shows all transactions for the selected customer."
    >
      <template #actions>
        <AppButton variant="secondary" @click="backToUsers">Back to users</AppButton>
      </template>
    </PageHeader>

    <LoadingState v-if="isLoading && transactionStore.transactions.length === 0" label="Loading customer transactions..." />

    <EmptyState
      v-else-if="pageError && transactionStore.transactions.length === 0"
      title="Unable to load transactions"
      :description="pageError"
    />

    <template v-else>
      <div class="grid-two" style="gap: 1rem; align-items: flex-start;">
        <AppCard title="Customer details" v-if="selectedUser">
          <div class="stack-sm">
            <div class="row-between">
              <span>Name</span>
              <strong>{{ selectedUser.firstName }} {{ selectedUser.lastName }}</strong>
            </div>
            <div class="row-between">
              <span>Email</span>
              <strong>{{ selectedUser.email }}</strong>
            </div>
            <div class="row-between">
              <span>Role</span>
              <AppBadge :variant="selectedUser.role === 'employee' ? 'info' : 'neutral'">{{ selectedUser.role }}</AppBadge>
            </div>
          </div>
        </AppCard>

        <AppCard title="Create transfer">
          <TransactionForm
            :accounts="accounts"
            :disabled="isSubmitting"
            submitLabel="Create transfer"
            @submit="handleCreate"
          />
          <span v-if="submitError" class="input-error">{{ submitError }}</span>
          <span v-if="submitMessage" style="color: var(--color-success);">{{ submitMessage }}</span>
        </AppCard>
      </div>

      <AppCard title="All transactions">
        <EmptyState
          v-if="!transactionStore.isLoading && transactionStore.transactions.length === 0"
          title="No transactions"
          description="This customer has no transactions yet."
        />

        <TransactionList v-else :transactions="transactionStore.transactions" />
      </AppCard>
    </template>
  </div>
</template>
