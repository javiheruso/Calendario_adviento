import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  KARAOKE_CONTENT_CONFIG,
  KARAOKE_COUNTDOWN_SECONDS,
  KARAOKE_LINES,
  KARAOKE_LINE_SECONDS,
  KARAOKE_SONG_SECONDS,
  KARAOKE_STYLES,
  KARAOKE_STYLE_SECONDS,
  KARAOKE_TOTAL_SECONDS,
  activeKaraokeLine,
  activeKaraokeStyle,
  advanceKaraoke,
  createKaraokeState,
  isKaraokeComplete,
  karaokeCountdownValue,
  karaokePhase,
  karaokeSnapshot,
  karaokeSongSeconds,
  nextKaraokeLine,
  resetKaraoke,
  startKaraoke,
} from '../src/domain/games/karaoke'
import {
  KARAOKE_MIME_CANDIDATES,
  cameraConstraints,
  recorderExtension,
  resolveRecordingCapability,
  selectRecorderMimeType,
} from '../src/domain/games/karaokeRecording'

function atSong(seconds: number) {
  const started = startKaraoke(createKaraokeState())
  return advanceKaraoke(started, KARAOKE_COUNTDOWN_SECONDS + seconds)
}

test('the authorized-content seam is explicit and ships no track or final lyric', () => {
  assert.equal(KARAOKE_CONTENT_CONFIG.authorized, false)
  assert.equal(KARAOKE_CONTENT_CONFIG.lyricSource, 'provisional')
  assert.equal(KARAOKE_CONTENT_CONFIG.instrumentalPath, null)
  assert.equal(KARAOKE_CONTENT_CONFIG.guideVocalPath, null)
  assert.equal(KARAOKE_CONTENT_CONFIG.countdownSeconds, KARAOKE_COUNTDOWN_SECONDS)
  assert.equal(KARAOKE_CONTENT_CONFIG.songSeconds, KARAOKE_SONG_SECONDS)
  assert.equal(KARAOKE_CONTENT_CONFIG.styleSeconds, KARAOKE_STYLE_SECONDS)
  assert.equal(KARAOKE_CONTENT_CONFIG.lineSeconds, KARAOKE_LINE_SECONDS)
})

test('the provisional song lasts between 60 and 90 seconds and keeps six styles', () => {
  assert.ok(KARAOKE_SONG_SECONDS >= 60 && KARAOKE_SONG_SECONDS <= 90)
  assert.equal(KARAOKE_SONG_SECONDS, KARAOKE_LINES.length * KARAOKE_LINE_SECONDS)
  assert.equal(KARAOKE_TOTAL_SECONDS, KARAOKE_COUNTDOWN_SECONDS + KARAOKE_SONG_SECONDS)
  assert.deepEqual(
    KARAOKE_STYLES.map((style) => style.id),
    ['robot', 'mouse', 'giant', 'sleepy', 'laugh', 'pop-star'],
  )
  assert.equal(KARAOKE_STYLES.length * KARAOKE_STYLE_SECONDS, KARAOKE_SONG_SECONDS)

  for (const style of KARAOKE_STYLES) {
    assert.ok(style.label.length > 0)
    assert.ok(style.instruction.length > 0)
  }
})

test('the provisional lyric is contiguous and matches its style block', () => {
  assert.equal(KARAOKE_LINES.length, 12)

  for (const [index, line] of KARAOKE_LINES.entries()) {
    const expectedStyle =
      KARAOKE_STYLES[Math.floor(line.startSeconds / KARAOKE_STYLE_SECONDS)]?.id

    assert.equal(line.startSeconds, index * KARAOKE_LINE_SECONDS)
    assert.equal(line.endSeconds, (index + 1) * KARAOKE_LINE_SECONDS)
    assert.equal(line.style, expectedStyle)
    assert.ok(line.text.length > 0)
  }

  assert.equal(KARAOKE_LINES.at(-1)?.endSeconds, KARAOKE_SONG_SECONDS)
})

test('the timeline stays ready until the child starts and then counts 3, 2, 1', () => {
  const ready = createKaraokeState()
  assert.equal(karaokePhase(ready), 'ready')
  assert.equal(karaokeCountdownValue(ready), null)
  assert.equal(advanceKaraoke(ready, 20), ready, 'the song never moves before starting')

  const started = startKaraoke(ready)
  assert.equal(startKaraoke(started), started, 'starting twice never rewinds the song')
  assert.equal(karaokeCountdownValue(started), 3)
  assert.equal(karaokeCountdownValue(advanceKaraoke(started, 1)), 2)
  assert.equal(karaokeCountdownValue(advanceKaraoke(started, 2)), 1)
  assert.equal(karaokeCountdownValue(advanceKaraoke(started, 3)), null)
  assert.equal(karaokePhase(advanceKaraoke(started, 3)), 'singing')
})

test('lyrics and style orders change at their exact boundaries', () => {
  assert.equal(activeKaraokeLine(atSong(0))?.text, KARAOKE_LINES[0]?.text)
  assert.equal(activeKaraokeLine(atSong(5.9))?.text, KARAOKE_LINES[0]?.text)
  assert.equal(activeKaraokeLine(atSong(6))?.text, KARAOKE_LINES[1]?.text)
  assert.equal(activeKaraokeLine(atSong(12))?.style, 'mouse')
  assert.equal(activeKaraokeStyle(atSong(0))?.id, 'robot')
  assert.equal(activeKaraokeStyle(atSong(11.9))?.id, 'robot')
  assert.equal(activeKaraokeStyle(atSong(12))?.id, 'mouse')
  assert.equal(activeKaraokeStyle(atSong(24))?.id, 'giant')
  assert.equal(activeKaraokeStyle(atSong(36))?.id, 'sleepy')
  assert.equal(activeKaraokeStyle(atSong(48))?.id, 'laugh')
  assert.equal(activeKaraokeStyle(atSong(60))?.id, 'pop-star')
  assert.equal(activeKaraokeStyle(atSong(71.9))?.id, 'pop-star')
})

test('the next line is exposed only while the current line is playing', () => {
  assert.equal(nextKaraokeLine(createKaraokeState()), null)
  assert.equal(nextKaraokeLine(atSong(0))?.id, KARAOKE_LINES[1]?.id)
  assert.equal(nextKaraokeLine(atSong(60))?.id, KARAOKE_LINES[11]?.id)
  assert.equal(nextKaraokeLine(atSong(66)), null)
  assert.equal(nextKaraokeLine(atSong(71.9)), null)
})

test('finishing the song completes the mission without a penalty or extra attempt', () => {
  const nearEnd = atSong(71.9)
  assert.equal(isKaraokeComplete(nearEnd), false)
  assert.equal(karaokeSongSeconds(nearEnd), 71.9)

  const complete = advanceKaraoke(nearEnd, 0.1)
  assert.equal(karaokePhase(complete), 'complete')
  assert.equal(isKaraokeComplete(complete), true)
  assert.equal(activeKaraokeLine(complete), null)
  assert.equal(activeKaraokeStyle(complete), null)
  assert.equal(karaokeSongSeconds(complete), KARAOKE_SONG_SECONDS)
  assert.equal(karaokeSnapshot(complete).progress, 1)
  assert.equal(advanceKaraoke(complete, 500), complete)
})

test('resetting returns to the ready screen for another performance', () => {
  const reset = resetKaraoke()
  assert.equal(karaokePhase(reset), 'ready')
  assert.equal(reset.started, false)
  assert.equal(karaokeSnapshot(reset).progress, 0)
})

test('MediaRecorder MIME negotiation prefers WebM and never assumes MP4', () => {
  assert.match(KARAOKE_MIME_CANDIDATES[0], /webm/)

  assert.equal(selectRecorderMimeType(() => false), null)
  assert.equal(
    selectRecorderMimeType((mime) => mime === 'video/mp4'),
    'video/mp4',
  )
  assert.equal(
    selectRecorderMimeType((mime) => mime === 'video/webm;codecs=vp8,opus'),
    'video/webm;codecs=vp8,opus',
  )
  assert.equal(selectRecorderMimeType(() => true), KARAOKE_MIME_CANDIDATES[0])
})

test('recording extensions follow the negotiated container', () => {
  assert.equal(recorderExtension('video/webm;codecs=vp9,opus'), 'webm')
  assert.equal(recorderExtension('video/mp4'), 'mp4')
  assert.equal(recorderExtension('video/quicktime'), 'mov')
  assert.equal(recorderExtension('video/ogg'), 'ogv')
  assert.equal(recorderExtension(null), 'webm')
})

test('the front camera is the default and audio can be requested independently', () => {
  assert.deepEqual(cameraConstraints('user', true), {
    audio: true,
    video: { facingMode: { ideal: 'user' } },
  })
  assert.deepEqual(cameraConstraints('environment', false), {
    audio: false,
    video: { facingMode: { ideal: 'environment' } },
  })
})

test('recording capability reports missing browser APIs as playable fallbacks', () => {
  assert.equal(resolveRecordingCapability(true, true), 'ready')
  assert.equal(resolveRecordingCapability(false, true), 'no-user-media')
  assert.equal(resolveRecordingCapability(true, false), 'no-media-recorder')
})
