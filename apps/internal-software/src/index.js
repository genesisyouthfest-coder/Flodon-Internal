// ─────────────────────────────────────────────
//  Flodon Internal Operations — Main Entry Point
// ─────────────────────────────────────────────
import { Client, GatewayIntentBits, Collection } from 'discord.js'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, join } from 'path'
import { readdirSync } from 'fs'
import http from 'http'
import { supabase, CHANNELS, ROLES, buildWebLeadEmbed, buildWebhookCancelEmbed, updateWarRoom, log, handleWebhookEmails, clearEmailConfigCache, processEmailQueue } from '@flodon/core'
import { getDashboardHTML } from './dashboard.js'
import { getCRMHTML } from './crmUI.js'
import { handleCRMRequest } from './crm.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.API_PORT || 10001

// Helper to format Role Pings
const tagRole = (roleId) => roleId.startsWith('<@&') ? roleId : `<@&${roleId}>`

// Helper: read JSON body from request
async function readBody(req) {
  let body = ''
  for await (const chunk of req) body += chunk
  return body
}

http.createServer(async (req, res) => {
  const { method, url, headers } = req

  // ─── CORS Headers (for dashboard fetch calls) ───
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (method === 'OPTIONS') { res.writeHead(204); return res.end() }

  // ─── 1. Dashboard (Landing Page) ───
  if (method === 'GET' && (url === '/' || url === '/dashboard')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    return res.end(getDashboardHTML())
  }

  // ─── 2. GET /api/settings — Fetch all settings ───
  if (method === 'GET' && url === '/api/settings') {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value, updated_at')
        .order('key')
      if (error) throw error
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ success: true, settings: data }))
    } catch (err) {
      log(`[Settings] Fetch error: ${err.message}`, 'error')
      res.writeHead(500, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ success: false, error: err.message }))
    }
  }

  // ─── 3. POST /api/settings — Update settings ───
  if (method === 'POST' && url === '/api/settings') {
    try {
      const body = await readBody(req)
      const { settings } = JSON.parse(body)

      if (!settings || typeof settings !== 'object') {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ success: false, error: 'Invalid payload' }))
      }

      // Upsert each key-value pair
      const entries = Object.entries(settings)
      for (const [key, value] of entries) {
        const { error } = await supabase
          .from('settings')
          .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })
        if (error) throw error
      }

      // Bust the email config cache so changes take effect immediately
      clearEmailConfigCache()

      log(`[Settings] Updated ${entries.length} setting(s): [${entries.map(e => e[0]).join(', ')}]`)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ success: true, updated: entries.length }))
    } catch (err) {
      log(`[Settings] Update error: ${err.message}`, 'error')
      res.writeHead(500, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ success: false, error: err.message }))
    }
  }

  // ─── 4. POST /api/test-email — Send a test email ───
  if (method === 'POST' && url === '/api/test-email') {
    try {
      const body = await readBody(req)
      const { to } = JSON.parse(body)
      const { sendEmail } = await import('@flodon/core')

      // Bust cache to use latest settings
      clearEmailConfigCache()

      const result = await sendEmail({
        to: to || 'sanskarkolekarr@gmail.com',
        subject: '✅ Flodon Email Test — System Active',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px 20px; color: #1c1917; text-align: center;">
            <h2 style="font-size: 22px; font-weight: 700; color: #0c0a09; margin-bottom: 15px;">✅ Email System Active</h2>
            <p style="font-size: 16px; color: #44403c; margin-bottom: 25px;">This is a test email from the Flodon Internal Operations Dashboard.</p>
            <p style="font-size: 14px; color: #78716c;">If you received this, your Gmail SMTP configuration is working correctly.</p>
            <hr style="border: 0; border-top: 1px solid #e7e5e4; margin: 25px 0;" />
            <p style="font-size: 12px; color: #a8a29e;">Sent at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
          </div>
        `
      })

      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify(result))
    } catch (err) {
      log(`[Test Email] Error: ${err.message}`, 'error')
      res.writeHead(500, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ success: false, error: err.message }))
    }
  }

  // ─── 5. Webhook Handling ───
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
        } 
        else if (endpoint === 'cancel' && payload.name && !payload.embeds) {
          messageOptions = { content: tagRole(ROLES.sales), embeds: [buildWebhookCancelEmbed(payload)] }
        }
        else {
          messageOptions = { content: payload.content || null, embeds: payload.embeds || [] }
        }

        await channel.send(messageOptions)
        log(`Webhook processed: ${endpoint} -> ${channelId}`)

        // Trigger emails in the background (non-blocking)
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

  // ─── CRM Routes ───
  if (url.startsWith('/crm/api/')) {
    const body = method !== 'GET' ? JSON.parse(await readBody(req)) : null
    const handled = await handleCRMRequest(req, res, url, method, body)
    if (handled) return
  }

  // ─── CRM Dashboard Pages ───
  if (method === 'GET' && url.startsWith('/crm')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    return res.end(getCRMHTML(url))
  }

  // 404
  res.writeHead(404)
  res.end('Not Found')
}).listen(PORT, () => {
  log(`Server listening on port ${PORT} (Dashboard + Webhooks + API)`)

  // ─── Keep-Alive / Anti-Spin Down Mechanism ────
  const pingUrls = (process.env.KEEPALIVE_URLS || '')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean)

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
    
    log(`[Keep-Alive] Active: Monitoring URLs [${pingUrls.join(', ')}] every 10 minutes`)
  }

  // ─── Email Queue Processor ───
  setInterval(async () => {
    try {
      const result = await processEmailQueue()
      if (result.processed > 0) {
        log(`[Email Queue] Processed ${result.processed} email(s). Sent: ${result.sent}, Failed: ${result.failed}`)
      }
    } catch (err) {
      log(`[Email Queue] Processor error: ${err.message}`, 'error')
    }
  }, 60 * 1000) // runs every 60 seconds

  log('[Email Queue] Processor active — checking every 60s')
})

// ─── Discord Client ───────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
})

// ─── Load Commands ────────────────────────────
client.commands = new Collection()
const commandsPath = join(__dirname, 'commands')
const commandFiles = readdirSync(commandsPath).filter(f => f.endsWith('.js'))

for (const file of commandFiles) {
  const command = await import(pathToFileURL(join(commandsPath, file)).href)
  client.commands.set(command.default.data.name, command.default)
  log(`Loaded command: /${command.default.data.name}`)
}

// ─── Load Events ─────────────────────────────
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

// ─── Handle Slash Commands ────────────────────
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return

  const command = client.commands.get(interaction.commandName)
  if (!command) return

  try {
    await command.execute(interaction, client)
  } catch (error) {
    log(`Error executing /${interaction.commandName}: ${error.message}`, 'error')
    
    // Don't try to reply if the interaction is already dead or unknown
    if (error.code === 40060 || error.message.includes('Unknown interaction')) return

    const msg = { content: '❌ Something went wrong executing this command.', flags: 64 }
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg)
      } else {
        await interaction.reply(msg)
      }
    } catch (e) {
      log(`Could not send error message to user: ${e.message}`, 'error')
    }
  }
})

client.once('clientReady', () => {
  log(`Logged in as ${client.user.tag}!`)
})

// ─── Login ────────────────────────────────────
client.login(process.env.DISCORD_TOKEN)
