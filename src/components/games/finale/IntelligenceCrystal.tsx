import { useState } from 'react'
import { getAsset, type AssetId } from '../../../domain/assets'
import {
  FINAL_INTEL_CODE,
  FINAL_INTEL_CODE_LENGTH,
  FINAL_INTEL_HIDDEN_SYMBOL,
  FINAL_INTEL_OPERATIONS,
  FINAL_INTEL_SYMBOLS,
  FINAL_INTEL_VALUES,
  appendFinalIntelCodeDigit,
  clearFinalIntelCode,
  createFinalIntelState,
  submitFinalIntelCode,
  submitFinalIntelHiddenValue,
  type FinalIntelOperation,
  type FinalIntelSymbol,
} from '../../../domain/games/finalIntelligence'
import { AssetGlyph } from '../../AssetGlyph'
import { useAutoAdvance } from '../../useAutoAdvance'
import type { CrystalProps } from './types'

interface SymbolMeta {
  readonly asset: AssetId
  readonly label: string
}

const SYMBOL_META: Readonly<Record<FinalIntelSymbol, SymbolMeta>> = {
  santa: { asset: 'game.final.santa', label: 'Papá Noel' },
  sleigh: { asset: 'game.final.sleigh', label: 'trineo' },
  gift: { asset: 'game.final.gift', label: 'regalo' },
  reindeer: { asset: 'game.final.reindeer', label: 'reno' },
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

function expressionLabel(operation: FinalIntelOperation): string {
  return operation.terms
    .map((term, index) => {
      const sign =
        index === 0
          ? term.sign === -1
            ? 'menos '
            : ''
          : term.sign === 1
            ? 'más '
            : 'menos '
      return `${sign}${SYMBOL_META[term.symbol].label}`
    })
    .join(' ')
}

function ExpressionView({ operation }: { operation: FinalIntelOperation }) {
  return (
    <div className="math-expression" aria-label={expressionLabel(operation)}>
      {operation.terms.map((term, index) => (
        <span className="math-expression__term" key={`${operation.id}-${index}`}>
          {index > 0 ? (
            <span className="math-expression__sign" aria-hidden="true">
              {term.sign === 1 ? '+' : '−'}
            </span>
          ) : term.sign === -1 ? (
            <span className="math-expression__sign" aria-hidden="true">
              −
            </span>
          ) : null}
          <span className="math-expression__symbol" aria-hidden="true">
            <AssetGlyph asset={getAsset(SYMBOL_META[term.symbol].asset)} label={false} />
          </span>
        </span>
      ))}
    </div>
  )
}

function DigitPad({
  label,
  disabled,
  onDigit,
}: {
  label: string
  disabled: boolean
  onDigit: (digit: string) => void
}) {
  return (
    <div className="math-keypad" role="group" aria-label={label}>
      {DIGITS.map((digit) => (
        <button
          key={digit}
          type="button"
          className="math-key"
          onClick={() => onDigit(digit)}
          disabled={disabled}
        >
          {digit}
        </button>
      ))}
    </div>
  )
}

/**
 * Day 24 intelligence crystal: discover reindeer = 4, read the two approved
 * operations and enter their results as code 64. Wrong guesses are feedback.
 */
export function IntelligenceCrystal({ onSolved }: CrystalProps) {
  const [state, setState] = useState(createFinalIntelState)
  const [feedback, setFeedback] = useState<string | null>(null)

  useAutoAdvance(state.complete, 1500, onSolved)

  function guessHidden(value: number) {
    const next = submitFinalIntelHiddenValue(state, value)

    if (next === state) {
      setFeedback('Todavía no es ese número. Prueba otra vez sin miedo.')
      return
    }

    setState(next)
    setFeedback('¡Muy bien! El reno vale 4. Ahora calcula los dos resultados.')
  }

  function addCodeDigit(digit: string) {
    setState((current) => appendFinalIntelCodeDigit(current, digit))
    setFeedback(null)
  }

  function clearCode() {
    setState((current) => clearFinalIntelCode(current))
    setFeedback(null)
  }

  function openCrystal() {
    const outcome = submitFinalIntelCode(state)

    if (outcome.result === 'unlocked') {
      setState(outcome.state)
      setFeedback('¡Código 64 correcto! El cristal de la inteligencia está listo.')
      return
    }

    if (outcome.result === 'blocked') {
      setFeedback('Primero descubre cuánto vale el reno.')
      return
    }

    if (outcome.result === 'incomplete') {
      setFeedback(`El código tiene ${FINAL_INTEL_CODE_LENGTH} cifras. Escribe las que faltan.`)
      return
    }

    setFeedback('Ese código no enciende el cristal. Puedes borrarlo y probar de nuevo.')
  }

  return (
    <section className="finale-crystal-game" aria-labelledby="final-intelligence-title">
      <h3 id="final-intelligence-title">Cristal de la inteligencia</h3>
      <p className="game__lead">
        Trasto ha escondido un número. Mira la tabla, descubre cuánto vale el reno y
        resuelve las dos operaciones. El código son los dos resultados seguidos.
      </p>

      <table className="math-table">
        <caption>Tabla de valores del cristal</caption>
        <thead>
          <tr>
            <th scope="col">Dibujo</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {FINAL_INTEL_SYMBOLS.map((symbol) => {
            const hidden = symbol === FINAL_INTEL_HIDDEN_SYMBOL
            const solved = !hidden || state.hiddenSolved

            return (
              <tr key={symbol}>
                <th scope="row">
                  <span className="math-table__symbol" aria-hidden="true">
                    <AssetGlyph asset={getAsset(SYMBOL_META[symbol].asset)} label={false} />
                  </span>
                  <span className="visually-hidden">
                    {SYMBOL_META[symbol].label}
                  </span>
                </th>
                <td className="math-table__value">
                  {solved ? FINAL_INTEL_VALUES[symbol] : '?'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {!state.hiddenSolved ? (
        <section className="math-step" aria-labelledby="final-hidden-title">
          <h3 id="final-hidden-title">¿Cuánto vale el reno?</h3>
          <p className="game__hint">
            El reno más el trineo menos el regalo dan 6. Toca un número para probar.
          </p>
          <DigitPad
            label="Elegir el valor del reno"
            disabled={state.hiddenSolved}
            onDigit={(digit) => guessHidden(Number(digit))}
          />
        </section>
      ) : null}

      {state.hiddenSolved && !state.complete ? (
        <section className="math-step" aria-labelledby="final-code-title">
          <h3 id="final-code-title">Las dos operaciones</h3>
          {FINAL_INTEL_OPERATIONS.map((operation) => (
            <ExpressionView key={operation.id} operation={operation} />
          ))}
          <p className="game__hint">
            Escribe el resultado de cada operación, de la primera a la segunda, en el
            candado del cristal.
          </p>

          <div className="math-code" aria-label="Código introducido">
            {Array.from({ length: FINAL_INTEL_CODE_LENGTH }, (_, index) => (
              <span className="math-code__slot" key={index}>
                {state.codeInput[index] ?? '·'}
              </span>
            ))}
          </div>

          <DigitPad
            label="Teclado del cristal de la inteligencia"
            disabled={state.codeInput.length >= FINAL_INTEL_CODE_LENGTH}
            onDigit={addCodeDigit}
          />

          <div className="game__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={clearCode}
              disabled={state.codeInput.length === 0}
            >
              Borrar código
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={openCrystal}
            >
              Encender cristal
            </button>
          </div>
        </section>
      ) : null}

      {feedback ? (
        <p className="game__hint" role="status">
          {feedback}
        </p>
      ) : null}

      {state.complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Cristal de la inteligencia encendido!</strong> El código era{' '}
            {FINAL_INTEL_CODE}.
          </p>
          <button type="button" className="button button--primary" onClick={onSolved}>
            Pasar al cristal de la memoria
          </button>
        </div>
      ) : null}
    </section>
  )
}
