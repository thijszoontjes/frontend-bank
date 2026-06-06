<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { services } from '@/services'
import type { EmployeeCreateCustomerPayload } from '@/types/user'
import { toErrorMessage } from '@/utils/format'

const router = useRouter()
const isSubmitting = ref(false)
const error = ref('')
const success = ref('')

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
          <AppButton variant="ghost" @click="router.push({ name: 'users' })">Back to users</AppButton>
        </div>
      </template>
    </AppCard>
  </div>
</template>
