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
    ? 'Registratie gelukt. Log nu in met je nieuwe account en wacht daarna op goedkeuring.'
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
    <AppCard title="Inloggen" subtitle="Voer je e-mailadres en wachtwoord in.">
      <form class="auth-form" @submit.prevent="handleSubmit">
        <p v-if="registrationMessage" class="input-hint">{{ registrationMessage }}</p>

        <AppInput
          v-model="form.email"
          label="E-mail"
          placeholder="naam@bank.nl"
          autocomplete="username"
        />
        <AppInput
          v-model="form.password"
          label="Wachtwoord"
          type="password"
          placeholder="Voer je wachtwoord in"
          autocomplete="current-password"
          :error="authStore.error"
        />

        <div class="auth-utility">
          <span>Heb je nog geen account?</span>
          <RouterLink class="text-link" to="/register">Account registreren</RouterLink>
        </div>

        <AppButton type="submit" :disabled="authStore.isLoading" block>
          {{ authStore.isLoading ? 'Bezig met inloggen...' : 'Inloggen' }}
        </AppButton>
      </form>
    </AppCard>
  </div>
</template>
