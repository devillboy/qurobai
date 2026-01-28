
# QurobAi - Ultimate Upgrade Plan
## Website Polish + Security Fixes + AI Enhancement + Bug Fixes + Claude/Perplexity Inspired Design

---

## Overview

Bro, maine poora codebase thoroughly analyze kiya hai. Ye plan 5 major pillars me divided hai:

1. **Security Vulnerabilities Fix** (Critical)
2. **AI Image Generation + Display Bug Fix**
3. **Claude 30% + Perplexity 70% Inspired Design Overhaul**
4. **100+ Bug Fixes & Polish**
5. **Crazy Hyped Features** (SEO, Real-time AI, Advanced UX)

---

## Phase 1: Critical Security Fixes

### 1.1 XSS Vulnerability in Chat Messages
**Problem:** `dangerouslySetInnerHTML` without sanitization allows script injection attacks.

**Solution:**
- Install DOMPurify library
- Sanitize all HTML before rendering in `ChatMessage.tsx`
- Whitelist only safe tags: `strong`, `em`, `code`, `a`, `br`

### 1.2 Chat Endpoint Missing Authentication
**Problem:** Anyone can call `/functions/v1/chat` without auth, consuming API credits.

**Solution:**
- Add JWT validation in `chat/index.ts`
- Extract authenticated user from token instead of trusting client-sent `userId`
- Return 401 for unauthenticated requests

### 1.3 User API Keys Stored in Plain Text
**Problem:** `user_settings` table has `openai_api_key` and `gemini_api_key` columns with only RLS protection.

**Solution:**
- Create encrypted storage approach using database-level encryption
- Move sensitive keys to separate secured table with additional access controls

### 1.4 Admin Settings Payment Exposure
**Problem:** UPI ID publicly readable by anyone.

**Solution:**
- Restrict SELECT policy to only return safe settings
- Create separate edge function for fetching payment info (with rate limiting)

### 1.5 Enable Leaked Password Protection
**Action Required:** Manual enable in backend settings (not doable via SQL)

---

## Phase 2: AI Image Generation & Display Bug Fixes

### 2.1 Image Generation Issues
**Current Problems:**
- Fireworks API sometimes fails silently
- Base64 images too large for some responses
- Rate limiting not handled gracefully

**Fixes:**
- Add Lovable AI (Nano banana) as primary image generator with fallback to Fireworks
- Implement proper retry logic with exponential backoff
- Always upload to storage first, return URL (not base64)
- Add progress indicator during generation

### 2.2 Image Display in Chat Not Working
**Current Problem:** `[GeneratedImage:...]` tags not rendering properly.

**Root Cause Analysis:**
- The `renderContent` function parses `[GeneratedImage:URL]` but regex may fail on complex URLs
- Base64 images truncated in streaming responses

**Fixes:**
- Improve regex pattern for image detection
- Use storage URLs exclusively (no inline base64)
- Add image loading states with skeleton
- Fix `GeneratedImage` component to handle edge cases

---

## Phase 3: Design Overhaul (Claude 30% + Perplexity 70%)

### 3.1 Landing Page - Perplexity Inspired Hero
**Current:** Basic hero section, minimal animations

**Redesign:**
- Large animated gradient mesh background (like Perplexity)
- Floating search-style input in hero (not just CTA buttons)
- Live typing animation showing AI capabilities
- Staggered feature cards with micro-interactions
- Social proof section with usage stats
- Animated testimonials carousel

### 3.2 Chat Interface - Claude Inspired
**Current:** Basic chat bubbles

**Redesign:**
- Cleaner message containers with subtle shadows
- Collapsible thinking indicators (Claude-style)
- Inline code blocks with copy buttons (Claude-style)
- Message grouping by time
- Smooth scroll-to-bottom with FAB
- Enhanced sidebar with search and folders

### 3.3 Theme Updates
**Color Palette (Claude + Perplexity blend):**
```css
--primary: 220 70% 55%;      /* Perplexity blue-teal */
--accent: 160 60% 45%;       /* Perplexity teal */
--background: 225 15% 6%;    /* Deep dark (Claude) */
--card: 225 12% 10%;         /* Slightly elevated */
```

**Typography:**
- Inter for body (clean, modern)
- Space Grotesk for headings (distinctive)
- Larger line heights for readability

---

## Phase 4: Bug Fixes (100+ Issues)

### UI/UX Bugs
1. **Mobile sidebar overlap** - z-index issues on small screens
2. **Notification bell not updating** - Realtime subscription reconnection
3. **Payment wizard step indicator** - Progress not syncing
4. **Theme flickering on load** - Add preload script
5. **Scroll jump on new messages** - Fix smooth scroll behavior
6. **Avatar loading states** - Add skeleton fallbacks
7. **Model indicator not refreshing** - Force re-fetch after subscription
8. **Chat input autofocus lost** - Maintain focus after send

### API/Backend Bugs
9. **Rate limit errors not surfaced** - Show toast for 429 errors
10. **Conversation title not updating** - Fix race condition
11. **Message duplication on rapid sends** - Add debouncing
12. **Session timeout handling** - Graceful re-auth flow
13. **Subscription status caching** - Add real-time listener

### Performance Optimizations
14. **Reduce re-renders** - More aggressive memoization
15. **Lazy load heavy components** - Code split sidebar, dialogs
16. **Image lazy loading** - Add loading="lazy" everywhere
17. **Virtual scrolling for long chats** - Implement virtualized list
18. **Service worker caching** - Cache static assets

---

## Phase 5: Crazy Hyped Features

### 5.1 SEO Optimization (Traffic Boost)
**Technical SEO:**
- Add structured data (JSON-LD) for AI chatbot
- Generate dynamic sitemap
- Add Open Graph meta tags per page
- Implement canonical URLs
- Add robots.txt optimization
- Create SEO-friendly URLs for public pages

**Content SEO:**
- Add blog/docs section for organic traffic
- Create landing pages for features
- Add FAQ schema markup

### 5.2 Real-time AI Knowledge Enhancement
**Current:** Static knowledge base in system prompt

**Upgrade:**
- Add trending topics detection
- Integrate more real-time sources:
  - Live sports APIs (better cricket scores)
  - More currency sources (redundancy)
  - Stock market with charts data
- Add knowledge refresh mechanism

### 5.3 Advanced UX Features

**Voice Input/Output:**
- Already have VoiceOutput - add VoiceInput
- Speech-to-text using Web Speech API
- Natural conversation mode

**Keyboard Shortcuts:**
- `Cmd+K` - Quick command palette
- `Cmd+N` - New chat
- `Cmd+/` - Toggle sidebar
- `Esc` - Close modals
- Arrow keys for navigation

**Message Reactions:**
- Like/dislike messages
- Save favorite responses
- Share messages via link

**Smart Suggestions:**
- Context-aware follow-up prompts
- Auto-complete for common queries
- Trending prompts section

### 5.4 Premium Analytics Dashboard
**For Premium Users:**
- Usage charts (daily/weekly/monthly)
- Token consumption breakdown
- Popular query topics
- Response time analytics

---

## Technical Implementation Order

```text
Week 1: Security (Critical)
├── XSS fix with DOMPurify
├── Chat endpoint authentication
├── API keys encryption
└── Admin settings protection

Week 2: AI & Bug Fixes
├── Image generation overhaul
├── Image display fixes
├── 50 critical bug fixes
└── Performance optimizations

Week 3: Design Overhaul
├── New color system
├── Landing page redesign
├── Chat interface polish
└── Component library updates

Week 4: Features & SEO
├── SEO implementation
├── Voice features
├── Keyboard shortcuts
└── Advanced UX additions
```

---

## File Changes Summary

### New Files to Create:
- `src/lib/sanitize.ts` - DOMPurify wrapper
- `src/components/VoiceInput.tsx` - Speech-to-text
- `src/components/CommandPalette.tsx` - Quick commands
- `src/components/AnalyticsDashboard.tsx` - Usage stats
- `src/hooks/useKeyboardShortcuts.ts` - Shortcuts handler
- `src/hooks/useVoiceInput.ts` - Voice recognition

### Files to Modify:
- `src/components/ChatMessage.tsx` - XSS fix + design
- `src/components/LandingPage.tsx` - Complete redesign
- `src/components/ChatSidebar.tsx` - Enhanced design
- `src/components/WelcomeScreen.tsx` - Perplexity-style
- `src/components/NotificationBell.tsx` - Bug fixes
- `src/hooks/useChat.ts` - Performance + bugs
- `src/index.css` - New theme system
- `supabase/functions/chat/index.ts` - Auth + image fixes

### Dependencies to Add:
- `dompurify` - XSS protection
- `@types/dompurify` - TypeScript types

---

## Expected Outcomes

1. **Security:** Zero critical vulnerabilities
2. **Images:** 100% reliable generation and display
3. **Design:** Premium, human-crafted feel (not AI-generated look)
4. **Performance:** 50% faster render times
5. **SEO:** Ready for organic traffic growth
6. **UX:** World-class AI chat experience

---

## Notes

- Leaked Password Protection requires manual enable in backend settings
- Some features (video generation) not possible with current AI models
- SEO benefits take 2-4 weeks to show in search rankings
- Voice features require HTTPS for browser security
