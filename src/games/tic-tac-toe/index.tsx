import { Bot, RotateCcw, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MOVES_REQUIRED_FOR_INTERACTION } from '../types'
import type { GameProps } from '../types'
import { cn } from '#/lib/utils'

type Mark = 'X' | 'O'
type Difficulty = 'easy' | 'medium' | 'hard'
type Cell = Mark | null
type Score = { wins: number; losses: number; draws: number }

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const

const EMPTY_BOARD: Cell[] = Array(9).fill(null)

function otherMark(mark: Mark): Mark {
  return mark === 'X' ? 'O' : 'X'
}

function getResult(board: Cell[]) {
  for (const line of WIN_LINES) {
    const [first, second, third] = line
    if (
      board[first] &&
      board[first] === board[second] &&
      board[first] === board[third]
    ) {
      return { winner: board[first], line }
    }
  }
  return { winner: null, line: [] as number[] }
}

function availableMoves(board: Cell[]) {
  return board.flatMap((cell, index) => (cell ? [] : [index]))
}

function findTacticalMove(board: Cell[], mark: Mark) {
  for (const move of availableMoves(board)) {
    const nextBoard = [...board]
    nextBoard[move] = mark
    if (getResult(nextBoard).winner === mark) return move
  }
  return null
}

function minimax(
  board: Cell[],
  aiMark: Mark,
  currentMark: Mark,
  depth: number,
): number {
  const result = getResult(board)
  if (result.winner === aiMark) return 10 - depth
  if (result.winner === otherMark(aiMark)) return depth - 10
  const moves = availableMoves(board)
  if (!moves.length) return 0

  const scores = moves.map((move) => {
    const nextBoard = [...board]
    nextBoard[move] = currentMark
    return minimax(nextBoard, aiMark, otherMark(currentMark), depth + 1)
  })
  return currentMark === aiMark ? Math.max(...scores) : Math.min(...scores)
}

function chooseAiMove(board: Cell[], aiMark: Mark, difficulty: Difficulty) {
  const moves = availableMoves(board)
  if (!moves.length) return null
  if (difficulty === 'easy')
    return moves[Math.floor(Math.random() * moves.length)]

  const winningMove = findTacticalMove(board, aiMark)
  const blockingMove = findTacticalMove(board, otherMark(aiMark))
  if (winningMove !== null) return winningMove
  if (blockingMove !== null) return blockingMove
  if (difficulty === 'medium' && Math.random() < 0.35) {
    return moves[Math.floor(Math.random() * moves.length)]
  }

  if (moves.includes(4)) return 4
  if (difficulty === 'medium')
    return moves[Math.floor(Math.random() * moves.length)]

  return moves.reduce(
    (bestMove, move) => {
      const nextBoard = [...board]
      nextBoard[move] = aiMark
      const score = minimax(nextBoard, aiMark, otherMark(aiMark), 0)
      return score > bestMove.score ? { move, score } : bestMove
    },
    { move: moves[0], score: -Infinity },
  ).move
}

export function TicTacToeGame({ onInteraction }: GameProps) {
  const [board, setBoard] = useState<Cell[]>(EMPTY_BOARD)
  const [playerMark, setPlayerMark] = useState<Mark>('X')
  const [difficulty, setDifficulty] = useState<Difficulty>('hard')
  const [turn, setTurn] = useState<Mark>('X')
  const [winner, setWinner] = useState<Mark | 'draw' | null>(null)
  const [winningLine, setWinningLine] = useState<readonly number[]>([])
  const [score, setScore] = useState<Score>({ wins: 0, losses: 0, draws: 0 })

  const aiMark = otherMark(playerMark)
  const isAiTurn = !winner && turn === aiMark

  const moveCountRef = useRef(0)
  const interactionReportedRef = useRef(false)

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

  function finishRound(nextBoard: Cell[]) {
    const result = getResult(nextBoard)
    if (result.winner) {
      setWinner(result.winner)
      setWinningLine(result.line)
      setScore((current) => ({
        ...current,
        wins: current.wins + (result.winner === playerMark ? 1 : 0),
        losses: current.losses + (result.winner === aiMark ? 1 : 0),
      }))
    } else if (!availableMoves(nextBoard).length) {
      setWinner('draw')
      setScore((current) => ({ ...current, draws: current.draws + 1 }))
    }
  }

  function playMove(index: number) {
    if (board[index] || winner || isAiTurn) return
    const nextBoard = [...board]
    nextBoard[index] = playerMark
    setBoard(nextBoard)
    finishRound(nextBoard)
    reportInteraction()
    if (!getResult(nextBoard).winner && availableMoves(nextBoard).length)
      setTurn(aiMark)
  }

  useEffect(() => {
    if (!isAiTurn) return
    const timer = window.setTimeout(() => {
      const move = chooseAiMove(board, aiMark, difficulty)
      if (move === null) return
      const nextBoard = [...board]
      nextBoard[move] = aiMark
      setBoard(nextBoard)
      finishRound(nextBoard)
      if (!getResult(nextBoard).winner && availableMoves(nextBoard).length)
        setTurn(playerMark)
    }, 420)
    return () => window.clearTimeout(timer)
  }, [aiMark, board, difficulty, isAiTurn, playerMark])

  function newRound(nextPlayerMark = playerMark) {
    setBoard([...EMPTY_BOARD])
    setPlayerMark(nextPlayerMark)
    setWinner(null)
    setWinningLine([])
    setTurn('X')
  }

  function changePlayerMark(mark: Mark) {
    if (mark !== playerMark) newRound(mark)
  }

  const status =
    winner === 'draw'
      ? 'Uavgjort'
      : winner
        ? `${winner} Vinner runden`
        : isAiTurn
          ? 'Dataen tenker...'
          : `Din tur · ${playerMark}`

  return (
    <section className="rise-in w-full">
      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10">
        <div className="mx-auto w-full max-w-140">
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <span className="mb-2 block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Ditt merke
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(['X', 'O'] as Mark[]).map((mark) => (
                  <button
                    key={mark}
                    type="button"
                    onClick={() => changePlayerMark(mark)}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${playerMark === mark ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-card-foreground hover:bg-accent'}`}
                  >
                    {mark}
                  </button>
                ))}
              </div>
            </div>
            <label className="rounded-xl border border-border bg-muted/40 p-3">
              <span className="mb-2 block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Vanskelighetsgrad
              </span>
              <select
                value={difficulty}
                onChange={(event) => {
                  setDifficulty(event.target.value as Difficulty)
                  newRound()
                }}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-card-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="easy">Lett</option>
                <option value="medium">Medium</option>
                <option value="hard">Vanskelig</option>
              </select>
            </label>
          </div>

          <div className="relative">
            {winner && (
              <div
                className="absolute bottom-full left-1/2 z-10 mb-3 flex w-[calc(100%-1rem)] max-w-sm -translate-x-1/2 items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground shadow-lg"
                role="alert"
                aria-live="polite"
              >
                <Trophy size={17} />
                <span>
                  {winner === 'draw'
                    ? 'Uavgjort!'
                    : winner === playerMark
                      ? 'Du vinner runden!'
                      : 'Dataen vinner runden.'}
                </span>
              </div>
            )}
            <div
              className="grid aspect-square min-h-0 grid-cols-3 grid-rows-3 gap-2 rounded-2xl border-4 border-foreground bg-foreground p-2 shadow-lg"
              role="grid"
              aria-label={`Tre på rad-brett. ${status}`}
            >
              {board.map((cell, index) => (
                <button
                  key={index}
                  type="button"
                  role="gridcell"
                  onClick={() => playMove(index)}
                  disabled={Boolean(cell) || Boolean(winner) || isAiTurn}
                  className={cn(
                    `flex min-h-0 items-center justify-center overflow-hidden rounded-xl bg-card text-6xl font-black leading-none transition-colors sm:text-8xl disabled:cursor-default hover:bg-accent`,
                    {
                      'bg-primary/65 hover:bg-primary/50':
                        winningLine.includes(index),
                    },
                  )}
                  aria-label={
                    cell
                      ? `Rute ${index + 1}: ${cell}`
                      : `Rute ${index + 1}: tom`
                  }
                >
                  {cell && (
                    <span
                      className={
                        cell === 'X' ? 'text-primary' : 'text-destructive'
                      }
                    >
                      {cell}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 lg:hidden">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Bot size={17} />
              {status}
            </span>
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Velg ditt merke, og trykk i en rute for å vinne.
          </p>
        </div>

        <aside
          className="grid grid-cols-2 gap-3 lg:grid-cols-1"
          aria-label="Poeng og kontroller for økten"
        >
          <div className="col-span-2 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Seiere
            </span>
            <strong className="flex items-center gap-1 text-2xl text-card-foreground">
              <Trophy size={17} />
              {score.wins}
            </strong>
          </div>
          <div className="col-span-1 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Uavgjort
            </span>
            <strong className="text-xl text-card-foreground">
              {score.draws}
            </strong>
          </div>
          <div className="col-span-1 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Tap
            </span>
            <strong className="text-xl text-card-foreground">
              {score.losses}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => newRound()}
            className="col-span-2 inline-flex items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:-translate-y-0.5 hover:bg-sidebar-primary lg:col-span-1"
          >
            <RotateCcw size={17} />
            Ny runde
          </button>
          <span className="col-span-2 hidden items-center gap-2 text-xs font-semibold text-muted-foreground lg:inline-flex">
            <Bot size={15} />
            {status}
          </span>
        </aside>
      </div>
    </section>
  )
}
