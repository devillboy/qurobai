
# QurobAi Phase 2: Complete Implementation Plan

## Overview

Based on thorough codebase analysis and user requirements, this plan covers:

1. **Q-06 Separate Paid Listing** - List Q-06 as separate ₹320/month product (NOT bundled free)
2. **Animated Splash Screen** - Premium splash with QurobAi logo
3. **AI Model Upgrade & Training** - Upgrade model parameters and knowledge
4. **UI Polish & Animations** - Loading states, micro-interactions, premium feel
5. **Enhanced Real-time Data** - More accurate, comprehensive knowledge

---

## AI Model Options Analysis (For Your Selection)

### Available AI Models via Lovable AI Gateway (Best Options)

| For Ai Provided some api's for ai selection form there not use any ai of lovable 

---

## Phase 1: Animated Splash Screen

### New File: `src/components/SplashScreen.tsx`
Premium animated splash screen featuring:
- QurobAi logo (provided image) with pulsing glow animation
- Gradient background with animated particles
- Loading progress bar with smooth transitions
- "Powered by Advanced AI" tagline
- Auto-fade to main app after 2.5 seconds

### App.tsx Integration
- Show splash on initial load before content renders
- Use React state to manage splash visibility
- Smooth fade-out transition to main content

---

## Phase 2: Q-06 Separate Paid Listing

### File: `src/pages/Subscribe.tsx` Changes
**Current State:** Q-06 shown as "bundled FREE with Qurob 4"
**Required State:** Q-06 listed separately at ₹320/month

Changes:
1. Add Q-06 as third pricing card
2. Remove "Q-06 Included FREE" badge from Qurob 4
3. Update Qurob 4 features to only show core premium benefits
4. Q-06 card shows:
   - Price: ₹320/month
   - Code specialist features
   - 100+ programming languages
   - Architecture design
   - Can be purchased standalone OR with Qurob 4

### Database Update
Verify `subscription_plans` table has Q-06 plan entry with ₹320 price

---

## Phase 3: AI Model Upgrade to Lovable AI

### File: `supabase/functions/chat/index.ts` Rewrite
Replace current multi-provider setup with Lovable AI Gateway:

```text
Current Flow:
User -> Edge Function -> Multiple APIs (OpenRouter/Groq/Fireworks/DeepInfra)

New Flow:
User -> Edge Function -> Lovable AI Gateway -> Best Available Model
```

### Model Mapping:
- **Qurob 2 (Free):** `google/gemini-2.5-flash` - Fast, 260B+ equivalent
- **Qurob 4 (Premium):** `google/gemini-2.5-pro` - 1T+ equivalent reasoning
- **Q-06 (Code):** `google/gemini-2.5-pro` with code-optimized system prompt

### Benefits:
- Automatic rate limit handling (429/402 surfaced to users)
- Pre-configured LOVABLE_API_KEY (no secret management)
- Access to latest Google and OpenAI models
- Better reliability with built-in fallbacks

---

## Phase 4: Enhanced AI Knowledge Base

### QUROBAI_KNOWLEDGE Update
Expand knowledge base with:
1. **Updated Pricing Structure**
   - Qurob 2: Free
   - Qurob 4: ₹289/month (1T+ parameter equivalent)
   - Q-06: ₹320/month (separate)

2. **Model Capabilities**
   - Deep reasoning and analysis
   - Multi-language support (35+ languages)
   - Real-time data access with improved accuracy
   - Image generation and vision analysis

3. **Enhanced Real-time Sources**
   - Better cricket score parsing
   - Multiple currency API fallbacks
   - More reliable stock data
   - Trending topics detection

---

## Phase 5: Loading Animations & UI Polish

### New CSS Animations in `src/index.css`
```css
/* Splash screen animations */
@keyframes logoGlow {
  0%, 100% { filter: drop-shadow(0 0 20px hsl(var(--primary) / 0.5)); }
  50% { filter: drop-shadow(0 0 40px hsl(var(--primary) / 0.8)); }
}

@keyframes particleFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
}

@keyframes progressGrow {
  from { width: 0%; }
  to { width: 100%; }
}

/* Enhanced loading states */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.loading-shimmer {
  background: linear-gradient(90deg, transparent, hsl(var(--primary) / 0.2), transparent);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Component Updates
1. **ChatMessage.tsx** - Add loading skeleton states
2. **ChatSidebar.tsx** - Smooth conversation loading
3. **LandingPage.tsx** - Enhanced hero animations
4. **All Cards** - Subtle hover micro-interactions

---

## Phase 6: Premium Assets

### Copy User Logo to Project
- Copy QurobAi logo from uploaded file to `src/assets/qurob-logo.png`
- Use in splash screen and throughout app
- Optimize for various sizes (favicon, header, splash)

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `src/components/SplashScreen.tsx` | Animated splash screen component |
| `src/assets/qurob-logo.png` | QurobAi logo asset |

### Modified Files
| File | Changes |
|------|---------|
| `src/App.tsx` | Add SplashScreen wrapper |
| `src/pages/Subscribe.tsx` | Q-06 separate listing, update Qurob 4 |
| `supabase/functions/chat/index.ts` | Lovable AI integration, enhanced knowledge |
| `src/index.css` | New animations (splash, shimmer, particles) |
| `src/components/ChatMessage.tsx` | Loading skeletons |
| `supabase/config.toml` | Update chat function config |

---

## Technical Implementation Order

```text
Step 1: Copy logo asset to project
Step 2: Create SplashScreen component
Step 3: Integrate splash into App.tsx
Step 4: Update Subscribe.tsx for Q-06 separate listing
Step 5: Upgrade chat function to Others Api  ( Provided Already)
Step 6: Add new CSS animations
Step 7: Test all flows end-to-end
```

---

## Expected Outcomes

1. **Premium First Impression** - Animated splash screen with QurobAi branding
2. **Clear Pricing** - Q-06 as separate ₹320/month product
3. **Upgraded AI** - 260B+ (Qurob 2) and 1T+ (Qurob 4) equivalent models
4. **Better Knowledge** - More accurate, real-time responses
5. **Polished UI** - Loading animations, micro-interactions, premium feel
6. **Reliability** - Lovable AI gateway with automatic error handling
