import { Crosshair, RotateCcw, Timer, Trophy } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { GameProps } from '../types'
import { MOVES_REQUIRED_FOR_INTERACTION } from '../types'

const SPOT_COUNT = 9
const ROUND_SECONDS = 30
const POP_INTERVAL_MS = 950

type GameStatus = 'idle' | 'running' | 'ended'

function randomSpot(previousSpot: number | null) {
  let nextSpot = Math.floor(Math.random() * SPOT_COUNT)
  while (nextSpot === previousSpot) {
    nextSpot = Math.floor(Math.random() * SPOT_COUNT)
  }

  return nextSpot
}

export function WhackAMoleGame({ onInteraction }: GameProps) {
  const [activeSpot, setActiveSpot] = useState<number | null>(null)
  const [hitSpot, setHitSpot] = useState<number | null>(null)
  const [hitBurstKey, setHitBurstKey] = useState(0)
  const [missSpot, setMissSpot] = useState<number | null>(null)
  const [missFlashKey, setMissFlashKey] = useState(0)
  const [status, setStatus] = useState<GameStatus>('idle')
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const [bestScore, setBestScore] = useState(0)

  const clickCountRef = useRef(0)
  const interactionReportedRef = useRef(false)
  const hitFeedbackTimeoutRef = useRef<number | null>(null)
  const missFeedbackTimeoutRef = useRef<number | null>(null)
  const spotRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    return () => {
      if (hitFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(hitFeedbackTimeoutRef.current)
      }
      if (missFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(missFeedbackTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const savedBest = window.localStorage.getItem('whack-a-cache-best-score')
    if (savedBest) setBestScore(Number(savedBest))
  }, [])

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score)
      window.localStorage.setItem('whack-a-cache-best-score', String(score))
    }
  }, [bestScore, score])

  useEffect(() => {
    if (status !== 'running') return

    const timer = window.setInterval(() => {
      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          window.clearInterval(timer)
          setStatus('ended')
          setActiveSpot(null)
          return 0
        }

        return currentTime - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [status])

  useEffect(() => {
    if (status !== 'running') return

    setActiveSpot((currentSpot) => randomSpot(currentSpot))

    const popTimer = window.setInterval(() => {
      setActiveSpot((currentSpot) => randomSpot(currentSpot))
    }, POP_INTERVAL_MS)

    return () => window.clearInterval(popTimer)
  }, [status])

  function reportInteraction() {
    clickCountRef.current += 1
    if (
      !interactionReportedRef.current &&
      clickCountRef.current >= MOVES_REQUIRED_FOR_INTERACTION
    ) {
      interactionReportedRef.current = true
      onInteraction?.()
    }
  }

  const startRound = useCallback(() => {
    setScore(0)
    setMisses(0)
    setTimeLeft(ROUND_SECONDS)
    setActiveSpot(null)
    setHitSpot(null)
    setHitBurstKey(0)
    setMissSpot(null)
    setMissFlashKey(0)
    setStatus('running')
    clickCountRef.current = 0
    interactionReportedRef.current = false
  }, [])

  const onSpotClick = useCallback(
    (spotIndex: number) => {
      if (status !== 'running') return

      reportInteraction()

      if (spotIndex === activeSpot) {
        setScore((current) => current + 1)
        setHitSpot(spotIndex)
        setHitBurstKey((current) => current + 1)

        if (hitFeedbackTimeoutRef.current !== null) {
          window.clearTimeout(hitFeedbackTimeoutRef.current)
        }
        hitFeedbackTimeoutRef.current = window.setTimeout(() => {
          setHitSpot(null)
          hitFeedbackTimeoutRef.current = null
        }, 320)

        setActiveSpot((currentSpot) => randomSpot(currentSpot))
        return
      }

      setMisses((current) => current + 1)
      setMissSpot(spotIndex)
      setMissFlashKey((current) => current + 1)

      if (missFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(missFeedbackTimeoutRef.current)
      }
      missFeedbackTimeoutRef.current = window.setTimeout(() => {
        setMissSpot(null)
        missFeedbackTimeoutRef.current = null
      }, 220)

      const spotElement = spotRefs.current[spotIndex]
      spotElement?.animate(
        [
          { transform: 'translateX(0px)' },
          { transform: 'translateX(-3px)' },
          { transform: 'translateX(3px)' },
          { transform: 'translateX(-2px)' },
          { transform: 'translateX(2px)' },
          { transform: 'translateX(0px)' },
        ],
        {
          duration: 180,
          easing: 'ease-out',
        },
      )
    },
    [activeSpot, status],
  )

  const accuracy =
    score + misses > 0 ? Math.round((score / (score + misses)) * 100) : 0

  return (
    <section className="rise-in w-full">
      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10">
        <div className="mx-auto w-full max-w-140">
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
              <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Caches
              </span>
              <strong className="mt-1 text-2xl text-card-foreground">
                {score}
              </strong>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
              <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Misses
              </span>
              <strong className="mt-1 text-2xl text-card-foreground">
                {misses}
              </strong>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
              <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Accuracy
              </span>
              <strong className="mt-1 text-2xl text-card-foreground">
                {accuracy}%
              </strong>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
              <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Best
              </span>
              <strong className="mt-1 inline-flex items-center gap-1 text-2xl text-card-foreground">
                <Trophy size={16} />
                {bestScore}
              </strong>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-120 grid-cols-3 gap-3 rounded-2xl border-2 border-border bg-muted/30 p-3">
            {Array.from({ length: SPOT_COUNT }, (_, index) => {
              const isActive = activeSpot === index && status === 'running'
              const isHitSpot = hitSpot === index
              const isMissSpot = missSpot === index

              return (
                <button
                  key={index}
                  ref={(element) => {
                    spotRefs.current[index] = element
                  }}
                  type="button"
                  onClick={() => onSpotClick(index)}
                  className={`relative aspect-square overflow-hidden rounded-xl border transition-colors ${
                    isActive
                      ? 'border-emerald-500/70 bg-emerald-500/15'
                      : 'border-border bg-card hover:bg-accent'
                  }`}
                  aria-label={
                    isActive ? 'Active cache marker' : 'Empty cache spot'
                  }
                >
                  {isActive ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/70 bg-emerald-400/25 text-emerald-200 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]">
                        <Crosshair className="h-6 w-6" />
                      </span>
                    </span>
                  ) : null}

                  {isHitSpot ? (
                    <span
                      key={hitBurstKey}
                      className="pointer-events-none absolute inset-0"
                    >
                      <span className="absolute inset-3 animate-ping rounded-full border-2 border-amber-300/90" />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="rounded-full border border-amber-200/70 bg-amber-400/85 px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.08em] text-amber-950 shadow-md animate-bounce">
                          +1 cache
                        </span>
                      </span>
                    </span>
                  ) : null}

                  {isMissSpot ? (
                    <span
                      key={missFlashKey}
                      className="pointer-events-none absolute inset-0"
                    >
                      <span className="absolute inset-0 rounded-xl bg-red-500/18" />
                      <span className="absolute inset-2 rounded-lg border border-red-300/70 animate-pulse" />
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={startRound}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 font-semibold text-card-foreground transition-colors hover:bg-accent"
            >
              <RotateCcw className="h-4 w-4" />
              {status === 'running' ? 'Restart Round' : 'Start Round'}
            </button>
            <div className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-muted/50 px-4 py-2 text-sm font-semibold text-card-foreground sm:justify-start">
              <Timer className="h-4 w-4" />
              {status === 'running'
                ? `${timeLeft}s left`
                : `${ROUND_SECONDS}s round`}
            </div>
          </div>

          {status === 'ended' ? (
            <p className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Round over. You logged {score} caches.
            </p>
          ) : null}
        </div>

        <aside className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <h3 className="text-base font-semibold text-card-foreground">
            How to play
          </h3>
          <p className="mt-2">
            A cache signal appears in one grid spot at a time.
          </p>
          <p className="mt-1">Tap it before it moves to log the cache.</p>
          <p className="mt-1">Missed taps count as misses.</p>
        </aside>
      </div>
    </section>
  )
}
