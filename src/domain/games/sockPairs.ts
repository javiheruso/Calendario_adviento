/**
 * Day 9 mismatched-socks rules.
 *
 * Ten socks form five pairs. Selecting two socks of the same pair matches
 * them; a mismatch clears itself after a short pause. The playful countdown is
 * independent from success: the child can always keep matching, extend the
 * timer or restart it without any penalty.
 */
import { shuffle } from './shuffle'

export const SOCK_PAIRS = 5
export const SOCK_COUNT = SOCK_PAIRS * 2
export const SOCK_TIMER_SECONDS = 60
export const SOCK_EXTENSION_SECONDS = 30

export interface Sock {
  readonly id: number
  readonly pairId: number
  readonly selected: boolean
  readonly matched: boolean
}

export interface SockState {
  readonly socks: readonly Sock[]
  /** True while two different socks are selected, before the UI clears them. */
  readonly hasMismatch: boolean
}

export function createSockState(
  pairCount: number = SOCK_PAIRS,
  random: () => number = Math.random,
): SockState {
  const socks: Sock[] = []

  for (let pairId = 0; pairId < pairCount; pairId += 1) {
    socks.push({ id: pairId * 2, pairId, selected: false, matched: false })
    socks.push({ id: pairId * 2 + 1, pairId, selected: false, matched: false })
  }

  return { socks: shuffle(socks, random), hasMismatch: false }
}

/**
 * Selects one sock. A matching second sock locks the pair; a non-matching one
 * sets `hasMismatch` so the UI can call `resolveSockMismatch` after a pause.
 */
export function selectSock(state: SockState, sockId: number): SockState {
  if (state.hasMismatch) {
    return state
  }

  const selected = state.socks.filter((sock) => sock.selected && !sock.matched)

  if (selected.length >= 2) {
    return state
  }

  const target = state.socks.find((sock) => sock.id === sockId)

  if (!target || target.selected || target.matched) {
    return state
  }

  const socks = state.socks.map((sock) =>
    sock.id === sockId ? { ...sock, selected: true } : sock,
  )
  const nowSelected = socks.filter((sock) => sock.selected && !sock.matched)

  if (
    nowSelected.length === 2 &&
    nowSelected[0].pairId === nowSelected[1].pairId
  ) {
    const matchedIds = new Set(nowSelected.map((sock) => sock.id))

    return {
      socks: socks.map((sock) =>
        matchedIds.has(sock.id) ? { ...sock, matched: true, selected: false } : sock,
      ),
      hasMismatch: false,
    }
  }

  return { socks, hasMismatch: nowSelected.length === 2 }
}

/** Clears the two mismatched selections. Never removes matched pairs. */
export function resolveSockMismatch(state: SockState): SockState {
  if (!state.hasMismatch) {
    return state
  }

  return {
    socks: state.socks.map((sock) =>
      sock.selected && !sock.matched ? { ...sock, selected: false } : sock,
    ),
    hasMismatch: false,
  }
}

export function matchedSockPairs(state: SockState): number {
  return new Set(
    state.socks.filter((sock) => sock.matched).map((sock) => sock.pairId),
  ).size
}

export function isSockComplete(state: SockState): boolean {
  return state.socks.length > 0 && state.socks.every((sock) => sock.matched)
}
