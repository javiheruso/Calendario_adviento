/**
 * Approved mission catalog (metadata only).
 *
 * P0 registers titles, mechanics and illustration keys so the P1 calendar can
 * list all 24 doors. No mission logic, assets or narration live here yet.
 */
import type { MissionDay, MissionDefinition } from './types'

const MISSION_CATALOG: readonly MissionDefinition[] = [
  { day: 1, title: 'El baile del duende', kind: 'dance', illustration: 'mission.01', status: 'implemented' },
  { day: 2, title: 'La memoria de Trasto', kind: 'memory', illustration: 'mission.02', status: 'implemented' },
  { day: 3, title: 'La invasión roja', kind: 'red-outfit', illustration: 'mission.03', status: 'implemented' },
  { day: 4, title: 'El reno perdido', kind: 'reindeer-maze', illustration: 'mission.04', status: 'implemented' },
  { day: 5, title: 'Guerra de bolas de nieve', kind: 'snowball-toss', illustration: 'mission.05', status: 'implemented' },
  { day: 6, title: 'Algo ha cambiado', kind: 'spot-difference', illustration: 'mission.06', status: 'implemented' },
  { day: 7, title: 'El villancico disparatado', kind: 'karaoke', illustration: 'mission.07', status: 'implemented' },
  { day: 8, title: 'La palabra destrozada', kind: 'word-scramble', illustration: 'mission.08', status: 'implemented' },
  { day: 9, title: 'Los calcetines desaparejados', kind: 'sock-pairs', illustration: 'mission.09', status: 'implemented' },
  { day: 10, title: 'La fábrica de adornos', kind: 'patterns', illustration: 'mission.10', status: 'implemented' },
  { day: 11, title: 'El retrato imposible', kind: 'guided-drawing', illustration: 'mission.11', status: 'implemented' },
  { day: 12, title: 'Lluvia de regalos', kind: 'catch-gifts', illustration: 'mission.12', status: 'implemented' },
  { day: 13, title: 'Prohibido reírse', kind: 'no-laugh', illustration: 'mission.13', status: 'implemented' },
  { day: 14, title: 'El cofre matemático', kind: 'math-lock', illustration: 'mission.14', status: 'implemented' },
  { day: 15, title: 'Manos de duende', kind: 'cup-pyramid', illustration: 'mission.15', status: 'implemented' },
  { day: 16, title: 'El cuadro roto', kind: 'jigsaw', illustration: 'mission.16', status: 'implemented' },
  { day: 17, title: 'El duende silencioso', kind: 'charades', illustration: 'mission.17', status: 'implemented' },
  { day: 18, title: 'Las campanas mágicas', kind: 'bell-simon', illustration: 'mission.18', status: 'implemented' },
  { day: 19, title: 'El taller desordenado', kind: 'hidden-objects', illustration: 'mission.19', status: 'implemented' },
  { day: 20, title: 'El saco misterioso', kind: 'touch-bag', illustration: 'mission.20', status: 'implemented' },
  { day: 21, title: 'El muñeco de nieve despistado', kind: 'snowman-build', illustration: 'mission.21', status: 'implemented' },
  { day: 22, title: 'El idioma secreto de los duendes', kind: 'symbol-cipher', illustration: 'mission.22', status: 'implemented' },
  { day: 23, title: 'Una sorpresa para Trasto', kind: 'craft', illustration: 'mission.23', status: 'implemented' },
  { day: 24, title: 'La última gran misión', kind: 'finale', illustration: 'mission.24', status: 'implemented' },
]

export const MISSIONS: readonly MissionDefinition[] = MISSION_CATALOG

const MISSIONS_BY_DAY = new Map<MissionDay, MissionDefinition>(
  MISSIONS.map((mission) => [mission.day, mission]),
)

export function getMission(day: MissionDay): MissionDefinition | undefined {
  return MISSIONS_BY_DAY.get(day)
}

/**
 * What the mission flow may render for a catalog entry.
 *
 * `status` decides the boundary, not the demo flag: an `implemented` mission is
 * always a real game, while a `planned` mission can only fall back to the
 * clearly labelled demo/dev simulation. In production the child flow therefore
 * never simulates a planned mission, and a future `implemented` entry becomes
 * playable without touching the panel.
 */
export type MissionAvailability = 'game' | 'demo-completion' | 'planned'

export interface MissionAvailabilityOptions {
  /** Authenticated adult demo or preview surface. */
  readonly demoMode: boolean
  /** Development build; never true in a production child bundle. */
  readonly development: boolean
}

export function resolveMissionAvailability(
  mission: MissionDefinition,
  options: MissionAvailabilityOptions,
): MissionAvailability {
  if (mission.status === 'implemented') {
    return 'game'
  }

  return options.demoMode || options.development ? 'demo-completion' : 'planned'
}
