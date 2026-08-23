export type GameType = 'snakeGame' | 'breakout' | 'tictactoe' | 'hangman'

export interface GameProps {
  onInteraction?: () => void
}

export const MOVES_REQUIRED_FOR_INTERACTION = 3
