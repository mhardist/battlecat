import { NextRequest, NextResponse, after } from "next/server";
import { detectSourceType } from "@/lib/extract";
import { processSubmission } from "@/lib/process-submission";

/** Force dynamic — these routes need runtime env vars */
export const dynamic = "force-dynamic";

/** Vercel serverless: allow up to 60s for extraction + AI pipeline */
export const maxDuration = 60;

/**
 * POST /api/ingest
 *
 * Twilio SMS / WhatsApp webhook endpoint.
 * Receives incoming messages, extracts the URL, stores the submission,
 * and returns TwiML to confirm receipt.
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

  // Store the submission
  const { createServerClient } = await import("@/lib/supabase");
  const supabase = createServerClient();
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

  // Run processing after the response is sent.
  // after() keeps the Vercel function alive so processing completes.
  after(async () => {
    console.log(`[ingest] Starting background processing for ${submission.id}`);
    const result = await processSubmission(submission.id);
    console.log(`[ingest] Processing result for ${submission.id}:`, result);
  });

  const channel = isWhatsApp ? "WhatsApp" : "SMS";
  return new NextResponse(
    twiml(`Got it — processing your ${sourceType} link via ${channel}. You'll see it on battlecat.ai soon.`),
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
