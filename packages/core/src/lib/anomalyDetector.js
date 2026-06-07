import { supabase } from '../supabase.js'
import { log } from '../utils/logger.js'

const HISTORY_DAYS = 30
const STD_DEV_THRESHOLD = 2

function mean(values) {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

function stdDev(values, avg) {
  if (values.length < 2) return 0
  const sqDiffs = values.map(v => (v - avg) ** 2)
  return Math.sqrt(sqDiffs.reduce((s, v) => s + v, 0) / (values.length - 1))
}

async function checkLeadVolumeAnomaly() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - HISTORY_DAYS)

  const { data: leads } = await supabase
    .from('clients')
    .select('created_at')
    .gte('created_at', cutoff.toISOString())

  if (!leads?.length) return null

  const dailyCounts = {}
  for (const lead of leads) {
    const day = lead.created_at.slice(0, 10)
    dailyCounts[day] = (dailyCounts[day] || 0) + 1
  }

  const values = Object.values(dailyCounts)
  const avg = mean(values)
  const sd = stdDev(values, avg)

  const today = new Date().toISOString().slice(0, 10)
  const todayCount = dailyCounts[today] || 0

  if (sd > 0 && Math.abs(todayCount - avg) > STD_DEV_THRESHOLD * sd) {
    const deviation = (todayCount - avg) / sd
    return {
      metric: 'lead_volume',
      value: todayCount,
      expected_value: Math.round(avg * 100) / 100,
      deviation: Math.round(deviation * 100) / 100,
      severity: Math.abs(deviation) > 3 ? 'critical' : 'warning',
      metadata: { dailyCounts },
    }
  }

  return null
}

async function checkCallShowRateAnomaly() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - HISTORY_DAYS)

  const { data: calls } = await supabase
    .from('calls')
    .select('status, scheduled_at')
    .gte('scheduled_at', cutoff.toISOString())

  if (!calls?.length) return null

  const dailyRates = {}
  for (const call of calls) {
    const day = call.scheduled_at.slice(0, 10)
    if (!dailyRates[day]) dailyRates[day] = { total: 0, completed: 0 }
    dailyRates[day].total++
    if (call.status === 'completed') dailyRates[day].completed++
  }

  const values = Object.values(dailyRates).map(d => d.total > 0 ? d.completed / d.total : 0)
  const avg = mean(values)
  const sd = stdDev(values, avg)

  const today = new Date().toISOString().slice(0, 10)
  const todayRate = dailyRates[today]
  const currentRate = todayRate?.total > 0 ? todayRate.completed / todayRate.total : 0

  if (sd > 0 && values.length > 2 && currentRate < avg - STD_DEV_THRESHOLD * sd) {
    const deviation = (currentRate - avg) / sd
    return {
      metric: 'call_show_rate',
      value: Math.round(currentRate * 100),
      expected_value: Math.round(avg * 100),
      deviation: Math.round(deviation * 100) / 100,
      severity: 'warning',
      metadata: { dailyRates },
    }
  }

  return null
}

async function checkChurnSpike() {
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const lastMonth = new Date(thisMonth)
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  const twoMonthsAgo = new Date(thisMonth)
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

  const [thisMonthChurn, lastMonthChurn, twoMonthsAgoChurn] = await Promise.all([
    supabase.from('churn').select('amount_monthly').gte('churned_at', thisMonth.toISOString()),
    supabase.from('churn').select('amount_monthly').gte('churned_at', lastMonth.toISOString()).lt('churned_at', thisMonth.toISOString()),
    supabase.from('churn').select('amount_monthly').gte('churned_at', twoMonthsAgo.toISOString()).lt('churned_at', lastMonth.toISOString()),
  ])

  const thisMonthTotal = (thisMonthChurn.data || []).reduce((s, c) => s + Number(c.amount_monthly || 0), 0)
  const lastMonthTotal = (lastMonthChurn.data || []).reduce((s, c) => s + Number(c.amount_monthly || 0), 0)
  const twoMonthsTotal = (twoMonthsAgoChurn.data || []).reduce((s, c) => s + Number(c.amount_monthly || 0), 0)

  const avgPrevious = (lastMonthTotal + twoMonthsTotal) / 2

  if (avgPrevious > 0 && thisMonthTotal > avgPrevious * 2 && thisMonthTotal > 10000) {
    return {
      metric: 'churn_spike',
      value: thisMonthTotal,
      expected_value: Math.round(avgPrevious),
      deviation: thisMonthTotal / avgPrevious,
      severity: thisMonthTotal > avgPrevious * 3 ? 'critical' : 'warning',
      metadata: { thisMonth: thisMonthTotal, lastMonth: lastMonthTotal, twoMonthsAgo: twoMonthsTotal },
    }
  }

  return null
}

export async function runAnomalyDetection() {
  try {
    const anomalies = [await checkLeadVolumeAnomaly(), await checkCallShowRateAnomaly(), await checkChurnSpike()].filter(Boolean)

    for (const anomaly of anomalies) {
      const { data: existing } = await supabase
        .from('anomalies')
        .select('id')
        .eq('metric', anomaly.metric)
        .gte('detected_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle()

      if (existing) continue

      await supabase.from('anomalies').insert(anomaly)
      log(`[Anomaly] ${anomaly.severity.toUpperCase()}: ${anomaly.metric} (value=${anomaly.value}, expected=${anomaly.expected_value})`, anomaly.severity === 'critical' ? 'error' : 'warning')
    }

    if (anomalies.length > 0) {
      log(`[Anomaly] Detection complete: ${anomalies.length} new anomaly(ies)`, 'ok')
    }

    return { detected: anomalies.length, anomalies }
  } catch (err) {
    log(`[Anomaly] Detection run failed: ${err.message}`, 'error')
    return { detected: 0, anomalies: [], error: err.message }
  }
}

export async function getAnomalies(limit = 20) {
  const { data, error } = await supabase
    .from('anomalies')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function acknowledgeAnomaly(id, profileId) {
  const { error } = await supabase
    .from('anomalies')
    .update({ acknowledged: true, acknowledged_by: profileId })
    .eq('id', id)

  if (error) throw error
  return { success: true }
}
