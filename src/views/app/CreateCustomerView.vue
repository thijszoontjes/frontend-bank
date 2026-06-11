<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { services } from '@/services'
import { useCurrentUser } from '@/composables/useCurrentUser'
import type { EmployeeCreateCustomerPayload, EmployeeCreateEmployeePayload } from '@/types/user'
import { toErrorMessage } from '@/utils/format'

const router = useRouter()
const { isEmployee } = useCurrentUser()
const isSubmitting = ref(false)
const error = ref('')
const success = ref('')
const isEmployeeModalOpen = ref(false)
const isEmployeeSubmitting = ref(false)
const employeeError = ref('')

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  bsn: '',
  checkingAbsolute: '-500',
  checkingDaily: '1000',
  savingsAbsolute: '0',
  savingsDaily: '5000',
})

const employeeForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  bsn: '',
})

function resetEmployeeForm() {
  employeeForm.firstName = ''
  employeeForm.lastName = ''
  employeeForm.email = ''
  employeeForm.phoneNumber = ''
  employeeForm.password = ''
  employeeForm.bsn = ''
  employeeError.value = ''
}

function openEmployeeModal() {
  resetEmployeeForm()
  isEmployeeModalOpen.value = true
}

function closeEmployeeModal() {
  if (isEmployeeSubmitting.value) {
    return
  }

  isEmployeeModalOpen.value = false
  resetEmployeeForm()
}

function buildEmployeePayload(): EmployeeCreateEmployeePayload | null {
  employeeError.value = ''

  if (
    !employeeForm.firstName.trim() ||
    !employeeForm.lastName.trim() ||
    !employeeForm.email.trim() ||
    !employeeForm.phoneNumber.trim() ||
    !employeeForm.password ||
    !employeeForm.bsn.trim()
  ) {
    employeeError.value = 'Fill in all fields.'
    return null
  }

  if (!/^\d{9}$/.test(employeeForm.bsn.trim())) {
    employeeError.value = 'BSN must contain exactly 9 digits.'
    return null
  }

  if (employeeForm.password.length < 8) {
    employeeError.value = 'Password must contain at least 8 characters.'
    return null
  }

  return {
    firstName: employeeForm.firstName.trim(),
    lastName: employeeForm.lastName.trim(),
    email: employeeForm.email.trim(),
    phoneNumber: employeeForm.phoneNumber.trim(),
    password: employeeForm.password,
    bsn: employeeForm.bsn.trim(),
  }
}

async function handleEmployeeSubmit() {
  if (isEmployeeSubmitting.value) {
    return
  }

  const payload = buildEmployeePayload()

  if (!payload) {
    return
  }

  isEmployeeSubmitting.value = true

  try {
    const user = await services.user.createEmployee(payload)
    isEmployeeModalOpen.value = false
    await router.push({
      name: 'users',
      query: {
        created: '1',
        createdRole: 'employee',
        role: 'employee',
        userName: `${user.firstName} ${user.lastName}`,
      },
    })
  } catch (caughtError) {
    employeeError.value = toErrorMessage(caughtError)
  } finally {
    isEmployeeSubmitting.value = false
  }
}

function buildPayload(): EmployeeCreateCustomerPayload | null {
  error.value = ''

  if (
    !form.firstName.trim() ||
    !form.lastName.trim() ||
    !form.email.trim() ||
    !form.phoneNumber.trim() ||
    !form.password ||
    !form.bsn.trim()
  ) {
    error.value = 'Fill in all fields.'
    return null
  }

  if (!/^\d{9}$/.test(form.bsn.trim())) {
    error.value = 'BSN must contain exactly 9 digits.'
    return null
  }

  if (form.password.length < 8) {
    error.value = 'Password must contain at least 8 characters.'
    return null
  }

  const checkingAbsolute = Number(form.checkingAbsolute)
  const checkingDaily = Number(form.checkingDaily)
  const savingsAbsolute = Number(form.savingsAbsolute)
  const savingsDaily = Number(form.savingsDaily)

  const limitFields = [
    form.checkingAbsolute,
    form.checkingDaily,
    form.savingsAbsolute,
    form.savingsDaily,
  ]
  const limitValues = [checkingAbsolute, checkingDaily, savingsAbsolute, savingsDaily]

  if (limitFields.some((value) => value.trim() === '') || !limitValues.every(Number.isFinite)) {
    error.value = 'Use valid numeric limits.'
    return null
  }

  if (checkingDaily < 0 || savingsDaily < 0) {
    error.value = 'Daily limits cannot be negative.'
    return null
  }

  const payload: EmployeeCreateCustomerPayload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phoneNumber: form.phoneNumber.trim(),
    password: form.password,
    bsn: form.bsn.trim(),
    checkingAccount: {
      absoluteLimit: checkingAbsolute,
      dailyLimit: checkingDaily,
    },
    savingsAccount: {
      absoluteLimit: savingsAbsolute,
      dailyLimit: savingsDaily,
    },
  }

  return payload
}

async function handleSubmit() {
  const payload = buildPayload()

  if (!payload) {
    return
  }

  isSubmitting.value = true
  success.value = ''

  try {
    const user = await services.user.createCustomer(payload)
    success.value = `${user.firstName} ${user.lastName} has been created.`
    await router.push({
      name: 'users',
      query: {
        created: '1',
        customerName: `${user.firstName} ${user.lastName}`,
      },
    })
  } catch (caughtError) {
    error.value = toErrorMessage(caughtError)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="page-stack">
    <PageHeader
      title="New customer"
      description="Create a new customer with checking and savings accounts immediately."
    />

    <AppCard title="Customer details">
      <div class="inline-form-row">
        <AppInput v-model="form.firstName" label="First name" autocomplete="given-name" />
        <AppInput v-model="form.lastName" label="Last name" autocomplete="family-name" />
      </div>
      <div class="inline-form-row" style="margin-top: 1rem;">
        <AppInput v-model="form.email" label="Email" type="email" autocomplete="email" />
        <AppInput v-model="form.phoneNumber" label="Phone number" autocomplete="tel" />
      </div>
      <div class="inline-form-row" style="margin-top: 1rem;">
        <AppInput v-model="form.bsn" label="BSN" placeholder="123456789" />
        <AppInput v-model="form.password" label="Password" type="password" autocomplete="new-password" />
      </div>
      <div class="inline-form-row" style="margin-top: 1rem;">
        <AppInput v-model="form.checkingAbsolute" label="Checking absolute limit" type="number" />
        <AppInput v-model="form.checkingDaily" label="Checking daily limit" type="number" />
      </div>
      <div class="inline-form-row" style="margin-top: 1rem;">
        <AppInput v-model="form.savingsAbsolute" label="Savings absolute limit" type="number" />
        <AppInput v-model="form.savingsDaily" label="Savings daily limit" type="number" />
      </div>

      <span v-if="error" class="input-error" style="display: block; margin-top: 1rem;">{{ error }}</span>
      <span v-if="success" style="display: block; margin-top: 1rem; color: var(--color-success);">{{ success }}</span>

      <template #actions>
        <div class="button-group">
          <AppButton :disabled="isSubmitting" @click="handleSubmit()">
            {{ isSubmitting ? 'Creating...' : 'Create customer' }}
          </AppButton>
          <AppButton v-if="isEmployee" variant="secondary" @click="openEmployeeModal()">Create employee</AppButton>
          <AppButton variant="ghost" @click="router.push({ name: 'users' })">Back to users</AppButton>
        </div>
      </template>
    </AppCard>

    <div v-if="isEmployeeModalOpen" class="modal-backdrop" @click.self="closeEmployeeModal()">
      <section
        class="employee-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-modal-title"
      >
        <header class="modal-header">
          <div>
            <span class="modal-eyebrow">Employee access</span>
            <h3 id="employee-modal-title">Create employee</h3>
          </div>
          <button type="button" class="modal-close" aria-label="Close employee creation" @click="closeEmployeeModal()">
            x
          </button>
        </header>

        <form class="employee-form" @submit.prevent="handleEmployeeSubmit()">
          <div class="inline-form-row">
            <AppInput v-model="employeeForm.firstName" label="First name" autocomplete="given-name" />
            <AppInput v-model="employeeForm.lastName" label="Last name" autocomplete="family-name" />
          </div>
          <div class="inline-form-row">
            <AppInput v-model="employeeForm.email" label="Email" type="email" autocomplete="email" />
            <AppInput v-model="employeeForm.phoneNumber" label="Phone number" autocomplete="tel" />
          </div>
          <div class="inline-form-row">
            <AppInput v-model="employeeForm.bsn" label="BSN" placeholder="123456789" />
            <AppInput v-model="employeeForm.password" label="Password" type="password" autocomplete="new-password" />
          </div>

          <span v-if="employeeError" class="input-error" role="alert">{{ employeeError }}</span>

          <div class="modal-actions">
            <AppButton type="submit" :disabled="isEmployeeSubmitting">
              {{ isEmployeeSubmitting ? 'Creating...' : 'Create employee' }}
            </AppButton>
            <AppButton variant="ghost" :disabled="isEmployeeSubmitting" @click="closeEmployeeModal()">Cancel</AppButton>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  padding: 2rem;
  display: grid;
  place-items: center;
  background: rgba(10, 28, 24, 0.46);
  backdrop-filter: blur(8px);
}

.employee-modal {
  width: min(100%, 44rem);
  max-height: min(88vh, 50rem);
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-strong);
  box-shadow: var(--shadow-md);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0.15rem 0 0;
  font-size: 1.35rem;
}

.modal-eyebrow {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.modal-close {
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 999px;
  background: rgba(18, 62, 53, 0.08);
  color: var(--color-primary);
  cursor: pointer;
  font-weight: 800;
}

.employee-form {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
}

.modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media (max-width: 720px) {
  .modal-backdrop {
    padding: 0.75rem;
  }
}
</style>
