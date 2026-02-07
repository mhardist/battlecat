"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAllLevels } from "@/config/levels";
import { Tutorial } from "@/types";
import { TutorialCard } from "@/components/TutorialCard";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useRatings } from "@/hooks/useRatings";
import {
  QUIZ_QUESTIONS,
  LEVEL_RESULTS,
  calculateLevel,
} from "@/config/quiz";
import { useAchievementContext } from "@/components/AchievementProvider";

type QuizState = "welcome" | "quiz" | "results";

const STORAGE_KEY = "battlecat-quiz-level";

export default function LevelUpPage() {
  const levels = getAllLevels();
  const { toggle, isBookmarked, loaded: bookmarksLoaded } = useBookmarks();
  const { getRating, loaded: ratingsLoaded } = useRatings();
  const { trackQuizComplete } = useAchievementContext();
  const clientReady = bookmarksLoaded && ratingsLoaded;

  const [quizState, setQuizState] = useState<QuizState>("welcome");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [resultLevel, setResultLevel] = useState<number>(0);
  const [fadeClass, setFadeClass] = useState("opacity-100");
  const [allTutorials, setAllTutorials] = useState<Tutorial[]>([]);

  // Check for stored result
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const level = parseInt(stored, 10);
      if (!isNaN(level) && level >= 0 && level <= 4) {
        setResultLevel(level);
        setQuizState("results");
      }
    }
  }, []);

  // Fetch tutorials for results page
  useEffect(() => {
    fetch("/api/tutorials")
      .then((r) => r.json())
      .then((data) => {
        if (data.tutorials) setAllTutorials(data.tutorials);
      })
      .catch(console.error);
  }, []);

  const handleAnswer = useCallback(
    (level: number) => {
      const question = QUIZ_QUESTIONS[currentQ];
      const newAnswers = { ...answers, [question.id]: level };
      setAnswers(newAnswers);

      if (currentQ < QUIZ_QUESTIONS.length - 1) {
        // Fade transition
        setFadeClass("opacity-0 translate-x-4");
        setTimeout(() => {
          setCurrentQ((q) => q + 1);
          setFadeClass("opacity-0 -translate-x-4");
          setTimeout(() => setFadeClass("opacity-100 translate-x-0"), 50);
        }, 200);
      } else {
        // Calculate result
        const level = calculateLevel(newAnswers);
        setResultLevel(level);
        localStorage.setItem(STORAGE_KEY, String(level));
        trackQuizComplete();
        setFadeClass("opacity-0");
        setTimeout(() => {
          setQuizState("results");
          setFadeClass("opacity-100");
        }, 300);
      }
    },
    [currentQ, answers, trackQuizComplete]
  );

  const startQuiz = () => {
    setAnswers({});
    setCurrentQ(0);
    setFadeClass("opacity-0");
    setTimeout(() => {
      setQuizState("quiz");
      setFadeClass("opacity-100");
    }, 200);
  };

  const retakeQuiz = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAnswers({});
    setCurrentQ(0);
    setFadeClass("opacity-0");
    setTimeout(() => {
      setQuizState("welcome");
      setFadeClass("opacity-100");
    }, 200);
  };

  const handleShare = () => {
    const result = LEVEL_RESULTS[resultLevel];
    const text = `${result.headline} on the AI Maturity Framework! Find your level at battlecat.ai/level-up`;
    if (navigator.share) {
      navigator.share({ text, url: "https://battlecat.ai/level-up" }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert("Copied to clipboard!");
      });
    }
  };

  // Filter tutorials for results
  const levelUpTutorials = allTutorials.filter(
    (t) => t.level_relation === "level-up" && t.maturity_level === resultLevel
  );
  const practiceTutorials = allTutorials.filter(
    (t) => t.maturity_level === resultLevel && t.level_relation === "level-practice"
  );

  const levelColor = levels[resultLevel]?.color || "#9CA3AF";
  const result = LEVEL_RESULTS[resultLevel];

  // ─── Welcome Screen ───
  if (quizState === "welcome") {
    return (
      <div
        className={`flex min-h-[60vh] flex-col items-center justify-center text-center space-y-8 transition-all duration-300 ${fadeClass}`}
      >
        <div className="space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-bc-primary/10">
            <svg
              className="h-10 w-10 text-bc-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Where are you on your{" "}
            <span className="text-bc-primary">AI journey?</span>
          </h1>
          <p className="mx-auto max-w-md text-lg text-bc-text-secondary">
            Take 60 seconds to find out. Six questions, instant results, personalized
            tutorial recommendations.
          </p>
        </div>

        <button
          onClick={startQuiz}
          className="rounded-xl bg-bc-primary px-8 py-4 text-lg font-semibold text-white transition-all hover:shadow-lg hover:shadow-bc-primary/25 hover:-translate-y-0.5"
        >
          Find My Level
        </button>

        {/* Level preview */}
        <div className="flex gap-2 mt-4">
          {levels.map((l) => (
            <div
              key={l.level}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="h-2 w-8 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              <span className="text-[10px] text-bc-text-secondary">
                L{l.level}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Quiz Questions ───
  if (quizState === "quiz") {
    const question = QUIZ_QUESTIONS[currentQ];
    const progress = ((currentQ + 1) / QUIZ_QUESTIONS.length) * 100;

    return (
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-bc-text-secondary">
            <span>
              Question {currentQ + 1} of {QUIZ_QUESTIONS.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-bc-border/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-bc-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div
          className={`space-y-6 transition-all duration-200 ease-out ${fadeClass}`}
        >
          <h2 className="text-2xl font-bold">{question.question}</h2>

          <div className="grid gap-3">
            {question.answers.map((answer, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(answer.level)}
                className="group w-full text-left rounded-xl border-2 border-bc-border bg-bc-surface p-4 transition-all hover:border-bc-primary hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-bc-border text-sm font-bold text-bc-text-secondary group-hover:border-bc-primary group-hover:text-bc-primary transition-colors">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-medium group-hover:text-bc-primary transition-colors">
                    {answer.text}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Results ───
  return (
    <div
      className={`space-y-10 transition-all duration-300 ${fadeClass}`}
    >
      {/* Result header */}
      <section className="text-center space-y-4">
        <div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-bold text-white"
          style={{ backgroundColor: levelColor }}
        >
          L{resultLevel}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold">{result.headline}</h1>
        <p className="mx-auto max-w-xl text-lg text-bc-text-secondary">
          {result.description}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleShare}
            className="rounded-lg bg-bc-primary px-5 py-2.5 font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-bc-primary/25"
          >
            Share Your Level
          </button>
          <button
            onClick={retakeQuiz}
            className="rounded-lg border-2 border-bc-border px-5 py-2.5 font-semibold text-bc-text-secondary transition-colors hover:border-bc-primary hover:text-bc-primary"
          >
            Retake Quiz
          </button>
        </div>
      </section>

      {/* Level-Up Tutorials */}
      {levelUpTutorials.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">
            Learn Next{" "}
            <span className="text-sm font-normal text-bc-text-secondary">
              (how to reach L{Math.min(resultLevel + 1, 4)})
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {levelUpTutorials.map((tutorial) => (
              <TutorialCard
                key={tutorial.id}
                tutorial={tutorial}
                showBookmark={clientReady}
                isBookmarked={clientReady ? isBookmarked(tutorial.id) : false}
                onToggleBookmark={toggle}
                rating={clientReady ? getRating(tutorial.id) : 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* Practice Tutorials */}
      {practiceTutorials.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">
            Deepen Your L{resultLevel} Skills
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {practiceTutorials.map((tutorial) => (
              <TutorialCard
                key={tutorial.id}
                tutorial={tutorial}
                showBookmark={clientReady}
                isBookmarked={clientReady ? isBookmarked(tutorial.id) : false}
                onToggleBookmark={toggle}
                rating={clientReady ? getRating(tutorial.id) : 0}
              />
            ))}
          </div>
        </section>
      )}

      {levelUpTutorials.length === 0 && practiceTutorials.length === 0 && (
        <section className="rounded-xl border border-dashed border-bc-border bg-bc-surface p-12 text-center">
          <p className="text-bc-text-secondary">
            No L{resultLevel} tutorials yet. Forward content about{" "}
            {levels[resultLevel]?.tools.join(", ")} to populate this view.
          </p>
          <Link
            href="/submit"
            className="mt-4 inline-block rounded-lg bg-bc-primary px-5 py-2.5 font-semibold text-white"
          >
            Submit a Link
          </Link>
        </section>
      )}

      {/* Level details link */}
      <div className="text-center pt-4">
        <Link
          href={`/levels/${resultLevel}`}
          className="text-sm text-bc-primary hover:underline"
        >
          View all L{resultLevel} details &rarr;
        </Link>
      </div>
    </div>
  );
}
