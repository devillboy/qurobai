
# QurobAi Phase 3: Mega Enhancement Plan

## Overview

This comprehensive plan addresses all requested improvements across 11 major areas:

1. **Settings UI Complete Redesign** - Modern Claude/Perplexity aesthetic
2. **API System Fix & Monetization** - Real working API with limits and pricing
3. **AI Knowledge Enhancement** - 100K+ skills, 1T+ parameter models
4. **Mobile-First Design** - Optimized chat input, responsive layouts
5. **Admin Panel 25+ Features** - User deletion, analytics, bulk operations
6. **Real-time Website Checking** - AI can visit and analyze URLs
7. **Voice Mode Enhancement** - Live conversation with AI
8. **Custom GPTs Feature** - Users create their own AI assistants
9. **Automatic Payment Gateway** - Stripe/Razorpay integration (no screenshots)
10. **Splash Screen on All Pages** - 3-second loading on every navigation
11. **Chat Input Enhancement** - Better design, smarter suggestions

---

## Phase 1: API System Complete Fix

### Current Issues
- API documentation is dummy/placeholder
- Unlimited API key creation (no limits)
- Qurob 4 API not properly monetized
- API doesn't track real usage

### Solution

#### File: `src/pages/ApiAccess.tsx` Changes
```text
1. Add API key creation limits:
   - Free users: Max 2 API keys (Qurob 2 only)
   - Premium users: Max 5 API keys (Qurob 2 + Qurob 4)
   - Q-06 subscribers: Unlimited keys for all models

2. Add proper API pricing display:
   - Qurob 2 API: Free trial (35 days, 1000 req/day)
   - Qurob 4 API: Requires Premium subscription + API addon (₹99/month)
   - Q-06 API: Included with Q-06 subscription

3. Real API documentation with working examples:
   - Live "Try it now" button with test requests
   - Response preview panel
   - Error code explanations
   - Rate limit documentation
```

#### File: `supabase/functions/api-chat/index.ts` Enhancements
```text
1. Add proper rate limiting per API key
2. Add usage tracking with monthly/daily limits
3. Implement tiered access:
   - Trial: 1000 requests/day, 10K/month
   - Premium: 10K requests/day, 100K/month
   - Enterprise: Unlimited
4. Add API key validation with expiry checking
5. Return proper usage headers in response
```

#### Database Changes
Add `api_key_limits` table:
- user_id, max_keys, api_addon_active, api_addon_expires_at

---

## Phase 2: Settings UI Complete Redesign

### New Design Principles
- Claude 30% + Perplexity 70% aesthetic
- Clean card sections with subtle gradients
- Grouped features with icons
- Smooth animations on open/close

### File: `src/components/SettingsDialog.tsx` Complete Rewrite

#### New UI Sections:
```text
1. Profile Card (Top)
   - Avatar with edit option
   - Display name editable inline
   - Email + Member since
   - Subscription badge

2. AI Preferences
   - Model selector (if premium)
   - Voice input/output toggle
   - Language preference (35+ options)
   - Response style selector

3. Appearance
   - Theme toggle (Dark/Light/System)
   - AI Themes picker (new feature)
   - Font size adjustment
   - Chat density (compact/comfortable)

4. Developer Tools
   - API Access
   - Chat Search
   - Export Data
   - Keyboard shortcuts

5. Privacy & Security
   - Download all data
   - Delete account option
   - Session management

6. Support & Legal
   - Support Chat
   - Privacy Policy
   - Terms of Service
   - Security info
```

---

## Phase 3: Mobile-First Chat Design

### Current Issue
- Chat input is too high on mobile
- Buttons are small for touch
- Sidebar overlay issues

### File: `src/components/ChatInputEnhanced.tsx` Improvements
```text
1. Sticky bottom positioning for mobile
2. Larger touch targets (48px minimum)
3. Swipe-to-record voice mode
4. Smart suggestions above input
5. Attachment preview carousel
6. Send button glow when ready
```

### File: `src/pages/Index.tsx` Mobile Fixes
```text
1. Safe area insets for notch phones
2. Floating action button for mobile
3. Pull-to-refresh for conversations
4. Swipe gestures for sidebar
5. Mobile Friendly Usbable 
```

---

## Phase 4: Admin Panel 25+ Features

### Current Features (10):
1. Dashboard stats
2. Payment approval/rejection
3. AI payment verification
4. User list
5. Coupon management
6. Announcements
7. Email broadcast
8. Push notifications
9. Maintenance mode
10. Gift subscriptions

### New Features to Add (15+):

#### User Management
```text
11. Delete user by ID - Complete data wipe
12. User activity timeline - Last login, actions
13. Conversation count per user
14. Ban/Suspend user temporarily
15. View user's chat history (admin only)
```

#### Analytics Dashboard
```text
16. Daily/weekly/monthly charts (using recharts)
17. User growth visualization
18. Revenue breakdown by plan
19. API usage statistics
20. Popular conversation topics
```

#### Content Moderation
```text
21. Flagged conversations queue
22. Word filter management
23. Auto-moderation rules
```

#### System Management
```text
24. Edge function health status
25. Error log viewer
26. Database size monitoring
27. Backup trigger button
```

#### Bulk Operations
```text
28. Export all users to CSV
29. Bulk gift subscriptions
30. Mass email with templates
```

---

## Phase 5: AI Real-time Website Checking + Button In Chat box Deep Search

### New Capability
Allow AI to visit URLs and analyze website content

### Implementation

#### File: `supabase/functions/chat/index.ts` Addition
```text
New function: fetchWebsiteContent(url)
- Uses jsdom-like parsing
- Extracts main content, title, meta
- Handles errors gracefully
- Rate limited (5 URLs per message)

Detection pattern:
- "check this website: [url]"
- "analyze this link: [url]"
- "what's on [url]"
- URLs starting with http/https
```

---

## Phase 6: Voice Mode Live Conversation

### Implementation

#### New File: `src/components/VoiceModeDialog.tsx`
```text
Features:
- Full-screen voice interface like chat gpt animation 
- Waveform visualization
- Push-to-talk or auto-detect
- Real-time transcription display
- AI voice response (Web Speech API)
- 35+ language support
```

#### Web Speech API Usage
```text
- SpeechRecognition for input
- SpeechSynthesis for output
- Language detection and auto-switch
- Noise cancellation hints
```

---

## Phase 7: Custom GPTs (Qurobs)

### Concept
Users create custom AI assistants with specific:
- System prompts
- Knowledge files
- Personality settings
- Specific use cases

### New Components

#### File: `src/components/QurobBotBuilder.tsx`
```text
Builder interface:
- Name your bot
- Description
- Avatar selection
- System prompt editor
- Knowledge base upload (PDF, TXT)
- Test conversation
- Publish (public/private)
```

#### Database Tables
```sql
CREATE TABLE qurob_bots (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  name text NOT NULL,
  description text,
  avatar_url text,
  system_prompt text NOT NULL,
  is_public boolean DEFAULT false,
  uses_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE bot_knowledge (
  id uuid PRIMARY KEY,
  bot_id uuid REFERENCES qurob_bots,
  content text NOT NULL,
  source_name text
);
```

---

## Phase 8: Automatic Payment Gateway

### Remove Screenshot System
Replace manual UPI screenshot verification with automatic payment processing

### Integration Options

#### Option A: Razorpay (Recommended for India)
```text
- Automatic UPI, Cards, NetBanking
- Instant verification
- Subscription management
- Webhook for payment status
```

#### Option B: Stripe (International)
```text
- Global card payments
- Subscription billing
- Webhook integration
```

### Implementation

#### New Edge Function: `supabase/functions/create-payment/index.ts`
```text
- Create Razorpay order
- Return payment link/QR
- Handle callback
```

#### New Edge Function: `supabase/functions/payment-webhook/index.ts`
```text
- Verify signature
- Auto-activate subscription
- Send confirmation notification
```

#### File: `src/pages/Subscribe.tsx` Changes
```text
- Replace screenshot upload with Razorpay button
- Show payment status in real-time
- Instant subscription activation
- Receipt download
```

---

## Phase 9: Splash Screen on All Pages

### Current State
Splash shows only once per session on app load

### New Behavior
Show splash for 3 seconds on every page navigation

### File: `src/App.tsx` Changes
```text
- Wrap each route with SplashScreen
- Use React Router's navigation events
- Show splash on route change
- Configurable duration (3 seconds)
```

### File: `src/components/SplashScreen.tsx` Updates
```text
- Shorter animation (3s total)
- Skip button for returning users
- Remember preference in localStorage
```

---

## Phase 10: Enhanced AI Knowledge

### Current AI Capabilities
- Real-time weather, crypto, stocks, news
- Cricket scores, currency rates
- Basic coding assistance

### Enhancements

#### 100K+ Skills Training
```text
Categories:
1. Programming (100+ languages)
2. Science & Math
3. History & Geography
4. Art & Design
5. Music & Entertainment
6. Business & Finance
7. Health & Fitness
8. Cooking & Recipes
9. Travel & Culture
10. Gaming & Esports
```

#### Enhanced QUROBAI_KNOWLEDGE Base
```text
- Detailed model specifications (1T+ parameters)
- Complete pricing information
- All features documentation
- FAQs with 100+ questions
- Troubleshooting guides
- Easter eggs and fun responses
```

---

## Phase 11: Chat Input Enhancements

### File: `src/components/ChatInputEnhanced.tsx` Improvements
```text
1. Smart suggestions based on context
2. Recent prompts dropdown
3. Template quick-access
4. Emoji picker
5. Markdown preview toggle
6. Character count for long messages
7. @mention for future multi-user
8. /commands for quick actions
```

---

## Files Summary

### New Files to Create
| File | Purpose |
|------|---------|
| `src/components/AIThemesDialog.tsx` | Theme customization |
| `src/components/VoiceModeDialog.tsx` | Full voice conversation |
| `src/components/QurobBotBuilder.tsx` | Custom GPT builder |
| `src/pages/QurobBots.tsx` | Browse/manage custom bots |
| `supabase/functions/create-payment/index.ts` | Razorpay order creation |
| `supabase/functions/payment-webhook/index.ts` | Payment verification webhook |
| `supabase/functions/fetch-website/index.ts` | URL content fetching |

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/SettingsDialog.tsx` | Complete UI redesign |
| `src/pages/ApiAccess.tsx` | Add limits, pricing, real docs |
| `src/pages/AdminPanel.tsx` | Add 15+ new features |
| `src/components/ChatInputEnhanced.tsx` | Mobile-first, enhancements |
| `src/pages/Subscribe.tsx` | Replace with Razorpay |
| `src/pages/Index.tsx` | Mobile optimizations |
| `src/App.tsx` | Splash on all pages |
| `supabase/functions/chat/index.ts` | Website checking, enhanced knowledge |
| `supabase/functions/api-chat/index.ts` | Rate limiting, usage tracking |

### Database Migrations
```sql
-- API key limits
CREATE TABLE api_key_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users,
  max_keys integer DEFAULT 2,
  api_addon_active boolean DEFAULT false,
  api_addon_expires_at timestamptz
);

-- Custom bots
CREATE TABLE qurob_bots (...);
CREATE TABLE bot_knowledge (...);

-- User preferences
ALTER TABLE user_settings ADD COLUMN font_size text DEFAULT 'medium';
ALTER TABLE user_settings ADD COLUMN chat_density text DEFAULT 'comfortable';
ALTER TABLE user_settings ADD COLUMN voice_language text DEFAULT 'en-US';
```

---

## Implementation Priority

```text
CRITICAL (This Session)
├── API System Fix (limits, pricing, real functionality)
├── Settings UI Redesign 
├── Mobile Chat Input Fix
└── Admin Panel User Deletion

HIGH (Next Session)
├── Automatic Payment Gateway (Razorpay)
├── Voice Mode Enhancement
├── AI Website Checking
└── Enhanced AI Knowledge

MEDIUM (Future)
├── Custom GPTs (QurobBots)
├── Splash on All Pages
└── Analytics Dashboard

LOW (Backlog)
├── Content Moderation
├── Bulk Operations
└── Advanced Admin Features
```

---

## Expected Outcomes

1. **Working API** - Real documentation, proper limits, monetized Qurob 4 API
2. **Premium Settings** - Modern, organized, feature-rich settings panel
3. **Mobile Excellence** - Smooth touch experience, proper layouts
4. **Admin Power** - 25+ features including user deletion and analytics
5. **AI Capabilities** - Website checking, 100K+ skills, deep knowledge
6. **Voice Chat** - Live conversation with AI in 35+ languages
7. **Auto Payments** - Instant verification, no manual screenshots
8. **Custom Bots** - Users create their own AI assistants
