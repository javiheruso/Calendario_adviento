import { useState } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  MATH_AID_MESSAGES,
  MATH_CODE_LENGTH,
  MATH_CODE,
  MATH_OPERATIONS,
  MATH_SYMBOLS,
  MATH_VALUES,
  answerMathOperation,
  appendMathCodeDigit,
  clearMathCode,
  createMathLockState,
  currentMathOperation,
  isMathOperationsComplete,
  requestMathAid,
  submitHiddenValue,
  submitMathCode,
  type MathOperation,
  type MathSymbol,
} from '../../domain/games/mathLock'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'

interface SymbolMeta {
  readonly asset: AssetId
  readonly label: string
}

const SYMBOL_META: Readonly<Record<MathSymbol, SymbolMeta>> = {
  tree: { asset: 'game.math.tree', label: 'árbol' },
  gift: { asset: 'game.math.gift', label: 'regalo' },
  reindeer: { asset: 'game.math.reindeer', label: 'reno' },
  star: { asset: 'game.math.star', label: 'estrella' },
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

function symbolValue(symbol: MathSymbol): string {
  return String(MATH_VALUES[symbol])
}

function expressionLabel(operation: MathOperation): string {
  return operation.terms
    .map((term, index) => {
      const sign = index === 0 ? (term.sign === -1 ? 'menos ' : '') : term.sign === 1 ? 'más ' : 'menos '
      return `${sign}${SYMBOL_META[term.symbol].label}`
    })
    .join(' ')
}

function ExpressionView({
  operation,
  showNumbers,
}: {
  operation: MathOperation
  showNumbers: boolean
}) {
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
          {showNumbers ? (
            <span className="math-expression__value">{symbolValue(term.symbol)}</span>
          ) : null}
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
 * Day 14: discover the hidden star value, solve the three approved operations
 * and open the chest with code 695. Help is progressive and every wrong answer
 * is only feedback.
 */
export function MathLockGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(() => createMathLockState())
  const [feedback, setFeedback] = useState<string | null>(null)
  const current = currentMathOperation(state)
  const operationsComplete = isMathOperationsComplete(state)
  const aidMessage = state.aidLevel === 0 ? null : MATH_AID_MESSAGES[state.aidLevel]
  const showNumbers = state.aidLevel >= 1

  function guessHidden(value: number) {
    const next = submitHiddenValue(state, value)

    if (next === state) {
      setFeedback('Todavía no es ese número. Prueba otra vez sin miedo.')
      return
    }

    setState(next)
    setFeedback('¡Muy bien! La estrella vale 2. Ahora resuelve las operaciones.')
  }

  function answerOperation(value: number) {
    if (!current) {
      return
    }

    const outcome = answerMathOperation(state, current.index, value)

    if (outcome.result === 'wrong') {
      setFeedback('Ese resultado no es. Mira la operación y vuelve a probar.')
      return
    }

    if (outcome.result === 'correct') {
      setState(outcome.state)
      setFeedback(
        outcome.state.operationsSolved.length === MATH_OPERATIONS.length
          ? '¡Las tres operaciones están resueltas! Ya puedes abrir el candado.'
          : '¡Operación correcta! Sigue con la siguiente.',
      )
    }
  }

  function addCodeDigit(digit: string) {
    setState((currentState) => appendMathCodeDigit(currentState, digit))
    setFeedback(null)
  }

  function openChest() {
    const outcome = submitMathCode(state)

    if (outcome.result === 'unlocked') {
      setState(outcome.state)
      setFeedback('¡Cofre abierto! El código 695 era el correcto.')
      return
    }

    if (outcome.result === 'blocked') {
      setFeedback('Primero descubre la estrella y resuelve las tres operaciones.')
      return
    }

    if (outcome.result === 'incomplete') {
      setFeedback(`El código tiene ${MATH_CODE_LENGTH} cifras. Escribe las que faltan.`)
      return
    }

    setFeedback('Ese código no abre el cofre. Puedes borrarlo y probar de nuevo.')
  }

  return (
    <div className="game game--math">
      <p className="game__lead">
        Trasto ha cerrado el cofre con un candado matemático. Descubre cuánto vale la
        estrella, resuelve las tres operaciones y escribe el código para abrirlo. No hay
        tiempo ni penalizaciones: puedes probar las veces que quieras.
      </p>

      <p className="game__status" role="status">
        Valor oculto: {state.hiddenSolved ? 'descubierto' : 'por descubrir'} · Operaciones:{' '}
        {state.operationsSolved.length} de {MATH_OPERATIONS.length}
      </p>

      <table className="math-table">
        <caption>Tabla de valores del cofre</caption>
        <thead>
          <tr>
            <th scope="col">Dibujo</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {MATH_SYMBOLS.map((symbol) => {
            const hidden = symbol === 'star'
            const solved = !hidden || state.hiddenSolved

            return (
              <tr key={symbol}>
                <th scope="row">
                  <span className="math-table__symbol" aria-hidden="true">
                    <AssetGlyph
                      asset={getAsset(SYMBOL_META[symbol].asset)}
                      label={false}
                    />
                  </span>{' '}
                  {SYMBOL_META[symbol].label}
                </th>
                <td className="math-table__value">{solved ? symbolValue(symbol) : '?'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {!state.hiddenSolved ? (
        <section className="math-step" aria-labelledby="math-hidden-title">
          <h3 id="math-hidden-title">¿Cuánto vale la estrella?</h3>
          <p className="game__hint">
            El regalo más la estrella dan el árbol. Toca un número para probar.
          </p>
          <DigitPad
            label="Elegir el valor de la estrella"
            disabled={state.hiddenSolved}
            onDigit={(digit) => guessHidden(Number(digit))}
          />
        </section>
      ) : null}

      {state.hiddenSolved && !operationsComplete && current ? (
        <section className="math-step" aria-labelledby="math-operation-title">
          <h3 id="math-operation-title">
            Operación {state.operationsSolved.length + 1} de {MATH_OPERATIONS.length}
          </h3>
          <ExpressionView operation={current.operation} showNumbers={showNumbers} />
          <p className="game__hint">¿Cuál es el resultado? Toca un número.</p>
          <DigitPad
            label="Elegir el resultado de la operación"
            disabled={false}
            onDigit={(digit) => answerOperation(Number(digit))}
          />
        </section>
      ) : null}

      {operationsComplete && !state.unlocked ? (
        <section className="math-step" aria-labelledby="math-lock-title">
          <h3 id="math-lock-title">
            <span aria-hidden="true">
              <AssetGlyph asset={getAsset('game.math.chest')} label={false} />
            </span>{' '}
            El candado del cofre
          </h3>
          <p className="game__hint">
            Escribe el código de {MATH_CODE_LENGTH} cifras con los tres resultados, de la
            primera operación a la última.
          </p>

          <div className="math-code" aria-label="Código introducido">
            {Array.from({ length: MATH_CODE_LENGTH }, (_, index) => (
              <span className="math-code__slot" key={index}>
                {state.codeInput[index] ?? '·'}
              </span>
            ))}
          </div>

          <DigitPad
            label="Teclado del candado"
            disabled={state.codeInput.length >= MATH_CODE_LENGTH}
            onDigit={addCodeDigit}
          />

          <div className="game__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setState((currentState) => clearMathCode(currentState))
                setFeedback(null)
              }}
              disabled={state.codeInput.length === 0}
            >
              Borrar código
            </button>
            <button type="button" className="button button--primary" onClick={openChest}>
              Abrir cofre
            </button>
          </div>
        </section>
      ) : null}

      {!state.unlocked ? (
        <div className="game__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setState((currentState) => requestMathAid(currentState))}
            disabled={state.aidLevel >= 2}
          >
            Pedir una ayuda
          </button>
          {aidMessage ? (
            <p className="game__hint" role="status">
              {aidMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {feedback ? (
        <p className="game__hint" role="status">
          {feedback}
        </p>
      ) : null}

      {state.unlocked ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡El cofre matemático está abierto!</strong> El código era {MATH_CODE}.
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
