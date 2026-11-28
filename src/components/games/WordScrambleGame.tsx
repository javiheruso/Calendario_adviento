import { useEffect, useRef, useState } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  SCRAMBLE_WORDS,
  clearRound,
  createScrambleGame,
  isRoundSolved,
  placeLetter,
  removeLetter,
} from '../../domain/games/wordScramble'
import { AssetGlyph } from '../AssetGlyph'
import { useAutoAdvance } from '../useAutoAdvance'
import type { MissionGameProps } from './types'

const WORD_CLUES: Readonly<Record<string, AssetId>> = {
  RENO: 'game.memory.reindeer',
  NIEVE: 'ui.snowflake',
  REGALO: 'game.craft.letter',
}

const FALLBACK_CLUE: AssetId = 'mission.08'
const AUTO_ADVANCE_MS = 1500

function clueFor(word: string): AssetId {
  return WORD_CLUES[word] ?? FALLBACK_CLUE
}

/**
 * Day 8: order the letters of RENO, NIEVE and REGALO.
 *
 * Every letter is an individual wooden tile: placed tiles live in their own
 * slot, the tray keeps the remaining tiles, and the large clue image is the
 * protagonist. A correct word shows feedback and auto-advances after a short
 * pause; the manual button shares the same one-shot guard.
 */
export function WordScrambleGame({ onComplete }: MissionGameProps) {
  const [rounds] = useState(() => createScrambleGame(SCRAMBLE_WORDS).rounds)
  const [roundIndex, setRoundIndex] = useState(0)
  const [round, setRound] = useState(() => rounds[0])
  const advancingRef = useRef(false)

  const solved = isRoundSolved(round)
  const lastRound = roundIndex === rounds.length - 1
  const clue = clueFor(round.word)
  const allSlotsFilled = round.slots.every((slot) => slot !== null)
  const placed = new Set(round.slots.filter((tileId): tileId is string => tileId !== null))
  const tray = round.tiles.filter((tile) => !placed.has(tile.id))

  useEffect(() => {
    advancingRef.current = false
  }, [roundIndex])

  function goToNextWord() {
    if (advancingRef.current) {
      return
    }

    advancingRef.current = true

    if (lastRound) {
      onComplete()
      return
    }

    const nextIndex = roundIndex + 1
    setRoundIndex(nextIndex)
    setRound(rounds[nextIndex])
  }

  useAutoAdvance(solved, AUTO_ADVANCE_MS, goToNextWord)

  return (
    <div className="game game--scramble">
      <p className="game__lead">
        Ordena las letras para escribir la palabra. La imagen te da una pista y puedes
        cambiar el orden las veces que quieras.
      </p>

      <figure className="scramble-hero">
        <AssetGlyph
          asset={getAsset(clue)}
          label={false}
          className="scramble-hero__image"
          priority
        />
        <figcaption className="scramble-hero__caption">
          {getAsset(clue).label}
        </figcaption>
      </figure>

      <p className="game__status" role="status">
        Palabra {roundIndex + 1} de {rounds.length}
      </p>

      <div className="scramble-board">
        <div className="scramble-slots" role="group" aria-label="Palabra en construcción">
          {round.slots.map((tileId, slotIndex) => {
            const tile = tileId
              ? round.tiles.find((candidate) => candidate.id === tileId)
              : null

            return (
              <button
                key={slotIndex}
                type="button"
                className={`scramble-tile scramble-slot${
                  tile ? ' scramble-tile--filled' : ' scramble-tile--empty'
                }${solved ? ' scramble-tile--solved' : ''}`}
                onClick={() => setRound((current) => removeLetter(current, slotIndex))}
                disabled={!tile || solved}
                aria-label={tile ? `Quitar la letra ${tile.char}` : 'Hueco vacío'}
              >
                {tile ? tile.char : '·'}
              </button>
            )
          })}
        </div>
      </div>

      <div className="scramble-tray" role="group" aria-label="Letras disponibles">
        {tray.map((tile) => (
          <button
            key={tile.id}
            type="button"
            className="scramble-tile scramble-letter scramble-tile--tray"
            onClick={() => setRound((current) => placeLetter(current, tile.id))}
            disabled={solved}
          >
            {tile.char}
          </button>
        ))}
      </div>

      {allSlotsFilled && !solved ? (
        <p className="game__hint" role="status">
          Casi. Toca una letra colocada para devolverla y prueba otro orden.
        </p>
      ) : null}

      <div className="game__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={() => setRound((current) => clearRound(current))}
          disabled={solved}
        >
          Borrar y volver a empezar
        </button>
      </div>

      {solved ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Palabra resuelta: {round.word}!</strong>{' '}
            {lastRound ? 'Misión completada.' : 'Siguiente palabra en un momento…'}
          </p>
          <button type="button" className="button button--primary" onClick={goToNextWord}>
            {lastRound ? 'Continuar' : 'Siguiente palabra'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
