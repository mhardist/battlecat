import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Supabase mock ──────────────────────────────────────────────────────────
// Build a chainable mock that tracks every .update() call so we can inspect
// what fields were persisted for each table.

const updateCalls: Array<{ table: string; payload: Record<string, unknown>; eqId: string }> = []

function makeChain() {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.overlaps = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null })
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  return chain
}

/** Per-table overrides keyed by table name */
const tableOverrides: Record<string, Record<string, unknown>> = {}

function resetTableOverrides() {
  for (const key of Object.keys(tableOverrides)) {
    delete tableOverrides[key]
  }
}

const mockSupabase = {
  from: vi.fn().mockImplementation((table: string) => {
    const chain = makeChain()

    // Track update calls
    const origUpdate = chain.update as (...args: unknown[]) => unknown
    chain.update = vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      const innerChain = makeChain()
      innerChain.eq = vi.fn().mockImplementation((_col: string, id: string) => {
        updateCalls.push({ table, payload, eqId: id })
        return innerChain
      })
      origUpdate(payload)
      return innerChain
    })

    // Track insert calls
    const origInsert = chain.insert as (...args: unknown[]) => unknown
    chain.insert = vi.fn().mockImplementation((payload: unknown) => {
      origInsert(payload)
      const innerChain = makeChain()
      // For tutorials table, return an id
      if (table === 'tutorials') {
        ;(innerChain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { id: 'new-tutorial-id' },
          error: null,
        })
      }
      return innerChain
    })

    // Apply table-specific overrides
    if (tableOverrides[table]) {
      for (const [method, value] of Object.entries(tableOverrides[table])) {
        ;(chain as Record<string, unknown>)[method] = value
      }
    }

    return chain
  }),
}

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => mockSupabase,
}))

// ─── extractContent mock ─────────────────────────────────────────────────────
const mockExtractContent = vi.fn()
vi.mock('@/lib/extract', () => ({
  extractContent: (...args: unknown[]) => mockExtractContent(...args),
}))

// ─── AI mocks ────────────────────────────────────────────────────────────────
const mockGenerateTutorial = vi.fn()
const mockMergeTutorial = vi.fn()
const mockGenerateHotNewsBlurb = vi.fn()

vi.mock('@/lib/ai', () => ({
  generateTutorial: (...args: unknown[]) => mockGenerateTutorial(...args),
  mergeTutorial: (...args: unknown[]) => mockMergeTutorial(...args),
  generateHotNewsBlurb: (...args: unknown[]) => mockGenerateHotNewsBlurb(...args),
}))

// ─── Image generation mock ───────────────────────────────────────────────────
const mockGenerateTutorialImage = vi.fn()
vi.mock('@/lib/generate-image', () => ({
  generateTutorialImage: (...args: unknown[]) => mockGenerateTutorialImage(...args),
}))

// ─── Audio generation mock ───────────────────────────────────────────────────
const mockGenerateTutorialAudio = vi.fn()
vi.mock('@/lib/generate-audio', () => ({
  generateTutorialAudio: (...args: unknown[]) => mockGenerateTutorialAudio(...args),
}))

// ─── Import the function under test ──────────────────────────────────────────
import { processSubmission } from '@/lib/process-submission'

// ─── Test fixtures ───────────────────────────────────────────────────────────
const SUBMISSION_ID = 'sub-123'

const fakeSubmission = {
  id: SUBMISSION_ID,
  url: 'https://example.com/article',
  source_type: 'article',
  phone_number: '+1234567890',
  raw_message: 'https://example.com/article',
  status: 'received',
  created_at: '2025-01-01T00:00:00Z',
}

const fakeGenerated = {
  title: 'React Hooks Guide',
  slug: 'react-hooks-guide',
  summary: 'Learn about React hooks and state management.',
  body: '## Introduction\n\nReact hooks are a powerful feature for managing state in function components.',
  action_items: ['Try useState', 'Learn useEffect'],
  classification: {
    maturity_level: 1 as const,
    level_relation: 'level-practice' as const,
    topics: ['react', 'hooks'],
    tags: ['react', 'frontend'],
    tools_mentioned: ['React'],
    difficulty: 'beginner' as const,
  },
}

const fakeExtracted = {
  submission_id: SUBMISSION_ID,
  source_type: 'article' as const,
  url: 'https://example.com/article',
  title: 'React Hooks',
  raw_text: 'React hooks are great for state management...',
  author: null,
  published_at: null,
  metadata: {},
}

// ─── Setup ───────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
  updateCalls.length = 0
  resetTableOverrides()

  // Default: submission fetch succeeds
  // We need the first .from('submissions').select('*').eq('id', ...).single() to return the submission
  mockSupabase.from.mockImplementation((table: string) => {
    const chain = makeChain()

    // Track update calls
    chain.update = vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      const innerChain = makeChain()
      const origEq = innerChain.eq as ReturnType<typeof vi.fn>
      innerChain.eq = vi.fn().mockImplementation((_col: string, id: string) => {
        updateCalls.push({ table, payload, eqId: id })
        return innerChain
      })
      return innerChain
    })

    // Insert for tutorials
    chain.insert = vi.fn().mockImplementation(() => {
      const innerChain = makeChain()
      if (table === 'tutorials') {
        ;(innerChain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { id: 'new-tutorial-id' },
          error: null,
        })
      }
      return innerChain
    })

    // For submissions initial fetch: select -> eq -> single returns submission
    if (table === 'submissions') {
      ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: fakeSubmission,
        error: null,
      })
    }

    // For tutorials: maybeSingle returns null (no existing tutorial = new tutorial path)
    if (table === 'tutorials') {
      ;(chain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      })
    }

    return chain
  })

  // Default mocks for pipeline stages
  mockExtractContent.mockResolvedValue(fakeExtracted)
  mockGenerateTutorial.mockResolvedValue(fakeGenerated)
  mockGenerateTutorialImage.mockResolvedValue('https://images.example.com/hero.png')
  mockGenerateTutorialAudio.mockResolvedValue('https://storage.supabase.co/audio/react-hooks-guide-123.mp3')
  mockMergeTutorial.mockResolvedValue({
    body: 'merged body content',
    summary: 'merged summary',
    action_items: ['merged action 1'],
  })
  mockGenerateHotNewsBlurb.mockResolvedValue({
    headline: 'Breaking News',
    teaser: 'Something happened',
  })
})

// ─── PIP-1: Audio and image run in parallel via Promise.all ──────────────────
describe('PIP-1: Audio and image run in parallel via Promise.all', () => {
  it('calls generateTutorialAudio with body and slug for new tutorials', async () => {
    await processSubmission(SUBMISSION_ID)

    expect(mockGenerateTutorialAudio).toHaveBeenCalledTimes(1)
    expect(mockGenerateTutorialAudio).toHaveBeenCalledWith(
      fakeGenerated.body,
      fakeGenerated.slug
    )
  })

  it('calls both image and audio generation (parallel execution)', async () => {
    // Track the order of calls to verify they start concurrently
    const callOrder: string[] = []

    mockGenerateTutorialImage.mockImplementation(async () => {
      callOrder.push('image-start')
      // Simulate async work
      await new Promise((r) => setTimeout(r, 10))
      callOrder.push('image-end')
      return 'https://images.example.com/hero.png'
    })

    mockGenerateTutorialAudio.mockImplementation(async () => {
      callOrder.push('audio-start')
      // Simulate async work
      await new Promise((r) => setTimeout(r, 10))
      callOrder.push('audio-end')
      return 'https://storage.supabase.co/audio/test.mp3'
    })

    await processSubmission(SUBMISSION_ID)

    // Both should have been called
    expect(mockGenerateTutorialImage).toHaveBeenCalledTimes(1)
    expect(mockGenerateTutorialAudio).toHaveBeenCalledTimes(1)

    // Both should start before either finishes (proving parallel execution)
    const imageStartIdx = callOrder.indexOf('image-start')
    const audioStartIdx = callOrder.indexOf('audio-start')
    const imageEndIdx = callOrder.indexOf('image-end')
    const audioEndIdx = callOrder.indexOf('audio-end')

    // Both must have started
    expect(imageStartIdx).toBeGreaterThanOrEqual(0)
    expect(audioStartIdx).toBeGreaterThanOrEqual(0)

    // Both should start before either ends (parallel)
    expect(imageStartIdx).toBeLessThan(imageEndIdx)
    expect(audioStartIdx).toBeLessThan(audioEndIdx)

    // The key assertion: both start before either ends
    const firstEnd = Math.min(imageEndIdx, audioEndIdx)
    expect(imageStartIdx).toBeLessThan(firstEnd)
    expect(audioStartIdx).toBeLessThan(firstEnd)
  })
})

// ─── PIP-2: Audio failure is non-blocking ────────────────────────────────────
describe('PIP-2: Audio failure is non-blocking', () => {
  it('tutorial still publishes when audio returns null', async () => {
    mockGenerateTutorialAudio.mockResolvedValue(null)

    const result = await processSubmission(SUBMISSION_ID)

    expect(result.success).toBe(true)
    expect(result.tutorial_id).toBeDefined()
  })

  it('tutorial still publishes when audio throws an error', async () => {
    mockGenerateTutorialAudio.mockRejectedValue(new Error('Audio pipeline crashed'))

    const result = await processSubmission(SUBMISSION_ID)

    expect(result.success).toBe(true)
    expect(result.tutorial_id).toBeDefined()
  })

  it('image_url is still stored even when audio fails', async () => {
    mockGenerateTutorialAudio.mockRejectedValue(new Error('Audio failed'))

    await processSubmission(SUBMISSION_ID)

    // Image should still have been stored
    const imageUpdate = updateCalls.find(
      (c) => c.table === 'tutorials' && c.payload.image_url !== undefined
    )
    expect(imageUpdate).toBeDefined()
    expect(imageUpdate!.payload.image_url).toBe('https://images.example.com/hero.png')
  })
})

// ─── PIP-3: Merged tutorials also get audio regenerated ──────────────────────
describe('PIP-3: Merged tutorials get audio regenerated', () => {
  const existingTutorial = {
    id: 'existing-tutorial-id',
    slug: 'existing-react-tutorial',
    title: 'Existing React Tutorial',
    summary: 'An existing tutorial about React.',
    body: 'Original body content.',
    maturity_level: 1,
    level_relation: 'level-practice',
    topics: ['react', 'hooks'],
    tags: ['react'],
    tools_mentioned: ['React'],
    difficulty: 'beginner',
    action_items: ['Try useState'],
    source_urls: ['https://example.com/original'],
    source_count: 1,
    image_url: null,
    audio_url: 'https://storage.supabase.co/audio/old.mp3',
    is_stale: false,
    is_hot_news: false,
    hot_news_headline: null,
    hot_news_teaser: null,
    is_published: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  }

  beforeEach(() => {
    // Override so tutorials.maybeSingle returns the existing tutorial (merge path)
    mockSupabase.from.mockImplementation((table: string) => {
      const chain = makeChain()

      chain.update = vi.fn().mockImplementation((payload: Record<string, unknown>) => {
        const innerChain = makeChain()
        innerChain.eq = vi.fn().mockImplementation((_col: string, id: string) => {
          updateCalls.push({ table, payload, eqId: id })
          return innerChain
        })
        return innerChain
      })

      chain.insert = vi.fn().mockImplementation(() => {
        const innerChain = makeChain()
        return innerChain
      })

      if (table === 'submissions') {
        ;(chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: fakeSubmission,
          error: null,
        })
      }

      if (table === 'tutorials') {
        ;(chain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: existingTutorial,
          error: null,
        })
      }

      return chain
    })
  })

  it('calls generateTutorialAudio with the merged body and existing slug', async () => {
    await processSubmission(SUBMISSION_ID)

    expect(mockGenerateTutorialAudio).toHaveBeenCalledTimes(1)
    expect(mockGenerateTutorialAudio).toHaveBeenCalledWith(
      'merged body content',
      existingTutorial.slug
    )
  })

  it('stores audio_url on the merged tutorial', async () => {
    await processSubmission(SUBMISSION_ID)

    const audioUpdate = updateCalls.find(
      (c) => c.table === 'tutorials' && c.payload.audio_url !== undefined
    )
    expect(audioUpdate).toBeDefined()
    expect(audioUpdate!.payload.audio_url).toBe(
      'https://storage.supabase.co/audio/react-hooks-guide-123.mp3'
    )
    expect(audioUpdate!.eqId).toBe(existingTutorial.id)
  })
})

// ─── PIP-4: Timing log ──────────────────────────────────────────────────────
describe('PIP-4: Audio generation includes timing log', () => {
  it('logs timing information for audio generation', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await processSubmission(SUBMISSION_ID)

    // Should have a log mentioning audio timing or duration
    const audioTimingLog = logSpy.mock.calls.find((call) => {
      const msg = call.join(' ')
      return msg.includes('[process]') && (msg.includes('audio') || msg.includes('Audio'))
    })
    expect(audioTimingLog).toBeDefined()
  })
})

// ─── PIP-5: Store audio_url on the tutorial row ──────────────────────────────
describe('PIP-5: Store audio_url on tutorial row', () => {
  it('updates the tutorial with audio_url after successful generation', async () => {
    await processSubmission(SUBMISSION_ID)

    const audioUpdate = updateCalls.find(
      (c) => c.table === 'tutorials' && c.payload.audio_url !== undefined
    )
    expect(audioUpdate).toBeDefined()
    expect(audioUpdate!.payload.audio_url).toBe(
      'https://storage.supabase.co/audio/react-hooks-guide-123.mp3'
    )
  })

  it('does NOT update audio_url when audio returns null', async () => {
    mockGenerateTutorialAudio.mockResolvedValue(null)

    await processSubmission(SUBMISSION_ID)

    const audioUpdate = updateCalls.find(
      (c) => c.table === 'tutorials' && c.payload.audio_url !== undefined
    )
    expect(audioUpdate).toBeUndefined()
  })

  it('processSubmission returns success with tutorial_id', async () => {
    const result = await processSubmission(SUBMISSION_ID)

    expect(result.success).toBe(true)
    expect(result.tutorial_id).toBe('new-tutorial-id')
    expect(result.merged).toBe(false)
  })
})
