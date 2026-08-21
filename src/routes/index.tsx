import { AlertTriangle, Clock } from 'lucide-react'

import { CalendarWindow } from '#/components/calendar/CalendarWindow'
import { CompletionModal } from '#/components/calendar/CompletionModal'
import { Snowflakes } from '#/components/calendar/Snowflakes'
import ThemeToggle from '#/components/ThemeToggle'
import { createFileRoute } from '@tanstack/react-router'
import { useCalendarState } from '#/hooks/use-calendar-state'

export const Route = createFileRoute('/')({ component: AdventCalendar })

function formatTimeRemaining(hours: number | null): string {
  if (hours === null || hours <= 0) return ''

  const wholeHours = Math.floor(hours)
  const minutes = Math.floor((hours - wholeHours) * 60)

  if (wholeHours > 0) {
    return `${wholeHours}t ${minutes}min`
  }
  return `${minutes}min`
}

function AdventCalendar() {
  const {
    state,
    openWindow,
    isOpened,
    isUnlocked,
    timeUntilUnlock,
    isClockMismatched,
  } = useCalendarState()

  const openedCount = state?.openedWindows.length || 0
  const isCompleted = openedCount === 24

  const handleOpenWindow = (day: number) => openWindow(day)

  return (
    <div>
      <div className="sticky top-0 z-50 flex h-16 w-full items-center justify-end px-4">
        <ThemeToggle />
      </div>
      <Snowflakes />

      <CompletionModal isOpen={isCompleted} />

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {isClockMismatched && (
          <div className="mx-auto mb-6 flex max-w-2xl items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Klokken på enheten din stemmer ikke med serveren. Luker låses opp
              basert på serverens klokke, ikke din enhets klokke.
            </p>
          </div>
        )}

        <header className="mb-8 text-center md:mb-12">
          <h1 className="mb-2 font-serif text-4xl font-bold text-foreground md:text-6xl">
            Adventskalender
          </h1>
          <p className="text-lg text-primary md:text-xl">
            Åpne en luke hver dag frem til cachen åpnes!
          </p>
        </header>

        <div className="mx-auto grid max-w-6xl grid-cols-4 gap-3 md:grid-cols-6 md:gap-4">
          {Array.from({ length: 24 }, (_, i) => i + 1).map((day) => (
            <CalendarWindow
              key={day}
              day={day}
              isUnlocked={isUnlocked(day)}
              isOpened={isOpened(day)}
              onOpen={() => handleOpenWindow(day)}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="inline-block rounded-lg border border-border bg-card/50 px-6 py-3 backdrop-blur-sm">
            <p className="text-sm text-card-foreground">
              Luker åpnet:{' '}
              <span className="font-bold text-primary">{openedCount}</span> / 24
            </p>
          </div>

          {timeUntilUnlock !== null &&
            timeUntilUnlock > 0 &&
            openedCount < 24 && (
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 px-6 py-3 backdrop-blur-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-card-foreground">
                  Neste luke åpner om:{' '}
                  <span className="font-bold text-primary">
                    {formatTimeRemaining(timeUntilUnlock)}
                  </span>
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
