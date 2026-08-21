import { Gift, Lock, Star } from 'lucide-react'

import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

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
              ? 'border-border'
              : isUnlocked
                ? 'border-primary/60 shadow-lg shadow-primary/10 hover:scale-105 hover:border-primary hover:shadow-xl hover:shadow-primary/20'
                : 'border-muted-foreground/30'
          } ${
            isOpened
              ? 'bg-muted/40'
              : isUnlocked
                ? 'bg-secondary'
                : 'bg-muted/60'
          }`}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
            {!isUnlocked && (
              <Lock className="mb-1 h-4 w-4 text-muted-foreground md:h-6 md:w-6" />
            )}
            <span
              className={`text-2xl font-bold md:text-4xl ${
                isUnlocked ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {day}
            </span>
            {isUnlocked && !isOpened && (
              <Star className="mt-1 h-3 w-3 animate-pulse text-primary md:h-4 md:w-4" />
            )}
          </div>

          {/* Decorative corners */}
          {isUnlocked && !isOpened && (
            <>
              <div className="absolute top-1 left-1 h-2 w-2 border-t-2 border-l-2 border-primary/70" />
              <div className="absolute top-1 right-1 h-2 w-2 border-t-2 border-r-2 border-primary/70" />
              <div className="absolute bottom-1 left-1 h-2 w-2 border-b-2 border-l-2 border-primary/70" />
              <div className="absolute right-1 bottom-1 h-2 w-2 border-r-2 border-b-2 border-primary/70" />
            </>
          )}
        </div>

        {/* Back of window */}
        <div className="backface-hidden rotate-y-180 absolute inset-0 flex items-center justify-center rounded-lg border-2 border-border bg-card">
          <Gift className="h-8 w-8 text-primary md:h-12 md:w-12" />
        </div>
      </div>
    </div>
  )
}
