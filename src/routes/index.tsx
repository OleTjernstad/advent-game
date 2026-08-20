import { SnakeGame } from '../games/snake'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return <SnakeGame />
}
