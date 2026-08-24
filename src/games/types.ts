export type GameType =
  | 'snakeGame'
  | 'breakout'
  | 'tictactoe'
  | 'hangman'
  | 'wordle'
  | 'minesweeper'

export interface GameProps {
  onInteraction?: () => void
}

export const MOVES_REQUIRED_FOR_INTERACTION = 3
