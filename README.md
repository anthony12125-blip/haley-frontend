# Haley OS - Multi-LLM AI Assistant

Production-grade Next.js frontend for the Haley OS platform.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth:** Firebase Authentication
- **Deployment:** Firebase Hosting + GitHub Actions CI/CD

## Architecture

### Core Components
- **ChatPage** (`src/app/chat/page.tsx`) - Main orchestrator
- **Multi-LLM Streaming** - Parallel queries to Gemini, GPT, Claude, Llama, Perplexity, Mistral, Grok
- **Landing Zones** - Desktop RightPanel (350px) / Mobile BottomDock (90px)
- **Artifacts Panel** - Side panel for code blocks and LLM responses
- **Voice Integration** - ElevenLabs TTS via Module Matrix

### Key Files
- `src/config/buildVersion.ts` - Build number (increment on every commit)
- `src/config/llmIdentity.ts` - LLM provider identity registry
- `src/lib/haleyApi.ts` - API client for backend communication

## Development

```bash
npm install
npm run dev
```

## Deployment

Push to `main` triggers automatic deployment via GitHub Actions.

**Monitor:** https://github.com/anthony12125-blip/haley-frontend/actions

## Build Versioning

Every commit increments `BUILD_VERSION` in `src/config/buildVersion.ts`.

Current Build: **#18**

## License

Proprietary - All rights reserved
