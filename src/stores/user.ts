import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { UserProfile } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)

  const fullName = computed(() =>
    profile.value ? `${profile.value.firstName} ${profile.value.lastName}` : '',
  )

  function syncProfile(nextProfile: UserProfile | null) {
    profile.value = nextProfile
  }

  return {
    profile,
    fullName,
    syncProfile,
  }
})
