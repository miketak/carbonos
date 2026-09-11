/** A thin meter for a share of something done; the label names what it measures. */
export function ProgressBar({ label, percent }: { label: string; percent: number }) {
  const value = Math.max(0, Math.min(100, Math.round(percent)))
  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="h-1.5 w-32 overflow-hidden rounded-full bg-teal/15"
      >
        <div className="h-full rounded-full bg-teal-deep" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold text-dark-teal">{value}%</span>
    </div>
  )
}
