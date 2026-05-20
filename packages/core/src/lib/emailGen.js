import { log } from '../utils/logger.js'

let cachedApiKey = null
let cacheExpiry = 0
const CACHE_TTL = 5 * 60 * 1000

async function getAnthropicApiKey() {
  if (cachedApiKey && Date.now() < cacheExpiry) return cachedApiKey

  try {
    const { supabase } = await import('../supabase.js')
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .eq('key', 'anthropic_api_key')
      .maybeSingle()

    if (!error && data?.value) {
      cachedApiKey = data.value
      cacheExpiry = Date.now() + CACHE_TTL
      return cachedApiKey
    }
  } catch (err) {
    log(`[EmailGen] DB key fetch failed: ${err.message}`, 'warning')
  }

  cachedApiKey = process.env.ANTHROPIC_API_KEY || ''
  cacheExpiry = Date.now() + CACHE_TTL
  return cachedApiKey
}

function wrapEmailHtml(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;color:#18181b;line-height:1.65;font-size:15px;">
    ${bodyHtml}
    <p style="margin-top:28px;font-size:13px;color:#71717a;">— Sanskar<br/>FLODON · AI calling agents &amp; automation</p>
  </div>
</body>
</html>`
}

function parseGeneratedEmail(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.subject && parsed.body) {
        const bodyHtml = parsed.body
          .split(/\n\n+/)
          .map(p => `<p style="margin:0 0 14px;">${p.replace(/\n/g, '<br/>')}</p>`)
          .join('')
        return { subject: parsed.subject, html: wrapEmailHtml(bodyHtml) }
      }
    }
  } catch {
    // fall through to plain-text parse
  }

  const lines = text.trim().split('\n')
  const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:'))
  const subject = subjectLine
    ? subjectLine.replace(/^subject:\s*/i, '').trim()
    : 'Quick question about your operations'

  const bodyStart = subjectLine ? lines.indexOf(subjectLine) + 1 : 0
  const body = lines.slice(bodyStart).join('\n').trim()
  const bodyHtml = body
    .split(/\n\n+/)
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 14px;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')

  return { subject, html: wrapEmailHtml(bodyHtml) }
}

const SYSTEM_PROMPT = `You write cold outreach emails for FLODON — AI calling agents and business automation.

Rules:
- Write in first person as "Sanskar at FLODON"
- Tone: direct, intelligent, no fluff, no generic AI-agency language
- Reference the prospect's company, role, and industry naturally
- Max 150 words in the email body (not counting sign-off)
- No hype, no "I hope this finds you well", no bullet-point feature dumps
- One clear, low-friction CTA (reply or short call)

Respond with ONLY valid JSON (no markdown fences):
{"subject":"...","body":"plain text paragraphs separated by blank lines"}`

/**
 * Generates a personalised outreach email via Claude.
 */
export async function generateOutreachEmail({ name, company, role, industry, notes }) {
  const apiKey = await getAnthropicApiKey()
  if (!apiKey) throw new Error('Anthropic API key not configured')

  const userPrompt = `Write a cold outreach email for:
- Name: ${name || 'there'}
- Company: ${company || 'their company'}
- Role: ${role || 'decision maker'}
- Industry: ${industry || 'general'}
- Notes: ${notes || 'none'}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Anthropic API error (${res.status}): ${errBody}`)
  }

  const data = await res.json()
  const text = data.content?.find(b => b.type === 'text')?.text || ''
  if (!text) throw new Error('Empty response from Anthropic')

  return parseGeneratedEmail(text)
}
