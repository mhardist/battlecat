import { NextRequest, NextResponse } from "next/server";
import { detectSourceType } from "@/lib/extract";

/** Force dynamic — these routes need runtime env vars */
export const dynamic = "force-dynamic";

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

  // Trigger async processing pipeline (extract → classify → generate → publish)
  triggerProcessing(submission.id).catch(console.error);

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

/** Trigger the processing pipeline by calling /api/process internally */
async function triggerProcessing(submissionId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submission_id: submissionId }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Processing failed for ${submissionId}:`, err);
  }
}
