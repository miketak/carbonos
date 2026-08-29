import { useEffect, useRef, useState } from 'react'

const WORDMARK = 'CarbonOS'
const TAGLINE = 'Measure. Certify. Sustain.'
const EXIT_MS = 9650
const DONE_MS = 10000
const SKIP_EXIT_MS = 300

/* the boot log is theater: everything is already loaded underneath */
const BOOT_LINES = [
  'Initializing inventory engine',
  'Loading emission factor library',
  'Mounting organizational boundaries',
  'Indexing activity data',
  'Calibrating consolidation models',
  'Verifying audit trail integrity',
  'Securing session',
]
const BOOT_LINE_START_MS = 2000
const BOOT_LINE_STEP_MS = 950
const BOOT_CHECK_DELAY_MS = 500
const BOOT_PROGRESS_MS = 7300

const EXPO_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

let splashListener: (() => void) | null = null

/** Ask the mounted SplashGate to play the splash — called right after a successful login. */
export function triggerSplash() {
  splashListener?.()
}

/** Mounted once in App: overlays the splash above whatever route is loading beneath it. */
export function SplashGate() {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    splashListener = () => setPlaying(true)
    return () => {
      splashListener = null
    }
  }, [])

  if (!playing) {
    return null
  }
  return <SplashScreen onDone={() => setPlaying(false)} />
}

/**
 * "Core power-up": two arcs rotate in and lock into an instrument ring, the
 * core ignites with one bloom, and the solid gradient wordmark wipes in below.
 * Pure DOM + CSS animations — the global reduced-motion rule collapses every
 * phase to the finished lockup instantly.
 */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), EXIT_MS)
    const doneTimer = setTimeout(() => onDoneRef.current(), DONE_MS)
    let skipTimer: ReturnType<typeof setTimeout> | undefined

    const skip = () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
      setExiting(true)
      skipTimer ??= setTimeout(() => onDoneRef.current(), SKIP_EXIT_MS)
    }
    window.addEventListener('pointerdown', skip)
    window.addEventListener('keydown', skip)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
      clearTimeout(skipTimer)
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
    }
  }, [])

  return (
    <div
      role="status"
      aria-label={`${WORDMARK} — ${TAGLINE}`}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-dark-teal via-[#17444b] to-[#0c2b30] transition-opacity duration-300 ease-in ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center gap-6 transition-transform duration-300 ease-in ${
          exiting ? '-translate-y-2' : ''
        }`}
      >
        <CoreEmblem />

        <p
          className="bg-gradient-to-r from-teal via-bright-teal to-accent-green bg-clip-text text-6xl font-bold tracking-tight text-transparent"
          style={{ animation: `splash-wipe 500ms ${EXPO_OUT} 1050ms both` }}
        >
          {WORDMARK}
        </p>

        <div
          className="h-px w-72 bg-gradient-to-r from-transparent via-bright-teal/70 to-transparent"
          style={{ animation: `splash-rule 400ms ${EXPO_OUT} 1300ms both` }}
        />

        <p
          className="text-sm tracking-widest text-white/70 uppercase"
          style={{ animation: 'splash-rise 400ms ease-out 1500ms both' }}
        >
          {TAGLINE}
        </p>

        <BootLog />
      </div>
    </div>
  )
}

/** Staged status lines + progress bar: the confidence-inspiring boot sequence. */
function BootLog() {
  return (
    <div
      className="mt-2 flex w-80 flex-col gap-3"
      style={{ animation: `splash-rise 400ms ease-out ${BOOT_LINE_START_MS - 200}ms both` }}
    >
      <div className="h-0.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full origin-left rounded-full bg-gradient-to-r from-teal to-accent-green"
          style={{
            animation: `splash-progress ${BOOT_PROGRESS_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${BOOT_LINE_START_MS}ms both`,
          }}
        />
      </div>
      <ul className="flex flex-col gap-1.5 font-mono text-[11px] tracking-wide text-white/60">
        {BOOT_LINES.map((line, index) => {
          const lineDelay = BOOT_LINE_START_MS + index * BOOT_LINE_STEP_MS
          return (
            <li
              key={line}
              className="flex items-center justify-between gap-4"
              style={{ animation: `splash-rise 300ms ease-out ${lineDelay}ms both` }}
            >
              <span>{line}</span>
              <span
                className="text-accent-green"
                style={{
                  animation: `splash-tick 200ms ease-out ${lineDelay + BOOT_CHECK_DELAY_MS}ms both`,
                }}
              >
                ✓
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** The instrument ring: two arcs rotating into lock, cardinal ticks, igniting core. */
function CoreEmblem() {
  return (
    <div className="relative" style={{ animation: 'splash-lock 200ms ease-out 700ms both' }}>
      {/* ignition bloom */}
      <div
        className="absolute -inset-6 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(5, 206, 187, 0.85), transparent 60%)',
          animation: 'splash-bloom 420ms ease-out 820ms both',
        }}
      />
      <svg viewBox="0 0 120 120" aria-hidden="true" className="relative h-24 w-24">
        {/* two 120° arcs rotating in from opposite directions */}
        <path
          d="M 18.43 36 A 48 48 0 0 1 101.57 36"
          fill="none"
          stroke="#09a895"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="splash-arc"
          style={{ animation: `splash-arc-cw 700ms ${EXPO_OUT} both` }}
        />
        <path
          d="M 101.57 84 A 48 48 0 0 1 18.43 84"
          fill="none"
          stroke="#05cebb"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="splash-arc"
          style={{ animation: `splash-arc-ccw 700ms ${EXPO_OUT} both` }}
        />
        {/* cardinal ticks appear at the lock */}
        {[
          [60, 6],
          [114, 60],
          [60, 114],
          [6, 60],
        ].map(([cx, cy]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="1.6"
            fill="rgba(255, 255, 255, 0.45)"
            style={{ animation: 'splash-tick 200ms ease-out 550ms both' }}
          />
        ))}
        {/* the core ignites accent-green at the bloom */}
        <circle
          cx="60"
          cy="60"
          r="5"
          style={{ animation: 'splash-core 300ms ease-out 820ms both' }}
        />
      </svg>
    </div>
  )
}
