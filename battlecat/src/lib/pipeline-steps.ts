/**
 * Pipeline step implementations.
 *
 * Each step wraps existing library functions (extract, ai, generate-audio, etc.)
 * with idempotency guards and structured result types. Steps persist their
 * intermediate output on the submission row so the pipeline can resume
 * from any point.
 */

import { extractContent } from "@/lib/extract";
import {
  classifyContent,
  generateTutorial,
  mergeTutorial,
  generateHotNewsBlurb,
} from "@/lib/ai";
import { generateTutorialImage } from "@/lib/generate-image";
import { generateTutorialAudio } from "@/lib/generate-audio";
import { createServerClient } from "@/lib/supabase";
import { PipelineError } from "@/lib/pipeline-errors";
import type {
  Submission,
  GeneratedTutorialData,
} from "@/types";

/** Result returned by every step function. */
export interface StepResult {
  /** New status to write on the submission row. */
  nextStatus: string;
  /** Fields to update on the submission row alongside the status. */
  updates: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Step 1: Extract content from the source URL
// ---------------------------------------------------------------------------

export async function stepExtract(sub: Submission): Promise<StepResult> {
  // Idempotency: if extracted_text is already populated, skip
  if (sub.extracted_text) {
    return { nextStatus: "extracted", updates: {} };
  }

  try {
    const extracted = await extractContent(sub.url, sub.id);

    // Also persist to sources table (matches original behavior)
    const supabase = createServerClient();
    await supabase.from("sources").insert({
      submission_id: sub.id,
      url: sub.url,
      source_type: sub.source_type,
      raw_text: extracted.raw_text,
      extracted_at: new Date().toISOString(),
    });

    return {
      nextStatus: "extracted",
      updates: { extracted_text: extracted.raw_text },
    };
  } catch (err) {
    throw PipelineError.fromError(err, "extract");
  }
}

// ---------------------------------------------------------------------------
// Step 2: Classify content into the AI Maturity Framework
// ---------------------------------------------------------------------------

export async function stepClassify(sub: Submission): Promise<StepResult> {
  // Idempotency: if classification is already populated, skip
  if (sub.classification) {
    return { nextStatus: "classified", updates: {} };
  }

  if (!sub.extracted_text) {
    throw new PipelineError(
      "Cannot classify: no extracted_text on submission",
      "classify",
      "permanent",
    );
  }

  try {
    const classification = await classifyContent(sub.extracted_text);

    return {
      nextStatus: "classified",
      updates: { classification },
    };
  } catch (err) {
    throw PipelineError.fromError(err, "classify");
  }
}

// ---------------------------------------------------------------------------
// Step 3: Generate tutorial via AI
// ---------------------------------------------------------------------------

export async function stepGenerate(sub: Submission): Promise<StepResult> {
  // Idempotency: if generated_tutorial is already populated, skip
  if (sub.generated_tutorial) {
    return { nextStatus: "generated", updates: {} };
  }

  if (!sub.extracted_text || !sub.classification) {
    throw new PipelineError(
      "Cannot generate: missing extracted_text or classification",
      "generate",
      "permanent",
    );
  }

  try {
    const generated = await generateTutorial(sub.extracted_text, sub.url);

    const tutorialData: GeneratedTutorialData = {
      title: generated.title,
      slug: generated.slug,
      summary: generated.summary,
      body: generated.body,
      action_items: generated.action_items,
      classification: generated.classification,
    };

    return {
      nextStatus: "generated",
      updates: { generated_tutorial: tutorialData },
    };
  } catch (err) {
    throw PipelineError.fromError(err, "generate");
  }
}

// ---------------------------------------------------------------------------
// Step 4: Publish — insert/merge tutorial, generate image + audio
// ---------------------------------------------------------------------------

export interface PublishOptions {
  hotNews?: boolean;
}

export async function stepPublish(
  sub: Submission,
  options?: PublishOptions,
): Promise<StepResult> {
  const supabase = createServerClient();
  const gen = sub.generated_tutorial;

  if (!gen) {
    throw new PipelineError(
      "Cannot publish: no generated_tutorial on submission",
      "publish",
      "permanent",
    );
  }

  let tutorialId: string;
  let audioBody: string;
  let audioSlug: string;

  // Idempotency: if tutorial_id is already set, skip insert/merge
  if (sub.tutorial_id) {
    const { data: existing } = await supabase
      .from("tutorials")
      .select("id, slug, body")
      .eq("id", sub.tutorial_id)
      .maybeSingle();

    if (existing) {
      tutorialId = existing.id;
      audioBody = existing.body;
      audioSlug = existing.slug;
    } else {
      // tutorial_id was set but tutorial doesn't exist — re-create
      sub = { ...sub, tutorial_id: null };
      return stepPublish(sub, options);
    }
  } else {
    // Check for existing tutorial on same topic to merge
    const { data: candidate } = await supabase
      .from("tutorials")
      .select("*")
      .overlaps("topics", gen.classification.topics)
      .eq("maturity_level", gen.classification.maturity_level)
      .eq("is_published", true)
      .limit(1)
      .maybeSingle();

    // Merge threshold: require >= 2 overlapping topics
    const newTopics = gen.classification.topics;
    const mergeTarget =
      candidate &&
      (() => {
        const candidateTopics: string[] = candidate.topics ?? [];
        const sharedCount = newTopics.filter((t: string) =>
          candidateTopics.includes(t),
        ).length;
        console.log(
          `[pipeline:publish] Merge check: ${sharedCount} shared topic(s) with tutorial ${candidate.id}`,
        );
        return sharedCount >= 2 ? candidate : null;
      })();

    if (mergeTarget) {
      // Merge into existing tutorial
      try {
        const merged = await mergeTutorial(
          mergeTarget,
          sub.extracted_text!,
          sub.url,
        );

        audioBody = merged.body;
        audioSlug = mergeTarget.slug;

        const mergeUpdate: Record<string, unknown> = {
          body: merged.body,
          summary: merged.summary,
          action_items: merged.action_items,
          source_urls: [...mergeTarget.source_urls, sub.url],
          source_count: mergeTarget.source_count + 1,
        };

        if (options?.hotNews) {
          mergeUpdate.is_hot_news = true;
        }

        const { error: updateError } = await supabase
          .from("tutorials")
          .update(mergeUpdate)
          .eq("id", mergeTarget.id);

        if (updateError) throw updateError;
        tutorialId = mergeTarget.id;
      } catch (err) {
        throw PipelineError.fromError(err, "publish");
      }
    } else {
      // Create new tutorial — retry slug collision once
      const payload = {
        slug: gen.slug,
        title: gen.title,
        summary: gen.summary,
        body: gen.body,
        maturity_level: gen.classification.maturity_level,
        level_relation: gen.classification.level_relation,
        topics: gen.classification.topics,
        tags: gen.classification.tags,
        tools_mentioned: gen.classification.tools_mentioned,
        difficulty: gen.classification.difficulty,
        action_items: gen.action_items,
        source_urls: [sub.url],
        source_count: 1,
      };

      let { data: created, error: insertError } = await supabase
        .from("tutorials")
        .insert(payload)
        .select("id")
        .single();

      if (insertError && insertError.code === "23505") {
        const suffix = Math.random().toString(36).slice(2, 8);
        payload.slug = `${gen.slug}-${suffix}`;
        console.log(
          `[pipeline:publish] Slug collision, retrying with: ${payload.slug}`,
        );
        const retry = await supabase
          .from("tutorials")
          .insert(payload)
          .select("id")
          .single();
        created = retry.data;
        insertError = retry.error;
      }

      if (insertError) throw PipelineError.fromError(insertError, "publish");
      tutorialId = created!.id;
      audioBody = gen.body;
      audioSlug = gen.slug;
    }
  }

  // Generate image + audio in parallel (non-fatal)
  try {
    const [imageUrl, audioUrl] = await Promise.all([
      generateTutorialImage(
        gen.title,
        gen.classification.topics,
        gen.classification.maturity_level,
        gen.summary,
        gen.action_items,
      ).catch((imgErr: unknown) => {
        console.error(`[pipeline:publish] Image generation failed (non-fatal):`, imgErr);
        return null;
      }),
      generateTutorialAudio(audioBody, audioSlug).catch(
        (audioErr: unknown) => {
          console.error(`[pipeline:publish] Audio generation failed (non-fatal):`, audioErr);
          return null;
        },
      ),
    ]);

    const mediaUpdate: Record<string, unknown> = {};
    if (imageUrl) mediaUpdate.image_url = imageUrl;
    if (audioUrl) mediaUpdate.audio_url = audioUrl;

    if (Object.keys(mediaUpdate).length > 0) {
      await supabase
        .from("tutorials")
        .update(mediaUpdate)
        .eq("id", tutorialId);
    }
  } catch (mediaErr) {
    console.error(`[pipeline:publish] Media generation failed (non-fatal):`, mediaErr);
  }

  // Hot news blurb
  if (options?.hotNews) {
    try {
      const blurb = await generateHotNewsBlurb(
        gen.title,
        gen.summary,
        gen.classification.tools_mentioned,
      );
      await supabase
        .from("tutorials")
        .update({
          is_hot_news: true,
          hot_news_headline: blurb.headline,
          hot_news_teaser: blurb.teaser,
        })
        .eq("id", tutorialId);
    } catch {
      // Fallback: flag as hot news with title/summary
      await supabase
        .from("tutorials")
        .update({
          is_hot_news: true,
          hot_news_headline: gen.title,
          hot_news_teaser: gen.summary.slice(0, 200),
        })
        .eq("id", tutorialId);
    }
  }

  // Link source to tutorial
  await supabase
    .from("sources")
    .update({ tutorial_id: tutorialId })
    .eq("submission_id", sub.id);

  return {
    nextStatus: "published",
    updates: {
      tutorial_id: tutorialId,
      completed_at: new Date().toISOString(),
    },
  };
}
