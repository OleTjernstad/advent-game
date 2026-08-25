import { Pause, Play, RotateCcw, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { GameProps } from '../types'
import { MOVES_REQUIRED_FOR_INTERACTION } from '../types'

const CANVAS_WIDTH = 720
const CANVAS_HEIGHT = 480
const PADDLE_WIDTH = 112
const PADDLE_HEIGHT = 14
const PADDLE_Y = CANVAS_HEIGHT - 34
const BALL_RADIUS = 8
const BRICK_ROWS = 5
const BRICK_COLUMNS = 9
const BRICK_WIDTH = 65
const BRICK_HEIGHT = 22
const BRICK_GAP = 9
const BRICK_TOP = 54
const BRICK_LEFT =
  (CANVAS_WIDTH -
    (BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP)) /
  2
const STARTING_LIVES = 3

type Brick = {
  x: number
  y: number
  color: string
  points: number
  alive: boolean
}
type GameStatus = 'ready' | 'playing' | 'paused' | 'won' | 'lost'

type GameState = {
  ballX: number
  ballY: number
  velocityX: number
  velocityY: number
  paddleX: number
  bricks: Brick[]
  score: number
  lives: number
  status: GameStatus
}

function createBricks(colors: string[]): Brick[] {
  return Array.from({ length: BRICK_ROWS * BRICK_COLUMNS }, (_, index) => {
    const row = Math.floor(index / BRICK_COLUMNS)
    const column = index % BRICK_COLUMNS
    return {
      x: BRICK_LEFT + column * (BRICK_WIDTH + BRICK_GAP),
      y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
      color: colors[row % colors.length],
      points: (BRICK_ROWS - row) * 10,
      alive: true,
    }
  })
}

function makeGame(colors: string[]): GameState {
  return {
    ballX: CANVAS_WIDTH / 2,
    ballY: PADDLE_Y - BALL_RADIUS - 2,
    velocityX: 220,
    velocityY: -250,
    paddleX: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    bricks: createBricks(colors),
    score: 0,
    lives: STARTING_LIVES,
    status: 'ready',
  }
}

function readThemeColors() {
  const styles = getComputedStyle(document.documentElement)
  return {
    background: styles.getPropertyValue('--background').trim() || '#fff',
    foreground: styles.getPropertyValue('--foreground').trim() || '#111',
    primary: styles.getPropertyValue('--primary').trim() || '#facc15',
    muted: styles.getPropertyValue('--muted').trim() || '#e5e7eb',
    accent: styles.getPropertyValue('--accent').trim() || '#d1d5db',
    destructive: styles.getPropertyValue('--destructive').trim() || '#ef4444',
  }
}

function drawGame(context: CanvasRenderingContext2D, game: GameState) {
  const colors = readThemeColors()
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  context.fillStyle = colors.background
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  context.strokeStyle = colors.muted
  context.globalAlpha = 0.28
  context.lineWidth = 1
  for (let x = 0; x <= CANVAS_WIDTH; x += 36) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, CANVAS_HEIGHT)
    context.stroke()
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += 36) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(CANVAS_WIDTH, y)
    context.stroke()
  }
  context.globalAlpha = 1

  game.bricks.forEach((brick) => {
    if (!brick.alive) return
    context.fillStyle = brick.color
    context.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT)
    context.fillStyle = colors.foreground
    context.globalAlpha = 0.14
    context.fillRect(brick.x, brick.y, BRICK_WIDTH, 4)
    context.globalAlpha = 1
  })

  context.fillStyle = colors.primary
  context.fillRect(game.paddleX, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT)
  context.fillStyle = colors.foreground
  context.globalAlpha = 0.2
  context.fillRect(game.paddleX, PADDLE_Y, PADDLE_WIDTH, 3)
  context.globalAlpha = 1

  context.beginPath()
  context.arc(game.ballX, game.ballY, BALL_RADIUS, 0, Math.PI * 2)
  context.fillStyle = colors.destructive
  context.fill()
  context.strokeStyle = colors.foreground
  context.globalAlpha = 0.2
  context.stroke()
  context.globalAlpha = 1

  if (game.status !== 'playing') {
    context.fillStyle = colors.foreground
    context.globalAlpha = 0.72
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    context.globalAlpha = 1
  }
}

export function BreakoutGame({ onInteraction }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameState | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastFrameRef = useRef(0)
  const colorsRef = useRef<string[]>([])
  const pointerActiveRef = useRef(false)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [lives, setLives] = useState(STARTING_LIVES)
  const [status, setStatus] = useState<GameStatus>('ready')

  const moveCountRef = useRef(0)
  const interactionReportedRef = useRef(false)

  function syncGame(nextGame: GameState) {
    gameRef.current = nextGame
    setScore(nextGame.score)
    setLives(nextGame.lives)
    setStatus(nextGame.status)
  }

  function resetGame(nextStatus: GameStatus = 'ready') {
    const game = makeGame(colorsRef.current)
    game.status = nextStatus
    syncGame(game)
  }

  useEffect(() => {
    const theme = readThemeColors()
    colorsRef.current = [
      theme.primary,
      theme.accent,
      theme.muted,
      theme.primary,
      theme.destructive,
    ]
    resetGame()
    const savedBestScore = window.localStorage.getItem('breakout-best-score')
    if (savedBestScore) setBestScore(Number(savedBestScore))
  }, [])

  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score)
      window.localStorage.setItem('breakout-best-score', String(score))
    }
  }, [bestScore, score])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    function resizeCanvas() {
      const scale = Math.min(
        canvas!.clientWidth / CANVAS_WIDTH,
        canvas!.clientHeight / CANVAS_HEIGHT,
      )
      const ratio = window.devicePixelRatio || 1
      canvas!.width = CANVAS_WIDTH * ratio
      canvas!.height = CANVAS_HEIGHT * ratio
      context!.setTransform(ratio, 0, 0, ratio, 0, 0)
      canvas!.style.aspectRatio = `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`
      void scale
    }

    resizeCanvas()
    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function tick(timestamp: number) {
      const game = gameRef.current
      if (!game) {
        frameRef.current = requestAnimationFrame(tick)
        return
      }
      const elapsed = Math.min((timestamp - lastFrameRef.current) / 1000, 0.025)
      lastFrameRef.current = timestamp

      if (game.status === 'playing') {
        game.ballX += game.velocityX * elapsed
        game.ballY += game.velocityY * elapsed
        if (
          game.ballX - BALL_RADIUS <= 0 ||
          game.ballX + BALL_RADIUS >= CANVAS_WIDTH
        ) {
          game.velocityX *= -1
          game.ballX = Math.max(
            BALL_RADIUS,
            Math.min(CANVAS_WIDTH - BALL_RADIUS, game.ballX),
          )
        }
        if (game.ballY - BALL_RADIUS <= 0) {
          game.velocityY = Math.abs(game.velocityY)
          game.ballY = BALL_RADIUS
        }

        const hitsPaddle =
          game.velocityY > 0 &&
          game.ballY + BALL_RADIUS >= PADDLE_Y &&
          game.ballY - BALL_RADIUS <= PADDLE_Y + PADDLE_HEIGHT &&
          game.ballX >= game.paddleX - BALL_RADIUS &&
          game.ballX <= game.paddleX + PADDLE_WIDTH + BALL_RADIUS
        if (hitsPaddle) {
          reportInteraction()
          const hitPosition =
            (game.ballX - (game.paddleX + PADDLE_WIDTH / 2)) /
            (PADDLE_WIDTH / 2)
          game.velocityX = hitPosition * 300
          game.velocityY = -Math.abs(game.velocityY)
          game.ballY = PADDLE_Y - BALL_RADIUS
        }

        const brick = game.bricks.find(
          (candidate) =>
            candidate.alive &&
            game.ballX + BALL_RADIUS >= candidate.x &&
            game.ballX - BALL_RADIUS <= candidate.x + BRICK_WIDTH &&
            game.ballY + BALL_RADIUS >= candidate.y &&
            game.ballY - BALL_RADIUS <= candidate.y + BRICK_HEIGHT,
        )
        if (brick) {
          brick.alive = false
          game.velocityY *= -1
          game.score += brick.points
          if (game.bricks.every((candidate) => !candidate.alive))
            game.status = 'won'
        }

        if (game.ballY - BALL_RADIUS > CANVAS_HEIGHT) {
          game.lives -= 1
          if (game.lives === 0) {
            game.status = 'lost'
          } else {
            game.ballX = CANVAS_WIDTH / 2
            game.ballY = PADDLE_Y - BALL_RADIUS - 2
            game.velocityX = game.velocityX < 0 ? -220 : 220
            game.velocityY = -250
            game.status = 'paused'
          }
        }
        setScore(game.score)
        setLives(game.lives)
        setStatus(game.status)
      }

      const context = canvasRef.current?.getContext('2d')
      if (context && gameRef.current) drawGame(context, gameRef.current)
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const game = gameRef.current
      if (!game) return
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        if (game.status === 'playing') game.status = 'paused'
        else if (game.status === 'ready' || game.status === 'paused')
          game.status = 'playing'
        else resetGame('playing')
        setStatus(game.status)
      }
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(event.key)) {
        event.preventDefault()
        game.paddleX +=
          event.key === 'ArrowLeft' || event.key === 'a' ? -38 : 38
        game.paddleX = Math.max(
          0,
          Math.min(CANVAS_WIDTH - PADDLE_WIDTH, game.paddleX),
        )
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function movePaddle(amount: number) {
    const game = gameRef.current
    if (!game) return
    game.paddleX = Math.max(
      0,
      Math.min(CANVAS_WIDTH - PADDLE_WIDTH, game.paddleX + amount),
    )
  }

  function movePaddleToPointer(clientX: number) {
    const canvas = canvasRef.current
    const game = gameRef.current
    if (!canvas || !game) return
    const bounds = canvas.getBoundingClientRect()
    const canvasX = ((clientX - bounds.left) / bounds.width) * CANVAS_WIDTH
    game.paddleX = Math.max(
      0,
      Math.min(CANVAS_WIDTH - PADDLE_WIDTH, canvasX - PADDLE_WIDTH / 2),
    )
  }

  function reportInteraction() {
    console.log('moveCountRef.current', moveCountRef.current)
    moveCountRef.current += 1
    if (
      !interactionReportedRef.current &&
      moveCountRef.current >= MOVES_REQUIRED_FOR_INTERACTION
    ) {
      interactionReportedRef.current = true
      onInteraction?.()
    }
  }

  function startGame() {
    const game = gameRef.current
    if (!game || game.status === 'won' || game.status === 'lost')
      resetGame('playing')
    else {
      game.status = 'playing'
      setStatus('playing')
    }
  }

  const statusLabel =
    status === 'playing'
      ? 'In motion'
      : status === 'won'
        ? 'You cleared the deck'
        : status === 'lost'
          ? 'Game over'
          : status === 'paused'
            ? 'Paused'
            : 'Ready to play'

  return (
    <section className="rise-in w-full">
      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10">
        <div className="mx-auto w-full max-w-180">
          <div className="relative overflow-hidden rounded-2xl border-4 border-foreground bg-background shadow-lg">
            <canvas
              ref={canvasRef}
              className="block h-auto w-full touch-none"
              onPointerDown={(event) => {
                pointerActiveRef.current = true
                event.currentTarget.setPointerCapture(event.pointerId)
                movePaddleToPointer(event.clientX)
              }}
              onPointerMove={(event) => {
                if (event.pointerType === 'mouse' || pointerActiveRef.current)
                  movePaddleToPointer(event.clientX)
              }}
              onPointerUp={(event) => {
                pointerActiveRef.current = false
                event.currentTarget.releasePointerCapture(event.pointerId)
              }}
              onPointerCancel={() => {
                pointerActiveRef.current = false
              }}
              aria-label={`Breakout game. ${statusLabel}. Use left and right arrow keys or A and D to move the paddle.`}
            />
            {status !== 'playing' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl border border-border/50 bg-foreground px-6 py-4 text-center text-background shadow-xl">
                  <strong className="block text-lg">
                    {status === 'won'
                      ? 'Every brick is down.'
                      : status === 'lost'
                        ? 'The ball got away.'
                        : status === 'paused'
                          ? 'Take a breath.'
                          : 'Ready when you are.'}
                  </strong>
                  <span className="text-xs text-white/75">
                    {status === 'won' || status === 'lost'
                      ? `You scored ${score}.`
                      : 'Press start, space, or enter.'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div
            className="mx-auto mt-6 flex w-52 items-center justify-between gap-3 sm:hidden"
            aria-label="Paddle controls"
          >
            <button
              type="button"
              onClick={() => movePaddle(-55)}
              className="rounded-xl border border-border bg-card px-7 py-3 text-xl text-card-foreground"
              aria-label="Move paddle left"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => movePaddle(55)}
              className="rounded-xl border border-border bg-card px-7 py-3 text-xl text-card-foreground"
              aria-label="Move paddle right"
            >
              →
            </button>
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Move with your mouse or finger · Arrow keys or A/D · Space to pause
          </p>
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
          <div className="col-span-2 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Lives
            </span>
            <strong className="text-2xl text-card-foreground">{lives}</strong>
          </div>
          <div className="col-span-2 flex gap-2 lg:col-span-1 lg:flex-col">
            <button
              type="button"
              onClick={startGame}
              className="inline-flex flex-1 items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:-translate-y-0.5 hover:bg-sidebar-primary"
            >
              {status === 'won' || status === 'lost' ? (
                <RotateCcw size={17} />
              ) : (
                <Play size={17} />
              )}
              {status === 'won' || status === 'lost'
                ? 'Play again'
                : 'Start game'}
            </button>
            <button
              type="button"
              onClick={() => {
                const game = gameRef.current
                if (!game || game.status === 'won' || game.status === 'lost')
                  return
                game.status = game.status === 'playing' ? 'paused' : 'playing'
                setStatus(game.status)
              }}
              disabled={status === 'won' || status === 'lost'}
              className="inline-flex flex-1 items-center justify-center gap-2 border border-border px-4 py-2.5 text-sm font-bold text-card-foreground hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === 'playing' ? <Pause size={17} /> : <Play size={17} />}
              {status === 'playing' ? 'Pause' : 'Resume'}
            </button>
          </div>
          <span className="col-span-2 text-xs font-semibold text-muted-foreground lg:col-span-1">
            {statusLabel}
          </span>
        </aside>
      </div>
    </section>
  )
}
