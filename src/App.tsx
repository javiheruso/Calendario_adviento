import { useEffect, useRef, useState } from 'react'
import { MissionAudioScope } from './audio/MissionAudioScope'
import { audioManager } from './audio/audioManager'
import { useAudioSnapshot } from './audio/useAudioSnapshot'
import { AdultGate } from './components/AdultGate'
import { AdultPanel } from './components/AdultPanel'
import { AlbumPanel } from './components/AlbumPanel'
import { AssetGlyph } from './components/AssetGlyph'
import { CalendarGrid } from './components/CalendarGrid'
import { ChildAudioBar } from './components/ChildAudioBar'
import { MissionPanel } from './components/MissionPanel'
import { StarTree } from './components/StarTree'
import type { AlbumSaveOutcome, SaveRecordingToAlbumInput } from './domain/album'
import { getAsset, type AssetId } from './domain/assets'
import { getDayStatus, getReleasedDaysWithoutStar } from './domain/calendar'
import {
  setCameraEnabled,
  setParentalPin,
  updateDaySettings,
  type DaySettingsPatch,
} from './domain/config'
import {
  normalizeAudioPreferences,
  type AudioPreferences,
} from './domain/audioPreferences'
import { getMission } from './domain/missions'
import {
  completeMission,
  confirmGiftFound,
  countStars,
  createEmptyProgress,
  revealHint,
  type HintKind,
} from './domain/progress'
import {
  persistBeforePublish,
  STAR_EARNED_EVENT,
  starEarnedDetail,
} from './domain/reward'
import {
  TOTAL_MISSIONS,
  type AppConfig,
  type AppState,
  type CalendarAccess,
  type MissionDay,
  type ProgressState,
} from './domain/types'
import { createPinRecord, isValidPinFormat, verifyPin } from './security/pin'
import { createIndexedDbAlbumDatabase } from './storage/albumDb'
import { createAlbumStore } from './storage/albumStore'
import { requestPersistentStorage } from './storage/storageStatus'
import {
  loadAudioPreferences,
  saveAudioPreferences,
} from './storage/audioPreferences'
import {
  loadAppState,
  loadDemoProgress,
  resetDemoProgress,
  saveAppState,
  saveDemoProgress,
} from './storage/localState'

type View =
  | { kind: 'calendar' }
  | { kind: 'mission'; day: MissionDay }
  | { kind: 'adult-gate' }
  | { kind: 'adult-panel' }
  | { kind: 'adult-album' }
  | { kind: 'preview'; day: MissionDay }

type FocusableView = View['kind']

/**
 * Headings that receive focus when a view opens. A heading with `tabindex=-1`
 * is a stable, low-noise focus target: the screen reader announces the new
 * context without trapping the keyboard in a dialog.
 */
const VIEW_HEADING_IDS: Readonly<Record<FocusableView, string>> = {
  calendar: 'calendar-title',
  mission: 'mission-title',
  preview: 'mission-title',
  'adult-gate': 'adult-gate-title',
  'adult-panel': 'adult-title',
  'adult-album': 'album-title',
}

interface FocusRequest {
  viewKey: FocusableView
  selector: string
}

/**
 * Development-only signal. A production build evaluates this to `false`, so a
 * `planned` mission never simulates completion for the child. Demo and preview
 * run only behind the parental PIN, which is a separate adult surface.
 */
const DEVELOPMENT_BUILD = import.meta.env.DEV

export default function App() {
  const [state, setState] = useState<AppState>(loadAppState)
  const [audioPreferences, setAudioPreferences] = useState<AudioPreferences>(
    loadAudioPreferences,
  )
  const [audioPersistenceError, setAudioPersistenceError] = useState(false)
  const audioSnapshot = useAudioSnapshot()
  const [albumStore] = useState(() =>
    createAlbumStore(createIndexedDbAlbumDatabase()),
  )
  const [adultUnlocked, setAdultUnlocked] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [demoProgress, setDemoProgress] = useState<ProgressState>(loadDemoProgress)
  const [view, setView] = useState<View>({ kind: 'calendar' })
  const [celebratedDay, setCelebratedDay] = useState<MissionDay | null>(null)
  const [persistenceError, setPersistenceError] = useState(false)
  const [demoPersistenceError, setDemoPersistenceError] = useState(false)
  const [adultError, setAdultError] = useState<string | null>(null)
  const [adultBusy, setAdultBusy] = useState(false)
  // Local clock snapshot: refresh it so a door opens at local midnight without
  // a reload, without reading an impure clock during render.
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    audioManager.setPreferences(audioPreferences)
  }, [audioPreferences])

  useEffect(() => {
    if (celebratedDay === null) {
      return
    }

    const timer = window.setTimeout(() => setCelebratedDay(null), 3500)
    return () => window.clearTimeout(timer)
  }, [celebratedDay])

  useEffect(() => {
    return () => {
      audioManager.stopAll()
    }
  }, [])

  // Demo and preview are structural adult surfaces: without an unlocked
  // session they cannot change date access or switch the progress store.
  const effectiveDemoMode = adultUnlocked && demoMode
  const previewing = adultUnlocked && view.kind === 'preview'
  const usingDemoProgress = effectiveDemoMode || previewing
  const access: CalendarAccess = { adultPreview: usingDemoProgress }
  const activeProgress = usingDemoProgress ? demoProgress : state.progress
  const hasPin = Boolean(state.config.parental.pin)
  const showAdultGate =
    view.kind === 'adult-gate' ||
    ((view.kind === 'adult-panel' ||
      view.kind === 'adult-album' ||
      view.kind === 'preview') &&
      !adultUnlocked)

  const pendingFocusRef = useRef<FocusRequest | null>(null)
  const focusKey: FocusableView = showAdultGate ? 'adult-gate' : view.kind
  const previousFocusKeyRef = useRef<FocusableView>(focusKey)

  // Move focus to the new surface, or back to the control that opened it. The
  // first render does not steal focus, and re-renders within the same view are
  // deliberately left alone.
  useEffect(() => {
    if (previousFocusKeyRef.current === focusKey) {
      return
    }

    previousFocusKeyRef.current = focusKey
    const pending = pendingFocusRef.current
    pendingFocusRef.current = null

    if (pending && pending.viewKey === focusKey) {
      const target = document.querySelector<HTMLElement>(pending.selector)

      if (target) {
        target.focus()

        if (
          target.hasAttribute('data-star-day') &&
          typeof target.scrollIntoView === 'function'
        ) {
          const reduceMotion =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
          target.scrollIntoView({
            block: 'center',
            behavior: reduceMotion ? 'auto' : 'smooth',
          })
        }

        return
      }
    }

    const heading = document.getElementById(VIEW_HEADING_IDS[focusKey])

    if (heading) {
      if (!heading.hasAttribute('tabindex')) {
        heading.setAttribute('tabindex', '-1')
      }

      heading.focus()
    }
  }, [focusKey])

  function persistChildState(nextState: AppState): boolean {
    setState(nextState)
    const saved = saveAppState(nextState)
    setPersistenceError(!saved)
    return saved
  }

  function commitChildProgress(next: ProgressState): boolean {
    if (next === state.progress) {
      return true
    }

    // Persist first: a failed write must not publish a star or hint that the
    // device could not store.
    const saved = persistBeforePublish(
      { ...state, progress: next },
      saveAppState,
      setState,
    )
    setPersistenceError(!saved)
    return saved
  }

  function commitConfig(next: AppConfig) {
    if (next === state.config) {
      return
    }

    persistChildState({ ...state, config: next })
  }

  function commitDemoProgress(next: ProgressState): boolean {
    if (next === demoProgress) {
      return true
    }

    const saved = persistBeforePublish(next, saveDemoProgress, setDemoProgress)
    setDemoPersistenceError(!saved)
    return saved
  }

  function updateProgress(next: ProgressState): boolean {
    if (usingDemoProgress) {
      return commitDemoProgress(next)
    }

    return commitChildProgress(next)
  }

  function commitAudioPreferences(next: AudioPreferences) {
    const normalized = normalizeAudioPreferences(next)
    setAudioPreferences(normalized)
    setAudioPersistenceError(!saveAudioPreferences(normalized))
    audioManager.setPreferences(normalized)
  }

  function handleAudioInteract() {
    void audioManager.unlock()
  }

  function handleTestAudio() {
    audioManager.playEffect('effect.success')
  }

  function handleStopAudio() {
    audioManager.stopAll()
  }

  function handleOpenDay(day: MissionDay) {
    const status = getDayStatus(day, activeProgress, state.config, access, now)

    if (status === 'locked') {
      return
    }

    setView({ kind: 'mission', day })
  }

  function handleOpenAdultArea() {
    setAdultError(null)
    setView(adultUnlocked ? { kind: 'adult-panel' } : { kind: 'adult-gate' })
  }

  async function handleSetupPin(pin: string, confirmation: string) {
    if (!isValidPinFormat(pin)) {
      setAdultError('El PIN debe tener entre 4 y 8 dígitos.')
      return
    }

    if (pin !== confirmation) {
      setAdultError('Los dos PIN no coinciden.')
      return
    }

    setAdultBusy(true)
    setAdultError(null)

    try {
      const record = await createPinRecord(pin)
      const nextState: AppState = {
        ...state,
        config: setParentalPin(state.config, record),
      }
      const saved = persistChildState(nextState)
      setAdultUnlocked(true)
      setView({ kind: 'adult-panel' })

      if (!saved) {
        setAdultError(
          'El PIN funciona en esta sesión, pero no se pudo guardar: se perderá al recargar.',
        )
      }
    } catch {
      setAdultError(
        'No se pudo crear el PIN en este dispositivo. Comprueba que la app se abre por HTTPS o en localhost.',
      )
    } finally {
      setAdultBusy(false)
    }
  }

  async function handleUnlock(pin: string) {
    const record = state.config.parental.pin

    if (!record) {
      setAdultError('No hay un PIN configurado en este dispositivo.')
      return
    }

    if (!isValidPinFormat(pin)) {
      setAdultError('El PIN debe tener entre 4 y 8 dígitos.')
      return
    }

    setAdultBusy(true)
    setAdultError(null)

    try {
      const valid = await verifyPin(pin, record)

      if (!valid) {
        setAdultError('PIN incorrecto.')
        return
      }

      setAdultUnlocked(true)
      setView({ kind: 'adult-panel' })
    } catch {
      setAdultError('No se pudo comprobar el PIN en este dispositivo.')
    } finally {
      setAdultBusy(false)
    }
  }

  function handleLockAdultArea() {
    setAdultUnlocked(false)
    setDemoMode(false)
    setAdultError(null)
    pendingFocusRef.current = {
      viewKey: 'calendar',
      selector: '[data-adult-area]',
    }
    setView({ kind: 'calendar' })
  }

  function handleEnterDemo() {
    if (!adultUnlocked) {
      return
    }

    setDemoMode(true)
    setView({ kind: 'calendar' })
  }

  function handleBackToPanel() {
    setView({ kind: 'adult-panel' })
  }

  function handlePreviewBackToPanel() {
    if (view.kind === 'preview') {
      pendingFocusRef.current = {
        viewKey: 'adult-panel',
        selector: `[data-day-summary="${view.day}"]`,
      }
    }

    setView({ kind: 'adult-panel' })
  }

  function handleAlbumBack() {
    pendingFocusRef.current = {
      viewKey: 'adult-panel',
      selector: '[data-open-album]',
    }
    setView({ kind: 'adult-panel' })
  }

  function handleOpenAlbum() {
    setView({ kind: 'adult-album' })
  }

  function handleExitDemo() {
    setDemoMode(false)
    setView({ kind: 'adult-panel' })
  }

  function handleBackToChild() {
    setDemoMode(false)
    pendingFocusRef.current = {
      viewKey: 'calendar',
      selector: '[data-adult-area]',
    }
    setView({ kind: 'calendar' })
  }

  function handleResetDemo() {
    const cleared = resetDemoProgress()
    setDemoProgress(createEmptyProgress())
    setDemoPersistenceError(!cleared)
  }

  function handleUpdateDay(day: MissionDay, patch: DaySettingsPatch) {
    commitConfig(updateDaySettings(state.config, day, patch))
  }

  function handleToggleManualUnlock(day: MissionDay, value: boolean) {
    commitConfig(updateDaySettings(state.config, day, { manuallyUnlocked: value }))
  }

  function handleToggleCamera(enabled: boolean) {
    commitConfig(setCameraEnabled(state.config, enabled))
  }

  function handlePreviewDay(day: MissionDay) {
    setView({ kind: 'preview', day })
  }

  /**
   * Persists the star before the celebration. A failed write keeps the child on
   * the reward screen instead of navigating as if the star were saved; demo and
   * preview writes never leave the adult surface.
   */
  function handleConfirmGift(): boolean {
    if (view.kind !== 'mission' && view.kind !== 'preview') {
      return false
    }

    const day = view.day
    const next = confirmGiftFound(activeProgress, day)

    // Idempotent retry: a day already holding its star changes nothing and
    // must not trigger a second celebration.
    if (next === activeProgress) {
      return true
    }

    const saved = updateProgress(next)

    if (!saved) {
      return false
    }

    if (!usingDemoProgress) {
      const detail = starEarnedDetail(day, countStars(next), TOTAL_MISSIONS)
      setCelebratedDay(day)
      window.dispatchEvent(new CustomEvent(STAR_EARNED_EVENT, { detail }))
    }

    return true
  }

  /** Automatic child return: focus and scroll to the star that was just won. */
  function handleRewardReturn() {
    if (view.kind !== 'mission') {
      return
    }

    const day = view.day
    setCelebratedDay(day)
    pendingFocusRef.current = {
      viewKey: 'calendar',
      selector: `[data-star-day="${day}"]`,
    }
    setView({ kind: 'calendar' })
  }

  async function handleSaveRecording(
    input: SaveRecordingToAlbumInput,
  ): Promise<AlbumSaveOutcome> {
    try {
      // Best effort and inside the explicit save action: a denial never blocks
      // the write, and the album panel reports the real persistence state.
      void requestPersistentStorage()
      const media = await albumStore.save({
        day: input.day,
        blob: input.blob,
        mimeType: input.mimeType,
        fileName: input.fileName,
        source: 'recording',
      })

      return { ok: true, media }
    } catch (error) {
      return { ok: false, error }
    }
  }

  function handleMissionBack() {
    if (view.kind === 'preview') {
      pendingFocusRef.current = {
        viewKey: 'adult-panel',
        selector: `[data-day-summary="${view.day}"]`,
      }
      setView({ kind: 'adult-panel' })
    } else {
      if (view.kind === 'mission') {
        pendingFocusRef.current = {
          viewKey: 'calendar',
          selector: `[data-day="${view.day}"]`,
        }
      }

      setView({ kind: 'calendar' })
    }
  }

  const mission =
    view.kind === 'mission' || view.kind === 'preview' ? getMission(view.day) : undefined
  const pendingReleasedDays = usingDemoProgress
    ? []
    : getReleasedDaysWithoutStar(activeProgress, now)
  // The final town artwork frames the child calendar and the workshop artwork
  // frames the mission surfaces. Each pair keeps a wide and a portrait variant.
  const missionSurface = view.kind === 'mission' || view.kind === 'preview'
  const backdropWide: AssetId = missionSurface
    ? 'ui.background.workshop.horizontal'
    : 'ui.background.town.horizontal'
  const backdropTall: AssetId = missionSurface
    ? 'ui.background.workshop.vertical'
    : 'ui.background.town.vertical'

  return (
    <div className="app">
      <div className="app__backdrop" aria-hidden="true">
        <AssetGlyph
          asset={getAsset(backdropWide)}
          label={false}
          className="app__backdrop-img app__backdrop-img--wide"
        />
        <AssetGlyph
          asset={getAsset(backdropTall)}
          label={false}
          className="app__backdrop-img app__backdrop-img--tall"
        />
      </div>

      <header className="app__header">
        <figure className="app__logo">
          <AssetGlyph
            asset={getAsset('ui.logo.characters')}
            label
            className="app__logo-image"
            priority
          />
        </figure>
        <p className="app__eyebrow">Calendario de Adviento · Diciembre 2026</p>
        <h1>Los 24 regalos desaparecidos</h1>
        <p className="app__lead">
          Trasto ha escondido un regalo cada día. Abre la puerta, supera la misión y
          encuentra tu estrella.
        </p>
      </header>

      {view.kind === 'preview' && adultUnlocked ? (
        <section className="preview-bar" aria-label="Vista previa de adulto">
          <p>
            <strong>Vista previa de adulto · Día {view.day}.</strong> Estás probando una
            misión con el progreso demo aislado. No se guarda nada en el calendario
            infantil.
          </p>
          <div className="preview-bar__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={handlePreviewBackToPanel}
            >
              Volver al panel familiar
            </button>
            <button type="button" className="button button--secondary" onClick={handleLockAdultArea}>
              Salir al calendario infantil y bloquear
            </button>
          </div>
        </section>
      ) : null}

      {!effectiveDemoMode && (view.kind === 'calendar' || view.kind === 'mission') ? (
        <ChildAudioBar
          preferences={audioPreferences}
          snapshot={audioSnapshot}
          onChange={commitAudioPreferences}
          onInteract={handleAudioInteract}
        />
      ) : null}

      {effectiveDemoMode ? (
        <section className="demo-bar" aria-label="Modo demostración adulto">
          <p>
            <strong>Modo demostración adulto.</strong> Todas las puertas están abiertas.
            El progreso demo está guardado aparte y no afecta al calendario infantil.
          </p>
          {demoPersistenceError ? (
            <p className="notice notice--warning" role="alert">
              No se pudo guardar el progreso demo en este dispositivo.
            </p>
          ) : null}
          <div className="demo-bar__actions">
            <button type="button" className="button button--secondary" onClick={handleResetDemo}>
              Reiniciar demo
            </button>
            <button type="button" className="button button--secondary" onClick={handleBackToPanel}>
              Volver al panel familiar
            </button>
            <button type="button" className="button button--secondary" onClick={handleLockAdultArea}>
              Bloquear panel
            </button>
          </div>
        </section>
      ) : null}

      {persistenceError ? (
        <p className="notice notice--warning" role="alert">
          No se pudo guardar el progreso en este dispositivo. Revisa el almacenamiento
          del navegador.
        </p>
      ) : null}

      <main>
        {showAdultGate ? (
          <AdultGate
            hasPin={hasPin}
            busy={adultBusy}
            error={adultError}
            onBack={() => setView({ kind: 'calendar' })}
            onSetupPin={handleSetupPin}
            onUnlock={handleUnlock}
          />
        ) : view.kind === 'adult-panel' ? (
          <AdultPanel
            config={state.config}
            demoMode={effectiveDemoMode}
            persistenceError={persistenceError}
            demoPersistenceError={demoPersistenceError}
            audioPreferences={audioPreferences}
            audioSnapshot={audioSnapshot}
            audioPersistenceError={audioPersistenceError}
            notice={adultError}
            onUpdateDay={handleUpdateDay}
            onToggleManualUnlock={handleToggleManualUnlock}
            onToggleCamera={handleToggleCamera}
            onPreviewDay={handlePreviewDay}
            onEnterDemo={handleEnterDemo}
            onExitDemo={handleExitDemo}
            onResetDemo={handleResetDemo}
            onLock={handleLockAdultArea}
            onBackToChild={handleBackToChild}
            onOpenAlbum={handleOpenAlbum}
            onChangeAudio={commitAudioPreferences}
            onTestAudio={handleTestAudio}
            onStopAudio={handleStopAudio}
          />
        ) : view.kind === 'adult-album' ? (
          <AlbumPanel
            store={albumStore}
            cameraEnabled={state.config.parental.cameraEnabled}
            onBack={handleAlbumBack}
            onLock={handleLockAdultArea}
          />
        ) : mission && (view.kind === 'mission' || view.kind === 'preview') ? (
          <MissionAudioScope day={view.day}>
            <MissionPanel
              day={view.day}
              mission={mission}
              progress={activeProgress}
              config={state.config}
              demoMode={usingDemoProgress}
              cameraEnabled={state.config.parental.cameraEnabled}
              developmentBuild={DEVELOPMENT_BUILD}
              backLabel={
                view.kind === 'preview'
                  ? 'Volver al panel familiar'
                  : 'Volver al calendario'
              }
              onBack={handleMissionBack}
              onCompleteMission={() => {
                const next = completeMission(activeProgress, view.day)

                if (next === activeProgress) {
                  return
                }

                if (updateProgress(next)) {
                  audioManager.playEffect('effect.success')
                }
              }}
              onRevealHint={(kind: HintKind) => {
                updateProgress(revealHint(activeProgress, view.day, kind))
              }}
              onConfirmGift={() => {
                const saved = handleConfirmGift()

                if (saved) {
                  audioManager.playEffect('effect.celebration')
                }

                return saved
              }}
              onRewardReturn={handleRewardReturn}
              onSaveRecording={handleSaveRecording}
            />
          </MissionAudioScope>
        ) : (
          <>
            <CalendarGrid
              progress={activeProgress}
              config={state.config}
              access={access}
              now={now}
              onOpenDay={handleOpenDay}
            />
            <StarTree
              progress={activeProgress}
              pendingReleasedDays={pendingReleasedDays}
              celebratedDay={celebratedDay}
            />
          </>
        )}
      </main>

      <footer className="app__footer">
        <p>
          Panel familiar local con PIN, pistas por día, desbloqueo manual y álbum
          privado en el dispositivo.
        </p>
        <button
          type="button"
          className="link-button"
          data-adult-area
          onClick={handleOpenAdultArea}
        >
          Zona de adultos
        </button>
      </footer>
    </div>
  )
}
