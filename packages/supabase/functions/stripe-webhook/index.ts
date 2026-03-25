import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'No signature provided' }),
      { status: 400 }
    )
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret!)

    console.log('Webhook event received:', event.type)

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        await handleCheckoutCompleted(supabase, session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        await handleSubscriptionUpdated(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await handleSubscriptionDeleted(supabase, subscription)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        await handleInvoicePaid(supabase, invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        await handleInvoiceFailed(supabase, invoice)
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Webhook error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function handleCheckoutCompleted(supabase, session) {
  const userId = session.metadata?.supabase_user_id
  const customerId = session.customer
  const subscriptionId = session.subscription

  if (!userId) {
    console.error('No user ID in session metadata')
    throw new Error('No user ID in session metadata')
  }

  console.log('Processing checkout for user:', userId)

  // Update profile with Stripe customer ID
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ stripe_customer_id: customerId })
    .eq('id', userId)

  if (profileError) {
    console.error('Failed to update profile:', profileError)
    throw profileError
  }

  // Retrieve full subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Determine plan type based on price ID
  const priceId = subscription.items.data[0].price.id
  const monthlyPriceId = Deno.env.get('STRIPE_MONTHLY_PRICE_ID')
  const yearlyPriceId = Deno.env.get('STRIPE_YEARLY_PRICE_ID')

  let plan = 'monthly'
  if (priceId === yearlyPriceId) {
    plan = 'yearly'
  }

  // Create subscription record (use upsert to handle duplicates)
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscriptionId,
      plan,
      status: 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    }, {
      onConflict: 'stripe_subscription_id'
    })

  if (subError) {
    console.error('Failed to create subscription:', subError)
    throw subError
  }

  console.log('Subscription created successfully for user:', userId)
}

async function handleSubscriptionUpdated(supabase, subscription) {
  const userId = subscription.metadata?.supabase_user_id

  // Determine plan type
  const priceId = subscription.items.data[0].price.id
  const monthlyPriceId = Deno.env.get('STRIPE_MONTHLY_PRICE_ID')
  const yearlyPriceId = Deno.env.get('STRIPE_YEARLY_PRICE_ID')

  let plan = 'monthly'
  if (priceId === yearlyPriceId) {
    plan = 'yearly'
  }

  // Map Stripe status to our status
  let status = 'active'
  if (subscription.status === 'past_due') {
    status = 'past_due'
  } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    status = 'cancelled'
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan,
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Failed to update subscription:', error)
    throw error
  }

  console.log('Subscription updated:', subscription.id)
}

async function handleSubscriptionDeleted(supabase, subscription) {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Failed to delete subscription:', error)
    throw error
  }

  console.log('Subscription cancelled:', subscription.id)
}

async function handleInvoicePaid(supabase, invoice) {
  const subscriptionId = invoice.subscription

  if (!subscriptionId) {
    console.log('Invoice not associated with subscription')
    return
  }

  // Retrieve full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Failed to update subscription after payment:', error)
    throw error
  }

  console.log('Invoice paid, subscription updated:', subscriptionId)
}

async function handleInvoiceFailed(supabase, invoice) {
  const subscriptionId = invoice.subscription

  if (!subscriptionId) {
    console.log('Invoice not associated with subscription')
    return
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Failed to update subscription after failed payment:', error)
    throw error
  }

  console.log('Invoice payment failed, subscription marked past_due:', subscriptionId)
}
