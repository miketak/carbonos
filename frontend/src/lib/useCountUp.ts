import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 800

/**
 * Animate a number from 0 to `target` with an ease-out curve.
 * Instant when motion is reduced or matchMedia is unavailable (jsdom/tests),
 * so assertions and reduced-motion users always see the final value.
 */
export function useCountUp(target: number): number {
  const animate =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [value, setValue] = useState(animate ? 0 : target)
  const animateRef = useRef(animate)

  useEffect(() => {
    if (!animateRef.current) {
      setValue(target)
      return
    }
    let rafId = 0
    const start = performance.now()
    const frame = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS, 1)
      setValue(target * (1 - Math.pow(1 - t, 3)))
      if (t < 1) {
        rafId = requestAnimationFrame(frame)
      }
    }
    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [target])

  return value
}
