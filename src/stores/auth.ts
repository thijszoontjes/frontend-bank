import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { SESSION_STORAGE_KEY } from '@/constants/auth'
import { services } from '@/services'
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/auth'
import { toErrorMessage } from '@/utils/format'
import { readStorage, writeStorage } from '@/utils/storage'

import { useAccountStore } from './account'
import { useApprovalStore } from './approval'
import { useTransactionStore } from './transaction'
import { useUserStore } from './user'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(null)
  const initialized = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const user = computed(() => session.value?.user ?? null)
  const role = computed(() => user.value?.role ?? null)
  const isApproved = computed(() => user.value?.approved ?? false)
  const isPendingCustomer = computed(
    () => role.value === 'customer' && user.value?.approvalStatus === 'pending',
  )
  const isAuthenticated = computed(() => Boolean(session.value?.token))

  function applySession(nextSession: AuthSession | null) {
    session.value = nextSession
    writeStorage(SESSION_STORAGE_KEY, nextSession)

    const userStore = useUserStore()
    userStore.syncProfile(nextSession?.user ?? null)

    if (!nextSession) {
      useAccountStore().clear()
      useTransactionStore().clear()
      useApprovalStore().clear()
    }
  }

  async function hydrate() {
    if (initialized.value) {
      return
    }

    const storedSession = readStorage<AuthSession>(SESSION_STORAGE_KEY)

    try {
      if (storedSession?.token) {
        applySession(storedSession)
        const currentUser = await services.auth.getCurrentUser()
        applySession({
          ...storedSession,
          user: currentUser,
        })
      } else {
        applySession(null)
      }
    } catch {
      applySession(null)
    } finally {
      initialized.value = true
    }
  }

  async function login(payload: LoginPayload) {
    isLoading.value = true
    error.value = null

    try {
      const nextSession = await services.auth.login(payload)
      applySession(nextSession)
      return nextSession
    } catch (caughtError) {
      error.value = toErrorMessage(caughtError)
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function register(payload: RegisterPayload) {
    isLoading.value = true
    error.value = null

    try {
      return await services.auth.register(payload)
    } catch (caughtError) {
      error.value = toErrorMessage(caughtError)
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function refreshCurrentUser() {
    if (!session.value?.token) {
      return null
    }

    const nextUser = await services.auth.getCurrentUser()
    applySession({
      ...session.value,
      user: nextUser,
    })

    return nextUser
  }

  async function logout() {
    isLoading.value = true

    try {
      await services.auth.logout()
    } finally {
      applySession(null)
      isLoading.value = false
    }
  }

  return {
    session,
    initialized,
    isLoading,
    error,
    user,
    role,
    isApproved,
    isPendingCustomer,
    isAuthenticated,
    hydrate,
    login,
    register,
    refreshCurrentUser,
    logout,
  }
})
