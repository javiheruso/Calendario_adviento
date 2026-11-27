import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  capturePhotoBlob,
  fitCaptureSize,
  photoCaptureFileName,
  resolvePhotoCaptureCapability,
  type CaptureFrame,
  type PhotoCaptureDeps,
} from '../src/domain/albumCapture'

interface FakeCanvas {
  width: number
  height: number
}

const FRAME: CaptureFrame = {
  source: { mocked: 'video' },
  videoWidth: 4000,
  videoHeight: 3000,
}

function frame(overrides: Partial<CaptureFrame> = {}): CaptureFrame {
  return { ...FRAME, ...overrides }
}

function deps(
  overrides: Partial<PhotoCaptureDeps<FakeCanvas>> = {},
): PhotoCaptureDeps<FakeCanvas> {
  return {
    createCanvas: () => ({ width: 0, height: 0 }),
    drawFrame: () => true,
    toBlob: async () => new Blob(['photo'], { type: 'image/jpeg' }),
    ...overrides,
  }
}

test('capture size respects the aspect ratio and never upscales', () => {
  assert.deepEqual(fitCaptureSize(4000, 3000), { width: 1600, height: 1200 })
  assert.deepEqual(fitCaptureSize(1920, 1080), { width: 1600, height: 900 })
  assert.deepEqual(fitCaptureSize(800, 600), { width: 800, height: 600 })
  assert.deepEqual(fitCaptureSize(1, 1), { width: 1, height: 1 })
  assert.deepEqual(fitCaptureSize(4000, 3000, 100), { width: 100, height: 75 })
})

test('capture size rejects a frame without readable dimensions', () => {
  assert.equal(fitCaptureSize(0, 3000), null)
  assert.equal(fitCaptureSize(4000, 0), null)
  assert.equal(fitCaptureSize(Number.NaN, 3000), null)
  assert.equal(fitCaptureSize(4000, Number.POSITIVE_INFINITY), null)
  assert.equal(fitCaptureSize(4000, 3000, 0), null)
})

test('photo capture capability reports the missing browser piece', () => {
  assert.equal(resolvePhotoCaptureCapability(true, true), 'ready')
  assert.equal(resolvePhotoCaptureCapability(false, true), 'no-user-media')
  assert.equal(resolvePhotoCaptureCapability(true, false), 'no-canvas')
  assert.equal(resolvePhotoCaptureCapability(false, false), 'no-user-media')
})

test('capture pipeline clamps the canvas and returns the blob', async () => {
  let drawnFrame: CaptureFrame | null = null
  let requestedMime = ''
  const canvas: FakeCanvas = { width: 0, height: 0 }
  const outcome = await capturePhotoBlob(
    FRAME,
    deps({
      createCanvas: () => canvas,
      drawFrame: (_canvas, nextFrame) => {
        drawnFrame = nextFrame
        return true
      },
      toBlob: async (_canvas, mimeType) => {
        requestedMime = mimeType
        return new Blob(['photo'], { type: 'image/jpeg' })
      },
    }),
  )

  assert.equal(outcome.ok, true)
  assert.equal(outcome.ok ? await outcome.blob.text() : '', 'photo')
  assert.equal(canvas.width, 1600)
  assert.equal(canvas.height, 1200)
  assert.equal(drawnFrame, FRAME)
  assert.equal(requestedMime, 'image/jpeg')
})

test('capture pipeline reports each failure without throwing', async () => {
  const cases: Array<{
    frameValue: CaptureFrame
    depsValue: PhotoCaptureDeps<FakeCanvas>
    code: string
  }> = [
    {
      frameValue: frame({ videoWidth: 0 }),
      depsValue: deps(),
      code: 'not-ready',
    },
    {
      frameValue: FRAME,
      depsValue: deps({ createCanvas: () => null }),
      code: 'no-canvas',
    },
    {
      frameValue: FRAME,
      depsValue: deps({
        createCanvas: () => {
          throw new Error('canvas blocked')
        },
      }),
      code: 'no-canvas',
    },
    {
      frameValue: FRAME,
      depsValue: deps({ drawFrame: () => false }),
      code: 'draw-failed',
    },
    {
      frameValue: FRAME,
      depsValue: deps({
        drawFrame: () => {
          throw new Error('draw blocked')
        },
      }),
      code: 'draw-failed',
    },
    {
      frameValue: FRAME,
      depsValue: deps({ toBlob: async () => null }),
      code: 'blob-failed',
    },
    {
      frameValue: FRAME,
      depsValue: deps({
        toBlob: async () => {
          throw new Error('toBlob blocked')
        },
      }),
      code: 'blob-failed',
    },
    {
      frameValue: FRAME,
      depsValue: deps({ toBlob: async () => new Blob([]) }),
      code: 'empty-blob',
    },
  ]

  for (const item of cases) {
    const outcome = await capturePhotoBlob(item.frameValue, item.depsValue)

    assert.deepEqual(outcome, { ok: false, code: item.code })
  }
})

test('capture file names are day-first, timestamped and type-aware', () => {
  const now = new Date(2026, 11, 7, 10, 30, 0)

  assert.equal(
    photoCaptureFileName(7, 'image/jpeg', now),
    'foto-dia-07-20261207-103000.jpg',
  )
  assert.equal(
    photoCaptureFileName(24, 'image/png', now),
    'foto-dia-24-20261207-103000.png',
  )
  assert.equal(
    photoCaptureFileName(3, '', now),
    'foto-dia-03-20261207-103000.jpg',
  )
  assert.equal(
    photoCaptureFileName(3, 'image/jpeg', new Date('not-a-date')),
    'foto-dia-03-sin-fecha.jpg',
  )
})
