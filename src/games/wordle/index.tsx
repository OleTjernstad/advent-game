import { RotateCcw, Trophy } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { GameProps } from '../types'
import { MOVES_REQUIRED_FOR_INTERACTION } from '../types'

const WORD_LENGTH = 5
const MAX_ATTEMPTS = 6
const KEYBOARD_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'] as const

const WORD_BANK = [
  'FROST',
  'CANDY',
  'KAKAO',
  'JULEN',
  'NISSE',
  'GAVER',
  'ENGEL',
  'GLIMT',
  'KRANS',
  'KULER',
  'VOTTE',
  'BJELL',
  'LYSER',
  'TREET',
  'FROST',
  'KANEL',
  'SLEDE',
  'LYSET',
  'JULER',
] as const

const WORD_SET: ReadonlySet<string> = new Set(WORD_BANK)

type LetterState = 'correct' | 'present' | 'absent'
type GameOutcome = 'playing' | 'won' | 'lost'
type KeyboardState = Partial<Record<string, LetterState>>

type GuessEvaluation = {
  letters: string[]
  states: LetterState[]
}

function pickWord(excludedWord?: string) {
  const availableWords = WORD_BANK.filter((word) => word !== excludedWord)
  const source = availableWords.length > 0 ? availableWords : WORD_BANK
  return source[Math.floor(Math.random() * source.length)]
}

function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill('absent')
  const answerLetters = answer.split('')

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (guess[index] === answerLetters[index]) {
      result[index] = 'correct'
      answerLetters[index] = '_'
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (result[index] === 'correct') continue
    const letterIndex = answerLetters.indexOf(guess[index])
    if (letterIndex > -1) {
      result[index] = 'present'
      answerLetters[letterIndex] = '_'
    }
  }

  return result
}

function nextKeyboardState(
  currentState: KeyboardState,
  guess: string,
  evaluation: LetterState[],
): KeyboardState {
  const priority: Record<LetterState, number> = {
    absent: 0,
    present: 1,
    correct: 2,
  }
  const nextState = { ...currentState }

  for (let index = 0; index < guess.length; index += 1) {
    const letter = guess[index]
    const state = evaluation[index]
    const existingState = nextState[letter]

    if (!existingState || priority[state] > priority[existingState]) {
      nextState[letter] = state
    }
  }

  return nextState
}

export function WordleGame({ onInteraction }: GameProps) {
  const [answer, setAnswer] = useState(() => pickWord())
  const [guessRows, setGuessRows] = useState<GuessEvaluation[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({})
  const [wins, setWins] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [streak, setStreak] = useState(0)
  const [message, setMessage] = useState<string | null>(null)

  const interactionCountRef = useRef(0)
  const interactionReportedRef = useRef(false)

  const outcome: GameOutcome = useMemo(() => {
    if (guessRows.some((row) => row.letters.join('') === answer)) return 'won'
    if (guessRows.length >= MAX_ATTEMPTS) return 'lost'
    return 'playing'
  }, [answer, guessRows])

  useEffect(() => {
    const savedBest = window.localStorage.getItem('wordle-best-streak')
    if (savedBest) setBestStreak(Number(savedBest))
  }, [])

  useEffect(() => {
    if (streak > bestStreak) {
      setBestStreak(streak)
      window.localStorage.setItem('wordle-best-streak', String(streak))
    }
  }, [bestStreak, streak])

  useEffect(() => {
    if (!message) return
    const timeout = window.setTimeout(() => setMessage(null), 1400)
    return () => window.clearTimeout(timeout)
  }, [message])

  useEffect(() => {
    if (outcome === 'won') {
      setWins((currentWins) => currentWins + 1)
      setStreak((currentStreak) => currentStreak + 1)
    }
    if (outcome === 'lost') {
      setStreak(0)
    }
  }, [outcome])

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

  const commitGuess = useCallback(() => {
    if (outcome !== 'playing') return
    if (currentGuess.length !== WORD_LENGTH) {
      setMessage(`Du trenger ${WORD_LENGTH} bokstaver`)
      return
    }
    if (!WORD_SET.has(currentGuess)) {
      setMessage('Ordet finnes ikke i listen')
      return
    }

    const evaluation = evaluateGuess(currentGuess, answer)
    reportInteraction()
    setGuessRows((rows) => [
      ...rows,
      { letters: currentGuess.split(''), states: evaluation },
    ])
    setKeyboardState((currentState) =>
      nextKeyboardState(currentState, currentGuess, evaluation),
    )
    setCurrentGuess('')
  }, [answer, currentGuess, outcome])

  const onKeyInput = useCallback(
    (key: string) => {
      if (outcome !== 'playing') return

      if (key === 'Enter') {
        commitGuess()
        return
      }

      if (key === 'Backspace') {
        setCurrentGuess((value) => value.slice(0, -1))
        return
      }

      const letter = key.toUpperCase()
      if (!/^[A-Z]$/.test(letter)) return
      setCurrentGuess((value) => {
        if (value.length >= WORD_LENGTH) return value
        return `${value}${letter}`
      })
    },
    [commitGuess, outcome],
  )

  useEffect(() => {
    function isEditableTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false
      return (
        target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      )
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return

      if (event.key === 'Backspace' || event.key === 'Enter') {
        event.preventDefault()
      }

      onKeyInput(event.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onKeyInput])

  function startNewRound() {
    setAnswer((currentWord) => pickWord(currentWord))
    setGuessRows([])
    setCurrentGuess('')
    setKeyboardState({})
    setMessage(null)
    interactionCountRef.current = 0
    interactionReportedRef.current = false
  }

  const boardRows = Array.from({ length: MAX_ATTEMPTS }, (_, rowIndex) => {
    if (rowIndex < guessRows.length) {
      return guessRows[rowIndex]
    }
    if (rowIndex === guessRows.length) {
      const letters = currentGuess.padEnd(WORD_LENGTH, ' ').split('')
      return {
        letters,
        states: Array(WORD_LENGTH).fill('absent') as LetterState[],
      }
    }
    return {
      letters: Array(WORD_LENGTH).fill(''),
      states: Array(WORD_LENGTH).fill('absent') as LetterState[],
    }
  })

  const statusText =
    outcome === 'won'
      ? 'Puzzle solved'
      : outcome === 'lost'
        ? `Ordet var ${answer}`
        : `${MAX_ATTEMPTS - guessRows.length} forsøk igjen`

  return (
    <section className="rise-in w-full">
      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10">
        <div className="mx-auto w-full max-w-140">
          <div className="relative rounded-2xl border-4 border-foreground bg-card p-3 shadow-lg sm:p-5">
            <div className="mx-auto grid max-w-110 gap-2 sm:gap-2.5">
              {boardRows.map((row, rowIndex) => (
                <div
                  key={`row-${rowIndex}`}
                  className="grid grid-cols-5 gap-2 sm:gap-2.5"
                >
                  {row.letters.map((letter, letterIndex) => {
                    const resolvedRow = rowIndex < guessRows.length
                    const state = resolvedRow ? row.states[letterIndex] : null

                    const tileClasses = resolvedRow
                      ? state === 'correct'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : state === 'present'
                          ? 'border-amber-500 bg-amber-500 text-amber-950'
                          : 'border-muted bg-muted text-muted-foreground'
                      : letter
                        ? 'border-border bg-accent text-card-foreground'
                        : 'border-border bg-card text-card-foreground'

                    return (
                      <div
                        key={`${rowIndex}-${letterIndex}`}
                        className={`flex aspect-square min-h-0 items-center justify-center border-2 text-xl font-black tracking-[0.06em] sm:text-2xl ${tileClasses}`}
                      >
                        {letter === ' ' ? '' : letter}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {outcome !== 'playing' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/78 p-6">
                <div className="max-w-sm rounded-xl border border-border/30 bg-card px-5 py-4 text-center shadow-lg">
                  <p className="text-lg font-bold text-card-foreground">
                    {outcome === 'won'
                      ? 'Perfekt runde.'
                      : 'Ingen forsøk igjen.'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {outcome === 'won'
                      ? `Løst på ${guessRows.length} ${guessRows.length === 1 ? 'forsøk' : 'forsøk'}.`
                      : `Ordet var ${answer}.`}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Tastatur
            </p>
            <div className="grid gap-2">
              {KEYBOARD_ROWS.map((row, rowIndex) => (
                <div
                  key={row}
                  className={`grid gap-1.5 sm:gap-2 ${
                    rowIndex < 2
                      ? 'grid-cols-10'
                      : 'grid-cols-[1.4fr_repeat(7,1fr)_1.4fr]'
                  }`}
                >
                  {rowIndex === 2 ? (
                    <button
                      type="button"
                      onClick={() => onKeyInput('Enter')}
                      disabled={outcome !== 'playing'}
                      className="rounded-md border border-border bg-card px-1 py-2 text-[0.65rem] font-bold text-card-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
                    >
                      ENTER
                    </button>
                  ) : null}

                  {row.split('').map((letter) => {
                    const state = keyboardState[letter]
                    const keyClass =
                      state === 'correct'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : state === 'present'
                          ? 'border-amber-500 bg-amber-500 text-amber-950'
                          : state === 'absent'
                            ? 'border-muted bg-muted text-muted-foreground'
                            : 'border-border bg-card text-card-foreground hover:bg-accent'

                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => onKeyInput(letter)}
                        disabled={outcome !== 'playing'}
                        className={`rounded-md border px-1 py-2 text-xs font-bold transition-colors sm:text-sm ${keyClass} disabled:cursor-not-allowed disabled:opacity-80`}
                      >
                        {letter}
                      </button>
                    )
                  })}

                  {rowIndex === 2 ? (
                    <button
                      type="button"
                      onClick={() => onKeyInput('Backspace')}
                      disabled={outcome !== 'playing'}
                      className="rounded-md border border-border bg-card px-1 py-2 text-[0.65rem] font-bold text-card-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
                    >
                      SLETT
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Skriv bokstaver, og trykk Enter for å sende inn.
          </p>
        </div>

        <aside
          className="grid grid-cols-2 gap-3 lg:grid-cols-1"
          aria-label="Wordle-status og kontroller"
        >
          <div className="col-span-2 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Forsøk igjen
            </span>
            <strong className="text-3xl text-card-foreground">
              {Math.max(0, MAX_ATTEMPTS - guessRows.length)}
            </strong>
          </div>

          <div className="col-span-1 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Seiere
            </span>
            <strong className="text-xl text-card-foreground">{wins}</strong>
          </div>

          <div className="col-span-1 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Beste seiersrekke
            </span>
            <strong className="inline-flex items-center gap-1 text-xl text-card-foreground">
              <Trophy size={16} />
              {bestStreak}
            </strong>
          </div>

          <button
            type="button"
            onClick={startNewRound}
            className="col-span-2 inline-flex items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:-translate-y-0.5 hover:bg-sidebar-primary lg:col-span-1"
          >
            <RotateCcw size={17} />
            {outcome === 'playing' ? 'Ny oppgave' : 'Spill igjen'}
          </button>

          <div className="col-span-2 min-h-6 text-xs font-semibold text-muted-foreground lg:col-span-1">
            {message ?? statusText}
          </div>

          <div className="col-span-2 text-xs text-muted-foreground lg:col-span-1">
            Gjeldende gjetning: {currentGuess || '...'}
          </div>
        </aside>
      </div>
    </section>
  )
}
