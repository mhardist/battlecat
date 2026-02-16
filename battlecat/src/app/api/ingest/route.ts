import { NextRequest, NextResponse, after } from "next/server";
import { detectSourceType } from "@/lib/extract";
import { advanceSubmission } from "@/lib/pipeline";

/** Force dynamic — these routes need runtime env vars */
export const dynamic = "force-dynamic";

/** Vercel serverless: allow up to 60s for extraction + AI pipeline */
export const maxDuration = 60;

/**
 * POST /api/ingest
 *
 * Twilio SMS / WhatsApp webhook endpoint.
 * Receives incoming messages, extracts the URL, stores the submission,
 * and triggers the pipeline via after().
 *
 * WhatsApp sandbox messages arrive with From="whatsapp:+1xxx" — we
 * normalize the phone number by stripping the "whatsapp:" prefix.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const body = formData.get("Body") as string;
  const rawFrom = formData.get("From") as string;

  if (!body || !rawFrom) {
    return new NextResponse(twiml("Missing message body or sender."), {
      status: 400,
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Normalize WhatsApp sender: "whatsapp:+1234567890" → "+1234567890"
  const from = rawFrom.replace(/^whatsapp:/, "");
  const isWhatsApp = rawFrom.startsWith("whatsapp:");

  // Extract URLs from the message
  const urlMatch = body.match(
    /https?:\/\/[^\s]+/i,
  );

  if (!urlMatch) {
    return new NextResponse(
      twiml("No URL found in your message. Send a link and I'll process it."),
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  const url = urlMatch[0].replace(/[.,;:!?)]+$/, ""); // Strip trailing punctuation
  const sourceType = detectSourceType(url);

  const { createServerClient } = await import("@/lib/supabase");
  const supabase = createServerClient();

  // Check for duplicate URL — but allow retry of failed/dead submissions
  const { data: existing } = await supabase
    .from("submissions")
    .select("id, status")
    .eq("url", url)
    .limit(1)
    .maybeSingle();

  if (existing) {
    const retryable = existing.status === "failed" || existing.status === "dead";

    if (!retryable && existing.status !== "received") {
      // Already published or in progress — skip
      return new NextResponse(
        twiml("This link has already been submitted and processed."),
        { headers: { "Content-Type": "text/xml" } },
      );
    }

    if (retryable) {
      // Reset the failed submission for re-processing
      await supabase
        .from("submissions")
        .update({ status: "received", retry_count: 0, last_error: null })
        .eq("id", existing.id);

      // Detect hot news flag
      const textBeforeUrl = body.slice(0, body.indexOf(url));
      const isHotNews = /\bhot:/i.test(textBeforeUrl);

      after(async () => {
        console.log(`[ingest] Retrying failed submission ${existing.id} (hot_news: ${isHotNews})`);
        const result = await advanceSubmission(existing.id, { hotNews: isHotNews });
        console.log(`[ingest] Retry result for ${existing.id}:`, result);
      });

      const channel = isWhatsApp ? "WhatsApp" : "SMS";
      return new NextResponse(
        twiml(`Retrying your ${sourceType} link via ${channel}. You'll see it on battlecat.ai soon.`),
        { headers: { "Content-Type": "text/xml" } },
      );
    }
  }

  // Detect hot news flag: "HOT:" prefix before the URL
  const textBeforeUrl = body.slice(0, body.indexOf(url));
  const isHotNews = /\bhot:/i.test(textBeforeUrl);

  // Store the submission
  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      phone_number: from,
      raw_message: body,
      url,
      source_type: sourceType,
      status: "received",
    })
    .select("id")
    .single();

  if (error || !submission) {
    console.error("Failed to store submission:", error);
    return new NextResponse(
      twiml("Something went wrong. Try again in a moment."),
      { status: 500, headers: { "Content-Type": "text/xml" } },
    );
  }

  // Run pipeline after the response is sent.
  after(async () => {
    console.log(`[ingest] Starting pipeline for ${submission.id} (hot_news: ${isHotNews})`);
    const result = await advanceSubmission(submission.id, { hotNews: isHotNews });
    console.log(`[ingest] Pipeline result for ${submission.id}:`, result);
  });

  const channel = isWhatsApp ? "WhatsApp" : "SMS";
  const hotLabel = isHotNews ? " as Hot News" : "";
  return new NextResponse(
    twiml(`Got it — processing your ${sourceType} link${hotLabel} via ${channel}. You'll see it on battlecat.ai soon.`),
    { headers: { "Content-Type": "text/xml" } },
  );
}

/** Generate TwiML response for Twilio */
function twiml(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
