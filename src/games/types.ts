export type GameType =
  | 'snakeGame'
  | 'breakout'
  | 'tictactoe'
  | 'hangman'
  | 'wordle'
  | 'minesweeper'
  | 'game2048'
  | 'maze'
  | 'memory'

export interface GameProps {
  onInteraction?: () => void
}

export const MOVES_REQUIRED_FOR_INTERACTION = 3
