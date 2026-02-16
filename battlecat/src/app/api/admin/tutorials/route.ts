import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") === secret) return true;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  return false;
}

async function authorizeFromBody(request: NextRequest): Promise<boolean> {
  if (isAuthorized(request)) return true;
  const body = await request.clone().json().catch(() => ({}));
  const secret = process.env.ADMIN_SECRET;
  return !!(secret && body.secret === secret);
}

/**
 * GET /api/admin/tutorials
 *
 * List all tutorials (including unpublished) for admin management.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("tutorials")
      .select("id, slug, title, maturity_level, is_published, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tutorials: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/tutorials
 *
 * Archive (unpublish) a tutorial.
 * Body: { tutorial_id: string, action: "archive" | "unarchive", secret: string }
 */
export async function PATCH(request: NextRequest) {
  if (!(await authorizeFromBody(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tutorial_id, action } = await request.json();

    if (!tutorial_id || !["archive", "unarchive"].includes(action)) {
      return NextResponse.json(
        { error: "tutorial_id and action (archive|unarchive) required" },
        { status: 400 },
      );
    }

    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    const { error } = await supabase
      .from("tutorials")
      .update({ is_published: action === "unarchive" })
      .eq("id", tutorial_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, action });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/tutorials
 *
 * Permanently delete a tutorial and its associated submission.
 * Body: { tutorial_id: string, secret: string }
 */
export async function DELETE(request: NextRequest) {
  if (!(await authorizeFromBody(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tutorial_id } = await request.json();

    if (!tutorial_id) {
      return NextResponse.json({ error: "tutorial_id required" }, { status: 400 });
    }

    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    // Clear tutorial_id from any submissions that reference it
    await supabase
      .from("submissions")
      .update({ tutorial_id: null })
      .eq("tutorial_id", tutorial_id);

    // Delete the tutorial
    const { error } = await supabase
      .from("tutorials")
      .delete()
      .eq("id", tutorial_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: tutorial_id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
