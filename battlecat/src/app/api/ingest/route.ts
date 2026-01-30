import { NextRequest, NextResponse } from "next/server";
import { detectSourceType } from "@/lib/extract";

/** Force dynamic — these routes need runtime env vars */
export const dynamic = "force-dynamic";

/**
 * POST /api/ingest
 *
 * Twilio SMS webhook endpoint.
 * Receives incoming SMS, extracts the URL, stores the submission,
 * and returns TwiML to confirm receipt.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const body = formData.get("Body") as string;
  const from = formData.get("From") as string;

  if (!body || !from) {
    return new NextResponse(twiml("Missing message body or sender."), {
      status: 400,
      headers: { "Content-Type": "text/xml" },
    });
  }

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

  // Store the submission
  const { createServerClient } = await import("@/lib/supabase");
  const supabase = createServerClient();
  const { error } = await supabase.from("submissions").insert({
    phone_number: from,
    raw_message: body,
    url,
    source_type: sourceType,
    status: "received",
  });

  if (error) {
    console.error("Failed to store submission:", error);
    return new NextResponse(
      twiml("Something went wrong. Try again in a moment."),
      { status: 500, headers: { "Content-Type": "text/xml" } },
    );
  }

  // Trigger async processing (Phase 2+3 pipeline)
  // In production, this would queue a background job.
  // For now, we just confirm receipt.
  triggerProcessing(url, sourceType).catch(console.error);

  return new NextResponse(
    twiml(`Got it — processing your ${sourceType} link. You'll see it on battlecat.ai soon.`),
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

/** Placeholder for async processing pipeline (Phase 2+3) */
async function triggerProcessing(url: string, sourceType: string) {
  // TODO: Phase 2 — extract content from URL
  // TODO: Phase 3 — AI classify, generate tutorial, check for merge
  // TODO: Update submission status through the pipeline
  console.log(`Processing queued: ${sourceType} — ${url}`);
}
