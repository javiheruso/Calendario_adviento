/**
 * Percentage layout for the 24 stars over the final fir artwork.
 *
 * The tree scene keeps the source image aspect ratio (`2 / 3`), so every
 * position is expressed as a percentage of that container. The same numbers
 * therefore place the stars correctly on a phone and on a desktop, and the
 * star size is also a percentage of the container width.
 *
 * The rows grow from one star at the tip to four near the base, following the
 * triangular silhouette. Day 24 owns the tip and is rendered slightly larger
 * as the final-star reward. All positions stay above the wrapped gifts at the
 * bottom of the artwork.
 */
import type { MissionDay } from './types'

export interface StarPosition {
  readonly day: MissionDay
  /** Horizontal centre as a percentage of the tree artwork width. */
  readonly left: number
  /** Vertical centre as a percentage of the tree artwork height. */
  readonly top: number
  /** Star width as a percentage of the tree artwork width. */
  readonly size: number
}

/** Default width of one star as a percentage of the tree artwork width. */
export const STAR_SIZE_PERCENT = 7
/** The day 24 star sits at the tip and is deliberately a little larger. */
export const STAR_FINAL_SIZE_PERCENT = 10

/**
 * Positions run from the tip downwards. Day 24 is the tip star; the remaining
 * days are assigned in descending order so every day still has exactly one
 * unique centre.
 */
export const STAR_POSITIONS: readonly StarPosition[] = [
  { day: 24, left: 50, top: 10, size: STAR_FINAL_SIZE_PERCENT },
  { day: 23, left: 45, top: 19, size: STAR_SIZE_PERCENT },
  { day: 22, left: 55, top: 19, size: STAR_SIZE_PERCENT },
  { day: 21, left: 39, top: 28, size: STAR_SIZE_PERCENT },
  { day: 20, left: 50, top: 28, size: STAR_SIZE_PERCENT },
  { day: 19, left: 61, top: 28, size: STAR_SIZE_PERCENT },
  { day: 18, left: 34, top: 37, size: STAR_SIZE_PERCENT },
  { day: 17, left: 50, top: 37, size: STAR_SIZE_PERCENT },
  { day: 16, left: 66, top: 37, size: STAR_SIZE_PERCENT },
  { day: 15, left: 29, top: 46, size: STAR_SIZE_PERCENT },
  { day: 14, left: 43, top: 46, size: STAR_SIZE_PERCENT },
  { day: 13, left: 57, top: 46, size: STAR_SIZE_PERCENT },
  { day: 12, left: 71, top: 46, size: STAR_SIZE_PERCENT },
  { day: 11, left: 24, top: 55, size: STAR_SIZE_PERCENT },
  { day: 10, left: 41, top: 55, size: STAR_SIZE_PERCENT },
  { day: 9, left: 59, top: 55, size: STAR_SIZE_PERCENT },
  { day: 8, left: 76, top: 55, size: STAR_SIZE_PERCENT },
  { day: 7, left: 19, top: 64, size: STAR_SIZE_PERCENT },
  { day: 6, left: 38, top: 64, size: STAR_SIZE_PERCENT },
  { day: 5, left: 62, top: 64, size: STAR_SIZE_PERCENT },
  { day: 4, left: 81, top: 64, size: STAR_SIZE_PERCENT },
  { day: 3, left: 30, top: 73, size: STAR_SIZE_PERCENT },
  { day: 2, left: 50, top: 73, size: STAR_SIZE_PERCENT },
  { day: 1, left: 70, top: 73, size: STAR_SIZE_PERCENT },
]
