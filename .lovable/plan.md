

# Plan: Fix Maintenance Mode, Push Notifications, Official Qurobs & India-First AI Identity

## Issues & Solutions

### 1. Maintenance Mode Not Working
**Problem:** The maintenance mode toggle exists in Admin Panel and the `maintenance_mode` table works, but the actual app (chat page, routes) never checks the maintenance status. Users see nothing when maintenance is ON.

**Fix:**
- Create a `MaintenancePage.tsx` component with a branded maintenance UI
- Add a `useMaintenanceMode` hook that checks `maintenance_mode` table on app load
- Wrap `AppRoutes` in `App.tsx` to show `MaintenancePage` when maintenance is enabled (bypass for admin)

### 2. Push Notifications Fix
**Problem:** The `sendWebPush` function in `send-push/index.ts` is a dummy — it just POSTs payload as plain text without proper VAPID authentication/encryption. Web Push requires JWT + ECDH encryption.

**Fix:**
- Rewrite `send-push/index.ts` to use in-app notifications as the primary delivery (insert into `notifications` table)
- Keep Web Push as best-effort using the existing service worker approach
- Add a fallback: when push fails, ensure in-app notification is always created so users never miss anything

### 3. Official Qurobs (India-Themed)
**Fix:** Add official Qurobs via database migration (INSERT into `qurob_bots`):
- **Abacus Master** — Teaches kids mental math, Vedic maths tricks
- **Dr. Home Remedy** — Home treatment guides, first aid tips
- **Ayurveda Guide** — Traditional Ayurvedic remedies, herbs, doshas
- **India Explorer** — Indian history, states, culture, traditions, one-click knowledge
- **Desh ki Baat** — India news, politics, economy, always pro-India patriotic tone

All set as `is_official = true`, `is_public = true`, with the admin's user_id.

### 4. India-First AI Personality & Pro-India Responses
**Fix:** Update the system prompt in `supabase/functions/chat/index.ts`:
- Add a dedicated `## INDIA FIRST — CORE IDENTITY` section
- Always positive about India in sports, culture, tech, economy
- "India vs Pakistan match?" → "India Jeetega!!" type responses
- Human-like conversational style — not robotic
- Indian cultural awareness (festivals, states, languages, food)
- Use Indian examples, INR currency, IST time by default

### 5. Prompt Creation Feature (Productivity)
**Fix:** Add a "Prompt Library" section in the chat welcome screen:
- Quick prompt templates users can tap to start conversations
- Categories: Writing, Coding, Learning, Creative, Business, India
- Stored in `chat_templates` table (already exists)
- Add pre-seeded India-themed prompt templates via migration

## Files to Change

1. **New:** `src/components/MaintenancePage.tsx` — Full-screen maintenance UI
2. **New:** `src/hooks/useMaintenanceMode.ts` — Hook to check maintenance status
3. **Edit:** `src/App.tsx` — Integrate maintenance mode check
4. **Edit:** `supabase/functions/send-push/index.ts` — Add in-app notification fallback
5. **Edit:** `supabase/functions/chat/index.ts` — India-first personality, human-like tone
6. **Migration:** Insert official Qurobs + India prompt templates
7. **Edit:** `src/components/WelcomeScreen.tsx` — Add prompt templates section

## Database Changes
- INSERT official Qurob bots (5-6 bots)
- INSERT India-themed prompt templates into `chat_templates`

