import type { ComponentType } from 'react'
import type { MissionDefinition } from '../domain/types'
import { BellSimonGame } from './games/BellSimonGame'
import { CatchGiftsGame } from './games/CatchGiftsGame'
import { CharadesGame } from './games/CharadesGame'
import { CraftSurpriseGame } from './games/CraftSurpriseGame'
import { CupPyramidGame } from './games/CupPyramidGame'
import { DanceGame } from './games/DanceGame'
import { FinaleGame } from './games/FinaleGame'
import { GuidedDrawingGame } from './games/GuidedDrawingGame'
import { HiddenObjectsGame } from './games/HiddenObjectsGame'
import { JigsawGame } from './games/JigsawGame'
import { KaraokeGame } from './games/KaraokeGame'
import { MathLockGame } from './games/MathLockGame'
import { MemoryGame } from './games/MemoryGame'
import { NoLaughGame } from './games/NoLaughGame'
import { PatternsGame } from './games/PatternsGame'
import { RedOutfitGame } from './games/RedOutfitGame'
import { ReindeerMazeGame } from './games/ReindeerMazeGame'
import { SnowballTossGame } from './games/SnowballTossGame'
import { SnowmanGame } from './games/SnowmanGame'
import { SockPairsGame } from './games/SockPairsGame'
import { SpotDifferenceGame } from './games/SpotDifferenceGame'
import { SymbolCipherGame } from './games/SymbolCipherGame'
import { TouchBagGame } from './games/TouchBagGame'
import { WordScrambleGame } from './games/WordScrambleGame'
import type { MissionGameProps } from './games/types'

export type MissionGameComponent = ComponentType<MissionGameProps>

/**
 * Registry for real mission games.
 *
 * Registering a component here is the only seam that turns a catalog entry with
 * `status: 'implemented'` into a playable child mission; the flow never fakes a
 * game for a missing entry. The twenty-four games below cover every approved
 * day: 1 through 24.
 */
export const MISSION_GAMES: Partial<Record<MissionDefinition['kind'], MissionGameComponent>> = {
  dance: DanceGame,
  memory: MemoryGame,
  'red-outfit': RedOutfitGame,
  'reindeer-maze': ReindeerMazeGame,
  'snowball-toss': SnowballTossGame,
  'spot-difference': SpotDifferenceGame,
  karaoke: KaraokeGame,
  'word-scramble': WordScrambleGame,
  'sock-pairs': SockPairsGame,
  patterns: PatternsGame,
  'guided-drawing': GuidedDrawingGame,
  'catch-gifts': CatchGiftsGame,
  'no-laugh': NoLaughGame,
  jigsaw: JigsawGame,
  'bell-simon': BellSimonGame,
  'math-lock': MathLockGame,
  'hidden-objects': HiddenObjectsGame,
  'snowman-build': SnowmanGame,
  'symbol-cipher': SymbolCipherGame,
  'cup-pyramid': CupPyramidGame,
  charades: CharadesGame,
  'touch-bag': TouchBagGame,
  craft: CraftSurpriseGame,
  finale: FinaleGame,
}
