import { NextRequest, NextResponse } from "next/server";
import { extractContent } from "@/lib/extract";
import { generateTutorial, mergeTutorial } from "@/lib/ai";

/** Force dynamic — these routes need runtime env vars */
export const dynamic = "force-dynamic";

/**
 * POST /api/process
 *
 * Process a submission: extract content, classify, generate tutorial.
 * Called internally after ingestion (or via cron/queue).
 *
 * Body: { submission_id: string }
 */
export async function POST(request: NextRequest) {
  const { submission_id } = await request.json();

  if (!submission_id) {
    return NextResponse.json({ error: "Missing submission_id" }, { status: 400 });
  }

  const { createServerClient } = await import("@/lib/supabase");
  const supabase = createServerClient();

  // 1. Fetch the submission
  const { data: submission, error: fetchError } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submission_id)
    .single();

  if (fetchError || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  try {
    // 2. Update status to extracting
    await supabase
      .from("submissions")
      .update({ status: "extracting" })
      .eq("id", submission_id);

    // 3. Extract content
    const extracted = await extractContent(submission.url, submission_id);

    // 4. Store extracted source
    await supabase.from("sources").insert({
      submission_id,
      url: submission.url,
      source_type: submission.source_type,
      raw_text: extracted.raw_text,
      extracted_at: new Date().toISOString(),
    });

    // 5. Update status to processing
    await supabase
      .from("submissions")
      .update({ status: "processing" })
      .eq("id", submission_id);

    // 6. Generate tutorial via AI
    const generated = await generateTutorial(extracted.raw_text, submission.url);

    // 7. Check for existing tutorial on same topic to merge
    const { data: existing } = await supabase
      .from("tutorials")
      .select("*")
      .overlaps("topics", generated.classification.topics)
      .eq("maturity_level", generated.classification.maturity_level)
      .eq("is_published", true)
      .limit(1)
      .single();

    let tutorialId: string;

    if (existing) {
      // Merge into existing tutorial
      const merged = await mergeTutorial(
        existing,
        extracted.raw_text,
        submission.url,
      );

      const { error: updateError } = await supabase
        .from("tutorials")
        .update({
          body: merged.body,
          summary: merged.summary,
          action_items: merged.action_items,
          source_urls: [...existing.source_urls, submission.url],
          source_count: existing.source_count + 1,
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;
      tutorialId = existing.id;
    } else {
      // Create new tutorial
      const { data: created, error: insertError } = await supabase
        .from("tutorials")
        .insert({
          slug: generated.slug,
          title: generated.title,
          summary: generated.summary,
          body: generated.body,
          maturity_level: generated.classification.maturity_level,
          level_relation: generated.classification.level_relation,
          topics: generated.classification.topics,
          tags: generated.classification.tags,
          tools_mentioned: generated.classification.tools_mentioned,
          difficulty: generated.classification.difficulty,
          action_items: generated.action_items,
          source_urls: [submission.url],
          source_count: 1,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      tutorialId = created!.id;
    }

    // 8. Link source to tutorial
    await supabase
      .from("sources")
      .update({ tutorial_id: tutorialId })
      .eq("submission_id", submission_id);

    // 9. Mark submission as published
    await supabase
      .from("submissions")
      .update({ status: "published" })
      .eq("id", submission_id);

    return NextResponse.json({
      success: true,
      tutorial_id: tutorialId,
      merged: !!existing,
    });
  } catch (err) {
    console.error("Processing failed:", err);

    await supabase
      .from("submissions")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", submission_id);

    return NextResponse.json(
      { error: "Processing failed", details: String(err) },
      { status: 500 },
    );
  }
}
