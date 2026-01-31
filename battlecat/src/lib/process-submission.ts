import { extractContent } from "@/lib/extract";
import { generateTutorial, mergeTutorial } from "@/lib/ai";
import { generateTutorialImage } from "@/lib/generate-image";
import { createServerClient } from "@/lib/supabase";

/**
 * Process a submission end-to-end: extract content, classify, generate tutorial.
 *
 * This is the shared processing core used by /api/submit, /api/ingest,
 * and /api/process. It runs inline (no self-referencing HTTP calls) so
 * it works reliably on Vercel serverless via `after()`.
 */
export async function processSubmission(submissionId: string): Promise<{
  success: boolean;
  tutorial_id?: string;
  merged?: boolean;
  error?: string;
}> {
  const supabase = createServerClient();

  // 1. Fetch the submission
  const { data: submission, error: fetchError } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (fetchError || !submission) {
    console.error(`[process] Submission ${submissionId} not found:`, fetchError);
    return { success: false, error: "Submission not found" };
  }

  try {
    // 2. Update status to extracting
    await supabase
      .from("submissions")
      .update({ status: "extracting" })
      .eq("id", submissionId);

    // 3. Extract content
    const extracted = await extractContent(submission.url, submissionId);

    // 4. Store extracted source
    await supabase.from("sources").insert({
      submission_id: submissionId,
      url: submission.url,
      source_type: submission.source_type,
      raw_text: extracted.raw_text,
      extracted_at: new Date().toISOString(),
    });

    // 5. Update status to processing
    await supabase
      .from("submissions")
      .update({ status: "processing" })
      .eq("id", submissionId);

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

    // 8. Generate hero image (non-blocking — if it fails, tutorial still publishes)
    try {
      const imageUrl = await generateTutorialImage(
        generated.title,
        generated.classification.topics,
        generated.classification.maturity_level,
      );
      if (imageUrl) {
        await supabase
          .from("tutorials")
          .update({ image_url: imageUrl })
          .eq("id", tutorialId);
        console.log(`[process] Generated hero image for ${tutorialId}`);
      }
    } catch (imgErr) {
      console.error(`[process] Image generation failed (non-fatal):`, imgErr);
    }

    // 9. Link source to tutorial
    await supabase
      .from("sources")
      .update({ tutorial_id: tutorialId })
      .eq("submission_id", submissionId);

    // 10. Mark submission as published
    await supabase
      .from("submissions")
      .update({ status: "published" })
      .eq("id", submissionId);

    console.log(`[process] Submission ${submissionId} → tutorial ${tutorialId} (merged: ${!!existing})`);

    return {
      success: true,
      tutorial_id: tutorialId,
      merged: !!existing,
    };
  } catch (err) {
    console.error(`[process] Failed for submission ${submissionId}:`, err);

    await supabase
      .from("submissions")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", submissionId);

    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
