import { ExtractedContent, SourceType } from "@/types";

/** Detect the source type from a URL */
export function detectSourceType(url: string): SourceType {
  const hostname = new URL(url).hostname.toLowerCase();
  const path = new URL(url).pathname.toLowerCase();

  if (hostname.includes("tiktok.com") || hostname.includes("vm.tiktok.com")) {
    return "tiktok";
  }
  if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
    return "tweet";
  }
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    return "youtube";
  }
  if (hostname.includes("linkedin.com")) {
    return "linkedin";
  }
  if (path.endsWith(".pdf")) {
    return "pdf";
  }
  return "article";
}

// ---------------------------------------------------------------------------
// Article Extraction (Jina Reader)
// ---------------------------------------------------------------------------

/** Extract content from an article URL using Jina Reader */
async function extractArticle(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const headers: Record<string, string> = { Accept: "text/plain" };

  const jinaKey = process.env.JINA_API_KEY;
  if (jinaKey) {
    headers["Authorization"] = `Bearer ${jinaKey}`;
  }

  const response = await fetch(jinaUrl, { headers });
  if (!response.ok) {
    throw new Error(`Jina Reader failed: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  if (!text || text.trim().length < 50) {
    throw new Error("Jina Reader returned insufficient content");
  }
  return text;
}

// ---------------------------------------------------------------------------
// TikTok Extraction (yt-dlp audio → Deepgram transcription)
// ---------------------------------------------------------------------------

/**
 * Extract spoken words from a TikTok video.
 *
 * Pipeline:
 * 1. yt-dlp extracts direct audio stream URL
 * 2. Deepgram Nova transcribes the audio
 *
 * Requires: yt-dlp on the server, DEEPGRAM_API_KEY env var
 */
async function extractTikTok(url: string): Promise<string> {
  const audioUrl = await getAudioUrl(url);
  const transcript = await transcribeWithDeepgram(audioUrl);

  if (!transcript || transcript.trim().length < 20) {
    throw new Error("TikTok transcription returned insufficient content");
  }

  return `[TikTok Transcription]\n\n${transcript}`;
}

/**
 * Use yt-dlp to get the direct audio stream URL from a video page.
 */
async function getAudioUrl(videoUrl: string): Promise<string> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  try {
    // Try audio-only first
    const { stdout } = await execAsync(
      `yt-dlp --no-warnings --no-check-certificates -f "ba" --get-url "${videoUrl}"`,
      { timeout: 30000 }
    );
    const directUrl = stdout.trim();
    if (directUrl) return directUrl;
  } catch {
    // audio-only format not available
  }

  // Fallback: best available format
  const { exec: exec2 } = await import("child_process");
  const execAsync2 = promisify(exec2);
  const { stdout } = await execAsync2(
    `yt-dlp --no-warnings --no-check-certificates --get-url "${videoUrl}"`,
    { timeout: 30000 }
  );
  const directUrl = stdout.trim().split("\n")[0];
  if (!directUrl) {
    throw new Error("yt-dlp could not extract a stream URL");
  }
  return directUrl;
}

/**
 * Transcribe audio via Deepgram Nova.
 * Accepts a direct URL to an audio or video stream.
 */
async function transcribeWithDeepgram(audioUrl: string): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("Missing DEEPGRAM_API_KEY environment variable");
  }

  const { createClient } = await import("@deepgram/sdk");
  const client = createClient(apiKey);

  const { result, error } = await client.listen.prerecorded.transcribeUrl(
    { url: audioUrl },
    {
      model: "nova-3",
      punctuate: true,
      smart_format: true,
      detect_language: true,
    }
  );

  if (error) {
    throw new Error(`Deepgram transcription failed: ${error.message}`);
  }

  const transcript =
    result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

  if (!transcript) {
    throw new Error("Deepgram returned no transcript");
  }

  return transcript;
}

// ---------------------------------------------------------------------------
// Tweet / X Extraction
// ---------------------------------------------------------------------------

/**
 * Extract tweet content.
 *
 * Strategy (priority order):
 * 1. Jina Reader (works for many public tweets)
 * 2. fxtwitter.com proxy (readable open-graph pages)
 */
async function extractTweet(url: string): Promise<string> {
  const normalizedUrl = url.replace("x.com", "twitter.com");

  // Strategy 1: Jina Reader
  try {
    const text = await extractArticle(normalizedUrl);
    if (text && text.trim().length > 50) {
      return `[Tweet]\n\n${text}`;
    }
  } catch {
    // Jina failed, try next
  }

  // Strategy 2: fxtwitter proxy
  try {
    const fxUrl = normalizedUrl.replace("twitter.com", "fxtwitter.com");
    const text = await extractArticle(fxUrl);
    if (text && text.trim().length > 30) {
      return `[Tweet]\n\n${text}`;
    }
  } catch {
    // fxtwitter failed
  }

  throw new Error(
    "Could not extract tweet content. For reliable extraction, " +
    "configure TWITTER_BEARER_TOKEN for the Twitter API v2."
  );
}

// ---------------------------------------------------------------------------
// YouTube Transcript Extraction
// ---------------------------------------------------------------------------

/**
 * Extract YouTube video transcript.
 *
 * Strategy (priority order):
 * 1. yt-dlp subtitles (auto-generated or manual)
 * 2. Audio extraction + Deepgram transcription
 * 3. Jina Reader page content as last resort
 */
async function extractYouTube(url: string): Promise<string> {
  const normalizedUrl = normalizeYouTubeUrl(url);

  // Strategy 1: subtitles via yt-dlp
  try {
    const subtitles = await getYouTubeSubtitles(normalizedUrl);
    if (subtitles && subtitles.trim().length > 50) {
      return `[YouTube Transcript]\n\n${subtitles}`;
    }
  } catch {
    // no subtitles
  }

  // Strategy 2: audio transcription via Deepgram
  try {
    const audioUrl = await getAudioUrl(normalizedUrl);
    const transcript = await transcribeWithDeepgram(audioUrl);
    return `[YouTube Transcription]\n\n${transcript}`;
  } catch {
    // audio extraction failed
  }

  // Strategy 3: Jina Reader page content
  try {
    const text = await extractArticle(normalizedUrl);
    if (text && text.trim().length > 100) {
      return `[YouTube Page Content]\n\n${text}`;
    }
  } catch {
    // all strategies failed
  }

  throw new Error(
    "Could not extract YouTube content. Ensure yt-dlp is installed " +
    "or set DEEPGRAM_API_KEY for audio transcription."
  );
}

/** Normalize YouTube URL variants to standard watch URL */
function normalizeYouTubeUrl(url: string): string {
  const parsed = new URL(url);

  if (parsed.hostname === "youtu.be") {
    const videoId = parsed.pathname.slice(1);
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  if (parsed.pathname.startsWith("/shorts/")) {
    const videoId = parsed.pathname.split("/shorts/")[1];
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
}

/** Get YouTube subtitles via yt-dlp, parsed from VTT format */
async function getYouTubeSubtitles(url: string): Promise<string> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const { readFileSync, unlinkSync, existsSync } = await import("fs");
  const { tmpdir } = await import("os");
  const { join } = await import("path");
  const execAsync = promisify(exec);

  const tmpPath = join(tmpdir(), `bc-yt-${Date.now()}`);

  try {
    await execAsync(
      `yt-dlp --no-warnings --no-check-certificates ` +
      `--write-auto-sub --sub-lang en --sub-format vtt ` +
      `--skip-download -o "${tmpPath}" "${url}"`,
      { timeout: 30000 }
    );

    const vttPath = `${tmpPath}.en.vtt`;
    if (!existsSync(vttPath)) {
      throw new Error("No subtitle file generated");
    }

    const vttContent = readFileSync(vttPath, "utf-8");
    unlinkSync(vttPath);
    return parseVtt(vttContent);
  } catch (err) {
    // Clean up temp files on failure
    try {
      const { existsSync: ex, unlinkSync: ul } = await import("fs");
      const vttPath = `${tmpPath}.en.vtt`;
      if (ex(vttPath)) ul(vttPath);
    } catch { /* ignore cleanup errors */ }
    throw err;
  }
}

/** Parse VTT subtitle format into plain text, deduplicating consecutive lines */
function parseVtt(vtt: string): string {
  const lines = vtt.split("\n");
  const textLines: string[] = [];
  let lastLine = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed === "WEBVTT" ||
      trimmed.includes("-->") ||
      trimmed.startsWith("Kind:") ||
      trimmed.startsWith("Language:") ||
      trimmed.startsWith("NOTE") ||
      /^\d+$/.test(trimmed)
    ) {
      continue;
    }

    const cleaned = trimmed.replace(/<[^>]+>/g, "").trim();
    if (cleaned && cleaned !== lastLine) {
      textLines.push(cleaned);
      lastLine = cleaned;
    }
  }

  return textLines.join(" ");
}

// ---------------------------------------------------------------------------
// PDF Extraction
// ---------------------------------------------------------------------------

/**
 * Extract text from a PDF URL.
 * Downloads the file and parses with pdf-parse v2 (PDFParse class).
 */
async function extractPdf(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data });

  const textResult = await parser.getText();
  const infoResult = await parser.getInfo();
  await parser.destroy();

  if (!textResult.text || textResult.text.trim().length < 50) {
    throw new Error("PDF contained insufficient extractable text");
  }

  const metadata = [
    infoResult.info?.Title && `Title: ${infoResult.info.Title}`,
    infoResult.info?.Author && `Author: ${infoResult.info.Author}`,
    `Pages: ${textResult.total}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `[PDF Document]\n${metadata}\n\n${textResult.text}`;
}

// ---------------------------------------------------------------------------
// LinkedIn Extraction
// ---------------------------------------------------------------------------

/**
 * Extract LinkedIn post/article content.
 *
 * LinkedIn blocks most automated access.
 * Strategy: Jina Reader (works for public articles, sometimes posts).
 * Articles (/pulse/...) are more reliably extractable than posts.
 */
async function extractLinkedIn(url: string): Promise<string> {
  // Jina Reader for public articles
  try {
    const text = await extractArticle(url);
    if (text && text.trim().length > 100) {
      return `[LinkedIn]\n\n${text}`;
    }
  } catch {
    // Jina couldn't access it
  }

  // For articles, try Google cache
  const isArticle = url.includes("/pulse/") || url.includes("/article/");
  if (isArticle) {
    try {
      const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
      const text = await extractArticle(cacheUrl);
      if (text && text.trim().length > 100) {
        return `[LinkedIn Article]\n\n${text}`;
      }
    } catch {
      // cache miss
    }
  }

  throw new Error(
    "LinkedIn blocked content extraction. " +
    "Workaround: copy the post text and paste it as a note when submitting the link."
  );
}

// ---------------------------------------------------------------------------
// Main Extraction Dispatcher
// ---------------------------------------------------------------------------

/**
 * Extract content from a URL based on its detected source type.
 */
export async function extractContent(
  url: string,
  submissionId: string,
): Promise<ExtractedContent> {
  const sourceType = detectSourceType(url);

  const extractors: Record<SourceType, (url: string) => Promise<string>> = {
    article: extractArticle,
    tiktok: extractTikTok,
    tweet: extractTweet,
    youtube: extractYouTube,
    pdf: extractPdf,
    linkedin: extractLinkedIn,
  };

  const rawText = await extractors[sourceType](url);

  return {
    submission_id: submissionId,
    source_type: sourceType,
    url,
    title: null,
    raw_text: rawText,
    author: null,
    published_at: null,
    metadata: {},
  };
}
