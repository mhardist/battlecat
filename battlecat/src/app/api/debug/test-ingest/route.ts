import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface StageResult {
  stage: string;
  status: "pass" | "fail" | "skip";
  detail: string;
  ms: number;
  data?: unknown;
}

/**
 * POST /api/debug/test-ingest
 *
 * Simulates the full ingestion pipeline synchronously, stage by stage,
 * reporting the result of each step. Unlike /api/ingest, this does NOT
 * use after() — it runs everything inline so you can see exactly where
 * the failure occurs.
 *
 * Body: { url: string, dry_run?: boolean }
 *
 * - dry_run=true (default): Extracts and classifies content, but does NOT
 *   write to the tutorials table. Cleans up the test submission.
 * - dry_run=false: Full pipeline — creates a real tutorial.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, dry_run = true } = body as { url?: string; dry_run?: boolean };

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const stages: StageResult[] = [];
  let submissionId: string | null = null;

  const run = async <T>(
    stage: string,
    fn: () => Promise<T>,
  ): Promise<T | null> => {
    const t0 = Date.now();
    try {
      const result = await fn();
      stages.push({
        stage,
        status: "pass",
        detail: "OK",
        ms: Date.now() - t0,
      });
      return result;
    } catch (err) {
      stages.push({
        stage,
        status: "fail",
        detail: err instanceof Error ? err.message : String(err),
        ms: Date.now() - t0,
      });
      return null;
    }
  };

  // ── Stage 1: Detect source type ─────────────────────────────────────
  const { detectSourceType } = await import("@/lib/extract");
  let sourceType: string;
  try {
    sourceType = detectSourceType(url);
    stages.push({
      stage: "1_detect_source_type",
      status: "pass",
      detail: sourceType,
      ms: 0,
    });
  } catch (err) {
    stages.push({
      stage: "1_detect_source_type",
      status: "fail",
      detail: err instanceof Error ? err.message : String(err),
      ms: 0,
    });
    return NextResponse.json({ stages, completed: false });
  }

  // ── Stage 2: Supabase connection ────────────────────────────────────
  const { createServerClient } = await import("@/lib/supabase");
  const supabase = await run("2_supabase_connect", async () => {
    const client = createServerClient();
    // Quick read to verify connection
    const { error } = await client.from("submissions").select("id").limit(1);
    if (error) throw new Error(`DB query failed: ${error.message}`);
    return client;
  });

  if (!supabase) {
    return NextResponse.json({ stages, completed: false });
  }

  // ── Stage 3: Store submission ───────────────────────────────────────
  const submission = await run("3_store_submission", async () => {
    const { data, error } = await supabase
      .from("submissions")
      .insert({
        phone_number: "__test_ingest__",
        raw_message: `[test-ingest] ${url}`,
        url,
        source_type: sourceType,
        status: "received",
      })
      .select("id")
      .single();

    if (error) throw new Error(`INSERT failed: ${error.message} (code: ${error.code})`);
    submissionId = data.id;
    return data;
  });

  if (!submission) {
    return NextResponse.json({ stages, completed: false });
  }

  // ── Stage 4: Extract content ────────────────────────────────────────
  const { extractContent } = await import("@/lib/extract");
  const extracted = await run("4_extract_content", async () => {
    const result = await extractContent(url, submission.id);
    return {
      source_type: result.source_type,
      text_length: result.raw_text.length,
      text_preview: result.raw_text.slice(0, 300),
    };
  });

  if (!extracted) {
    // Clean up test submission on failure
    if (submissionId) {
      await supabase.from("submissions").delete().eq("id", submissionId);
    }
    return NextResponse.json({ stages, completed: false });
  }

  // ── Stage 5: AI classification ──────────────────────────────────────
  const { classifyContent } = await import("@/lib/ai");
  const classification = await run("5_ai_classify", async () => {
    // Re-extract full text for AI
    const full = await extractContent(url, submission.id);
    return await classifyContent(full.raw_text);
  });

  if (!classification) {
    if (submissionId) {
      await supabase.from("submissions").delete().eq("id", submissionId);
    }
    return NextResponse.json({ stages, completed: false });
  }

  stages[stages.length - 1].data = classification;

  // ── Stage 6: AI tutorial generation ─────────────────────────────────
  if (!dry_run) {
    const { advanceSubmission } = await import("@/lib/pipeline");
    const result = await run("6_full_process", async () => {
      // Delete our test submission, re-insert as real
      await supabase.from("submissions").delete().eq("id", submissionId!);
      const { data: realSub, error } = await supabase
        .from("submissions")
        .insert({
          phone_number: "__test_ingest__",
          raw_message: url,
          url,
          source_type: sourceType,
          status: "received",
        })
        .select("id")
        .single();

      if (error) throw new Error(`Re-insert failed: ${error.message}`);
      submissionId = realSub.id;
      return await advanceSubmission(realSub.id);
    });

    stages[stages.length - 1].data = result;

    return NextResponse.json({
      stages,
      completed: true,
      dry_run: false,
      submission_id: submissionId,
      result,
    });
  }

  // Dry run — clean up and report
  if (submissionId) {
    await supabase.from("submissions").delete().eq("id", submissionId);
    stages.push({
      stage: "cleanup",
      status: "pass",
      detail: "Test submission deleted",
      ms: 0,
    });
  }

  return NextResponse.json({
    stages,
    completed: true,
    dry_run: true,
    classification,
    extracted_preview: extracted,
  });
}
