/**
 * Generate a content-relevant hero image for a tutorial using Together AI's FLUX model.
 * Produces infographic/mind-map style visuals that reflect the actual tutorial content.
 * Returns a URL to the generated image, or null if image generation is unavailable.
 */
export async function generateTutorialImage(
  title: string,
  topics: string[],
  _maturityLevel: number,
  summary: string,
  _actionItems: string[],
): Promise<string | null> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    console.log("[image] TOGETHER_API_KEY not set, skipping image generation");
    return null;
  }

  const topicList = topics.slice(0, 4).join(", ");

  // Build a content-specific infographic prompt
  const prompt = `Infographic-style illustration for an AI tutorial: "${title}". Visual mind map showing the relationship between: ${topicList}. Key concepts visualized: ${summary.slice(0, 120)}. Style: clean flat-design infographic with connected nodes, icons representing ${topicList}, flowchart arrows, and labeled diagram sections. Color palette: teal (#14B8A6), amber gold (#F59E0B), with a dark navy (#0f172a) background. The image should look like a polished slide from a tech presentation — diagrammatic, structured, with visual hierarchy. NO readable text or words — use abstract icons, shapes, and connection lines instead of labels. Professional editorial infographic style.`;

  try {
    const response = await fetch("https://api.together.xyz/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "black-forest-labs/FLUX.1.1-pro",
        prompt,
        width: 1344,
        height: 768,
        steps: 20,
        n: 1,
        response_format: "b64_json",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[image] Together AI error:", err);
      return null;
    }

    const result = await response.json();
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      console.error("[image] No image data in response");
      return null;
    }

    // Upload to Supabase Storage
    const imageUrl = await uploadToSupabase(b64, title);
    return imageUrl;
  } catch (err) {
    console.error("[image] Generation failed:", err);
    return null;
  }
}

/**
 * Upload a base64 image to Supabase Storage and return the public URL.
 */
async function uploadToSupabase(
  base64Data: string,
  title: string,
): Promise<string | null> {
  try {
    const { createServerClient } = await import("@/lib/supabase");
    const supabase = createServerClient();

    // Create a slug-based filename
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const filename = `tutorials/${slug}-${Date.now()}.png`;

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    const { error } = await supabase.storage
      .from("images")
      .upload(filename, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("[image] Supabase upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (err) {
    console.error("[image] Upload failed:", err);
    return null;
  }
}
