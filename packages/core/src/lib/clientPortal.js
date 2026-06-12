import crypto from 'crypto'
import { supabase } from '../supabase.js'
import { log } from '../utils/logger.js'
import { sendEmail } from '../utils/resend.js'

const PORTAL_BASE = process.env.SOFTWARE_DASHBOARD_URL || process.env.SOFTWARE_PUBLIC_URL || 'http://localhost:10011'

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

export async function requestMagicLink(email) {
  if (!email) throw new Error('Email is required')

  const { data: client, error } = await supabase
    .from('clients')
    .select('id, name, email')
    .eq('email', email)
    .maybeSingle()

  if (error) throw error
  if (!client) throw new Error('No account found with this email')

  const token = generateToken()
  const tokenHash = hashToken(token)

  const { error: insertError } = await supabase.from('portal_auth_tokens').insert({
    client_id: client.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  })

  if (insertError) throw insertError

  const magicLink = `${PORTAL_BASE}/portal/auth?token=${token}`
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;">
    <div style="background:#000;padding:28px;text-align:center;">
      <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#a1a1aa;">FLODON</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#fff;">Client Portal Login</h1>
    </div>
    <div style="padding:28px;color:#18181b;font-size:14px;line-height:1.6;">
      <p>Hi ${client.name},</p>
      <p>Click the button below to sign in to your client portal. This link expires in 15 minutes.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${magicLink}" style="display:inline-block;background:#000;color:#fff;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none;">Sign In to Portal</a>
      </div>
      <p style="color:#71717a;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      <hr style="border:0;border-top:1px solid #e4e4e7;margin:20px 0;">
      <p style="color:#a1a1aa;font-size:12px;">Flodon Operations &bull; ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
    </div>
  </div>
</body>
</html>`

  await sendEmail({ to: email, subject: 'Your Flodon Portal Login Link', html })
  log(`[Portal] Magic link sent to ${email}`, 'ok')
  return { success: true }
}

export async function verifyMagicLink(token) {
  if (!token) throw new Error('Token is required')

  const tokenHash = hashToken(token)

  const { data, error } = await supabase
    .from('portal_auth_tokens')
    .select('*, clients(name, email)')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Invalid or expired link')
  if (data.used_at) throw new Error('This link has already been used')
  if (new Date(data.expires_at) < new Date()) throw new Error('This link has expired')

  await supabase.from('portal_auth_tokens').update({ used_at: new Date().toISOString() }).eq('id', data.id)

  const sessionToken = generateToken()
  const sessionHash = hashToken(sessionToken)

  const { error: sessionError } = await supabase.from('portal_sessions').insert({
    client_id: data.client_id,
    token_hash: sessionHash,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })

  if (sessionError) throw sessionError

  log(`[Portal] Session created for ${data.clients?.name || data.client_id}`, 'ok')
  return { session_token: sessionToken, client: data.clients }
}

export async function getPortalSession(sessionToken) {
  if (!sessionToken) return null

  const tokenHash = hashToken(sessionToken)

  const { data, error } = await supabase
    .from('portal_sessions')
    .select('*, clients(name, email, phone, company_name, role)')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error || !data) return null
  if (new Date(data.expires_at) < new Date()) return null

  await supabase.from('portal_sessions').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)

  return { client_id: data.client_id, client: data.clients }
}

export async function getPortalDashboard(clientId) {
  const [projectsRes, dealsRes, invoicesRes, messagesRes, documentsRes, milestonesRes] = await Promise.all([
    supabase.from('projects').select('id, name, status, description, start_date, target_date, created_at, updated_at').eq('client_id', clientId).order('created_at', { ascending: false }),
    supabase.from('deals').select('id, title, amount_monthly, stage, probability, expected_close, created_at').eq('client_id', clientId).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id, amount, status, due_date, paid_at').eq('client_id', clientId).order('created_at', { ascending: false }).limit(10),
    supabase.from('portal_messages').select('id, content, sender, sender_name, created_at, read_at').eq('client_id', clientId).order('created_at', { ascending: false }).limit(50),
    supabase.from('portal_documents').select('id, title, description, file_url, file_type, uploaded_by, created_at').eq('client_id', clientId).order('created_at', { ascending: false }).limit(20),
    supabase.from('project_milestones').select('id, project_id, name, description, due_date, status, completed_at, sort_order, created_at, updated_at, projects!inner(client_id)').eq('projects.client_id', clientId).order('due_date', { ascending: true }),
  ])

  const projects = (projectsRes.data || []).map(p => {
    const pMilestones = (milestonesRes.data || []).filter(m => m.project_id === p.id)
    const total = pMilestones.length
    const done = pMilestones.filter(m => m.status === 'completed').length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0
    const nextMilestone = pMilestones.filter(m => m.status !== 'completed' && m.due_date).sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0] || null
    return { ...p, milestones: pMilestones, progress, next_milestone: nextMilestone }
  })

  const deals = (dealsRes.data || []).map(d => ({
    id: d.id, title: d.title, amount_monthly: d.amount_monthly,
    stage: d.stage, probability: d.probability,
    expected_close: d.expected_close, created_at: d.created_at,
  }))

  const allMessages = (messagesRes.data || [])
  const documents = (documentsRes.data || [])

  const activity = [
    ...(milestonesRes.data || []).filter(m => m.status === 'completed' && m.completed_at).map(m => ({
      type: 'milestone_completed', text: `Milestone "${m.name}" completed`,
      date: m.completed_at, project_id: m.project_id,
    })),
    ...allMessages.filter(m => m.sender === 'team').map(m => ({
      type: 'team_message', text: `Team: ${m.content.slice(0, 80)}${m.content.length > 80 ? '...' : ''}`,
      date: m.created_at,
    })),
    ...documents.filter(d => d.uploaded_by === 'team').map(d => ({
      type: 'document_shared', text: `Document "${d.title}" shared with you`,
      date: d.created_at,
    })),
    ...projects.filter(p => p.status === 'active' && p.updated_at).map(p => ({
      type: 'project_update', text: `Project "${p.name}" is in progress (${p.progress}% complete)`,
      date: p.updated_at, project_id: p.id,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15)

  const upcomingMilestones = (milestonesRes.data || [])
    .filter(m => m.status !== 'completed' && m.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5)

  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'on_hold')
  const overallProgress = activeProjects.length
    ? Math.round(activeProjects.reduce((s, p) => s + p.progress, 0) / activeProjects.length)
    : 0

  return {
    projects,
    overall_progress: overallProgress,
    active_projects: projects.filter(p => p.status === 'active').length,
    total_projects: projects.length,
    deals,
    active_deals: deals.filter(d => !d.stage?.startsWith('closed')).length,
    unpaid_invoices: (invoicesRes.data || []).filter(i => i.status !== 'paid' && i.status !== 'void').length,
    recent_invoices: (invoicesRes.data || []).slice(0, 3),
    documents,
    recent_documents: documents.slice(0, 5),
    recent_messages: allMessages.slice(0, 5),
    latest_message: allMessages[0] || null,
    activity,
    upcoming_milestones: upcomingMilestones,
    unread_messages: allMessages.filter(m => m.sender !== 'client' && !m.read_at).length || 0,
  }
}

export async function listClientDeals(clientId) {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function listClientInvoices(clientId) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function listClientDocuments(clientId) {
  const { data, error } = await supabase
    .from('portal_documents')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createClientDocument({ client_id, uploaded_by, title, description, file_url, file_type, file_size }) {
  const { data, error } = await supabase.from('portal_documents').insert({
    client_id, uploaded_by, title, description, file_url, file_type: file_type || 'other', file_size: file_size || 0,
  }).select().single()

  if (error) throw error

  const { data: client } = await supabase.from('clients').select('name, email').eq('id', client_id).maybeSingle()
  if (client && uploaded_by === 'team') {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;"><div style="max-width:480px;margin:0 auto;background:#fff;"><div style="background:#000;padding:28px;text-align:center;"><p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#a1a1aa;">FLODON</p><h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:#fff;">New Document Shared</h1></div><div style="padding:28px;color:#18181b;font-size:14px;line-height:1.6;"><p>Hi ${client.name},</p><p>A new document has been shared with you: <strong>${title}</strong></p>${description ? `<p>${description}</p>` : ''}<div style="text-align:center;margin:24px 0;"><a href="${PORTAL_BASE}/portal" style="display:inline-block;background:#000;color:#fff;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none;">View in Portal</a></div></div></div></body></html>`
    await sendEmail({ to: client.email, subject: `New Document: ${title}`, html }).catch(() => {})
  }

  log(`[Portal] Document "${title}" uploaded by ${uploaded_by}`, 'ok')
  return data
}

export async function listClientMessages(clientId) {
  const { data, error } = await supabase
    .from('portal_messages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function sendClientMessage({ client_id, sender, sender_name, content, thread_id }) {
  const { data, error } = await supabase.from('portal_messages').insert({
    client_id, sender, sender_name: sender_name || null, content, thread_id: thread_id || null,
  }).select().single()

  if (error) throw error

  if (sender === 'client') {
    const { data: client } = await supabase.from('clients').select('name, email').eq('id', client_id).maybeSingle()
    const clientName = client?.name || 'A client'
    log(`[Portal] Message from ${clientName}: ${content.substring(0, 100)}`, 'ok')
  }

  return data
}

export async function replyToClientMessage({ client_id, content, sender_name }) {
  return sendClientMessage({ client_id, sender: 'team', sender_name, content })
}

export async function listPortalClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, company_name, phone, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
