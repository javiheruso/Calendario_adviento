/**
 * Percentage layout for the 24 stars over the final fir artwork.
 *
 * The tree scene keeps the source image aspect ratio (`2 / 3`), so every
 * position is expressed as a percentage of that container. The same numbers
 * therefore place the stars correctly on a phone and on a desktop, and the
 * star size is also a percentage of the container width.
 *
 * The rows grow from one star at the top to four near the base, following the
 * triangular silhouette. All positions stay above the wrapped gifts at the
 * bottom of the artwork.
 */
import type { MissionDay } from './types'

export interface StarPosition {
  readonly day: MissionDay
  /** Horizontal centre as a percentage of the tree artwork width. */
  readonly left: number
  /** Vertical centre as a percentage of the tree artwork height. */
  readonly top: number
}

/** Width of one star as a percentage of the tree artwork width. */
export const STAR_SIZE_PERCENT = 7

export const STAR_POSITIONS: readonly StarPosition[] = [
  { day: 1, left: 50, top: 10 },
  { day: 2, left: 45, top: 19 },
  { day: 3, left: 55, top: 19 },
  { day: 4, left: 39, top: 28 },
  { day: 5, left: 50, top: 28 },
  { day: 6, left: 61, top: 28 },
  { day: 7, left: 34, top: 37 },
  { day: 8, left: 50, top: 37 },
  { day: 9, left: 66, top: 37 },
  { day: 10, left: 29, top: 46 },
  { day: 11, left: 43, top: 46 },
  { day: 12, left: 57, top: 46 },
  { day: 13, left: 71, top: 46 },
  { day: 14, left: 24, top: 55 },
  { day: 15, left: 41, top: 55 },
  { day: 16, left: 59, top: 55 },
  { day: 17, left: 76, top: 55 },
  { day: 18, left: 19, top: 64 },
  { day: 19, left: 38, top: 64 },
  { day: 20, left: 62, top: 64 },
  { day: 21, left: 81, top: 64 },
  { day: 22, left: 30, top: 73 },
  { day: 23, left: 50, top: 73 },
  { day: 24, left: 70, top: 73 },
]
