import { useEffect, useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'

import {
  ensureCalendarStateFn,
  getServerTimeFn,
  openCalendarWindowFn,
} from '#/lib/calendar/calendar.functions'
import {
  getEncryptedCalendarState,
  getTimeUntilNextUnlock,
  isWindowOpened,
  isWindowUnlocked,
  setEncryptedCalendarState,
} from '#/lib/calendar/calendar-storage'

import type { CalendarState } from '#/lib/calendar/calendar-storage'

// If the device clock drifts from the server by more than this, warn the user.
const CLOCK_MISMATCH_THRESHOLD_MS = 5 * 60 * 1000
// How often to re-sync with the server clock, so a mid-session clock change is caught.
const CLOCK_SYNC_INTERVAL_MS = 60000

export function useCalendarState() {
  const [state, setState] = useState<CalendarState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeUntilUnlock, setTimeUntilUnlock] = useState<number | null>(null)
  const [isClockMismatched, setIsClockMismatched] = useState(false)
  // Server epoch + a monotonic clock reading taken at the same instant, so
  // "now" is derived from elapsed monotonic time rather than the device's
  // wall clock, which the user can change at any point during the session.
  const clockAnchorRef = useRef<{ serverEpochMs: number; perfMs: number } | null>(
    null,
  )

  const ensureCalendarState = useServerFn(ensureCalendarStateFn)
  const openCalendarWindow = useServerFn(openCalendarWindowFn)
  const getServerTime = useServerFn(getServerTimeFn)

  // Server-corrected "now" - never the raw, possibly-manipulated device clock.
  const trustedNow = () => {
    const anchor = clockAnchorRef.current
    if (!anchor) return new Date()
    return new Date(anchor.serverEpochMs + (performance.now() - anchor.perfMs))
  }

  const syncClock = async () => {
    const perfBefore = performance.now()
    const { now: serverNowIso } = await getServerTime()
    const perfAfter = performance.now()

    // Estimate the server epoch at `perfAfter`, correcting for round-trip latency.
    const roundTripMs = perfAfter - perfBefore
    const serverEpochMs = new Date(serverNowIso).getTime() + roundTripMs / 2
    clockAnchorRef.current = { serverEpochMs, perfMs: perfAfter }

    setIsClockMismatched(
      Math.abs(Date.now() - serverEpochMs) > CLOCK_MISMATCH_THRESHOLD_MS,
    )
  }

  useEffect(() => {
    async function loadState() {
      await syncClock()

      const encryptedData = getEncryptedCalendarState()
      const result = await ensureCalendarState({ data: { encryptedData } })

      setEncryptedCalendarState(result.encryptedData)
      setState(result.state)
      setIsLoading(false)
    }

    loadState()
  }, [])

  useEffect(() => {
    if (!state) return

    const updateTime = async () => {
      await syncClock()
      setTimeUntilUnlock(getTimeUntilNextUnlock(state, trustedNow()))
    }

    updateTime()
    const interval = setInterval(updateTime, CLOCK_SYNC_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [state])


  const openWindow = async (day: number): Promise<boolean> => {
    const encryptedData = getEncryptedCalendarState()
    const result = await openCalendarWindow({ data: { encryptedData, day } })

    setEncryptedCalendarState(result.encryptedData)
    setState(result.state)

    if (!result.success) {
      console.warn('[calendar]', result.error)
    }

    return result.success
  }

  const isOpened = (day: number): boolean => {
    if (!state) return false
    return isWindowOpened(day, state)
  }

  const isUnlocked = (day: number): boolean => {
    if (!state) return false
    return isWindowUnlocked(day, state, trustedNow())
  }

  return {
    state,
    isLoading,
    openWindow,
    isOpened,
    isUnlocked,
    timeUntilUnlock,
    isClockMismatched,
  }
}
