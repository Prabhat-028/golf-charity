# Setup Requirements

This file lists everything you must create/configure to run this project on localhost.

## 1) Accounts You Need

- Supabase account and project
- Stripe account (test mode is fine for local setup)
- Node.js 18+ installed

## 2) Frontend Environment File

Create this file:

- `apps/web/.env`

Add these values:

```bash

VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_MONTHLY_PRICE_ID=price_xxx
VITE_STRIPE_YEARLY_PRICE_ID=price_xxx
```

How to get them:

- `VITE_SUPABASE_URL`: Supabase Project Settings -> API -> Project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase Project Settings -> API -> anon public key
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe Developers -> API keys -> Publishable key
- `VITE_STRIPE_MONTHLY_PRICE_ID`: Stripe Product price ID for monthly plan
- `VITE_STRIPE_YEARLY_PRICE_ID`: Stripe Product price ID for yearly plan

## 3) Supabase Edge Function Secrets

Set these in Supabase project secrets (for edge functions):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_YEARLY_PRICE_ID=price_xxx
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
```

How to get them:

- `SUPABASE_URL`: same as project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Project Settings -> API -> service_role key
- `STRIPE_SECRET_KEY`: Stripe Developers -> API keys -> Secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe Developers -> Webhooks -> endpoint signing secret
- `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_YEARLY_PRICE_ID`: Stripe price IDs
- `ALLOWED_ORIGINS`: comma-separated list of trusted frontend origins

## 4) Required URLs

- Frontend local URL: `http://localhost:5173`
- Stripe webhook URL (after function deploy):

```text
https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
```

Use this URL in Stripe Webhooks settings.

## 5) Database Requirements

Run these SQL migrations in order:

1. `packages/supabase/migrations/001_initial_schema.sql`
2. `packages/supabase/migrations/002_winner_verification_storage.sql`
3. `packages/supabase/migrations/003_avatar_storage.sql`
4. `packages/supabase/migrations/004_email_preferences.sql`
5. `packages/supabase/migrations/005_gdpr_requests.sql`
6. `packages/supabase/migrations/006_platform_settings.sql`
7. `packages/supabase/migrations/007_push_notifications.sql`

## 6) Functions You Must Deploy

- `packages/supabase/functions/create-checkout-session`
- `packages/supabase/functions/create-portal-session`
- `packages/supabase/functions/stripe-webhook`

## 7) Quick Local Run Checklist

1. `npm install`
2. `npm --prefix apps/web install`
3. Add all values above in `apps/web/.env` and Supabase secrets
4. Run migrations
5. Deploy edge functions
6. Start app: `npm --prefix apps/web run dev`
7. Open `http://localhost:5173`

Alternative root shortcut:

- `npm run dev`

If `5173` is busy, Vite will start on the next available port (for example `5174`).

## 8) Common Errors

- `turbo is not recognized`: run `npm install` in repository root
- Stripe checkout fails: verify price IDs and `STRIPE_SECRET_KEY`
- Portal fails with customer error: ensure webhook updated user profile with `stripe_customer_id`
- CORS/origin error from edge functions: verify `ALLOWED_ORIGINS` includes your frontend URL
