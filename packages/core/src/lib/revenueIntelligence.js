import { supabase } from '../supabase.js'
import { log } from '../utils/logger.js'

export const ADMIN_PROFILE_ID = process.env.CRM_ADMIN_PROFILE_ID || '00000000-0000-0000-0000-000000000001'

const FORECAST_MODEL_VERSION = 'v1'

function weightedPipelineValue(deals) {
  return deals.reduce((sum, d) => {
    const prob = (d.probability || 0) / 100
    const amount = Number(d.amount_monthly || 0)
    return sum + amount * prob
  }, 0)
}

export async function calculatePipelineVelocity() {
  const { data: deals } = await supabase
    .from('deals')
    .select('amount_monthly, stage, probability, created_at, updated_at')

  if (!deals) return null

  const now = Date.now()
  const stages = ['lead', 'contacted', 'demo', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
  const byStage = {}

  for (const stage of stages) {
    byStage[stage] = deals.filter(d => d.stage === stage)
  }

  const openDeals = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
  const weightedValue = weightedPipelineValue(openDeals)
  const totalPipeline = openDeals.reduce((sum, d) => sum + Number(d.amount_monthly || 0), 0)

  const avgDaysInStage = {}
  for (const stage of stages) {
    const stageDeals = byStage[stage] || []
    if (stageDeals.length > 0) {
      const days = stageDeals.reduce((sum, d) => {
        const created = new Date(d.created_at).getTime()
        return sum + (now - created) / (1000 * 60 * 60 * 24)
      }, 0)
      avgDaysInStage[stage] = Math.round(days / stageDeals.length)
    } else {
      avgDaysInStage[stage] = 0
    }
  }

  const wonDeals = byStage['closed_won'] || []
  const totalWon = wonDeals.length
  const totalClosed = totalWon + (byStage['closed_lost']?.length || 0)
  const winRate = totalClosed > 0 ? totalWon / totalClosed : 0

  const avgDealSize = wonDeals.length > 0
    ? wonDeals.reduce((sum, d) => sum + Number(d.amount_monthly || 0), 0) / wonDeals.length
    : 0

  return {
    totalPipeline,
    weightedValue,
    dealsByStage: Object.fromEntries(
      stages.map(s => [s, (byStage[s] || []).length])
    ),
    avgDaysInStage,
    winRate: Math.round(winRate * 10000) / 10000,
    avgDealSize: Math.round(avgDealSize * 100) / 100,
  }
}

export async function generateForecast() {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const last3Months = new Date(now)
    last3Months.setMonth(last3Months.getMonth() - 3)

    const [{ data: recentDeals }, { data: recentChurn }, pipeline] = await Promise.all([
      supabase.from('deals').select('amount_monthly, stage, created_at').gte('created_at', last3Months.toISOString()),
      supabase.from('churn').select('amount_monthly, churned_at').gte('churned_at', last3Months.toISOString()),
      calculatePipelineVelocity(),
    ])

    const monthlyMRR = {}
    for (const d of recentDeals || []) {
      if (d.stage === 'closed_won') {
        const month = new Date(d.created_at).toISOString().slice(0, 7)
        monthlyMRR[month] = (monthlyMRR[month] || 0) + Number(d.amount_monthly || 0)
      }
    }

    const monthlyChurn = {}
    for (const c of recentChurn || []) {
      const month = new Date(c.churned_at).toISOString().slice(0, 7)
      monthlyChurn[month] = (monthlyChurn[month] || 0) + Number(c.amount_monthly || 0)
    }

    const months = Object.keys(monthlyMRR).sort().slice(-3)
    const avgNewMRR = months.length > 0
      ? months.reduce((s, m) => s + (monthlyMRR[m] || 0), 0) / months.length
      : 0

    const churnMonths = Object.keys(monthlyChurn).sort().slice(-3)
    const avgChurn = churnMonths.length > 0
      ? churnMonths.reduce((s, m) => s + (monthlyChurn[m] || 0), 0) / churnMonths.length
      : 0

    const { data: allDeals } = await supabase.from('deals').select('amount_monthly, stage')
    const currentMRR = (allDeals || [])
      .filter(d => d.stage === 'closed_won')
      .reduce((s, d) => s + Number(d.amount_monthly || 0), 0)

    const pipelineWeighted = pipeline?.weightedValue || 0
    const expectedConversion = pipelineWeighted * (pipeline?.winRate || 0.3)
    const pipelineNewNextMonth = expectedConversion / 3

    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const predictedNew = avgNewMRR + pipelineNewNextMonth
    const predictedChurn = avgChurn
    const predictedMRR = currentMRR + predictedNew - predictedChurn

    const forecastData = {
      period: nextMonth.toISOString().slice(0, 10),
      predicted_mrr: Math.round(predictedMRR),
      predicted_new: Math.round(predictedNew),
      predicted_churn: Math.round(predictedChurn),
      confidence: months.length >= 3 ? 0.7 : months.length >= 1 ? 0.4 : 0.2,
      model_version: FORECAST_MODEL_VERSION,
      metadata: {
        avgNewMRR: Math.round(avgNewMRR),
        avgChurn: Math.round(avgChurn),
        pipelineWeighted: Math.round(pipelineWeighted),
        monthsOfData: months.length,
        currentMRR: Math.round(currentMRR),
      },
    }

    const { error } = await supabase
      .from('forecasts')
      .upsert(forecastData, { onConflict: 'period' })

    if (error) throw error
    log(`[Forecast] Generated for ${forecastData.period}: predicted MRR ₹${forecastData.predicted_mrr}`, 'ok')
    return forecastData
  } catch (err) {
    log(`[Forecast] Generation failed: ${err.message}`, 'error')
    return null
  }
}

const LEAD_SCORE_WEIGHTS = {
  hasEmail: 10,
  hasPhone: 10,
  hasCompany: 15,
  hasWebsite: 5,
  revenueHigh: 25,
  revenueMid: 15,
  isDecisionMaker: 20,
  isReadyToMove: 20,
  hasInvestmentLevel: 15,
  sourceWebsite: 5,
  hasService: 10,
}

export async function calculateLeadScore(clientId) {
  try {
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle()

    if (error || !client) throw error || new Error('Client not found')

    const q = client.qualification || {}
    let score = 0
    const factors = {}

    if (client.email) { score += LEAD_SCORE_WEIGHTS.hasEmail; factors.hasEmail = true }
    if (client.phone) { score += LEAD_SCORE_WEIGHTS.hasPhone; factors.hasPhone = true }
    if (client.company_id || client.brand_name) { score += LEAD_SCORE_WEIGHTS.hasCompany; factors.hasCompany = true }
    if (client.website || client.source_url) { score += LEAD_SCORE_WEIGHTS.hasWebsite; factors.hasWebsite = true }

    const revenue = String(q.monthlyRevenue || '')
    if (revenue.includes('5k') || revenue.includes('5000') || revenue.includes('10k')) {
      score += LEAD_SCORE_WEIGHTS.revenueMid; factors.revenueTier = 'mid'
    } else if (revenue.includes('25k') || revenue.includes('50k') || revenue.includes('1l')) {
      score += LEAD_SCORE_WEIGHTS.revenueHigh; factors.revenueTier = 'high'
    }

    if (q.decisionMaker === 'Yes') { score += LEAD_SCORE_WEIGHTS.isDecisionMaker; factors.isDecisionMaker = true }
    if (q.readyToMoveForward === 'Yes') { score += LEAD_SCORE_WEIGHTS.isReadyToMove; factors.isReadyToMove = true }
    if (q.investmentLevel) { score += LEAD_SCORE_WEIGHTS.hasInvestmentLevel; factors.hasInvestmentLevel = true }

    if (client.lead_source === 'website') { score += LEAD_SCORE_WEIGHTS.sourceWebsite; factors.source = 'website' }

    if (client.service) { score += LEAD_SCORE_WEIGHTS.hasService; factors.hasService = true }

    score = Math.min(100, Math.max(0, score))

    await supabase
      .from('clients')
      .update({
        lead_score: score,
        lead_score_updated_at: new Date().toISOString(),
        lead_score_factors: factors,
      })
      .eq('id', clientId)

    await supabase.from('lead_score_events').insert({
      client_id: clientId,
      score,
      factors,
    })

    log(`[LeadScore] Calculated score ${score} for client ${clientId}`, 'ok')
    return { score, factors }
  } catch (err) {
    log(`[LeadScore] Calculation failed for ${clientId}: ${err.message}`, 'error')
    return null
  }
}

export async function recalculateAllLeadScores() {
  const { data: clients } = await supabase.from('clients').select('id')
  if (!clients) return { processed: 0 }

  let processed = 0
  for (const client of clients) {
    await calculateLeadScore(client.id)
    processed++
  }
  log(`[LeadScore] Recalculated scores for ${processed} clients`, 'ok')
  return { processed }
}

export async function calculateChurnRisk(clientId) {
  try {
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, created_at')
      .eq('id', clientId)
      .maybeSingle()

    if (!client) return null

    const now = new Date()
    const ninetyDaysAgo = new Date(now)
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const [{ data: calls }, { data: tasks }, { data: payments }] = await Promise.all([
      supabase.from('calls').select('status, scheduled_at').eq('client_id', clientId).gte('scheduled_at', ninetyDaysAgo.toISOString()),
      supabase.from('tasks').select('status, deadline').eq('client_id', clientId).gte('deadline', ninetyDaysAgo.toISOString()),
      supabase.from('payments').select('amount, received_at').eq('client_name', client.name).gte('received_at', ninetyDaysAgo.toISOString()),
    ])

    const factors = {}
    let risk = 0

    const callCount = calls?.length || 0
    if (callCount === 0) { risk += 0.15; factors.noRecentCalls = true }

    const completedCalls = calls?.filter(c => c.status === 'completed').length || 0
    const showRate = callCount > 0 ? completedCalls / callCount : 0
    if (showRate < 0.5 && callCount > 0) { risk += 0.1; factors.lowShowRate = true }

    const overdueTasks = tasks?.filter(t => t.status !== 'done' && new Date(t.deadline) < now).length || 0
    if (overdueTasks > 2) { risk += 0.15; factors.overdueTasks = overdueTasks }

    const paymentCount = payments?.length || 0
    if (paymentCount === 0) { risk += 0.1; factors.noRecentPayments = true }

    const daysSinceCreation = (now.getTime() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreation < 30 && callCount < 2) { risk += 0.2; factors.newLowEngagement = true }

    risk = Math.min(1, Math.max(0, risk))

    await supabase
      .from('clients')
      .update({
        churn_risk: risk,
        churn_risk_updated_at: new Date().toISOString(),
        churn_risk_factors: factors,
      })
      .eq('id', clientId)

    await supabase.from('churn_predictions').insert({
      client_id: clientId,
      risk_score: risk,
      factors,
    })

    if (risk > 0.5) {
      log(`[ChurnRisk] HIGH RISK (${(risk * 100).toFixed(0)}%) for client ${client.name}`, 'warning')
    }

    return { risk, factors }
  } catch (err) {
    log(`[ChurnRisk] Calculation failed for ${clientId}: ${err.message}`, 'error')
    return null
  }
}

export async function scanAllChurnRisks() {
  const { data: clients } = await supabase
    .from('clients')
    .select('id')

  if (!clients) return { scanned: 0 }
  let scanned = 0

  for (const client of clients) {
    await calculateChurnRisk(client.id)
    scanned++
  }

  log(`[ChurnRisk] Scanned ${scanned} clients for churn risk`, 'ok')
  return { scanned }
}

export async function getRevenueSnapshot() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)

  const [{ data: allDeals }, { data: monthlyChurn }, { data: monthlyPayments }] = await Promise.all([
    supabase.from('deals').select('amount_monthly, stage, venture'),
    supabase.from('churn').select('amount_monthly').gte('churned_at', startOfMonth.toISOString()),
    supabase.from('payments').select('amount').gte('received_at', startOfMonth.toISOString()),
  ])

  const currentMRR = (allDeals || [])
    .filter(d => d.stage === 'closed_won')
    .reduce((s, d) => s + Number(d.amount_monthly || 0), 0)

  const monthlyChurnMRR = (monthlyChurn || []).reduce((s, c) => s + Number(c.amount_monthly || 0), 0)
  const monthlyPaymentsTotal = (monthlyPayments || []).reduce((s, p) => s + Number(p.amount || 0), 0)

  const mrrByVenture = {}
  for (const deal of allDeals || []) {
    if (deal.stage === 'closed_won') {
      const v = deal.venture || 'OTHER'
      mrrByVenture[v] = (mrrByVenture[v] || 0) + Number(deal.amount_monthly || 0)
    }
  }

  return {
    currentMRR: Math.round(currentMRR),
    monthlyChurnMRR: Math.round(monthlyChurnMRR),
    monthlyPaymentsTotal: Math.round(monthlyPaymentsTotal),
    mrrByVenture,
    annualRunRate: Math.round(currentMRR * 12),
    netNewMRR: Math.round(currentMRR - monthlyChurnMRR),
  }
}
