import { supabase } from '../supabase.js'
import { log } from '../utils/logger.js'
import { sendResendEmail } from './resend.js'
import { sendWhatsAppMessage } from '../utils/whatsapp.js'

export async function createNurtureSequence({ name, description, steps }) {
  const { data: sequence, error: seqError } = await supabase
    .from('nurture_sequences')
    .insert({ name, description })
    .select()
    .single()

  if (seqError) throw seqError

  if (steps && steps.length > 0) {
    const stepInserts = steps.map((step, i) => ({
      sequence_id: sequence.id,
      step_order: i + 1,
      delay_days: step.delay_days || 7,
      subject: step.subject || '',
      template_html: step.template_html || '',
      template_whatsapp: step.template_whatsapp || '',
    }))

    const { error: stepError } = await supabase.from('nurture_steps').insert(stepInserts)
    if (stepError) throw stepError
  }

  log(`[Nurture] Created sequence: ${name} (${steps?.length || 0} steps)`, 'ok')
  return sequence
}

export async function subscribeToNurture(clientId, sequenceId) {
  const { data: existing } = await supabase
    .from('nurture_subscriptions')
    .select('id')
    .eq('client_id', clientId)
    .eq('sequence_id', sequenceId)
    .maybeSingle()

  if (existing) {
    return { success: true, message: 'Already subscribed' }
  }

  const { error } = await supabase.from('nurture_subscriptions').insert({
    client_id: clientId,
    sequence_id: sequenceId,
    current_step: 0,
    status: 'active',
  })

  if (error) throw error

  log(`[Nurture] Subscribed client ${clientId} to sequence ${sequenceId}`, 'ok')
  return { success: true }
}

export async function unsubscribeFromNurture(clientId, sequenceId) {
  const { error } = await supabase
    .from('nurture_subscriptions')
    .update({ status: 'unsubscribed' })
    .eq('client_id', clientId)
    .eq('sequence_id', sequenceId)

  if (error) throw error
  log(`[Nurture] Unsubscribed client ${clientId} from sequence ${sequenceId}`, 'ok')
  return { success: true }
}

export async function processNurtureQueue() {
  const now = new Date().toISOString()

  const { data: subscriptions, error } = await supabase
    .from('nurture_subscriptions')
    .select('id, client_id, sequence_id, current_step, last_sent_at')
    .eq('status', 'active')

  if (error) {
    log(`[Nurture] Queue fetch error: ${error.message}`, 'error')
    return { processed: 0 }
  }

  if (!subscriptions?.length) return { processed: 0 }

  let processed = 0

  for (const sub of subscriptions) {
    try {
      const { data: steps, error: stepError } = await supabase
        .from('nurture_steps')
        .select('*')
        .eq('sequence_id', sub.sequence_id)
        .order('step_order', { ascending: true })

      if (stepError || !steps?.length) continue

      const currentIndex = sub.current_step
      if (currentIndex >= steps.length) {
        await supabase
          .from('nurture_subscriptions')
          .update({ status: 'completed', completed_at: now })
          .eq('id', sub.id)
        continue
      }

      const step = steps[currentIndex]
      const shouldSend = shouldSendNow(sub, step)

      if (!shouldSend) continue

      const { data: client } = await supabase
        .from('clients')
        .select('name, email, phone')
        .eq('id', sub.client_id)
        .maybeSingle()

      if (!client) continue

      let emailSent = false
      if (client.email && step.template_html) {
        const html = step.template_html
          .replace(/{{name}}/g, client.name || 'there')

        const result = await sendResendEmail({
          to: client.email,
          subject: step.subject || 'Update from FLODON',
          html,
        })
        emailSent = result.success
      }

      if (client.phone && step.template_whatsapp) {
        const body = step.template_whatsapp.replace(/{{name}}/g, client.name || 'there')
        await sendWhatsAppMessage({ to: client.phone, body })
      }

      if (emailSent || step.template_html) {
        await supabase
          .from('nurture_subscriptions')
          .update({
            current_step: currentIndex + 1,
            last_sent_at: now,
          })
          .eq('id', sub.id)
        processed++
        log(`[Nurture] Sent step ${currentIndex + 1}/${steps.length} to ${client.name}`, 'ok')
      }
    } catch (err) {
      log(`[Nurture] Error processing sub ${sub.id}: ${err.message}`, 'error')
    }
  }

  return { processed }
}

function shouldSendNow(subscription, step) {
  const now = Date.now()

  if (!subscription.last_sent_at) {
    const startedAt = new Date(subscription.started_at).getTime()
    return now >= startedAt + step.delay_days * 24 * 60 * 60 * 1000
  }

  const lastSent = new Date(subscription.last_sent_at).getTime()
  return now >= lastSent + step.delay_days * 24 * 60 * 60 * 1000
}

export async function listNurtureSequences() {
  const { data, error } = await supabase
    .from('nurture_sequences')
    .select('*, nurture_steps(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getClientNurtureStatus(clientId) {
  const { data, error } = await supabase
    .from('nurture_subscriptions')
    .select('*, nurture_sequences(name)')
    .eq('client_id', clientId)

  if (error) throw error
  return data || []
}
