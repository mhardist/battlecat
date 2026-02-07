import { describe, it, expect, vi, afterEach } from 'vitest'
import type { Tutorial } from '@/types'

// ─── withDevAudio ────────────────────────────────────────────────────────────
describe('withDevAudio', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = originalEnv as string
    vi.resetModules()
  })

  it('injects audio_url as "/api/tts/{slug}" on seed tutorials in dev', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'

    const { withDevAudio } = await import('@/data/seed-tutorials')

    const tutorials = [
      { slug: 'what-is-prompt-engineering', audio_url: null },
      { slug: 'custom-gpts-and-memory', audio_url: null },
    ] as Tutorial[]

    const result = withDevAudio(tutorials)

    expect(result[0].audio_url).toBe('/api/tts/what-is-prompt-engineering')
    expect(result[1].audio_url).toBe('/api/tts/custom-gpts-and-memory')
  })

  it('no-op in production (audio_url remains null)', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'

    const { withDevAudio } = await import('@/data/seed-tutorials')

    const tutorials = [
      { slug: 'what-is-prompt-engineering', audio_url: null },
    ] as Tutorial[]

    const result = withDevAudio(tutorials)

    expect(result[0].audio_url).toBeNull()
  })

  it('does not override existing non-null audio_url', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'

    const { withDevAudio } = await import('@/data/seed-tutorials')

    const tutorials = [
      { slug: 'my-tutorial', audio_url: 'https://cdn.example.com/existing.mp3' },
    ] as Tutorial[]

    const result = withDevAudio(tutorials)

    expect(result[0].audio_url).toBe('https://cdn.example.com/existing.mp3')
  })
})

// ─── /api/tts/[slug] route ──────────────────────────────────────────────────

// Hoisted mock for fs - controlled per-test via mockReadFileSync
const mockReadFileSync = vi.fn()
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    default: { ...actual, readFileSync: mockReadFileSync },
    readFileSync: mockReadFileSync,
  }
})

// Use relative path to avoid Vite bracket issues with @/ alias
const ROUTE_PATH = '../../app/api/tts/[slug]/route'

describe('/api/tts/[slug] route', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = originalEnv as string
    mockReadFileSync.mockReset()
    vi.resetModules()
  })

  it('returns MP3 buffer with Content-Type: audio/mpeg in dev', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'

    const fakeBuffer = Buffer.from('fake-mp3-data')
    mockReadFileSync.mockReturnValue(fakeBuffer)

    const { GET } = await import(ROUTE_PATH)

    const request = new Request('http://localhost:3000/api/tts/what-is-prompt-engineering')
    const response = await GET(request, {
      params: Promise.resolve({ slug: 'what-is-prompt-engineering' }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('audio/mpeg')

    const body = await response.arrayBuffer()
    expect(body.byteLength).toBeGreaterThan(0)
  })

  it('returns 404 when NODE_ENV === "production"', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'

    const { GET } = await import(ROUTE_PATH)

    const request = new Request('http://localhost:3000/api/tts/what-is-prompt-engineering')
    const response = await GET(request, {
      params: Promise.resolve({ slug: 'what-is-prompt-engineering' }),
    })

    expect(response.status).toBe(404)
  })

  it('returns 404 for nonexistent slug', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'

    mockReadFileSync.mockImplementation(() => {
      const err = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException
      err.code = 'ENOENT'
      throw err
    })

    const { GET } = await import(ROUTE_PATH)

    const request = new Request('http://localhost:3000/api/tts/nonexistent-slug')
    const response = await GET(request, {
      params: Promise.resolve({ slug: 'nonexistent-slug' }),
    })

    expect(response.status).toBe(404)
  })
})
