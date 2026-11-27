/**
 * Day 11 guided-drawing rules.
 *
 * The approved voice script marks the steps at 0, 5, 15, 25, 35, 45, 55 and
 * 65 seconds. The child draws with closed eyes and can repeat or extend any
 * step. Finishing is always manual: the timer never blocks success or imposes a
 * penalty, and a repeated or extended script still reaches the end.
 */

export interface GuidedDrawingStep {
  readonly atSeconds: number
  readonly title: string
  readonly detail: string
}

export const GUIDED_DRAWING_STEPS: readonly GuidedDrawingStep[] = [
  {
    atSeconds: 0,
    title: 'Cierra los ojos',
    detail: 'Sujeta el lápiz y no mires el papel hasta el final.',
  },
  {
    atSeconds: 5,
    title: 'Una cabeza redonda',
    detail: 'Dibuja un círculo grande en el centro del papel.',
  },
  {
    atSeconds: 15,
    title: 'Dos ojos',
    detail: 'Coloca dos ojos dentro de la cabeza.',
  },
  {
    atSeconds: 25,
    title: 'Una nariz grande',
    detail: 'Dibuja una nariz en medio de los ojos.',
  },
  {
    atSeconds: 35,
    title: 'Una boca sonriente',
    detail: 'Añade una sonrisa debajo de la nariz.',
  },
  {
    atSeconds: 45,
    title: 'Dos orejas',
    detail: 'Pon una oreja a cada lado de la cabeza.',
  },
  {
    atSeconds: 55,
    title: 'Dos cuernos',
    detail: 'Dibuja dos cuernos ramificados en lo alto.',
  },
  {
    atSeconds: 65,
    title: 'Abre los ojos',
    detail: '¡Ya puedes mirar tu reno imposible!',
  },
]

export const GUIDED_DRAWING_SCRIPT_END_SECONDS = 75
export const GUIDED_DRAWING_EXTENSION_SECONDS = 15

export interface GuidedDrawingState {
  readonly stepIndex: number
  readonly secondsInStep: number
  readonly extraSeconds: number
  readonly running: boolean
  readonly scriptComplete: boolean
  readonly finished: boolean
}

export function createGuidedDrawingState(): GuidedDrawingState {
  return {
    stepIndex: 0,
    secondsInStep: 0,
    extraSeconds: 0,
    running: false,
    scriptComplete: false,
    finished: false,
  }
}

export function startGuidedDrawing(state: GuidedDrawingState): GuidedDrawingState {
  if (state.running || state.finished || state.scriptComplete) {
    return state
  }

  return { ...state, running: true }
}

export function pauseGuidedDrawing(state: GuidedDrawingState): GuidedDrawingState {
  return state.running ? { ...state, running: false } : state
}

/** Duration of a step derived from the approved absolute times. */
export function guidedDrawingStepDuration(stepIndex: number): number {
  const step = GUIDED_DRAWING_STEPS[stepIndex]

  if (!step) {
    return 0
  }

  const next = GUIDED_DRAWING_STEPS[stepIndex + 1]

  return (next?.atSeconds ?? GUIDED_DRAWING_SCRIPT_END_SECONDS) - step.atSeconds
}

/** Advances one second, moving to the next step or completing the script. */
export function tickGuidedDrawing(state: GuidedDrawingState): GuidedDrawingState {
  if (!state.running || state.finished) {
    return state
  }

  const secondsInStep = state.secondsInStep + 1
  const stepEnd = guidedDrawingStepDuration(state.stepIndex) + state.extraSeconds

  if (secondsInStep < stepEnd) {
    return { ...state, secondsInStep }
  }

  const isLastStep = state.stepIndex >= GUIDED_DRAWING_STEPS.length - 1

  if (isLastStep) {
    return {
      ...state,
      secondsInStep,
      running: false,
      scriptComplete: true,
    }
  }

  return {
    ...state,
    stepIndex: state.stepIndex + 1,
    secondsInStep: 0,
    extraSeconds: 0,
  }
}

/** Repeats the current instruction from its own first second. */
export function repeatGuidedDrawingStep(
  state: GuidedDrawingState,
): GuidedDrawingState {
  if (state.finished) {
    return state
  }

  return {
    ...state,
    secondsInStep: 0,
    extraSeconds: 0,
    running: true,
    scriptComplete: false,
  }
}

/** Adds extra time to the current step instead of skipping it. */
export function extendGuidedDrawingStep(
  state: GuidedDrawingState,
): GuidedDrawingState {
  if (state.finished) {
    return state
  }

  return {
    ...state,
    extraSeconds: state.extraSeconds + GUIDED_DRAWING_EXTENSION_SECONDS,
    running: true,
    scriptComplete: false,
  }
}

export function resetGuidedDrawing(): GuidedDrawingState {
  return createGuidedDrawingState()
}

/** Manual success: available at any moment, whatever the timer says. */
export function finishGuidedDrawing(state: GuidedDrawingState): GuidedDrawingState {
  if (state.finished) {
    return state
  }

  return { ...state, finished: true, running: false }
}

export function isGuidedDrawingComplete(state: GuidedDrawingState): boolean {
  return state.finished
}

export function currentGuidedDrawingStep(
  state: GuidedDrawingState,
): GuidedDrawingStep {
  return GUIDED_DRAWING_STEPS[state.stepIndex] ?? GUIDED_DRAWING_STEPS[0]
}
