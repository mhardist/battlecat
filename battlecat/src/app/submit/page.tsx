"use client";

import { useState } from "react";
import { useAchievementContext } from "@/components/AchievementProvider";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function SubmitPage() {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [hotNews, setHotNews] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const { trackSubmission } = useAchievementContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) return;

    // Basic URL validation
    try {
      new URL(url.trim());
    } catch {
      setMessage("Please enter a valid URL.");
      setState("error");
      return;
    }

    setState("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), note: note.trim(), hot_news: hotNews }),
      });

      if (!res.ok) {
        throw new Error("Submission failed");
      }

      setState("success");
      setMessage("Link received! Battlecat is processing it.");
      trackSubmission();
      setUrl("");
      setNote("");
      setHotNews(false);

      // Reset after a few seconds
      setTimeout(() => {
        setState("idle");
        setMessage("");
      }, 5000);
    } catch {
      setState("error");
      setMessage(
        "Something went wrong. The processing pipeline isn't connected yet — but it will be soon."
      );
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Submit a Link</h1>
        <p className="text-bc-text-secondary">
          Paste a TikTok, article, tweet, or any AI-related link. Battlecat
          will extract the content, classify it by maturity level, and turn it
          into a tutorial.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL Input */}
        <div>
          <label
            htmlFor="url"
            className="mb-1 block text-sm font-medium"
          >
            Link
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            required
            className="w-full rounded-lg border border-bc-border bg-bc-surface px-4 py-3 text-lg outline-none transition-colors focus:border-bc-primary focus:ring-2 focus:ring-bc-primary/20"
          />
        </div>

        {/* Optional Note */}
        <div>
          <label
            htmlFor="note"
            className="mb-1 block text-sm font-medium"
          >
            Note{" "}
            <span className="text-bc-text-secondary">(optional)</span>
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any context about this link..."
            rows={3}
            className="w-full rounded-lg border border-bc-border bg-bc-surface px-4 py-3 outline-none transition-colors focus:border-bc-primary focus:ring-2 focus:ring-bc-primary/20"
          />
        </div>

        {/* Hot News Toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <button
            type="button"
            role="switch"
            aria-checked={hotNews}
            onClick={() => setHotNews(!hotNews)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
              hotNews ? "bg-red-500" : "bg-bc-border"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                hotNews ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm font-medium">
            Flag as Hot News
          </span>
          {hotNews && (
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={state === "submitting" || !url.trim()}
          className="w-full rounded-lg bg-bc-primary px-6 py-3 font-semibold text-white transition-all hover:bg-bc-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "submitting" ? "Processing..." : "Submit Link"}
        </button>

        {/* Status Message */}
        {message && (
          <div
            className={`rounded-lg p-4 text-sm ${
              state === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
            }`}
          >
            {message}
          </div>
        )}
      </form>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">How it works</h2>
        <div className="grid gap-3">
          {[
            {
              step: "1",
              title: "Paste a link",
              desc: "TikTok, article, tweet, YouTube — anything AI-related.",
            },
            {
              step: "2",
              title: "Battlecat extracts the content",
              desc: "We pull the text, transcribe audio, and grab the key info.",
            },
            {
              step: "3",
              title: "AI classifies and generates",
              desc: "Claude reads the content, assigns a maturity level (L0–L4), and writes a step-by-step tutorial.",
            },
            {
              step: "4",
              title: "Published and organized",
              desc: "The tutorial appears on the site, tagged, searchable, and ready to share.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex gap-4 rounded-lg border border-bc-border bg-bc-surface p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bc-primary text-sm font-bold text-white">
                {item.step}
              </div>
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="text-sm text-bc-text-secondary">
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SMS Note */}
      <div className="rounded-lg border border-bc-secondary/30 bg-bc-secondary/5 p-4 text-sm text-bc-text-secondary">
        <strong className="text-bc-secondary">Pro tip:</strong> You can also
        text links directly to your Battlecat phone number from your iPhone.
        Same pipeline, faster workflow. Prefix with{" "}
        <code className="rounded bg-bc-border/50 px-1.5 py-0.5 text-xs font-mono">HOT:</code>{" "}
        to flag as hot news.
      </div>
    </div>
  );
}
