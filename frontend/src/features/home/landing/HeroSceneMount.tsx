import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useReducedMotion } from './useReducedMotion'

const HeroScene = lazy(() => import('./HeroScene'))

/**
 * True only when a WebGL 2 context can actually be created. The constructor
 * alone is not enough: a locked-down corporate laptop or a GPU-blocklisted
 * phone has the class and still returns null from getContext.
 */
function canRenderWebGL(): boolean {
  if (typeof window === 'undefined' || !('WebGL2RenderingContext' in window)) return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

/** The scene sits below the fold on a phone, so the 3D bundle is not worth the download there. */
function worthTheBundle(): boolean {
  if (typeof window === 'undefined') return false
  if (window.innerWidth < 768) return false
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return !connection?.saveData
}

/** A flat picture of the same stack for browsers without WebGL and for tests. */
export function StaticStack() {
  return (
    <svg
      viewBox="0 0 400 320"
      className="h-full w-full"
      role="img"
      aria-label="Three stacked layers labelled Scope 1, Scope 2 and Scope 3"
    >
      <defs>
        <linearGradient id="slab" x1="0" x2="1">
          <stop offset="0" stopColor="#0a7d70" />
          <stop offset="1" stopColor="#05cebb" />
        </linearGradient>
      </defs>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(0 ${i * 70})`} opacity={0.9 - i * 0.15}>
          <polygon points="80,90 220,40 340,90 200,140" fill="url(#slab)" opacity="0.75" />
          <polygon points="80,90 200,140 200,156 80,106" fill="#0a7d70" opacity="0.6" />
          <polygon points="200,140 340,90 340,106 200,156" fill="#09a895" opacity="0.5" />
          <text x="348" y="94" fill="#246169" fontSize="13" fontWeight="600">
            Scope {i + 1}
          </text>
        </g>
      ))}
    </svg>
  )
}

/** If the scene throws (a lost context, a driver that lies), the page keeps its illustration. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <StaticStack /> : this.props.children
  }
}

/**
 * Lazily mounts the WebGL hero. The three.js bundle is fetched only on this
 * page, only in browsers that can run it and on screens where it is visible,
 * and the scene stops rendering while it is scrolled out of view or when the
 * reader prefers reduced motion.
 */
export function HeroSceneMount() {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [supported] = useState(() => worthTheBundle() && canRenderWebGL())

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) =>
      setVisible(entries.some((entry) => entry.isIntersecting)),
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="hero-scene" aria-hidden={supported ? 'true' : undefined}>
      {supported ? (
        <SceneBoundary>
          <Suspense fallback={<StaticStack />}>
            <HeroScene animate={visible && !reduced} />
          </Suspense>
        </SceneBoundary>
      ) : (
        <StaticStack />
      )}
    </div>
  )
}
