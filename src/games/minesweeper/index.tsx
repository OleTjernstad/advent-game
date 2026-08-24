import { Bomb, Flag, RotateCcw, Timer, Trophy } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { GameProps } from '../types'
import { MOVES_REQUIRED_FOR_INTERACTION } from '../types'

const ROWS = 10
const COLUMNS = 10
const MINE_COUNT = 14

type GameStatus = 'playing' | 'won' | 'lost'
type InputMode = 'reveal' | 'flag'

type Cell = {
  row: number
  col: number
  isMine: boolean
  isFlagged: boolean
  isRevealed: boolean
  adjacentMines: number
}

function createEmptyBoard(): Cell[] {
  return Array.from({ length: ROWS * COLUMNS }, (_, index) => ({
    row: Math.floor(index / COLUMNS),
    col: index % COLUMNS,
    isMine: false,
    isFlagged: false,
    isRevealed: false,
    adjacentMines: 0,
  }))
}

function toIndex(row: number, col: number) {
  return row * COLUMNS + col
}

function neighborsOf(index: number): number[] {
  const row = Math.floor(index / COLUMNS)
  const col = index % COLUMNS
  const neighbors: number[] = []

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue
      const nextRow = row + dy
      const nextCol = col + dx
      if (nextRow < 0 || nextRow >= ROWS || nextCol < 0 || nextCol >= COLUMNS) {
        continue
      }
      neighbors.push(toIndex(nextRow, nextCol))
    }
  }

  return neighbors
}

function plantMines(emptyBoard: Cell[], safeIndex: number): Cell[] {
  const board = emptyBoard.map((cell) => ({ ...cell }))
  const mineIndexes: number[] = []

  while (mineIndexes.length < MINE_COUNT) {
    const index = Math.floor(Math.random() * board.length)
    if (index === safeIndex || mineIndexes.includes(index)) continue
    mineIndexes.push(index)
    board[index].isMine = true
  }

  for (let index = 0; index < board.length; index += 1) {
    if (board[index].isMine) continue
    const count = neighborsOf(index).reduce(
      (sum, neighborIndex) => sum + (board[neighborIndex].isMine ? 1 : 0),
      0,
    )
    board[index].adjacentMines = count
  }

  return board
}

function revealArea(board: Cell[], startIndex: number): Cell[] {
  const nextBoard = board.map((cell) => ({ ...cell }))
  const queue = [startIndex]
  const seen = new Set<number>()

  while (queue.length > 0) {
    const index = queue.shift()
    if (index === undefined || seen.has(index)) continue
    seen.add(index)

    const cell = nextBoard[index]
    if (cell.isFlagged || cell.isRevealed) continue

    cell.isRevealed = true

    if (cell.isMine || cell.adjacentMines > 0) continue

    for (const neighborIndex of neighborsOf(index)) {
      const neighbor = nextBoard[neighborIndex]
      if (!neighbor.isRevealed && !neighbor.isFlagged) {
        queue.push(neighborIndex)
      }
    }
  }

  return nextBoard
}

function revealAllMines(board: Cell[]): Cell[] {
  return board.map((cell) =>
    cell.isMine ? { ...cell, isRevealed: true, isFlagged: false } : cell,
  )
}

function isWin(board: Cell[]) {
  return board.every((cell) => cell.isMine || cell.isRevealed)
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function numberClass(adjacency: number) {
  switch (adjacency) {
    case 1:
      return 'text-blue-600 dark:text-blue-400'
    case 2:
      return 'text-emerald-600 dark:text-emerald-400'
    case 3:
      return 'text-red-600 dark:text-red-400'
    case 4:
      return 'text-indigo-600 dark:text-indigo-400'
    case 5:
      return 'text-orange-600 dark:text-orange-400'
    case 6:
      return 'text-cyan-600 dark:text-cyan-400'
    case 7:
      return 'text-violet-700 dark:text-violet-400'
    case 8:
      return 'text-zinc-700 dark:text-zinc-300'
    default:
      return ''
  }
}

export function MinesweeperGame({ onInteraction }: GameProps) {
  const [board, setBoard] = useState<Cell[]>(() => createEmptyBoard())
  const [status, setStatus] = useState<GameStatus>('playing')
  const [hasStarted, setHasStarted] = useState(false)
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [inputMode, setInputMode] = useState<InputMode>('reveal')
  const [wins, setWins] = useState(0)
  const [bestTime, setBestTime] = useState<number | null>(null)

  const interactionCountRef = useRef(0)
  const interactionReportedRef = useRef(false)

  const flaggedCount = useMemo(
    () => board.filter((cell) => cell.isFlagged).length,
    [board],
  )

  const bombsLeft = Math.max(0, MINE_COUNT - flaggedCount)

  useEffect(() => {
    const savedBestTime = window.localStorage.getItem('minesweeper-best-time')
    if (savedBestTime) {
      const parsed = Number(savedBestTime)
      if (Number.isFinite(parsed)) setBestTime(parsed)
    }
  }, [])

  useEffect(() => {
    if (!hasStarted || status !== 'playing') return

    const timer = window.setInterval(() => {
      setSecondsElapsed((seconds) => seconds + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [hasStarted, status])

  useEffect(() => {
    if (status !== 'won') return

    setWins((count) => count + 1)
    if (bestTime === null || secondsElapsed < bestTime) {
      setBestTime(secondsElapsed)
      window.localStorage.setItem('minesweeper-best-time', String(secondsElapsed))
    }
  }, [bestTime, secondsElapsed, status])

  function reportInteraction() {
    interactionCountRef.current += 1
    if (
      !interactionReportedRef.current &&
      interactionCountRef.current >= MOVES_REQUIRED_FOR_INTERACTION
    ) {
      interactionReportedRef.current = true
      onInteraction?.()
    }
  }

  function startNewGame() {
    setBoard(createEmptyBoard())
    setStatus('playing')
    setHasStarted(false)
    setSecondsElapsed(0)
    setInputMode('reveal')
    interactionCountRef.current = 0
    interactionReportedRef.current = false
  }

  function applyReveal(index: number) {
    if (status !== 'playing') return

    const activeBoard = hasStarted ? board : plantMines(board, index)
    const currentCell = activeBoard[index]

    if (currentCell.isFlagged || currentCell.isRevealed) return

    if (!hasStarted) setHasStarted(true)

    if (currentCell.isMine) {
      setBoard(revealAllMines(activeBoard))
      setStatus('lost')
      reportInteraction()
      return
    }

    const revealedBoard = revealArea(activeBoard, index)
    setBoard(revealedBoard)
    reportInteraction()

    if (isWin(revealedBoard)) {
      setStatus('won')
    }
  }

  function applyFlag(index: number) {
    if (status !== 'playing') return

    const target = board[index]
    if (target.isRevealed) return

    const nextBoard = board.map((cell, cellIndex) =>
      cellIndex === index ? { ...cell, isFlagged: !cell.isFlagged } : cell,
    )

    setBoard(nextBoard)
    reportInteraction()

    if (isWin(nextBoard)) {
      setStatus('won')
    }
  }

  function onCellPrimaryAction(index: number) {
    if (inputMode === 'flag') {
      applyFlag(index)
      return
    }
    applyReveal(index)
  }

  const statusText =
    status === 'won'
      ? 'Board cleared'
      : status === 'lost'
        ? 'Boom, that was a mine'
        : inputMode === 'flag'
          ? 'Flag mode enabled'
          : 'Reveal safe cells'

  return (
    <section className="rise-in w-full">
      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10">
        <div className="mx-auto w-full max-w-140">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
              <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Bombs left
              </span>
              <strong className="mt-1 inline-flex items-center gap-1 text-xl text-card-foreground">
                <Bomb size={16} />
                {bombsLeft}
              </strong>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
              <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Time
              </span>
              <strong className="mt-1 inline-flex items-center gap-1 text-xl text-card-foreground">
                <Timer size={16} />
                {formatTime(secondsElapsed)}
              </strong>
            </div>
            <button
              type="button"
              onClick={() =>
                setInputMode((mode) => (mode === 'reveal' ? 'flag' : 'reveal'))
              }
              className={`rounded-xl border p-3 text-center text-sm font-bold transition-colors ${
                inputMode === 'flag'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-card-foreground hover:bg-accent'
              }`}
            >
              {inputMode === 'flag' ? 'Flag mode' : 'Reveal mode'}
            </button>
          </div>

          <div className="relative rounded-2xl border-4 border-foreground bg-foreground p-2 shadow-lg sm:p-3">
            <div
              className="grid aspect-square w-full gap-1"
              style={{
                gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))`,
              }}
              role="grid"
              aria-label="Minesweeper board"
              onContextMenu={(event) => event.preventDefault()}
            >
              {board.map((cell, index) => {
                const showMine = cell.isRevealed && cell.isMine
                const showNumber = cell.isRevealed && !cell.isMine && cell.adjacentMines > 0
                const showFlag = !cell.isRevealed && cell.isFlagged

                return (
                  <button
                    key={`${cell.row}-${cell.col}`}
                    type="button"
                    role="gridcell"
                    onClick={() => onCellPrimaryAction(index)}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      applyFlag(index)
                    }}
                    className={`flex aspect-square min-h-0 items-center justify-center border text-sm font-black sm:text-base ${
                      cell.isRevealed
                        ? showMine
                          ? 'border-destructive bg-destructive/85 text-destructive-foreground'
                          : 'border-border bg-card text-card-foreground'
                        : 'border-border bg-muted text-card-foreground hover:bg-accent'
                    } ${!cell.isRevealed ? 'active:scale-[0.97]' : ''}`}
                    aria-label={
                      cell.isRevealed
                        ? showMine
                          ? 'Mine'
                          : cell.adjacentMines === 0
                            ? 'Empty cell'
                            : `${cell.adjacentMines} nearby mines`
                        : cell.isFlagged
                          ? 'Flagged cell'
                          : 'Hidden cell'
                    }
                  >
                    {showMine ? (
                      <Bomb size={14} />
                    ) : showFlag ? (
                      <Flag size={14} className="text-primary" />
                    ) : showNumber ? (
                      <span className={numberClass(cell.adjacentMines)}>
                        {cell.adjacentMines}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            {status !== 'playing' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/78 p-6 text-center">
                <div className="max-w-sm rounded-xl border border-border/30 bg-card px-5 py-4 shadow-lg">
                  <p className="text-lg font-bold text-card-foreground">
                    {status === 'won' ? 'Minefield solved.' : 'Mine triggered.'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {status === 'won'
                      ? `Completed in ${formatTime(secondsElapsed)}.`
                      : 'Try a new board and clear all safe cells.'}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Click to reveal, right-click to flag, or toggle flag mode for touch.
          </p>
        </div>

        <aside
          className="grid grid-cols-2 gap-3 lg:grid-cols-1"
          aria-label="Minesweeper status and controls"
        >
          <div className="col-span-2 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Board
            </span>
            <strong className="text-xl text-card-foreground">
              {ROWS} x {COLUMNS}
            </strong>
          </div>

          <div className="col-span-1 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Wins
            </span>
            <strong className="text-xl text-card-foreground">{wins}</strong>
          </div>

          <div className="col-span-1 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Best
            </span>
            <strong className="inline-flex items-center gap-1 text-xl text-card-foreground">
              <Trophy size={16} />
              {bestTime === null ? '--:--' : formatTime(bestTime)}
            </strong>
          </div>

          <button
            type="button"
            onClick={startNewGame}
            className="col-span-2 inline-flex items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:-translate-y-0.5 hover:bg-sidebar-primary lg:col-span-1"
          >
            <RotateCcw size={17} />
            New game
          </button>

          <span className="col-span-2 min-h-6 text-xs font-semibold text-muted-foreground lg:col-span-1">
            {statusText}
          </span>

          <span className="col-span-2 text-xs text-muted-foreground lg:col-span-1">
            Mines: {MINE_COUNT} total
          </span>
        </aside>
      </div>
    </section>
  )
}
