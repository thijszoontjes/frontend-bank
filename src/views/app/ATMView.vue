<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useCurrency } from '@/composables/useCurrency'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { useAccountStore } from '@/stores/account'
import { useAtmStore } from '@/stores/atm'
import { services } from '@/services'
import type { AtmTransactionResult } from '@/types/atm'
import { formatDateTime, toErrorMessage } from '@/utils/format'

const { formatCurrency } = useCurrency()
const { userId, user } = useCurrentUser()
const accountStore = useAccountStore()
const atmStore = useAtmStore()

const amountInput = ref('')
const activeAction = ref<'deposit' | 'withdraw'>('deposit')
const successResult = ref<AtmTransactionResult | null>(null)
const atmPassword = ref('')
const atmAuthorized = ref(false)
const atmLoginError = ref('')
const isAtmLoggingIn = ref(false)

const atmEmail = computed(() => user.value?.email ?? '')
const atmCanLogin = computed(() => !!atmEmail.value && !!atmPassword.value && !isAtmLoggingIn.value)

async function loginAtm() {
  atmLoginError.value = ''
  isAtmLoggingIn.value = true

  try {
    await services.auth.login({ email: atmEmail.value, password: atmPassword.value })
    atmAuthorized.value = true
    atmPassword.value = ''
  } catch (caughtError) {
    atmLoginError.value = toErrorMessage(caughtError)
  } finally {
    isAtmLoggingIn.value = false
  }
}

const checkingAccount = computed(() =>
  accountStore.accounts.find((a) => a.type === 'checking'),
)

const amountError = computed(() => {
  if (!amountInput.value) return null
  const value = parseFloat(amountInput.value)
  if (isNaN(value) || value <= 0) return 'Enter a valid amount greater than 0.'
  return null
})

const canSubmit = computed(() =>
  !!checkingAccount.value &&
  !!amountInput.value &&
  !amountError.value &&
  !atmStore.isLoading,
)

async function loadAccounts() {
  if (!userId.value) return
  try {
    await accountStore.load(userId.value)
  } catch {
    // Error shown via store state.
  }
}

async function submit() {
  if (!checkingAccount.value || !canSubmit.value) return

  const amount = parseFloat(parseFloat(amountInput.value).toFixed(2))
  const iban = checkingAccount.value.iban

  successResult.value = null
  atmStore.clearResult()

  try {
    const rawResult =
      activeAction.value === 'deposit'
        ? await atmStore.deposit({ toAccountIban: iban, amount })
        : await atmStore.withdraw({ fromAccountIban: iban, amount })

    const computedNewBalance =
      activeAction.value === 'deposit'
        ? checkingAccount.value.availableBalance + amount
        : checkingAccount.value.availableBalance - amount

    successResult.value = {
      ...rawResult,
      newBalance: rawResult.newBalance ?? computedNewBalance,
    }

    amountInput.value = ''

    // Refresh account balance.
    if (userId.value) {
      await accountStore.load(userId.value)
    }
  } catch {
    // Error is shown via atmStore.error.
  }
}

function selectAction(action: 'deposit' | 'withdraw') {
  activeAction.value = action
  amountInput.value = ''
  successResult.value = null
  atmStore.clearResult()
}

onMounted(() => void loadAccounts())
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="ATM"
      description="Deposit cash into or withdraw cash from your checking account."
    />

    <LoadingState
      v-if="accountStore.isLoading && !checkingAccount"
      label="Loading account information..."
    />

    <EmptyState
      v-else-if="accountStore.error && !checkingAccount"
      title="Account information unavailable"
      :description="accountStore.error"
    />

    <EmptyState
      v-else-if="!accountStore.isLoading && !checkingAccount"
      title="No checking account found"
      description="An active checking account is required to use the ATM."
    />

    <template v-else-if="checkingAccount">
      <div class="grid-two" style="align-items: start;">
        <AppCard title="Checking account">
          <div class="grid-two" style="gap: 0.75rem;">
            <div class="stack-sm">
              <div>
                <span style="font-size: 0.8rem; color: var(--color-text-muted);">Account</span>
                <div><strong>{{ checkingAccount.name }}</strong></div>
              </div>
              <div>
                <span style="font-size: 0.8rem; color: var(--color-text-muted);">IBAN</span>
                <div style="font-size: 0.9rem;"><strong>{{ checkingAccount.iban }}</strong></div>
              </div>
            </div>
            <div class="stack-sm">
              <div>
                <span style="font-size: 0.8rem; color: var(--color-text-muted);">Available balance</span>
                <div><strong>{{ formatCurrency(checkingAccount.availableBalance, checkingAccount.currency) }}</strong></div>
              </div>
              <div>
                <span style="font-size: 0.8rem; color: var(--color-text-muted);">Status</span>
                <div>
                  <AppBadge :variant="checkingAccount.status === 'active' ? 'success' : 'warning'">
                    {{ checkingAccount.status }}
                  </AppBadge>
                </div>
              </div>
            </div>
          </div>
        </AppCard>

        <AppCard title="ATM login">
          <div class="stack-sm">
            <p style="margin: 0; color: var(--color-text-muted);">
              Please authenticate specifically for the ATM before you can make deposits or withdrawals.
            </p>
            <div>
              <span style="display: block; font-size: 0.8rem; color: var(--color-text-muted);">Email</span>
              <strong>{{ atmEmail }}</strong>
            </div>

            <AppInput
              v-model="atmPassword"
              label="ATM password"
              type="password"
              placeholder="Enter ATM password"
              :error="atmLoginError"
              autocomplete="off"
            />

            <AppButton
              :disabled="!atmCanLogin"
              variant="primary"
              block
              @click="loginAtm"
            >
              <span v-if="isAtmLoggingIn">Authenticating...</span>
              <span v-else>Login to ATM</span>
            </AppButton>

            <span v-if="atmAuthorized" class="success-message">ATM access granted.</span>
          </div>
        </AppCard>
      </div>

      <template v-if="atmAuthorized">
        <div class="grid-two" style="align-items: start;">
          <AppCard>
            <div class="stack-sm">
              <div class="pill-filter" role="tablist" aria-label="ATM action">
                <button
                  :class="{ 'is-active': activeAction === 'deposit' }"
                  @click="selectAction('deposit')"
                >
                  Deposit
                </button>
                <button
                  :class="{ 'is-active': activeAction === 'withdraw' }"
                  @click="selectAction('withdraw')"
                >
                  Withdraw
                </button>
              </div>

              <AppInput
                v-model="amountInput"
                label="Amount (EUR)"
                type="number"
                placeholder="0.00"
                :error="amountError"
                autocomplete="off"
              />

              <div v-if="atmStore.error" class="input-error" style="padding: 0.5rem 0;">
                {{ atmStore.error }}
              </div>

              <AppButton
                :disabled="!canSubmit"
                :variant="activeAction === 'withdraw' ? 'danger' : 'primary'"
                block
                @click="submit"
              >
                <span v-if="atmStore.isLoading">Processing...</span>
                <span v-else-if="activeAction === 'deposit'">Deposit</span>
                <span v-else>Withdraw</span>
              </AppButton>
            </div>
          </AppCard>
        </div>

        <AppCard v-if="successResult" title="Transaction confirmed">
          <div class="stack-sm">
            <div class="row-between">
              <span>Type</span>
              <AppBadge :variant="successResult.type === 'DEPOSIT' ? 'success' : 'warning'">
                {{ successResult.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal' }}
              </AppBadge>
            </div>
            <div class="row-between">
              <span>Amount</span>
              <strong>{{ formatCurrency(successResult.amount) }}</strong>
            </div>
            <div class="row-between">
              <span>New balance</span>
              <strong>{{ formatCurrency(successResult.newBalance) }}</strong>
            </div>
            <div class="row-between">
              <span>IBAN</span>
              <strong>{{ successResult.iban }}</strong>
            </div>
            <div class="row-between">
              <span>Date</span>
              <strong>{{ formatDateTime(successResult.createdAt) }}</strong>
            </div>
          </div>
        </AppCard>
      </template>
    </template>
  </div>
</template>
