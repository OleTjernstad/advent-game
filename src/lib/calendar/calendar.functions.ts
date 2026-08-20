import { createServerFn } from '@tanstack/react-start'

import {
  coordsForCompletedState,
  decryptCalendarState,
  encryptCalendarState,
} from './calendar-crypto.server'
import {
  initializeCalendarState,
  isWindowOpened,
  isWindowUnlocked,
} from './calendar-storage'

import type { CalendarState } from './calendar-storage'

/** Lets the client detect a manipulated device clock; never trust it for unlock decisions. */
export const getServerTimeFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    return { now: new Date().toISOString() }
  },
)

/** Loads (or lazily creates) the encrypted calendar state without opening any window. */
export const ensureCalendarStateFn = createServerFn({ method: 'POST' })
  .validator((data: { encryptedData: string | null }) => data)
  .handler(async ({ data }) => {
    if (data.encryptedData) {
      const state = await decryptCalendarState(data.encryptedData)
      if (state) {
        return { encryptedData: data.encryptedData, state }
      }
    }

    const state = initializeCalendarState(new Date())
    const encryptedData = await encryptCalendarState(state)
    return { encryptedData, state }
  })

/**
 * Opens a window, but only if the server's own clock says it is unlocked.
 * The client's system clock is never trusted for this decision, so changing
 * the device date cannot be used to skip ahead in the calendar.
 */
export const openCalendarWindowFn = createServerFn({ method: 'POST' })
  .validator((data: { encryptedData: string | null; day: number }) => data)
  .handler(async ({ data }) => {
    const serverNow = new Date()

    let state = data.encryptedData
      ? await decryptCalendarState(data.encryptedData)
      : null
    if (!state) {
      state = initializeCalendarState(serverNow)
    }

    if (isWindowOpened(data.day, state)) {
      const encryptedData = await encryptCalendarState(state)
      return { success: true as const, encryptedData, state }
    }

    if (!isWindowUnlocked(data.day, state, serverNow)) {
      const encryptedData = await encryptCalendarState(state)
      return {
        success: false as const,
        encryptedData,
        state,
        error: 'Denne luken er ikke låst opp ennå.',
      }
    }

    const newState: CalendarState = {
      ...state,
      openedWindows: [
        ...state.openedWindows,
        { day: data.day, openedAt: serverNow.toISOString() },
      ].sort((a, b) => a.day - b.day),
    }

    const encryptedData = await encryptCalendarState(newState)
    return { success: true as const, encryptedData, state: newState }
  })

/**
 * Decrypts the provided encrypted calendar state and, if all 24 windows are
 * opened, returns the coordinates from the `COORDS` environment variable.
 */
export const revealCoordsFn = createServerFn({ method: 'POST' })
  .validator((data: { encryptedData: string }) => data)
  .handler(async ({ data }) => {
    const state = await decryptCalendarState(data.encryptedData)

    if (!state) {
      console.error('[revealCoords] Failed to decrypt calendar state')
      return null
    }

    const coords = coordsForCompletedState(state)
    if (!coords) {
      console.error('[revealCoords] Calendar not completed or COORDS not set')
      return null
    }

    return coords
  })
