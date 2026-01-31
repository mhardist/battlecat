import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/tutorials/[id]/stale
 * Toggle the is_stale flag on a tutorial.
 * Body: { is_stale: boolean }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const isStale = Boolean(body.is_stale);

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("tutorials")
      .update({ is_stale: isStale })
      .eq("id", id)
      .select("id, is_stale")
      .single();

    if (error) {
      // If the tutorial is a seed tutorial (non-UUID id), we can't update in DB
      if (error.code === "PGRST116" || error.code === "22P02") {
        return NextResponse.json(
          { error: "Seed tutorials cannot be marked stale in the database" },
          { status: 400 },
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, id: data.id, is_stale: data.is_stale });
  } catch (err) {
    console.error("[api/tutorials/stale] Error:", err);
    return NextResponse.json(
      { error: "Failed to update stale status" },
      { status: 500 },
    );
  }
}
