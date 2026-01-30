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

/** Extract content from an article URL using Jina Reader */
async function extractArticle(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const response = await fetch(jinaUrl, {
    headers: { Accept: "text/plain" },
  });
  if (!response.ok) {
    throw new Error(`Jina Reader failed: ${response.status}`);
  }
  return response.text();
}

/** Extract transcript from a TikTok video via Whisper */
async function extractTikTok(_url: string): Promise<string> {
  // Phase 2.2: yt-dlp download audio → Whisper API transcription
  // For now, return a placeholder that indicates this needs implementation
  // with a server-side process (yt-dlp + OpenAI Whisper)
  throw new Error("TikTok extraction requires server-side yt-dlp + Whisper setup");
}

/** Extract a tweet or thread */
async function extractTweet(_url: string): Promise<string> {
  // Phase 2.3: Twitter/X API or scraping service
  throw new Error("Tweet extraction requires Twitter API setup");
}

/** Extract YouTube transcript */
async function extractYouTube(_url: string): Promise<string> {
  // Phase 2.4: yt-dlp transcript extraction
  throw new Error("YouTube extraction requires yt-dlp setup");
}

/** Extract text from a PDF */
async function extractPdf(_url: string): Promise<string> {
  // Phase 2.4: pdf-parse integration
  throw new Error("PDF extraction requires pdf-parse setup");
}

/** Extract LinkedIn post content */
async function extractLinkedIn(_url: string): Promise<string> {
  // Phase 2.4: best-effort scrape
  throw new Error("LinkedIn extraction requires scraping setup");
}

/**
 * Extract content from a URL based on its detected source type.
 * Returns the extracted text and metadata.
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
    title: null, // AI processing will generate the title
    raw_text: rawText,
    author: null,
    published_at: null,
    metadata: {},
  };
}
