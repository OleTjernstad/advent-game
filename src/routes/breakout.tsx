import { createFileRoute } from '@tanstack/react-router'
import { BreakoutGame } from '../games/breakout'

export const Route = createFileRoute('/breakout')({ component: BreakoutGame })
