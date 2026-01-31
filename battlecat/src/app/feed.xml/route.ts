import { getAllTutorials } from "@/data/tutorials";
import { getLevel } from "@/config/levels";

export const dynamic = "force-dynamic";

const SITE_URL = "https://battlecat.ai";

export async function GET() {
  const tutorials = (await getAllTutorials()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const items = tutorials
    .map((t) => {
      const level = getLevel(t.maturity_level);
      const levelLabel = level ? `L${level.level} ${level.you_role}→${level.ai_role}` : "";
      return `    <item>
      <title>${escapeXml(t.title)}</title>
      <link>${SITE_URL}/tutorials/${t.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/tutorials/${t.slug}</guid>
      <description>${escapeXml(t.summary)}</description>
      <category>${escapeXml(levelLabel)}</category>
${t.topics.map((topic) => `      <category>${escapeXml(topic)}</category>`).join("\n")}
      <pubDate>${new Date(t.created_at).toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Battle Cat AI</title>
    <link>${SITE_URL}</link>
    <description>AI tutorials mapped to the AI Maturity Framework (L0 Asker → L4 Architect)</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
