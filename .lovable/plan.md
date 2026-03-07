# QurobAi Major Upgrade Plan

## Issues to Fix

1. **Chat 500 Error** — The `chat` edge function returns "AI service temporarily unavailable" because both Gemini and OpenRouter API calls fail. Fix it
2. **Model Selector Button** — No model picker exists in the chat UI. Need a Gemini-style model selector dropdown near the input area showing all available models (Qurob 3.2, Qurob 4, Q-06) with paid model lock icons that redirect to `/subscribe`.
3. **UPI Number Update** — Change UPI from `7864084241@ybl` to `9153109561@ybl` in Subscribe page and knowledge base.
4. **Payment Auto-Approval** — When user provides UTR/Transaction ID, auto-approve payment immediately without waiting for admin review.and verify it form other source ya government site
5. **Admin Panel Redesign** — Make it mobile-responsive with scrollable tabs, compact cards, and better layout for 9:16 screens.
6. **Chat UI Redesign** — Professional redesign of chat bubbles, input area, and welcome screen.

---

## Implementation Plan

### 1. Fix Chat 500 Error — Use Lovable AI Gateway as Primary

**File: `supabase/functions/chat/index.ts**`

Replace the direct Gemini API call + OpenRouter fallback with Lovable AI Gateway as the primary provider. Keep Gemini as fallback.

- Use `others ai provide api are already configured`
- Default model: `google/gemini-3-flash-preview` for Qurob 3.2, `google/gemini-2.5-pro` for Qurob 4
- Remove `callGeminiAPI()` and `convertGeminiStreamToOpenAI()` functions
  • Use Another Models With same capabilities 
- The gateway already returns OpenAI-compatible SSE, so no stream conversion needed
- Keep all existing features (web search, image gen, vision, real-time data)

### 2. Add Model Selector Button

**New file: `src/components/ModelSelector.tsx**`

- Dropdown/popover button showing current model with icon
- List: Qurob 3.2 (Free), Qurob 4 (Premium ₹289/mo), Q-06 (Code ₹320/mo)
- Paid models show lock icon if user doesn't have subscription → click redirects to `/subscribe`
- Store selected model preference in user_settings or local state

**File: `src/pages/Index.tsx**`

- Add ModelSelector next to chat input or in header area
- Pass selected model to useChat

**File: `src/hooks/useChat.ts**`

- Accept model parameter and send it to edge function

**File: `supabase/functions/chat/index.ts**`

- Accept `model` parameter from request body and use it to select gateway model

### 3. Update UPI Number

**File: `src/pages/Subscribe.tsx**`

- Change default UPI from `7864084241@ybl` to `9153109561@ybl`

**File: `supabase/functions/chat/index.ts**`

- Update QUROBAI_KNOWLEDGE UPI reference

### 4. Payment Auto-Approval with UTR/Transaction ID

**File: `src/pages/Subscribe.tsx**`

- Add prominent Transaction ID / UTR input field
- When UTR is provided + amount matches, auto-approve immediately by calling a new edge function or updating verify-payment logic

**File: `supabase/functions/verify-payment/index.ts**`

- Add logic: if `transaction_id` is provided and amount matches expected, auto-approve with `confidence: "high"` without requiring screenshot AI analysis
- Still store the screenshot for audit trail

### 5. Admin Panel Mobile Redesign

**File: `src/pages/AdminPanel.tsx**`

- Make TabsList horizontally scrollable on mobile with `overflow-x-auto`
- Stats grid: `grid-cols-2` on mobile, `grid-cols-4` on desktop
- Reduce padding and font sizes for mobile
- Cards stack vertically with proper spacing
- Payment review cards: compact layout with action buttons inline
- Touch-friendly button sizes (min 44px)

### 6. Chat UI Redesign

**File: `src/components/ChatMessage.tsx**`

- Cleaner bubble design with subtle backgrounds
- User messages: right-aligned, primary-colored bubble
- Assistant messages: left-aligned, subtle card with thin left border accent
- Better typography spacing

**File: `src/components/ChatInputEnhanced.tsx**`

- Integrate model selector inline
- Cleaner input bar design

**File: `src/components/WelcomeScreen.tsx**`

- Update to show Qurob 3.2 branding consistently

---

## Files Summary


| File                                         | Changes                                                 |
| -------------------------------------------- | ------------------------------------------------------- |
| `supabase/functions/chat/index.ts`           | accept model param, update UPI                          |
| `src/components/ModelSelector.tsx`           | **NEW** — Model picker dropdown all model will be shown |
| `src/pages/Index.tsx`                        | Add ModelSelector, pass model to useChat                |
| `src/hooks/useChat.ts`                       | Accept/send model parameter                             |
| `src/pages/Subscribe.tsx`                    | Update UPI to 9153109561, enhance UTR field             |
| `supabase/functions/verify-payment/index.ts` | Auto-approve on UTR + amount match                      |
| `src/pages/AdminPanel.tsx`                   | Mobile-responsive redesign                              |
| `src/components/ChatMessage.tsx`             | Professional chat bubble redesign                       |
| `src/components/ChatInputEnhanced.tsx`       | Cleaner design with model selector                      |
| `src/components/WelcomeScreen.tsx`           | Branding updates                                        |
