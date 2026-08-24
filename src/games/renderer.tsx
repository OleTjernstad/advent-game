import { BreakoutGame } from './breakout'
import { Game2048 } from './game2048'
import { HangmanGame } from './hangman'
import { MazeGame } from './maze'
import { MemoryGame } from './memory'
import { MinesweeperGame } from './minesweeper'
import type { GameType } from './types'
import type { ReactNode } from 'react'
import { SnakeGame } from './snake'
import { TicTacToeGame } from './tic-tac-toe'
import { WordleGame } from './wordle'

const gameComponents = {
  snakeGame: (onInteraction?: () => void) => (
    <SnakeGame onInteraction={onInteraction} />
  ),
  breakout: () => <BreakoutGame />,
  tictactoe: () => <TicTacToeGame />,
  hangman: (onInteraction?: () => void) => (
    <HangmanGame onInteraction={onInteraction} />
  ),
  wordle: (onInteraction?: () => void) => (
    <WordleGame onInteraction={onInteraction} />
  ),
  minesweeper: (onInteraction?: () => void) => (
    <MinesweeperGame onInteraction={onInteraction} />
  ),
  game2048: (onInteraction?: () => void) => (
    <Game2048 onInteraction={onInteraction} />
  ),
  maze: (onInteraction?: () => void) => (
    <MazeGame onInteraction={onInteraction} />
  ),
  memory: (onInteraction?: () => void) => (
    <MemoryGame onInteraction={onInteraction} />
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

    case 'wordle': {
      const Block = gameComponents.wordle
      return Block(onInteraction)
    }

    case 'minesweeper': {
      const Block = gameComponents.minesweeper
      return Block(onInteraction)
    }

    case 'game2048': {
      const Block = gameComponents.game2048
      return Block(onInteraction)
    }

    case 'maze': {
      const Block = gameComponents.maze
      return Block(onInteraction)
    }

    case 'memory': {
      const Block = gameComponents.memory
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
