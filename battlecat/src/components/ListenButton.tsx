"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface ListenButtonProps {
  audioUrl: string | null | undefined;
  variant: "icon" | "bar";
  tutorialTitle?: string;
  imageUrl?: string | null;
}

type PlaybackState = "idle" | "loading" | "playing";

export function ListenButton({
  audioUrl,
  variant,
  tutorialTitle,
  imageUrl,
}: ListenButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [error, setError] = useState(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPlaying = playbackState === "playing";
  const isLoading = playbackState === "loading";

  // ─── Cleanup on unmount (FE-10) ─────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    const errorTimer = errorTimerRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      if (errorTimer) {
        clearTimeout(errorTimer);
      }
    };
  }, []);

  // ─── MediaSession setup (FE-11, FE-12, FE-13) ──────────────────────────
  useEffect(() => {
    if (!audioUrl) return;
    if (!("mediaSession" in navigator)) return;

    // FE-12: MediaSession metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: tutorialTitle || "Tutorial Audio",
      artist: "Battlecat AI",
      ...(imageUrl
        ? {
            artwork: [
              { src: imageUrl, sizes: "256x256", type: "image/png" },
            ],
          }
        : {}),
    });

    // FE-11: MediaSession action handlers
    const handlePlay = () => {
      audioRef.current?.play();
    };
    const handlePause = () => {
      audioRef.current?.pause();
      setPlaybackState("idle");
    };
    const handleStop = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlaybackState("idle");
    };

    navigator.mediaSession.setActionHandler("play", handlePlay);
    navigator.mediaSession.setActionHandler("pause", handlePause);
    navigator.mediaSession.setActionHandler("stop", handleStop);

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
    };
  }, [audioUrl, tutorialTitle, imageUrl]);

  // ─── Update MediaSession playback state (FE-13) ────────────────────────
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (isPlaying) {
      navigator.mediaSession.playbackState = "playing";
    } else {
      navigator.mediaSession.playbackState = "paused";
    }
  }, [isPlaying]);

  // ─── Play / Pause toggle ───────────────────────────────────────────────
  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying || isLoading) {
      // Pause
      audio.pause();
      setPlaybackState("idle");
    } else {
      // Play
      setError(false);

      // FE-6: Dispatch custom event
      window.dispatchEvent(
        new CustomEvent("battlecat-audio-play", {
          detail: { audioUrl },
        })
      );

      // FE-18: Loading state
      setPlaybackState("loading");

      audio.play().then(
        () => {
          setPlaybackState("playing");
        },
        () => {
          // play() rejected (e.g. user gesture required)
          setPlaybackState("idle");
          setError(true);
          errorTimerRef.current = setTimeout(() => setError(false), 3000);
        }
      );
    }
  }, [audioUrl, isPlaying, isLoading]);

  // ─── Event handlers ────────────────────────────────────────────────────
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // FE-9: icon variant prevents default + stops propagation (for Link wrappers)
      if (variant === "icon") {
        e.preventDefault();
        e.stopPropagation();
      }
      togglePlayback();
    },
    [variant, togglePlayback]
  );

  // FE-16: Keyboard Enter/Space
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (variant === "icon") {
          e.stopPropagation();
        }
        togglePlayback();
      }
    },
    [variant, togglePlayback]
  );

  // FE-8: Error event on <audio> resets playing state
  const handleAudioError = useCallback(() => {
    setPlaybackState("idle");
    setError(true);
    // FE-17: Reset error after 3s
    errorTimerRef.current = setTimeout(() => setError(false), 3000);
  }, []);

  const handleAudioEnded = useCallback(() => {
    setPlaybackState("idle");
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  }, []);

  // ─── Listen for other instances playing (stop this one) ─────────────────
  useEffect(() => {
    if (!audioUrl) return;
    const handleOtherPlay = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.audioUrl !== audioUrl) {
        audioRef.current?.pause();
        setPlaybackState("idle");
      }
    };
    window.addEventListener("battlecat-audio-play", handleOtherPlay);
    return () => {
      window.removeEventListener("battlecat-audio-play", handleOtherPlay);
    };
  }, [audioUrl]);

  // FE-5: Return null when audioUrl is falsy
  if (!audioUrl) {
    return null;
  }

  // ─── FE-14: Dynamic aria-label ──────────────────────────────────────────
  const ariaLabel =
    isPlaying || isLoading
      ? "Pause tutorial audio"
      : "Play tutorial audio";

  // ─── SVG Icons ──────────────────────────────────────────────────────────
  const speakerIcon = (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.5H4a1 1 0 00-1 1v5a1 1 0 001 1h2.5l4.5 4V4.5l-4.5 4z"
      />
    </svg>
  );

  const pauseIcon = (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 9v6m4-6v6"
      />
    </svg>
  );

  const currentIcon = isPlaying || isLoading ? pauseIcon : speakerIcon;

  // ─── FE-17: Error text ─────────────────────────────────────────────────
  const getLabel = () => {
    if (error) return "Audio unavailable";
    if (isPlaying) return "Pause";
    if (isLoading) return "Loading...";
    return "Listen";
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  if (variant === "icon") {
    // FE-1: Icon variant — compact speaker icon matching bookmark icon sizing
    return (
      <>
        <button
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel}
          aria-pressed={isPlaying || isLoading}
          className={`shrink-0 p-1 text-bc-text-secondary transition-colors ${
            isPlaying
              ? "text-bc-primary"
              : "hover:text-bc-primary"
          } ${isLoading ? "animate-pulse" : ""} ${
            error ? "text-red-500" : ""
          }`}
        >
          {currentIcon}
        </button>
        {/* FE-7: Hidden audio element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          className="hidden"
          preload="none"
          onError={handleAudioError}
          onEnded={handleAudioEnded}
        />
      </>
    );
  }

  // FE-2: Bar variant — icon + text label, matching TutorialActions.tsx pattern
  return (
    <>
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        aria-pressed={isPlaying || isLoading}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          isPlaying
            ? "border-bc-primary bg-bc-primary/10 text-bc-primary"
            : error
              ? "border-red-500/50 bg-red-500/10 text-red-500"
              : "border-bc-border text-bc-text-secondary hover:border-bc-primary hover:text-bc-primary"
        } ${isLoading ? "animate-pulse" : ""}`}
      >
        {currentIcon}
        {getLabel()}
      </button>
      {/* FE-7: Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        className="hidden"
        preload="none"
        onError={handleAudioError}
        onEnded={handleAudioEnded}
      />
    </>
  );
}
