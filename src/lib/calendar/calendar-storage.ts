export interface CalendarState {
  openedWindows: {
    day: number
    openedAt: string // ISO date string
  }[]
  createdAt: string
}

const STORAGE_KEY = 'advent-calendar-state'

export function initializeCalendarState(now: Date): CalendarState {
  return {
    openedWindows: [],
    createdAt: now.toISOString(),
  }
}

export function getEncryptedCalendarState(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem(STORAGE_KEY)
}

export function setEncryptedCalendarState(encryptedData: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, encryptedData)
  }
}

export function isWindowOpened(day: number, state: CalendarState): boolean {
  return state.openedWindows.some((w) => w.day === day)
}

export function getLastOpenedWindow(
  state: CalendarState,
): { day: number; openedAt: string } | null {
  if (state.openedWindows.length === 0) {
    return null
  }

  // Return the most recently opened window
  return state.openedWindows[state.openedWindows.length - 1]
}

/**
 * `now` must come from a trusted (server) clock - never rely on the caller's
 * local `Date`, since a manipulated device clock would let a user unlock
 * windows early.
 */
export function isWindowUnlocked(
  day: number,
  state: CalendarState,
  now: Date,
): boolean {
  // Window 1 is always unlocked (can be opened on first visit)
  if (day === 1) {
    return true
  }

  // Check if previous window is opened
  const previousDay = day - 1
  const previousWindowOpened = isWindowOpened(previousDay, state)

  if (!previousWindowOpened) {
    return false
  }

  // Check if we're on a new calendar day since the last window was opened
  const lastOpened = getLastOpenedWindow(state)
  if (!lastOpened) {
    return false
  }

  const lastOpenedDate = new Date(lastOpened.openedAt)

  // Check if we're on a different calendar day (past midnight)
  return lastOpenedDate.toDateString() !== now.toDateString()
}

/** `now` must come from a trusted (server) clock, see `isWindowUnlocked`. */
export function getTimeUntilNextUnlock(
  state: CalendarState,
  now: Date,
): number | null {
  const lastOpened = getLastOpenedWindow(state)
  if (!lastOpened) {
    return null
  }

  const lastOpenedDate = new Date(lastOpened.openedAt)

  // If we're already on a new day, return 0
  if (lastOpenedDate.toDateString() !== now.toDateString()) {
    return 0
  }

  // Calculate time until next midnight
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  // Return hours remaining until midnight
  return (tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60)
}
