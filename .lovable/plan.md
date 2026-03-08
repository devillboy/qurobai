

# Major Feature Update: Blog, Qurob 2, Message Edit, Tokens, Thinking Animation, File Fix, 3D Buttons, Model Selector Repositioning

## Changes Overview

### 1. Add Blog/Articles Section to Landing Page (SEO)
**File: `src/components/LandingPage.tsx`**
- Add a new "Blog" section before the FAQ with 4-5 SEO-rich articles targeting Indian AI searches
- Articles like: "Best Free AI Chatbot in India 2026", "How AI is Changing Education in India", "ChatGPT vs QurobAi", "AI Coding Tools for Indian Developers", "Is AI Safe? Privacy Guide for Indian Users"
- Each article is a `<article>` tag with proper `<h3>` headings for SEO crawling
- Cards link to `/blog/:slug` (or scroll to expanded content)

### 2. Bring Back Qurob 2 as a Free Model Option
**File: `src/components/ModelSelector.tsx`**
- Add "Qurob 2" as a second free model option (id: "Qurob 2", badge: "LEGACY", free: true)
- Description: "Classic • 300B+ params"

**File: `supabase/functions/chat/index.ts`**
- Add `"Qurob 2": "google/gemini-2.5-flash-lite"` to MODEL_MAP (lighter/faster model for legacy)

### 3. Message Editing After Sending
**File: `src/components/ChatMessage.tsx`**
- Add "Edit" button to user message action bar (pencil icon)
- When clicked, replace message content with an inline textarea pre-filled with current text
- On save: update the message content in state, re-send to AI, remove all messages after the edited one

**File: `src/hooks/useChat.ts`**
- Add `editMessage(messageId: string, newContent: string, convId: string)` function
- Truncates messages after the edited one, sends new content to AI
- Add UPDATE RLS policy for messages table (user can edit own messages via conversation ownership)

**Database migration:**
- Add UPDATE policy on `messages` table: `EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid())`

### 4. Token Limits Update
**File: `supabase/functions/chat/index.ts`**
- Free users: change daily limit from `50` to calculate as ~11,667/day (350k/30 days ≈ 11,667 tokens/day) OR simply track monthly tokens capped at 350,000
- Paid users: change from `1,000,000` to maximum gateway capacity (keep at 1M or increase)
- Update the limit check logic to reflect monthly 350k for free users

### 5. Better Thinking Animation (Not Fake)
**File: `src/components/ThinkingIndicator.tsx`**
- Replace bouncing dots + static "Thinking" with a more sophisticated animation:
  - Animated gradient shimmer bar (like Claude's thinking)
  - Rotating thoughts text: "Analyzing...", "Processing...", "Formulating response..."
  - Subtle pulsing brain icon instead of sparkles
  - Remove the fake "Thought for Xs" counter — replace with a subtle progress shimmer

### 6. Fix File Attachment (Accept All Files, Not Just Images)
**File: `src/components/ChatInputEnhanced.tsx`**
- Change `accept="image/*,.pdf,.txt,.doc,.docx"` to `accept="*/*"` or remove the accept attribute entirely
- This was restricting mobile file picker to only show albums/images
- On mobile, removing `accept` allows the OS to show all file types

### 7. Unique Features for Better UX
- **Message reactions**: Add emoji reactions (👍 👎 ❤️) to assistant messages
- **Character count**: Show live character/word count in input area
- **Scroll to bottom button**: Floating button when scrolled up in long chats

**File: `src/pages/Index.tsx`** — Add scroll-to-bottom FAB
**File: `src/components/ChatMessage.tsx`** — Add reaction buttons
**File: `src/components/ChatInputEnhanced.tsx`** — Add character count

### 8. Move Model Selector to Bottom-Right
**File: `src/pages/Index.tsx`**
- Move `<ModelSelector>` from above the input to inside the input bar area, right side
- Position it next to the search toggles (Web/Deep) or as part of the input bar row

### 9. 3D-Style Buttons Everywhere
**File: `src/index.css`**
- Add a `.btn-3d` utility class with box-shadow layers creating depth effect:
  ```css
  .btn-3d {
    box-shadow: 0 2px 0 hsl(220 10% 8%), 0 4px 8px rgba(0,0,0,0.3);
    transform: translateY(-1px);
    transition: all 0.15s;
  }
  .btn-3d:active {
    transform: translateY(1px);
    box-shadow: 0 0 0 hsl(220 10% 8%), 0 1px 2px rgba(0,0,0,0.2);
  }
  ```
- Apply to buttons in `ChatInputEnhanced`, `WelcomeScreen`, `ModelSelector`, `LandingPage`

---

## Files Summary

| File | Change |
|------|--------|
| `src/components/LandingPage.tsx` | Add blog/articles SEO section |
| `src/components/ModelSelector.tsx` | Add Qurob 2 legacy model |
| `src/components/ChatMessage.tsx` | Add edit button + emoji reactions |
| `src/hooks/useChat.ts` | Add editMessage function |
| `src/components/ThinkingIndicator.tsx` | Professional shimmer animation |
| `src/components/ChatInputEnhanced.tsx` | Fix file accept, add char count |
| `src/pages/Index.tsx` | Move model selector, add scroll-to-bottom |
| `src/index.css` | Add btn-3d class |
| `supabase/functions/chat/index.ts` | Add Qurob 2 model map, update token limits |
| DB migration | Add UPDATE policy on messages table |

