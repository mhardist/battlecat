import { ExtractedContent, SourceType } from "@/types";

/** Fetch with a timeout (default 20s). Prevents one slow request from eating the 60s budget. */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 20000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

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

  const response = await fetchWithTimeout(jinaUrl, { headers });
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
// TikTok Extraction (cloud API → Deepgram transcription)
// ---------------------------------------------------------------------------

/**
 * Extract spoken words from a TikTok video.
 *
 * Pipeline:
 * 1. tikwm.com API returns direct video/audio stream URLs
 * 2. Deepgram Nova-3 transcribes the audio from the stream URL
 *
 * No local binaries needed — works on Vercel serverless.
 * Requires: DEEPGRAM_API_KEY env var
 */
async function extractTikTok(url: string): Promise<string> {
  // Strategy 1: tikwm API → Deepgram
  try {
    const videoInfo = await getTikTokVideoInfo(url);
    const streamUrl = videoInfo.hdplay || videoInfo.play;

    if (streamUrl) {
      const transcript = await transcribeWithDeepgram(
        streamUrl.startsWith("http") ? streamUrl : `https://www.tikwm.com${streamUrl}`
      );

      if (transcript && transcript.trim().length > 20) {
        const title = videoInfo.title || "";
        const author = videoInfo.author?.nickname || "";
        const header = [title && `Title: ${title}`, author && `Author: ${author}`]
          .filter(Boolean)
          .join("\n");

        return `[TikTok Transcription]\n${header}\n\n${transcript}`;
      }
    }
  } catch (err) {
    console.error("TikTok tikwm strategy failed:", err);
  }

  // Strategy 2: Jina Reader for page content (descriptions, comments)
  try {
    const text = await extractArticle(url);
    if (text && text.trim().length > 50) {
      return `[TikTok Page Content]\n\n${text}`;
    }
  } catch {
    // Jina failed
  }

  throw new Error(
    "Could not extract TikTok content. The video may be private or unavailable."
  );
}

/** Fetch TikTok video metadata and stream URLs via tikwm.com API */
async function getTikTokVideoInfo(
  url: string
): Promise<{
  title?: string;
  play?: string;
  hdplay?: string;
  music?: string;
  author?: { nickname?: string };
}> {
  const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
  const response = await fetchWithTimeout(apiUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`tikwm API request failed: ${response.status}`);
  }

  const json = await response.json();

  if (json.code !== 0 || !json.data) {
    throw new Error(`tikwm API error: ${json.msg || "unknown"}`);
  }

  return json.data;
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
 * 1. youtube-transcript package (YouTube's internal transcript API)
 * 2. Jina Reader page content as fallback
 *
 * No local binaries needed — works on Vercel serverless.
 */
async function extractYouTube(url: string): Promise<string> {
  const normalizedUrl = normalizeYouTubeUrl(url);
  const videoId = extractYouTubeVideoId(normalizedUrl);

  // Strategy 1: YouTube transcript API
  if (videoId) {
    try {
      const { YoutubeTranscript } = await import("youtube-transcript");
      const segments = await YoutubeTranscript.fetchTranscript(videoId);

      if (segments && segments.length > 0) {
        const text = segments.map((s) => s.text).join(" ");
        if (text.trim().length > 50) {
          return `[YouTube Transcript]\n\n${text}`;
        }
      }
    } catch (err) {
      console.error("YouTube transcript fetch failed:", err);
    }
  }

  // Strategy 2: Jina Reader page content
  try {
    const text = await extractArticle(normalizedUrl);
    if (text && text.trim().length > 100) {
      return `[YouTube Page Content]\n\n${text}`;
    }
  } catch {
    // all strategies failed
  }

  throw new Error(
    "Could not extract YouTube content. The video may not have " +
    "transcripts available and page content was insufficient."
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

/** Extract YouTube video ID from a normalized URL */
function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// PDF Extraction
// ---------------------------------------------------------------------------

/**
 * Extract text from a PDF URL.
 * Downloads the file and parses with pdf-parse v2 (PDFParse class).
 */
async function extractPdf(url: string): Promise<string> {
  const response = await fetchWithTimeout(url, {}, 25000);
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
