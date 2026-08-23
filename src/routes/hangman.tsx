import { HangmanGame } from '#/games/hangman'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/hangman')({
  component: HangmanGame,
})
