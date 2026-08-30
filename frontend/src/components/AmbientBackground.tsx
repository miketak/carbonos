import { useLocation } from 'react-router-dom'

/* Grain texture: inline SVG turbulence, tiled at very low opacity for tactility. */
const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")`

/**
 * The fixed ambient layer every page sits on: slow-drifting brand-color blobs
 * that give the glassmorphism surfaces real color to refract, plus grain.
 * DR-06: full on the public/marketing pages, dimmed on authenticated pages so
 * the aurora doesn't compete with data-dense content.
 */
export function AmbientBackground() {
  const { pathname } = useLocation()
  const dimmed = pathname.startsWith('/app') || pathname.startsWith('/admin')

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-soft-mint via-soft-mint to-bright-teal/15" />
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${dimmed ? 'opacity-[0.55]' : 'opacity-100'}`}
      >
        <div
          className="absolute -top-[20%] -left-[10%] h-[55vmax] w-[55vmax] rounded-full bg-teal/25 blur-3xl"
          style={{ animation: 'aurora-a 70s ease-in-out infinite alternate' }}
        />
        <div
          className="absolute top-[10%] -right-[15%] h-[50vmax] w-[50vmax] rounded-full bg-bright-teal/20 blur-3xl"
          style={{ animation: 'aurora-b 85s ease-in-out infinite alternate' }}
        />
        <div
          className="absolute -bottom-[25%] left-[20%] h-[45vmax] w-[45vmax] rounded-full bg-accent-green/20 blur-3xl"
          style={{ animation: 'aurora-c 95s ease-in-out infinite alternate' }}
        />
      </div>
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{ backgroundImage: grain, backgroundSize: '160px 160px' }}
      />
    </div>
  )
}
