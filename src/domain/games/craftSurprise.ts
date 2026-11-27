/**
 * Day 23 surprise-for-Trasto rules.
 *
 * The child chooses one of three handmade gifts for Trasto: a drawing, a letter
 * or a craft. The family confirms the chosen surprise manually and the game
 * shows Trasto's farewell. No photo, video or camera is used in this phase.
 */

export type CraftSurpriseKind = 'drawing' | 'letter' | 'craft'

export interface CraftSurpriseOption {
  readonly id: CraftSurpriseKind
  readonly label: string
  readonly detail: string
}

export const CRAFT_SURPRISE_OPTIONS: readonly CraftSurpriseOption[] = [
  {
    id: 'drawing',
    label: 'Un dibujo',
    detail: 'Dibuja a Trasto, a Rodolfo o la aventura que más te haya gustado.',
  },
  {
    id: 'letter',
    label: 'Una carta',
    detail: 'Escribe o dicta unas palabras bonitas para Trasto.',
  },
  {
    id: 'craft',
    label: 'Una manualidad',
    detail: 'Prepara un adorno, un muñeco de nieve o lo que se te ocurra.',
  },
]

export interface CraftSurpriseState {
  readonly selected: CraftSurpriseKind | null
  readonly confirmed: boolean
}

export function createCraftSurpriseState(): CraftSurpriseState {
  return { selected: null, confirmed: false }
}

function isCraftKind(value: string): value is CraftSurpriseKind {
  return CRAFT_SURPRISE_OPTIONS.some((option) => option.id === value)
}

/** The child may change the chosen surprise until the family confirms it. */
export function selectCraftSurprise(
  state: CraftSurpriseState,
  kind: CraftSurpriseKind,
): CraftSurpriseState {
  if (state.confirmed || !isCraftKind(kind)) {
    return state
  }

  return { ...state, selected: kind }
}

/** Manual confirmation; only possible after choosing one of the three options. */
export function confirmCraftSurprise(
  state: CraftSurpriseState,
): CraftSurpriseState {
  if (state.confirmed || state.selected === null) {
    return state
  }

  return { ...state, confirmed: true }
}

export function selectedCraftOption(
  state: CraftSurpriseState,
): CraftSurpriseOption | null {
  return (
    CRAFT_SURPRISE_OPTIONS.find((option) => option.id === state.selected) ?? null
  )
}

export function isCraftSurpriseComplete(state: CraftSurpriseState): boolean {
  return state.confirmed
}
