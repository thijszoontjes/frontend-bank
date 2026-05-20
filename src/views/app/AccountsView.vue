<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useCurrency } from '@/composables/useCurrency'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { useAccountStore } from '@/stores/account'
import { formatDateTime } from '@/utils/format'

const { formatCurrency } = useCurrency()
const router = useRouter()
const { userId } = useCurrentUser()
const accountStore = useAccountStore()

async function loadAccounts() {
  if (!userId.value) {
    return
  }

  try {
    await accountStore.load(userId.value)
  } catch {
    // Store state is shown in the template.
  }
}

function statusVariant(status: string) {
  if (status === 'active') {
    return 'success'
  }

  if (status === 'review') {
    return 'warning'
  }

  return 'danger'
}

onMounted(() => void loadAccounts())
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Accounts overview"
      description="Personal account information, bank accounts, and balances for the signed-in customer."
    >
      <template #actions v-if="accountStore.summary">
        <div class="page-header-balance">
          <span class="page-header-balance__label">Total balance</span>
          <strong class="page-header-balance__value">{{ formatCurrency(accountStore.summary.totalBalance) }}</strong>
        </div>
      </template>
    </PageHeader>

    <LoadingState v-if="accountStore.isLoading && accountStore.accounts.length === 0" label="Loading account portfolio..." />

    <EmptyState
      v-else-if="accountStore.error && accountStore.accounts.length === 0"
      title="Account information unavailable"
      :description="accountStore.error"
    />

    <template v-else>

      <EmptyState
        v-if="accountStore.accounts.length === 0"
        title="No accounts available"
        description="There are no bank accounts linked to this customer yet."
      />

      <template v-else>
        <div class="grid-two">
          <AppCard
            v-for="account in accountStore.accounts"
            :key="account.id"
            :title="account.name"
            :subtitle="account.iban"
          >
            <div class="stack-sm">
              <div class="row-between">
                <span>Balance</span>
                <strong>{{ formatCurrency(account.availableBalance, account.currency) }}</strong>
              </div>
              <div class="row-between">
                <span>Daily limit</span>
                <strong>{{ formatCurrency(account.dailyLimit ?? 0, account.currency) }}</strong>
              </div>
              <div class="row-between">
                <span>Absolute limit</span>
                <strong>{{ formatCurrency(account.absoluteLimit ?? 0, account.currency) }}</strong>
              </div>
              <div class="row-between">
                <span>Status</span>
                <AppBadge :variant="statusVariant(account.status)">{{ account.status }}</AppBadge>
              </div>
                <div class="row-between">
                  <span>Opened on</span>
                  <strong>{{ formatDateTime(account.createdAt) }}</strong>
                </div>
              <div class="row-between" style="margin-top: 1rem;">
                <AppButton
                  variant="secondary"
                  size="sm"
                  @click="router.push({ name: 'account-transactions', params: { iban: account.iban } })"
                >
                  View transactions
                </AppButton>
              </div>
            </div>
          </AppCard>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.page-header-balance {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
}

.page-header-balance__label {
  font-size: 0.75rem;
  color: var(--color-text-muted, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.page-header-balance__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text, #111827);
}
</style>
