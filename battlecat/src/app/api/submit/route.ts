import { NextResponse } from "next/server";
import { detectSourceType } from "@/lib/extract";

/**
 * POST /api/submit
 * Web form submission endpoint.
 * Accepts a URL + optional note, validates, and queues for processing.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, note } = body as { url?: string; note?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const sourceType = detectSourceType(url);

    // In production: store in Supabase and trigger processing
    // For now, log and return success
    console.log("[submit]", {
      url,
      note: note || null,
      sourceType,
      timestamp: new Date().toISOString(),
    });

    // TODO: Store submission in Supabase
    // const { data, error } = await createServerClient()
    //   .from("submissions")
    //   .insert({
    //     phone_number: "web",
    //     raw_message: note || url,
    //     url,
    //     source_type: sourceType,
    //     status: "received",
    //   })
    //   .select()
    //   .single();

    // TODO: Trigger processing pipeline
    // await triggerProcessing(data.id);

    return NextResponse.json({
      success: true,
      message: "Link received — processing queued.",
      source_type: sourceType,
    });
  } catch (error) {
    console.error("[submit] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
