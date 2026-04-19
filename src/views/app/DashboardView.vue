<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import MetricCard from '@/components/dashboard/MetricCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useCurrency } from '@/composables/useCurrency'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { useAccountStore } from '@/stores/account'
import { useApprovalStore } from '@/stores/approval'

const router = useRouter()
const { formatCurrency } = useCurrency()
const { user, userId, isEmployee } = useCurrentUser()
const approvalStore = useApprovalStore()
const accountStore = useAccountStore()

const isLoading = computed(() =>
  isEmployee.value ? approvalStore.isLoading : accountStore.isLoading,
)

async function loadDashboard() {
  if (isEmployee.value) {
    await approvalStore.load()
    return
  }

  if (userId.value) {
    await accountStore.load(userId.value)
  }
}

onMounted(loadDashboard)
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Dashboard"
      :description="
        isEmployee
          ? 'Overzicht van ondersteund gebruikersbeheer op basis van de huidige backend.'
          : 'Overzicht van je profiel, rekeningen en balances.'
      "
    >
      <template #actions>
        <AppButton v-if="isEmployee" @click="router.push({ name: 'approvals' })">Open user management</AppButton>
        <AppButton v-else variant="secondary" @click="router.push({ name: 'accounts' })">Bekijk accounts</AppButton>
      </template>
    </PageHeader>

    <LoadingState
      v-if="isLoading && (isEmployee ? approvalStore.approvals.length === 0 : !accountStore.summary)"
      :label="isEmployee ? 'Users laden...' : 'Accountgegevens laden...'"
    />

    <template v-else-if="isEmployee">
      <div class="grid-three">
        <MetricCard
          title="Pending customers"
          :value="String(approvalStore.pendingCount)"
          caption="Registraties die via de bestaande API te beheren zijn."
        />
        <MetricCard
          title="Soft delete"
          value="Supported"
          caption="Beschikbaar via het bestaande delete-endpoint op users."
        />
        <MetricCard
          title="Update / block"
          value="Not available"
          caption="Geen backend-endpoints gevonden voor edit, block of unblock."
        />
      </div>

      <AppCard title="Beschikbare employee acties" subtitle="Alleen backend-ondersteunde functies worden hier aangeboden.">
        <div class="stack-sm">
          <span>Pending users bekijken</span>
          <span>User detail per geselecteerde pending customer bekijken</span>
          <span>Approve, reject en soft delete uitvoeren</span>
          <span>Employee-created customer, user update en block/unblock zijn niet beschikbaar in de huidige API</span>
        </div>
      </AppCard>
    </template>

    <template v-else>
      <div class="grid-three">
        <MetricCard
          title="Totaal saldo"
          :value="formatCurrency(accountStore.summary?.totalBalance ?? 0)"
          caption="Gecombineerde balance over je beschikbare rekeningen."
        />
        <MetricCard
          title="Beschikbaar"
          :value="formatCurrency(accountStore.summary?.liquidBalance ?? 0)"
          caption="Direct beschikbaar saldo in EUR."
        />
        <MetricCard
          title="Rekeningen"
          :value="String(accountStore.summary?.accountsCount ?? 0)"
          caption="Aantal gekoppelde bankrekeningen."
        />
      </div>

      <div class="grid-two">
        <AppCard title="Profiel" subtitle="Gegevens van de ingelogde klant.">
          <div class="stack-sm">
            <div class="row-between">
              <span>Naam</span>
              <strong>{{ user?.firstName }} {{ user?.lastName }}</strong>
            </div>
            <div class="row-between">
              <span>E-mail</span>
              <strong>{{ user?.email }}</strong>
            </div>
            <div class="row-between">
              <span>Telefoon</span>
              <strong>{{ user?.phoneNumber ?? 'Niet beschikbaar' }}</strong>
            </div>
            <div class="row-between">
              <span>Status</span>
              <AppBadge variant="success">Approved</AppBadge>
            </div>
          </div>
        </AppCard>

        <AppCard title="Rekeningen" subtitle="Samenvatting van je bankaccounts en balances.">
          <EmptyState
            v-if="accountStore.accounts.length === 0"
            title="Geen rekeningen gevonden"
            description="Er zijn nog geen accounts beschikbaar voor deze klant."
          />
          <div v-else class="stack-sm">
            <div v-for="account in accountStore.accounts" :key="account.id" class="row-between">
              <div>
                <strong>{{ account.name }}</strong>
                <div style="color: var(--color-text-muted); font-size: 0.92rem;">{{ account.iban }}</div>
              </div>
              <strong>{{ formatCurrency(account.availableBalance, account.currency) }}</strong>
            </div>
          </div>
        </AppCard>
      </div>
    </template>
  </div>
</template>
