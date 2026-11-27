import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  AUDIO_CATALOG,
  getAudio,
  isAudioId,
  type AudioEntry,
} from '../src/domain/audioCatalog'
import {
  DEFAULT_AUDIO_PREFERENCES,
  MUSIC_DUCKING_GAIN,
  clampAudioVolume,
  normalizeAudioPreferences,
  resolveAudioCapability,
  resolveAudioMix,
  type AudioPreferences,
} from '../src/domain/audioPreferences'
import {
  AUDIO_PREFERENCES_KEY,
  AUDIO_PREFERENCES_SCHEMA_VERSION,
  loadAudioPreferences,
  saveAudioPreferences,
} from '../src/storage/audioPreferences'

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>()

  get length(): number {
    return this.data.size
  }

  clear(): void {
    this.data.clear()
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
}

function catalogEntries(): [string, AudioEntry][] {
  return Object.entries(AUDIO_CATALOG) as [string, AudioEntry][]
}

test('the audio catalog covers music, voice and effects with provisional entries', () => {
  const entries = catalogEntries()

  for (const channel of ['music', 'voice', 'effects'] as const) {
    assert.ok(
      entries.some(([, entry]) => entry.channel === channel),
      `missing ${channel}`,
    )
  }

  for (const [id, entry] of entries) {
    assert.equal(entry.provisional, true, id)
    assert.ok(entry.label.trim().length > 0, id)

    if (entry.kind === 'tones') {
      assert.ok(entry.tones.length > 0, id)

      for (const tone of entry.tones) {
        assert.ok(tone.frequency > 0, `${id} frequency`)
        assert.ok(tone.duration > 0, `${id} duration`)

        if (tone.gain !== undefined) {
          assert.ok(tone.gain > 0 && tone.gain <= 1, `${id} gain`)
        }
      }

      if (entry.loopSeconds !== undefined) {
        assert.ok(entry.loopSeconds > 0, `${id} loop`)
      }
    }

    if (entry.kind === 'file') {
      assert.ok(entry.src.trim().length > 0, id)
    }

    if (entry.kind === 'silent') {
      assert.ok(entry.note.trim().length > 0, id)
    }
  }
})

test('audio ids keep their channel prefix and resolve through one helper', () => {
  for (const [id, entry] of catalogEntries()) {
    const prefix = entry.channel === 'effects' ? 'effect.' : `${entry.channel}.`
    assert.ok(id.startsWith(prefix), id)
    assert.equal(isAudioId(id), true, id)
  }

  assert.equal(isAudioId('missing.audio'), false)
  assert.equal(getAudio('effect.bell.do').channel, 'effects')
  assert.equal(getAudio('music.ambient').kind, 'tones')
  assert.equal(getAudio('voice.trasto.welcome').kind, 'silent')
})

test('default preferences enable every channel at a moderate volume', () => {
  assert.equal(DEFAULT_AUDIO_PREFERENCES.muted, false)
  assert.equal(DEFAULT_AUDIO_PREFERENCES.music, true)
  assert.equal(DEFAULT_AUDIO_PREFERENCES.voice, true)
  assert.equal(DEFAULT_AUDIO_PREFERENCES.effects, true)
  assert.ok(DEFAULT_AUDIO_PREFERENCES.volume > 0)
  assert.ok(DEFAULT_AUDIO_PREFERENCES.volume < 1)
})

test('corrupt or out-of-range preferences fall back safely', () => {
  assert.deepEqual(normalizeAudioPreferences(null), DEFAULT_AUDIO_PREFERENCES)
  assert.deepEqual(normalizeAudioPreferences('loud'), DEFAULT_AUDIO_PREFERENCES)
  assert.deepEqual(normalizeAudioPreferences([]), DEFAULT_AUDIO_PREFERENCES)

  const clamped = normalizeAudioPreferences({
    muted: true,
    music: false,
    voice: 'yes',
    effects: 0,
    volume: 4,
  })

  assert.equal(clamped.muted, true)
  assert.equal(clamped.music, false)
  assert.equal(clamped.voice, DEFAULT_AUDIO_PREFERENCES.voice)
  assert.equal(clamped.effects, DEFAULT_AUDIO_PREFERENCES.effects)
  assert.equal(clamped.volume, 1)

  assert.equal(normalizeAudioPreferences({ volume: -3 }).volume, 0)
  assert.equal(normalizeAudioPreferences({ volume: '0.5' }).volume, DEFAULT_AUDIO_PREFERENCES.volume)
  assert.equal(clampAudioVolume(0.333), 0.33)
  assert.equal(clampAudioVolume(Number.POSITIVE_INFINITY), DEFAULT_AUDIO_PREFERENCES.volume)
})

test('the mix respects mute, channel toggles, volume and voice ducking', () => {
  const preferences: AudioPreferences = {
    muted: false,
    music: true,
    voice: true,
    effects: true,
    volume: 0.8,
  }

  assert.deepEqual(resolveAudioMix(preferences), {
    music: 0.8,
    voice: 0.8,
    effects: 0.8,
  })

  const ducked = resolveAudioMix(preferences, { voiceActive: true })
  assert.equal(ducked.music, 0.8 * MUSIC_DUCKING_GAIN)
  assert.equal(ducked.voice, 0.8)
  assert.equal(ducked.effects, 0.8)

  const noMusic = resolveAudioMix({ ...preferences, music: false })
  assert.equal(noMusic.music, 0)
  assert.equal(noMusic.voice, 0.8)

  const noEffects = resolveAudioMix({ ...preferences, effects: false })
  assert.equal(noEffects.effects, 0)

  const muted = resolveAudioMix({ ...preferences, muted: true }, { voiceActive: true })
  assert.deepEqual(muted, { music: 0, voice: 0, effects: 0 })
})

test('music is not ducked when the voice channel is disabled', () => {
  const base: AudioPreferences = {
    muted: false,
    music: true,
    voice: false,
    effects: true,
    volume: 0.6,
  }

  assert.equal(resolveAudioMix(base, { voiceActive: true }).music, 0.6)
  assert.equal(resolveAudioMix(base, { voiceActive: false }).music, 0.6)
})

test('audio capability distinguishes unsupported, gesture-gated and ready', () => {
  assert.equal(
    resolveAudioCapability({ hasAudioContext: false, hasUserActivation: true }),
    'unsupported',
  )
  assert.equal(
    resolveAudioCapability({ hasAudioContext: true, hasUserActivation: false }),
    'needs-gesture',
  )
  assert.equal(
    resolveAudioCapability({ hasAudioContext: true, hasUserActivation: true }),
    'ready',
  )
  assert.equal(
    resolveAudioCapability({
      hasAudioContext: true,
      hasUserActivation: false,
      contextRunning: true,
    }),
    'ready',
  )
})

test('audio preferences round-trip through local storage', () => {
  const storage = new MemoryStorage()
  const preferences: AudioPreferences = {
    muted: true,
    music: false,
    voice: true,
    effects: false,
    volume: 0.35,
  }

  assert.deepEqual(loadAudioPreferences(storage), DEFAULT_AUDIO_PREFERENCES)
  assert.equal(saveAudioPreferences(preferences, storage), true)
  assert.deepEqual(loadAudioPreferences(storage), preferences)

  storage.setItem(
    AUDIO_PREFERENCES_KEY,
    JSON.stringify({
      schemaVersion: AUDIO_PREFERENCES_SCHEMA_VERSION + 1,
      preferences,
    }),
  )
  assert.deepEqual(loadAudioPreferences(storage), DEFAULT_AUDIO_PREFERENCES)

  storage.setItem(AUDIO_PREFERENCES_KEY, '{')
  assert.deepEqual(loadAudioPreferences(storage), DEFAULT_AUDIO_PREFERENCES)
})

test('audio preference save reports failure instead of pretending success', () => {
  const storage = new MemoryStorage()
  storage.setItem = () => {
    throw new Error('quota')
  }

  assert.equal(saveAudioPreferences(DEFAULT_AUDIO_PREFERENCES, storage), false)
  assert.equal(saveAudioPreferences(DEFAULT_AUDIO_PREFERENCES, null), false)
})
