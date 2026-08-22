import { BreakoutGame } from './breakout'
import type { GameType } from './types'
import type { ReactNode } from 'react'
import { SnakeGame } from './snake'
import { TicTacToeGame } from './tic-tac-toe'

const gameComponents = {
  snakeGame: () => <SnakeGame />,
  breakout: () => <BreakoutGame />,
  tictactoe: () => <TicTacToeGame />,
}

function renderBlock(game: GameType): ReactNode {
  switch (game) {
    case 'snakeGame': {
      const Block = gameComponents.snakeGame
      return <Block />
    }

    case 'breakout': {
      const Block = gameComponents.breakout
      return <Block />
    }

    case 'tictactoe': {
      const Block = gameComponents.tictactoe
      return <Block />
    }

    default:
      return null
  }
}

interface RenderGameProps {
  game: GameType
}

export function RenderGame({ game }: RenderGameProps) {
  return renderBlock(game)
}
