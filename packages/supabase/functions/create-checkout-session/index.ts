import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:5173')
  .split(',')
  .map((origin: string) => origin.trim())
  .filter(Boolean)

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 6
const requestLog = new Map<string, number[]>()

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Failed to create checkout session'
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const requests = requestLog.get(key) || []
  const recent = requests.filter((timestamp) => timestamp > windowStart)

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(key, recent)
    return true
  }

  recent.push(now)
  requestLog.set(key, recent)
  return false
}

function normalizeOrigin(input: string): string {
  try {
    const url = new URL(input)
    return `${url.protocol}//${url.host}`
  } catch {
    return ''
  }
}

function resolveReturnOrigin(req: Request): string {
  const headerOrigin = req.headers.get('origin') || ''
  const normalized = normalizeOrigin(headerOrigin)
  if (normalized && allowedOrigins.includes(normalized)) {
    return normalized
  }

  const referer = req.headers.get('referer') || ''
  const normalizedReferer = normalizeOrigin(referer)
  if (normalizedReferer && allowedOrigins.includes(normalizedReferer)) {
    return normalizedReferer
  }

  return allowedOrigins[0]
}

function hasTrustedRequestOrigin(req: Request): boolean {
  const origin = normalizeOrigin(req.headers.get('origin') || '')
  if (origin && allowedOrigins.includes(origin)) {
    return true
  }

  const refererOrigin = normalizeOrigin(req.headers.get('referer') || '')
  if (refererOrigin && allowedOrigins.includes(refererOrigin)) {
    return true
  }

  return false
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!hasTrustedRequestOrigin(req)) {
    return new Response(
      JSON.stringify({ error: 'Untrusted request origin' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment is not configured')
    }

    if (!Deno.env.get('STRIPE_SECRET_KEY')) {
      throw new Error('Stripe secret key is not configured')
    }

    // Get request body
    const { priceId } = await req.json()

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : ''

    if (!token) {
      throw new Error('Missing or invalid Authorization header')
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token)
    if (authError || !authData?.user?.id || !authData.user.email) {
      throw new Error('Unauthorized request')
    }

    const resolvedUserId = authData.user.id
    const resolvedEmail = authData.user.email

    if (isRateLimited(`checkout:${resolvedUserId}`)) {
      return new Response(
        JSON.stringify({ error: 'Too many checkout attempts. Please wait a minute.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const allowedPriceIds = [
      Deno.env.get('STRIPE_MONTHLY_PRICE_ID'),
      Deno.env.get('STRIPE_YEARLY_PRICE_ID'),
    ].filter(Boolean)

    if (typeof priceId !== 'string' || !/^price_[A-Za-z0-9]+$/.test(priceId)) {
      throw new Error('Invalid price ID format')
    }

    if (allowedPriceIds.length > 0 && !allowedPriceIds.includes(priceId)) {
      throw new Error('Invalid price ID')
    }

    // Validate inputs
    if (!priceId) {
      throw new Error('Missing required field: priceId')
    }

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({ email: resolvedEmail, limit: 1 })
    let customer

    if (customers.data.length > 0) {
      customer = customers.data[0]
      // Update metadata if customer exists
      await stripe.customers.update(customer.id, {
        metadata: { supabase_user_id: resolvedUserId }
      })
    } else {
      customer = await stripe.customers.create({
        email: resolvedEmail,
        metadata: { supabase_user_id: resolvedUserId }
      })
    }

    // Get origin for return URLs
    const origin = resolveReturnOrigin(req)

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/signup/cancel`,
      metadata: {
        supabase_user_id: resolvedUserId,
        price_id: priceId
      },
      subscription_data: {
        metadata: { supabase_user_id: resolvedUserId }
      }
    })

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: sanitizeErrorMessage(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
