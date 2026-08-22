import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pause,
  Play,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { GameProps } from '../types'
import { MOVES_REQUIRED_FOR_INTERACTION } from '../types'

const BOARD_SIZE = 20
const TICK_RATE = 125

type Point = { x: number; y: number }
type Direction = 'up' | 'down' | 'left' | 'right'

const STARTING_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
]

const DIRECTIONS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

function pointsMatch(first: Point, second: Point) {
  return first.x === second.x && first.y === second.y
}

function createFood(snake: Point[]): Point {
  const openCells: Point[] = []

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        openCells.push({ x, y })
      }
    }
  }

  return (
    openCells[Math.floor(Math.random() * openCells.length)] ?? { x: 1, y: 1 }
  )
}

export function SnakeGame({ onInteraction }: GameProps) {
  const [snake, setSnake] = useState<Point[]>(STARTING_SNAKE)
  const [food, setFood] = useState<Point>(() => createFood(STARTING_SNAKE))
  const [direction, setDirection] = useState<Direction>('right')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const directionRef = useRef<Direction>('right')
  const moveCountRef = useRef(0)
  const interactionReportedRef = useRef(false)

  useEffect(() => {
    const savedBestScore = window.localStorage.getItem('snake-best-score')
    if (savedBestScore) setBestScore(Number(savedBestScore))
  }, [])

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score)
      window.localStorage.setItem('snake-best-score', String(score))
    }
  }, [bestScore, score])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
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
      const nextDirection = keyDirections[event.key]

      if (
        Object.hasOwn(keyDirections, event.key) &&
        nextDirection !== OPPOSITE[directionRef.current]
      ) {
        event.preventDefault()
        directionRef.current = nextDirection
        setDirection(nextDirection)

        reportInteraction()

        setIsRunning(true)
      }

      if (event.key === ' ' && !isGameOver) {
        event.preventDefault()
        setIsRunning((running) => !running)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGameOver])

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

  useEffect(() => {
    if (!isRunning || isGameOver) return

    const interval = window.setInterval(() => {
      setSnake((currentSnake) => {
        const head = currentSnake[0]
        const movement = DIRECTIONS[directionRef.current]
        const nextHead = { x: head.x + movement.x, y: head.y + movement.y }
        const hitWall =
          nextHead.x < 0 ||
          nextHead.x >= BOARD_SIZE ||
          nextHead.y < 0 ||
          nextHead.y >= BOARD_SIZE
        const ateFood = pointsMatch(nextHead, food)
        const bodyToCheck = ateFood ? currentSnake : currentSnake.slice(0, -1)
        const hitSelf = bodyToCheck.some((segment) =>
          pointsMatch(segment, nextHead),
        )

        if (hitWall || hitSelf) {
          setIsRunning(false)
          setIsGameOver(true)
          return currentSnake
        }

        const nextSnake = [nextHead, ...currentSnake]
        if (ateFood) {
          setScore((currentScore) => currentScore + 1)
          setFood(createFood(nextSnake))
          return nextSnake
        }

        nextSnake.pop()
        return nextSnake
      })
    }, TICK_RATE)

    return () => window.clearInterval(interval)
  }, [food, isGameOver, isRunning])

  function startNewGame() {
    setSnake(STARTING_SNAKE)
    setFood(createFood(STARTING_SNAKE))
    setScore(0)
    setIsGameOver(false)
    setIsRunning(true)
    directionRef.current = 'right'
    setDirection('right')
    moveCountRef.current = 0
    interactionReportedRef.current = false
  }

  function changeDirection(nextDirection: Direction) {
    if (nextDirection === OPPOSITE[directionRef.current]) return
    directionRef.current = nextDirection
    reportInteraction()
    setDirection(nextDirection)
    if (!isGameOver) setIsRunning(true)
  }

  const status = isGameOver
    ? 'Game over'
    : isRunning
      ? 'In motion'
      : 'Ready to play'

  return (
    <section className="rise-in w-full">
      <div className="grid w-full items-center gap-6 lg:grid-cols-[minmax(0,1fr)_12rem] lg:gap-10">
        <div className="mx-auto w-full max-w-140">
          <div
            className="relative grid aspect-square w-full touch-none gap-px border-4 border-foreground bg-foreground p-1 shadow-lg"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
            }}
            aria-label={`Snake board. ${status}. Use arrow keys or WASD to move.`}
            role="grid"
          >
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
              const cell = {
                x: index % BOARD_SIZE,
                y: Math.floor(index / BOARD_SIZE),
              }
              const snakeIndex = snake.findIndex((segment) =>
                pointsMatch(segment, cell),
              )
              const isFood = pointsMatch(food, cell)
              return (
                <div
                  key={`${cell.x}-${cell.y}`}
                  className={`relative rounded-[3px] ${snakeIndex === 0 ? 'bg-primary' : snakeIndex > -1 ? 'bg-sidebar-primary' : 'bg-muted'}`}
                  role="gridcell"
                >
                  {isFood && (
                    <span className="absolute inset-[23%] rounded-full bg-destructive shadow-[0_0_0_3px_color-mix(in_oklab,var(--destructive)_16%,transparent)]" />
                  )}
                </div>
              )
            })}
            {!isRunning && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl border border-border/50 bg-foreground px-5 py-3 text-center text-background shadow-xl">
                  <strong className="block text-lg">
                    {isGameOver
                      ? 'That was a close one.'
                      : 'Ready when you are.'}
                  </strong>
                  <span className="text-xs text-white/75">
                    {isGameOver
                      ? `You scored ${score}.`
                      : 'Press start or use an arrow key.'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 lg:hidden">
            <span className="text-xs font-semibold text-muted-foreground">
              {status} · {direction} direction
            </span>
          </div>
        </div>

        <div
          className="mx-auto mt-6 grid w-44 grid-cols-3 gap-2 lg:hidden"
          aria-label="Direction controls"
        >
          <span />
          <button
            type="button"
            onClick={() => changeDirection('up')}
            className="flex aspect-square items-center justify-center border border-border text-card-foreground active:bg-muted"
            aria-label="Move up"
          >
            <ChevronUp />
          </button>
          <span />
          <button
            type="button"
            onClick={() => changeDirection('left')}
            className="flex aspect-square items-center justify-center border border-border text-card-foreground active:bg-muted"
            aria-label="Move left"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => changeDirection('down')}
            className="flex aspect-square items-center justify-center border border-border text-card-foreground active:bg-muted"
            aria-label="Move down"
          >
            <ChevronDown />
          </button>
          <button
            type="button"
            onClick={() => changeDirection('right')}
            className="flex aspect-square items-center justify-center border border-border text-card-foreground active:bg-muted"
            aria-label="Move right"
          >
            <ChevronRight />
          </button>
        </div>

        <aside
          className="grid grid-cols-2 gap-3 lg:grid-cols-1"
          aria-label="Game controls"
        >
          <div className="col-span-2 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Score
            </span>
            <strong className="text-3xl text-card-foreground">{score}</strong>
          </div>
          <div className="col-span-2 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Best
            </span>
            <strong className="flex items-center gap-1 text-2xl text-card-foreground">
              <Trophy size={17} />
              {bestScore}
            </strong>
          </div>
          <div className="col-span-2 flex gap-2 lg:col-span-1 lg:flex-col">
            <button
              type="button"
              onClick={startNewGame}
              className="inline-flex flex-1 items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:-translate-y-0.5 hover:bg-sidebar-primary"
            >
              {isGameOver ? <RotateCcw size={17} /> : <Play size={17} />}
              {isGameOver ? 'Play again' : 'Start game'}
            </button>
            <button
              type="button"
              onClick={() => setIsRunning((running) => !running)}
              disabled={isGameOver}
              className="inline-flex flex-1 items-center justify-center gap-2 border border-border px-4 py-2.5 text-sm font-bold text-card-foreground hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isRunning ? <Pause size={17} /> : <Play size={17} />}
              {isRunning ? 'Pause' : 'Resume'}
            </button>
          </div>
          <span className="col-span-2 hidden text-xs font-semibold text-muted-foreground lg:block">
            {status} · {direction} direction
          </span>
        </aside>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Arrow keys or WASD to move · Space to pause
      </p>
    </section>
  )
}
