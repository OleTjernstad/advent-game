import { RotateCcw, Trophy } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { GameProps } from '../types'
import { MOVES_REQUIRED_FOR_INTERACTION } from '../types'

const MAX_WRONG_GUESSES = 6
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ'.split('')

const WORD_POOL = [
  { word: 'SNØKRYSTALL', hint: 'En liten vinterkrystall.' },
  { word: 'LYSLYKT', hint: 'Adventslys i vinduet.' },
  { word: 'PEPPERKAKE', hint: 'En krydret julekake.' },
  { word: 'NISSE', hint: 'Hjelper til med julegavene.' },
  { word: 'SLEDE', hint: 'Et vinterkjøretøy på snø.' },
  { word: 'JULEKULE', hint: 'Pynt til juletreet.' },
  { word: 'JULEKALENDER', hint: 'En nedtelling til julaften.' },
  { word: 'MISTELTEIN', hint: 'En festlig plante til døråpningen.' },
  { word: 'PEPPERMYNTE', hint: 'Klassisk godteri med smak av jul.' },
  { word: 'GEOCACHING', hint: 'Leken vår.' },
  { word: 'GEOCACHE', hint: 'HVa vi her gjemt.' },
  { word: 'TRADISJONELL', hint: 'Grønt ikon.' },
  { word: 'MULTI', hint: 'Flere steg.' },
  { word: 'MYSTERY', hint: 'En oppgave å løse.' },
  { word: 'GPS', hint: 'Verktøy for å finne retning.' },
] as const

type RoundWord = (typeof WORD_POOL)[number]
type GameOutcome = 'playing' | 'won' | 'lost'

function pickWord(excludedWord?: string): RoundWord {
  const filteredWords = WORD_POOL.filter((entry) => entry.word !== excludedWord)
  const source = filteredWords.length > 0 ? filteredWords : WORD_POOL
  return source[Math.floor(Math.random() * source.length)]
}

function drawPart(part: number, wrongGuesses: number) {
  return wrongGuesses > part
}

export function HangmanGame({ onInteraction }: GameProps) {
  const [roundWord, setRoundWord] = useState<RoundWord>(WORD_POOL[0])
  const [correctLetters, setCorrectLetters] = useState<string[]>([])
  const [wrongLetters, setWrongLetters] = useState<string[]>([])
  const [wins, setWins] = useState(0)
  const [bestWins, setBestWins] = useState(0)
  const [duplicateLetter, setDuplicateLetter] = useState<string | null>(null)

  const moveCountRef = useRef(0)
  const interactionReportedRef = useRef(false)

  useEffect(() => {
    setRoundWord(pickWord())
  }, [])

  useEffect(() => {
    const savedBestScore = window.localStorage.getItem('hangman-best-wins')
    if (savedBestScore) setBestWins(Number(savedBestScore))
  }, [])

  useEffect(() => {
    if (wins > bestWins) {
      setBestWins(wins)
      window.localStorage.setItem('hangman-best-wins', String(wins))
    }
  }, [bestWins, wins])

  useEffect(() => {
    if (!duplicateLetter) return
    const timeout = window.setTimeout(() => setDuplicateLetter(null), 1200)
    return () => window.clearTimeout(timeout)
  }, [duplicateLetter])

  const revealedWord = useMemo(
    () =>
      roundWord.word
        .split('')
        .map((letter) => (correctLetters.includes(letter) ? letter : '_')),
    [correctLetters, roundWord.word],
  )

  const wrongCount = wrongLetters.length
  const isWordSolved = revealedWord.every((letter) => letter !== '_')
  const outcome: GameOutcome =
    wrongCount >= MAX_WRONG_GUESSES ? 'lost' : isWordSolved ? 'won' : 'playing'

  useEffect(() => {
    if (outcome === 'won') {
      setWins((currentWins) => currentWins + 1)
    }
  }, [outcome])

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

  const processGuess = useCallback(
    (rawGuess: string) => {
      if (outcome !== 'playing') return

      const guess = rawGuess.toUpperCase()
      if (!/^[A-Z]$/.test(guess)) return

      if (correctLetters.includes(guess) || wrongLetters.includes(guess)) {
        setDuplicateLetter(guess)
        return
      }

      reportInteraction()

      if (roundWord.word.includes(guess)) {
        setCorrectLetters((currentLetters) => [...currentLetters, guess])
        return
      }

      setWrongLetters((currentLetters) => [...currentLetters, guess])
    },
    [correctLetters, onInteraction, outcome, roundWord.word, wrongLetters],
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      processGuess(event.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [processGuess])

  function startNewRound() {
    setRoundWord((currentWord) => pickWord(currentWord.word))
    setCorrectLetters([])
    setWrongLetters([])
    setDuplicateLetter(null)
    moveCountRef.current = 0
    interactionReportedRef.current = false
  }

  const statusText =
    outcome === 'won'
      ? 'Du løste det'
      : outcome === 'lost'
        ? 'Runden er tapt'
        : 'Gjett bokstaver'

  return (
    <section className="rise-in w-full">
      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10">
        <div className="mx-auto w-full max-w-140">
          <div className="mb-4 rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
            <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              Ledetråd
            </p>
            <p className="mt-1 text-sm text-card-foreground sm:text-base">
              {roundWord.hint}
            </p>
          </div>

          <div className="relative rounded-2xl border-4 border-foreground bg-card p-3 shadow-lg sm:p-6">
            <svg
              viewBox="0 0 220 250"
              aria-label={`Hangmanbrett. ${statusText}. ${MAX_WRONG_GUESSES - wrongCount} forsøk igjen.`}
              role="img"
              className="mx-auto h-56 w-full max-w-90 text-foreground"
            >
              <line
                x1="30"
                y1="230"
                x2="120"
                y2="230"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line
                x1="60"
                y1="230"
                x2="60"
                y2="20"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line
                x1="60"
                y1="20"
                x2="150"
                y2="20"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line
                x1="150"
                y1="20"
                x2="150"
                y2="50"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {drawPart(0, wrongCount) ? (
                <circle
                  cx="150"
                  cy="72"
                  r="21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              ) : null}
              {drawPart(1, wrongCount) ? (
                <line
                  x1="150"
                  y1="93"
                  x2="150"
                  y2="150"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              ) : null}
              {drawPart(2, wrongCount) ? (
                <line
                  x1="150"
                  y1="112"
                  x2="125"
                  y2="130"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              ) : null}
              {drawPart(3, wrongCount) ? (
                <line
                  x1="150"
                  y1="112"
                  x2="175"
                  y2="130"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              ) : null}
              {drawPart(4, wrongCount) ? (
                <line
                  x1="150"
                  y1="150"
                  x2="130"
                  y2="184"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              ) : null}
              {drawPart(5, wrongCount) ? (
                <line
                  x1="150"
                  y1="150"
                  x2="170"
                  y2="184"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              ) : null}
            </svg>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {revealedWord.map((letter, index) => (
                <span
                  key={`${roundWord.word}-${index}`}
                  className="inline-flex h-11 w-8 items-center justify-center border-b-4 border-foreground text-xl font-black text-card-foreground sm:h-12 sm:w-9 sm:text-2xl"
                >
                  {letter === '_' ? '' : letter}
                </span>
              ))}
            </div>

            {outcome !== 'playing' ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-foreground/78 p-6 text-center">
                <div className="max-w-sm rounded-xl border border-border/30 bg-card px-5 py-4 shadow-lg">
                  <p className="text-lg font-bold text-card-foreground">
                    {outcome === 'won' ? 'Godt gjettet.' : 'Ordet glapp.'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {outcome === 'won'
                      ? `Ordet ble løst med ${MAX_WRONG_GUESSES - wrongCount} forsøk igjen.`
                      : `Ordet var ${roundWord.word}.`}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Tastatur
            </p>
            <div className="grid grid-cols-7 gap-2 sm:grid-cols-9">
              {LETTERS.map((letter) => {
                const isCorrect = correctLetters.includes(letter)
                const isWrong = wrongLetters.includes(letter)
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => processGuess(letter)}
                    disabled={outcome !== 'playing' || isCorrect || isWrong}
                    className={`rounded-md border px-1.5 py-2 text-xs font-bold transition-colors sm:text-sm ${
                      isCorrect
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isWrong
                          ? 'border-destructive bg-destructive text-destructive-foreground'
                          : 'border-border bg-card text-card-foreground hover:bg-accent'
                    } disabled:cursor-not-allowed disabled:opacity-80`}
                    aria-label={`Gjett ${letter}`}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Skriv en bokstav eller trykk på tastaturet.
          </p>
        </div>

        <aside
          className="grid grid-cols-2 gap-3 lg:grid-cols-1"
          aria-label="Rundestatus og kontroller"
        >
          <div className="col-span-2 flex items-center justify-between border-b border-border pb-3 lg:col-span-1 lg:block lg:pb-4">
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Forsøk igjen
            </span>
            <strong className="text-3xl text-card-foreground">
              {Math.max(0, MAX_WRONG_GUESSES - wrongCount)}
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
              Beste
            </span>
            <strong className="inline-flex items-center gap-1 text-xl text-card-foreground">
              <Trophy size={16} />
              {bestWins}
            </strong>
          </div>

          <button
            type="button"
            onClick={startNewRound}
            className="col-span-2 inline-flex items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:-translate-y-0.5 hover:bg-sidebar-primary lg:col-span-1"
          >
            <RotateCcw size={17} />
            {outcome === 'playing' ? 'Nytt ord' : 'Spill igjen'}
          </button>

          <div className="col-span-2 min-h-6 text-xs font-semibold text-muted-foreground lg:col-span-1">
            {duplicateLetter
              ? `Allerede gjettet: ${duplicateLetter}`
              : statusText}
          </div>

          <div className="col-span-2 text-xs text-muted-foreground lg:col-span-1">
            Gale bokstaver:{' '}
            {wrongLetters.length > 0 ? wrongLetters.join(', ') : 'ingen'}
          </div>
        </aside>
      </div>
    </section>
  )
}
