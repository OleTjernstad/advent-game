import { BreakoutGame } from './breakout'
import { HangmanGame } from './hangman'
import type { GameType } from './types'
import type { ReactNode } from 'react'
import { SnakeGame } from './snake'
import { TicTacToeGame } from './tic-tac-toe'

const gameComponents = {
  snakeGame: (onInteraction?: () => void) => (
    <SnakeGame onInteraction={onInteraction} />
  ),
  breakout: () => <BreakoutGame />,
  tictactoe: () => <TicTacToeGame />,
  hangman: (onInteraction?: () => void) => (
    <HangmanGame onInteraction={onInteraction} />
  ),
}

function renderBlock(game: GameType, onInteraction?: () => void): ReactNode {
  switch (game) {
    case 'snakeGame': {
      const Block = gameComponents.snakeGame
      return Block(onInteraction)
    }

    case 'breakout': {
      const Block = gameComponents.breakout
      return <Block />
    }

    case 'tictactoe': {
      const Block = gameComponents.tictactoe
      return <Block />
    }

    case 'hangman': {
      const Block = gameComponents.hangman
      return Block(onInteraction)
    }

    default:
      return null
  }
}

interface RenderGameProps {
  game: GameType
  onInteraction?: () => void
}

export function RenderGame({ game, onInteraction }: RenderGameProps) {
  return renderBlock(game, onInteraction)
}
