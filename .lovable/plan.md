## API Platform Fix & Upgrade

Bhai, problem clear hai. Issues mile:

1. **Connection error** → `api-chat` mein purane Gemini model use ho rahe hain (`gemini-2.5-pro-preview-06-05`, `gemini-2.0-flash`) jo ab Google ke direct API mein deprecated/unavailable hain → 404/400 → fallback OpenRouter bhi same models try karta hai → fail.
2. **Single key se sare models** access nahi milta — model key creation time pe lock ho jata hai.
3. **Agents (Qurob Bots)** API mein expose hi nahi hain — koi `/api-agents` endpoint nahi.
4. **Docs** mein examples sirf chat ke hain, agents/listing ka mention nahi.
5. User ne bola: **3 mahine sab free** + **Lovable AI Gateway use mat karo**.

---

### What we'll build (no Lovable AI Gateway, direct providers only)

#### 1. Fix `api-chat` edge function — connection error gone
- **Primary provider: Fireworks AI** (already has `FIREWORKS_API_KEY`, OpenAI-compatible, fast):
  - `qurob-2` / `qurob-3.2` → `qwen3-235b-a22b-instruct-2507`
  - `qurob-4` → `qwen3-235b-a22b-instruct-2507` (premium-tuned params, higher max_tokens)
  - `q-06` → `accounts/fireworks/models/qwen2p5-coder-32b-instruct`
- **Fallback: OpenRouter** with currently-valid model IDs (`google/gemini-2.0-flash-exp:free`, `qwen/qwen-2.5-72b-instruct`).
- **Second fallback: Groq** (`GROQ_API_KEY` already set) — `llama-3.3-70b-versatile`.
- **Third fallback: Google Gemini direct** with current model IDs (`gemini-2.0-flash`, `gemini-2.5-flash`).
- 8s timeout per provider, fail-fast chain. Detailed error logs so debugging easy.

#### 2. Single key → all models (3-month free promotion)
- Add new column `api_keys.allowed_models text[]` (default `['qurob-2','qurob-3.2','qurob-4','q-06']`).
- Add `api_keys.promo_expires_at timestamptz` — set to `now() + 90 days` for every new key created during promo window.
- In `api-chat`: read `model` from request body (override key's default model). Validate it's in `allowed_models` OR `promo_expires_at > now()`.
- Frontend: when promo active, show banner **"🎉 3 Months FREE — All Models Unlocked"** and remove the "model selector" lock — one key works for chat + agents + Q-06 + Qurob 4.

#### 3. New `/api-agents` endpoints (list + invoke Qurob bots)
- New edge function **`api-agents`**:
  - `GET /api-agents` → returns all `is_public=true OR is_official=true` bots: `{ id, name, description, category, icon, system_prompt_preview }`.
  - `POST /api-agents/:botId/chat` → runs chat using that bot's `system_prompt` injected as system message, then routes to same provider chain as `api-chat`.
- Auth: same `qai_` API key check as `api-chat`.
- Increment `qurob_bots.uses_count` on every invoke.

#### 4. ApiAccess.tsx UI improvements
- Add **"Agents"** tab next to API Keys / Documentation / Pricing showing the live agent list (fetched from same endpoint user will use) + copy-buttons for each bot's invoke URL.
- Add **promo banner** at top: "All API access free until [date]. One key, all models, all agents."
- Update Documentation tab with:
  - `GET /api-agents` example (curl + JS + Python)
  - `POST /api-agents/{id}/chat` example
  - `model` parameter docs for `/api-chat` (qurob-2 | qurob-3.2 | qurob-4 | q-06)
- Remove "Premium required" / "Q-06 required" locks during promo period.

#### 5. Database migration
```sql
ALTER TABLE api_keys
  ADD COLUMN allowed_models text[] DEFAULT ARRAY['qurob-2','qurob-3.2','qurob-4','q-06'],
  ADD COLUMN promo_expires_at timestamptz DEFAULT (now() + interval '90 days');

UPDATE api_keys SET
  allowed_models = ARRAY['qurob-2','qurob-3.2','qurob-4','q-06'],
  promo_expires_at = now() + interval '90 days'
WHERE promo_expires_at IS NULL;
```

#### 6. Diagnostic test endpoint
- ApiAccess "Test API Key" button: extend it to also test `/api-agents` listing so user can see green ✅ on both endpoints immediately after key creation.

---

### Files touched
- **Edit**: `supabase/functions/api-chat/index.ts` (provider chain fix, model-from-body, promo logic)
- **Create**: `supabase/functions/api-agents/index.ts`
- **Create**: migration for `allowed_models` + `promo_expires_at`
- **Edit**: `src/pages/ApiAccess.tsx` (Agents tab, promo banner, removed locks, updated docs, dual test)

### What stays the same
- Key generation flow, hash storage, `qai_` prefix.
- Existing usage tracking (`api_keys.requests_today/month/total`, `api_usage` table).
- RLS policies.

Approve karo toh implement kar deta hoon — connection error gone, ek key se sab kuch chalega, agents API live, 3 months sab free.