import {
  Component,
  Fragment,
  type ErrorInfo,
  type ReactNode,
} from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  resetKey: number
}

/**
 * Last-resort recovery surface. It never renders error details to the family:
 * it only explains that something unexpected happened and offers a clear way
 * back to the calendar. Resetting remounts the app at its initial view, so a
 * broken mission cannot trap the user on a blank screen.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, resetKey: 0 }
  private recoveryHeadingRef = { current: null as HTMLHeadingElement | null }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep the diagnostic in the developer console; the family sees only the
    // recovery screen and never a stack trace or internal identifier.
    console.error('Unexpected UI error', error, info.componentStack)
  }

  componentDidMount(): void {
    if (this.state.hasError) {
      this.recoveryHeadingRef.current?.focus()
    }
  }

  componentDidUpdate(
    _previousProps: ErrorBoundaryProps,
    previousState: ErrorBoundaryState,
  ): void {
    if (!previousState.hasError && this.state.hasError) {
      this.recoveryHeadingRef.current?.focus()
    }

    if (previousState.hasError && !this.state.hasError) {
      // The app remounts at the calendar view; move focus there after React
      // commits the recovered tree.
      window.setTimeout(() => {
        document.getElementById('calendar-title')?.focus()
      }, 0)
    }
  }

  private handleBackToCalendar = (): void => {
    this.setState((current) => ({
      hasError: false,
      resetKey: current.resetKey + 1,
    }))
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  private setRecoveryHeading = (element: HTMLHeadingElement | null): void => {
    this.recoveryHeadingRef.current = element
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="app recovery">
          <main className="recovery__panel" aria-labelledby="recovery-title">
            <p className="app__eyebrow">Calendario de Adviento</p>
            <h1 id="recovery-title" ref={this.setRecoveryHeading} tabIndex={-1}>
              El taller de Trasto necesita un respiro
            </h1>
            <p className="recovery__lead">
              Ha ocurrido un problema inesperado en esta pantalla. Tu progreso
              guardado no se ha borrado.
            </p>
            <p className="recovery__hint">
              Vuelve al calendario para seguir con otra puerta o recarga la página
              si el problema se repite.
            </p>
            <div className="recovery__actions">
              <button
                type="button"
                className="button button--primary"
                onClick={this.handleBackToCalendar}
              >
                Volver al calendario
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={this.handleReload}
              >
                Recargar la página
              </button>
            </div>
          </main>
        </div>
      )
    }

    return (
      <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>
    )
  }
}
