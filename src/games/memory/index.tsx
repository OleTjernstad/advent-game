import { RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { GameProps } from '../types'
import { MOVES_REQUIRED_FOR_INTERACTION } from '../types'

type GameStatus = 'playing' | 'won'

type MemoryCard = {
  id: number
  pairId: number
  label: string
  isMatched: boolean
}

const PAIRS = ['KLOKKE', 'GAVE', 'TRE', 'STJERNE', 'GODTERI', 'VOTT']

function shuffle<T>(values: T[]): T[] {
  const next = [...values]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = next[index]
    next[index] = next[swapIndex]
    next[swapIndex] = current
  }

  return next
}

function createDeck(): MemoryCard[] {
  const pairCards = PAIRS.flatMap((label, pairId) => [
    { pairId, label },
    { pairId, label },
  ])

  return shuffle(pairCards).map((card, index) => ({
    id: index,
    pairId: card.pairId,
    label: card.label,
    isMatched: false,
  }))
}

export function MemoryGame({ onInteraction }: GameProps) {
  const [deck, setDeck] = useState<MemoryCard[]>([])
  const [flippedIds, setFlippedIds] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [status, setStatus] = useState<GameStatus>('playing')

  const hideTimeoutRef = useRef<number | null>(null)
  const turnCountRef = useRef(0)
  const interactionReportedRef = useRef(false)

  const matchedPairs = useMemo(() => {
    return new Set(
      deck.filter((card) => card.isMatched).map((card) => card.pairId),
    ).size
  }, [deck])

  const totalPairs = PAIRS.length

  const clearPendingHide = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const reportInteraction = useCallback(() => {
    turnCountRef.current += 1
    if (
      !interactionReportedRef.current &&
      turnCountRef.current >= MOVES_REQUIRED_FOR_INTERACTION
    ) {
      interactionReportedRef.current = true
      onInteraction?.()
    }
  }, [onInteraction])

  const startNewGame = useCallback(() => {
    clearPendingHide()
    setDeck(createDeck())
    setFlippedIds([])
    setMoves(0)
    setStatus('playing')
    turnCountRef.current = 0
    interactionReportedRef.current = false
  }, [clearPendingHide])

  useEffect(() => {
    startNewGame()
  }, [startNewGame])

  useEffect(() => {
    return () => clearPendingHide()
  }, [clearPendingHide])

  const flipCard = useCallback(
    (cardId: number) => {
      if (status !== 'playing') return
      if (flippedIds.length >= 2) return

      const card = deck.find((entry) => entry.id === cardId)
      if (!card || card.isMatched || flippedIds.includes(cardId)) return

      const nextFlipped = [...flippedIds, cardId]
      setFlippedIds(nextFlipped)

      if (nextFlipped.length < 2) return

      setMoves((current) => current + 1)
      reportInteraction()

      const first = deck.find((entry) => entry.id === nextFlipped[0])
      const second = deck.find((entry) => entry.id === nextFlipped[1])

      if (!first || !second) {
        setFlippedIds([])
        return
      }

      if (first.pairId === second.pairId) {
        setDeck((currentDeck) => {
          const nextDeck = currentDeck.map((entry) =>
            entry.pairId === first.pairId
              ? { ...entry, isMatched: true }
              : entry,
          )

          if (nextDeck.every((entry) => entry.isMatched)) {
            setStatus('won')
          }

          return nextDeck
        })
        setFlippedIds([])
        return
      }

      clearPendingHide()
      hideTimeoutRef.current = window.setTimeout(() => {
        setFlippedIds([])
      }, 700)
    },
    [clearPendingHide, deck, flippedIds, reportInteraction, status],
  )

  return (
    <section className="rise-in w-full">
      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10">
        <div className="mx-auto w-full max-w-140">
          <div
            className="mx-auto grid w-full max-w-120 gap-2 rounded-2xl border-2 border-border bg-muted/30 p-3"
            style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
            role="grid"
            aria-label="Memorybrett. Finn alle juleparene."
          >
            {deck.map((card) => {
              const isFlipped = flippedIds.includes(card.id) || card.isMatched

              return (
                <button
                  key={card.id}
                  type="button"
                  role="gridcell"
                  aria-label={isFlipped ? `${card.label}-kort` : 'Skjult kort'}
                  onClick={() => flipCard(card.id)}
                  className={`aspect-square rounded-lg border text-xs font-bold tracking-[0.08em] transition-colors sm:text-sm ${
                    isFlipped
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-card-foreground'
                      : 'border-border bg-card text-transparent hover:bg-accent/80'
                  } ${card.isMatched ? 'ring-2 ring-emerald-500/40' : ''}`}
                  disabled={status !== 'playing' || card.isMatched}
                >
                  {isFlipped ? card.label : 'SKJULT'}
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={startNewGame}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 font-semibold text-card-foreground transition-colors hover:bg-accent"
            >
              <RotateCcw className="h-4 w-4" />
              Nytt spill
            </button>
            <p className="rounded-md border border-border bg-muted/50 px-4 py-2 text-center text-sm font-medium text-muted-foreground sm:text-left">
              {status === 'won'
                ? `Løst på ${moves} trekk`
                : `Trekk: ${moves}`}
            </p>
          </div>

          {status === 'won' ? (
            <p className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              God hukommelse. Du fant alle parene.
            </p>
          ) : null}
        </div>

        <aside className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <h3 className="text-base font-semibold text-card-foreground">
            Slik spiller du
          </h3>
          <p className="mt-2">Snu to kort hver runde.</p>
          <p className="mt-1">Finn alle parene for å fullføre brettet.</p>
          <p className="mt-3 text-xs">
            Bildemotiv kan legges til senere ved å bytte ut kortetikettene.
          </p>
          <p className="mt-2 text-xs">
            Pairs: {matchedPairs}/{totalPairs}
          </p>
        </aside>
      </div>
    </section>
  )
}
