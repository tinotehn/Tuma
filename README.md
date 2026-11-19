
# Tuma — WhatsApp-native Payments for Zimbabwe

> No app. No data. Just WhatsApp.

Zimbabwe lives on WhatsApp. Data is expensive, phone storage is low. Tuma lets anyone pay ZESA, rent, tuition, and shops INSIDE WhatsApp. No bank app needed.

**Live Demo:** wa.me/[your-number] → Type "pay 50 for ZESA"

### Why Tuma?
- 95% of Zim internet is WhatsApp
- SMEs can't afford bank integrations
- EcoCash charges high, but everyone has it
- RBZ wants audit trail — we provide it

### Stack
- **Frontend:** Next.js 14 (App Router) + 

Tailwind
- **Backend:** Next.js API Routes + Supabase (Postgres)
- **Messaging:** WhatsApp Cloud API
- **AI:** Gemini API (JSON parsing) + Local Fallback Parser
- **Payments:** Paynow + EcoCash (STK Push)

### How it Works
1. User sends WhatsApp: "pay 50 for zesa 077xxxxxx"
2. Webhook `app/api/webhook/route.ts` receives
3. `geminiParser.ts` → `{amount: 50, biller: "ZESA"}`
4. If Gemini down → `fallbackParser.ts` (regex)
5. `secureValidate.ts` checks PIN/OTP + balance + duplicate
6. `paynow/client.ts` moves money
7. WhatsApp receipt sent + logged to 

`rbz_compliance_logs`

### Security
- Gemini key has ZERO access to funds. Only parses text → JSON.
- Money movement requires user PIN/OTP + Supabase Row Level Security + Paynow token.
- Every payment logged to `audit_logs` for RBZ.
- Rate limiter: 5 req/min per phone.

### Repo Structure
See file tree in repo root.

### Setup (for team)
1. `git clone`
2. `cp .env.example .env` — fill your keys (never commit .env)
3. `npm install && npm run dev`
4. Run SQL in `lib/supabase/schema.sql` in Supabase


### Team
- Product Owner / Frontend / Zim Market: [Tino Gandawa]
- Backend Hardening: Akanbi Ibrahim — secure validation + fallback

### Compliance
All payments exportable as CSV for RBZ audit.

Built in Harare, for Harare.
