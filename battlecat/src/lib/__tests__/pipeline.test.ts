import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Submission } from "@/types";

// ---------------------------------------------------------------------------
// Mock Supabase
// ---------------------------------------------------------------------------

const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();

function createChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.overlaps = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.or = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  return chain;
}

let supabaseChain = createChain();

// Mock sleep to be instant in tests
vi.mock("@/lib/pipeline-errors", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pipeline-errors")>();
  return {
    ...actual,
    sleep: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/supabase", () => ({
  createServerClient: () => ({
    from: (table: string) => {
      mockFrom(table);
      return supabaseChain;
    },
  }),
}));

// ---------------------------------------------------------------------------
// Mock pipeline steps
// ---------------------------------------------------------------------------

const mockStepExtract = vi.fn();
const mockStepClassify = vi.fn();
const mockStepGenerate = vi.fn();
const mockStepPublish = vi.fn();

vi.mock("@/lib/pipeline-steps", () => ({
  stepExtract: (...args: unknown[]) => mockStepExtract(...args),
  stepClassify: (...args: unknown[]) => mockStepClassify(...args),
  stepGenerate: (...args: unknown[]) => mockStepGenerate(...args),
  stepPublish: (...args: unknown[]) => mockStepPublish(...args),
}));

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------

const { advanceSubmission } = await import("@/lib/pipeline");
const { PipelineError } = await import("@/lib/pipeline-errors");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: "sub-123",
    phone_number: "+1234567890",
    raw_message: "https://example.com",
    url: "https://example.com/article",
    source_type: "article",
    status: "received",
    retry_count: 0,
    max_retries: 3,
    last_step: null,
    last_error: null,
    extracted_text: null,
    classification: null,
    generated_tutorial: null,
    tutorial_id: null,
    started_at: null,
    completed_at: null,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("advanceSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseChain = createChain();
  });

  it("returns not_found when submission does not exist", async () => {
    supabaseChain.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" },
    });

    const result = await advanceSubmission("missing-id");
    expect(result.success).toBe(false);
    expect(result.status).toBe("not_found");
  });

  it("returns immediately for already-published submissions", async () => {
    const sub = makeSubmission({ status: "published", tutorial_id: "tut-1" });
    supabaseChain.single.mockResolvedValueOnce({ data: sub, error: null });

    const result = await advanceSubmission("sub-123");
    expect(result.success).toBe(true);
    expect(result.status).toBe("published");
    expect(result.tutorialId).toBe("tut-1");
  });

  it("returns immediately for dead submissions", async () => {
    const sub = makeSubmission({ status: "dead", last_error: "private video" });
    supabaseChain.single.mockResolvedValueOnce({ data: sub, error: null });

    const result = await advanceSubmission("sub-123");
    expect(result.success).toBe(false);
    expect(result.status).toBe("dead");
  });

  it("runs extract step for received submissions", async () => {
    const sub = makeSubmission({ status: "received" });

    // First call: fetch submission
    supabaseChain.single.mockResolvedValueOnce({ data: sub, error: null });

    // Mock extract step succeeding
    mockStepExtract.mockResolvedValueOnce({
      nextStatus: "extracted",
      updates: { extracted_text: "extracted content" },
    });

    // After extract succeeds, refresh returns extracted submission
    const extractedSub = makeSubmission({
      status: "extracted",
      extracted_text: "extracted content",
    });
    supabaseChain.single.mockResolvedValueOnce({ data: extractedSub, error: null });

    // Mock classify step succeeding
    mockStepClassify.mockResolvedValueOnce({
      nextStatus: "classified",
      updates: { classification: { maturity_level: 1 } },
    });

    // After classify succeeds, refresh returns classified submission
    const classifiedSub = makeSubmission({
      status: "classified",
      extracted_text: "extracted content",
      classification: { maturity_level: 1, level_relation: "level-practice", topics: [], tags: [], tools_mentioned: [], difficulty: "beginner" },
    });
    supabaseChain.single.mockResolvedValueOnce({ data: classifiedSub, error: null });

    // Mock generate step succeeding
    mockStepGenerate.mockResolvedValueOnce({
      nextStatus: "generated",
      updates: { generated_tutorial: { title: "Test", slug: "test" } },
    });

    // After generate succeeds, refresh
    const generatedSub = makeSubmission({
      status: "generated",
      extracted_text: "extracted content",
      classification: { maturity_level: 1, level_relation: "level-practice", topics: [], tags: [], tools_mentioned: [], difficulty: "beginner" },
      generated_tutorial: { title: "Test", slug: "test", summary: "", body: "", action_items: [], classification: { maturity_level: 1, level_relation: "level-practice", topics: [], tags: [], tools_mentioned: [], difficulty: "beginner" } },
    });
    supabaseChain.single.mockResolvedValueOnce({ data: generatedSub, error: null });

    // Mock publish step succeeding
    mockStepPublish.mockResolvedValueOnce({
      nextStatus: "published",
      updates: { tutorial_id: "tut-1", completed_at: "2025-01-01T00:00:00Z" },
    });

    // After publish, refresh returns published
    const publishedSub = makeSubmission({
      status: "published",
      tutorial_id: "tut-1",
    });
    supabaseChain.single.mockResolvedValueOnce({ data: publishedSub, error: null });

    const result = await advanceSubmission("sub-123");
    expect(result.success).toBe(true);
    expect(result.status).toBe("published");

    // Verify all steps were called
    expect(mockStepExtract).toHaveBeenCalledTimes(1);
    expect(mockStepClassify).toHaveBeenCalledTimes(1);
    expect(mockStepGenerate).toHaveBeenCalledTimes(1);
    expect(mockStepPublish).toHaveBeenCalledTimes(1);
  });

  it("resumes from extracted status (skips extract)", async () => {
    const sub = makeSubmission({
      status: "extracted",
      extracted_text: "already extracted",
    });

    supabaseChain.single.mockResolvedValueOnce({ data: sub, error: null });

    // Should skip extract and start with classify
    mockStepClassify.mockResolvedValueOnce({
      nextStatus: "classified",
      updates: { classification: { maturity_level: 2 } },
    });

    // After classify, return classified then generated then published
    const classifiedSub = makeSubmission({ status: "classified", extracted_text: "already extracted", classification: { maturity_level: 2, level_relation: "level-up", topics: [], tags: [], tools_mentioned: [], difficulty: "intermediate" } });
    supabaseChain.single.mockResolvedValueOnce({ data: classifiedSub, error: null });

    mockStepGenerate.mockResolvedValueOnce({
      nextStatus: "generated",
      updates: { generated_tutorial: { title: "T" } },
    });

    const generatedSub = makeSubmission({ status: "generated", extracted_text: "already extracted", generated_tutorial: { title: "T", slug: "t", summary: "", body: "", action_items: [], classification: { maturity_level: 2, level_relation: "level-up", topics: [], tags: [], tools_mentioned: [], difficulty: "intermediate" } } });
    supabaseChain.single.mockResolvedValueOnce({ data: generatedSub, error: null });

    mockStepPublish.mockResolvedValueOnce({
      nextStatus: "published",
      updates: { tutorial_id: "tut-2" },
    });

    const publishedSub = makeSubmission({ status: "published", tutorial_id: "tut-2" });
    supabaseChain.single.mockResolvedValueOnce({ data: publishedSub, error: null });

    const result = await advanceSubmission("sub-123");

    expect(mockStepExtract).not.toHaveBeenCalled();
    expect(mockStepClassify).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  it("marks submission as failed on transient error", async () => {
    const sub = makeSubmission({ status: "received" });
    supabaseChain.single.mockResolvedValueOnce({ data: sub, error: null });

    // Extract fails transiently on all attempts
    mockStepExtract.mockRejectedValue(
      new PipelineError("tikwm API timeout", "extract", "transient"),
    );

    const result = await advanceSubmission("sub-123", { budgetMs: 60_000 });

    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.error).toContain("tikwm API timeout");

    // Should have retried (1 initial + 2 retries = 3 calls)
    expect(mockStepExtract).toHaveBeenCalledTimes(3);
  });

  it("marks submission as dead on permanent error", async () => {
    const sub = makeSubmission({ status: "received" });
    supabaseChain.single.mockResolvedValueOnce({ data: sub, error: null });

    mockStepExtract.mockRejectedValue(
      new PipelineError("The video may be private or unavailable", "extract", "permanent"),
    );

    const result = await advanceSubmission("sub-123");

    expect(result.success).toBe(false);
    expect(result.status).toBe("dead");

    // Should NOT retry permanent errors
    expect(mockStepExtract).toHaveBeenCalledTimes(1);
  });

  it("marks as dead when retry count exceeds max_retries", async () => {
    const sub = makeSubmission({
      status: "failed",
      last_step: "extracting",
      retry_count: 2,
      max_retries: 3,
    });
    supabaseChain.single.mockResolvedValueOnce({ data: sub, error: null });

    mockStepExtract.mockRejectedValue(
      new PipelineError("API timeout", "extract", "transient"),
    );

    const result = await advanceSubmission("sub-123", { budgetMs: 60_000 });

    expect(result.status).toBe("dead");
  });

  it("respects budget and stops between steps", async () => {
    // Use status "extracted" so the first step to run is classify.
    // With -1ms budget the engine should bail before starting any step.
    const sub = makeSubmission({
      status: "extracted",
      extracted_text: "already extracted",
    });
    supabaseChain.single.mockResolvedValueOnce({ data: sub, error: null });

    const result = await advanceSubmission("sub-123", { budgetMs: -1 });

    // Should not have run any step — budget exhausted before first step
    expect(mockStepClassify).not.toHaveBeenCalled();
    expect(mockStepExtract).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toContain("Budget exhausted");
  });
});
