# Battle Cat AI

**battlecat.ai** — Text a link from your iPhone, get organized AI learning tutorials on a shareable blog, mapped to the AI Maturity Framework (L0–L4).

## Status: Planning Complete — Ready to Build

See [PLANNING.md](./PLANNING.md) for the full plan including:
- All decisions locked in
- AI Maturity Framework (Levels 0–4) integrated as the content backbone
- Recommended tech stack (Cloudflare + Supabase + Next.js + Twilio + Claude API)
- Full architecture diagram
- 6-phase execution plan
- Branding requirements for the Battle Cat identity

## How It Works

1. **Text a link** from your iPhone to a dedicated Twilio number
2. **Content is extracted** (TikTok audio transcription, article text, tweets, etc.)
3. **AI classifies it** by Maturity Level (L0 Asker → L4 Architect)
4. **Merges with existing content** on the same topic (links become references, content is king)
5. **Published** as a step-by-step tutorial on battlecat.ai

## The Framework

| Level | You | AI | Relationship |
|-------|-----|-----|-------------|
| 0 | Asker | Answerer | Transactional |
| 1 | Instructor | Assistant | Retained |
| 2 | Designer | Builder | Collaborative |
| 3 | Supervisor | Agent | Delegated |
| 4 | Architect | Organization | Orchestrated |

## Next Step

Create the `battlecat` repo and start building Phase 0.

## Reference Materials

- `blue-preso-slides.pdf` — AI Maturity Framework presentation (Entrepreneurs Sandbox, Jan 2026)
- `BlowUpYourArchitecture-compressed (1).pdf` — Architecture & agentic engineering patterns
