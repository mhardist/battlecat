import { NextResponse } from "next/server";
import {
  generateAudioScript,
  sanitizeScriptText,
  chunkText,
} from "@/lib/generate-audio";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for batch processing

interface Result {
  slug: string;
  status: "success" | "skipped" | "error";
  detail: string;
  audio_url?: string;
}

/**
 * POST /api/debug/backfill-audio
 *
 * Generates audio for all published tutorials that don't have audio_url set.
 * Processes tutorials sequentially to avoid API rate limits.
 *
 * Optional body: { limit?: number, slug?: string }
 *   - limit: max tutorials to process (default 5)
 *   - slug: process a single specific tutorial
 *
 * Requires AUDIO_ENABLED=true, DEEPGRAM_API_KEY, ANTHROPIC_API_KEY.
 */
export async function POST(request: Request) {
  const results: Result[] = [];

  try {
    // Check required env vars
    if (process.env.AUDIO_ENABLED !== "true") {
      return NextResponse.json(
        { error: "AUDIO_ENABLED is not set to true" },
        { status: 400 }
      );
    }
    if (!process.env.DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: "DEEPGRAM_API_KEY is not configured" },
        { status: 400 }
      );
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const limit = body.limit ?? 5;
    const targetSlug = body.slug ?? null;

    const supabase = createServerClient();

    // Fetch tutorials missing audio
    let query = supabase
      .from("tutorials")
      .select("id, slug, body")
      .eq("is_published", true)
      .is("audio_url", null)
      .order("created_at", { ascending: false });

    if (targetSlug) {
      query = query.eq("slug", targetSlug);
    } else {
      query = query.limit(limit);
    }

    const { data: tutorials, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch tutorials", detail: error.message },
        { status: 500 }
      );
    }

    if (!tutorials || tutorials.length === 0) {
      return NextResponse.json({
        message: "No tutorials found missing audio",
        results: [],
      });
    }

    console.log(
      `[backfill-audio] Processing ${tutorials.length} tutorials`
    );

    for (const tutorial of tutorials) {
      const { slug, body: tutorialBody } = tutorial;
      console.log(`[backfill-audio] Processing: ${slug}`);

      try {
        // Step 1: Generate script via Claude
        const rawScript = await generateAudioScript(tutorialBody);
        if (!rawScript) {
          results.push({
            slug,
            status: "error",
            detail: "Script generation returned null",
          });
          continue;
        }

        // Step 2: Sanitize
        const script = sanitizeScriptText(rawScript);
        if (script.length < 50) {
          results.push({
            slug,
            status: "skipped",
            detail: `Sanitized script too short (${script.length} chars)`,
          });
          continue;
        }

        // Step 3: Chunk text
        const chunks = chunkText(script);

        // Step 4: TTS via Deepgram
        const { createClient } = await import("@deepgram/sdk");
        const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

        const audioBuffers: Buffer[] = [];

        for (let i = 0; i < chunks.length; i++) {
          const response = await deepgram.speak.request(
            { text: chunks[i] },
            {
              model: "aura-2-athena-en",
              encoding: "mp3",
              sample_rate: 24000,
            }
          );

          const stream = await response.getStream();
          if (!stream) {
            throw new Error(`No stream returned for chunk ${i}`);
          }

          const streamChunks: Uint8Array[] = [];
          const reader = stream.getReader();
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) streamChunks.push(value);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let chunkBuffer: Buffer = Buffer.concat(streamChunks) as any;

          // Strip ID3 headers from chunks 2+
          if (i > 0) {
            chunkBuffer = stripId3Header(chunkBuffer);
          }

          audioBuffers.push(chunkBuffer);
        }

        // Step 5: Concatenate
        const finalAudio = Buffer.concat(audioBuffers);

        // Step 6: Upload to Supabase Storage
        const timestamp = Date.now();
        const filePath = `tutorials/${slug}-${timestamp}.mp3`;

        const { error: uploadError } = await supabase.storage
          .from("audio")
          .upload(filePath, finalAudio, {
            contentType: "audio/mpeg",
          });

        if (uploadError) {
          results.push({
            slug,
            status: "error",
            detail: `Upload failed: ${uploadError.message}`,
          });
          continue;
        }

        // Step 7: Get public URL
        const { data: urlData } = supabase.storage
          .from("audio")
          .getPublicUrl(filePath);

        const audioUrl = urlData.publicUrl;

        // Step 8: Update tutorial record
        const { error: updateError } = await supabase
          .from("tutorials")
          .update({ audio_url: audioUrl })
          .eq("id", tutorial.id);

        if (updateError) {
          results.push({
            slug,
            status: "error",
            detail: `DB update failed: ${updateError.message}`,
            audio_url: audioUrl,
          });
          continue;
        }

        results.push({
          slug,
          status: "success",
          detail: `${chunks.length} chunks, ${(finalAudio.length / 1024).toFixed(0)}KB`,
          audio_url: audioUrl,
        });

        console.log(
          `[backfill-audio] ✓ ${slug}: ${chunks.length} chunks, ${(finalAudio.length / 1024).toFixed(0)}KB`
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({ slug, status: "error", detail: message });
        console.error(`[backfill-audio] ✗ ${slug}:`, err);
      }
    }

    const summary = {
      total: tutorials.length,
      success: results.filter((r) => r.status === "success").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      errors: results.filter((r) => r.status === "error").length,
    };

    return NextResponse.json({ summary, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Backfill failed", detail: message },
      { status: 500 }
    );
  }
}

/**
 * Strips ID3v2 headers from an MP3 buffer.
 * Duplicated from generate-audio.ts since it's not exported.
 */
function stripId3Header(buf: Buffer): Buffer {
  if (
    buf.length >= 10 &&
    buf[0] === 0x49 &&
    buf[1] === 0x44 &&
    buf[2] === 0x33
  ) {
    const size =
      ((buf[6] & 0x7f) << 21) |
      ((buf[7] & 0x7f) << 14) |
      ((buf[8] & 0x7f) << 7) |
      (buf[9] & 0x7f);
    const headerEnd = 10 + size;
    if (headerEnd <= buf.length) {
      return buf.subarray(headerEnd);
    }
  }
  return buf;
}
