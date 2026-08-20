import { ArrowLeft, Gift, Sparkles } from 'lucide-react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Snowflakes } from '#/components/calendar/Snowflakes'
import windowContent from '#/data/window-content.json'

export const Route = createFileRoute('/calendar/window/$day')({
  component: WindowPage,
})

function WindowPage() {
  const { day: dayParam } = Route.useParams()
  const router = useRouter()
  const day = Number(dayParam)
  const [isVisible, setIsVisible] = useState(false)

  const content = windowContent.windows.find((w) => w.day === day)

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timeout)
  }, [])

  if (!content) {
    return null
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-b from-[#0a1628] via-[#1a2f4a] to-[#0a1628]">
      <Snowflakes />

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Back button */}
        <button
          onClick={() => router.history.back()}
          className="mb-6 inline-flex items-center gap-2 text-[#d4af37] transition-colors duration-300 hover:text-[#f4e4c1]"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm md:text-base">Tilbake</span>
        </button>

        {/* Content card */}
        <div
          className={`mx-auto max-w-3xl transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {/* Window number badge */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#d4af37] bg-linear-to-br from-[#8b2635] to-[#5a1623] shadow-lg shadow-[#d4af37]/30 md:h-24 md:w-24">
                <span className="text-4xl font-bold text-[#f4e4c1] md:text-5xl">
                  {day}
                </span>
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 animate-pulse text-[#d4af37]" />
            </div>
          </div>

          {/* Main content card */}
          <div className="relative rounded-2xl border-2 border-[#d4af37] bg-[#1a3a2e]/80 p-8 shadow-2xl shadow-[#d4af37]/20 backdrop-blur-sm md:p-12">
            {/* Decorative corners */}
            <div className="absolute top-4 left-4 h-4 w-4 border-t-2 border-l-2 border-[#d4af37]" />
            <div className="absolute top-4 right-4 h-4 w-4 border-t-2 border-r-2 border-[#d4af37]" />
            <div className="absolute bottom-4 left-4 h-4 w-4 border-b-2 border-l-2 border-[#d4af37]" />
            <div className="absolute right-4 bottom-4 h-4 w-4 border-r-2 border-b-2 border-[#d4af37]" />

            {/* Title */}
            <div className="mb-6 flex items-center justify-center gap-3">
              <Gift className="h-6 w-6 text-[#d4af37] md:h-8 md:w-8" />
              <h1 className="text-center font-serif text-3xl font-bold text-[#f4e4c1] md:text-5xl">
                {content.title}
              </h1>
              <Gift className="h-6 w-6 text-[#d4af37] md:h-8 md:w-8" />
            </div>

            {/* Divider */}
            <div className="mx-auto mb-8 h-1 w-24 bg-linear-to-r from-transparent via-[#d4af37] to-transparent" />

            {/* Description */}
            <p className="text-center font-sans text-lg leading-relaxed text-[#f4e4c1] md:text-xl">
              {content.text}
            </p>

            {/* Decorative element */}
            <div className="mt-8 flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-2 animate-pulse rounded-full bg-[#d4af37]"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>

          {/* Bottom decoration */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[#d4af37] italic md:text-base">
              Dag {day} av 24
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
