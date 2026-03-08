

# Professional UI Overhaul + Model Selector Fix + Image Generation Fix + SEO

## Problems Identified

1. **Model Selector Bug**: The `ModelSelector` checks `hasSubscription` as a boolean — if user has ANY paid sub, they can use ALL paid models. Need per-model gating (e.g., user with Qurob 4 sub should NOT access Q-06 for free).
2. **Image Generation Failing**: Uses Fireworks API (`FIREWORKS_API_KEY`) which may be failing. Should use Lovable AI Gateway with `google/gemini-3-pro-image-preview` as primary.
3. **UI needs gray-black professional theme** with Claude-like typography and 3D text effects.
4. **SEO improvements** for Google ranking.

---

## Changes

### 1. Fix Model Selector — Per-Model Subscription Gating

**File: `src/components/ModelSelector.tsx`**
- Instead of `hasSubscription: boolean`, store the actual subscribed model name (e.g., `"Qurob 4"` or `"Q-06"` or `"Qurob 3.2"`)
- A user with Qurob 4 sub can only use Qurob 3.2 and Qurob 4 (NOT Q-06)
- A user with Q-06 sub can only use Qurob 3.2 and Q-06 (NOT Qurob 4)
- Lock icon and redirect to `/subscribe` for models they haven't paid for

### 2. Fix Image Generation — Use Lovable AI Gateway

**File: `supabase/functions/chat/index.ts`**
- Replace Fireworks API image generation with Lovable AI Gateway using `google/gemini-3-pro-image-preview` model
- Keep Fireworks as fallback
- This ensures image generation works reliably

### 3. Professional Gray-Black Theme

**File: `src/index.css`**
- Shift the color palette from teal-blue to a more neutral gray-black scheme:
  - Background: deeper black `228 12% 5%`
  - Cards: subtle gray `225 10% 9%`
  - Primary: neutral silver-blue `220 15% 65%` (less saturated, more professional)
  - Accent: subtle warm gray
  - Borders: sharper gray lines
- This creates a Claude/Anthropic-like professional aesthetic

### 4. Claude-Like Chat UI with 3D Text

**File: `src/components/ChatMessage.tsx`**
- User messages: right-aligned with dark gray bubble
- Assistant messages: clean left-aligned, thin border-left accent, no heavy gradients
- Font: slightly larger line-height, lighter weight for readability
- Remove gradient backgrounds, use solid subtle colors

**File: `src/components/ChatInputEnhanced.tsx`**
- Cleaner input bar: single solid border, no gradient background
- Refined button styles matching gray-black theme

**File: `src/components/WelcomeScreen.tsx`**
- 3D text effect on greeting using CSS text-shadow layers
- Professional gray-toned quick action cards

**File: `src/components/ChatSidebar.tsx`**
- Darker sidebar matching the new palette
- Subtle hover states

### 5. SEO Enhancements

**File: `index.html`**
- Add `preconnect` for Google Fonts
- Add `theme-color` meta tag
- Add `apple-mobile-web-app-capable` tags
- Improve meta description with keywords

**File: `public/robots.txt`**
- Add crawl-delay directive
- Ensure all public routes are indexable

**File: `src/components/LandingPage.tsx`**
- Add semantic HTML (`<article>`, `<section>` with proper headings)
- Add `aria-label` attributes for accessibility (helps SEO)

---

## Files Summary

| File | Change |
|------|--------|
| `src/components/ModelSelector.tsx` | Per-model gating instead of boolean |
| `supabase/functions/chat/index.ts` | Image gen via Lovable AI Gateway |
| `src/index.css` | Gray-black professional theme |
| `src/components/ChatMessage.tsx` | Clean Claude-style bubbles |
| `src/components/ChatInputEnhanced.tsx` | Refined input bar |
| `src/components/WelcomeScreen.tsx` | 3D text, professional cards |
| `src/components/ChatSidebar.tsx` | Darker sidebar |
| `index.html` | SEO meta improvements |
| `src/components/LandingPage.tsx` | Semantic HTML for SEO |

