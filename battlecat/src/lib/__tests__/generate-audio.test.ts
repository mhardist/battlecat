import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Mock setup for @anthropic-ai/sdk ───────────────────────────────────────
const mockCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = function (this: { messages: { create: typeof mockCreate } }) {
    this.messages = { create: mockCreate }
  }
  return { default: MockAnthropic }
})

import { generateAudioScript, chunkText, sanitizeScriptText } from '@/lib/generate-audio'

// ─── generateAudioScript ────────────────────────────────────────────────────
describe('generateAudioScript', () => {
  const sampleBody = `
## Getting Started with React Hooks

React Hooks let you use state and other React features in function components.

\`\`\`tsx
const [count, setCount] = useState(0);
\`\`\`

| Hook | Purpose |
|------|---------|
| useState | Manage local state |
| useEffect | Side effects |

See the diagram above for the component lifecycle.
`

  beforeEach(() => {
    mockCreate.mockReset()
  })

  it('returns a non-empty script from tutorial body', async () => {
    const fakeScript =
      'React Hooks allow you to manage state and side effects directly inside function components. ' +
      'You can create a counter by declaring a state variable and a function to update it. ' +
      'The useState hook manages local state, while the useEffect hook handles side effects.'

    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: fakeScript }],
    })

    const result = await generateAudioScript(sampleBody)

    expect(result).not.toBeNull()
    expect(typeof result).toBe('string')
    expect(result!.length).toBeGreaterThan(0)
  })

  it('returns null on API failure', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API connection error'))

    const result = await generateAudioScript(sampleBody)

    expect(result).toBeNull()
  })

  it('returns null on timeout', async () => {
    const timeoutError = new Error('Request timed out')
    timeoutError.name = 'APIConnectionTimeoutError'
    mockCreate.mockRejectedValueOnce(timeoutError)

    const result = await generateAudioScript(sampleBody)

    expect(result).toBeNull()
  })

  it('output contains no code syntax (backticks, braces)', async () => {
    const cleanScript =
      'React Hooks allow you to manage state in function components. ' +
      'You declare a counter variable and a setter function using the useState hook.'

    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: cleanScript }],
    })

    const result = await generateAudioScript(sampleBody)

    expect(result).not.toBeNull()
    expect(result).not.toMatch(/`/)
    expect(result).not.toMatch(/[{}]/)
  })

  it('output is clean prose paragraphs', async () => {
    const proseScript =
      'React Hooks let you use state and lifecycle features in function components.\n\n' +
      'The useState hook manages local state while useEffect handles side effects.'

    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: proseScript }],
    })

    const result = await generateAudioScript(sampleBody)

    expect(result).not.toBeNull()
    // Should not contain markdown headers
    expect(result).not.toMatch(/^#+\s/m)
    // Should not contain bullet points
    expect(result).not.toMatch(/^[-*]\s/m)
    // Should not contain markdown tables
    expect(result).not.toMatch(/\|/)
    // Should not contain code blocks
    expect(result).not.toMatch(/```/)
    // Should be non-empty text
    expect(result!.trim().length).toBeGreaterThan(0)
  })
})

// ─── chunkText ───────────────────────────────────────────────────────────────
describe('chunkText', () => {
  it('should return an empty array for empty string input', () => {
    expect(chunkText('')).toEqual([])
  })

  it('should return an empty array for whitespace-only input', () => {
    expect(chunkText('   ')).toEqual([])
  })

  it('should return a single chunk for text under maxChars', () => {
    const text = 'Hello world. This is a test.'
    const result = chunkText(text)
    expect(result).toEqual(['Hello world. This is a test.'])
  })

  it('should split at sentence boundary ". " when text exceeds maxChars', () => {
    const sentence1 = 'A'.repeat(1000) + '. '
    const sentence2 = 'B'.repeat(500) + '.'
    const text = sentence1 + sentence2
    const result = chunkText(text, 1100)
    expect(result).toHaveLength(2)
    expect(result[0]).toBe('A'.repeat(1000) + '.')
    expect(result[1]).toBe('B'.repeat(500) + '.')
  })

  it('should split at sentence boundary "! "', () => {
    const sentence1 = 'A'.repeat(1000) + '! '
    const sentence2 = 'B'.repeat(500) + '.'
    const text = sentence1 + sentence2
    const result = chunkText(text, 1100)
    expect(result).toHaveLength(2)
    expect(result[0]).toBe('A'.repeat(1000) + '!')
    expect(result[1]).toBe('B'.repeat(500) + '.')
  })

  it('should split at sentence boundary "? "', () => {
    const sentence1 = 'A'.repeat(1000) + '? '
    const sentence2 = 'B'.repeat(500) + '.'
    const text = sentence1 + sentence2
    const result = chunkText(text, 1100)
    expect(result).toHaveLength(2)
    expect(result[0]).toBe('A'.repeat(1000) + '?')
    expect(result[1]).toBe('B'.repeat(500) + '.')
  })

  it('should split at sentence boundary ".\\n"', () => {
    const sentence1 = 'A'.repeat(1000) + '.\n'
    const sentence2 = 'B'.repeat(500) + '.'
    const text = sentence1 + sentence2
    const result = chunkText(text, 1100)
    expect(result).toHaveLength(2)
    expect(result[0]).toBe('A'.repeat(1000) + '.')
    expect(result[1]).toBe('B'.repeat(500) + '.')
  })

  it('should keep multiple sentences in one chunk if they fit', () => {
    const text = 'First sentence. Second sentence. Third sentence.'
    const result = chunkText(text, 1900)
    expect(result).toEqual(['First sentence. Second sentence. Third sentence.'])
  })

  it('should handle a single sentence longer than maxChars by splitting at word boundary', () => {
    // Build a long sentence of words that exceeds 50 chars
    const words: string[] = []
    let length = 0
    while (length < 60) {
      words.push('word')
      length += 5 // "word" + space
    }
    const longSentence = words.join(' ') + '.'
    const result = chunkText(longSentence, 50)
    // Every chunk should be at most 50 chars
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(50)
    }
    // All chunks should be non-empty
    for (const chunk of result) {
      expect(chunk.trim().length).toBeGreaterThan(0)
    }
  })

  it('should not split text that is exactly at the maxChars boundary', () => {
    const text = 'A'.repeat(1900)
    const result = chunkText(text, 1900)
    expect(result).toEqual(['A'.repeat(1900)])
  })

  it('should use default maxChars of 1900', () => {
    const text = 'A'.repeat(1900)
    const result = chunkText(text)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe('A'.repeat(1900))
  })

  it('should produce chunks that are all under maxChars for long multi-sentence text', () => {
    // Each sentence is ~200 chars, 10 sentences = ~2000 chars
    const sentence = 'X'.repeat(190) + '. '
    const text = sentence.repeat(10).trim()
    const result = chunkText(text, 500)
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(500)
    }
    expect(result.length).toBeGreaterThan(1)
  })

  it('should trim leading/trailing whitespace from chunks', () => {
    const text = 'First sentence. Second sentence. Third sentence.'
    const result = chunkText(text, 20)
    for (const chunk of result) {
      expect(chunk).toBe(chunk.trim())
    }
  })

  it('should default to 1900 chars which is under Deepgram 2000 char limit', () => {
    // 1950 chars of text with a sentence boundary near 1900
    const part1 = 'W'.repeat(1895) + '. '
    const part2 = 'End.'
    const text = part1 + part2
    const result = chunkText(text)
    // Should split because total > 1900
    expect(result.length).toBe(2)
    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(1900)
    }
  })
})

// ─── sanitizeScriptText ──────────────────────────────────────────────────────
describe('sanitizeScriptText', () => {
  // ── SAN-1: Remove URLs entirely ──────────────────────────────────────
  describe('SAN-1: Remove URLs', () => {
    it('should remove https URLs', () => {
      const input = 'Visit https://example.com for more info.'
      expect(sanitizeScriptText(input)).toBe('Visit for more info.')
    })

    it('should remove http URLs', () => {
      const input = 'Go to http://example.org/path?q=1 now.'
      expect(sanitizeScriptText(input)).toBe('Go to now.')
    })

    it('should remove multiple URLs in one string', () => {
      const input = 'See https://a.com and http://b.com for details.'
      expect(sanitizeScriptText(input)).toBe('See and for details.')
    })

    it('should remove URLs with fragments and query strings', () => {
      const input = 'Check https://example.com/page#section?foo=bar&baz=qux here.'
      expect(sanitizeScriptText(input)).toBe('Check here.')
    })
  })

  // ── SAN-2: Remove code blocks ────────────────────────────────────────
  describe('SAN-2: Remove code blocks', () => {
    it('should remove fenced code blocks', () => {
      const input = 'Before\n```javascript\nconst x = 1;\nconsole.log(x);\n```\nAfter'
      expect(sanitizeScriptText(input)).toBe('Before\nAfter')
    })

    it('should remove fenced code blocks without a language tag', () => {
      const input = 'Before\n```\nsome code\n```\nAfter'
      expect(sanitizeScriptText(input)).toBe('Before\nAfter')
    })

    it('should remove inline code backticks', () => {
      const input = 'Use the `console.log` function to debug.'
      expect(sanitizeScriptText(input)).toBe('Use the console.log function to debug.')
    })

    it('should remove multiple inline code spans', () => {
      const input = 'Both `foo` and `bar` are variables.'
      expect(sanitizeScriptText(input)).toBe('Both foo and bar are variables.')
    })
  })

  // ── SAN-3: Remove image references ───────────────────────────────────
  describe('SAN-3: Remove image references', () => {
    it('should remove markdown image syntax', () => {
      const input = 'Here is an image: ![alt text](https://img.com/pic.png) in the text.'
      expect(sanitizeScriptText(input)).toBe('Here is an image: in the text.')
    })

    it('should remove image references with empty alt text', () => {
      const input = 'Image ![](https://img.com/pic.png) here.'
      expect(sanitizeScriptText(input)).toBe('Image here.')
    })
  })

  // ── SAN-4: Remove markdown table markup ──────────────────────────────
  describe('SAN-4: Remove markdown table markup', () => {
    it('should remove pipe characters from table rows', () => {
      const input = '| Name | Age |\n| Alice | 30 |'
      expect(sanitizeScriptText(input)).toBe('Name Age\nAlice 30')
    })

    it('should remove table header separator lines entirely', () => {
      const input = '| Name | Age |\n|---|---|\n| Alice | 30 |'
      expect(sanitizeScriptText(input)).toBe('Name Age\nAlice 30')
    })

    it('should remove separator lines with colons and dashes', () => {
      const input = '| Col1 | Col2 |\n|:---:|---:|\n| A | B |'
      expect(sanitizeScriptText(input)).toBe('Col1 Col2\nA B')
    })
  })

  // ── SAN-5: Collapse repeated whitespace and normalize line breaks ────
  describe('SAN-5: Collapse whitespace and normalize line breaks', () => {
    it('should collapse multiple spaces into one', () => {
      const input = 'Hello    world'
      expect(sanitizeScriptText(input)).toBe('Hello world')
    })

    it('should collapse multiple newlines into a single newline', () => {
      const input = 'First paragraph\n\n\n\nSecond paragraph'
      expect(sanitizeScriptText(input)).toBe('First paragraph\nSecond paragraph')
    })

    it('should trim leading and trailing whitespace', () => {
      const input = '  Hello world  '
      expect(sanitizeScriptText(input)).toBe('Hello world')
    })

    it('should normalize mixed whitespace (\\r\\n to \\n)', () => {
      const input = 'Line one\r\n\r\nLine two'
      expect(sanitizeScriptText(input)).toBe('Line one\nLine two')
    })
  })

  // ── SAN-6: Decode HTML entities ──────────────────────────────────────
  describe('SAN-6: Decode HTML entities', () => {
    it('should decode &amp; to &', () => {
      const input = 'Tom &amp; Jerry'
      expect(sanitizeScriptText(input)).toBe('Tom & Jerry')
    })

    it('should decode &lt; and &gt;', () => {
      const input = '5 &lt; 10 &gt; 3'
      expect(sanitizeScriptText(input)).toBe('5 < 10 > 3')
    })

    it('should decode &quot; to "', () => {
      const input = 'He said &quot;hello&quot;'
      expect(sanitizeScriptText(input)).toBe('He said "hello"')
    })

    it("should decode &#39; to '", () => {
      const input = "It&#39;s a test"
      expect(sanitizeScriptText(input)).toBe("It's a test")
    })

    it('should decode multiple entities in one string', () => {
      const input = '&lt;div&gt; &amp; &quot;hello&quot; &#39;world&#39;'
      expect(sanitizeScriptText(input)).toBe('<div> & "hello" \'world\'')
    })
  })

  // ── SAN-7: Strip inline HTML tags ────────────────────────────────────
  describe('SAN-7: Strip inline HTML tags', () => {
    it('should remove <br> tags', () => {
      const input = 'Line one<br>Line two'
      expect(sanitizeScriptText(input)).toBe('Line one Line two')
    })

    it('should remove <br/> and <br /> self-closing tags', () => {
      const input = 'A<br/>B<br />C'
      expect(sanitizeScriptText(input)).toBe('A B C')
    })

    it('should remove <strong> and </strong> tags', () => {
      const input = 'This is <strong>bold</strong> text.'
      expect(sanitizeScriptText(input)).toBe('This is bold text.')
    })

    it('should remove <em> tags', () => {
      const input = 'This is <em>italic</em> text.'
      expect(sanitizeScriptText(input)).toBe('This is italic text.')
    })

    it('should remove <p> tags', () => {
      const input = '<p>Paragraph one</p><p>Paragraph two</p>'
      expect(sanitizeScriptText(input)).toBe('Paragraph one Paragraph two')
    })

    it('should remove tags with attributes', () => {
      const input = 'Click <a href="http://example.com">here</a> now.'
      expect(sanitizeScriptText(input)).toBe('Click here now.')
    })
  })

  // ── SAN-8: Remove horizontal rules ──────────────────────────────────
  describe('SAN-8: Remove horizontal rules', () => {
    it('should remove --- horizontal rules', () => {
      const input = 'Above\n---\nBelow'
      expect(sanitizeScriptText(input)).toBe('Above\nBelow')
    })

    it('should remove *** horizontal rules', () => {
      const input = 'Above\n***\nBelow'
      expect(sanitizeScriptText(input)).toBe('Above\nBelow')
    })

    it('should remove ___ horizontal rules', () => {
      const input = 'Above\n___\nBelow'
      expect(sanitizeScriptText(input)).toBe('Above\nBelow')
    })

    it('should remove horizontal rules with extra dashes', () => {
      const input = 'Above\n----------\nBelow'
      expect(sanitizeScriptText(input)).toBe('Above\nBelow')
    })
  })

  // ── Integration: combined sanitization ───────────────────────────────
  describe('Integration: combined sanitization', () => {
    it('should handle a string with multiple issues at once', () => {
      const input = [
        'Welcome to the tutorial!',
        '',
        '![logo](https://example.com/logo.png)',
        '',
        'Visit https://docs.example.com for more info.',
        '',
        '```python',
        'print("hello")',
        '```',
        '',
        'Use `npm install` to set up.',
        '',
        '| Feature | Status |',
        '|---------|--------|',
        '| Auth    | Done   |',
        '',
        '---',
        '',
        'Tom &amp; Jerry are <strong>great</strong>.',
        '',
        '  Extra   spaces   here  ',
      ].join('\n')

      const result = sanitizeScriptText(input)

      // Should not contain URLs
      expect(result).not.toContain('https://')
      expect(result).not.toContain('http://')
      // Should not contain code blocks or backticks
      expect(result).not.toContain('```')
      expect(result).not.toContain('`')
      // Should not contain image syntax
      expect(result).not.toContain('![')
      // Should not contain pipes
      expect(result).not.toContain('|')
      // Should not contain horizontal rule lines
      expect(result).not.toMatch(/^-{3,}$/m)
      // Should not contain HTML tags
      expect(result).not.toContain('<strong>')
      expect(result).not.toContain('</strong>')
      // Should decode entities
      expect(result).toContain('Tom & Jerry')
      // Should not have excessive whitespace
      expect(result).not.toMatch(/\n{2,}/)
      expect(result).not.toMatch(/  +/)
      // Should preserve meaningful content
      expect(result).toContain('Welcome to the tutorial!')
      expect(result).toContain('npm install')
      expect(result).toContain('Feature')
      expect(result).toContain('great')
    })

    it('should return empty string for empty input', () => {
      expect(sanitizeScriptText('')).toBe('')
    })

    it('should return clean text unchanged', () => {
      const input = 'This is perfectly clean text with no issues.'
      expect(sanitizeScriptText(input)).toBe('This is perfectly clean text with no issues.')
    })
  })
})

// ─── Mock setup for @deepgram/sdk ─────────────────────────────────────────────
const mockDeepgramSpeakRequest = vi.fn()

vi.mock('@deepgram/sdk', () => {
  return {
    createClient: () => ({
      speak: {
        request: mockDeepgramSpeakRequest,
      },
    }),
  }
})

// ─── Mock setup for @/lib/supabase ────────────────────────────────────────────
const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}))

import { generateTutorialAudio } from '@/lib/generate-audio'

// ─── generateTutorialAudio ────────────────────────────────────────────────────
describe('generateTutorialAudio', () => {
  const sampleBody = 'This is a tutorial about React hooks and state management with detailed explanations.'
  const sampleSlug = 'react-hooks-tutorial'

  // A script long enough to pass the 50-char minimum
  const validScript =
    'React hooks allow you to manage state and side effects in function components. ' +
    'The useState hook manages local state while useEffect handles side effects. ' +
    'This makes your components cleaner and more reusable.'

  // Helper to build a fake MP3 buffer with an ID3 header
  function makeFakeMp3WithId3(dataContent: number): Buffer {
    // ID3v2 header: "ID3" + version(2 bytes) + flags(1 byte) + size(4 bytes) = 10 bytes
    const id3Header = Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
    const mp3Data = Buffer.from([0xff, 0xfb, dataContent, dataContent])
    return Buffer.concat([id3Header, mp3Data])
  }

  // Helper to build a fake MP3 buffer starting with a sync word (no ID3)
  function makeFakeMp3NoId3(dataContent: number): Buffer {
    return Buffer.from([0xff, 0xfb, dataContent, dataContent])
  }

  // Helper to set up mocks for a successful pipeline run
  function setupSuccessMocks() {
    // generateAudioScript mock (Anthropic)
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: validScript }],
    })

    // Deepgram speak.request mock — returns a response with getStream()
    mockDeepgramSpeakRequest.mockImplementation(async () => {
      const chunk1 = makeFakeMp3WithId3(0x01)
      return {
        getStream: async () => createReadableStreamFromBuffer(chunk1),
      }
    })

    // Supabase upload
    mockUpload.mockResolvedValue({ data: { path: 'tutorials/react-hooks-tutorial-123.mp3' }, error: null })

    // Supabase getPublicUrl
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.supabase.co/tutorials/react-hooks-tutorial-123.mp3' },
    })
  }

  // Helper to create a ReadableStream from a Buffer (web standard streams)
  function createReadableStreamFromBuffer(buf: Buffer): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(buf))
        controller.close()
      },
    })
  }

  beforeEach(() => {
    mockCreate.mockReset()
    mockDeepgramSpeakRequest.mockReset()
    mockUpload.mockReset()
    mockGetPublicUrl.mockReset()
    // Default: AUDIO_ENABLED is "true"
    process.env.AUDIO_ENABLED = 'true'
    process.env.DEEPGRAM_API_KEY = 'test-deepgram-key'
  })

  afterEach(() => {
    delete process.env.AUDIO_ENABLED
    delete process.env.DEEPGRAM_API_KEY
    vi.restoreAllMocks()
  })

  // ── AUD-10: Skip when AUDIO_ENABLED !== "true" ────────────────────────
  describe('AUD-10: AUDIO_ENABLED gate', () => {
    it('returns null when AUDIO_ENABLED is not set', async () => {
      delete process.env.AUDIO_ENABLED
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await generateTutorialAudio(sampleBody, sampleSlug)

      expect(result).toBeNull()
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[audio]'))
      expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/skip/i))
    })

    it('returns null when AUDIO_ENABLED is "false"', async () => {
      process.env.AUDIO_ENABLED = 'false'
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await generateTutorialAudio(sampleBody, sampleSlug)

      expect(result).toBeNull()
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[audio]'))
    })

    it('proceeds when AUDIO_ENABLED is "true"', async () => {
      process.env.AUDIO_ENABLED = 'true'
      setupSuccessMocks()

      const result = await generateTutorialAudio(sampleBody, sampleSlug)

      expect(result).not.toBeNull()
    })
  })

  // ── AUD-12: Skip when script < 50 chars after sanitization ────────────
  describe('AUD-12: Short script skip', () => {
    it('returns null when sanitized script is under 50 characters', async () => {
      const shortScript = 'Short text here.'
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: shortScript }],
      })
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await generateTutorialAudio(sampleBody, sampleSlug)

      expect(result).toBeNull()
      const audioLogCalls = logSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('[audio]')
      )
      expect(audioLogCalls.length).toBeGreaterThan(0)
    })

    it('returns null when sanitized script is exactly 49 characters', async () => {
      // Create a script that is exactly 49 characters after trim
      const script49 = 'A'.repeat(49)
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: script49 }],
      })

      const result = await generateTutorialAudio(sampleBody, sampleSlug)

      expect(result).toBeNull()
    })

    it('proceeds when sanitized script is exactly 50 characters', async () => {
      const script50 = 'A'.repeat(50)
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: script50 }],
      })

      // Single chunk TTS
      mockDeepgramSpeakRequest.mockResolvedValueOnce({
        getStream: async () => createReadableStreamFromBuffer(makeFakeMp3NoId3(0x01)),
      })

      mockUpload.mockResolvedValue({ data: { path: 'tutorials/test.mp3' }, error: null })
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/tutorials/test.mp3' },
      })

      const result = await generateTutorialAudio(sampleBody, sampleSlug)

      expect(result).not.toBeNull()
    })
  })

  // ── AUD-4: Deepgram config ────────────────────────────────────────────
  describe('AUD-4: Deepgram config', () => {
    it('calls Deepgram with model aura-2-athena-en, encoding mp3, sample_rate 24000', async () => {
      setupSuccessMocks()

      await generateTutorialAudio(sampleBody, sampleSlug)

      expect(mockDeepgramSpeakRequest).toHaveBeenCalled()
      const callArgs = mockDeepgramSpeakRequest.mock.calls[0]
      // Second argument is the config options
      const config = callArgs[1]
      expect(config).toMatchObject({
        model: 'aura-2-athena-en',
        encoding: 'mp3',
        sample_rate: 24000,
      })
    })

    it('sends text in the correct format to Deepgram', async () => {
      setupSuccessMocks()

      await generateTutorialAudio(sampleBody, sampleSlug)

      expect(mockDeepgramSpeakRequest).toHaveBeenCalled()
      const callArgs = mockDeepgramSpeakRequest.mock.calls[0]
      // First argument is the text payload
      expect(callArgs[0]).toHaveProperty('text')
      expect(typeof callArgs[0].text).toBe('string')
      expect(callArgs[0].text.length).toBeGreaterThan(0)
    })
  })

  // ── AUD-5: Concatenate MP3 buffers from all chunks ────────────────────
  describe('AUD-5: MP3 buffer concatenation', () => {
    it('concatenates audio buffers from multiple chunks', async () => {
      // Script with two sentences that will chunk
      const twoChunkScript = 'A'.repeat(1800) + '. ' + 'B'.repeat(500) + '.'
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: twoChunkScript }],
      })

      const chunk1Buf = makeFakeMp3WithId3(0x01)
      const chunk2Buf = makeFakeMp3WithId3(0x02)

      let callIndex = 0
      mockDeepgramSpeakRequest.mockImplementation(async () => {
        const buf = callIndex === 0 ? chunk1Buf : chunk2Buf
        callIndex++
        return {
          getStream: async () => createReadableStreamFromBuffer(buf),
        }
      })

      mockUpload.mockResolvedValue({ data: { path: 'tutorials/test.mp3' }, error: null })
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/tutorials/test.mp3' },
      })

      await generateTutorialAudio(sampleBody, sampleSlug)

      // Should have called Deepgram for each chunk
      expect(mockDeepgramSpeakRequest).toHaveBeenCalledTimes(2)

      // Verify upload was called with a buffer
      expect(mockUpload).toHaveBeenCalledTimes(1)
      const uploadArgs = mockUpload.mock.calls[0]
      // The second argument should be the concatenated buffer
      expect(Buffer.isBuffer(uploadArgs[1])).toBe(true)
    })
  })

  // ── AUD-5b: Strips MP3 headers/ID3 tags from chunks 2+ ───────────────
  describe('AUD-5b: Strip MP3 headers from chunks 2+', () => {
    it('keeps first chunk header intact but strips ID3 from subsequent chunks', async () => {
      const twoChunkScript = 'A'.repeat(1800) + '. ' + 'B'.repeat(500) + '.'
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: twoChunkScript }],
      })

      const chunk1Buf = makeFakeMp3WithId3(0x01)
      const chunk2Buf = makeFakeMp3WithId3(0x02)

      let callIndex = 0
      mockDeepgramSpeakRequest.mockImplementation(async () => {
        const buf = callIndex === 0 ? chunk1Buf : chunk2Buf
        callIndex++
        return {
          getStream: async () => createReadableStreamFromBuffer(buf),
        }
      })

      mockUpload.mockResolvedValue({ data: { path: 'tutorials/test.mp3' }, error: null })
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/tutorials/test.mp3' },
      })

      await generateTutorialAudio(sampleBody, sampleSlug)

      const uploadedBuffer: Buffer = mockUpload.mock.calls[0][1]

      // The first chunk should be fully intact (ID3 header + MP3 data)
      // chunk1Buf = 10 bytes ID3 + 4 bytes data = 14 bytes
      // chunk2Buf after stripping ID3 = 4 bytes data only
      // Total: 14 + 4 = 18 bytes
      expect(uploadedBuffer.length).toBe(chunk1Buf.length + (chunk2Buf.length - 10))

      // First 3 bytes should be "ID3" from chunk 1
      expect(uploadedBuffer[0]).toBe(0x49) // 'I'
      expect(uploadedBuffer[1]).toBe(0x44) // 'D'
      expect(uploadedBuffer[2]).toBe(0x33) // '3'

      // After chunk 1 (14 bytes), chunk 2 data should start with MP3 sync bytes
      expect(uploadedBuffer[chunk1Buf.length]).toBe(0xff)
      expect(uploadedBuffer[chunk1Buf.length + 1]).toBe(0xfb)
    })
  })

  // ── AUD-6: Upload to tutorials/{slug}-{timestamp}.mp3 ────────────────
  describe('AUD-6: Supabase upload path', () => {
    it('uploads to tutorials/{slug}-{timestamp}.mp3 path', async () => {
      setupSuccessMocks()

      await generateTutorialAudio(sampleBody, sampleSlug)

      expect(mockUpload).toHaveBeenCalledTimes(1)
      const uploadPath: string = mockUpload.mock.calls[0][0]
      // Path should match tutorials/{slug}-{digits}.mp3
      expect(uploadPath).toMatch(new RegExp(`^tutorials/${sampleSlug}-\\d+\\.mp3$`))
    })

    it('uploads with correct content type', async () => {
      setupSuccessMocks()

      await generateTutorialAudio(sampleBody, sampleSlug)

      const uploadOptions = mockUpload.mock.calls[0][2]
      expect(uploadOptions).toMatchObject({
        contentType: 'audio/mpeg',
      })
    })
  })

  // ── AUD-7: Returns public audio URL ───────────────────────────────────
  describe('AUD-7: Returns public URL', () => {
    it('returns the public URL string on success', async () => {
      setupSuccessMocks()

      const result = await generateTutorialAudio(sampleBody, sampleSlug)

      expect(result).toBe('https://storage.supabase.co/tutorials/react-hooks-tutorial-123.mp3')
      expect(typeof result).toBe('string')
    })
  })

  // ── AUD-8: Returns null on any failure (never throws) ─────────────────
  describe('AUD-8: Returns null on failure, never throws', () => {
    it('returns null when generateAudioScript returns null', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: '' }],
      })

      const result = await generateTutorialAudio(sampleBody, sampleSlug)

      expect(result).toBeNull()
    })

    it('returns null when Deepgram fails', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: validScript }],
      })
      mockDeepgramSpeakRequest.mockRejectedValueOnce(new Error('Deepgram API error'))

      const result = await generateTutorialAudio(sampleBody, sampleSlug)

      expect(result).toBeNull()
    })

    it('returns null when Supabase upload fails', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: validScript }],
      })
      mockDeepgramSpeakRequest.mockResolvedValueOnce({
        getStream: async () => createReadableStreamFromBuffer(makeFakeMp3NoId3(0x01)),
      })
      mockUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } })

      const result = await generateTutorialAudio(sampleBody, sampleSlug)

      expect(result).toBeNull()
    })

    it('never throws even on unexpected errors', async () => {
      mockCreate.mockImplementationOnce(() => {
        throw new Error('Unexpected crash')
      })

      // Should not throw, should return null
      const result = await generateTutorialAudio(sampleBody, sampleSlug)

      expect(result).toBeNull()
    })
  })

  // ── AUD-9: Logs errors with [audio] prefix ────────────────────────────
  describe('AUD-9: Error logging with [audio] prefix', () => {
    it('logs error with [audio] prefix when Deepgram fails', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: validScript }],
      })
      mockDeepgramSpeakRequest.mockRejectedValueOnce(new Error('Deepgram fail'))
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await generateTutorialAudio(sampleBody, sampleSlug)

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[audio]'),
        expect.anything()
      )
    })

    it('logs error with [audio] prefix when upload fails', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: validScript }],
      })
      mockDeepgramSpeakRequest.mockResolvedValueOnce({
        getStream: async () => createReadableStreamFromBuffer(makeFakeMp3NoId3(0x01)),
      })
      mockUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } })
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await generateTutorialAudio(sampleBody, sampleSlug)

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[audio]'),
        expect.anything()
      )
    })
  })

  // ── AUD-11: Logs structured outcome on success ────────────────────────
  describe('AUD-11: Structured success logging', () => {
    it('logs structured outcome with [audio] prefix on success', async () => {
      setupSuccessMocks()
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await generateTutorialAudio(sampleBody, sampleSlug)

      // Should have at least one success log with [audio] prefix
      const audioCalls = logSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('[audio]')
      )
      expect(audioCalls.length).toBeGreaterThan(0)

      // At least one log should mention the URL or success
      const hasSuccessLog = audioCalls.some((call) => {
        const msg = call.join(' ')
        return msg.includes('success') || msg.includes('url') || msg.includes('http') || msg.includes('complete')
      })
      expect(hasSuccessLog).toBe(true)
    })
  })

  // ── PIP-4: 20-second timeout via Promise.race ─────────────────────────
  describe('PIP-4: 20-second timeout', () => {
    it('returns null if the pipeline exceeds 20 seconds', async () => {
      // Mock generateAudioScript to hang for longer than 20 seconds
      mockCreate.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ content: [{ type: 'text', text: validScript }] }), 30000)
          })
      )

      // Use fake timers to fast-forward
      vi.useFakeTimers()
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const resultPromise = generateTutorialAudio(sampleBody, sampleSlug)

      // Fast-forward past the 20-second timeout
      await vi.advanceTimersByTimeAsync(21000)

      const result = await resultPromise

      expect(result).toBeNull()
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[audio]'),
        expect.anything()
      )

      vi.useRealTimers()
    })
  })
})
