import { Gift, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'

import { getEncryptedCalendarState } from '#/lib/calendar/calendar-storage'
import { revealCoordsFn } from '#/lib/calendar/calendar.functions'

interface CompletionModalProps {
  isOpen: boolean
}

export function CompletionModal({ isOpen }: CompletionModalProps) {
  const [coords, setCoords] = useState<string | null>(null)
  const revealCoords = useServerFn(revealCoordsFn)

  useEffect(() => {
    const load = async () => {
      const encryptedData = getEncryptedCalendarState()
      const res = await revealCoords({ data: { encryptedData: encryptedData || '' } })
      setCoords(res || null)
    }
    if (isOpen) {
      load()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in relative w-full max-w-lg rounded-2xl border-4 border-[#d4af37] bg-linear-to-br from-[#8b2635] to-[#5a1623] p-8 shadow-2xl shadow-[#d4af37]/20 duration-500 md:p-12">
        {/* Decorative corners */}
        <div className="absolute top-2 left-2 h-6 w-6 border-t-4 border-l-4 border-[#d4af37]" />
        <div className="absolute top-2 right-2 h-6 w-6 border-t-4 border-r-4 border-[#d4af37]" />
        <div className="absolute bottom-2 left-2 h-6 w-6 border-b-4 border-l-4 border-[#d4af37]" />
        <div className="absolute right-2 bottom-2 h-6 w-6 border-r-4 border-b-4 border-[#d4af37]" />

        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <Gift className="h-20 w-20 animate-bounce text-[#d4af37]" />
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 animate-pulse text-[#f4e4c1]" />
              <Sparkles className="delay-150 absolute -bottom-1 -left-1 h-6 w-6 animate-pulse text-[#f4e4c1]" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif text-4xl font-bold text-[#f4e4c1] md:text-5xl">
              Gratulerer!
            </h2>
            <p className="text-xl text-[#d4af37]">
              Du har fullført adventskalenderen!
            </p>
          </div>

          <div className="rounded-lg border border-[#d4af37]/30 bg-[#1a3a2e]/50 p-6 backdrop-blur-sm">
            <p className="leading-relaxed text-[#f4e4c1]">
              Alle 24 luker er åpnet! Takk for at du ble med oss på denne
              festlige reisen. Vi ønsker deg en fantastisk høytid fylt med
              glede og varme.
            </p>
            {coords ? (
              <p className="mt-4 font-bold text-[#d4af37]">
                Cachen kan dere finne her: <br />
                <strong>{coords}</strong>
              </p>
            ) : null}
          </div>

          <div className="flex justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Sparkles
                key={i}
                className="h-5 w-5 animate-pulse text-[#d4af37]"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
