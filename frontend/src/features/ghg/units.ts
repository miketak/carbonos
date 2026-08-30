import type { Dimension, Unit } from './api'

/** Display order and labels for the dimension-grouped unit picker. */
export const DIMENSION_ORDER: Dimension[] = [
  'ENERGY',
  'VOLUME',
  'MASS',
  'DISTANCE',
  'PASSENGER_DISTANCE',
]

export const DIMENSION_LABELS: Record<Dimension, string> = {
  ENERGY: 'Energy',
  VOLUME: 'Volume',
  MASS: 'Mass',
  DISTANCE: 'Distance',
  PASSENGER_DISTANCE: 'Passenger-distance',
}

/** Units grouped by dimension, in display order, for `<optgroup>`s. */
export function groupUnits(
  units: Unit[],
): { dimension: Dimension; label: string; units: Unit[] }[] {
  return DIMENSION_ORDER.map((dimension) => ({
    dimension,
    label: DIMENSION_LABELS[dimension],
    units: units.filter((unit) => unit.dimension === dimension),
  })).filter((group) => group.units.length > 0)
}

/** Finds a registered unit by its code (case-insensitive); undefined for custom units. */
export function findUnit(units: Unit[], code: string): Unit | undefined {
  const target = code.trim().toLowerCase()
  return units.find((unit) => unit.code.toLowerCase() === target)
}

/** The dimension of a (possibly custom) unit string, or null if unrecognized. */
export function unitDimension(units: Unit[], code: string): Dimension | null {
  return findUnit(units, code)?.dimension ?? null
}

/**
 * Converts a quantity between two registered units of the same dimension,
 * mirroring the backend (qty × toCanonical(from) / toCanonical(to)). Returns
 * null when either unit is custom or they differ in dimension — the caller then
 * shows no preview and relies on the backend to reconcile.
 */
export function convertQuantity(
  units: Unit[],
  quantity: number,
  from: string,
  to: string,
): number | null {
  const source = findUnit(units, from)
  const target = findUnit(units, to)
  if (!source || !target || source.dimension !== target.dimension) return null
  return (quantity * source.toCanonical) / target.toCanonical
}
