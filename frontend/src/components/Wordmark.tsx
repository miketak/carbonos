import { CarbonOsMark } from './CarbonOsMark'

export type WordmarkSize = 'nav' | 'page' | 'splash'
export type WordmarkSurface = 'light' | 'dark'

/*
 * Symbol, CARBONOS, and a small byline underneath. The name is set in the DOM
 * as "CarbonOS" and capitalised by CSS, so screen readers say the word and
 * tests keep finding it. The wordmark is solid, never gradient text: the
 * green end of the brand gradient fails contrast on every surface we use, and
 * the gradient belongs to the symbol alone.
 */

// caps need more air when small, so the tracking eases as the size grows; the
// `/none` line-height keeps the byline tight under the word (a bare text-lg
// brings its own 28px line-height and pushes the byline 12px down)
const sizes: Record<WordmarkSize, { gap: string; mark: number; word: string; byline: string }> = {
  nav: {
    gap: 'gap-2',
    mark: 28,
    word: 'text-lg/none tracking-[0.08em]',
    byline: 'mt-[3px] text-[11px] tracking-[0.18em]',
  },
  page: {
    gap: 'gap-2.5',
    mark: 36,
    word: 'text-2xl/none tracking-[0.07em]',
    byline: 'mt-0.5 text-[12px] tracking-[0.16em]',
  },
  splash: {
    gap: 'gap-4',
    mark: 64,
    word: 'text-5xl/none tracking-[0.06em]',
    byline: 'mt-1.5 text-[13px] tracking-[0.18em]',
  },
}

// dark teal for the byline too: 4.8:1 on the hero's palest band, where ink-muted dips under 4.5
const surfaces: Record<WordmarkSurface, { word: string; byline: string }> = {
  light: { word: 'text-dark-teal', byline: 'text-dark-teal' },
  dark: { word: 'text-white', byline: 'text-white/80' },
}

interface WordmarkProps {
  size?: WordmarkSize
  surface?: WordmarkSurface
  /** The line under the name; `false` hides it. */
  byline?: string | false
  /** The symbol beside the name; the splash already has its own emblem above. */
  symbol?: boolean
  className?: string
}

export function Wordmark({
  size = 'nav',
  surface = 'light',
  byline = 'by ECORIV',
  symbol = true,
  className = '',
}: WordmarkProps) {
  const s = sizes[size]
  const tone = surfaces[surface]
  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      {symbol && <CarbonOsMark size={s.mark} />}
      <span className="flex flex-col items-start leading-none">
        <span className={`font-extrabold uppercase ${s.word} ${tone.word}`}>CarbonOS</span>
        {byline && (
          <span className={`font-semibold uppercase ${s.byline} ${tone.byline}`}>{byline}</span>
        )}
      </span>
    </span>
  )
}
