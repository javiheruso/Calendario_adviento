/**
 * Browser audio manager.
 *
 * Responsibilities:
 * - create or resume the `AudioContext` only from a user interaction;
 * - play catalog music, voice and effects without blocking game logic;
 * - apply the pure `resolveAudioMix` gains, including music ducking while a
 *   voice is audible;
 * - stop mission-scoped audio on unmount and release every node on `stopAll`;
 * - stay silent and report a clear message when the browser, autoplay policy or
 *   an audio asset fails. No game depends on audio to be playable.
 *
 * This module is the only place that touches Web Audio or loads audio files.
 */
import { getAudio, isAudioId, type AudioChannel, type AudioEntry, type AudioId, type AudioTone } from '../domain/audioCatalog'
import {
  DEFAULT_AUDIO_PREFERENCES,
  resolveAudioMix,
  type AudioPreferences,
} from '../domain/audioPreferences'
import { resolveAssetPath } from '../domain/assetPath'

export type AudioStatus = 'idle' | 'running' | 'suspended' | 'unsupported' | 'error'

export interface AudioSnapshot {
  readonly status: AudioStatus
  readonly message: string | null
}

export interface AudioPlayOptions {
  /** Overrides the current scope; useful for app-level sounds inside a mission. */
  readonly scope?: string
  /** Extra gain multiplier, from 0 to 1. */
  readonly gain?: number
}

interface ActiveSource {
  readonly scope: string
  readonly channel: AudioChannel
  stop(): void
}

interface MusicSource {
  readonly scope: string
  stop(): void
}

interface ScheduleToneOptions {
  readonly extraGain?: number
  /** Music patterns manage their own registry. */
  readonly register?: boolean
  readonly onEnded?: () => void
}

type AudioContextConstructor = new () => AudioContext

const INITIAL_SNAPSHOT: AudioSnapshot = { status: 'idle', message: null }
const LOOKAHEAD_SECONDS = 0.05
const DEFAULT_SCOPE = 'app'

/**
 * Planners and engines may attach the manager to a test harness later. Today
 * the app uses this single instance; `createAudioManager` keeps construction
 * explicit and avoids hidden module state beyond the exported singleton.
 */
export class AudioManager {
  private context: AudioContext | null = null
  private channels: Record<AudioChannel, GainNode> | null = null
  private preferences: AudioPreferences = { ...DEFAULT_AUDIO_PREFERENCES }
  private snapshot: AudioSnapshot = INITIAL_SNAPSHOT
  private readonly listeners = new Set<() => void>()
  private readonly activeSources = new Set<ActiveSource>()
  private readonly bufferCache = new Map<string, AudioBuffer>()
  private currentMusic: MusicSource | null = null
  private musicSession = 0
  private currentScope = DEFAULT_SCOPE
  private disposed = false

  public readonly getSnapshot = (): AudioSnapshot => this.snapshot

  public readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  public setPreferences(preferences: AudioPreferences): void {
    this.preferences = preferences
    this.applyGains()
  }

  /**
   * Creates or resumes the context. Call it synchronously from a user gesture
   * (a click, tap or key press) so the autoplay policy can allow playback.
   */
  public async unlock(): Promise<AudioStatus> {
    const context = this.ensureContext()

    if (!context) {
      return this.snapshot.status
    }

    try {
      if (context.state === 'suspended') {
        await context.resume()
      }

      if (context.state === 'running') {
        this.emit({ status: 'running', message: null })
        this.applyGains()
        return 'running'
      }

      this.emit({
        status: 'suspended',
        message:
          'El navegador ha bloqueado el audio. Pulsa un botón de sonido para activarlo.',
      })
      return 'suspended'
    } catch {
      this.emit({
        status: 'error',
        message: 'No se pudo iniciar el audio. Puedes seguir jugando en silencio.',
      })
      return 'error'
    }
  }

  /** Effects are fire-and-forget: callers never wait for them to finish. */
  public playEffect(id: AudioId, options: AudioPlayOptions = {}): void {
    const entry = getAudio(id) as AudioEntry

    if (entry.channel !== 'effects') {
      return
    }

    this.playOneShot(entry, this.resolveScope(options), options.gain)
  }

  /** Voice playback registers as voice so music ducks while it is audible. */
  public playVoice(id: AudioId, options: AudioPlayOptions = {}): void {
    const entry = getAudio(id) as AudioEntry

    if (entry.channel !== 'voice') {
      return
    }

    this.playOneShot(entry, this.resolveScope(options), options.gain)
  }

  /** Starts a music cue, replacing any current one. */
  public playMusic(id: AudioId, options: AudioPlayOptions = {}): void {
    const entry = getAudio(id) as AudioEntry

    if (entry.channel !== 'music') {
      return
    }

    this.stopMusic()
    const context = this.ensureContext()

    if (!context || !this.channels) {
      return
    }

    const scope = this.resolveScope(options)
    const session = ++this.musicSession
    const destination = this.channels.music
    let stopImpl: () => void = () => undefined

    const musicSource: MusicSource = {
      scope,
      stop: () => {
        stopImpl()
        if (this.currentMusic === musicSource) {
          this.currentMusic = null
        }
        this.applyGains()
      },
    }

    const start = () => {
      if (!this.context || session !== this.musicSession) {
        return
      }

      if (entry.kind === 'silent') {
        return
      }

      if (entry.kind === 'file') {
        void this.startFileMusic(context, entry, destination, session, (stop) => {
          stopImpl = stop
        })
        return
      }

      const cycles = new Set<ActiveSource>()
      let timer: number | null = null

      const playCycle = () => {
        const source = this.scheduleTones(
          context,
          entry.tones,
          destination,
          scope,
          'music',
          {
            extraGain: options.gain,
            register: false,
            onEnded: () => {
              cycles.delete(source)
            },
          },
        )
        cycles.add(source)
      }

      playCycle()

      if (entry.loopSeconds && entry.loopSeconds > 0) {
        timer = window.setInterval(playCycle, entry.loopSeconds * 1000)
      }

      stopImpl = () => {
        if (timer !== null) {
          window.clearInterval(timer)
          timer = null
        }
        for (const cycle of cycles) {
          cycle.stop()
        }
        cycles.clear()
      }
    }

    this.currentMusic = musicSource

    if (context.state === 'running') {
      this.emit({ status: 'running', message: null })
      start()
      return
    }

    void this.resumeContext(context).then((running) => {
      if (running) {
        start()
      }
    })
  }

  public stopMusic(): void {
    this.musicSession += 1
    const music = this.currentMusic
    this.currentMusic = null
    music?.stop()
  }

  public stopVoice(): void {
    for (const source of [...this.activeSources]) {
      if (source.channel === 'voice') {
        source.stop()
      }
    }
  }

  /** Audio played inside this scope is stopped by the matching `exitScope`. */
  public enterScope(scope: string): void {
    this.currentScope = scope
  }

  public exitScope(scope: string): void {
    if (this.currentMusic?.scope === scope) {
      this.stopMusic()
    }

    for (const source of [...this.activeSources]) {
      if (source.scope === scope) {
        source.stop()
      }
    }

    if (this.currentScope === scope) {
      this.currentScope = DEFAULT_SCOPE
    }
  }

  public stopAll(): void {
    this.stopMusic()

    for (const source of [...this.activeSources]) {
      source.stop()
    }

    this.activeSources.clear()
    this.currentScope = DEFAULT_SCOPE
    this.applyGains()
  }

  public dispose(): void {
    this.stopAll()
    this.disposed = true

    const context = this.context
    this.context = null
    this.channels = null
    this.bufferCache.clear()

    if (context && context.state !== 'closed') {
      void context.close().catch(() => undefined)
    }
  }

  private resolveScope(options: AudioPlayOptions): string {
    return options.scope ?? this.currentScope
  }

  private ensureContext(): AudioContext | null {
    if (this.disposed) {
      return null
    }

    if (this.context && this.context.state !== 'closed') {
      return this.context
    }

    if (this.context) {
      // The browser closed the context (reclaim or page lifecycle). Drop any
      // source that belonged to it before creating a fresh graph.
      this.context = null
      this.channels = null
      this.stopAll()
    }

    const Constructor = getAudioContextConstructor()

    if (!Constructor) {
      this.emit({
        status: 'unsupported',
        message:
          'Este navegador no puede reproducir audio. Todas las actividades siguen disponibles en silencio.',
      })
      return null
    }

    try {
      const context = new Constructor()
      const music = context.createGain()
      const voice = context.createGain()
      const effects = context.createGain()

      music.connect(context.destination)
      voice.connect(context.destination)
      effects.connect(context.destination)

      this.context = context
      this.channels = { music, voice, effects }
      this.applyGains()

      context.onstatechange = () => {
        if (this.context !== context || this.disposed) {
          return
        }

        if (context.state === 'running') {
          this.emit({ status: 'running', message: null })
        } else if (context.state === 'suspended') {
          this.emit({
            status: 'suspended',
            message:
              'El navegador ha suspendido el audio. Pulsa un botón de sonido para reanudarlo.',
          })
        }
      }

      return context
    } catch {
      this.emit({
        status: 'error',
        message: 'No se pudo iniciar el audio. Puedes seguir jugando en silencio.',
      })
      return null
    }
  }

  private async resumeContext(context: AudioContext): Promise<boolean> {
    try {
      if (context.state === 'suspended') {
        await context.resume()
      }

      if (context.state === 'running') {
        this.emit({ status: 'running', message: null })
        this.applyGains()
        return true
      }

      this.emit({
        status: 'suspended',
        message:
          'El navegador ha bloqueado el audio. Pulsa un botón de sonido para activarlo.',
      })
      return false
    } catch {
      this.emit({
        status: 'error',
        message: 'No se pudo iniciar el audio. Puedes seguir jugando en silencio.',
      })
      return false
    }
  }

  private playOneShot(entry: AudioEntry, scope: string, extraGain?: number): void {
    if (entry.kind === 'silent') {
      return
    }

    const context = this.ensureContext()

    if (!context || !this.channels) {
      return
    }

    const destination = this.channels[entry.channel]

    const start = () => {
      if (!this.context || !this.channels) {
        return
      }

      if (entry.kind === 'file') {
        void this.playFileOnce(context, entry, destination, scope, extraGain)
        return
      }

      this.scheduleTones(context, entry.tones, destination, scope, entry.channel, {
        extraGain,
      })
    }

    if (context.state === 'running') {
      this.emit({ status: 'running', message: null })
      start()
      return
    }

    void this.resumeContext(context).then((running) => {
      if (running) {
        start()
      }
    })
  }

  private scheduleTones(
    context: AudioContext,
    tones: readonly AudioTone[],
    destination: AudioNode,
    scope: string,
    channel: AudioChannel,
    options: ScheduleToneOptions = {},
  ): ActiveSource {
    const register = options.register ?? true
    const extraGain = options.extraGain ?? 1
    const oscillators: OscillatorNode[] = []
    const gains: GainNode[] = []
    const base = context.currentTime + LOOKAHEAD_SECONDS
    let remaining = Math.max(1, tones.length)
    let finished = false

    const source: ActiveSource = {
      scope,
      channel,
      stop: () => {
        for (const oscillator of oscillators) {
          try {
            oscillator.stop()
          } catch {
            // Already stopped; finishing below is still safe.
          }
        }
        finish()
      },
    }

    const finish = () => {
      if (finished) {
        return
      }

      finished = true

      if (register) {
        this.activeSources.delete(source)
      }

      for (const gain of gains) {
        try {
          gain.disconnect()
        } catch {
          // Disconnecting an already-disconnected node is harmless.
        }
      }

      this.applyGains()
      options.onEnded?.()
    }

    for (const tone of tones) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const start = base + Math.max(0, tone.start ?? 0)
      const duration = Math.max(0.03, tone.duration)
      const peak = Math.max(
        0.0001,
        Math.min(1, (tone.gain ?? 0.5) * extraGain),
      )

      oscillator.type = tone.wave ?? 'sine'
      oscillator.frequency.setValueAtTime(tone.frequency, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(
        peak,
        start + Math.min(0.02, duration / 2),
      )
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      oscillator.connect(gain)
      gain.connect(destination)
      oscillator.start(start)
      oscillator.stop(start + duration + 0.03)
      oscillators.push(oscillator)
      gains.push(gain)

      oscillator.onended = () => {
        remaining -= 1

        if (remaining <= 0) {
          finish()
        }
      }
    }

    if (register) {
      this.activeSources.add(source)
    }

    this.applyGains()
    return source
  }

  private async playFileOnce(
    context: AudioContext,
    entry: Extract<AudioEntry, { kind: 'file' }>,
    destination: AudioNode,
    scope: string,
    extraGain?: number,
  ): Promise<void> {
    const buffer = await this.loadBuffer(context, entry)

    if (!buffer || this.context !== context) {
      return
    }

    try {
      const node = context.createBufferSource()
      const gain = context.createGain()
      gain.gain.value = extraGain ?? 1
      node.buffer = buffer
      node.connect(gain)
      gain.connect(destination)

      const active: ActiveSource = {
        scope,
        channel: entry.channel,
        stop: () => {
          try {
            node.stop()
          } catch {
            // A one-shot that already ended needs no extra stop.
          }
          finish()
        },
      }

      const finish = () => {
        this.activeSources.delete(active)
        try {
          gain.disconnect()
        } catch {
          // Already disconnected.
        }
        this.applyGains()
      }

      node.onended = finish
      this.activeSources.add(active)
      this.applyGains()
      node.start()
    } catch {
      this.reportAssetFailure()
    }
  }

  private async startFileMusic(
    context: AudioContext,
    entry: Extract<AudioEntry, { kind: 'file' }>,
    destination: AudioNode,
    session: number,
    setStop: (stop: () => void) => void,
  ): Promise<void> {
    const buffer = await this.loadBuffer(context, entry)

    if (!buffer || this.context !== context || session !== this.musicSession) {
      return
    }

    try {
      const node = context.createBufferSource()
      const gain = context.createGain()
      node.buffer = buffer
      node.loop = true
      node.connect(gain)
      gain.connect(destination)
      node.start()
      setStop(() => {
        try {
          node.stop()
        } catch {
          // Already stopped.
        }
        try {
          gain.disconnect()
        } catch {
          // Already disconnected.
        }
      })
    } catch {
      this.reportAssetFailure()
    }
  }

  private async loadBuffer(
    context: AudioContext,
    entry: Extract<AudioEntry, { kind: 'file' }>,
  ): Promise<AudioBuffer | null> {
    const cached = this.bufferCache.get(entry.src)

    if (cached) {
      return cached
    }

    try {
      const response = await fetch(resolveAssetPath(entry.src))

      if (!response.ok) {
        throw new Error('Audio asset request failed.')
      }

      const data = await response.arrayBuffer()
      const buffer = await context.decodeAudioData(data)
      this.bufferCache.set(entry.src, buffer)
      return buffer
    } catch {
      this.reportAssetFailure()
      return null
    }
  }

  private applyGains(): void {
    if (!this.channels) {
      return
    }

    const voiceActive = [...this.activeSources].some(
      (source) => source.channel === 'voice',
    )
    const mix = resolveAudioMix(this.preferences, { voiceActive })

    this.setGain(this.channels.music, mix.music)
    this.setGain(this.channels.voice, mix.voice)
    this.setGain(this.channels.effects, mix.effects)
  }

  private setGain(node: GainNode, value: number): void {
    try {
      node.gain.setTargetAtTime(value, node.context.currentTime, 0.02)
    } catch {
      try {
        node.gain.value = value
      } catch {
        // A closed context cannot receive gain updates.
      }
    }
  }

  private reportAssetFailure(): void {
    this.emit({
      message:
        'No se pudo cargar un audio. La actividad continúa en silencio y sin bloquear el juego.',
    })
  }

  private emit(patch: Partial<AudioSnapshot>): void {
    const next: AudioSnapshot = {
      status: patch.status ?? this.snapshot.status,
      message: patch.message !== undefined ? patch.message : this.snapshot.message,
    }

    if (next.status === this.snapshot.status && next.message === this.snapshot.message) {
      return
    }

    this.snapshot = next

    for (const listener of this.listeners) {
      listener()
    }
  }
}

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') {
    return null
  }

  const typedWindow = window as Window & {
    webkitAudioContext?: AudioContextConstructor
  }

  return window.AudioContext ?? typedWindow.webkitAudioContext ?? null
}

export const audioManager = new AudioManager()

export { isAudioId }
