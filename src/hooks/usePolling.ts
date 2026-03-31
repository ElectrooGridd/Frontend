import { useEffect, useRef } from 'react'

/**
 * Calls `callback` on an interval, pausing when the tab is hidden.
 * Runs immediately on mount, then every `intervalMs`.
 * Cleans up on unmount or when deps change.
 */
export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  const savedCallback = useRef(callback)
  savedCallback.current = callback

  useEffect(() => {
    if (!enabled) return

    // Fire immediately
    savedCallback.current()

    let id: ReturnType<typeof setInterval> | null = null

    function start() {
      if (id) return
      id = setInterval(() => savedCallback.current(), intervalMs)
    }

    function stop() {
      if (id) {
        clearInterval(id)
        id = null
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        savedCallback.current() // refresh immediately on re-focus
        start()
      } else {
        stop()
      }
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs, enabled])
}
