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
    localError.value = 'The passwords do not match.'
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
      title="Register"
      subtitle="New customers always start without accounts and then wait for employee approval."
    >
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="inline-form-row">
          <AppInput v-model="form.firstName" label="First name" placeholder="Thijs" />
          <AppInput v-model="form.lastName" label="Last name" placeholder="Jansen" />
        </div>

        <AppInput v-model="form.email" label="Email" placeholder="thijs@example.com" />
        <div class="inline-form-row">
          <AppInput v-model="form.phoneNumber" label="Phone number" placeholder="+31612345678" />
          <AppInput
            v-model="form.bsn"
            label="BSN"
            placeholder="123456789"
            hint="Expected to contain 9 digits based on backend validation."
          />
        </div>
        <div class="inline-form-row">
          <AppInput v-model="form.password" label="Password" type="password" placeholder="At least 8 characters" />
          <AppInput
            v-model="passwordConfirmation"
            label="Repeat password"
            type="password"
            placeholder="Enter the same password again"
            :error="submitError"
          />
        </div>

        <div class="auth-utility">
          <span>After registering, you sign in and first arrive on the pending page.</span>
          <RouterLink class="text-link" to="/login">Back to sign in</RouterLink>
        </div>

        <AppButton type="submit" :disabled="authStore.isLoading" block>
          {{ authStore.isLoading ? 'Submitting registration...' : 'Register' }}
        </AppButton>
      </form>
    </AppCard>
  </div>
</template>
