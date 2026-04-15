<script setup lang="ts">
import { computed, reactive } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { demoCredentials } from '@/mocks/data/users'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  email: demoCredentials.customer.email,
  password: demoCredentials.customer.password,
})

const redirectTarget = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard',
)

function fillDemo(role: 'customer' | 'employee') {
  form.email = demoCredentials[role].email
  form.password = demoCredentials[role].password
}

async function handleSubmit() {
  try {
    await authStore.login({
      email: form.email,
      password: form.password,
    })

    await router.push(redirectTarget.value)
  } catch {
    return
  }
}
</script>

<template>
  <div class="page-stack">
    <AppCard title="Sign in" subtitle="Use a demo account or your own registered mock user to enter the app shell.">
      <form class="auth-form" @submit.prevent="handleSubmit">
        <AppInput
          v-model="form.email"
          label="Email"
          placeholder="name@bank.dev"
          autocomplete="username"
          :error="authStore.error"
        />
        <AppInput
          v-model="form.password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          autocomplete="current-password"
        />

        <div class="auth-utility">
          <span>Mock-first authentication with local session persistence.</span>
          <RouterLink class="text-link" to="/register">Create account</RouterLink>
        </div>

        <AppButton type="submit" :disabled="authStore.isLoading" block>
          {{ authStore.isLoading ? 'Signing in...' : 'Continue to workspace' }}
        </AppButton>
      </form>
    </AppCard>

    <AppCard title="Demo access" subtitle="Use the quick-fill actions below to test both role-based flows.">
      <div class="helper-list">
        <div class="helper-item">
          <div>
            <strong>Customer</strong>
            <div style="color: var(--color-text-muted); font-size: 0.92rem;">{{ demoCredentials.customer.email }}</div>
          </div>
          <AppButton variant="secondary" size="sm" @click="fillDemo('customer')">Use customer</AppButton>
        </div>
        <div class="helper-item">
          <div>
            <strong>Employee</strong>
            <div style="color: var(--color-text-muted); font-size: 0.92rem;">{{ demoCredentials.employee.email }}</div>
          </div>
          <AppButton variant="secondary" size="sm" @click="fillDemo('employee')">Use employee</AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
