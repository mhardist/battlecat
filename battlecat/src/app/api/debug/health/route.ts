import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface Check {
  name: string;
  status: "pass" | "fail" | "warn";
  detail: string;
  ms?: number;
}

/**
 * GET /api/debug/health
 *
 * Tests every dependency in the ingestion pipeline and reports
 * pass/fail/warn for each one.  Hit this first when diagnosing
 * "content not arriving" issues.
 *
 * Response shape:
 * {
 *   ok: boolean,          // true only if every critical check passes
 *   checks: Check[],
 *   summary: string
 * }
 */
export async function GET() {
  const checks: Check[] = [];

  // ── 1. Environment variables ──────────────────────────────────────────
  const envVars = [
    { key: "NEXT_PUBLIC_SUPABASE_URL", critical: true },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", critical: true },
    { key: "SUPABASE_SERVICE_ROLE_KEY", critical: true },
    { key: "ANTHROPIC_API_KEY", critical: true },
    { key: "TWILIO_ACCOUNT_SID", critical: true },
    { key: "TWILIO_AUTH_TOKEN", critical: true },
    { key: "TWILIO_PHONE_NUMBER", critical: true },
    { key: "DEEPGRAM_API_KEY", critical: false },
    { key: "JINA_API_KEY", critical: false },
    { key: "TOGETHER_API_KEY", critical: false },
  ];

  for (const { key, critical } of envVars) {
    const val = process.env[key];
    const set = !!val && val.length > 0;
    checks.push({
      name: `env:${key}`,
      status: set ? "pass" : critical ? "fail" : "warn",
      detail: set
        ? `Set (${val!.slice(0, 6)}...)`
        : critical
          ? "MISSING — pipeline will crash"
          : "Not set — feature degraded",
    });
  }

  // ── 2. Supabase connectivity ──────────────────────────────────────────
  try {
    const t0 = Date.now();
    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    // Test: can we read from submissions?
    const { error: subErr } = await supabase
      .from("submissions")
      .select("id")
      .limit(1);

    const ms = Date.now() - t0;

    if (subErr) {
      checks.push({
        name: "supabase:submissions_table",
        status: "fail",
        detail: `Query failed: ${subErr.message} (code: ${subErr.code})`,
        ms,
      });
    } else {
      checks.push({
        name: "supabase:submissions_table",
        status: "pass",
        detail: "SELECT OK",
        ms,
      });
    }

    // Test: can we read from tutorials?
    const { error: tutErr } = await supabase
      .from("tutorials")
      .select("id")
      .limit(1);

    if (tutErr) {
      checks.push({
        name: "supabase:tutorials_table",
        status: "fail",
        detail: `Query failed: ${tutErr.message} (code: ${tutErr.code})`,
      });
    } else {
      checks.push({
        name: "supabase:tutorials_table",
        status: "pass",
        detail: "SELECT OK",
      });
    }

    // Test: can we read from sources?
    const { error: srcErr } = await supabase
      .from("sources")
      .select("id")
      .limit(1);

    if (srcErr) {
      checks.push({
        name: "supabase:sources_table",
        status: "fail",
        detail: `Query failed: ${srcErr.message} (code: ${srcErr.code})`,
      });
    } else {
      checks.push({
        name: "supabase:sources_table",
        status: "pass",
        detail: "SELECT OK",
      });
    }

    // Test: can we INSERT into submissions (and rollback)?
    const { data: testSub, error: insertErr } = await supabase
      .from("submissions")
      .insert({
        phone_number: "__health_check__",
        raw_message: "health check probe — safe to delete",
        url: "https://example.com/__health__",
        source_type: "article",
        status: "received",
      })
      .select("id")
      .single();

    if (insertErr) {
      checks.push({
        name: "supabase:submissions_insert",
        status: "fail",
        detail: `INSERT failed: ${insertErr.message} (code: ${insertErr.code})`,
      });
    } else {
      checks.push({
        name: "supabase:submissions_insert",
        status: "pass",
        detail: `INSERT OK (id: ${testSub.id})`,
      });
      // Clean up the test row
      await supabase.from("submissions").delete().eq("id", testSub.id);
    }

    // Test: Supabase storage bucket exists?
    const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
    if (bucketErr) {
      checks.push({
        name: "supabase:storage_buckets",
        status: "warn",
        detail: `Could not list buckets: ${bucketErr.message}`,
      });
    } else {
      const imagesBucket = buckets?.find((b) => b.name === "images");
      checks.push({
        name: "supabase:storage_images_bucket",
        status: imagesBucket ? "pass" : "warn",
        detail: imagesBucket
          ? "images bucket exists"
          : `images bucket NOT FOUND — hero images will fail. Buckets found: [${buckets?.map((b) => b.name).join(", ") || "none"}]`,
      });
    }
  } catch (err) {
    checks.push({
      name: "supabase:connection",
      status: "fail",
      detail: `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ── 3. Anthropic Claude API ───────────────────────────────────────────
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const t0 = Date.now();
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16,
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
      });
      const ms = Date.now() - t0;
      const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
      checks.push({
        name: "anthropic:claude_api",
        status: text.includes("OK") ? "pass" : "warn",
        detail: `Response: "${text.slice(0, 50)}"`,
        ms,
      });
    } catch (err) {
      checks.push({
        name: "anthropic:claude_api",
        status: "fail",
        detail: `API call failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  // ── 4. Jina Reader ────────────────────────────────────────────────────
  try {
    const t0 = Date.now();
    const headers: Record<string, string> = { Accept: "text/plain" };
    const jinaKey = process.env.JINA_API_KEY;
    if (jinaKey) headers["Authorization"] = `Bearer ${jinaKey}`;

    const resp = await fetch("https://r.jina.ai/https://example.com", {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    const ms = Date.now() - t0;
    checks.push({
      name: "jina:reader",
      status: resp.ok ? "pass" : "warn",
      detail: resp.ok ? `HTTP ${resp.status}` : `HTTP ${resp.status} ${resp.statusText}`,
      ms,
    });
  } catch (err) {
    checks.push({
      name: "jina:reader",
      status: "warn",
      detail: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ── 5. Submissions pipeline status ────────────────────────────────────
  try {
    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    const statuses = ["received", "extracting", "processing", "published", "failed"];
    const counts: Record<string, number> = {};
    for (const s of statuses) {
      const { count } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", s);
      counts[s] = count ?? 0;
    }

    const stuckReceived = counts["received"] ?? 0;
    const stuckProcessing = (counts["extracting"] ?? 0) + (counts["processing"] ?? 0);
    const failed = counts["failed"] ?? 0;
    const published = counts["published"] ?? 0;

    checks.push({
      name: "pipeline:submission_counts",
      status: "pass",
      detail: `received=${stuckReceived} extracting=${counts["extracting"]} processing=${counts["processing"]} published=${published} failed=${failed}`,
    });

    if (stuckReceived > 0) {
      checks.push({
        name: "pipeline:stuck_received",
        status: "fail",
        detail: `${stuckReceived} submission(s) stuck in "received" — after() is NOT firing or processSubmission never ran`,
      });
    }

    if (stuckProcessing > 0) {
      checks.push({
        name: "pipeline:stuck_processing",
        status: "warn",
        detail: `${stuckProcessing} submission(s) stuck in extracting/processing — may be in progress or timed out`,
      });
    }

    if (failed > 0) {
      // Fetch latest failed submissions
      const { data: failedSubs } = await supabase
        .from("submissions")
        .select("id, url, error_message, created_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(5);

      checks.push({
        name: "pipeline:recent_failures",
        status: "fail",
        detail: JSON.stringify(failedSubs, null, 2),
      });
    }
  } catch (err) {
    checks.push({
      name: "pipeline:submission_counts",
      status: "warn",
      detail: `Could not query: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ── 6. Published tutorials count ──────────────────────────────────────
  try {
    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();
    const { count } = await supabase
      .from("tutorials")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true);

    checks.push({
      name: "tutorials:published_count",
      status: "pass",
      detail: `${count ?? 0} published tutorials in database`,
    });
  } catch {
    // skip
  }

  // ── Summary ───────────────────────────────────────────────────────────
  const failures = checks.filter((c) => c.status === "fail");
  const warnings = checks.filter((c) => c.status === "warn");
  const ok = failures.length === 0;

  const summary = ok
    ? `All critical checks passed. ${warnings.length} warning(s).`
    : `${failures.length} FAILURE(s): ${failures.map((f) => f.name).join(", ")}`;

  return NextResponse.json({ ok, summary, checks }, { status: ok ? 200 : 500 });
}
