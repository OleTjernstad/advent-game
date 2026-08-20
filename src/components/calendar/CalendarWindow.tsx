import { Gift, Lock, Star } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

interface CalendarWindowProps {
  day: number
  isUnlocked: boolean
  isOpened: boolean
  onOpen: () => Promise<boolean>
}

export function CalendarWindow({
  day,
  isUnlocked,
  isOpened,
  onOpen,
}: CalendarWindowProps) {
  const [isFlipping, setIsFlipping] = useState(false)
  const navigate = useNavigate()

  const handleClick = async () => {
    if (isOpened) {
      navigate({ to: '/calendar/window/$day', params: { day: String(day) } })
      return
    }
    if (!isUnlocked) return

    setIsFlipping(true)
    // Wait for both the flip animation and the server's authoritative
    // decision (it may reject if unlocking was based on a manipulated clock).
    const [success] = await Promise.all([
      onOpen(),
      new Promise((resolve) => setTimeout(resolve, 600)),
    ])
    setIsFlipping(false)

    if (success) {
      navigate({ to: '/calendar/window/$day', params: { day: String(day) } })
    }
  }

  return (
    <div className="perspective-1000 aspect-square">
      <div
        className={`transform-style-3d duration-600 relative h-full w-full cursor-pointer transition-transform ${
          isOpened || isFlipping ? 'rotate-y-180' : ''
        }`}
        onClick={handleClick}
      >
        {/* Front of window */}
        <div
          className={`backface-hidden absolute inset-0 rounded-lg border-2 transition-all duration-300 ${
            isOpened
              ? 'border-[#d4af37]/30'
              : isUnlocked
                ? 'border-[#d4af37] shadow-lg shadow-[#d4af37]/20 hover:scale-105 hover:shadow-xl hover:shadow-[#d4af37]/30'
                : 'border-[#4a5f7a]/50'
          } ${
            isOpened
              ? 'bg-[#1a3a2e]/30'
              : isUnlocked
                ? 'bg-linear-to-br from-[#8b2635] to-[#5a1623]'
                : 'bg-[#2a3f5a]/50'
          }`}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
            {!isUnlocked && (
              <Lock className="mb-1 h-4 w-4 text-[#4a5f7a] md:h-6 md:w-6" />
            )}
            <span
              className={`text-2xl font-bold md:text-4xl ${
                isUnlocked ? 'text-[#f4e4c1]' : 'text-[#4a5f7a]'
              }`}
            >
              {day}
            </span>
            {isUnlocked && !isOpened && (
              <Star className="mt-1 h-3 w-3 animate-pulse text-[#d4af37] md:h-4 md:w-4" />
            )}
          </div>

          {/* Decorative corners */}
          {isUnlocked && !isOpened && (
            <>
              <div className="absolute top-1 left-1 h-2 w-2 border-t-2 border-l-2 border-[#d4af37]" />
              <div className="absolute top-1 right-1 h-2 w-2 border-t-2 border-r-2 border-[#d4af37]" />
              <div className="absolute bottom-1 left-1 h-2 w-2 border-b-2 border-l-2 border-[#d4af37]" />
              <div className="absolute right-1 bottom-1 h-2 w-2 border-r-2 border-b-2 border-[#d4af37]" />
            </>
          )}
        </div>

        {/* Back of window */}
        <div className="backface-hidden rotate-y-180 absolute inset-0 flex items-center justify-center rounded-lg border-2 border-[#d4af37] bg-linear-to-br from-[#1a3a2e] to-[#0f2419]">
          <Gift className="h-8 w-8 text-[#d4af37] md:h-12 md:w-12" />
        </div>
      </div>
    </div>
  )
}
