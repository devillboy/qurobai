## Goal

Fix the crashed app, finish the real-time streaming wiring, upgrade all models to latest + fast defaults, and make the project reliably deployable to Vercel.

## 1. Emergency triage — get the app running again

- Read `supabase/functions/chat/index.ts`, `src/hooks/useChat.ts`, `src/components/ThinkingIndicator.tsx`, `src/pages/Index.tsx`, `src/components/ChatMessage.tsx` to find what the last streaming/SSE refactor broke.
- Check edge function logs for `chat`, `api-chat`, `api-agents`, `generate-image` to identify runtime errors (bad model IDs, missing fallbacks, malformed SSE).
- Fix any TypeScript / import / runtime errors preventing responses. Ensure `useChat` gracefully handles both plain-text streams and `qurob_event` JSON lines (no crash if event parse fails).

## 2. Finish real-time activity wiring (from last turn)

- Wire the `activity` state from `useChat` into `Index.tsx` and pass it into `ThinkingIndicator` so phase changes (connecting → searching → answering) render live.
- Render source-citation chips (favicon + title + link) under assistant messages in `ChatMessage.tsx` using the `sources` array already attached in `useChat`.
- Remove/replace the old typing indicator with the lightweight live-phase pill (no fake "thinking…" delays, no artificial timers — stream tokens the instant they arrive).

## 3. Model upgrades (latest + fastest)

We will  dont use lovable ai gateway ai provider (OpenRouter/Groq/DeepInfra/Fireworks) as fallback we will use lovable ai. We there are model i had provided we will use same models like similar there 

- **Qurob 3.2 (free)** → `google/gemini-3.1-flash-lite`
- **Qurob 4 (Premium)** → `google/gemini-3.5-flash`
- **Q-06 (Code)** → `openai/gpt-5.4-mini` with `service_tier: "priority"` (fast mode), fallback `google/gemini-3.5-flash`
- **Qurob 5 (Admin/top)** → `openai/gpt-5.5` with priority, fallback `google/gemini-3.1-pro-preview`
- **ArticQuro (images)** → `google/gemini-3.1-flash-image` (fast) with `google/gemini-2.5-flash-image` fallback
- Add per-request timeout + single retry on 5xx/429 only; surface 402 (credits) with clear UI toast.
  &nbsp;

## 4. Speed / latency

- Kill artificial delays (any `setTimeout` "thinking" pauses in chat send path).
- Stream tokens directly to the UI as they arrive; no debounce > 16ms.
- Preconnect to `ai.gateway.lovable.dev` and Supabase in `index.html`.
- Route-level `React.lazy` is already in place — verify no eager heavy imports in `Index.tsx` chain.

## 5. Real-time web search (tool-calling, already scaffolded)

- Keep AI-decides-when tool calling. Ensure Firecrawl + Serper fallback chain works; emit `searching` / `reading_url` phase events; return sources to client for chip rendering.

## 6. Image auto-routing

- Smart intent detection in `chat/index.ts` (already added) — verify it triggers ArticQuro without user needing to switch models, and emits `image_starting` / `image_done` events.

## 7. Vercel-ready

- Verify `vercel.json` (already present) — SPA rewrite, cache headers, security headers ✅.
- Confirm `vite build` output goes to `dist/`, no server-only code imported client-side, `.env` uses only `VITE_*` public keys.
- Add `preconnect`/`dns-prefetch` in `index.html` for Supabase + AI gateway.
- Document that Supabase edge functions stay on Lovable Cloud (Vercel hosts frontend only) — no changes needed to functions for Vercel.

## 8. Verify

- Build check, then Playwright smoke: load `/`, sign-in flow (skip if no test creds), send a chat message on each model, confirm streaming tokens + phase pill + sources render, confirm image prompt auto-routes.
- Tail edge logs for the chat function during the smoke test.

## Technical notes

- No schema changes.
- Only server files touched: `supabase/functions/chat/index.ts`, `api-chat/index.ts`, `api-agents/index.ts`, `generate-image/index.ts`.
- Client files touched: `src/hooks/useChat.ts`, `src/pages/Index.tsx`, `src/components/ChatMessage.tsx`, `src/components/ThinkingIndicator.tsx`, `src/components/ModelSelector.tsx` (label refresh), `index.html` (preconnect).
- Brand rule preserved: UI never names external providers — only "Qurob" model tiers.