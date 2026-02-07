import { readFileSync } from "fs";
import path from "path";

/**
 * Dev-only API route that serves pre-generated MP3 files for seed tutorials.
 * Returns 404 in production so audio is never served from the filesystem in prod.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const { slug } = await params;

  try {
    const filePath = path.join(
      process.cwd(),
      "src/data/tts/audio",
      `${slug}.mp3`
    );
    const buffer = readFileSync(filePath);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
