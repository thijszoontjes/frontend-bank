import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { services } from '@/services'
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/auth'
import { toErrorMessage } from '@/utils/format'
import { readStorage, writeStorage } from '@/utils/storage'

import { useAccountStore } from './account'
import { useApprovalStore } from './approval'
import { useTransactionStore } from './transaction'
import { useUserStore } from './user'

const STORAGE_KEY = 'frontend-bank.session'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(null)
  const initialized = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const user = computed(() => session.value?.user ?? null)
  const role = computed(() => user.value?.role ?? null)
  const isAuthenticated = computed(() => Boolean(session.value?.token))

  function applySession(nextSession: AuthSession | null) {
    session.value = nextSession
    writeStorage(STORAGE_KEY, nextSession)

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

    const storedSession = readStorage<AuthSession>(STORAGE_KEY)

    if (storedSession) {
      applySession(storedSession)
      initialized.value = true
      return
    }

    try {
      const remoteSession = await services.auth.getCurrentSession()
      if (remoteSession) {
        applySession(remoteSession)
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
      const nextSession = await services.auth.register(payload)
      applySession(nextSession)
      return nextSession
    } catch (caughtError) {
      error.value = toErrorMessage(caughtError)
      throw caughtError
    } finally {
      isLoading.value = false
    }
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
    isAuthenticated,
    hydrate,
    login,
    register,
    logout,
  }
})
