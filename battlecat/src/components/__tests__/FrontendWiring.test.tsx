import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import "@testing-library/jest-dom";

// ─── Mock next/link ─────────────────────────────────────────────────────────
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// ─── Mock hooks used by TutorialActions ─────────────────────────────────────
vi.mock("@/hooks/useBookmarks", () => ({
  useBookmarks: () => ({
    toggle: vi.fn(),
    isBookmarked: () => false,
    bookmarks: new Set(),
    loaded: true,
  }),
}));

vi.mock("@/hooks/useProgress", () => ({
  useProgress: () => ({
    getEntry: () => ({ completed: false, completedAt: null, notes: "" }),
    toggleCompleted: vi.fn(),
    setNotes: vi.fn(),
    isCompleted: () => false,
    completedCount: 0,
    loaded: true,
  }),
}));

vi.mock("@/components/AchievementProvider", () => ({
  useAchievementContext: () => ({
    trackRead: vi.fn(),
    trackSubmission: vi.fn(),
    trackQuizComplete: vi.fn(),
    recheckAchievements: vi.fn(),
    totalPoints: 0,
  }),
}));

vi.mock("@/components/MossManBadge", () => ({
  MossManBadge: ({ tutorialId }: { tutorialId: string }) => (
    <div data-testid="moss-man-badge">{tutorialId}</div>
  ),
  StaleOverlay: () => <div data-testid="stale-overlay" />,
}));

// ─── Mock sub-components used by TutorialCard ───────────────────────────────
vi.mock("@/components/LevelBadge", () => ({
  LevelBadge: () => <span data-testid="level-badge" />,
}));

vi.mock("@/components/ToolBadge", () => ({
  ToolBadge: ({ tool }: { tool: string }) => (
    <span data-testid="tool-badge">{tool}</span>
  ),
}));

vi.mock("@/components/ImpactScoreBadge", () => ({
  ImpactScoreBadge: () => <span data-testid="impact-score-badge" />,
}));

// ─── Mock HTMLMediaElement methods (needed by ListenButton) ─────────────────
beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
  HTMLMediaElement.prototype.load = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ─── Import components under test ───────────────────────────────────────────
import { TutorialCard } from "../TutorialCard";
import { TutorialActions } from "../TutorialActions";
import type { Tutorial } from "@/types";

// ─── Helper: Build a minimal Tutorial object ────────────────────────────────
function makeTutorial(overrides: Partial<Tutorial> = {}): Tutorial {
  return {
    id: "test-id-1",
    slug: "test-tutorial",
    title: "Test Tutorial",
    summary: "A test summary",
    body: "Tutorial body content",
    maturity_level: 1,
    level_relation: "level-up",
    topics: ["AI"],
    tags: ["test"],
    tools_mentioned: [],
    difficulty: "beginner",
    action_items: [],
    source_urls: [],
    source_count: 1,
    image_url: null,
    audio_url: null,
    is_stale: false,
    is_hot_news: false,
    hot_news_headline: null,
    hot_news_teaser: null,
    is_published: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// =============================================================================
// TutorialCard + ListenButton wiring tests
// =============================================================================
describe("TutorialCard: ListenButton icon wiring", () => {
  it("shows ListenButton icon when audio_url exists", () => {
    const tutorial = makeTutorial({
      audio_url: "/audio/test.mp3",
    });

    render(<TutorialCard tutorial={tutorial} />);

    // ListenButton renders with aria-label "Play tutorial audio"
    const listenButton = screen.getByLabelText("Play tutorial audio");
    expect(listenButton).toBeInTheDocument();
  });

  it("hides ListenButton when audio_url is null", () => {
    const tutorial = makeTutorial({
      audio_url: null,
    });

    render(<TutorialCard tutorial={tutorial} />);

    // ListenButton should not be in the DOM
    const listenButton = screen.queryByLabelText("Play tutorial audio");
    expect(listenButton).not.toBeInTheDocument();
  });

  it("hides ListenButton when audio_url is empty string", () => {
    const tutorial = makeTutorial({
      audio_url: "" as unknown as null, // edge case: empty string
    });

    render(<TutorialCard tutorial={tutorial} />);

    const listenButton = screen.queryByLabelText("Play tutorial audio");
    expect(listenButton).not.toBeInTheDocument();
  });
});

// =============================================================================
// TutorialActions + ListenButton bar wiring tests
// =============================================================================
describe("TutorialActions: ListenButton bar wiring", () => {
  it("shows ListenButton bar when audioUrl is provided", () => {
    render(
      <TutorialActions
        tutorialId="test-id"
        tutorialTitle="Test Tutorial"
        tutorialSlug="test-tutorial"
        audioUrl="/audio/test.mp3"
      />
    );

    // ListenButton bar variant renders "Listen" text
    const listenButton = screen.getByText("Listen");
    expect(listenButton).toBeInTheDocument();
  });

  it("hides ListenButton when audioUrl is not provided", () => {
    render(
      <TutorialActions
        tutorialId="test-id"
        tutorialTitle="Test Tutorial"
        tutorialSlug="test-tutorial"
      />
    );

    // No "Listen" button should appear
    const listenButton = screen.queryByText("Listen");
    expect(listenButton).not.toBeInTheDocument();
  });

  it("ListenButton bar appears between Bookmark and Mark Complete", () => {
    const { container } = render(
      <TutorialActions
        tutorialId="test-id"
        tutorialTitle="Test Tutorial"
        tutorialSlug="test-tutorial"
        audioUrl="/audio/test.mp3"
      />
    );

    // Get the flex container that holds the action buttons
    const buttonContainer = container.querySelector(".flex.flex-wrap.gap-2");
    expect(buttonContainer).toBeInTheDocument();

    // Get all buttons (and button-like elements) in DOM order
    const allButtons = buttonContainer!.querySelectorAll("button");
    const buttonTexts = Array.from(allButtons).map(
      (btn) => btn.textContent?.trim() || btn.getAttribute("aria-label") || ""
    );

    // Find indices of Bookmark, Listen, and Mark Complete
    const bookmarkIndex = buttonTexts.findIndex((t) => t === "Bookmark");
    const listenIndex = buttonTexts.findIndex(
      (t) => t === "Listen" || t === "Play tutorial audio"
    );
    const markCompleteIndex = buttonTexts.findIndex(
      (t) => t === "Mark Complete"
    );

    // Listen should come after Bookmark and before Mark Complete
    expect(bookmarkIndex).toBeGreaterThanOrEqual(0);
    expect(listenIndex).toBeGreaterThanOrEqual(0);
    expect(markCompleteIndex).toBeGreaterThanOrEqual(0);
    expect(listenIndex).toBeGreaterThan(bookmarkIndex);
    expect(listenIndex).toBeLessThan(markCompleteIndex);
  });
});
