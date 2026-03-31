// ---------------------------------------------------------------------------
// Central store utilities — hydrate on login, reset on logout
// ---------------------------------------------------------------------------
import { useEffect } from 'react'
import { useAuthStore } from './authStore'
import { useUserStore } from './userStore'
import { useBillingStore } from './billingStore'
import { useNotificationsStore } from './notificationsStore'
import { useMetersStore } from './metersStore'

/**
 * Hydrate all domain stores when the user is authenticated.
 * Resets everything when the token disappears (logout / session expire).
 * Call this once near the app root (e.g. in App.tsx or MainLayout).
 */
export function useHydrateStores() {
  const token = useAuthStore((s) => s.accessToken)
  const isRestoring = useAuthStore((s) => s.isRestoring)

  useEffect(() => {
    if (isRestoring) return

    if (token) {
      // Kick off all initial fetches in parallel
      useUserStore.getState().fetch()
      useBillingStore.getState().fetch()
      useNotificationsStore.getState().fetch()
      useNotificationsStore.getState().fetchUnreadCount()
      useMetersStore.getState().fetch()
    } else {
      // Logged out — clear everything
      useUserStore.getState().reset()
      useBillingStore.getState().reset()
      useNotificationsStore.getState().reset()
      useMetersStore.getState().reset()
    }
  }, [token, isRestoring])
}

export { useAuthStore } from './authStore'
export { useUserStore } from './userStore'
export { useBillingStore } from './billingStore'
export { useNotificationsStore } from './notificationsStore'
export { useMetersStore } from './metersStore'
export { useRechargesStore } from './rechargesStore'
