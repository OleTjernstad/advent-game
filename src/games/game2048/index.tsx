import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { GameProps } from '../types'
import { MOVES_REQUIRED_FOR_INTERACTION } from '../types'
import type { TouchEvent } from 'react'

const SIZE = 4
const TARGET_TILE = 2048

type Direction = 'up' | 'down' | 'left' | 'right'
type Outcome = 'playing' | 'won' | 'lost'

type MoveResult = {
  board: number[]
  moved: boolean
  scoreGain: number
}

function tileClass(value: number) {
  if (value === 0) return 'bg-muted/40 text-transparent'
  if (value === 2) return 'bg-card text-card-foreground'
  if (value === 4) return 'bg-accent text-card-foreground'
  if (value === 8) return 'bg-primary/80 text-primary-foreground'
  if (value === 16) return 'bg-primary text-primary-foreground'
  if (value === 32) return 'bg-orange-500 text-orange-950'
  if (value === 64) return 'bg-red-500 text-red-950'
  if (value === 128) return 'bg-emerald-500 text-emerald-950'
  if (value === 256) return 'bg-sky-500 text-sky-950'
  if (value === 512) return 'bg-indigo-500 text-indigo-100'
  if (value === 1024) return 'bg-violet-500 text-violet-100'
  return 'bg-destructive text-destructive-foreground'
}

function addRandomTile(board: number[]): number[] {
  const emptyIndexes = board.flatMap((value, index) =>
    value === 0 ? [index] : [],
  )
  if (!emptyIndexes.length) return board

  const index = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)]
  const value = Math.random() < 0.9 ? 2 : 4
  const next = [...board]
  next[index] = value
  return next
}

function createStartingBoard() {
  let board = Array.from({ length: SIZE * SIZE }, () => 0)
  board = addRandomTile(board)
  board = addRandomTile(board)
  return board
}

function mergeLine(values: number[]) {
  const compact = values.filter((value) => value !== 0)
  const merged: number[] = []
  let scoreGain = 0

  for (let index = 0; index < compact.length; index += 1) {
    const current = compact[index]
    const next = compact[index + 1]

    if (current !== 0 && current === next) {
      const value = current * 2
      merged.push(value)
      scoreGain += value
      index += 1
    } else {
      merged.push(current)
    }
  }

  while (merged.length < SIZE) {
    merged.push(0)
  }

  return { line: merged, scoreGain }
}

function lineIndexes(line: number, direction: Direction): number[] {
  if (direction === 'left') {
    return [0, 1, 2, 3].map((offset) => line * SIZE + offset)
  }
  if (direction === 'right') {
    return [3, 2, 1, 0].map((offset) => line * SIZE + offset)
  }
  if (direction === 'up') {
    return [0, 1, 2, 3].map((offset) => offset * SIZE + line)
  }
  return [3, 2, 1, 0].map((offset) => offset * SIZE + line)
}

function moveBoard(board: number[], direction: Direction): MoveResult {
  const next = [...board]
  let moved = false
  let scoreGain = 0

  for (let line = 0; line < SIZE; line += 1) {
    const indexes = lineIndexes(line, direction)
    const values = indexes.map((index) => next[index])
    const { line: merged, scoreGain: gain } = mergeLine(values)

    for (let index = 0; index < indexes.length; index += 1) {
      if (next[indexes[index]] !== merged[index]) {
        moved = true
      }
      next[indexes[index]] = merged[index]
    }

    scoreGain += gain
  }

  return { board: moved ? addRandomTile(next) : board, moved, scoreGain }
}

function hasTargetTile(board: number[]) {
  return board.some((value) => value >= TARGET_TILE)
}

function canMove(board: number[]) {
  if (board.some((value) => value === 0)) return true

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const current = board[row * SIZE + col]
      if (col + 1 < SIZE && board[row * SIZE + col + 1] === current) return true
      if (row + 1 < SIZE && board[(row + 1) * SIZE + col] === current)
        return true
    }
  }

  return false
}

export function Game2048({ onInteraction }: GameProps) {
  const [board, setBoard] = useState<number[]>(() =>
    Array.from({ length: SIZE * SIZE }, () => 0),
  )
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [outcome, setOutcome] = useState<Outcome>('playing')

  const movesMadeRef = useRef(0)
  const interactionReportedRef = useRef(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    setBoard(createStartingBoard())

    const savedBestScore = window.localStorage.getItem('2048-best-score')
    if (savedBestScore) setBestScore(Number(savedBestScore))
  }, [])

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score)
      window.localStorage.setItem('2048-best-score', String(score))
    }
  }, [bestScore, score])

  const maxTile = useMemo(() => Math.max(...board), [board])

  function reportInteraction() {
    movesMadeRef.current += 1
    if (
      !interactionReportedRef.current &&
      movesMadeRef.current >= MOVES_REQUIRED_FOR_INTERACTION
    ) {
      interactionReportedRef.current = true
      onInteraction?.()
    }
  }

  const attemptMove = useCallback(
    (direction: Direction) => {
      if (outcome !== 'playing') return

      const result = moveBoard(board, direction)
      if (!result.moved) return

      const nextScore = score + result.scoreGain
      const nextBoard = result.board
      const nextOutcome: Outcome = hasTargetTile(nextBoard)
        ? 'won'
        : canMove(nextBoard)
          ? 'playing'
          : 'lost'

      setBoard(nextBoard)
      setScore(nextScore)
      setOutcome(nextOutcome)
      reportInteraction()
    },
    [board, outcome, score],
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const keyDirections: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      }

      const direction = keyDirections[event.key]

      event.preventDefault()
      attemptMove(direction)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [attemptMove])

  function newGame() {
    setBoard(createStartingBoard())
    setScore(0)
    setOutcome('playing')
    movesMadeRef.current = 0
    interactionReportedRef.current = false
  }

  const statusText =
    outcome === 'won'
      ? 'Target reached'
      : outcome === 'lost'
        ? 'No more moves'
        : 'Merge matching tiles'

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0]

    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStartRef.current
    if (!start) return

    const touch = event.changedTouches[0]

    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const distance = Math.hypot(deltaX, deltaY)
    const minimumSwipeDistance = 24

    if (distance < minimumSwipeDistance) return

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      attemptMove(deltaX > 0 ? 'right' : 'left')
      return
    }

    attemptMove(deltaY > 0 ? 'down' : 'up')
  }

  return (
    <section className="rise-in w-full">
      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10">
        <div className="mx-auto w-full max-w-140">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
              <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Score
              </span>
              <strong className="mt-1 text-2xl text-card-foreground">
                {score}
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
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
              <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Max tile
              </span>
              <strong className="mt-1 text-2xl text-card-foreground">
                {maxTile}
              </strong>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-120 rounded-2xl border-4 border-foreground bg-foreground p-2 shadow-lg sm:p-3">
            <div
              className="grid h-full w-full gap-2"
              style={{
                gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))`,
                touchAction: 'none',
              }}
              role="grid"
              aria-label="2048 board"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {board.map((value, index) => (
                <div
                  key={index}
                  role="gridcell"
                  className={`flex aspect-square min-h-0 items-center justify-center rounded-md border border-border/50 text-2xl font-black sm:text-3xl ${tileClass(value)}`}
                >
                  {value === 0 ? '' : value}
                </div>
              ))}
            </div>

            {outcome !== 'playing' ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-foreground/78 p-6 text-center">
                <div className="max-w-sm rounded-xl border border-border/30 bg-card px-5 py-4 shadow-lg">
                  <p className="text-lg font-bold text-card-foreground">
                    {outcome === 'won' ? '2048 reached.' : 'Board locked.'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {outcome === 'won'
                      ? 'Start a new board to beat your score.'
                      : 'No adjacent matches left, try a new game.'}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div
            className="mx-auto mt-4 grid w-44 grid-cols-3 gap-2 lg:hidden"
            aria-label="Directional controls"
          >
            <span />
            <button
              type="button"
              onClick={() => attemptMove('up')}
              className="flex aspect-square items-center justify-center border border-border bg-card text-card-foreground active:bg-accent"
              aria-label="Move up"
            >
              <ChevronUp />
            </button>
            <span />
            <button
              type="button"
              onClick={() => attemptMove('left')}
              className="flex aspect-square items-center justify-center border border-border bg-card text-card-foreground active:bg-accent"
              aria-label="Move left"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => attemptMove('down')}
              className="flex aspect-square items-center justify-center border border-border bg-card text-card-foreground active:bg-accent"
              aria-label="Move down"
            >
              <ChevronDown />
            </button>
            <button
              type="button"
              onClick={() => attemptMove('right')}
              className="flex aspect-square items-center justify-center border border-border bg-card text-card-foreground active:bg-accent"
              aria-label="Move right"
            >
              <ChevronRight />
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Use arrow keys or WASD, or swipe on mobile.
          </p>
        </div>

        <aside
          className="grid grid-cols-2 gap-3 lg:grid-cols-1"
          aria-label="2048 status and controls"
        >
          <div className="col-span-2 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Goal
            </span>
            <strong className="text-2xl text-card-foreground">
              {TARGET_TILE}
            </strong>
          </div>

          <button
            type="button"
            onClick={newGame}
            className="col-span-2 inline-flex items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:-translate-y-0.5 hover:bg-sidebar-primary lg:col-span-1"
          >
            <RotateCcw size={17} />
            New game
          </button>

          <span className="col-span-2 min-h-6 text-xs font-semibold text-muted-foreground lg:col-span-1">
            {statusText}
          </span>
        </aside>
      </div>
    </section>
  )
}
