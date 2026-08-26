import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  RotateCcw,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { GameProps } from '../types'
import { MOVES_REQUIRED_FOR_INTERACTION } from '../types'

type GameStatus = 'playing' | 'won'
type Direction = 'up' | 'down' | 'left' | 'right'
type Point = { x: number; y: number }

const MAZE_WIDTH = 21
const MAZE_HEIGHT = 21

const DIRECTIONS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const START: Point = { x: 1, y: 1 }
const GOAL: Point = { x: MAZE_WIDTH - 2, y: MAZE_HEIGHT - 2 }

function createEmptyMaze() {
  return Array.from({ length: MAZE_HEIGHT }, () =>
    Array.from({ length: MAZE_WIDTH }, () => 0),
  )
}

function shuffledDirections() {
  const dirs: Point[] = [
    { x: 0, y: -2 },
    { x: 0, y: 2 },
    { x: -2, y: 0 },
    { x: 2, y: 0 },
  ]

  for (let index = dirs.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = dirs[index]
    dirs[index] = dirs[swapIndex]
    dirs[swapIndex] = current
  }

  return dirs
}

function buildMaze(): number[][] {
  const maze = createEmptyMaze()
  const stack: Point[] = [{ ...START }]
  maze[START.y][START.x] = 1

  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const candidates: { next: Point; between: Point }[] = []

    for (const offset of shuffledDirections()) {
      const nextX = current.x + offset.x
      const nextY = current.y + offset.y

      if (
        nextX <= 0 ||
        nextX >= MAZE_WIDTH - 1 ||
        nextY <= 0 ||
        nextY >= MAZE_HEIGHT - 1
      ) {
        continue
      }

      if (maze[nextY][nextX] === 1) {
        continue
      }

      candidates.push({
        next: { x: nextX, y: nextY },
        between: {
          x: current.x + offset.x / 2,
          y: current.y + offset.y / 2,
        },
      })
    }

    if (candidates.length === 0) {
      stack.pop()
      continue
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    maze[pick.between.y][pick.between.x] = 1
    maze[pick.next.y][pick.next.x] = 1
    stack.push(pick.next)
  }

  maze[GOAL.y][GOAL.x] = 1
  return maze
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

export function MazeGame({ onInteraction }: GameProps) {
  const [maze, setMaze] = useState<number[][]>(() => createEmptyMaze())
  const [player, setPlayer] = useState<Point>({ ...START })
  const [visitedCells, setVisitedCells] = useState<Set<string>>(
    () => new Set([`${START.x}:${START.y}`]),
  )
  const [moves, setMoves] = useState(0)
  const [status, setStatus] = useState<GameStatus>('playing')

  const moveCountRef = useRef(0)
  const interactionReportedRef = useRef(false)

  useEffect(() => {
    setMaze(buildMaze())
  }, [])

  function reportInteraction() {
    moveCountRef.current += 1
    if (
      !interactionReportedRef.current &&
      moveCountRef.current >= MOVES_REQUIRED_FOR_INTERACTION
    ) {
      interactionReportedRef.current = true
      onInteraction?.()
    }
  }

  const movePlayer = useCallback(
    (direction: Direction) => {
      if (status !== 'playing') return

      const movement = DIRECTIONS[direction]
      const next = {
        x: player.x + movement.x,
        y: player.y + movement.y,
      }

      if (
        next.x < 0 ||
        next.x >= MAZE_WIDTH ||
        next.y < 0 ||
        next.y >= MAZE_HEIGHT
      ) {
        return
      }

      if (maze[next.y][next.x] === 0) {
        return
      }

      setPlayer(next)
      setVisitedCells((currentVisited) => {
        const nextVisited = new Set(currentVisited)
        nextVisited.add(`${next.x}:${next.y}`)
        return nextVisited
      })
      setMoves((current) => current + 1)
      reportInteraction()

      if (next.x === GOAL.x && next.y === GOAL.y) {
        setStatus('won')
      }
    },
    [maze, player, status],
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return

      const keyDirections: Record<string, Direction> = {
        ArrowUp: 'up',
        w: 'up',
        ArrowDown: 'down',
        s: 'down',
        ArrowLeft: 'left',
        a: 'left',
        ArrowRight: 'right',
        d: 'right',
      }

      const direction = keyDirections[event.key]

      event.preventDefault()
      movePlayer(direction)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [movePlayer])

  function startNewMaze() {
    setMaze(buildMaze())
    setPlayer({ ...START })
    setVisitedCells(new Set([`${START.x}:${START.y}`]))
    setMoves(0)
    setStatus('playing')
    moveCountRef.current = 0
    interactionReportedRef.current = false
  }

  return (
    <section className="rise-in w-full">
      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_12rem] lg:gap-10">
        <div className="mx-auto w-full max-w-140">
          <div
            role="grid"
            aria-label="Labyrintbrett. Nå den grønne målbrikken. Bruk piltaster eller WASD for å flytte deg."
            className="mx-auto grid w-full max-w-120 gap-0 rounded-2xl border border-slate-700 bg-slate-800 p-1 shadow-lg"
            style={{
              gridTemplateColumns: `repeat(${MAZE_WIDTH}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: MAZE_WIDTH * MAZE_HEIGHT }, (_, index) => {
              const x = index % MAZE_WIDTH
              const y = Math.floor(index / MAZE_WIDTH)

              const isWall = maze[y][x] === 0
              const isGoal = x === GOAL.x && y === GOAL.y
              const isPlayer = x === player.x && y === player.y
              const isVisited = visitedCells.has(`${x}:${y}`)

              return (
                <div
                  key={`${x}-${y}`}
                  className={`relative aspect-square rounded-[2px] ${
                    isWall
                      ? 'bg-slate-900 dark:bg-slate-950'
                      : 'bg-slate-200 dark:bg-slate-700'
                  } ${isGoal ? 'bg-emerald-600 dark:bg-emerald-500' : ''} ${
                    isPlayer ? 'bg-amber-400 dark:bg-amber-500' : ''
                  }`}
                >
                  {isGoal && !isPlayer ? (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="h-3.5 w-3.5 rounded-sm border border-emerald-100/80 bg-emerald-300/90 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" />
                    </span>
                  ) : null}

                  {isPlayer ? (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="h-3.5 w-3.5 rounded-full border border-amber-100/90 bg-amber-100 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" />
                    </span>
                  ) : null}

                  {!isWall && isVisited && !isPlayer && !isGoal ? (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/90 dark:bg-indigo-300/90" />
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={startNewMaze}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 font-semibold text-card-foreground transition-colors hover:bg-accent"
            >
              <RotateCcw className="h-4 w-4" />
              Ny labyrint
            </button>
            <p className="rounded-md border border-border bg-muted/50 px-4 py-2 text-center text-sm font-medium text-muted-foreground sm:text-left">
              {status === 'won'
                ? `Løst på ${moves} trekk`
                : `Trekk: ${moves}`}
            </p>
          </div>

          {status === 'won' ? (
            <p className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Bra løst. Du fant veien ut av labyrinten.
            </p>
          ) : null}
        </div>

        <aside className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <h3 className="text-base font-semibold text-card-foreground">
            Kontroller
          </h3>
          <p className="mt-2">Flytt med piltaster eller WASD.</p>
          <p className="mt-1">Nå den grønne brikken for å vinne.</p>

          <div className="mx-auto mt-4 grid w-fit grid-cols-3 gap-2">
            <button
              type="button"
              aria-label="Flytt opp"
              onClick={() => movePlayer('up')}
              className="col-start-2 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-card-foreground transition-colors hover:bg-accent"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Flytt til venstre"
              onClick={() => movePlayer('left')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-card-foreground transition-colors hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Flytt ned"
              onClick={() => movePlayer('down')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-card-foreground transition-colors hover:bg-accent"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Flytt til høyre"
              onClick={() => movePlayer('right')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-card-foreground transition-colors hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </div>
    </section>
  )
}
