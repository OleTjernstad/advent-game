import { Pause, Play, RotateCcw, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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

export function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>(STARTING_SNAKE)
  const [food, setFood] = useState<Point>(() => createFood(STARTING_SNAKE))
  const [direction, setDirection] = useState<Direction>('right')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const directionRef = useRef<Direction>('right')

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
  }

  function changeDirection(nextDirection: Direction) {
    if (nextDirection === OPPOSITE[directionRef.current]) return
    directionRef.current = nextDirection
    setDirection(nextDirection)
    if (!isGameOver) setIsRunning(true)
  }

  const status = isGameOver
    ? 'Game over'
    : isRunning
      ? 'In motion'
      : 'Ready to play'

  return (
    <main className="page-wrap px-4 pb-10 pt-10 sm:pt-14">
      <section className="island-shell rise-in overflow-hidden rounded-[2rem] p-5 sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="island-kicker mb-2">Classic arcade</p>
            <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
              Snake
            </h1>
            <p className="mt-2 mb-0 text-sm text-[var(--sea-ink-soft)]">
              Guide the little line, eat the dots, and keep growing.
            </p>
          </div>
          <div className="flex gap-2" aria-label="Game statistics">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2">
              <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--sea-ink-soft)]">
                Score
              </span>
              <strong className="text-xl text-[var(--sea-ink)]">{score}</strong>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2">
              <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[var(--sea-ink-soft)]">
                Best
              </span>
              <strong className="flex items-center gap-1 text-xl text-[var(--sea-ink)]">
                <Trophy size={15} />
                {bestScore}
              </strong>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[560px]">
          <div
            className="grid aspect-square w-full touch-none gap-px rounded-2xl border-4 border-[var(--sea-ink)] bg-[var(--sea-ink)] p-1 shadow-[0_18px_40px_rgba(23,58,64,0.18)]"
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
                  className={`relative rounded-[3px] ${snakeIndex === 0 ? 'bg-[var(--lagoon)]' : snakeIndex > -1 ? 'bg-[var(--palm)]' : 'bg-[rgba(243,250,245,0.78)]'}`}
                  role="gridcell"
                >
                  {isFood && (
                    <span className="absolute inset-[23%] rounded-full bg-[#ee765f] shadow-[0_0_0_3px_rgba(238,118,95,0.16)]" />
                  )}
                </div>
              )
            })}
            {!isRunning && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl border border-white/50 bg-[rgba(23,58,64,0.88)] px-5 py-3 text-center text-white shadow-xl">
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

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startNewGame}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--sea-ink)] px-4 py-2.5 text-sm font-bold text-white hover:-translate-y-0.5 hover:bg-[var(--lagoon-deep)]"
              >
                {isGameOver ? <RotateCcw size={17} /> : <Play size={17} />}
                {isGameOver ? 'Play again' : 'Start game'}
              </button>
              <button
                type="button"
                onClick={() => setIsRunning((running) => !running)}
                disabled={isGameOver}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-2.5 text-sm font-bold text-[var(--sea-ink)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isRunning ? <Pause size={17} /> : <Play size={17} />}
                {isRunning ? 'Pause' : 'Resume'}
              </button>
            </div>
            <span className="text-xs font-semibold text-[var(--sea-ink-soft)]">
              {status} · {direction} direction
            </span>
          </div>

          <div
            className="mx-auto mt-6 grid w-40 grid-cols-3 gap-2 sm:hidden"
            aria-label="Direction controls"
          >
            <span />
            <button
              type="button"
              onClick={() => changeDirection('up')}
              className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] py-3 text-lg text-[var(--sea-ink)]"
              aria-label="Move up"
            >
              ↑
            </button>
            <span />
            <button
              type="button"
              onClick={() => changeDirection('left')}
              className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] py-3 text-lg text-[var(--sea-ink)]"
              aria-label="Move left"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => changeDirection('down')}
              className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] py-3 text-lg text-[var(--sea-ink)]"
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => changeDirection('right')}
              className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] py-3 text-lg text-[var(--sea-ink)]"
              aria-label="Move right"
            >
              →
            </button>
          </div>
          <p className="mt-5 text-center text-xs text-[var(--sea-ink-soft)]">
            Arrow keys or WASD to move · Space to pause
          </p>
        </div>
      </section>
    </main>
  )
}
