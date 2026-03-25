# Golf Charity Subscription Platform

A subscription-based golf charity platform where users pay to participate in score-based draws. 10% goes to charity, and winners are determined by matching golf scores to drawn numbers.

## Tech Stack

- **Frontend**: React 19 + Vite 6
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (Database, Auth, Storage)
- **Payments**: Stripe
- **Structure**: Turborepo monorepo

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or pnpm 9+)
- Supabase account
- Stripe account

### Installation

1. Clone the repository
2. Install dependencies:

    ```bash
    npm install
    cd apps/web && npm install
    ```

3. Create your frontend environment file:

    ```bash
    cp apps/web/.env.example apps/web/.env
    ```

    Fill in your Supabase and Stripe credentials:
    ```
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
    VITE_STRIPE_MONTHLY_PRICE_ID=price_xxx
    VITE_STRIPE_YEARLY_PRICE_ID=price_xxx
    ```

4. Run database migrations in Supabase SQL Editor:
    - `packages/supabase/migrations/001_initial_schema.sql`
    - `packages/supabase/migrations/002_winner_verification_storage.sql`
    - `packages/supabase/migrations/003_avatar_storage.sql`
    - `packages/supabase/migrations/004_email_preferences.sql`
    - `packages/supabase/migrations/005_gdpr_requests.sql`
    - `packages/supabase/migrations/006_platform_settings.sql`
    - `packages/supabase/migrations/007_push_notifications.sql`

5. Deploy Supabase Edge Functions:
    - `packages/supabase/functions/create-checkout-session`
    - `packages/supabase/functions/create-portal-session`
    - `packages/supabase/functions/stripe-webhook`

6. Configure Stripe webhook endpoint to your deployed function URL:
    - `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`

7. Start the development server:
    ```bash
    cd apps/web
    npm run dev
    ```

8. Open [http://localhost:5173](http://localhost:5173)

## Environment Variables

### Frontend (`apps/web/.env`)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_MONTHLY_PRICE_ID=price_xxx
VITE_STRIPE_YEARLY_PRICE_ID=price_xxx
```

### Supabase Edge Functions (Supabase project secrets)

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_YEARLY_PRICE_ID=price_xxx
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
```

Security notes:
- Configure `ALLOWED_ORIGINS` to trusted frontend origins only. Stripe checkout/portal edge functions reject untrusted origins.
- The web app includes a Content Security Policy in `apps/web/index.html`; keep Stripe and Supabase domains in sync if you adjust integrations.

## Database Migration Guide

Run migrations in order from `packages/supabase/migrations/`.

1. `001_initial_schema.sql`
Purpose: core tables, RLS policies, and profile trigger.

2. `002_winner_verification_storage.sql`
Purpose: private `winner-verifications` storage bucket and admin-only storage policies.

3. `003_avatar_storage.sql`
Purpose: public `avatars` bucket and user-scoped avatar storage policies.

4. `004_email_preferences.sql`
Purpose: profile email preference columns.

5. `005_gdpr_requests.sql`
Purpose: GDPR request tracking table and policies for user/admin workflows.

6. `006_platform_settings.sql`
Purpose: configurable platform percentage settings used during draw execution.

7. `007_push_notifications.sql`
Purpose: stores browser push preference (`push_results_enabled`) on profiles.

After running all migrations:
- Confirm tables exist in `public` schema.
- Confirm storage buckets exist (`winner-verifications`, `avatars`).
- Confirm RLS policies are enabled.

### Build for Production

```bash
cd apps/web
npm run build
```

## Project Structure

```
golf-charity/
├── apps/
│   └── web/                 # React + Vite app
│       ├── src/
│       │   ├── components/  # UI and layout components
│       │   ├── context/     # React contexts (Auth, Toast)
│       │   ├── hooks/       # Custom hooks
│       │   ├── lib/         # Supabase & Stripe clients
│       │   └── pages/       # Page components
├── packages/
│   └── supabase/
│       └── migrations/      # Database migrations
├── turbo.json
└── package.json
```

## Features

### User Features
- **Authentication**: Email/password signup with verification
- **Subscriptions**: Monthly ($9.99) or Yearly ($99) plans
- **Score Management**: Submit and update 5 Stableford scores (1-45 points)
- **Draw Participation**: Automatic entry when all 5 scores are submitted
- **Results Viewing**: See past draws, winning numbers, and prize amounts
- **Charity Directory**: View supported charities and total donations
- **Account Settings**: Manage profile, subscription, and password

### Admin Features
- **Dashboard**: Overview of users, subscriptions, and revenue
- **Draw Management**: Create and execute monthly draws
- **User Management**: View all users with subscription status
- **Winner Verification**: Review winners and approve payouts
- **Charity Management**: Add/edit charity partners

### Draw System
- Generates 5 unique random numbers (1-45)
- Matches user scores against drawn numbers
- Prize distribution: 40% (5-match) / 35% (4-match) / 25% (3-match)
- 10% of all revenue goes to charity
- Winners split prizes in their tier

## Status

See `projectstatus.md` for detailed implementation status and next steps.

**Current Status**: Overall implementation ~92% complete; remaining work is primarily deployment configuration and final environment setup validation.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `cd apps/web && npm run build`
   - Output Directory: `apps/web/dist`
3. Add frontend environment variables in Vercel dashboard
4. Deploy Edge Functions from Supabase CLI or dashboard
5. Configure Stripe webhook endpoint to deployed `stripe-webhook` function
6. Add domain and redirects if required

### Post-Deploy Checklist

- Verify signup -> checkout -> success/cancel flow
- Verify Stripe webhook updates subscription records
- Verify account billing portal opens correctly
- Verify winner verification upload and preview in admin
- Verify legal pages and cookie consent banner are visible

## Additional Documentation

- API documentation: `docs/API.md`
- User guide: `docs/USER_GUIDE.md`
- Local run commands: `command.md`
- Setup requirements and keys: `requirement.md`

## Contributing

This is a private project. For major changes, please open an issue first.

## License

All rights reserved
