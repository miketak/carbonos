import { useCountUp } from '../../../lib/useCountUp'
import { formatCo2e } from '../format'

/** A CO₂e value that counts up from zero on mount (instant under reduced motion). */
export function AnimatedCo2e({ kg, className }: { kg: number; className?: string }) {
  const value = useCountUp(kg)
  return <span className={className}>{formatCo2e(value)}</span>
}
