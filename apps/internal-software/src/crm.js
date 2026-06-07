import {
  supabase, queueOutreachEmail, queueCallBookingEmail,
  listProjects, getProject, createProject, updateProject, deleteProject,
  listMilestones, createMilestone, updateMilestone, deleteMilestone,
  listClientMessages, replyToClientMessage,
  listClientDocuments, createClientDocument,
  listPortalClients, getPortalDashboard,
  listTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry,
  startTimer, pauseTimer, resumeTimer, stopTimer,
  getActiveTimer, listActiveTimers,
  getTimeReport, getWeeklyReport,
} from '@flodon/core'

const ADMIN_PROFILE_ID = process.env.CRM_ADMIN_PROFILE_ID || '00000000-0000-0000-0000-000000000001'
const PER_PAGE = 20
const CLOSED_STAGES = ['closed_won', 'closed_lost']

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

async function getDashboardStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const [
    { data: allDeals },
    { data: closedWonThisMonth },
    { count: closedWonCount },
    { count: closedLostCount },
    { count: newClientsThisWeek },
    { data: emailQueueRows },
    { count: overdueTasks },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('deals').select('amount_monthly, stage'),
    supabase.from('deals').select('amount_monthly').eq('stage', 'closed_won').gte('updated_at', startOfMonth),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('stage', 'closed_won'),
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('stage', 'closed_lost'),
    supabase.from('clients').select('id', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
    supabase.from('email_queue').select('status'),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).lt('deadline', now.toISOString()).neq('status', 'done'),
    supabase
      .from('activity_log')
      .select('id, action, entity_type, entity_id, metadata, created_at, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const openDeals = (allDeals || []).filter(d => !CLOSED_STAGES.includes(d.stage))
  const pipelineValue = openDeals.reduce((sum, d) => sum + (Number(d.amount_monthly) || 0), 0)

  const dealsByStage = {}
  for (const deal of allDeals || []) {
    dealsByStage[deal.stage] = (dealsByStage[deal.stage] || 0) + 1
  }

  const closedWonThisMonthCount = closedWonThisMonth?.length || 0
  const closedWonThisMonthValue = (closedWonThisMonth || []).reduce((sum, d) => sum + (Number(d.amount_monthly) || 0), 0)

  const totalClosed = (closedWonCount || 0) + (closedLostCount || 0)
  const conversionRate = totalClosed > 0 ? ((closedWonCount || 0) / totalClosed) * 100 : 0

  const emailQueueByStatus = {}
  for (const row of emailQueueRows || []) {
    emailQueueByStatus[row.status] = (emailQueueByStatus[row.status] || 0) + 1
  }

  const wonDeals = (allDeals || []).filter(d => d.stage === 'closed_won')
  const avgDealSize = wonDeals.length > 0
    ? wonDeals.reduce((sum, d) => sum + (Number(d.amount_monthly) || 0), 0) / wonDeals.length
    : 0

  const mappedRecentActivity = (recentActivity || []).map(row => ({
    ...row,
    profile_name: row.profiles?.full_name || null,
    profiles: undefined,
  }))

  return {
    pipelineValue,
    dealsByStage,
    closedWonThisMonth: { count: closedWonThisMonthCount, value: closedWonThisMonthValue },
    conversionRate: Math.round(conversionRate * 100) / 100,
    newClientsThisWeek: newClientsThisWeek || 0,
    emailQueueByStatus,
    overdueTasks: overdueTasks || 0,
    recentActivity: mappedRecentActivity,

    // Snake case fallback for frontend dashboard
    pipeline_value: pipelineValue,
    deals_by_stage: dealsByStage,
    closed_won_value: closedWonThisMonthValue,
    closed_won_count: closedWonThisMonthCount,
    conversion_rate: Math.round(conversionRate * 100) / 100,
    avg_deal_size: Math.round(avgDealSize * 100) / 100,
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
    q = q.eq('is_nurture', true)
  } else if (isNurture === 'false') {
    q = q.eq('is_nurture', false)
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
      website: c.source_url || null,
      company_name: c.companies?.name || null,
      companies: undefined,
    })),
    page,
    perPage: PER_PAGE,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / PER_PAGE),
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

  const [{ data: profile }, resolvedCompanyId] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', ADMIN_PROFILE_ID).maybeSingle(),
    resolveOrCreateCompany(body),
  ])

  const addedByName = profile?.full_name || 'CRM Admin'

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
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
      added_by_name: addedByName,
    })
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
    website: client.source_url || null,
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

  const allowed = ['name', 'email', 'phone', 'company_id', 'role', 'industry', 'source', 'notes', 'service', 'pipeline_stage', 'ai_confirmed', 'is_nurture']
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

  if (body.pipeline_stage === 'call_booked' && body.call_id) {
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
    website: client.source_url || null,
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

async function listCompanies() {
  const [companiesRes, clientsRes] = await Promise.all([
    supabase.from('companies').select('*').order('name'),
    supabase.from('clients').select('company_id')
  ])
  if (companiesRes.error) throw companiesRes.error
  if (clientsRes.error) throw clientsRes.error

  const clientCounts = {}
  for (const c of clientsRes.data || []) {
    if (c.company_id) {
      clientCounts[c.company_id] = (clientCounts[c.company_id] || 0) + 1
    }
  }

  return (companiesRes.data || []).map(comp => ({
    ...comp,
    client_count: clientCounts[comp.id] || 0
  }))
}

async function createCompany(body) {
  const { data, error } = await supabase.from('companies').insert(body).select().single()
  if (error) throw error
  await logActivity('company_created', 'company', data.id, { name: data.name })
  return data
}

async function listTasks(query) {
  let q = supabase
    .from('tasks')
    .select('*, clients(name), deals(title)')
    .order('created_at', { ascending: false })

  const assignedTo = query.get('assigned_to')
  const status = query.get('status')
  const clientId = query.get('client_id')

  if (assignedTo) q = q.eq('agent_id', assignedTo)
  if (status) q = q.eq('status', status)
  if (clientId) q = q.eq('client_id', clientId)

  const [tasksRes, profilesRes] = await Promise.all([
    q,
    supabase.from('profiles').select('id, full_name')
  ])

  if (tasksRes.error) throw tasksRes.error

  const profileMap = {}
  for (const p of profilesRes.data || []) {
    profileMap[p.id] = p.full_name
  }

  return (tasksRes.data || []).map(t => ({
    ...t,
    client_name: t.clients?.name || '—',
    deal_title: t.deals?.title || '—',
    assigned_name: profileMap[t.agent_id] || '—',
    clients: undefined,
    deals: undefined,
  }))
}

async function createTask(body) {
  const insertBody = { ...body }
  if (insertBody.assigned_to) {
    insertBody.agent_id = insertBody.assigned_to
    delete insertBody.assigned_to
  }
  const { data, error } = await supabase.from('tasks').insert(insertBody).select().single()
  if (error) throw error
  await logActivity('task_created', 'task', data.id, { title: data.title })
  return data
}

async function updateTask(id, body) {
  const updates = { ...body }
  delete updates.id
  if (updates.assigned_to) {
    updates.agent_id = updates.assigned_to
    delete updates.assigned_to
  }

  const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single()
  if (error) throw error
  if (!data) throw new Error('Task not found')
  return data
}

async function listCalls(query) {
  let q = supabase
    .from('calls')
    .select('*, clients(name, company_id, companies(name))')
    .order('created_at', { ascending: false })

  const clientId = query.get('client_id')
  const status = query.get('status')

  if (clientId) q = q.eq('client_id', clientId)
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) throw error
  return (data || []).map(c => ({
    ...c,
    client_name: c.clients?.name || c.prospect_name || '—',
    company_name: c.clients?.companies?.name || c.company || '—',
    clients: undefined,
  }))
}

async function createCall(body) {
  // Preserve deal_id for email queue before stripping from insert payload
  const dealId = body.deal_id || null
  const insertBody = { ...body }
  delete insertBody.deal_id
  delete insertBody.booked_date
  delete insertBody.booked_start
  delete insertBody.booked_end
  delete insertBody.start_time
  delete insertBody.end_time

  const { data: call, error } = await supabase.from('calls').insert(insertBody).select().single()
  if (error) throw error

  await logActivity('call_created', 'call', call.id, { status: call.status })

  if (call.client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('name, company_id, companies(name)')
      .eq('id', call.client_id)
      .maybeSingle()

    await queueCallBookingEmail(
      call.client_id,
      dealId,
      call.id,
      {
        name: client?.name || call.prospect_name,
        company: client?.companies?.name,
        date: call.scheduled_at,
        startTime: null,
        endTime: null,
      }
    )
  }

  return call
}

async function listEmailQueue(query) {
  const page = Math.max(1, parseInt(query.get('page') || '1', 10))
  const status = query.get('status')
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let q = supabase
    .from('email_queue')
    .select('*, clients(name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) q = q.eq('status', status)

  const { data, error, count } = await q
  if (error) throw error

  return {
    items: (data || []).map(item => ({
      ...item,
      client_name: item.clients?.name || '—',
      to: item.clients?.email || '—',
      clients: undefined,
    })),
    page,
    perPage: PER_PAGE,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / PER_PAGE),
  }
}

async function retryEmailQueue(id) {
  const { data, error } = await supabase
    .from('email_queue')
    .update({ status: 'queued', error_message: null })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('Email queue item not found')
  return data
}

async function getSettingsKeys() {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['resend_api_key', 'gmail_user', 'gmail_app_password', 'gmail_from_name'])

  if (error) throw error

  const map = {}
  for (const row of data || []) map[row.key] = row.value || ''

  return {
    resend_api_key: map.resend_api_key || '',
    gmail_user: map.gmail_user || '',
    gmail_app_password: map.gmail_app_password || '',
    gmail_from_name: map.gmail_from_name || '',
  }
}

async function updateSettingsKeys(body) {
  const allowedKeys = ['resend_api_key', 'gmail_user', 'gmail_app_password', 'gmail_from_name']
  const entries = []
  
  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      entries.push([key, String(body[key]).trim()])
    }
  }

  for (const [key, value] of entries) {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' })
    if (error) throw error
  }

  // Clear caches in resend.js dynamically to pick up new DB config
  try {
    const { clearEmailConfigCache } = await import('@flodon/core/utils/resend.js')
    if (clearEmailConfigCache) clearEmailConfigCache()
    const { clearResendConfigCache } = await import('@flodon/core/lib/resend.js')
    if (clearResendConfigCache) clearResendConfigCache()
  } catch(e) {
    // Ignore if not present
  }

  return getSettingsKeys()
}

async function triggerNurtureAction(clientId, type) {
  const { data: client, error } = await supabase
    .from('clients')
    .select('name, email, phone')
    .eq('id', clientId)
    .single()
    
  if (error) throw error
  
  if (type === 'email') {
    if (!client.email) throw new Error('Client has no email')
    const { sendLongTermNurtureEmail } = await import('@flodon/core/utils/resend.js')
    // sendLongTermNurtureEmail also triggers whatsapp inside if phone is present,
    // but the user said they don't want whatsapp stuff right now. 
    // We can just call it (it handles whatsapp natively if it exists, though they might not configure twilio).
    await sendLongTermNurtureEmail(client.email, null, client.name) // Passing null for phone so no WhatsApp is sent
    await logActivity('nurture_email_sent', 'client', clientId, { email: client.email })
  } else {
    throw new Error('Unsupported nurture action')
  }
  
  return { success: true }
}

export async function handleCRMRequest(req, res, url, method, body) {
  if (!url.startsWith('/crm')) return false

  const { pathname, query } = parseUrl(url)

  try {
    // GET /crm/api/dashboard-stats
    if (method === 'GET' && pathname === '/crm/api/dashboard-stats') {
      const data = await getDashboardStats()
      return json(res, 200, { success: true, data })
    }

    // GET /crm/api/clients
    if (method === 'GET' && pathname === '/crm/api/clients') {
      // By default, exclude nurture leads from the main list unless explicitly requested
      if (!query.has('nurture')) {
        query.set('nurture', 'false')
      }
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

    // GET /crm/api/companies
    if (method === 'GET' && pathname === '/crm/api/companies') {
      const data = await listCompanies()
      return json(res, 200, { success: true, data })
    }

    // POST /crm/api/companies
    if (method === 'POST' && pathname === '/crm/api/companies') {
      const data = await createCompany(body || {})
      return json(res, 201, { success: true, data })
    }

    // GET /crm/api/tasks
    if (method === 'GET' && pathname === '/crm/api/tasks') {
      const data = await listTasks(query)
      return json(res, 200, { success: true, data })
    }

    // POST /crm/api/tasks
    if (method === 'POST' && pathname === '/crm/api/tasks') {
      const data = await createTask(body || {})
      return json(res, 201, { success: true, data })
    }

    // PATCH /crm/api/tasks/:id
    {
      const params = matchRoute(pathname, '/crm/api/tasks/:id')
      if (method === 'PATCH' && params) {
        const data = await updateTask(params.id, body || {})
        return json(res, 200, { success: true, data })
      }
    }

    // GET /crm/api/calls
    if (method === 'GET' && pathname === '/crm/api/calls') {
      const data = await listCalls(query)
      return json(res, 200, { success: true, data })
    }

    // POST /crm/api/calls
    if (method === 'POST' && pathname === '/crm/api/calls') {
      const data = await createCall(body || {})
      return json(res, 201, { success: true, data })
    }

    // GET /crm/api/email-queue
    if (method === 'GET' && pathname === '/crm/api/email-queue') {
      const data = await listEmailQueue(query)
      return json(res, 200, { success: true, data })
    }

    // PATCH /crm/api/email-queue/:id/retry
    {
      const params = matchRoute(pathname, '/crm/api/email-queue/:id/retry')
      if (method === 'PATCH' && params) {
        const data = await retryEmailQueue(params.id)
        return json(res, 200, { success: true, data })
      }
    }

    // GET /crm/api/settings/keys
    if (method === 'GET' && pathname === '/crm/api/settings/keys') {
      const data = await getSettingsKeys()
      return json(res, 200, { success: true, data })
    }

    // POST /crm/api/settings/keys
    if (method === 'POST' && pathname === '/crm/api/settings/keys') {
      const data = await updateSettingsKeys(body || {})
      return json(res, 200, { success: true, data })
    }

    // POST /crm/api/nurture/trigger
    if (method === 'POST' && pathname === '/crm/api/nurture/trigger') {
      if (!body.client_id || !body.type) {
         return json(res, 400, { success: false, error: 'client_id and type are required' })
      }
      const data = await triggerNurtureAction(body.client_id, body.type)
      return json(res, 200, { success: true, data })
    }

    // GET /crm/api/settings
    if (method === 'GET' && pathname === '/crm/api/settings') {
      const { data, error } = await supabase.from('settings').select('key, value')
      if (error) throw error
      const map = {}
      for (const row of data || []) map[row.key] = row.value
      return json(res, 200, { success: true, settings: map, data: map })
    }

    // POST /crm/api/settings
    if (method === 'POST' && pathname === '/crm/api/settings') {
      for (const [key, value] of Object.entries(body || {})) {
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

    // ─── Time Tracking (CRM routes) ───
    if (method === 'GET' && pathname === '/crm/api/time/entries') {
      const data = await listTimeEntries({
        team_member: query.get('team_member'), client_id: query.get('client_id'),
        project_id: query.get('project_id'),
        date_from: query.get('date_from'), date_to: query.get('date_to'),
        page: parseInt(query.get('page') || '1'), limit: parseInt(query.get('limit') || '50'),
      })
      return json(res, 200, { success: true, ...data })
    }

    if (method === 'POST' && pathname === '/crm/api/time/entries') {
      const data = await createTimeEntry(body)
      return json(res, 201, { success: true, data })
    }

    {
      const params = matchRoute(pathname, '/crm/api/time/entries/:id')
      if (method === 'PATCH' && params) {
        const data = await updateTimeEntry(params.id, body)
        return json(res, 200, { success: true, data })
      }
      if (method === 'DELETE' && params) {
        const data = await deleteTimeEntry(params.id)
        return json(res, 200, { success: true, data })
      }
    }

    if (method === 'POST' && pathname === '/crm/api/time/timer/start') {
      const data = await startTimer(body)
      return json(res, 201, { success: true, data })
    }

    if (method === 'POST' && pathname.startsWith('/crm/api/time/timer/')) {
      const parts = pathname.split('/')
      const action = parts[5]
      const id = parts.length > 6 ? parts[6] : body?.id
      if (!id) return json(res, 400, { success: false, error: 'Timer ID required' })
      let data
      if (action === 'pause') data = await pauseTimer(id)
      else if (action === 'resume') data = await resumeTimer(id)
      else if (action === 'stop') data = await stopTimer(id)
      else return json(res, 400, { success: false, error: 'Invalid action' })
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && pathname === '/crm/api/time/timer/active') {
      const teamMember = query.get('team_member')
      const data = teamMember ? await getActiveTimer(teamMember) : await listActiveTimers()
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && pathname === '/crm/api/time/report') {
      const data = await getTimeReport({
        team_member: query.get('team_member'), client_id: query.get('client_id'),
        project_id: query.get('project_id'), date_from: query.get('date_from'), date_to: query.get('date_to'),
      })
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && pathname === '/crm/api/time/weekly') {
      const data = await getWeeklyReport({ week_start: query.get('week_start'), team_member: query.get('team_member') })
      return json(res, 200, { success: true, data })
    }

    // ─── Portal Admin (CRM manages client portal) ───
    if (method === 'GET' && pathname === '/crm/api/portal/clients') {
      const data = await listPortalClients()
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && pathname === '/crm/api/portal/messages') {
      const clientId = query.get('client_id')
      if (!clientId) return json(res, 400, { success: false, error: 'client_id required' })
      const data = await listClientMessages(clientId)
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/crm/api/portal/reply') {
      if (!body.client_id || !body.content) return json(res, 400, { success: false, error: 'client_id and content required' })
      const data = await replyToClientMessage({ client_id: body.client_id, content: body.content, sender_name: body.sender_name || 'Team' })
      return json(res, 201, { success: true, data })
    }

    if (method === 'GET' && pathname === '/crm/api/portal/documents') {
      const clientId = query.get('client_id')
      if (!clientId) return json(res, 400, { success: false, error: 'client_id required' })
      const data = await listClientDocuments(clientId)
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/crm/api/portal/documents') {
      if (!body.client_id || !body.title || !body.file_url) return json(res, 400, { success: false, error: 'client_id, title, and file_url required' })
      const data = await createClientDocument({ ...body, uploaded_by: 'team' })
      return json(res, 201, { success: true, data })
    }

    json(res, 404, { success: false, error: 'Not found' })
    return true
  } catch (err) {
    json(res, 500, { success: false, error: err.message })
    return true
  }
}
