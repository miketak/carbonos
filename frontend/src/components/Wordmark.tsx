import { CarbonOsMark } from './CarbonOsMark'

export type WordmarkSize = 'nav' | 'page' | 'splash'
export type WordmarkSurface = 'light' | 'dark'

/*
 * Symbol and CarbonOS, with a small byline underneath (spec 10). The name is
 * title case, bold, tight against the symbol, and two-tone: "OS" takes the
 * brand teal that passes on the surface (teal-deep on light, bright teal on
 * dark). Screen readers get the word once, from a visually hidden span; the
 * two-tone copy is decoration, so tests and readers find "CarbonOS" whole.
 */

// the symbol's optical centre sits a hair above the text's; `/none` keeps the byline tight
const sizes: Record<
  WordmarkSize,
  { gap: string; mark: number; markClass?: string; word: string; byline: string }
> = {
  nav: {
    gap: 'gap-1',
    mark: 28,
    markClass: 'size-6 sm:size-7 -mt-px',
    word: 'text-lg/none tracking-[-0.01em] sm:text-xl/none',
    byline: 'mt-[3px] text-[10px] tracking-[0.18em] sm:text-[11px]',
  },
  page: {
    gap: 'gap-1.5',
    mark: 40,
    markClass: '-mt-px',
    word: 'text-[26px]/none tracking-[-0.01em]',
    byline: 'mt-0.5 text-[12px] tracking-[0.16em]',
  },
  splash: {
    gap: 'gap-3',
    mark: 64,
    word: 'text-5xl/none tracking-[-0.01em]',
    byline: 'mt-1.5 text-[13px] tracking-[0.18em]',
  },
}

const surfaces: Record<WordmarkSurface, { word: string; os: string; byline: string }> = {
  light: { word: 'text-ink', os: 'text-teal-deep', byline: 'text-ink-muted' },
  dark: { word: 'text-white', os: 'text-bright-teal', byline: 'text-white/80' },
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
      {symbol && <CarbonOsMark size={s.mark} className={s.markClass} />}
      <span className="flex flex-col items-start leading-none">
        <span className="sr-only">CarbonOS</span>
        <span aria-hidden="true" className={`font-bold ${s.word} ${tone.word}`}>
          Carbon<span className={tone.os}>OS</span>
        </span>
        {byline && (
          <span className={`font-semibold uppercase ${s.byline} ${tone.byline}`}>{byline}</span>
        )}
      </span>
    </span>
  )
}
