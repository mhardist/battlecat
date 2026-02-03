/**
 * Extract tutorial bodies as plain text for TTS audio generation.
 * Strips HTML tags and normalizes markdown to speech-friendly plain text.
 *
 * Usage: npx tsx scripts/extract-tts-bodies.ts
 * Output: src/data/tts/ directory with one .txt file per tutorial
 */

import { SEED_TUTORIALS } from "../src/data/seed-tutorials";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const OUTPUT_DIR = join(__dirname, "../src/data/tts");

function stripHtmlAndMarkdown(html: string): string {
  let text = html;

  // Replace heading tags with the text + period (for natural TTS pauses)
  text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n$1.\n");

  // Replace markdown headings (## Heading) with text + period
  text = text.replace(/^#{1,6}\s+(.+)$/gm, "\n$1.\n");

  // Replace <li> with "- " prefix for readability, then strip the tag
  text = text.replace(/<li[^>]*>/gi, "- ");
  text = text.replace(/<\/li>/gi, "\n");

  // Replace <strong> / <b> with just the inner text
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "$1");
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, "$1");

  // Replace <em> / <i> with just the inner text
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, "$1");
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, "$1");

  // Replace <p> with newlines
  text = text.replace(/<p[^>]*>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n");

  // Replace <br> with newlines
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // Remove ordered/unordered list wrappers
  text = text.replace(/<\/?[ou]l[^>]*>/gi, "\n");

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");

  // Strip markdown bold/italic markers
  text = text.replace(/\*\*(.+?)\*\*/g, "$1");
  text = text.replace(/\*(.+?)\*/g, "$1");
  text = text.replace(/__(.+?)__/g, "$1");
  text = text.replace(/_(.+?)_/g, "$1");

  // Strip markdown blockquotes
  text = text.replace(/^>\s*/gm, "");

  // Strip markdown horizontal rules
  text = text.replace(/^---+$/gm, "");

  // Strip markdown code blocks (fenced with ```)
  text = text.replace(/```[\s\S]*?```/g, "");

  // Strip markdown inline code backticks
  text = text.replace(/`([^`]*)`/g, "$1");

  // Strip any remaining stray backticks
  text = text.replace(/`/g, "");

  // Strip markdown links, keep text: [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Strip markdown unordered list markers that came from markdown (not HTML)
  text = text.replace(/^[-*]\s+/gm, "- ");

  // Strip numbered list markers and replace with dash
  text = text.replace(/^\d+\.\s+/gm, "- ");

  // Fix double punctuation from headings ending in : or . getting a period appended
  text = text.replace(/([:.!?])\.\n/g, "$1\n");

  // Collapse multiple blank lines into at most two
  text = text.replace(/\n{3,}/g, "\n\n");

  // Trim leading/trailing whitespace from each line
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // Trim overall
  text = text.trim();

  return text;
}

// Create output directory
mkdirSync(OUTPUT_DIR, { recursive: true });

for (const tutorial of SEED_TUTORIALS) {
  const plainText = stripHtmlAndMarkdown(tutorial.body);

  // Build TTS-friendly output with title as intro
  const ttsContent = `${tutorial.title}\n\n${tutorial.summary}\n\n${plainText}`;

  const filename = `${tutorial.slug}.txt`;
  const filepath = join(OUTPUT_DIR, filename);
  writeFileSync(filepath, ttsContent, "utf-8");

  console.log(`✓ ${filename} (${ttsContent.length} chars)`);
}

console.log(`\nDone. ${SEED_TUTORIALS.length} files written to ${OUTPUT_DIR}`);
