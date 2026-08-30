import { Gift, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { GameType } from '#/games/types'
import { RenderGame } from '#/games/renderer'
import { Snowflakes } from '#/components/calendar/Snowflakes'
import { buildTitle } from '#/config/seo'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/game/$game')({
  head: ({ params }) => ({
    meta: [{ title: buildTitle(params.game) }],
  }),
  component: WindowPage,
})

function WindowPage() {
  const { game } = Route.useParams()

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div>
      <Snowflakes />

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Window layout */}
        <div
          className={`transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="grid overflow-hidden border-2 border-border bg-card/80 shadow-2xl backdrop-blur-sm md:grid-cols-[minmax(12rem,0.7fr)_minmax(0,2fr)]">
            <div className="flex min-h-46 items-center justify-center border-b-2 border-border bg-secondary/50 p-8 md:min-h-full md:border-r-2 md:border-b-0">
              <div className="relative">
                <div className="flex h-18 w-18 items-center justify-center rounded-full border-4 border-primary/70 bg-card shadow-lg shadow-primary/10 md:h-26 md:w-26">
                  <span className="text-5xl font-bold text-card-foreground md:text-6xl">
                    {game}
                  </span>
                </div>
                <Sparkles className="absolute -top-2 -right-2 h-7 w-7 animate-pulse text-primary" />
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 md:p-12">
              <div className="mb-6 flex items-center gap-3">
                <Gift className="h-6 w-6 shrink-0 text-primary md:h-8 md:w-8" />
                <h1 className="font-serif text-3xl font-bold text-card-foreground md:text-5xl">
                  {game}
                </h1>
              </div>

              <div className="mb-8 h-1 w-24 bg-linear-to-r from-border to-transparent" />

              <p className="font-sans text-lg leading-relaxed text-card-foreground md:text-xl">
                bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla
                bla bla bla bla bla bla bla bla bla bla bla
              </p>
            </div>
          </div>

          <section
            aria-label={`Spillområde for dag ${game}`}
            className="mt-6 flex min-h-104 items-center justify-center border-2 border-dashed border-border bg-card/60 p-6 shadow-xl backdrop-blur-sm md:min-h-136 md:p-10"
          >
            {game ? (
              <div className="w-full">
                <div className="mb-6 border-b border-border/70 pb-5">
                  <h2 className="text-2xl font-bold text-card-foreground md:text-3xl">
                    {game}
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    bla bla bla bla bla bla bla bla bla bla bla bla bla bla bla
                    bla bla bla bla bla bla bla bla bla bla bla bla
                  </p>
                </div>
                <RenderGame
                  game={game as GameType}
                  onInteraction={() => {
                    console.log('Interaction occurred in game:', game)
                  }}
                />
              </div>
            ) : game ? (
              <RenderGame
                game={game as GameType}
                onInteraction={() => {
                  console.log('Interaction occurred in game:', game)
                }}
              />
            ) : null}
          </section>

          {/* Bottom decoration */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground italic md:text-base">
              Dag x av 24
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
