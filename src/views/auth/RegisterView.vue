<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const passwordConfirmation = ref('')
const localError = ref('')

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  bsn: '',
  password: '',
})

const submitError = computed(() => localError.value || authStore.error)

async function handleSubmit() {
  localError.value = ''

  if (form.password !== passwordConfirmation.value) {
    localError.value = 'De wachtwoorden komen niet overeen.'
    return
  }

  try {
    await authStore.register({ ...form })
    await router.push({
      name: 'login',
      query: {
        registered: '1',
        email: form.email,
      },
    })
  } catch {
    return
  }
}
</script>

<template>
  <div class="page-stack">
    <AppCard
      title="Registreren"
      subtitle="Nieuwe klanten starten altijd zonder rekeningen en wachten daarna op employee approval."
    >
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="inline-form-row">
          <AppInput v-model="form.firstName" label="Voornaam" placeholder="Thijs" />
          <AppInput v-model="form.lastName" label="Achternaam" placeholder="Jansen" />
        </div>

        <AppInput v-model="form.email" label="E-mail" placeholder="thijs@example.com" />
        <div class="inline-form-row">
          <AppInput v-model="form.phoneNumber" label="Telefoonnummer" placeholder="+31612345678" />
          <AppInput
            v-model="form.bsn"
            label="BSN"
            placeholder="123456789"
            hint="Verwacht 9 cijfers volgens de backend-validatie."
          />
        </div>
        <div class="inline-form-row">
          <AppInput v-model="form.password" label="Wachtwoord" type="password" placeholder="Minimaal 8 tekens" />
          <AppInput
            v-model="passwordConfirmation"
            label="Herhaal wachtwoord"
            type="password"
            placeholder="Voer hetzelfde wachtwoord nogmaals in"
            :error="submitError"
          />
        </div>

        <div class="auth-utility">
          <span>Na registratie log je in en kom je eerst op de pending-pagina terecht.</span>
          <RouterLink class="text-link" to="/login">Terug naar login</RouterLink>
        </div>

        <AppButton type="submit" :disabled="authStore.isLoading" block>
          {{ authStore.isLoading ? 'Registratie wordt verstuurd...' : 'Registreren' }}
        </AppButton>
      </form>
    </AppCard>
  </div>
</template>
