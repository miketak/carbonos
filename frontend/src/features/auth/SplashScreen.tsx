import { useEffect, useRef, useState } from 'react'
import { CarbonOsMark } from '../../components/CarbonOsMark'
import { Wordmark } from '../../components/Wordmark'

const WORDMARK = 'CarbonOS'
const TAGLINE = 'Measure. Certify. Sustain.'
// short and quiet (spec 10, as amended 2026-10-05): the mark settles, the name and the line
// follow, and the app is there under a second and a half later; any key or pointer skips it
const EXIT_MS = 1300
const DONE_MS = 1600
const SKIP_EXIT_MS = 200
const EXPO_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

let splashListener: (() => void) | null = null

/** Ask the mounted SplashGate to play the splash; called right after a successful login. */
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
 * The lockup on the brand's dark teal: the mark settles in, the wordmark and
 * the tagline rise under it, the whole fades to the app. Pure CSS animations;
 * the global reduced-motion rule collapses every phase to the finished lockup
 * at once. It claims nothing (ticket T-25): everything is already loaded
 * beneath it.
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
      aria-label={`${WORDMARK}: ${TAGLINE}`}
      className={`splash fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center gap-7 transition-transform duration-300 ease-in ${
          exiting ? '-translate-y-1' : ''
        }`}
      >
        <div style={{ animation: `splash-settle 600ms ${EXPO_OUT} both` }}>
          <CarbonOsMark size={96} />
        </div>
        <div style={{ animation: `splash-rise 450ms ${EXPO_OUT} 350ms both` }}>
          <Wordmark size="splash" surface="dark" symbol={false} byline={false} />
        </div>
        <p
          className="splash-tagline text-sm font-medium tracking-[0.08em] uppercase"
          style={{ animation: `splash-rise 450ms ${EXPO_OUT} 550ms both` }}
        >
          {TAGLINE}
        </p>
      </div>
    </div>
  )
}
