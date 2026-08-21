import type { GameType } from './types'
import type { ReactNode } from 'react'
import { SnakeGame } from './snake'

const gameComponents = {
  snakeGame: () => <SnakeGame />,
}

function renderBlock(game: GameType): ReactNode {
  switch (game) {
    case 'snakeGame': {
      const Block = gameComponents.snakeGame
      return <Block />
    }

    case 'breakout': {
      const Block = gameComponents.snakeGame
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
