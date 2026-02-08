

# QurobAi Mega Enhancement - Phase 3 Final

## Overview

This plan addresses every issue raised: broken API, ugly mobile UI, payment bugs, missing features, AI quality, web search, token system, deep search, Qurobs (custom GPTs), and overall polish.

---

## 1. API System - Make It Actually Work

### Problem
The API documentation looks real but when users test it, the `api-chat` edge function uses direct API calls to DeepInfra/OpenRouter/Gemini which are unreliable. The docs show code examples but the API itself fails silently.

### Fix: `supabase/functions/api-chat/index.ts`
- 
- Add proper error handling for 429 (rate limit) and 402 (payment required)
- Keep existing rate limiting, key validation, and usage tracking logic

### Fix: `src/pages/ApiAccess.tsx`
- Make the "Test API Key" button show clearer success/failure states
- Ensure documentation examples use correct base URL
- No structural changes needed - the UI is already well-built

---

## 2. Chat AI -

### Problem
The main `chat` edge function uses multiple unreliable third-party APIs (Groq, Fireworks, DeepInfra, OpenRouter, Google Gemini direct). This causes inconsistent responses and failures.

### Fix: 
- Keep ALL existing features: real-time data detection (weather, crypto, stocks, news, cricket, currency), image generation via Fireworks, vision via OpenRouter, conversation summarization, user memory, personalization
- Add **Web Search via Serper.dev** (new integration - requires API key)
- Add **URL checking** - detect URLs in messages, fetch page title/description via fetch()
- Add **Deep Search** prefix detection: when message starts with `[Deep Search]`, use enhanced web search with multiple sources and longer reasoning
- Expand `QUROBAI_KNOWLEDGE` with more comprehensive FAQ (50+ entries)

### New: Serper.dev Integration
- Need to add `SERPER_API_KEY` as a secret
- Used for `[Web Search]` queries and the new Deep Search button
- Falls back to existing DuckDuckGo/Google News RSS if Serper is unavailable

---

## 3. Web Search Button + Deep Search in Chat

### Problem
Users can't search the web through AI. No deep search like Perplexity.

### Fix: `src/components/ChatInputEnhanced.tsx`
- Add a **Web Search** toggle button (Globe icon) next to the send button
- When toggled ON, messages are prefixed with `[Web Search]` automatically
- Add a **Deep Search** button (magnifying glass with sparkle) that triggers `[Deep Search]` prefix for more thorough analysis
- Both buttons are pill-shaped toggles above the text input area

### Fix: `src/pages/Index.tsx`
- Pass web search state through to the chat flow

---

## 4. Token System for Chat Usage

### Problem
Users can chat unlimited. Need daily limits for free users.

### Database Migration
```sql
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS tokens_used_today integer DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS tokens_reset_date date DEFAULT CURRENT_DATE;
```

### Implementation
- **Free users:** 50 messages/day (reset at midnight IST)
- **Premium users:** 1,000,000 tokens/day (effectively unlimited)
- Check token count in `supabase/functions/chat/index.ts` before processing
- Return remaining tokens in response headers
- Show token usage counter in chat UI

---

## 5. Custom Qurobs (Like Gemini Gems / ChatGPT GPTs)

### Concept (from reference images)
Users create custom AI assistants with:
- Name, description, avatar/icon
- Custom system prompt
- Preset categories: Storybook, Brainstormer, Career Guide, Coding Partner, Learning Coach, Writing Editor
- Tabs: All, Your Qurobs, By QurobAi (pre-built ones)

### Database Migration
```sql
CREATE TABLE qurob_bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'sparkles',
  icon_color text DEFAULT '#6366f1',
  system_prompt text NOT NULL,
  is_public boolean DEFAULT false,
  is_official boolean DEFAULT false,
  category text DEFAULT 'general',
  uses_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE qurob_bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read public bots" ON qurob_bots FOR SELECT USING (is_public OR user_id = auth.uid());
CREATE POLICY "Users can manage own bots" ON qurob_bots FOR ALL USING (user_id = auth.uid());
```

### New Files
- `src/pages/Qurobs.tsx` - Browse/manage page with tabs (All, Your Qurobs, By QurobAi)
- `src/components/QurobBotBuilder.tsx` - Creation dialog
- Pre-seed 6 official Qurobs: Storybook, Brainstormer, Career Guide, Coding Partner, Learning Coach, Writing Editor

### Chat Integration
- When a Qurob is selected, its system prompt is prepended to the chat messages
- Show active Qurob indicator in chat header
- Navigate from Qurobs page to chat with the selected bot

---

## 6. Mobile-First UI Overhaul

### Problem
The app looks designed for desktop. Chat input too high on mobile, buttons too small, wasted space.

### Fix: `src/pages/Index.tsx`
- Remove the redundant padding wrapper around ChatInputEnhanced
- Remove the `ModelIndicator` bar on mobile (it wastes vertical space) - show only on md+
- Make the welcome screen more compact on mobile
- Sticky bottom input with proper safe-area padding

### Fix: `src/components/WelcomeScreen.tsx`
- Redesign to match Gemini style (from reference images):
  - "Hi [Username]" greeting with large text
  - "Where should we start?" subtitle
  - Pill-shaped quick action buttons with emojis (like Gemini)
  - Bottom sheet showing model selector and tools (Create Images, Deep Search, Web Search)
- More compact on mobile with smaller gaps

### Fix: `src/components/ChatInputEnhanced.tsx`
- More compact padding on mobile
- Web Search and Deep Search toggle buttons
- Ensure safe-area-bottom is properly applied

---

## 7. Payment Gateway Fix

### Problem
Manual screenshot system is buggy and slow. Need better UX.

### Fix: `src/pages/Subscribe.tsx`
- Improve the payment flow UX:
  - Add transaction ID field prominently (not hidden)
  - Show clearer step indicators (Step 1: Pay, Step 2: Enter Transaction ID or Upload Screenshot)
  - Better success/error messaging
  - Add "Check Payment Status" button for users who already paid
- Note: Full Razorpay/Stripe automatic integration requires API keys and merchant setup. For now, optimize the existing manual flow significantly.

---

## 8. Admin Panel Improvements

### Fix: `src/pages/AdminPanel.tsx`
- Make tabs horizontally scrollable on mobile (overflow-x-auto)
- Show user email alongside display name (fetch from profiles or show user_id)
- Ensure all users are loaded (remove the default 1000 row limit by paginating)
- Push notifications: verify the `send-push` function is correctly configured in config.toml
- Add "Download All Users CSV" button

---

## 9. Splash Screen on Every Page

### Fix: `src/App.tsx` + `src/components/SplashScreen.tsx`
- Show 2-second splash on every route navigation (not just app load)
- Add a "Skip" button
- Use `sessionStorage` to track per-route visits so splash only shows once per route per session

---

## 10. APK Download Fix

### Problem
The provided APK was copied but may not work.

### Fix: `src/pages/Download.tsx`
- Verify the APK file is properly served from `/downloads/qurobai.apk`
- Add proper `Content-Type` headers guidance
- Add installation instructions (Enable "Install from Unknown Sources")
- Show file size and version info

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `src/pages/Qurobs.tsx` | Browse/manage custom Qurobs (GPTs) |
| `src/components/QurobBotBuilder.tsx` | Create/edit Qurob dialog |

### Modified Files
| File | Changes |
|------|---------|
| `supabase/functions/chat/index.ts` | Lovable AI Gateway, web search, deep search, URL checking, tokens |
| `supabase/functions/api-chat/index.ts` | Switch to Lovable AI Gateway |
| `src/components/ChatInputEnhanced.tsx` | Web Search + Deep Search buttons, mobile polish |
| `src/components/WelcomeScreen.tsx` | Gemini-style redesign with greeting + tools |
| `src/pages/Index.tsx` | Mobile layout fixes, Qurob integration |
| `src/pages/Subscribe.tsx` | Payment UX improvements |
| `src/pages/AdminPanel.tsx` | Mobile tabs scroll, user CSV export |
| `src/pages/Download.tsx` | Better APK instructions |
| `src/App.tsx` | Add Qurobs route, splash on navigation |
| `supabase/config.toml` | Ensure all functions listed |

### Database Migration
- Add `tokens_used_today`, `tokens_reset_date` to `user_settings`
- Create `qurob_bots` table with RLS policies
- Seed 6 official Qurobs

### Secret Required
- `SERPER_API_KEY` for web search (will prompt for setup)

---

## Implementation Order

```text
Step 1: Add SERPER_API_KEY secret
Step 2: Database migration (tokens + qurob_bots table)
Step 3: Rewrite chat edge function (Lovable AI + web search + deep search)
Step 4: Rewrite api-chat edge function (Lovable AI)
Step 5: Redesign WelcomeScreen (Gemini-style)
Step 6: Add Web Search + Deep Search buttons to ChatInputEnhanced
Step 7: Fix Index.tsx mobile layout
Step 8: Create Qurobs page + builder
Step 9: Fix Subscribe payment UX
Step 10: Fix Admin Panel mobile + CSV export
Step 11: Update App.tsx routes + splash
Step 12: Deploy and test
```

