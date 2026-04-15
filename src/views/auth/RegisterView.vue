<script setup lang="ts">
import { reactive } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'customer' as 'customer' | 'employee',
})

async function handleSubmit() {
  try {
    await authStore.register({ ...form })
    await router.push('/dashboard')
  } catch {
    return
  }
}
</script>

<template>
  <div class="page-stack">
    <AppCard title="Create account" subtitle="Register a mock user now; switch the auth service to your backend later.">
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="inline-form-row">
          <AppInput v-model="form.firstName" label="First name" placeholder="Lena" />
          <AppInput v-model="form.lastName" label="Last name" placeholder="de Vries" />
        </div>

        <AppInput v-model="form.email" label="Email" placeholder="name@bank.dev" :error="authStore.error" />
        <AppInput v-model="form.password" label="Password" type="password" placeholder="Create a password" />

        <label class="input-group">
          <span class="input-label">Role</span>
          <select v-model="form.role" class="input-control">
            <option value="customer">Customer</option>
            <option value="employee">Employee</option>
          </select>
          <span class="input-hint">This controls route access and app navigation immediately.</span>
        </label>

        <div class="auth-utility">
          <span>Customer is the default path for the banking flow.</span>
          <RouterLink class="text-link" to="/login">Back to login</RouterLink>
        </div>

        <AppButton type="submit" :disabled="authStore.isLoading" block>
          {{ authStore.isLoading ? 'Creating account...' : 'Create mock account' }}
        </AppButton>
      </form>
    </AppCard>
  </div>
</template>
