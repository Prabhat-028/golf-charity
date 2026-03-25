# Localhost Commands

Use these commands from the repository root to run the project locally.

## 1) Install dependencies

```bash
npm install
npm --prefix apps/web install
```

## 2) Create frontend env file

```bash
copy apps\web\.env.example apps\web\.env
```

Then set required values in `apps/web/.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_MONTHLY_PRICE_ID=price_xxx
VITE_STRIPE_YEARLY_PRICE_ID=price_xxx
```

## 3) Run frontend on localhost

```bash
npm --prefix apps/web run dev
```

Open: http://localhost:5173

If port `5173` is already in use, Vite automatically chooses the next port (for example `5174`).

## 4) Run from root (shortcut)

```bash
npm run dev
```

This now runs the same web dev server command via root `package.json`.

## 5) Useful extra commands

Run tests:

```bash
npm --prefix apps/web run test:run
```

Build production bundle:

```bash
npm --prefix apps/web run build
```
