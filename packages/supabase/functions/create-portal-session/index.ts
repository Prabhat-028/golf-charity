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
  .map((origin) => origin.trim())
  .filter(Boolean)

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 10
const requestLog = new Map<string, number[]>()

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Failed to create portal session'
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

function resolveAllowedOrigin(req: Request): string {
  const origin = normalizeOrigin(req.headers.get('origin') || '')
  if (origin && allowedOrigins.includes(origin)) {
    return origin
  }

  const refererOrigin = normalizeOrigin(req.headers.get('referer') || '')
  if (refererOrigin && allowedOrigins.includes(refererOrigin)) {
    return refererOrigin
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

function sanitizeReturnUrl(input: unknown, fallbackOrigin: string): string {
  if (typeof input !== 'string' || !input.trim()) {
    return `${fallbackOrigin}/account`
  }

  try {
    const url = new URL(input)
    const origin = `${url.protocol}//${url.host}`
    if (!allowedOrigins.includes(origin)) {
      return `${fallbackOrigin}/account`
    }
    return url.toString()
  } catch {
    return `${fallbackOrigin}/account`
  }
}

serve(async (req) => {
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

    const { returnUrl } = await req.json()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : ''

    if (!token) {
      throw new Error('Missing or invalid Authorization header')
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token)
    if (authError || !authData?.user?.id) {
      throw new Error('Unauthorized request')
    }

    const userId = authData.user.id
    if (isRateLimited(`portal:${userId}`)) {
      return new Response(
        JSON.stringify({ error: 'Too many portal attempts. Please wait a minute.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError) {
      throw profileError
    }

    const resolvedCustomerId = profile?.stripe_customer_id

    if (!resolvedCustomerId) {
      throw new Error('Customer ID is required')
    }

    // Get origin for return URL fallback
    const origin = resolveAllowedOrigin(req)
    const finalReturnUrl = sanitizeReturnUrl(returnUrl, origin)

    // Create Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: resolvedCustomerId,
      return_url: finalReturnUrl,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error creating portal session:', error)
    return new Response(
      JSON.stringify({ error: sanitizeErrorMessage(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
