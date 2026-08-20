import { env } from '#/env'

import type { CalendarState } from './calendar-storage'

const ENCRYPTION_KEY = env.CALENDAR_ENCRYPTION_KEY || 'advent-calendar-2024-secure'
const ENCRYPTION_SALT = env.CALENDAR_ENCRYPTION_SALT || 'advent-salt-2024'

async function deriveKey(usage: 'encrypt' | 'decrypt') {
  const encoder = new TextEncoder()

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(ENCRYPTION_SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage],
  )
}

export async function encryptCalendarState(
  state: CalendarState,
): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(JSON.stringify(state))

    const key = await deriveKey('encrypt')

    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer,
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encryptedBuffer), iv.length)

    return Buffer.from(combined).toString('base64')
  } catch (error) {
    console.error('[calendar] Encryption failed:', error)
    throw new Error('Failed to encrypt calendar state')
  }
}

export async function decryptCalendarState(
  encryptedData: string,
): Promise<CalendarState | null> {
  try {
    const combined = Buffer.from(encryptedData, 'base64')

    // Extract IV and encrypted data
    const iv = combined.subarray(0, 12)
    const encryptedBuffer = combined.subarray(12)

    const key = await deriveKey('decrypt')

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedBuffer,
    )

    const decoder = new TextDecoder()
    const state = JSON.parse(decoder.decode(decryptedBuffer)) as CalendarState

    if (!Array.isArray(state.openedWindows) || !state.createdAt) {
      console.error('[calendar] Invalid calendar state structure')
      return null
    }

    return state
  } catch (error) {
    console.error('[calendar] Decryption failed:', error)
    return null
  }
}

/**
 * Returns the reward coordinates only when every one of the 24 windows has
 * been opened in the provided (already decrypted) calendar state.
 */
export function coordsForCompletedState(state: CalendarState): string | null {
  if (!Array.isArray(state.openedWindows) || state.openedWindows.length < 24) {
    return null
  }

  return env.COORDS || null
}
