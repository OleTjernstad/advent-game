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
import { useEffect, useState } from 'react'

import type { CalendarState } from '#/lib/calendar/calendar-storage'
import { useServerFn } from '@tanstack/react-start'

// If the device clock drifts from the server by more than this, warn the user.
const CLOCK_MISMATCH_THRESHOLD_MS = 5 * 60 * 1000

export function useCalendarState() {
  const [state, setState] = useState<CalendarState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeUntilUnlock, setTimeUntilUnlock] = useState<number | null>(null)
  const [clockOffsetMs, setClockOffsetMs] = useState(0)
  const [isClockMismatched, setIsClockMismatched] = useState(false)

  const ensureCalendarState = useServerFn(ensureCalendarStateFn)
  const openCalendarWindow = useServerFn(openCalendarWindowFn)
  const getServerTime = useServerFn(getServerTimeFn)

  // Server-corrected "now" - never the raw, possibly-manipulated device clock.
  const trustedNow = () => new Date(Date.now() + clockOffsetMs)

  useEffect(() => {
    async function loadState() {
      const clientBefore = Date.now()
      const { now: serverNowIso } = await getServerTime()
      const serverEpoch = new Date(serverNowIso).getTime()

      setClockOffsetMs(serverEpoch - clientBefore)
      setIsClockMismatched(
        Math.abs(clientBefore - serverEpoch) > CLOCK_MISMATCH_THRESHOLD_MS,
      )

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

    const updateTime = () => {
      setTimeUntilUnlock(getTimeUntilNextUnlock(state, trustedNow()))
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [state, clockOffsetMs])

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
