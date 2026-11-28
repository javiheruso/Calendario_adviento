import { useState } from 'react'
import {
  FINAL_MAGIC_GROUP_LENGTHS,
  FINAL_MAGIC_LETTERS,
  FINAL_MAGIC_PHRASE,
  FINAL_MAGIC_SYMBOL_GROUPS,
  clearMagicInput,
  confirmMagicPronunciation,
  createFinalMagicState,
  deleteMagicLetter,
  isMagicComplete,
  isMagicWordsComplete,
  submitMagicPhrase,
  typeMagicLetter,
} from '../../../domain/games/finalMagic'
import { useAutoAdvance } from '../../useAutoAdvance'
import { CipherAlphabetReference, CipherSymbol } from '../cipherSymbols'
import type { CrystalProps } from './types'

const KEYBOARD_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const AUTO_ADVANCE_MS = 1500

/** Slot indexes grouped 3-1-5, computed once for the visual input groups. */
const SLOT_GROUPS: readonly (readonly number[])[] = FINAL_MAGIC_GROUP_LENGTHS.reduce<
  number[][]
>((groups, length) => {
  const start = groups.reduce((total, group) => total + group.length, 0)
  groups.push(Array.from({ length }, (_, index) => start + index))
  return groups
}, [])

/**
 * Day 24 magic crystal: one secret cipher of nine symbols grouped 3-1-5. The
 * child fills one slot per letter and verifies the whole phrase once, with the
 * built-in keyboard and erase controls. The intro and help never reveal the
 * phrase; it only appears after the cipher is solved so the child can pronounce
 * it. Pronunciation is confirmed manually, with no microphone or recognition.
 */
export function MagicCrystal({ onSolved }: CrystalProps) {
  const [state, setState] = useState(createFinalMagicState)
  const [feedback, setFeedback] = useState<string | null>(null)
  const solved = isMagicWordsComplete(state)
  const complete = isMagicComplete(state)
  const locked = solved

  useAutoAdvance(complete, AUTO_ADVANCE_MS, onSolved)

  function addLetter(letter: string) {
    setState((current) => typeMagicLetter(current, letter))
    setFeedback(null)
  }

  function removeLetter() {
    setState((current) => deleteMagicLetter(current))
    setFeedback(null)
  }

  function clearInput() {
    setState((current) => clearMagicInput(current))
    setFeedback(null)
  }

  function checkPhrase() {
    const outcome = submitMagicPhrase(state)
    setState(outcome.state)

    if (outcome.result === 'incomplete') {
      setFeedback('Todavía faltan letras. Completa las nueve y vuelve a comprobar.')
      return
    }

    if (outcome.result === 'wrong') {
      setFeedback('Ese conjuro no es. Puedes borrar letras y probar de nuevo.')
      return
    }

    if (outcome.result === 'correct') {
      setFeedback('¡Conjuro descifrado! Ahora pronúncialo en voz alta.')
    }
  }

  function pronounce() {
    setState((current) => confirmMagicPronunciation(current))
    setFeedback('¡Conjuro pronunciado! El cristal de la magia está brillando.')
  }

  return (
    <section className="finale-crystal-game" aria-labelledby="final-magic-title">
      <h3 id="final-magic-title">Cristal de la magia</h3>
      <p className="game__lead">
        Usa el alfabeto secreto del día 22 para descifrar el conjuro. Son nueve
        símbolos agrupados en tres, uno y cinco. Escribe una letra en cada hueco,
        comprueba el conjuro entero y, cuando esté resuelto, pronúncialo en voz alta.
        No hay micrófono ni reconocimiento automático: tú misma confirmas que lo has
        dicho.
      </p>

      <CipherAlphabetReference titleId="final-alphabet-title" />

      {!solved ? (
        <>
          <div
            className="cipher-word cipher-word--phrase"
            role="group"
            aria-label="Símbolos del conjuro secreto"
          >
            {FINAL_MAGIC_SYMBOL_GROUPS.map((group, groupIndex) => (
              <span className="cipher-word__group" key={`group-${groupIndex}`}>
                {group.map((symbol, index) => (
                  <span className="cipher-word__symbol" key={`${groupIndex}-${index}`}>
                    <CipherSymbol id={symbol} />
                  </span>
                ))}
              </span>
            ))}
          </div>

          <div
            className="cipher-input cipher-input--phrase"
            role="group"
            aria-label={`Traducción del conjuro, ${FINAL_MAGIC_LETTERS.length} letras`}
          >
            {SLOT_GROUPS.map((indexes, groupIndex) => (
              <span className="cipher-input__group" key={`slot-group-${groupIndex}`}>
                {indexes.map((index) => (
                  <span className="cipher-input__slot" key={index}>
                    {state.input[index] ?? '·'}
                  </span>
                ))}
              </span>
            ))}
          </div>

          <div className="cipher-keyboard" role="group" aria-label="Teclado de letras">
            {KEYBOARD_LETTERS.map((letter) => (
              <button
                key={letter}
                type="button"
                className="cipher-key"
                onClick={() => addLetter(letter)}
                disabled={locked || state.input.length >= FINAL_MAGIC_LETTERS.length}
              >
                {letter}
              </button>
            ))}
          </div>

          <div className="game__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={removeLetter}
              disabled={locked || state.input.length === 0}
            >
              Borrar letra
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={clearInput}
              disabled={locked || state.input.length === 0}
            >
              Borrar todo
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={checkPhrase}
              disabled={locked || state.input.length === 0}
            >
              Comprobar conjuro
            </button>
          </div>
        </>
      ) : null}

      {solved && !complete ? (
        <section className="finale-pronunciation" aria-labelledby="final-pronounce-title">
          <h3 id="final-pronounce-title">El conjuro está escrito</h3>
          <p className="finale-pronunciation__phrase">{FINAL_MAGIC_PHRASE}</p>
          <p className="game__hint">
            Ahora di el conjuro en voz alta, despacio y con magia. Cuando lo hayas
            pronunciado, toca el botón. No se graba ni se escucha nada.
          </p>
          <button type="button" className="button button--primary" onClick={pronounce}>
            Ya lo he pronunciado
          </button>
        </section>
      ) : null}

      {feedback ? (
        <p className="game__hint" role="status">
          {feedback}
        </p>
      ) : null}

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Cristal de la magia encendido!</strong> El conjuro ha funcionado.
          </p>
          <button type="button" className="button button--primary" onClick={onSolved}>
            Encender los tres cristales
          </button>
        </div>
      ) : null}
    </section>
  )
}
