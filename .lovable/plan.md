# QurobAi System Upgrade Plan

## Issues Identified

1. `**[Web Search]` / `[Deep Search]` prefix visible in chat** — when toggled on, these prefixes leak into the displayed message
2. **No stop/cancel button** during AI streaming
3. **No Qurob 3.2 free model** — user wants an auto free model with tuned knowledge
4. **Firebase not configured** for push notifications
5. **Admin Panel** is 1600 lines, desktop-only, needs mobile redesign
6. **Chat text styling** — needs more professional, differentiated typography (Claude-like)
7. **Memory/context** — AI forgets topics; need to send more history + better memory retrieval
8. **Theme** needs minimalist polish matching "Experience Like Never Before"
9. **Chat animations** — need fade-in/out transitions, smoother streaming

---

## Implementation Plan

### 1. Fix `[Web Search]` Display Bug

**File: `src/components/ChatMessage.tsx**`
In `renderContent()`, strip `[Web Search]` and `[Deep Search]` prefixes from displayed user messages so they don't show in the chat bubble. The prefix is only needed for the edge function.

### 2. Add Stop Button During Streaming

**Files: `src/hooks/useChat.ts`, `src/pages/Index.tsx`, `src/components/ChatInputEnhanced.tsx**`

- Add an `AbortController` to `streamChat()` and expose a `stopGeneration()` function from `useChat`
- In `ChatInputEnhanced`, when `isLoading` is true, replace the Send button with a Stop (Square) button that calls `stopGeneration()`
- Save partial response on abort

### 3. Launch New Qurob 3.2 Free Model

**File: `supabase/functions/chat/index.ts**`

- Update model capabilities text: better knowledge, privacy-focused, trained on 600B+ parameters (branding)
- Tune the system prompt with richer instructions: better formatting, memory awareness, never reveal underlying model
- Update `QUROBAI_KNOWLEDGE` block with Qurob 3.2 details

**File: `supabase/functions/api-chat/index.ts**` — same rename

**Files: `src/components/ModelIndicator.tsx`, `src/components/SettingsDialog.tsx`, `src/components/WelcomeScreen.tsx**` — update all "Qurob 2" references to "Qurob 3.2"

### 4. Configure Firebase for Push Notifications

**File: `src/lib/firebase.ts**` (new) — Initialize Firebase with provided config
**File: `src/hooks/usePushNotifications.ts**` — Add Firebase Cloud Messaging as primary push method alongside existing VAPID
**File: `supabase/functions/send-push/index.ts**` — Add Firebase Admin SDK sending via FCM as fallback

- Store FCM token in `push_subscriptions` table alongside existing VAPID data
- Need `FIREBASE_SERVICE_ACCOUNT` secret for server-side sending

### 5. Redesign Admin Panel for Mobile

**File: `src/pages/AdminPanel.tsx**`

- Make the tab navigation scrollable horizontally on mobile
- Convert stats grid to 2-column on mobile
- Make all cards stack vertically with proper padding
- Add bottom navigation bar for mobile with key tabs
- Reduce font sizes and padding for mobile viewport

### 6. Professional Chat Typography

**File: `src/components/ChatMessage.tsx**`

- User messages: slightly lighter weight, right-aligned bubble style
- Assistant messages: use `prose prose-sm` with custom line-height (1.7), letter-spacing
- Add subtle fade-in animation on each message (not just entry, but text appearing)
- Differentiate code text vs prose text with font-size differences
- Add a thin left-border accent on assistant messages

### 7. Improve AI Memory & Context

**File: `supabase/functions/chat/index.ts**`

- Increase memory retrieval from `limit(10)` to `limit(25)`
- In `summarizeConversation()`, increase recent messages window from 8 to 12
- Add conversation topic detection: extract key topics from messages and include as context
- Add instruction in system prompt: "Remember and reference earlier topics in this conversation"

### 8. Theme & Minimalist Polish

**File: `src/index.css**`

- Refine spacing: tighter card padding, more breathing room between sections
- Update gradient-primary to be more subtle
- Add light mode CSS variables (currently missing)
- Soften border colors slightly
- Update `glass` class with more refined backdrop-blur

### 9. Chat Animations

**File: `src/components/ChatMessage.tsx**`

- Add fade-in animation on message appear (already exists via framer-motion in Index.tsx, but improve timing)
- Add fade-out on streaming cursor removal
- Smoother streaming text appearance

**File: `src/pages/Index.tsx**`

- Improve `messageTransition` timing for more natural feel

### 10. Remove All Third-Party AI References

**Files: `supabase/functions/chat/index.ts`, `supabase/functions/api-chat/index.ts**`

- Audit and remove any remaining mentions of Gemini, OpenRouter, DeepInfra, DeepSeek in user-facing strings
- Only keep them in internal code comments and API calls
- System prompt already says "never claim to be Gemini" — reinforce this

---

## Files Summary

### New Files


| File                  | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `src/lib/firebase.ts` | Firebase initialization with provided config |


### Modified Files


| File                                   | Changes                                             |
| -------------------------------------- | --------------------------------------------------- |
| `src/hooks/useChat.ts`                 | AbortController for stop, expose `stopGeneration()` |
| `src/components/ChatInputEnhanced.tsx` | Stop button when streaming                          |
| `src/components/ChatMessage.tsx`       | Strip prefixes, typography upgrade, animations      |
| `src/pages/Index.tsx`                  | Pass stopGeneration, animation timing               |
| `src/pages/AdminPanel.tsx`             | Mobile-responsive redesign                          |
| `src/components/SettingsDialog.tsx`    | Qurob 3.2 naming                                    |
| `src/components/ModelIndicator.tsx`    | Qurob 3.2 naming                                    |
| `src/components/WelcomeScreen.tsx`     | Qurob 3.2 branding                                  |
| `supabase/functions/chat/index.ts`     | Qurob 3.2, memory boost, remove AI refs             |
| `supabase/functions/api-chat/index.ts` | Qurob 3.2, remove AI refs                           |
| `src/hooks/usePushNotifications.ts`    | Firebase FCM integration                            |
| `src/index.css`                        | Theme polish, light mode varieties                  |



| &nbsp; | &nbsp; |
| ------ | ------ |
| &nbsp; | &nbsp; |
