import { TicTacToeGame } from '#/games/tic-tac-toe'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tic-tac-toe')({
  component: TicTacToeGame,
})
