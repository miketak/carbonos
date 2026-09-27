import { useId } from 'react'
import {
  MARK_BAR_HEIGHT,
  MARK_BAR_RADIUS,
  MARK_BARS,
  MARK_GRADIENT,
  MARK_RING,
  MARK_RING_STROKE,
  MARK_VIEWBOX,
} from './carbonOsMarkGeometry'

/*
 * The CarbonOS symbol: a C-shaped ring, open on the right, holding three bars
 * of stepped width. The ring is the C of Carbon and the verification ring the
 * product keeps returning to; the bars are the three scopes, the widest at the
 * bottom because the third is usually the largest. The gradient is ECORIV's
 * own, taken from the company symbol, and sweeps once across the whole mark.
 *
 * The numbers live in carbonOsMarkGeometry.ts; the favicon is written from the
 * same ones, and CarbonOsMark.test.tsx fails if the two drift apart.
 */

interface CarbonOsMarkProps {
  /** Rendered size in pixels; the mark is square. */
  size?: number
  /** `mono` draws in `currentColor` for places where the gradient would not read. */
  variant?: 'gradient' | 'mono'
  /** Given a title the mark is an image; without one it is decoration beside the wordmark. */
  title?: string
  className?: string
}

export function CarbonOsMark({
  size = 28,
  variant = 'gradient',
  title,
  className = '',
}: CarbonOsMarkProps) {
  // two marks on one page (nav and footer) must not share a gradient id
  const gradientId = useId()
  const paint = variant === 'gradient' ? `url(#${gradientId})` : 'currentColor'
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      width={size}
      height={size}
      className={className}
      shapeRendering="geometricPrecision"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
    >
      {title && <title>{title}</title>}
      {variant === 'gradient' && (
        <defs>
          {/* green on the heavy left arc, teal on the thin ring tips: the thinnest marks get the darkest stop */}
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="60"
            y1="32"
            x2="4"
            y2="32"
          >
            {MARK_GRADIENT.map(([offset, colour]) => (
              <stop key={offset} offset={offset} stopColor={colour} />
            ))}
          </linearGradient>
        </defs>
      )}
      <path
        d={MARK_RING}
        fill="none"
        stroke={paint}
        strokeWidth={MARK_RING_STROKE}
        strokeLinecap="round"
      />
      {MARK_BARS.map((bar) => (
        <rect
          key={bar.y}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={MARK_BAR_HEIGHT}
          rx={MARK_BAR_RADIUS}
          fill={paint}
        />
      ))}
    </svg>
  )
}
