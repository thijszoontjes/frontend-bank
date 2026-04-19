<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { useApprovalStore } from '@/stores/approval'

const router = useRouter()
const { user, isEmployee } = useCurrentUser()
const approvalStore = useApprovalStore()

async function loadDashboard() {
  if (!isEmployee.value) {
    return
  }

  await approvalStore.load()
}

onMounted(loadDashboard)
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="Dashboard"
      :description="
        isEmployee
          ? 'Beheer nieuwe registraties en open de approval-pagina voor beoordeling.'
          : 'Je account is goedgekeurd. Vanaf hier kom je in de applicatie binnen.'
      "
    >
      <template #actions>
        <AppButton v-if="isEmployee" @click="router.push({ name: 'approvals' })">
          Open approvals
        </AppButton>
      </template>
    </PageHeader>

    <LoadingState
      v-if="isEmployee && approvalStore.isLoading && approvalStore.approvals.length === 0"
      label="Pending registraties laden..."
    />

    <template v-else-if="isEmployee">
      <div class="grid-two">
        <AppCard title="Pending registrations" subtitle="Klanten die nog wachten op beoordeling.">
          <div class="row-between">
            <span>Aantal pending klanten</span>
            <strong>{{ approvalStore.pendingCount }}</strong>
          </div>
        </AppCard>

        <AppCard title="Approval flow" subtitle="Bij goedkeuring stel je direct de limieten voor beide accounts in.">
          <div class="stack-sm">
            <span>Checking account: absolute limit + daily limit</span>
            <span>Savings account: absolute limit + daily limit</span>
          </div>
        </AppCard>
      </div>

      <EmptyState
        v-if="approvalStore.pendingCount === 0"
        title="Geen pending registraties"
        description="Nieuwe klanten verschijnen hier zodra ze zich registreren."
      />
    </template>

    <template v-else>
      <AppCard
        title="Welkom terug"
        subtitle="Je registratie is goedgekeurd en je account heeft normale toegang tot de applicatie."
      >
        <div class="stack-sm">
          <div class="row-between">
            <span>Klant</span>
            <strong>{{ user?.firstName }} {{ user?.lastName }}</strong>
          </div>
          <div class="row-between">
            <span>Status</span>
            <AppBadge variant="success">Approved</AppBadge>
          </div>
          <div class="row-between">
            <span>E-mail</span>
            <strong>{{ user?.email }}</strong>
          </div>
        </div>
      </AppCard>
    </template>
  </div>
</template>
