import { supabase } from '../supabase.js'
import { log } from '../utils/logger.js'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

function getStripeHeaders() {
  if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not configured')
  return {
    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
}

export async function createStripeCustomer({ name, email, clientId }) {
  try {
    const params = new URLSearchParams()
    params.append('name', name || '')
    params.append('email', email || '')
    params.append('metadata[client_id]', clientId || '')

    const res = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: getStripeHeaders(),
      body: params.toString(),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Failed to create customer')

    const { error } = await supabase.from('stripe_customers').insert({
      client_id: clientId,
      stripe_customer_id: data.id,
      status: 'incomplete',
    })

    if (error) throw error
    log(`[Stripe] Created customer ${data.id} for ${name}`, 'ok')
    return { customerId: data.id }
  } catch (err) {
    log(`[Stripe] Create customer failed: ${err.message}`, 'error')
    throw err
  }
}

export async function createSubscription({ customerId, priceId, trialDays = 0 }) {
  try {
    const params = new URLSearchParams()
    params.append('customer', customerId)
    params.append('items[0][price]', priceId)
    params.append('payment_behavior', 'default_incomplete')
    params.append('expand[]', 'latest_invoice.payment_intent')
    if (trialDays > 0) params.append('trial_period_days', String(trialDays))

    const res = await fetch('https://api.stripe.com/v1/subscriptions', {
      method: 'POST',
      headers: getStripeHeaders(),
      body: params.toString(),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Failed to create subscription')

    const invoice = data.latest_invoice
    let clientSecret = null
    if (invoice?.payment_intent) {
      clientSecret = invoice.payment_intent.client_secret
    }

    await supabase
      .from('stripe_customers')
      .update({
        stripe_subscription_id: data.id,
        status: data.status,
        current_period_start: new Date(data.current_period_start * 1000).toISOString(),
        current_period_end: new Date(data.current_period_end * 1000).toISOString(),
        plan_amount: data.items?.data?.[0]?.price?.unit_amount ? data.items.data[0].price.unit_amount / 100 : 0,
        plan_currency: data.items?.data?.[0]?.price?.currency || 'inr',
      })
      .eq('stripe_customer_id', customerId)

    log(`[Stripe] Created subscription ${data.id} for customer ${customerId}`, 'ok')
    return { subscriptionId: data.id, clientSecret }
  } catch (err) {
    log(`[Stripe] Create subscription failed: ${err.message}`, 'error')
    throw err
  }
}

export async function cancelSubscription(subscriptionId) {
  try {
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: getStripeHeaders(),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || 'Failed to cancel subscription')

    await supabase
      .from('stripe_customers')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscriptionId)

    log(`[Stripe] Cancelled subscription ${subscriptionId}`, 'ok')
    return { success: true }
  } catch (err) {
    log(`[Stripe] Cancel subscription failed: ${err.message}`, 'error')
    throw err
  }
}

export async function handleStripeWebhook(payload, signature) {
  if (!STRIPE_WEBHOOK_SECRET) {
    log('[Stripe] Webhook secret not configured', 'error')
    return { success: false, error: 'Webhook secret not configured' }
  }

  let event
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(STRIPE_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const parts = signature.split(',')
    const sigMap = {}
    for (const part of parts) {
      const [k, v] = part.split('=')
      sigMap[k] = v
    }

    const signedPayload = `${sigMap['t']}.${payload}`
    const signatureBytes = hexToBytes(sigMap['v1'] || '')

    const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(signedPayload))
    if (!valid) {
      log('[Stripe] Webhook signature verification failed', 'error')
      return { success: false, error: 'Invalid signature' }
    }

    event = JSON.parse(payload)
  } catch (err) {
    log(`[Stripe] Webhook parsing failed: ${err.message}`, 'error')
    return { success: false, error: err.message }
  }

  switch (event.type) {
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object
      await supabase.from('invoices').upsert({
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: 'paid',
        paid_at: new Date(invoice.status_transitions?.paid_at * 1000 || Date.now()).toISOString(),
        invoice_pdf: invoice.invoice_pdf,
      }, { onConflict: 'stripe_invoice_id' })
      log(`[Stripe] Invoice ${invoice.id} paid: ₹${invoice.amount_paid / 100}`, 'ok')
      break
    }

    case 'invoice.payment_failed': {
      const failedInvoice = event.data.object
      const attemptCount = failedInvoice.attempt_count || 1
      await supabase.from('invoices').upsert({
        stripe_invoice_id: failedInvoice.id,
        amount: failedInvoice.amount_due / 100,
        currency: failedInvoice.currency,
        status: 'open',
      }, { onConflict: 'stripe_invoice_id' })

      await supabase.from('payment_attempts').insert({
        stripe_payment_intent_id: failedInvoice.payment_intent,
        amount: failedInvoice.amount_due / 100,
        status: 'failed',
        failure_reason: failedInvoice.last_payment_error?.message || 'Unknown',
        attempt_number: attemptCount,
      })
      log(`[Stripe] Invoice ${failedInvoice.id} payment failed (attempt ${attemptCount})`, 'warning')
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      await supabase
        .from('stripe_customers')
        .update({
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)
      log(`[Stripe] Subscription ${sub.id} status: ${sub.status}`, 'ok')
      break
    }

    case 'customer.subscription.deleted': {
      const deletedSub = event.data.object
      await supabase
        .from('stripe_customers')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', deletedSub.id)
      log(`[Stripe] Subscription ${deletedSub.id} deleted`, 'ok')
      break
    }
  }

  return { success: true }
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

export async function listInvoices(clientId) {
  let q = supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  if (clientId) q = q.eq('client_id', clientId)

  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function getStripeCustomer(clientId) {
  const { data, error } = await supabase
    .from('stripe_customers')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()

  if (error) throw error
  return data
}

export function isStripeConfigured() {
  return !!STRIPE_SECRET_KEY
}
