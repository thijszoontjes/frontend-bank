<script setup lang="ts">
import { computed, reactive } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { resolveHomeRoute } from '@/router/session-home'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
  password: '',
})

const redirectTarget = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : null,
)

const registrationMessage = computed(() =>
  route.query.registered === '1'
    ? 'Registration completed. Sign in with your new account and wait for approval.'
    : '',
)

async function handleSubmit() {
  try {
    await authStore.login({
      email: form.email,
      password: form.password,
    })

    if (redirectTarget.value && !authStore.isPendingCustomer) {
      await router.push(redirectTarget.value)
      return
    }

    await router.push(resolveHomeRoute(authStore))
  } catch {
    return
  }
}
</script>

<template>
  <div class="page-stack">
    <AppCard title="Sign in" subtitle="Enter your email address and password.">
      <form class="auth-form" @submit.prevent="handleSubmit">
        <p v-if="registrationMessage" class="input-hint">{{ registrationMessage }}</p>

        <AppInput
          v-model="form.email"
          label="Email"
          placeholder="name@bank.com"
          autocomplete="username"
        />
        <AppInput
          v-model="form.password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          autocomplete="current-password"
          :error="authStore.error"
        />

        <div class="auth-utility">
          <span>Do you not have an account yet?</span>
          <RouterLink class="text-link" to="/register">Create account</RouterLink>
        </div>

        <AppButton type="submit" :disabled="authStore.isLoading" block>
          {{ authStore.isLoading ? 'Signing in...' : 'Sign in' }}
        </AppButton>
      </form>
    </AppCard>
  </div>
</template>
