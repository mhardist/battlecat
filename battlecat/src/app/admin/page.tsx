"use client";

import { useEffect, useState, useCallback } from "react";

interface SubmissionRow {
  id: string;
  url: string;
  source_type: string;
  status: string;
  retry_count: number;
  max_retries: number;
  last_step: string | null;
  last_error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  tutorial_id: string | null;
}

interface AdminData {
  counts: Record<string, number>;
  submissions: SubmissionRow[];
}

const STATUS_COLORS: Record<string, string> = {
  published: "text-bc-success",
  failed: "text-red-500",
  dead: "text-gray-500",
  received: "text-blue-500",
  extracting: "text-yellow-500",
  extracted: "text-yellow-600",
  classifying: "text-orange-500",
  classified: "text-orange-600",
  generating: "text-purple-500",
  generated: "text-purple-600",
  publishing: "text-teal-500",
};

const STATUS_ICONS: Record<string, string> = {
  published: "●",
  failed: "●",
  dead: "■",
  received: "○",
  extracting: "◐",
  extracted: "◑",
  classifying: "◐",
  classified: "◑",
  generating: "◐",
  generated: "◑",
  publishing: "◐",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncateUrl(url: string, maxLen = 50): string {
  try {
    const parsed = new URL(url);
    const display = parsed.hostname + parsed.pathname;
    return display.length > maxLen ? display.slice(0, maxLen) + "..." : display;
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen) + "..." : url;
  }
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const [retryAllLoading, setRetryAllLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchData = useCallback(async (sec: string, statusFilter?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ secret: sec });
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const res = await fetch(`/api/admin/submissions?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          setAuthenticated(false);
          setError("Invalid secret");
          return;
        }
        throw new Error(`API error: ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (secret.trim()) {
      fetchData(secret.trim());
    }
  };

  const handleRetry = async (submissionId: string) => {
    setRetrying((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, secret }),
      });
      if (!res.ok) throw new Error(`Retry failed: ${res.status}`);
      // Refresh data
      await fetchData(secret, filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetrying((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  const handleRetryAll = async () => {
    setRetryAllLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/retry-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) throw new Error(`Retry all failed: ${res.status}`);
      const result = await res.json();
      setError(
        result.attempted === 0
          ? "No failed submissions to retry"
          : `Retried ${result.attempted}, succeeded ${result.succeeded}`,
      );
      await fetchData(secret, filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry all failed");
    } finally {
      setRetryAllLoading(false);
    }
  };

  // Auto-refresh every 30s when authenticated
  useEffect(() => {
    if (!authenticated || !secret) return;
    const interval = setInterval(() => fetchData(secret, filter), 30_000);
    return () => clearInterval(interval);
  }, [authenticated, secret, filter, fetchData]);

  // Refetch when filter changes
  useEffect(() => {
    if (authenticated && secret) {
      fetchData(secret, filter);
    }
  }, [filter, authenticated, secret, fetchData]);

  if (!authenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-foreground">Admin Access</h1>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter admin secret"
            className="w-full rounded-lg border border-bc-border bg-bc-surface px-4 py-2 text-foreground placeholder:text-bc-text-secondary focus:border-bc-primary focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-bc-primary px-4 py-2 font-medium text-white transition-colors hover:bg-bc-primary-dark"
          >
            Enter
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </div>
    );
  }

  const counts = data?.counts ?? {};
  const submissions = data?.submissions ?? [];
  const inProgressCount =
    (counts.received ?? 0) +
    (counts.extracting ?? 0) + (counts.extracted ?? 0) +
    (counts.classifying ?? 0) + (counts.classified ?? 0) +
    (counts.generating ?? 0) + (counts.generated ?? 0) +
    (counts.publishing ?? 0);
  const retryableCount = submissions.filter(
    (s) => s.status === "failed" && s.retry_count < s.max_retries,
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pipeline Status</h1>
        <button
          onClick={handleRetryAll}
          disabled={retryAllLoading || retryableCount === 0}
          className="rounded-lg bg-bc-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-bc-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {retryAllLoading ? "Retrying..." : `Retry All Failed (${retryableCount})`}
        </button>
      </div>

      {/* Status banner */}
      {error && (
        <div className="rounded-lg border border-bc-border bg-bc-surface px-4 py-3 text-sm text-foreground">
          {error}
        </div>
      )}

      {/* Status summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatusCard label="Published" count={counts.published ?? 0} color="text-bc-success" />
        <StatusCard label="Failed" count={counts.failed ?? 0} color="text-red-500" />
        <StatusCard label="Dead" count={counts.dead ?? 0} color="text-gray-500" />
        <StatusCard label="In Progress" count={inProgressCount} color="text-blue-500" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-bc-border pb-2">
        {[
          { key: "all", label: "All" },
          { key: "failed,dead", label: "Stuck" },
          { key: "published", label: "Published" },
          { key: "received,extracting,extracted,classifying,classified,generating,generated,publishing", label: "In Progress" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-bc-primary text-white"
                : "text-bc-text-secondary hover:bg-bc-primary/10 hover:text-bc-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Submissions list */}
      {loading && !data ? (
        <p className="py-8 text-center text-bc-text-secondary">Loading...</p>
      ) : submissions.length === 0 ? (
        <p className="py-8 text-center text-bc-text-secondary">No submissions found</p>
      ) : (
        <div className="space-y-2">
          {submissions.map((sub) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              onRetry={() => handleRetry(sub.id)}
              retrying={retrying[sub.id] ?? false}
            />
          ))}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <p className="text-center text-xs text-bc-text-secondary">
        Auto-refreshes every 30s {loading && " — refreshing..."}
      </p>
    </div>
  );
}

function StatusCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-bc-border bg-bc-surface p-4">
      <p className="text-sm text-bc-text-secondary">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
    </div>
  );
}

function SubmissionCard({
  submission: sub,
  onRetry,
  retrying,
}: {
  submission: SubmissionRow;
  onRetry: () => void;
  retrying: boolean;
}) {
  const icon = STATUS_ICONS[sub.status] ?? "?";
  const color = STATUS_COLORS[sub.status] ?? "text-foreground";
  const canRetry = sub.status === "failed" || sub.status === "dead";

  return (
    <div className="rounded-lg border border-bc-border bg-bc-surface px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Status + URL */}
          <div className="flex items-center gap-2">
            <span className={`text-lg ${color}`}>{icon}</span>
            <span className={`text-sm font-medium ${color}`}>{sub.status}</span>
            <span className="text-xs text-bc-text-secondary">{sub.source_type}</span>
          </div>

          {/* URL */}
          <p className="mt-1 truncate font-mono text-sm text-foreground">
            {truncateUrl(sub.url, 70)}
          </p>

          {/* Error + metadata */}
          {sub.last_error && (
            <p className="mt-1 text-xs text-red-500">
              {sub.last_step && <span className="font-medium">Step: {sub.last_step} — </span>}
              {sub.last_error}
            </p>
          )}

          <div className="mt-1 flex items-center gap-3 text-xs text-bc-text-secondary">
            <span>Retries: {sub.retry_count}/{sub.max_retries}</span>
            <span>{timeAgo(sub.created_at)}</span>
            {sub.tutorial_id && (
              <a
                href={`/tutorials/${sub.tutorial_id}`}
                className="text-bc-primary hover:underline"
              >
                View tutorial
              </a>
            )}
          </div>
        </div>

        {/* Retry button */}
        {canRetry && (
          <button
            onClick={onRetry}
            disabled={retrying}
            className="shrink-0 rounded-md border border-bc-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-bc-primary hover:text-bc-primary disabled:opacity-50"
          >
            {retrying ? "..." : "Retry"}
          </button>
        )}
      </div>
    </div>
  );
}
