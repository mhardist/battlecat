import Anthropic from '@anthropic-ai/sdk'

const AUDIO_SCRIPT_PROMPT = `You are an expert at converting written technical tutorials into spoken audio scripts.

Rewrite the following tutorial body into a script suitable for spoken audio delivery. Follow these rules strictly:

1. Rewrite all content for spoken delivery — use a natural, conversational tone as if explaining to a listener.
2. Describe code in plain language. Never read code syntax aloud. Instead of reading "const [count, setCount] = useState(0)", say something like "You create a counter variable and a setter function using the useState hook, starting at zero."
3. Remove all visual references (e.g., "see the diagram above", "as shown below", "in the screenshot").
4. Convert tables into natural language. Instead of rendering a table, describe the information conversationally (e.g., "The useState hook is used for managing local state, while useEffect handles side effects.").
5. Remove steps that are code-only with no educational explanation. If a step is purely "paste this code", skip it.
6. Preserve all educational content — explanations, concepts, reasoning, and context must be retained.
7. Output clean prose paragraphs only. No markdown, no headers, no bullet points, no numbered lists, no code blocks, no backticks, no braces, no special formatting.

Return ONLY the spoken script text. No preamble, no meta-commentary.`

/**
 * Generates a spoken audio script from a tutorial body using Claude AI.
 * Fulfills AUD-1 (script generation) and AUD-1b (graceful error handling).
 * Returns null if generation fails for any reason (API error, timeout, rate limit).
 */
export async function generateAudioScript(body: string): Promise<string | null> {
  try {
    const client = new Anthropic()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${AUDIO_SCRIPT_PROMPT}\n\n---\n\n${body}`,
        },
      ],
    })

    const textBlock = response.content.find(
      (block: { type: string }) => block.type === 'text'
    )

    if (!textBlock || textBlock.type !== 'text') {
      return null
    }

    const script = (textBlock as { type: 'text'; text: string }).text.trim()

    return script.length > 0 ? script : null
  } catch {
    // AUD-1b: Never throw on failure — return null for API errors, timeouts, rate limits
    return null
  }
}

/**
 * Splits text into chunks at sentence boundaries, keeping each chunk
 * under maxChars (default 1900) to stay within Deepgram's 2000 char limit.
 *
 * Splitting strategy:
 * 1. Split input into sentences at ". ", "! ", "? ", ".\n" boundaries.
 * 2. Greedily pack sentences into chunks without exceeding maxChars.
 * 3. If a single sentence exceeds maxChars, fall back to splitting at the
 *    last word boundary before maxChars.
 */
export function chunkText(text: string, maxChars: number = 1900): string[] {
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return []
  }

  // Split text into sentences. We keep the delimiter (., !, ?) with the
  // preceding sentence and discard the trailing space/newline separator.
  // Pattern matches: ". " or "! " or "? " or ".\n"
  const sentences: string[] = []
  let remaining = trimmed

  while (remaining.length > 0) {
    // Find the earliest sentence boundary
    const boundaryPattern = /(\. |\! |\? |\.\n)/
    const match = boundaryPattern.exec(remaining)

    if (match && match.index !== undefined) {
      // Include the punctuation mark but not the trailing space/newline
      const endIndex = match.index + 1 // include the punctuation char
      const sentence = remaining.slice(0, endIndex).trim()
      if (sentence.length > 0) {
        sentences.push(sentence)
      }
      // Skip past the full delimiter (punctuation + space/newline)
      remaining = remaining.slice(match.index + match[0].length)
    } else {
      // No more sentence boundaries -- rest is the last sentence
      const last = remaining.trim()
      if (last.length > 0) {
        sentences.push(last)
      }
      break
    }
  }

  // Now pack sentences into chunks under maxChars
  const chunks: string[] = []

  for (const sentence of sentences) {
    if (sentence.length <= maxChars) {
      // Try to append to the current (last) chunk
      if (chunks.length === 0) {
        chunks.push(sentence)
      } else {
        const combined = chunks[chunks.length - 1] + ' ' + sentence
        if (combined.length <= maxChars) {
          chunks[chunks.length - 1] = combined
        } else {
          chunks.push(sentence)
        }
      }
    } else {
      // Single sentence exceeds maxChars -- split at word boundaries
      const words = sentence.split(' ')
      let currentPart = ''

      for (const word of words) {
        if (currentPart.length === 0) {
          currentPart = word
        } else {
          const candidate = currentPart + ' ' + word
          if (candidate.length <= maxChars) {
            currentPart = candidate
          } else {
            // Push what we have and start a new part
            if (currentPart.trim().length > 0) {
              chunks.push(currentPart.trim())
            }
            currentPart = word
          }
        }
      }

      // Don't forget the last part
      if (currentPart.trim().length > 0) {
        chunks.push(currentPart.trim())
      }
    }
  }

  return chunks
}

/**
 * Sanitizes AI-generated script text for audio narration.
 * Post-AI regex safety net that removes URLs, code blocks, image refs,
 * table markup, HTML tags, horizontal rules, decodes HTML entities,
 * and normalizes whitespace.
 */
export function sanitizeScriptText(text: string): string {
  if (!text) return ''

  let result = text

  // SAN-2: Remove fenced code blocks (must be before inline backtick removal)
  // Matches ```optional-lang\n...content...\n```
  result = result.replace(/```[\s\S]*?```/g, '')

  // SAN-3: Remove markdown image references ![alt](url)
  result = result.replace(/!\[[^\]]*\]\([^)]*\)/g, '')

  // SAN-7: Strip HTML tags (replace with a space to avoid words merging)
  // Must happen before URL removal so URLs inside tag attributes don't leak
  result = result.replace(/<[^>]+>/g, ' ')

  // SAN-1: Remove URLs (http:// and https://)
  result = result.replace(/https?:\/\/[^\s)]+/g, '')

  // SAN-2: Remove inline code backticks (preserve inner text)
  result = result.replace(/`([^`]*)`/g, '$1')

  // SAN-8: Remove horizontal rules (---, ***, ___, or longer variants)
  // Must be on their own line
  result = result.replace(/^([-]{3,}|[*]{3,}|[_]{3,})$/gm, '')

  // SAN-4: Remove table header separator lines (|---|---|, |:---:|---:|, etc.)
  result = result.replace(/^\|[\s:]*-+[\s:]*(\|[\s:]*-+[\s:]*)*\|?\s*$/gm, '')

  // SAN-4: Remove pipe characters from table rows
  result = result.replace(/\|/g, '')

  // SAN-6: Decode HTML entities
  result = result.replace(/&amp;/g, '&')
  result = result.replace(/&lt;/g, '<')
  result = result.replace(/&gt;/g, '>')
  result = result.replace(/&quot;/g, '"')
  result = result.replace(/&#39;/g, "'")

  // SAN-5: Normalize line breaks (\r\n -> \n)
  result = result.replace(/\r\n/g, '\n')

  // SAN-5: Collapse multiple spaces on each line into a single space
  result = result.replace(/[^\S\n]+/g, ' ')

  // Trim each line individually
  result = result
    .split('\n')
    .map((line) => line.trim())
    .join('\n')

  // SAN-5: Collapse multiple newlines into a single newline
  result = result.replace(/\n{2,}/g, '\n')

  // SAN-5: Trim leading and trailing whitespace
  result = result.trim()

  return result
}

/**
 * Strips ID3v2 headers from an MP3 buffer.
 * ID3v2 headers start with "ID3" (0x49 0x44 0x33).
 * The header size is encoded in bytes 6-9 as a synchsafe integer (4 x 7-bit).
 * Returns the buffer starting from the first byte after the ID3 header,
 * or the original buffer if no ID3 header is found.
 */
function stripId3Header(buf: Buffer): Buffer {
  // Check for ID3v2 tag: starts with "ID3"
  if (buf.length >= 10 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    // ID3v2 header is 10 bytes: "ID3" (3) + version (2) + flags (1) + size (4)
    // Size is a synchsafe integer (each byte uses 7 bits)
    const size =
      ((buf[6] & 0x7f) << 21) |
      ((buf[7] & 0x7f) << 14) |
      ((buf[8] & 0x7f) << 7) |
      (buf[9] & 0x7f)
    const headerEnd = 10 + size
    if (headerEnd <= buf.length) {
      return buf.subarray(headerEnd)
    }
  }
  return buf
}

/**
 * Full audio generation pipeline for a tutorial.
 *
 * Pipeline:
 * 1. Check AUDIO_ENABLED env var (AUD-10)
 * 2. Generate spoken script via Claude AI (AUD-1)
 * 3. Sanitize script text (AUD-1c)
 * 4. Skip if sanitized script < 50 chars (AUD-12)
 * 5. Chunk text at sentence boundaries (AUD-3)
 * 6. Send chunks to Deepgram Aura-2 TTS (AUD-4)
 * 7. Strip MP3 headers from chunks 2+ (AUD-5b)
 * 8. Concatenate MP3 buffers (AUD-5)
 * 9. Upload to Supabase Storage (AUD-6)
 * 10. Return public URL (AUD-7)
 *
 * Returns null on any failure (AUD-8). Never throws.
 * Uses 20-second timeout via Promise.race (PIP-4).
 */
export async function generateTutorialAudio(
  body: string,
  slug: string
): Promise<string | null> {
  // PIP-4: 20-second timeout via Promise.race
  const TIMEOUT_MS = 20_000
  let timedOut = false
  let timerId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<null>((resolve) => {
    timerId = setTimeout(() => {
      timedOut = true
      resolve(null)
    }, TIMEOUT_MS)
  })

  const pipelinePromise = runAudioPipeline(body, slug)

  const result = await Promise.race([pipelinePromise, timeoutPromise])

  // Clean up the timer if the pipeline finished first
  if (timerId !== undefined) {
    clearTimeout(timerId)
  }

  if (timedOut) {
    console.error('[audio] Pipeline timed out after 20 seconds', { slug })
  }

  return result
}

async function runAudioPipeline(
  body: string,
  slug: string
): Promise<string | null> {
  try {
    // AUD-10: Skip when AUDIO_ENABLED !== "true"
    if (process.env.AUDIO_ENABLED !== 'true') {
      console.log('[audio] skip: AUDIO_ENABLED is not set to true')
      return null
    }

    // Step 1: Generate spoken script via Claude AI
    const rawScript = await generateAudioScript(body)
    if (!rawScript) {
      console.error('[audio] Failed to generate audio script', { slug })
      return null
    }

    // Step 2: Sanitize script text (AUD-1c)
    const script = sanitizeScriptText(rawScript)

    // Step 3: AUD-12 — Skip if sanitized script < 50 chars
    if (script.length < 50) {
      console.log('[audio] skip: sanitized script too short', {
        slug,
        length: script.length,
      })
      return null
    }

    // Step 4: Chunk text at sentence boundaries
    const chunks = chunkText(script)

    // Step 5: Send chunks to Deepgram Aura-2 TTS (AUD-4)
    const { createClient } = await import('@deepgram/sdk')
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!)

    const audioBuffers: Buffer[] = []

    for (let i = 0; i < chunks.length; i++) {
      const response = await deepgram.speak.request(
        { text: chunks[i] },
        {
          model: 'aura-2-athena-en',
          encoding: 'mp3',
        }
      )

      const stream = await response.getStream()
      if (!stream) {
        console.error('[audio] No stream returned from Deepgram for chunk', {
          slug,
          chunkIndex: i,
        })
        return null
      }

      // Collect stream chunks into a buffer
      const streamChunks: Uint8Array[] = []
      const reader = stream.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) streamChunks.push(value)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let chunkBuffer: Buffer = Buffer.concat(streamChunks) as any

      // AUD-5b: Strip MP3 headers/ID3 tags from chunks 2+
      if (i > 0) {
        chunkBuffer = stripId3Header(chunkBuffer)
      }

      audioBuffers.push(chunkBuffer)
    }

    // AUD-5: Concatenate MP3 buffers from all chunks
    const finalAudio = Buffer.concat(audioBuffers)

    // AUD-6: Upload to Supabase Storage at tutorials/{slug}-{timestamp}.mp3
    const { createServerClient } = await import('@/lib/supabase')
    const supabase = createServerClient()
    const timestamp = Date.now()
    const filePath = `tutorials/${slug}-${timestamp}.mp3`

    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(filePath, finalAudio, {
        contentType: 'audio/mpeg',
      })

    if (uploadError) {
      console.error('[audio] Supabase upload failed', uploadError)
      return null
    }

    // AUD-7: Get and return public URL
    const { data: urlData } = supabase.storage
      .from('audio')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // AUD-11: Log structured outcome on success
    console.log('[audio] success: audio generated and uploaded', {
      slug,
      url: publicUrl,
      chunks: chunks.length,
      sizeBytes: finalAudio.length,
    })

    return publicUrl
  } catch (err) {
    // AUD-8 & AUD-9: Never throw, log errors with [audio] prefix
    console.error('[audio] Pipeline failed', err)
    return null
  }
}
