import { supabase } from '../supabase.js'
import { log } from '../utils/logger.js'
import { ADMIN_PROFILE_ID } from './revenueIntelligence.js'

function generateReferralCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createAffiliate({ name, email, commissionRate = 0.1 }) {
  let referralCode
  let attempts = 0

  do {
    referralCode = generateReferralCode()
    const { data: existing } = await supabase
      .from('affiliates')
      .select('id')
      .eq('referral_code', referralCode)
      .maybeSingle()

    if (!existing) break
    attempts++
  } while (attempts < 5)

  if (attempts >= 5) throw new Error('Could not generate unique referral code')

  const { data, error } = await supabase
    .from('affiliates')
    .insert({
      name,
      email,
      referral_code: referralCode,
      commission_rate: commissionRate,
    })
    .select()
    .single()

  if (error) throw error
  log(`[Affiliates] Created affiliate ${name} with code ${referralCode}`, 'ok')
  return data
}

export async function trackReferral(referralCode, clientId) {
  const { data: affiliate, error: affError } = await supabase
    .from('affiliates')
    .select('id, commission_rate')
    .eq('referral_code', referralCode)
    .eq('status', 'active')
    .maybeSingle()

  if (affError || !affiliate) {
    log(`[Affiliates] Invalid referral code: ${referralCode}`, 'warning')
    return { success: false, error: 'Invalid referral code' }
  }

  const { error } = await supabase.from('referrals').insert({
    affiliate_id: affiliate.id,
    referred_client_id: clientId,
    referral_code: referralCode,
    status: 'pending',
    commission_amount: 0,
  })

  if (error) {
    log(`[Affiliates] Track referral error: ${error.message}`, 'error')
    return { success: false, error: error.message }
  }

  await supabase
    .from('clients')
    .update({ lead_source: 'referral' })
    .eq('id', clientId)

  log(`[Affiliates] Tracked referral ${referralCode} for client ${clientId}`, 'ok')
  return { success: true }
}

export async function convertReferral(dealId) {
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .select('id, amount_monthly, client_id, stage')
    .eq('id', dealId)
    .maybeSingle()

  if (dealError || !deal) throw new Error('Deal not found')
  if (deal.stage !== 'closed_won') return { success: false, message: 'Deal not won yet' }

  const { data: referral, error: refError } = await supabase
    .from('referrals')
    .select('id, affiliate_id, commission_amount')
    .eq('referred_client_id', deal.client_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (refError || !referral) {
    log(`[Affiliates] No pending referral found for client ${deal.client_id}`, 'warning')
    return { success: false, message: 'No pending referral' }
  }

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('commission_rate')
    .eq('id', referral.affiliate_id)
    .maybeSingle()

  const commissionRate = affiliate?.commission_rate || 0.1
  const commissionAmount = Math.round(Number(deal.amount_monthly || 0) * commissionRate * 100) / 100

  await supabase
    .from('referrals')
    .update({
      status: 'converted',
      commission_amount: commissionAmount,
      deal_id: dealId,
      converted_at: new Date().toISOString(),
    })
    .eq('id', referral.id)

  const { data: affiliateData } = await supabase
    .from('affiliates')
    .select('total_earned')
    .eq('id', referral.affiliate_id)
    .maybeSingle()

  const currentEarned = affiliateData?.total_earned || 0

  await supabase
    .from('affiliates')
    .update({
      total_earned: Number(currentEarned) + commissionAmount,
    })
    .eq('id', referral.affiliate_id)

  log(`[Affiliates] Referral converted for ${referral.affiliate_id}: commission ₹${commissionAmount}`, 'ok')
  return { success: true, commissionAmount }
}

export async function payoutAffiliate(affiliateId, amount) {
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('total_earned, total_paid, name')
    .eq('id', affiliateId)
    .maybeSingle()

  if (!affiliate) throw new Error('Affiliate not found')
  if (affiliate.total_earned < amount) throw new Error('Insufficient earned balance')

  const payoutAmount = Math.min(amount, affiliate.total_earned - affiliate.total_paid)

  await supabase
    .from('affiliates')
    .update({
      total_paid: affiliate.total_paid + payoutAmount,
    })
    .eq('id', affiliateId)

  await supabase
    .from('referrals')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('affiliate_id', affiliateId)
    .eq('status', 'converted')

  log(`[Affiliates] Paid ₹${payoutAmount} to ${affiliate.name}`, 'ok')
  return { success: true, amount: payoutAmount }
}

export async function listAffiliates() {
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .order('total_earned', { ascending: false })

  if (error) throw error
  return data || []
}

export async function listReferrals(affiliateId) {
  let q = supabase
    .from('referrals')
    .select('*, clients(name), deals(title, amount_monthly)')
    .order('created_at', { ascending: false })

  if (affiliateId) q = q.eq('affiliate_id', affiliateId)

  const { data, error } = await q
  if (error) throw error
  return data || []
}
