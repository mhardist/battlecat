"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

/* ───────── Types ───────── */

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

interface TutorialRow {
  id: string;
  slug: string;
  title: string;
  maturity_level: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/* ───────── Constants ───────── */

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

/* ───────── Helpers ───────── */

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

/* ───────── Main ───────── */

type AdminTab = "pipeline" | "tutorials";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("pipeline");

  // Pipeline state
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const [retryAllLoading, setRetryAllLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  // Tutorials state
  const [tutorials, setTutorials] = useState<TutorialRow[]>([]);
  const [tutorialsLoading, setTutorialsLoading] = useState(false);
  const [tutorialAction, setTutorialAction] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  /* ── Fetch helpers ── */

  const fetchPipeline = useCallback(async (sec: string, statusFilter?: string) => {
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

  const fetchTutorials = useCallback(async (sec: string) => {
    setTutorialsLoading(true);
    try {
      const params = new URLSearchParams({ secret: sec });
      const res = await fetch(`/api/admin/tutorials?${params}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      setTutorials(json.tutorials ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tutorials");
    } finally {
      setTutorialsLoading(false);
    }
  }, []);

  /* ── Pipeline actions ── */

  const handleRetry = async (submissionId: string) => {
    setRetrying((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, secret }),
      });
      if (!res.ok) throw new Error(`Retry failed: ${res.status}`);
      await fetchPipeline(secret, filter);
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
      await fetchPipeline(secret, filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry all failed");
    } finally {
      setRetryAllLoading(false);
    }
  };

  /* ── Tutorial actions ── */

  const handleArchive = async (tutorialId: string, action: "archive" | "unarchive") => {
    setTutorialAction((prev) => ({ ...prev, [tutorialId]: true }));
    try {
      const res = await fetch("/api/admin/tutorials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorial_id: tutorialId, action, secret }),
      });
      if (!res.ok) throw new Error(`${action} failed: ${res.status}`);
      await fetchTutorials(secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${action} failed`);
    } finally {
      setTutorialAction((prev) => ({ ...prev, [tutorialId]: false }));
    }
  };

  const handleDelete = async (tutorialId: string) => {
    setTutorialAction((prev) => ({ ...prev, [tutorialId]: true }));
    setConfirmDelete(null);
    try {
      const res = await fetch("/api/admin/tutorials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorial_id: tutorialId, secret }),
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      await fetchTutorials(secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setTutorialAction((prev) => ({ ...prev, [tutorialId]: false }));
    }
  };

  /* ── Login ── */

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (secret.trim()) {
      fetchPipeline(secret.trim());
    }
  };

  /* ── Effects ── */

  // Auto-refresh pipeline every 30s
  useEffect(() => {
    if (!authenticated || !secret || activeTab !== "pipeline") return;
    const interval = setInterval(() => fetchPipeline(secret, filter), 30_000);
    return () => clearInterval(interval);
  }, [authenticated, secret, filter, activeTab, fetchPipeline]);

  // Refetch pipeline when filter changes
  useEffect(() => {
    if (authenticated && secret && activeTab === "pipeline") {
      fetchPipeline(secret, filter);
    }
  }, [filter, authenticated, secret, activeTab, fetchPipeline]);

  // Fetch tutorials when switching to tutorials tab
  useEffect(() => {
    if (authenticated && secret && activeTab === "tutorials") {
      fetchTutorials(secret);
    }
  }, [activeTab, authenticated, secret, fetchTutorials]);

  /* ── Login screen ── */

  if (!authenticated) {
    return (
      <>
        <AdminHeader />
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
      </>
    );
  }

  /* ── Authenticated layout ── */

  return (
    <>
      <AdminHeader />
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Tab switcher */}
        <div className="flex items-center gap-1 border-b border-bc-border">
          {([
            { key: "pipeline" as const, label: "Pipeline" },
            { key: "tutorials" as const, label: "Tutorials" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-bc-primary text-bc-primary"
                  : "border-transparent text-bc-text-secondary hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status banner */}
        {error && (
          <div className="rounded-lg border border-bc-border bg-bc-surface px-4 py-3 text-sm text-foreground">
            {error}
          </div>
        )}

        {activeTab === "pipeline" ? (
          <PipelineView
            data={data}
            loading={loading}
            filter={filter}
            setFilter={setFilter}
            retrying={retrying}
            retryAllLoading={retryAllLoading}
            onRetry={handleRetry}
            onRetryAll={handleRetryAll}
          />
        ) : (
          <TutorialsView
            tutorials={tutorials}
            loading={tutorialsLoading}
            actionLoading={tutorialAction}
            confirmDelete={confirmDelete}
            setConfirmDelete={setConfirmDelete}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        )}
      </div>
    </>
  );
}

/* ───────── Admin Header ───────── */

function AdminHeader() {
  return (
    <nav className="sticky top-0 z-50 border-b border-bc-border bg-bc-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-bold text-bc-primary">
            Battlecat
            <span className="ml-1 text-xs font-normal text-bc-text-secondary">AI</span>
          </Link>
          <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">
            ADMIN
          </span>
        </div>
        <Link
          href="/"
          className="text-sm text-bc-text-secondary hover:text-bc-primary transition-colors"
        >
          Back to site
        </Link>
      </div>
    </nav>
  );
}

/* ───────── Pipeline View ───────── */

function PipelineView({
  data,
  loading,
  filter,
  setFilter,
  retrying,
  retryAllLoading,
  onRetry,
  onRetryAll,
}: {
  data: AdminData | null;
  loading: boolean;
  filter: string;
  setFilter: (f: string) => void;
  retrying: Record<string, boolean>;
  retryAllLoading: boolean;
  onRetry: (id: string) => void;
  onRetryAll: () => void;
}) {
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pipeline Status</h1>
        <button
          onClick={onRetryAll}
          disabled={retryAllLoading || retryableCount === 0}
          className="rounded-lg bg-bc-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-bc-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {retryAllLoading ? "Retrying..." : `Retry All Failed (${retryableCount})`}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatusCard label="Published" count={counts.published ?? 0} color="text-bc-success" />
        <StatusCard label="Failed" count={counts.failed ?? 0} color="text-red-500" />
        <StatusCard label="Dead" count={counts.dead ?? 0} color="text-gray-500" />
        <StatusCard label="In Progress" count={inProgressCount} color="text-blue-500" />
      </div>

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
              onRetry={() => onRetry(sub.id)}
              retrying={retrying[sub.id] ?? false}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-bc-text-secondary">
        Auto-refreshes every 30s {loading && " — refreshing..."}
      </p>
    </div>
  );
}

/* ───────── Tutorials View ───────── */

function TutorialsView({
  tutorials,
  loading,
  actionLoading,
  confirmDelete,
  setConfirmDelete,
  onArchive,
  onDelete,
}: {
  tutorials: TutorialRow[];
  loading: boolean;
  actionLoading: Record<string, boolean>;
  confirmDelete: string | null;
  setConfirmDelete: (id: string | null) => void;
  onArchive: (id: string, action: "archive" | "unarchive") => void;
  onDelete: (id: string) => void;
}) {
  const published = tutorials.filter((t) => t.is_published);
  const archived = tutorials.filter((t) => !t.is_published);

  if (loading) {
    return <p className="py-8 text-center text-bc-text-secondary">Loading tutorials...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tutorials</h1>
        <div className="flex gap-3 text-sm text-bc-text-secondary">
          <span>{published.length} published</span>
          <span>{archived.length} archived</span>
        </div>
      </div>

      {/* Published tutorials */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-bc-text-secondary uppercase tracking-wide">Published</h2>
        {published.length === 0 ? (
          <p className="py-4 text-center text-bc-text-secondary">No published tutorials</p>
        ) : (
          published.map((t) => (
            <TutorialCard
              key={t.id}
              tutorial={t}
              actionLoading={actionLoading[t.id] ?? false}
              confirmDelete={confirmDelete === t.id}
              onArchive={() => onArchive(t.id, "archive")}
              onDelete={() => onDelete(t.id)}
              onConfirmDelete={() => setConfirmDelete(t.id)}
              onCancelDelete={() => setConfirmDelete(null)}
            />
          ))
        )}
      </div>

      {/* Archived tutorials */}
      {archived.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-bc-text-secondary uppercase tracking-wide">Archived</h2>
          {archived.map((t) => (
            <TutorialCard
              key={t.id}
              tutorial={t}
              actionLoading={actionLoading[t.id] ?? false}
              confirmDelete={confirmDelete === t.id}
              onUnarchive={() => onArchive(t.id, "unarchive")}
              onDelete={() => onDelete(t.id)}
              onConfirmDelete={() => setConfirmDelete(t.id)}
              onCancelDelete={() => setConfirmDelete(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────── Shared Components ───────── */

function StatusCard({ label, count, color }: { label: string; count: number; color: string }) {
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
          <div className="flex items-center gap-2">
            <span className={`text-lg ${color}`}>{icon}</span>
            <span className={`text-sm font-medium ${color}`}>{sub.status}</span>
            <span className="text-xs text-bc-text-secondary">{sub.source_type}</span>
          </div>
          <p className="mt-1 truncate font-mono text-sm text-foreground">
            {truncateUrl(sub.url, 70)}
          </p>
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
              <a href={`/tutorials/${sub.tutorial_id}`} className="text-bc-primary hover:underline">
                View tutorial
              </a>
            )}
          </div>
        </div>
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

function TutorialCard({
  tutorial: t,
  actionLoading,
  confirmDelete,
  onArchive,
  onUnarchive,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  tutorial: TutorialRow;
  actionLoading: boolean;
  confirmDelete: boolean;
  onArchive?: () => void;
  onUnarchive?: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-bc-border bg-bc-surface px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white"
              style={{
                backgroundColor: ["#9CA3AF", "#14B8A6", "#22C55E", "#F59E0B", "#D4960A"][t.maturity_level] ?? "#9CA3AF",
              }}
            >
              L{t.maturity_level}
            </span>
            <span className="text-sm font-medium text-foreground truncate">{t.title}</span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-bc-text-secondary">
            <span className="font-mono">{t.slug}</span>
            <span>{timeAgo(t.created_at)}</span>
            <a href={`/tutorials/${t.slug}`} className="text-bc-primary hover:underline" target="_blank" rel="noopener noreferrer">
              View
            </a>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actionLoading ? (
            <span className="text-xs text-bc-text-secondary">...</span>
          ) : confirmDelete ? (
            <>
              <span className="text-xs text-red-500">Delete forever?</span>
              <button
                onClick={onDelete}
                className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
              >
                Yes
              </button>
              <button
                onClick={onCancelDelete}
                className="rounded-md border border-bc-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-bc-primary"
              >
                No
              </button>
            </>
          ) : (
            <>
              {onArchive && (
                <button
                  onClick={onArchive}
                  className="rounded-md border border-bc-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-yellow-500 hover:text-yellow-500"
                >
                  Archive
                </button>
              )}
              {onUnarchive && (
                <button
                  onClick={onUnarchive}
                  className="rounded-md border border-bc-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-bc-primary hover:text-bc-primary"
                >
                  Unarchive
                </button>
              )}
              <button
                onClick={onConfirmDelete}
                className="rounded-md border border-bc-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-red-500 hover:text-red-500"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
