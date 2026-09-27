/*
 * The CarbonOS symbol's numbers, shared by the React mark and the favicon test.
 * Change them here and redraw public/favicon.svg to match.
 */

export const MARK_VIEWBOX = '0 0 64 64'

/** The six stops of the ECORIV symbol, left to right. */
export const MARK_GRADIENT: ReadonlyArray<readonly [offset: number, colour: string]> = [
  [0, '#00b6aa'],
  [0.15, '#05b8a7'],
  [0.33, '#15bfa0'],
  [0.54, '#2fca93'],
  [0.77, '#53da82'],
  [1, '#82ef6d'],
]

/** Centre 32,32, radius 25, open between -40 and +40 degrees on the right. */
export const MARK_RING = 'M 51.15 48.07 A 25 25 0 1 1 51.15 15.93'
export const MARK_RING_STROKE = 8

/**
 * Three scope bars, left-aligned inside the ring, widest at the bottom, in
 * steps of 7 so the wedge still shows at 16px; the 5-unit gaps survive it too.
 *
 * The gradient deliberately runs green on the heavy left arc to teal on the
 * thin ring tips, the reverse of the ECORIV symbol: the thinnest marks get the
 * darkest stop, or the tips vanish on a light surface (1.03:1 the other way).
 */
export const MARK_BARS: ReadonlyArray<{ x: number; y: number; width: number }> = [
  { x: 20, y: 18, width: 10 },
  { x: 20, y: 29, width: 17 },
  { x: 20, y: 40, width: 24 },
]
export const MARK_BAR_HEIGHT = 6
export const MARK_BAR_RADIUS = 3
