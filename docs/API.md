# API Documentation

This project primarily uses Supabase client calls and Supabase Edge Functions.

## Supabase Tables

- `profiles`: user profile and account metadata
- `subscriptions`: Stripe subscription state per user
- `scores`: 5 stableford scores per user
- `draws`: monthly draw definitions and outcomes
- `winners`: winner records and payout status
- `charities`: supported charity organizations
- `charity_donations`: per-draw charity allocation records
- `gdpr_requests`: user privacy rights requests

## Supabase Edge Functions

### `create-checkout-session`

Creates a Stripe Checkout Session for subscription purchase.

Input JSON:

```json
{
  "priceId": "price_xxx",
  "userId": "uuid",
  "email": "user@example.com"
}
```

Output JSON:

```json
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

### `create-portal-session`

Creates a Stripe Customer Portal session for billing management.

Input JSON:

```json
{
  "customerId": "cus_xxx",
  "returnUrl": "https://your-app/account"
}
```

Output JSON:

```json
{
  "url": "https://billing.stripe.com/..."
}
```

### `stripe-webhook`

Stripe webhook endpoint for subscription lifecycle events.

Handled events:
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Error Handling Convention

Most responses return:

```json
{
  "error": "message"
}
```

on non-2xx statuses.
