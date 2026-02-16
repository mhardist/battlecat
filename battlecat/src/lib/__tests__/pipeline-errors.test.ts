import { describe, it, expect } from "vitest";
import {
  classifyError,
  PipelineError,
  retryDelay,
} from "@/lib/pipeline-errors";

describe("classifyError", () => {
  it("classifies timeout errors as transient", () => {
    expect(classifyError(new Error("AbortError: The operation was aborted"))).toBe("transient");
    expect(classifyError(new Error("network timeout at: https://example.com"))).toBe("transient");
  });

  it("classifies rate limit errors as transient", () => {
    expect(classifyError(new Error("429 Too Many Requests"))).toBe("transient");
    expect(classifyError(new Error("Rate limit exceeded"))).toBe("transient");
  });

  it("classifies 5xx errors as transient", () => {
    expect(classifyError(new Error("Internal Server Error 500"))).toBe("transient");
    expect(classifyError(new Error("502 Bad Gateway"))).toBe("transient");
  });

  it("classifies private content as permanent", () => {
    expect(
      classifyError(new Error("Could not extract TikTok content. The video may be private or unavailable.")),
    ).toBe("permanent");
  });

  it("classifies insufficient content as permanent", () => {
    expect(classifyError(new Error("Jina Reader returned insufficient content"))).toBe("permanent");
    expect(classifyError(new Error("PDF contained insufficient extractable text"))).toBe("permanent");
  });

  it("classifies no transcript as permanent", () => {
    expect(classifyError(new Error("Deepgram returned no transcript"))).toBe("permanent");
  });

  it("classifies LinkedIn blocked as permanent", () => {
    expect(
      classifyError(new Error("LinkedIn blocked content extraction.")),
    ).toBe("permanent");
  });

  it("classifies 404 errors as permanent", () => {
    expect(classifyError(new Error("Jina Reader failed: 404 Not Found"))).toBe("permanent");
  });

  it("classifies 403 errors as permanent", () => {
    expect(classifyError(new Error("tikwm API request failed: 403"))).toBe("permanent");
  });

  it("classifies unknown errors as transient", () => {
    expect(classifyError(new Error("Something unexpected happened"))).toBe("transient");
    expect(classifyError("string error")).toBe("transient");
    expect(classifyError(null)).toBe("transient");
  });

  it("handles non-Error objects", () => {
    expect(classifyError({ message: "object error" })).toBe("transient");
    expect(classifyError(42)).toBe("transient");
  });
});

describe("PipelineError", () => {
  it("creates with auto-classified kind from message", () => {
    const err = new PipelineError("Deepgram returned no transcript", "extract");
    expect(err.kind).toBe("permanent");
    expect(err.step).toBe("extract");
    expect(err.message).toBe("Deepgram returned no transcript");
    expect(err.name).toBe("PipelineError");
  });

  it("creates with explicit kind override", () => {
    const err = new PipelineError("some error", "classify", "transient");
    expect(err.kind).toBe("transient");
  });

  it("creates from an existing Error via fromError", () => {
    const original = new Error("network timeout");
    const pErr = PipelineError.fromError(original, "extract");
    expect(pErr.kind).toBe("transient");
    expect(pErr.step).toBe("extract");
    expect(pErr.message).toBe("network timeout");
  });

  it("passes through existing PipelineError unchanged", () => {
    const original = new PipelineError("test", "classify", "permanent");
    const result = PipelineError.fromError(original, "extract");
    expect(result).toBe(original); // same reference
    expect(result.step).toBe("classify"); // preserves original step
  });

  it("creates from non-Error values", () => {
    const pErr = PipelineError.fromError("string error", "generate");
    expect(pErr.message).toBe("string error");
    expect(pErr.step).toBe("generate");
  });
});

describe("retryDelay", () => {
  it("returns exponential backoff values", () => {
    expect(retryDelay(0)).toBe(3000);   // 3s
    expect(retryDelay(1)).toBe(9000);   // 9s
    expect(retryDelay(2)).toBe(27000);  // 27s
  });

  it("caps at 30 seconds", () => {
    expect(retryDelay(3)).toBe(30000);
    expect(retryDelay(10)).toBe(30000);
  });
});
