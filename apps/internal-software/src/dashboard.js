// ─────────────────────────────────────────────
//  Flodon Dashboard — Premium Settings UI
// ─────────────────────────────────────────────

export function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flodon — Internal Operations Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #09090b;
      color: #fafaf9;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    /* ─── Layout ─── */
    .container { max-width: 720px; margin: 0 auto; padding: 40px 20px 80px; }

    /* ─── Header ─── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 48px;
      padding-bottom: 24px;
      border-bottom: 1px solid #27272a;
    }
    .header-left h1 {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.04em;
      color: #fafaf9;
    }
    .header-left p {
      font-size: 14px;
      color: #71717a;
      margin-top: 4px;
    }
    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #18181b;
      border: 1px solid #27272a;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      color: #a1a1aa;
      font-weight: 500;
    }
    .status-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #22c55e;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* ─── Cards ─── */
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 28px;
      margin-bottom: 24px;
      transition: border-color 0.2s;
    }
    .card:hover { border-color: #3f3f46; }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: #fafaf9;
      margin-bottom: 6px;
      letter-spacing: -0.02em;
    }
    .card-desc {
      font-size: 13px;
      color: #71717a;
      margin-bottom: 24px;
      line-height: 1.5;
    }

    /* ─── Form Fields ─── */
    .field { margin-bottom: 20px; }
    .field:last-child { margin-bottom: 0; }
    .field label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #a1a1aa;
      margin-bottom: 8px;
      letter-spacing: 0.02em;
    }
    .field input {
      width: 100%;
      padding: 12px 14px;
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 8px;
      color: #fafaf9;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }
    .field input:focus {
      border-color: #a78bfa;
      box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.15);
    }
    .field input::placeholder { color: #52525b; }
    .field .hint {
      font-size: 12px;
      color: #52525b;
      margin-top: 6px;
    }

    /* ─── Buttons ─── */
    .btn-row { display: flex; gap: 12px; margin-top: 28px; }
    .btn {
      padding: 11px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-primary {
      background: #fafaf9;
      color: #09090b;
    }
    .btn-primary:hover { background: #e4e4e7; transform: translateY(-1px); }
    .btn-primary:active { transform: translateY(0); }
    .btn-secondary {
      background: transparent;
      color: #a1a1aa;
      border: 1px solid #27272a;
    }
    .btn-secondary:hover { border-color: #3f3f46; color: #fafaf9; }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    /* ─── Toast ─── */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 14px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      display: none;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      max-width: 360px;
    }
    .toast.success { background: #166534; color: #dcfce7; border: 1px solid #22c55e; }
    .toast.error { background: #7f1d1d; color: #fecaca; border: 1px solid #ef4444; }
    .toast.show { display: block; }
    @keyframes slideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* ─── Quick Links ─── */
    .links {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }
    .link-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 18px 20px;
      text-decoration: none;
      color: #fafaf9;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .link-card:hover {
      border-color: #a78bfa;
      background: #1c1c22;
      transform: translateY(-2px);
    }
    .link-icon { font-size: 22px; }
    .link-text { font-size: 14px; font-weight: 600; }
    .link-sub { font-size: 12px; color: #71717a; font-weight: 400; }

    /* ─── Loader ─── */
    .skeleton {
      background: linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
      height: 42px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ─── Config Source Badge ─── */
    .source-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .source-badge.db { background: #1e3a5f; color: #93c5fd; }
    .source-badge.env { background: #3b2f0a; color: #fbbf24; }

    @media (max-width: 600px) {
      .links { grid-template-columns: 1fr; }
      .header { flex-direction: column; align-items: flex-start; gap: 16px; }
      .btn-row { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <h1>FLODON</h1>
        <p>Internal Operations Dashboard</p>
      </div>
      <div class="status-badge">
        <div class="status-dot"></div>
        System Online
      </div>
    </div>

    <!-- Quick Links -->
    <div class="links">
      <a href="https://flodon.in/ops" target="_blank" class="link-card">
        <span class="link-icon">💼</span>
        <div>
          <div class="link-text">Ops Portal</div>
          <div class="link-sub">flodon.in/ops</div>
        </div>
      </a>
      <a href="https://flodon.in/book-a-call" target="_blank" class="link-card">
        <span class="link-icon">📞</span>
        <div>
          <div class="link-text">Booking Page</div>
          <div class="link-sub">flodon.in/book-a-call</div>
        </div>
      </a>
      <a href="https://flodon-discord-bot.onrender.com" target="_blank" class="link-card">
        <span class="link-icon">🤖</span>
        <div>
          <div class="link-text">Discord Bot</div>
          <div class="link-sub">Bot Health Check</div>
        </div>
      </a>
      <a href="https://ulnjqrkdwheqskbcdxxj.supabase.co" target="_blank" class="link-card">
        <span class="link-icon">🗄️</span>
        <div>
          <div class="link-text">Supabase</div>
          <div class="link-sub">Database Console</div>
        </div>
      </a>
    </div>

    <!-- Email Settings Card -->
    <div class="card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
        <h2 class="card-title">📧 Email Configuration</h2>
        <span id="config-source" class="source-badge db">Loading...</span>
      </div>
      <p class="card-desc">Configure Gmail SMTP credentials used for booking confirmations and admin alerts. Changes save directly to the database and take effect immediately.</p>
      
      <form id="settings-form">
        <div class="field">
          <label>Gmail Address</label>
          <input type="email" id="gmail_user" placeholder="yourname@gmail.com" />
          <div class="hint">The Gmail account emails will be sent from.</div>
        </div>
        <div class="field">
          <label>App Password</label>
          <input type="password" id="gmail_app_password" placeholder="xxxx xxxx xxxx xxxx" />
          <div class="hint">Generate one at <a href="https://myaccount.google.com/apppasswords" target="_blank" style="color: #a78bfa; text-decoration: none;">myaccount.google.com/apppasswords</a> (requires 2FA).</div>
        </div>
        <div class="field">
          <label>Sender Display Name</label>
          <input type="text" id="gmail_from_name" placeholder="Flodon Operations" />
          <div class="hint">The name recipients see in their inbox.</div>
        </div>
        <div class="field">
          <label>Admin Notification Email</label>
          <input type="email" id="admin_email" placeholder="admin@gmail.com" />
          <div class="hint">Where admin alerts (new leads, cancellations) are delivered.</div>
        </div>

        <div class="btn-row">
          <button type="submit" class="btn btn-primary" id="save-btn">
            <span id="save-text">Save Settings</span>
          </button>
          <button type="button" class="btn btn-secondary" id="test-btn" onclick="sendTestEmail()">
            Send Test Email
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Toast -->
  <div class="toast" id="toast"></div>

  <script>
    const API_BASE = window.location.origin

    // ─── Load Settings ───
    async function loadSettings() {
      try {
        const res = await fetch(API_BASE + '/api/settings')
        const data = await res.json()
        if (data.success && data.settings) {
          const map = {}
          data.settings.forEach(s => { map[s.key] = s.value })

          document.getElementById('gmail_user').value = map.gmail_user || ''
          document.getElementById('gmail_app_password').value = map.gmail_app_password || ''
          document.getElementById('gmail_from_name').value = map.gmail_from_name || ''
          document.getElementById('admin_email').value = map.admin_email || ''

          const badge = document.getElementById('config-source')
          if (map.gmail_user && map.gmail_app_password) {
            badge.textContent = '● Database'
            badge.className = 'source-badge db'
          } else {
            badge.textContent = '● Env Fallback'
            badge.className = 'source-badge env'
          }
        }
      } catch (err) {
        showToast('Failed to load settings: ' + err.message, 'error')
        document.getElementById('config-source').textContent = '● Offline'
        document.getElementById('config-source').className = 'source-badge env'
      }
    }

    // ─── Save Settings ───
    document.getElementById('settings-form').addEventListener('submit', async (e) => {
      e.preventDefault()
      const btn = document.getElementById('save-btn')
      const text = document.getElementById('save-text')
      btn.disabled = true
      text.textContent = 'Saving...'

      try {
        const settings = {
          gmail_user: document.getElementById('gmail_user').value.trim(),
          gmail_app_password: document.getElementById('gmail_app_password').value.trim(),
          gmail_from_name: document.getElementById('gmail_from_name').value.trim(),
          admin_email: document.getElementById('admin_email').value.trim(),
        }

        const res = await fetch(API_BASE + '/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings })
        })
        const data = await res.json()

        if (data.success) {
          showToast('Settings saved to database ✓', 'success')
          const badge = document.getElementById('config-source')
          badge.textContent = '● Database'
          badge.className = 'source-badge db'
        } else {
          showToast('Save failed: ' + data.error, 'error')
        }
      } catch (err) {
        showToast('Network error: ' + err.message, 'error')
      } finally {
        btn.disabled = false
        text.textContent = 'Save Settings'
      }
    })

    // ─── Test Email ───
    async function sendTestEmail() {
      const btn = document.getElementById('test-btn')
      btn.disabled = true
      btn.textContent = 'Sending...'

      try {
        const to = document.getElementById('admin_email').value.trim() || document.getElementById('gmail_user').value.trim()
        const res = await fetch(API_BASE + '/api/test-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to })
        })
        const data = await res.json()

        if (data.success) {
          showToast('Test email sent to ' + to + ' ✓', 'success')
        } else {
          showToast('Email failed: ' + data.error, 'error')
        }
      } catch (err) {
        showToast('Network error: ' + err.message, 'error')
      } finally {
        btn.disabled = false
        btn.textContent = 'Send Test Email'
      }
    }

    // ─── Toast ───
    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast')
      toast.textContent = message
      toast.className = 'toast show ' + type
      setTimeout(() => { toast.className = 'toast' }, 4000)
    }

    // ─── Init ───
    loadSettings()
  </script>
</body>
</html>`
}
