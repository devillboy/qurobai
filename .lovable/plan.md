# Add Qurob 5 — Next-Gen Tuned Agent Model add more updates

## Goal

Launch **Qurob 5** as the new flagship premium model at **₹1289/month** with auto-enabled Deep Search + Web Search, the most powerful tuned agent in the QurobAi lineup. Optimize all existing models alongside it, with Qurob 5 positioned as the "Ultimate" tier above Qurob 4. Fix the api error not working dont use lovable ai. Change ai slnp web look

## What Qurob 5 Will Be

- **Name**: Qurob 5
- **Tagline**: "Next-Gen Fully Tuned Agent"
- **Price**: ₹1289/month
- **Backend model**: `Fireworks latest model`
- **Auto Web Search**: Always ON — no toggle needed, agent decides when to search
- **Auto Deep Search**: Triggered automatically for research-heavy / multi-step queries
- **Personality**: Senior autonomous agent — proactive, multi-step planner, tuned on QurobAi's India-first identity
- **Badge**: "ULTIMATE" (gradient gold/purple)
- **Icon**: Crown / Rocket     

## Database Changes (migration)

1. Insert new row into `subscription_plans`:
  - `name`: "Ultimate Agent"
  - `model_name`: "Qurob 5"
  - `price_inr`: 1289
  - `duration_days`: 30
  - `features`: `["Next-gen tuned agent", "Auto Web + Deep Search", "Most powerful reasoning", "Multi-step task agent", "Priority infrastructure", "Unlimited tokens", "All Qurob 4 + Q-06 features"]`
2. No schema changes needed — existing `get_user_model` RPC and gating already supports new model_name strings.

## Backend Changes — `supabase/functions/chat/index.ts`

1. **Model map**: add `"Qurob 5": "openai/gpt-5"`
2. **Temperature map**: add `"Qurob 5": 0.3` (focused agent reasoning)
3. **Subscription gating**: extend the `requestedModel === "Qurob 4" || requestedModel === "Q-06"` check to also include `"Qurob 5"`
4. **Auto Web Search for Qurob 5**: when `modelName === "Qurob 5"`, force web-search context injection regardless of `[Web Search]` / `[Deep Search]` prefix — call `firecrawlSearch()` automatically for any factual / current-info query (use a lightweight intent check: contains years 2024+, "latest", "news", "today", question words, etc.)
5. **Reasoning param**: when calling gateway with `openai/gpt-5`, add `reasoning: { effort: "high" }` to body
6. **Personality entry** in `modelPersonality`:
  ```
   "Qurob 5": "You are Qurob 5 — QurobAi's flagship Ultimate Agent. You are autonomous, proactive, and operate like a senior multi-step agent. You plan before acting, verify with live web data automatically, break complex tasks into steps, and deliver complete solutions. You think deeply, cite sources when web-searched, and work like a tuned consultant who never gives shallow answers. You are India-first, warm, and precise."
  ```
7. **System-prompt updates**: add Qurob 5 row to the model overview (line 29-31) and pricing table (46-48)

## Frontend Changes

### `src/components/ModelSelector.tsx`

- Add new entry to `models` array:
  ```ts
  { id: "Qurob 5", name: "Qurob 5", description: "Ultimate Agent • ₹1289/mo", icon: Crown, free: false, badge: "ULTIMATE", color: "text-yellow-500" }
  ```
- Place at top of paid tier list (above Qurob 4)
- Lock icon + redirect to /subscribe when not subscribed

### `src/components/ModelIndicator.tsx`

- Add `isUltimate` check for Qurob 5
- Show gold/purple gradient badge with crown icon
- Show description: "Next-gen tuned agent with auto deep web search"

### `src/pages/Subscribe.tsx`

- Add new card **above** the Qurob 4 card: "Qurob 5 — Ultimate Agent" at ₹1289
- Highlight as "MOST POWERFUL" with gradient border
- Lookup via `plans.find(p => p.model_name === "Qurob 5")`
- Include in `selectedPlan` switching logic and final price display
- Layout: 3 cards in a responsive grid (Qurob 5, Qurob 4, Q-06)

### `src/components/ChatInputEnhanced.tsx`

- When current model === "Qurob 5", show a small inline pill: "🔍 Auto Web + Deep Search Active" instead of the Web/Deep toggles (since they're automatic)
- Hide manual toggles for Qurob 5 users

### `src/hooks/useChat.ts`

- No structural changes needed — model selection flows through existing path

### Optimizations to existing models (light tuning)

- `chat/index.ts` system prompt: tighten the model lineup section to clearly position the 4 tiers (Qurob 3.2 free → Qurob 4 → Q-06 → Qurob 5)
- Update `WhatsNewPopup.tsx` with announcement: "🚀 Qurob 5 launched — Next-gen Ultimate Agent"
- Update `LandingPage.tsx` model showcase to feature Qurob 5

## Files to Edit

```text
supabase/migrations/<new>_add_qurob5_plan.sql      [NEW]
supabase/functions/chat/index.ts                   [model map, gating, auto-search, personality, system prompt]
src/components/ModelSelector.tsx                   [add Qurob 5 entry]
src/components/ModelIndicator.tsx                  [Ultimate badge styling]
src/components/ChatInputEnhanced.tsx               [hide toggles for Qurob 5, show auto-search pill]
src/pages/Subscribe.tsx                            [add Qurob 5 plan card]
src/components/WhatsNewPopup.tsx                   [launch announcement]
src/components/LandingPage.tsx                     [feature Qurob 5]
```

## Notes

- Firecrawl integration already exists in `chat/index.ts` — Qurob 5's auto-search reuses `firecrawlSearch()` and `firecrawlScrape()`
- Subscription gating uses existing `get_user_model` RPC — no auth changes needed
- Payment flow (UPI only) already works via `verify-payment` function — new plan will flow through unchanged
- After deploy, existing Qurob 4 / Q-06 subscribers keep their plans; Qurob 5 requires separate purchase            