"use client";

import { useEffect, useState } from "react";
import { Achievement, getPowerTier } from "@/config/achievements";

/**
 * The Sorceress of Castle Grayskull — SVG portrait.
 *
 * Falcon headdress with spread wings, teal/white robes,
 * mystical golden eyes, and an aura of ancient power.
 */
function SorceressIcon({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 140" fill="none">
      {/* Mystical glow aura */}
      <ellipse cx="64" cy="80" rx="50" ry="55" fill="url(#sorceressGlow)" opacity={0.3} />

      {/* Falcon wings — spread out from headdress */}
      <path
        d="M64 30 Q30 10 8 28 Q15 38 28 42 Q20 32 34 28 Q42 36 50 40z"
        fill="#0D9488"
        opacity={0.9}
      />
      <path
        d="M64 30 Q98 10 120 28 Q113 38 100 42 Q108 32 94 28 Q86 36 78 40z"
        fill="#0D9488"
        opacity={0.9}
      />
      {/* Wing inner detail */}
      <path
        d="M64 32 Q38 18 18 30 Q30 36 40 38z"
        fill="#14B8A6"
        opacity={0.6}
      />
      <path
        d="M64 32 Q90 18 110 30 Q98 36 88 38z"
        fill="#14B8A6"
        opacity={0.6}
      />

      {/* Headdress — falcon crest */}
      <path
        d="M52 40 Q56 18 64 12 Q72 18 76 40z"
        fill="#0D9488"
      />
      <path
        d="M56 38 Q60 22 64 16 Q68 22 72 38z"
        fill="#14B8A6"
        opacity={0.7}
      />
      {/* Headdress gem */}
      <circle cx="64" cy="32" r="3" fill="#FCD34D" />
      <circle cx="64" cy="32" r="1.5" fill="#FBBF24" />

      {/* Face */}
      <ellipse cx="64" cy="52" rx="14" ry="16" fill="#FECACA" />
      <ellipse cx="64" cy="53" rx="13" ry="15" fill="#FEE2E2" />

      {/* Eyes — golden, mystical */}
      <ellipse cx="58" cy="50" rx="3" ry="2.5" fill="white" />
      <ellipse cx="70" cy="50" rx="3" ry="2.5" fill="white" />
      <circle cx="58" cy="50" r="1.8" fill="#D97706" />
      <circle cx="70" cy="50" r="1.8" fill="#D97706" />
      <circle cx="58" cy="50" r="0.8" fill="#92400E" />
      <circle cx="70" cy="50" r="0.8" fill="#92400E" />
      {/* Eye highlights */}
      <circle cx="59" cy="49" r="0.6" fill="white" opacity={0.8} />
      <circle cx="71" cy="49" r="0.6" fill="white" opacity={0.8} />

      {/* Eyebrows */}
      <path d="M54 46q4-2 8 0" stroke="#92400E" strokeWidth="0.8" fill="none" />
      <path d="M66 46q4-2 8 0" stroke="#92400E" strokeWidth="0.8" fill="none" />

      {/* Gentle smile */}
      <path d="M59 57q5 3 10 0" stroke="#B91C1C" strokeWidth="0.8" fill="none" strokeLinecap="round" />

      {/* Hair flowing from headdress */}
      <path d="M50 44q-6 10-8 30q2-8 6-14" stroke="#1E3A5F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M78 44q6 10 8 30q-2-8-6-14" stroke="#1E3A5F" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Headdress side pieces — falcon cheeks */}
      <path d="M50 40q-2 4-4 8q4-2 8-2z" fill="#0D9488" />
      <path d="M78 40q2 4 4 8q-4-2-8-2z" fill="#0D9488" />

      {/* Body — white/teal robes */}
      <path
        d="M46 68 Q44 100 42 120 Q64 128 86 120 Q84 100 82 68 Q72 72 64 72 Q56 72 46 68z"
        fill="white"
      />
      {/* Robe teal accent band */}
      <path
        d="M48 72 Q56 76 64 76 Q72 76 80 72 L78 82 Q70 86 64 86 Q58 86 50 82z"
        fill="#0D9488"
        opacity={0.8}
      />
      {/* Chest medallion */}
      <circle cx="64" cy="80" r="4" fill="#0D9488" />
      <circle cx="64" cy="80" r="2.5" fill="#FCD34D" />
      <circle cx="64" cy="80" r="1" fill="#FBBF24" />

      {/* Arms */}
      <path d="M46 72q-10 8-14 20" stroke="#FEE2E2" strokeWidth="4" strokeLinecap="round" />
      <path d="M82 72q10 8 14 20" stroke="#FEE2E2" strokeWidth="4" strokeLinecap="round" />
      {/* Bracers */}
      <path d="M34 88q-2 4-2 6" stroke="#0D9488" strokeWidth="4" strokeLinecap="round" />
      <path d="M94 88q2 4 2 6" stroke="#0D9488" strokeWidth="4" strokeLinecap="round" />

      {/* Robe bottom detail */}
      <path d="M46 110q18 6 36 0" stroke="#0D9488" strokeWidth="1" fill="none" opacity={0.5} />
      <path d="M44 118q20 8 40 0" stroke="#0D9488" strokeWidth="1" fill="none" opacity={0.5} />

      <defs>
        <radialGradient id="sorceressGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity={0} />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─── Celebration Modal ───────────────────────────────────────────────────────

interface SorceressModalProps {
  /** Queue of achievements to celebrate, shown one at a time */
  achievements: Achievement[];
  totalPoints: number;
  onDismiss: () => void;
}

export function SorceressModal({
  achievements,
  totalPoints,
  onDismiss,
}: SorceressModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const current = achievements[currentIndex];
  const tier = getPowerTier(totalPoints);

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Reset visibility when moving to next achievement
  useEffect(() => {
    setIsVisible(true);
  }, [currentIndex]);

  if (!current) return null;

  function handleNext() {
    if (currentIndex < achievements.length - 1) {
      setIsVisible(false);
      setTimeout(() => setCurrentIndex((i) => i + 1), 200);
    } else {
      setIsVisible(false);
      setTimeout(onDismiss, 200);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleNext}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md rounded-2xl border border-teal-700/50 bg-gradient-to-b from-bc-surface via-bc-surface to-teal-950/20 p-6 shadow-2xl transition-all duration-500 ${
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Glow ring */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-teal-400/20 via-transparent to-teal-400/10 pointer-events-none" />

        {/* Counter (if multiple) */}
        {achievements.length > 1 && (
          <div className="absolute top-4 right-4 text-xs text-bc-text-secondary">
            {currentIndex + 1} / {achievements.length}
          </div>
        )}

        {/* Sorceress portrait */}
        <div className="flex justify-center -mt-2 mb-2">
          <div className="relative">
            <SorceressIcon size={100} />
            {/* Sparkle particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-teal-300 rounded-full animate-ping"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${10 + Math.random() * 60}%`,
                    animationDelay: `${i * 0.4}s`,
                    animationDuration: "2s",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Achievement name */}
        <div className="text-center space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-teal-400">
            Achievement Unlocked
          </p>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-300 to-amber-300 bg-clip-text text-transparent">
            {current.name}
          </h2>
          <p className="text-sm text-bc-text-secondary">{current.description}</p>
        </div>

        {/* Points earned */}
        {current.points > 0 && (
          <div className="flex justify-center mt-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-900/30 border border-amber-700/40 px-3 py-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#FCD34D">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              <span className="text-sm font-bold text-amber-300">
                +{current.points} Points of Power
              </span>
            </div>
          </div>
        )}

        {/* Sorceress message */}
        <div className="mt-4 rounded-xl bg-teal-950/30 border border-teal-800/30 p-4">
          <p className="text-sm leading-relaxed text-teal-100/90 italic">
            &ldquo;{current.sorceressMessage}&rdquo;
          </p>
          <p className="text-xs text-teal-400/70 mt-2 text-right">
            — The Sorceress of Castle Grayskull
          </p>
        </div>

        {/* Power tier */}
        <div className="mt-4 text-center">
          <p className="text-xs text-bc-text-secondary">
            Your rank:{" "}
            <span className="font-semibold" style={{ color: tier.color }}>
              {tier.name}
            </span>
            {" "}&bull; {totalPoints} Points of Power
          </p>
        </div>

        {/* Button */}
        <button
          onClick={handleNext}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 py-2.5 text-sm font-semibold text-white transition-all hover:from-teal-500 hover:to-teal-400 active:scale-[0.98]"
        >
          {currentIndex < achievements.length - 1
            ? "Next Achievement"
            : "Continue Your Journey"}
        </button>
      </div>
    </div>
  );
}
