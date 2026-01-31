/**
 * Generate a hero image for a tutorial using Together AI's FLUX model.
 * Returns a URL to the generated image, or null if image generation is unavailable.
 */
export async function generateTutorialImage(
  title: string,
  topics: string[],
  maturityLevel: number,
): Promise<string | null> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    console.log("[image] TOGETHER_API_KEY not set, skipping image generation");
    return null;
  }

  const levelNames = ["Asker", "Instructor", "Designer", "Supervisor", "Architect"];
  const levelName = levelNames[maturityLevel] || "AI";

  // Create a prompt that generates a clean, modern illustration
  const prompt = `Clean modern flat illustration for a tech blog article titled "${title}". Abstract geometric shapes, gradient colors, teal and amber gold accent colors. Topics: ${topics.slice(0, 3).join(", ")}. Professional, minimal, no text, no words, no letters. Clean white or dark background. Tech and AI themed. Editorial illustration style.`;

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
