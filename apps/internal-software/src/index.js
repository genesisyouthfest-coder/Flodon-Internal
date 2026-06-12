import { Client, GatewayIntentBits, Collection } from 'discord.js'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, join } from 'path'
import { readdirSync, readFileSync } from 'fs'
import http from 'http'
import {
  supabase, CHANNELS, ROLES, buildWebLeadEmbed, buildWebhookCancelEmbed,
  updateWarRoom, log, handleWebhookEmails, handleWebhookDBUpdates,
  clearEmailConfigCache, processEmailQueue, ADMIN_PROFILE_ID,

  generateForecast, calculatePipelineVelocity, getRevenueSnapshot,
  recalculateAllLeadScores, calculateChurnRisk,
  calculateLeadScore, scanAllChurnRisks,

  processNurtureQueue, createNurtureSequence, listNurtureSequences,
  subscribeToNurture, unsubscribeFromNurture, getClientNurtureStatus,

  createStripeCustomer, createSubscription, cancelSubscription,
  handleStripeWebhook, listInvoices, getStripeCustomer, isStripeConfigured,

  createAffiliate, trackReferral, convertReferral, payoutAffiliate,
  listAffiliates, listReferrals,

  runAnomalyDetection, getAnomalies, acknowledgeAnomaly,

  generateWeeklyDigest,

  createApiKey, listApiKeys, revokeApiKey, validateApiKey,

  createRateLimitMiddleware,

  listArticles, getArticle, getArticleBySlug,
  createArticle, updateArticle, deleteArticle,
  listCategories, createCategory, updateCategory, deleteCategory,

  requestMagicLink, verifyMagicLink, getPortalSession,
  getPortalDashboard, listClientDeals, listClientInvoices,
  listClientDocuments, createClientDocument,
  listClientMessages, sendClientMessage, replyToClientMessage,
  listPortalClients,

  listProjects, getProject, createProject, updateProject, deleteProject,
  listMilestones, createMilestone, updateMilestone, deleteMilestone,
  getClientProjects, getClientProject,

  listTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry,
  startTimer, pauseTimer, resumeTimer, stopTimer,
  getActiveTimer, listActiveTimers,
  getTimeReport, getWeeklyReport,
} from '@flodon/core'

import { getDashboardHTML } from './dashboard.js'
import { getCRMHTML } from './crmUI.js'
import { getPortalHTML } from './portalUI.js'
import { handleCRMRequest } from './crm.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const crmClientJs = readFileSync(join(__dirname, 'crmClient.js'), 'utf8')
const PORT = process.env.API_PORT || 10011

const tagRole = (roleId) => roleId.startsWith('<@&') ? roleId : `<@&${roleId}>`

async function readBody(req) {
  let body = ''
  for await (const chunk of req) body += chunk
  return body
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
  return true
}

function getBody(req) {
  return readBody(req).then(b => { try { return JSON.parse(b) } catch { return null } })
}

const apiLimiter = createRateLimitMiddleware({
  windowMs: 60000, max: 200, name: 'api',
  keyExtractor: (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
})

async function handleCompanyOSRoutes(req, res, url, method, body) {
  const { pathname } = parseUrl(url)

  try {
    // ─── Revenue Intelligence ───
    if (method === 'GET' && pathname === '/api/revenue/pipeline-velocity') {
      const data = await calculatePipelineVelocity()
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && pathname === '/api/revenue/snapshot') {
      const data = await getRevenueSnapshot()
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/revenue/forecast') {
      const data = await generateForecast()
      return json(res, 200, { success: true, data })
    }

    // ─── Lead Scoring ───
    if (method === 'POST' && pathname.startsWith('/api/leads/') && pathname.endsWith('/score')) {
      const id = pathname.split('/')[3]
      const data = await calculateLeadScore(id)
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/leads/rescore-all') {
      const data = await recalculateAllLeadScores()
      return json(res, 200, { success: true, data })
    }

    // ─── Churn Risk ───
    if (method === 'POST' && pathname.startsWith('/api/clients/') && pathname.endsWith('/churn-risk')) {
      const id = pathname.split('/')[3]
      const data = await calculateChurnRisk(id)
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/clients/scan-churn-risks') {
      const data = await scanAllChurnRisks()
      return json(res, 200, { success: true, data })
    }

    // ─── Nurture Sequences ───
    if (method === 'GET' && pathname === '/api/nurture/sequences') {
      const data = await listNurtureSequences()
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/nurture/sequences') {
      const data = await createNurtureSequence(body)
      return json(res, 201, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/nurture/subscribe') {
      const data = await subscribeToNurture(body.client_id, body.sequence_id)
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/nurture/unsubscribe') {
      const data = await unsubscribeFromNurture(body.client_id, body.sequence_id)
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && pathname.startsWith('/api/nurture/client/')) {
      const clientId = pathname.split('/')[4]
      const data = await getClientNurtureStatus(clientId)
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/nurture/process') {
      const data = await processNurtureQueue()
      return json(res, 200, { success: true, data })
    }

    // ─── Stripe Billing ───
    if (method === 'POST' && pathname === '/api/billing/create-customer') {
      const data = await createStripeCustomer(body)
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/billing/create-subscription') {
      const data = await createSubscription(body)
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/billing/cancel-subscription') {
      const data = await cancelSubscription(body.subscription_id)
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && pathname === '/api/billing/config') {
      return json(res, 200, { success: true, data: { configured: isStripeConfigured() } })
    }

    if (method === 'GET' && pathname.startsWith('/api/billing/invoices')) {
      const params = parseUrl(url).query
      const data = await listInvoices(params.get('client_id'))
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && pathname.startsWith('/api/billing/customer/')) {
      const clientId = pathname.split('/')[4]
      const data = await getStripeCustomer(clientId)
      return json(res, 200, { success: true, data })
    }

    // ─── Stripe Webhook ───
    if (method === 'POST' && pathname === '/api/billing/webhook') {
      const rawBody = await readBody(req)
      const signature = req.headers['stripe-signature'] || ''
      const data = await handleStripeWebhook(rawBody, signature)
      return json(res, 200, { success: true, data })
    }

    // ─── Affiliates ───
    if (method === 'GET' && pathname === '/api/affiliates') {
      const data = await listAffiliates()
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/affiliates') {
      const data = await createAffiliate(body)
      return json(res, 201, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/affiliates/track') {
      const data = await trackReferral(body.referral_code, body.client_id)
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/affiliates/convert') {
      const data = await convertReferral(body.deal_id)
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/affiliates/payout') {
      const data = await payoutAffiliate(body.affiliate_id, body.amount)
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && pathname.startsWith('/api/affiliates/') && pathname.endsWith('/referrals')) {
      const affId = pathname.split('/')[3]
      const data = await listReferrals(affId)
      return json(res, 200, { success: true, data })
    }

    // ─── Anomaly Detection ───
    if (method === 'GET' && pathname === '/api/anomalies') {
      const params = parseUrl(url).query
      const data = await getAnomalies(parseInt(params.get('limit') || '20'))
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/anomalies/run') {
      const data = await runAnomalyDetection()
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname.startsWith('/api/anomalies/') && pathname.endsWith('/acknowledge')) {
      const id = pathname.split('/')[3]
      const data = await acknowledgeAnomaly(id, body.profile_id || ADMIN_PROFILE_ID)
      return json(res, 200, { success: true, data })
    }

    // ─── Reporting ───
    if (method === 'POST' && pathname === '/api/reports/weekly-digest') {
      const data = await generateWeeklyDigest()
      return json(res, 200, { success: true, data })
    }

    // ─── API Keys ───
    if (method === 'GET' && pathname === '/api/api-keys') {
      const data = await listApiKeys()
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/api-keys') {
      const data = await createApiKey(body)
      return json(res, 201, { success: true, data })
    }

    if (method === 'DELETE' && pathname.startsWith('/api/api-keys/')) {
      const id = pathname.split('/')[3]
      const data = await revokeApiKey(id)
      return json(res, 200, { success: true, data })
    }

    // ─── Knowledge Base ───
    if (method === 'GET' && pathname === '/api/kb/articles') {
      const params = parseUrl(url).query
      const data = await listArticles({
        type: params.get('type'), category_id: params.get('category_id'),
        search: params.get('search'), status: params.get('status'),
        tags: params.get('tags') ? params.get('tags').split(',') : undefined,
        page: parseInt(params.get('page') || '1'),
        limit: parseInt(params.get('limit') || '50'),
      })
      return json(res, 200, { success: true, ...data })
    }

    if (method === 'GET' && pathname.startsWith('/api/kb/articles/')) {
      const id = pathname.split('/')[4]
      const data = await getArticle(id)
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/kb/articles') {
      const data = await createArticle(body)
      return json(res, 201, { success: true, data })
    }

    if (method === 'PATCH' && pathname.startsWith('/api/kb/articles/')) {
      const id = pathname.split('/')[4]
      const data = await updateArticle(id, body)
      return json(res, 200, { success: true, data })
    }

    if (method === 'DELETE' && pathname.startsWith('/api/kb/articles/')) {
      const id = pathname.split('/')[4]
      const data = await deleteArticle(id)
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && pathname === '/api/kb/categories') {
      const data = await listCategories()
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && pathname === '/api/kb/categories') {
      const data = await createCategory(body)
      return json(res, 201, { success: true, data })
    }

    if (method === 'PATCH' && pathname.startsWith('/api/kb/categories/')) {
      const id = pathname.split('/')[4]
      const data = await updateCategory(id, body)
      return json(res, 200, { success: true, data })
    }

    if (method === 'DELETE' && pathname.startsWith('/api/kb/categories/')) {
      const id = pathname.split('/')[4]
      const data = await deleteCategory(id)
      return json(res, 200, { success: true, data })
    }

    // ─── Time Tracking ───
    if (method === 'GET' && pathname === '/api/time/entries') {
      const params = parseUrl(url).query
      const data = await listTimeEntries({
        team_member: params.get('team_member'), client_id: params.get('client_id'),
        project_id: params.get('project_id'), date_from: params.get('date_from'),
        date_to: params.get('date_to'),
        page: parseInt(params.get('page') || '1'), limit: parseInt(params.get('limit') || '50'),
      })
      return json(res, 200, { success: true, ...data })
    }

    if (method === 'POST' && pathname === '/api/time/entries') {
      const data = await createTimeEntry(body)
      return json(res, 201, { success: true, data })
    }

    if (method === 'PATCH' && pathname.startsWith('/api/time/entries/')) {
      const id = pathname.split('/')[4]
      const data = await updateTimeEntry(id, body)
      return json(res, 200, { success: true, data })
    }

    if (method === 'DELETE' && pathname.startsWith('/api/time/entries/')) {
      const id = pathname.split('/')[4]
      const data = await deleteTimeEntry(id)
      return json(res, 200, { success: true, data })
    }

    // ─── Timers ───
    if (method === 'POST' && pathname === '/api/time/timer/start') {
      const data = await startTimer(body)
      return json(res, 201, { success: true, data })
    }

    if (method === 'POST' && pathname.startsWith('/api/time/timer/')) {
      const parts = pathname.split('/')
      const action = parts[4]
      const id = parts.length > 5 ? parts[5] : body?.id
      if (!id) return json(res, 400, { success: false, error: 'Timer ID required' })
      let data
      if (action === 'pause') data = await pauseTimer(id)
      else if (action === 'resume') data = await resumeTimer(id)
      else if (action === 'stop') data = await stopTimer(id)
      else return false
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && pathname === '/api/time/timer/active') {
      const params = parseUrl(url).query
      const data = params.get('team_member')
        ? await getActiveTimer(params.get('team_member'))
        : await listActiveTimers()
      return json(res, 200, { success: true, data })
    }

    // ─── Time Reports ───
    if (method === 'GET' && pathname === '/api/time/report') {
      const params = parseUrl(url).query
      const data = await getTimeReport({
        team_member: params.get('team_member'), client_id: params.get('client_id'),
        project_id: params.get('project_id'),
        date_from: params.get('date_from'), date_to: params.get('date_to'),
      })
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && pathname === '/api/time/weekly') {
      const params = parseUrl(url).query
      const data = await getWeeklyReport({ week_start: params.get('week_start'), team_member: params.get('team_member') })
      return json(res, 200, { success: true, data })
    }

    return false
  } catch (err) {
    log(`[CompanyOS API] ${pathname}: ${err.message}`, 'error')
    json(res, 500, { success: false, error: err.message })
    return true
  }
}

function parseUrl(url) {
  const [pathname, queryString = ''] = url.split('?')
  return { pathname, query: new URLSearchParams(queryString) }
}

http.createServer(async (req, res) => {
  const { method, url, headers } = req

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (method === 'OPTIONS') { res.writeHead(204); return res.end() }

  // Rate limiting
  const rateResult = apiLimiter(req)
  if (!rateResult.allowed) {
    res.writeHead(429, { 'Retry-After': String(Math.ceil(rateResult.resetIn / 1000)) })
    return res.end('Too Many Requests')
  }

  // Redirect root to CRM
  if (method === 'GET' && (url === '/' || url === '/dashboard')) {
    res.writeHead(302, { Location: '/crm' })
    return res.end()
  }

  // Settings
  if (method === 'GET' && url === '/api/settings') {
    try {
      const { data, error } = await supabase.from('settings').select('key, value').order('key')
      if (error) throw error
      return json(res, 200, { success: true, settings: data })
    } catch (err) {
      log(`[Settings] Fetch error: ${err.message}`, 'error')
      return json(res, 500, { success: false, error: err.message })
    }
  }

  if (method === 'POST' && url === '/api/settings') {
    try {
      const body = await readBody(req)
      const { settings } = JSON.parse(body)
      if (!settings || typeof settings !== 'object') {
        return json(res, 400, { success: false, error: 'Invalid payload' })
      }
      const entries = Object.entries(settings)
      for (const [key, value] of entries) {
        const { error } = await supabase.from('settings').upsert({ key, value: String(value) }, { onConflict: 'key' })
        if (error) throw error
      }
      clearEmailConfigCache()
      log(`[Settings] Updated ${entries.length} setting(s)`)
      return json(res, 200, { success: true, updated: entries.length })
    } catch (err) {
      log(`[Settings] Update error: ${err.message}`, 'error')
      return json(res, 500, { success: false, error: err.message })
    }
  }

  // Test Email
  if (method === 'POST' && url === '/api/test-email') {
    try {
      const body = JSON.parse(await readBody(req))
      const { sendEmail } = await import('@flodon/core')
      clearEmailConfigCache()
      const result = await sendEmail({
        to: body.to || 'sanskarkolekarr@gmail.com',
        subject: 'Flodon Email Test — System Active',
        html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:30px 20px;color:#1c1917;text-align:center;">
          <h2>Email System Active</h2>
          <p>This is a test email from the Flodon Internal Operations Dashboard.</p>
          <p>If you received this, your Gmail SMTP configuration is working correctly.</p>
          <hr style="border:0;border-top:1px solid #e7e5e4;margin:25px 0" />
          <p style="font-size:12px;color:#a8a29e;">Sent at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>`
      })
      return json(res, 200, result)
    } catch (err) {
      log(`[Test Email] Error: ${err.message}`, 'error')
      return json(res, 500, { success: false, error: err.message })
    }
  }

  // Webhooks
  if (method === 'POST' && url.startsWith('/api/webhook/')) {
    const auth = headers['authorization']
    if (auth !== `Bearer ${process.env.CRM_WEBHOOK_TOKEN}`) {
      res.writeHead(401)
      return res.end('Unauthorized')
    }

    try {
      const body = await readBody(req)
      const payload = JSON.parse(body)
      const endpoint = url.split('/').pop()

      let channelId = CHANNELS.calls
      const channel = client.channels.cache.get(channelId) || await client.channels.fetch(channelId).catch(() => null)

      if (channel) {
        let messageOptions = {}
        if (endpoint === 'lead' && payload.name && !payload.embeds) {
          messageOptions = { content: tagRole(ROLES.sales), embeds: [buildWebLeadEmbed(payload)] }
        } else if (endpoint === 'cancel' && payload.name && !payload.embeds) {
          messageOptions = { content: tagRole(ROLES.sales), embeds: [buildWebhookCancelEmbed(payload)] }
        } else {
          messageOptions = { content: payload.content || null, embeds: payload.embeds || [] }
        }

        await channel.send(messageOptions)
        log(`Webhook processed: ${endpoint} -> ${channelId}`)

        handleWebhookDBUpdates(endpoint, payload).catch(err => log(`DB save failed: ${err.message}`, 'error'))
        handleWebhookEmails(endpoint, payload).catch(err => log(`Email trigger failed: ${err.message}`, 'error'))

        res.writeHead(200)
        return res.end('OK')
      } else {
        log(`Channel not found for webhook: ${channelId}`, 'error')
        res.writeHead(500)
        return res.end('Target channel not found')
      }
    } catch (err) {
      log(`Webhook error: ${err.message}`, 'error')
      res.writeHead(400)
      return res.end('Invalid JSON')
    }
  }

  // ─── Client Portal Auth ───
  if (method === 'POST' && url === '/api/portal/auth/request') {
    try {
      const body = await getBody(req)
      const data = await requestMagicLink(body?.email)
      return json(res, 200, { success: true, data })
    } catch (err) {
      return json(res, 400, { success: false, error: err.message })
    }
  }

  // Portal session validation middleware
  async function requirePortalSession(req, res) {
    const auth = req.headers['authorization']
    if (!auth || !auth.startsWith('Bearer ')) {
      json(res, 401, { success: false, error: 'Unauthorized' })
      return null
    }
    const session = await getPortalSession(auth.slice(7))
    if (!session) {
      json(res, 401, { success: false, error: 'Invalid or expired session' })
      return null
    }
    return session
  }

  if (url.startsWith('/api/portal/') && method !== 'POST' && url !== '/api/portal/auth/request') {
    const session = await requirePortalSession(req, res)
    if (!session) return
    const clientId = session.client_id

    if (method === 'GET' && url === '/api/portal/me') {
      return json(res, 200, { success: true, data: session.client })
    }

    if (method === 'GET' && url === '/api/portal/dashboard') {
      const data = await getPortalDashboard(clientId)
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && url === '/api/portal/projects') {
      const data = await getClientProjects(clientId)
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && url.startsWith('/api/portal/projects/')) {
      const projectId = url.split('/')[4]
      const data = await getClientProject(projectId, clientId)
      return data ? json(res, 200, { success: true, data }) : json(res, 404, { success: false, error: 'Not found' })
    }

    if (method === 'GET' && url === '/api/portal/deals') {
      const data = await listClientDeals(clientId)
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && url === '/api/portal/invoices') {
      const data = await listClientInvoices(clientId)
      return json(res, 200, { success: true, data })
    }

    if (method === 'GET' && url === '/api/portal/documents') {
      const data = await listClientDocuments(clientId)
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && url === '/api/portal/documents') {
      const body = await getBody(req)
      const data = await createClientDocument({ ...body, client_id: clientId, uploaded_by: 'client' })
      return json(res, 201, { success: true, data })
    }

    if (method === 'GET' && url === '/api/portal/messages') {
      const data = await listClientMessages(clientId)
      return json(res, 200, { success: true, data })
    }

    if (method === 'POST' && url === '/api/portal/messages') {
      const body = await getBody(req)
      const data = await sendClientMessage({ ...body, client_id: clientId, sender: 'client', sender_name: body?.sender_name || session.client?.name })
      return json(res, 201, { success: true, data })
    }

    return json(res, 404, { success: false, error: 'Not found' })
  }

  // Company OS API routes
  if (url.startsWith('/api/')) {
    const body = method !== 'GET' ? await getBody(req) : null
    const handled = await handleCompanyOSRoutes(req, res, url, method, body)
    if (handled) return
  }

  // CRM API routes
  if (url.startsWith('/crm/api/')) {
    const body = method !== 'GET' ? await getBody(req) : null
    const handled = await handleCRMRequest(req, res, url, method, body)
    if (handled) return
  }

  // CRM static assets
  if (method === 'GET' && url === '/crm/client.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache' })
    return res.end(crmClientJs)
  }

  // CRM Dashboard Pages
  if (method === 'GET' && url.startsWith('/crm')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    return res.end(getCRMHTML(url))
  }

  // ─── Client Portal Pages ───
  if (method === 'GET' && url === '/portal/auth') {
    try {
      const params = new URLSearchParams(url.split('?')[1] || '')
      const token = params.get('token')
      if (!token) throw new Error('Missing token')
      const result = await verifyMagicLink(token)
      const portalHtml = getPortalHTML(result.session_token)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      return res.end(portalHtml)
    } catch (err) {
      log(`[Portal] Auth error: ${err.message}`, 'error')
      res.writeHead(302, { Location: '/portal?error=' + encodeURIComponent(err.message) })
      return res.end()
    }
  }

  if (method === 'GET' && url.startsWith('/portal')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    return res.end(getPortalHTML())
  }

  res.writeHead(404)
  res.end('Not Found')
}).listen(PORT, () => {
  log(`Server listening on port ${PORT} (Dashboard + Webhooks + API)`)

  const pingUrls = (process.env.KEEPALIVE_URLS || '').split(',').map(url => url.trim()).filter(Boolean)

  if (pingUrls.length > 0) {
    setTimeout(() => {
      pingUrls.forEach(async (url) => {
        try {
          const res = await fetch(url)
          log(`[Keep-Alive] Initial ping to ${url} - Status: ${res.status}`)
        } catch (err) {
          log(`[Keep-Alive] Initial ping to ${url} failed: ${err.message}`, 'error')
        }
      })
    }, 30000)

    setInterval(() => {
      pingUrls.forEach(async (url) => {
        try {
          const res = await fetch(url)
          log(`[Keep-Alive] Periodic ping to ${url} - Status: ${res.status}`)
        } catch (err) {
          log(`[Keep-Alive] Periodic ping to ${url} failed: ${err.message}`, 'error')
        }
      })
    }, 10 * 60 * 1000)
  }

  setInterval(async () => {
    try {
      const result = await processEmailQueue()
      if (result.processed > 0) log(`[Email Queue] Processed ${result.processed} email(s). Sent: ${result.sent}, Failed: ${result.failed}`)
    } catch (err) { log(`[Email Queue] Processor error: ${err.message}`, 'error') }
  }, 60 * 1000)

  setInterval(async () => {
    try { await generateForecast() } catch (err) { log(`[Auto Forecast] Error: ${err.message}`, 'error') }
  }, 6 * 60 * 60 * 1000)

  setInterval(async () => {
    try {
      const result = await processNurtureQueue()
      if (result.processed > 0) log(`[Nurture] Processed ${result.processed} step(s)`, 'ok')
    } catch (err) { log(`[Nurture] Queue error: ${err.message}`, 'error') }
  }, 15 * 60 * 1000)

  setInterval(async () => {
    try {
      const result = await runAnomalyDetection()
      if (result.detected > 0) log(`[Anomaly] Auto-detected ${result.detected} anomaly(ies)`, 'ok')
    } catch (err) { log(`[Anomaly] Auto-detect error: ${err.message}`, 'error') }
  }, 60 * 60 * 1000)

  log('[Email Queue] Processor active — checking every 60s')
  log('[Auto Forecast] Running every 6 hours')
  log('[Nurture Queue] Processing every 15 minutes')
  log('[Anomaly Detection] Scanning every 60 minutes')
})

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
})

client.commands = new Collection()
const commandsPath = join(__dirname, 'commands')
const commandFiles = readdirSync(commandsPath).filter(f => f.endsWith('.js'))

for (const file of commandFiles) {
  const command = await import(pathToFileURL(join(commandsPath, file)).href)
  client.commands.set(command.default.data.name, command.default)
  log(`Loaded command: /${command.default.data.name}`)
}

const eventsPath = join(__dirname, 'events')
const eventFiles = readdirSync(eventsPath).filter(f => f.endsWith('.js'))

for (const file of eventFiles) {
  const event = await import(pathToFileURL(join(eventsPath, file)).href)
  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args, client))
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args, client))
  }
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return

  const command = client.commands.get(interaction.commandName)
  if (!command) return

  try {
    await command.execute(interaction, client)
  } catch (error) {
    log(`Error executing /${interaction.commandName}: ${error.message}`, 'error')
    if (error.code === 40060 || error.message.includes('Unknown interaction')) return
    const msg = { content: 'Something went wrong executing this command.', flags: 64 }
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg)
      } else {
        await interaction.reply(msg)
      }
    } catch (e) { log(`Could not send error message to user: ${e.message}`, 'error') }
  }
})

client.once('ready', () => {
  log(`Logged in as ${client.user.tag}!`)
})

client.login(process.env.DISCORD_TOKEN)
