import {
  supabase, queueOutreachEmail, queueCallBookingEmail,
  listProjects, getProject, createProject, updateProject, deleteProject,
  listMilestones, createMilestone, updateMilestone, deleteMilestone,
} from '@flodon/core'

const ADMIN_PROFILE_ID = process.env.CRM_ADMIN_PROFILE_ID || '00000000-0000-0000-0000-000000000001'
const PER_PAGE = 20
const PIPELINE_STAGES = ['prospect', 'contacted', 'replied', 'discovery_booked', 'discovery_completed', 'audit_proposed', 'audit_purchased', 'audit_delivered', 'implementation_proposed', 'awaiting_confirmation', 'confirmed', 'client', 'followup', 'lost']
const CLIENT_CLOSED_STAGES = ['client', 'followup', 'lost']
const DEAL_CLOSED_STAGES = ['closed_won', 'closed_lost']

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(payload))
  return true
}

function parseUrl(url) {
  const [pathname, queryString = ''] = url.split('?')
  return { pathname, query: new URLSearchParams(queryString) }
}

function matchRoute(pathname, pattern) {
  const keys = []
  const regex = new RegExp(
    '^' + pattern.replace(/\:([^/]+)/g, (_, key) => {
      keys.push(key)
      return '([^/]+)'
    }) + '$'
  )
  const match = pathname.match(regex)
  if (!match) return null
  const params = {}
  keys.forEach((key, i) => { params[key] = match[i + 1] })
  return params
}

async function logActivity(action, entityType, entityId, metadata = {}) {
  await supabase.from('activity_log').insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
    profile_id: ADMIN_PROFILE_ID,
  })
}

async function resolveCompanyName(companyId) {
  if (!companyId) return null
  const { data } = await supabase.from('companies').select('name').eq('id', companyId).maybeSingle()
  return data?.name || null
}

// Try to create tables that may be missing (expenses, etc.)
async function ensureSchemaTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS public.expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      amount NUMERIC NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'other',
      description TEXT,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date)`,
    `ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS cogs_monthly NUMERIC DEFAULT 0`,
  ]
  const errors = []
  for (const query of queries) {
    try {
      await supabase.rpc('exec_sql', { query })
    } catch (e) {
      errors.push(e.message)
    }
  }
  return errors
}

async function queryExpenses() {
  try {
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false })
    if (error) throw error
    return data || []
  } catch (e) {
    const msg = e.message || ''
    if (msg.includes('does not exist') || msg.includes('Could not find the table') || msg.includes('schema cache')) {
      await ensureSchemaTables()
      return []
    }
    throw e
  }
}

const $n = v => isNaN(v) ? 0 : Number(v)

function getMonthRange(monthStr) {
  if (monthStr) {
    const [y, m] = monthStr.split('-').map(Number)
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 1)
    return { start, end }
  }
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start, end }
}

/**
 * All deal amounts are total deal values (not monthly).
 * MRR = total value of deals closed in the selected month
 * ARR = total value of all deals closed in the current year
 */
async function getDashboardStats(monthStr) {
  const now = new Date()
  const { start: startOfMonth, end: endOfMonth } = getMonthRange(monthStr)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  // ── Safe query helpers ──
  let allDeals, closedWonThisMonth, closedWonCount, closedLostCount
  let newClientsThisWeek, newClientsThisMonth, emailQueueRows
  let overdueTasks, followupClients, nurtureClients, recentActivity
  let clientsByStage, totalClients, allClients

  async function qDeals(select, fn) {
    const q = supabase.from('deals').select(select)
    if (fn) fn(q)
    const { data, error } = await q
    if (error) throw error
    return data || []
  }

  try {
    const [d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14] = await Promise.all([
      qDeals('amount_monthly, stage, created_at, client_id', q => q),
      qDeals('amount_monthly, client_id, updated_at', q => q.eq('stage', 'closed_won').gte('updated_at', startOfMonth.toISOString()).lt('updated_at', endOfMonth.toISOString())),
      supabase.from('deals').select('id', { count: 'exact', head: true }).eq('stage', 'closed_won'),
      supabase.from('deals').select('id', { count: 'exact', head: true }).eq('stage', 'closed_lost'),
      supabase.from('clients').select('id', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
      supabase.from('clients').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString()).lt('created_at', endOfMonth.toISOString()),
      supabase.from('email_queue').select('status'),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).lt('deadline', now.toISOString()).neq('status', 'done'),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('pipeline_stage', 'followup'),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('is_nurture', true),
      supabase.from('activity_log').select('id, action, entity_type, entity_id, metadata, created_at, profiles(full_name)').order('created_at', { ascending: false }).limit(10),
      supabase.from('clients').select('pipeline_stage'),
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('clients').select('id, pipeline_stage, lead_source, industry, service, is_nurture'),
    ])
    allDeals = d1
    closedWonThisMonth = d2
    closedWonCount = d3?.count || 0
    closedLostCount = d4?.count || 0
    newClientsThisWeek = d5?.count || 0
    newClientsThisMonth = d6?.count || 0
    emailQueueRows = d7?.data || []
    overdueTasks = d8?.count || 0
    followupClients = d9?.count || 0
    nurtureClients = d10?.count || 0
    recentActivity = d11?.data || []
    clientsByStage = d12?.data || []
    totalClients = d13?.count || 0
    allClients = d14?.data || []
  } catch (e) {
    // fall through with empty defaults
  }

  // ── COGS — fetched separately ──
  let totalCOGS = 0
  try {
    const { data: cogsRows } = await supabase.from('deals').select('cogs_monthly, amount_monthly, stage, client_id')
    const wonRows = (cogsRows || []).filter(d => d.stage === 'closed_won')
    totalCOGS = wonRows.reduce((s, d) => s + $n(d.cogs_monthly || 0), 0)
  } catch (e) {
    // cogs_monthly column may not exist yet
  }

  // Expenses — fetched separately
  let thisMonthExpenses = []
  try {
    const expenses = await queryExpenses()
    const monthStartStr = startOfMonth.toISOString().slice(0, 10)
    const monthEndStr = endOfMonth.toISOString().slice(0, 10)
    thisMonthExpenses = (expenses || []).filter(r => r.date >= monthStartStr && r.date < monthEndStr)
  } catch (e) {
    // expenses table may not exist yet
  }

  // ── Exclude deals belonging to lost/churned clients ──
  const lostClientIds = new Set((allClients || []).filter(c => c.pipeline_stage === 'lost').map(c => c.id))
  const latestDealPerClient = {}
  for (const d of allDeals || []) {
    if (!d.client_id) continue
    const prev = latestDealPerClient[d.client_id]
    if (!prev || new Date(d.created_at) > new Date(prev.created_at)) {
      latestDealPerClient[d.client_id] = d
    }
  }
  for (const [cid, deal] of Object.entries(latestDealPerClient)) {
    if (deal.stage === 'closed_lost') lostClientIds.add(cid)
  }
  const isActiveClient = d => d.client_id ? !lostClientIds.has(d.client_id) : true

  // ── Pipeline (open) deals ──
  const openDeals = (allDeals || []).filter(d => !DEAL_CLOSED_STAGES.includes(d.stage))
  const pipelineValue = openDeals.reduce((sum, d) => sum + $n(d.amount_monthly), 0)

  // MRR = total value of closed_won deals in the selected month (active clients only)
  const activeWonDeals = (allDeals || []).filter(d => d.stage === 'closed_won' && isActiveClient(d))
  const monthWon = activeWonDeals.filter(d => {
    const t = new Date(d.updated_at || d.created_at)
    return t >= startOfMonth && t < endOfMonth
  })
  const totalMRR = monthWon.reduce((sum, d) => sum + $n(d.amount_monthly), 0)

  // ARR = total value of all closed_won deals in the current year
  const yearWon = activeWonDeals.filter(d => {
    const t = new Date(d.updated_at || d.created_at)
    return t >= startOfYear && t < endOfYear
  })
  const arr = yearWon.reduce((sum, d) => sum + $n(d.amount_monthly), 0)

  const grossProfit = totalMRR - totalCOGS
  const grossMargin = totalMRR > 0 ? (grossProfit / totalMRR) * 100 : 0

  const totalExpenses = (thisMonthExpenses || []).reduce((sum, r) => sum + $n(r.amount), 0)
  const netProfit = grossProfit - totalExpenses
  const netMargin = totalMRR > 0 ? (netProfit / totalMRR) * 100 : 0

  // ── Deal counts ──
  const dealsByStage = {}
  for (const d of allDeals || []) dealsByStage[d.stage] = (dealsByStage[d.stage] || 0) + 1

  // ── Client pipeline distribution ──
  const pipelineDistribution = {}
  for (const c of clientsByStage || []) {
    const st = c.pipeline_stage || 'prospect'
    pipelineDistribution[st] = (pipelineDistribution[st] || 0) + 1
  }

  const closedWonThisMonthCount = closedWonThisMonth?.length || 0
  const closedWonThisMonthValue = (closedWonThisMonth || []).reduce((sum, d) => sum + $n(d.amount_monthly), 0)

  const totalClosed = $n(closedWonCount) + $n(closedLostCount)
  const conversionRate = totalClosed > 0 ? ($n(closedWonCount) / totalClosed) * 100 : 0

  // ── Averages ──
  const avgDealSize = activeWonDeals.length > 0
    ? activeWonDeals.reduce((sum, d) => sum + $n(d.amount_monthly), 0) / activeWonDeals.length
    : 0
  const avgCOGS = totalCOGS > 0 && activeWonDeals.length > 0
    ? totalCOGS / activeWonDeals.length
    : 0

  // ── Churn rate (clients lost this month / total clients at start) ──
  const lostThisMonth = (allClients || []).filter(c => c.pipeline_stage === 'lost').length
  const activeClients = (allClients || []).filter(c => c.pipeline_stage !== 'lost').length
  const churnRate = activeClients > 0 ? (lostThisMonth / (lostThisMonth + activeClients)) * 100 : 0

  // ── Source / Industry / Service breakdown ──
  const bySource = {}
  const byIndustry = {}
  const byService = {}
  for (const c of allClients || []) {
    const src = c.lead_source || 'manual'
    bySource[src] = (bySource[src] || 0) + 1
    const ind = c.industry || 'unknown'
    byIndustry[ind] = (byIndustry[ind] || 0) + 1
    const svc = c.service || 'none'
    byService[svc] = (byService[svc] || 0) + 1
  }

  const mappedRecentActivity = (recentActivity || []).map(r => ({
    ...r,
    profile_name: r.profiles?.full_name || null,
    profiles: undefined,
  }))

  const totalOpenDeals = openDeals.length
  const closedLostThisMonthCount = $n(closedLostCount)
  const totalDeals = (allDeals || []).length
  const emailQueueByStatus = {}

  return {
    // Legacy fields
    pipelineValue,
    dealsByStage,
    pipelineDistribution,
    closedWonThisMonth: { count: closedWonThisMonthCount, value: closedWonThisMonthValue },
    total_clients: totalClients || 0,
    total_deals: totalDeals,
    open_deals: totalOpenDeals,
    conversionRate: Math.round(conversionRate * 100) / 100,
    newClientsThisWeek: newClientsThisWeek || 0,
    newClientsThisMonth: newClientsThisMonth || 0,
    closedLostThisMonth: closedLostThisMonthCount,
    followupClients: followupClients || 0,
    nurtureClients: nurtureClients || 0,
    emailQueueByStatus,
    overdueTasks: overdueTasks || 0,
    recentActivity: mappedRecentActivity,

    // New premium KPI fields
    total_mrr: totalMRR,
    total_cogs: totalCOGS,
    gross_profit: grossProfit,
    gross_margin: Math.round(grossMargin * 100) / 100,
    total_expenses: totalExpenses,
    net_profit: netProfit,
    net_margin: Math.round(netMargin * 100) / 100,
    arr: arr,
    avg_cogs: Math.round(avgCOGS * 100) / 100,
    churn_rate: Math.round(churnRate * 100) / 100,

    // Client breakdowns
    clients_by_source: bySource,
    clients_by_industry: byIndustry,
    clients_by_service: byService,
    clients_in_pipeline: activeClients,
    clients_lost: lostThisMonth,

    // Selected month info
    selected_month: monthStr || (now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')),
    date_added: new Date().toISOString(),

    // Legacy snake_case aliases
    pipeline_value: pipelineValue,
    deals_by_stage: dealsByStage,
    pipeline_distribution: pipelineDistribution,
    closed_won_value: closedWonThisMonthValue,
    closed_won_count: closedWonThisMonthCount,
    closed_lost_count: closedLostThisMonthCount,
    conversion_rate: Math.round(conversionRate * 100) / 100,
    avg_deal_size: Math.round(avgDealSize * 100) / 100,
    new_clients_week: newClientsThisWeek || 0,
    new_clients_month: newClientsThisMonth || 0,
    followup_count: followupClients || 0,
    nurture_count: nurtureClients || 0,
    open_deals_count: totalOpenDeals,
    total_deals_count: totalDeals,
    email_queue: emailQueueByStatus,
    recent_activity: mappedRecentActivity,
  }
}

async function listClients(query) {
  const page = Math.max(1, parseInt(query.get('page') || '1', 10))
  const search = (query.get('search') || '').trim()
  const stage = query.get('stage')
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let q = supabase
    .from('clients')
    .select('*, companies(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const isNurture = query.get('nurture')
  if (isNurture === 'true') {
    q = q.or('is_nurture.eq.true,pipeline_stage.eq.nurture')
  } else if (isNurture === 'false') {
    q = q.not('is_nurture', 'eq', true).not('pipeline_stage', 'eq', 'nurture')
  }

  if (stage) q = q.eq('pipeline_stage', stage)

  if (search) {
    const { data: matchingCompanies } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', `%${search}%`)
    const companyIds = (matchingCompanies || []).map(c => c.id)
    const filters = [`name.ilike.%${search}%`, `email.ilike.%${search}%`]
    if (companyIds.length) filters.push(`company_id.in.(${companyIds.join(',')})`)
    q = q.or(filters.join(','))
  }

  const { data, error, count } = await q
  if (error) throw error

  return {
    clients: (data || []).map(c => ({
      ...c,
      source: c.lead_source || 'manual',
      website: c.website || null,
      company_name: c.companies?.name || null,
      companies: undefined,
    })),
    page,
    perPage: PER_PAGE,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / PER_PAGE),
  }
}

async function getClient(id) {
  const { data, error } = await supabase
    .from('clients')
    .select('*, companies(name)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Client not found')

  return {
    ...data,
    source: data.lead_source || 'manual',
    website: data.website || null,
    company_name: data.companies?.name || null,
    companies: undefined,
  }
}

async function resolveOrCreateCompany(body) {
  // If a company_id UUID was passed directly, use it
  if (body.company_id) return body.company_id

  // Accept company_name or brand_name as a string to find-or-create
  const companyName = (body.company_name || body.brand_name || '').trim()
  if (!companyName) return null

  // Check if a company with this name already exists (case-insensitive)
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .ilike('name', companyName)
    .maybeSingle()

  if (existing) return existing.id

  // Auto-create the company
  const { data: newCompany, error } = await supabase
    .from('companies')
    .insert({ name: companyName, industry: body.industry || null })
    .select('id')
    .single()

  if (error) throw error
  await logActivity('company_created', 'company', newCompany.id, { name: companyName, auto: true })
  return newCompany.id
}

async function createClient(body) {
  const { name, email, phone, role, industry, source, notes, service } = body

  const resolvedCompanyId = await resolveOrCreateCompany(body)

  const insertData = {
    name,
    email,
    phone,
    company_id: resolvedCompanyId,
    brand_name: body.company_name || body.brand_name || null,
    role,
    industry,
    lead_source: source || 'manual',
    notes,
    service: service || 'General',
    added_by: ADMIN_PROFILE_ID,
    added_by_name: 'CRM Admin',
    pipeline_stage: body.pipeline_stage || 'prospect',
  }

  if (body.pipeline_data) {
    insertData.pipeline_data = body.pipeline_data
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert(insertData)
    .select('*, companies(name)')
    .single()

  if (error) throw error

  const companyName = client.companies?.name || await resolveCompanyName(resolvedCompanyId)

  if (source === 'manual') {
    await queueOutreachEmail(client.id, null, {
      name,
      company: companyName,
      role,
      industry,
      notes,
    })
  }

  await logActivity('client_created', 'client', client.id, { name, source: source || 'manual' })

  return {
    ...client,
    source: client.lead_source || 'manual',
    website: client.website || null,
    company_name: companyName,
    companies: undefined,
  }
}

async function updateClient(id, body) {
  const { data: existing, error: fetchError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) throw new Error('Client not found')

  const allowed = ['name', 'email', 'phone', 'company_id', 'role', 'industry', 'source', 'notes', 'service', 'pipeline_stage', 'ai_confirmed', 'is_nurture', 'website', 'qualification']
  const updates = {}
  for (const key of allowed) {
    if (body[key] !== undefined) {
      if (key === 'source') {
        updates.lead_source = body.source
      } else {
        updates[key] = body[key]
      }
    }
  }

  if (body.pipeline_data !== undefined) {
    updates.pipeline_data = { ...((existing.pipeline_data || {})), ...body.pipeline_data }
  }

  if (body.company_name !== undefined || body.brand_name !== undefined) {
    updates.company_id = await resolveOrCreateCompany(body)
    updates.brand_name = body.company_name || body.brand_name || null
  }

  const { data: client, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select('*, companies(name)')
    .single()

  if (error) throw error

  if (body.pipeline_stage !== undefined && body.pipeline_stage !== existing.pipeline_stage) {
    await logActivity('stage_changed', 'client', id, {
      from: existing.pipeline_stage,
      to: body.pipeline_stage,
    })
  }

  if ((body.pipeline_stage === 'discovery_booked' || body.pipeline_stage === 'call_booked') && body.call_id) {
    const { data: call } = await supabase.from('calls').select('*').eq('id', body.call_id).maybeSingle()
    const companyName = client.companies?.name || await resolveCompanyName(client.company_id)
    await queueCallBookingEmail(id, body.deal_id || null, body.call_id, {
      name: client.name,
      company: companyName,
      date: call?.scheduled_at,
      startTime: null,
      endTime: null,
    })
  }

  // Trigger Human Call-Up if AI Confirmation fails
  if (body.ai_confirmed === false && existing.ai_confirmed !== false) {
    await supabase.from('tasks').insert({
      title: `Human Call-Up for ${client.name}`,
      status: 'pending',
      client_id: id,
      assigned_to: ADMIN_PROFILE_ID
    })
  }

  return {
    ...client,
    source: client.lead_source || 'manual',
    website: client.website || null,
    company_name: client.companies?.name || null,
    companies: undefined,
  }
}

async function listDeals(query) {
  const clientId = query.get('client_id')
  const stage = query.get('stage')

  let q = supabase
    .from('deals')
    .select('*, clients(name)')
    .order('logged_at', { ascending: false })

  if (clientId) q = q.eq('client_id', clientId)
  if (stage) q = q.eq('stage', stage)

  const [dealsRes, profilesRes] = await Promise.all([
    q,
    supabase.from('profiles').select('id, full_name')
  ])

  if (dealsRes.error) throw dealsRes.error

  const profileMap = {}
  for (const p of profilesRes.data || []) {
    profileMap[p.id] = p.full_name
  }

  return (dealsRes.data || []).map(d => ({
    ...d,
    client_name: d.clients?.name || null,
    assigned_name: profileMap[d.assigned_to] || '—',
    clients: undefined,
  }))
}

async function createDeal(body) {
  const { data: deal, error } = await supabase
    .from('deals')
    .insert(body)
    .select('*, clients(name)')
    .single()

  if (error) throw error

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', deal.assigned_to)
    .maybeSingle()

  await logActivity('deal_created', 'deal', deal.id, { title: deal.title, stage: deal.stage })

  return {
    ...deal,
    client_name: deal.clients?.name || null,
    assigned_name: profile?.full_name || '—',
    clients: undefined,
  }
}

async function updateDeal(id, body) {
  const { data: existing, error: fetchError } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) throw new Error('Deal not found')

  const updates = { ...body, updated_at: new Date().toISOString() }
  delete updates.id

  const { data: deal, error } = await supabase
    .from('deals')
    .update(updates)
    .eq('id', id)
    .select('*, clients(name)')
    .single()

  if (error) throw error

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', deal.assigned_to)
    .maybeSingle()

  if (body.stage !== undefined && body.stage !== existing.stage) {
    await logActivity('stage_changed', 'deal', id, { from: existing.stage, to: body.stage })

    if (body.stage === 'closed_won') {
      // Trigger Onboarding tasks automatically
      const now = new Date()
      const in30Days = new Date()
      in30Days.setDate(in30Days.getDate() + 30)
      
      await supabase.from('tasks').insert([
        {
          title: `Delivery Handoff: ${deal.title}`,
          status: 'pending',
          deal_id: id,
          client_id: deal.client_id,
          deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          assigned_to: ADMIN_PROFILE_ID
        },
        {
          title: `30-Day Check-in: ${deal.title}`,
          status: 'pending',
          deal_id: id,
          client_id: deal.client_id,
          deadline: in30Days.toISOString(),
          assigned_to: ADMIN_PROFILE_ID
        }
      ])
    }
  }

  return {
    ...deal,
    client_name: deal.clients?.name || null,
    assigned_name: profile?.full_name || '—',
    clients: undefined,
  }
}

async function getPipeline() {
  const { data, error } = await supabase
    .from('deals')
    .select('id, title, amount_monthly, stage, probability, expected_close, updated_at, custom_offer, clients(name)')
    .order('updated_at', { ascending: false })
  if (error) throw error

  const pipeline = {}
  for (const deal of data || []) {
    if (!pipeline[deal.stage]) pipeline[deal.stage] = []
    pipeline[deal.stage].push({
      id: deal.id,
      title: deal.title,
      client_name: deal.clients?.name || null,
      amount_monthly: deal.amount_monthly,
      stage: deal.stage,
      probability: deal.probability,
      expected_close: deal.expected_close,
      updated_at: deal.updated_at,
      custom_offer: deal.custom_offer,
    })
  }

  return pipeline
}

function getFYRange(fy) {
  const start = new Date(fy - 1, 3, 1)
  const end = new Date(fy, 3, 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

async function getMonthlyTrend(fy) {
  if (!fy) {
    const now = new Date()
    fy = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear()
  }

  const months = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(fy - 1, 3 + i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const monthStr = `${y}-${m}`
    const startISO = d.toISOString()
    const endD = new Date(y, d.getMonth() + 1, 1)
    const endISO = endD.toISOString()
    months.push({ month: monthStr, start: startISO, end: endISO })
  }

  let trendDeals, trendClients, trendExpenses
  try {
    const { data, error } = await supabase.from('deals').select('amount_monthly, stage, created_at')
    if (error) throw error
    trendDeals = data || []
  } catch (e) { trendDeals = [] }
  try {
    const { data, error } = await supabase.from('clients').select('id, created_at')
    if (error) throw error
    trendClients = data || []
  } catch (e) { trendClients = [] }
  try {
    const { data, error } = await supabase.from('expenses').select('amount, date')
    if (error) throw error
    trendExpenses = data || []
  } catch (e) { trendExpenses = [] }

  return months.map(({ month, start, end }) => {
    const monthMRR = (trendDeals || [])
      .filter(d => d.stage === 'closed_won' && d.created_at >= start && d.created_at < end)
      .reduce((s, d) => s + $n(d.amount_monthly), 0)
    const newClients = (trendClients || [])
      .filter(c => c.created_at >= start && c.created_at < end)
      .length
    const monthExpenses = (trendExpenses || [])
      .filter(r => r.date >= start.slice(0, 10) && r.date < end.slice(0, 10))
      .reduce((s, r) => s + $n(r.amount), 0)
    return {
      month,
      mrr: monthMRR,
      new_clients: newClients,
      expenses: monthExpenses,
    }
  })
}

export async function handleCRMRequest(req, res, url, method, body) {
  if (!url.startsWith('/crm')) return false

  const { pathname, query } = parseUrl(url)

  try {
    // GET /crm/api/dashboard-stats[?month=YYYY-MM]
    if (method === 'GET' && pathname === '/crm/api/dashboard-stats') {
      const month = query.get('month') || undefined
      const data = await getDashboardStats(month)
      return json(res, 200, { success: true, data })
    }

    // GET /crm/api/monthly-trend[?fy=2026]
    if (method === 'GET' && pathname === '/crm/api/monthly-trend') {
      const fy = query.get('fy') ? parseInt(query.get('fy')) : undefined
      const data = await getMonthlyTrend(fy)
      return json(res, 200, { success: true, data })
    }

    // GET /crm/api/clients
    if (method === 'GET' && pathname === '/crm/api/clients') {
      // Show all clients; use ?nurture=true/false to filter nurture-specific
      const data = await listClients(query)
      return json(res, 200, { success: true, data })
    }

    // GET /crm/api/nurture-list
    if (method === 'GET' && pathname === '/crm/api/nurture-list') {
      query.set('nurture', 'true')
      const data = await listClients(query)
      return json(res, 200, { success: true, data })
    }

    // POST /crm/api/clients
    if (method === 'POST' && pathname === '/crm/api/clients') {
      const data = await createClient(body || {})
      return json(res, 201, { success: true, data })
    }

    // GET /crm/api/clients/:id
    {
      const params = matchRoute(pathname, '/crm/api/clients/:id')
      if (method === 'GET' && params) {
        const data = await getClient(params.id)
        return json(res, 200, { success: true, data })
      }
    }

    // GET /crm/api/clients/:id/full — full client data with related records
    {
      const params = matchRoute(pathname, '/crm/api/clients/:id/full')
      if (method === 'GET' && params) {
        const client = await getClient(params.id)

        const [calls, deals, activity, projects] = await Promise.all([
          supabase.from('calls').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
          supabase.from('deals').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
          supabase.from('activity_log').select('*').eq('entity_id', params.id).eq('entity_type', 'client').order('created_at', { ascending: false }).limit(50),
          supabase.from('projects').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
        ])

        return json(res, 200, {
          success: true,
          data: {
            ...client,
            calls: calls.data || [],
            deals: deals.data || [],
            activity: activity.data || [],
            projects: projects.data || [],
          }
        })
      }
    }

    // PATCH /crm/api/clients/:id
    {
      const params = matchRoute(pathname, '/crm/api/clients/:id')
      if (method === 'PATCH' && params) {
        const data = await updateClient(params.id, body || {})
        return json(res, 200, { success: true, data })
      }
    }

    // GET /crm/api/deals
    if (method === 'GET' && pathname === '/crm/api/deals') {
      const data = await listDeals(query)
      return json(res, 200, { success: true, data })
    }

    // POST /crm/api/deals
    if (method === 'POST' && pathname === '/crm/api/deals') {
      const data = await createDeal(body || {})
      return json(res, 201, { success: true, data })
    }

    // PATCH /crm/api/deals/:id
    {
      const params = matchRoute(pathname, '/crm/api/deals/:id')
      if (method === 'PATCH' && params) {
        const data = await updateDeal(params.id, body || {})
        return json(res, 200, { success: true, data })
      }
    }

    // GET /crm/api/pipeline
    if (method === 'GET' && pathname === '/crm/api/pipeline') {
      const data = await getPipeline()
      return json(res, 200, { success: true, data })
    }

    // GET /crm/api/settings
    if (method === 'GET' && pathname === '/crm/api/settings') {
      const { data, error } = await supabase.from('settings').select('key, value').in('key', ['gmail_user', 'gmail_app_password', 'gmail_from_name', 'admin_email', 'resend_api_key'])
      if (error) throw error
      const map = {}
      for (const row of data || []) map[row.key] = row.value
      return json(res, 200, { success: true, data: map })
    }

    // POST /crm/api/settings
    if (method === 'POST' && pathname === '/crm/api/settings') {
      for (const [key, value] of Object.entries(body || {})) {
        if (!['gmail_user', 'gmail_app_password', 'gmail_from_name', 'admin_email', 'resend_api_key'].includes(key)) continue
        const { error } = await supabase.from('settings').upsert({ key, value: String(value) }, { onConflict: 'key' })
        if (error) throw error
      }
      return json(res, 200, { success: true })
    }

    // ─── Projects (CRM admin) ───
    if (method === 'GET' && pathname === '/crm/api/projects') {
      const data = await listProjects(query)
      return json(res, 200, { success: true, ...data })
    }

    if (method === 'POST' && pathname === '/crm/api/projects') {
      const data = await createProject(body)
      return json(res, 201, { success: true, data })
    }

    {
      const params = matchRoute(pathname, '/crm/api/projects/:id')
      if (method === 'GET' && params) {
        const data = await getProject(params.id)
        return data ? json(res, 200, { success: true, data }) : json(res, 404, { success: false, error: 'Not found' })
      }
      if (method === 'PATCH' && params) {
        const data = await updateProject(params.id, body)
        return json(res, 200, { success: true, data })
      }
      if (method === 'DELETE' && params) {
        const data = await deleteProject(params.id)
        return json(res, 200, { success: true, data })
      }
    }

    // ─── Project Milestones ───
    {
      const params = matchRoute(pathname, '/crm/api/projects/:id/milestones')
      if (method === 'GET' && params) {
        const data = await listMilestones(params.id)
        return json(res, 200, { success: true, data })
      }
      if (method === 'POST' && params) {
        const data = await createMilestone({ ...body, project_id: params.id })
        return json(res, 201, { success: true, data })
      }
    }

    {
      const params = matchRoute(pathname, '/crm/api/milestones/:id')
      if (method === 'PATCH' && params) {
        const data = await updateMilestone(params.id, body)
        return json(res, 200, { success: true, data })
      }
      if (method === 'DELETE' && params) {
        const data = await deleteMilestone(params.id)
        return json(res, 200, { success: true, data })
      }
    }

    // ─── Migration helper ───
    if (method === 'POST' && pathname === '/crm/api/migrate') {
      const errors = await ensureSchemaTables()
      return json(res, 200, { success: true, errors })
    }

    // ─── Expenses ───
    if (method === 'GET' && pathname === '/crm/api/expenses') {
      const data = await queryExpenses()
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/crm/api/expenses') {
      const { data, error } = await supabase
        .from('expenses')
        .insert(body)
        .select()
        .single()
      if (error) {
        const msg = error.message || ''
        if (msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('Could not find the table')) {
          await ensureSchemaTables()
          const retry = await supabase.from('expenses').insert(body).select().single()
          if (retry.error) throw retry.error
          return json(res, 201, { success: true, data: retry.data })
        }
        throw error
      }
      return json(res, 201, { success: true, data })
    }

    {
      const params = matchRoute(pathname, '/crm/api/expenses/:id')
      if (method === 'DELETE' && params) {
        const { error } = await supabase.from('expenses').delete().eq('id', params.id)
        if (error) {
          const msg = error.message || ''
          if (msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('Could not find the table')) {
            await ensureSchemaTables()
            const retry = await supabase.from('expenses').delete().eq('id', params.id)
            if (retry.error) throw retry.error
          }
          throw error
        }
        return json(res, 200, { success: true })
      }
    }

    json(res, 404, { success: false, error: 'Not found' })
    return true
  } catch (err) {
    json(res, 500, { success: false, error: err.message })
    return true
  }
}

// Run schema migrations on startup (swallows errors for missing exec_sql)
ensureSchemaTables().catch(() => {})
