import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, HTMLAttributes } from 'react'

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'article' | 'details' | 'section'
  /** Stagger index: each step delays the entrance by 70 ms. */
  step?: number
  /** For a `details`: open at first paint. */
  open?: boolean
}

/**
 * Fades and lifts its children in the first time they scroll into view. Without
 * IntersectionObserver (jsdom, very old browsers) everything is simply visible.
 */
export function Reveal({
  as: Tag = 'div',
  step = 0,
  className = '',
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = ref.current
    if (!node || shown) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [shown])

  return (
    <Tag
      ref={ref as never}
      data-shown={shown ? 'true' : 'false'}
      className={`landing-reveal ${className}`}
      style={{ ...style, '--reveal-step': step } as CSSProperties}
      {...props}
    />
  )
}
