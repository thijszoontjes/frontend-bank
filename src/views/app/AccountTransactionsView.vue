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
import { useCurrentUser } from '@/composables/useCurrentUser'
import { useTransactionStore } from '@/stores/transaction'
import { toErrorMessage } from '@/utils/format'
import type { CreateTransactionPayload } from '@/types/transaction'

const route = useRoute()
const router = useRouter()
const { userId } = useCurrentUser()
const accountStore = useAccountStore()
const transactionStore = useTransactionStore()

const iban = computed(() => route.params.iban as string || '')
const pageError = ref('')
const submitError = ref('')
const submitMessage = ref('')
const isSubmitting = ref(false)

const currentAccount = computed(() =>
  accountStore.accounts.find((account) => account.iban === iban.value),
)

const accounts = computed(() => accountStore.accounts)

async function loadData() {
  if (!userId.value || !iban.value) return;
  pageError.value = '';

  try {
    await Promise.all([
      accountStore.load(userId.value),
      transactionStore.loadByAccount(iban.value)
    ]);
  } catch (caughtError) {
    // Only set error if we haven't navigated away
    pageError.value = toErrorMessage(caughtError);
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

function backToAccounts() {
  router.push({ name: 'accounts' })
}

onMounted(loadData)
</script>

<template>
  <div class="page-stack">
    <PageHeader
      :title="currentAccount ? `Transactions for ${currentAccount.name}` : 'Account transactions'"
      description="This account page shows only transactions for the selected account."
    >
      <template #actions>
        <AppButton variant="secondary" @click="backToAccounts">Back to accounts</AppButton>
      </template>
    </PageHeader>

    <LoadingState v-if="transactionStore.isLoading && transactionStore.transactions.length === 0" key="loading" label="Loading account transactions..." />

    <EmptyState
      v-else-if="pageError && transactionStore.transactions.length === 0"
      key="empty"
      title="Unable to load transactions"
      :description="pageError"
    />

    <template v-else>
      <div class="grid-two" key="content" style="gap: 1rem; align-items: flex-start;">
        <AppCard title="Account details" v-if="currentAccount">
          <div class="stack-sm">
            <div class="row-between">
              <span>IBAN</span>
              <strong>{{ currentAccount.iban }}</strong>
            </div>
            <div class="row-between">
              <span>Account</span>
              <strong>{{ currentAccount.name }}</strong>
            </div>
            <div class="row-between">
              <span>Balance</span>
              <strong>{{ currentAccount.availableBalance }} {{ currentAccount.currency }}</strong>
            </div>
            <div class="row-between">
              <span>Status</span>
              <AppBadge :variant="currentAccount.status === 'active' ? 'success' : 'danger'">{{ currentAccount.status }}</AppBadge>
            </div>
          </div>
        </AppCard>

        <AppCard title="Create transfer">
          <TransactionForm
  :accounts="accounts"
  :defaultFromIban="iban"
  :disabled="isSubmitting"
  submitLabel="Create transfer"
  @submit="handleCreate"
/>
          <span v-if="submitError" class="input-error">{{ submitError }}</span>
          <span v-if="submitMessage" style="color: var(--color-success);">{{ submitMessage }}</span>
        </AppCard>
      </div>

      <AppCard title="Account transactions">
        <EmptyState
          v-if="!transactionStore.isLoading && transactionStore.transactions.length === 0"
          title="No transactions"
          description="This account has no transactions yet."
        />

        <TransactionList v-else :transactions="transactionStore.transactions ?? []" />
      </AppCard>
    </template>
  </div>
</template>
