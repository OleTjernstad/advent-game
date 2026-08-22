export type GameType = 'snakeGame' | 'breakout' | 'tictactoe'

export interface GameProps {
  onInteraction?: () => void
}

export const MOVES_REQUIRED_FOR_INTERACTION = 3
