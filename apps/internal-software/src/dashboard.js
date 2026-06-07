export function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flodon — Internal Operations</title>
  <style>
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;min-height:100vh;-webkit-font-smoothing:antialiased;font-size:16px}
    .container{max-width:840px;margin:0 auto;padding:32px 20px 80px}
    .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:40px;padding-bottom:20px;border-bottom:1px solid #1a1a1a}
    .header-left h1{font-size:26px;font-weight:700;color:#fff;letter-spacing:-0.02em}
    .header-left p{font-size:14px;color:#666;margin-top:2px}
    .status{display:flex;align-items:center;gap:8px;font-size:13px;color:#888;font-weight:500}
    .status-dot{width:8px;height:8px;border-radius:50%;background:#00f0ff;box-shadow:0 0 8px rgba(0,240,255,0.4)}
    .links{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:28px}
    .link-card{background:#0a0a0a;border:1px solid #1a1a1a;padding:18px;text-decoration:none;color:#fff;transition:border-color 0.15s;display:flex;align-items:center;gap:14px}
    .link-card:hover{border-color:#00f0ff}
    .link-icon{font-size:22px;width:28px;text-align:center}
    .link-text{font-size:15px;font-weight:600}
    .link-sub{font-size:13px;color:#666}
    .card{background:#0a0a0a;border:1px solid #1a1a1a;padding:28px;margin-bottom:20px}
    .card-title{font-size:16px;font-weight:700;color:#fff;margin-bottom:4px}
    .card-desc{font-size:14px;color:#666;margin-bottom:20px;line-height:1.5}
    .card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
    .source-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em}
    .field{margin-bottom:18px}
    .field:last-child{margin-bottom:0}
    .field label{display:block;font-size:13px;font-weight:600;color:#888;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em}
    .field input{width:100%;padding:12px 14px;background:#000;border:1px solid #1a1a1a;color:#fff;font-size:14px;font-family:inherit;outline:none;transition:border-color 0.15s}
    .field input:focus{border-color:#00f0ff}
    .field input::placeholder{color:#444}
    .field .hint{font-size:12px;color:#555;margin-top:4px}
    .btn-row{display:flex;gap:10px;margin-top:24px}
    .btn{padding:12px 20px;border:none;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;transition:all 0.15s;display:inline-flex;align-items:center;gap:6px}
    .btn-primary:hover{background:#e0e0e0}
    .btn-secondary{background:transparent;color:#888;border:1px solid #1a1a1a}
    .btn-secondary:hover{border-color:#333;color:#fff}
    .toast{position:fixed;bottom:24px;right:24px;padding:14px 18px;font-size:14px;font-weight:500;display:none;z-index:1000;animation:fadeIn 0.2s ease;max-width:360px;border:1px solid}
    .toast.success{background:#0a1a0a;color:#00f0ff;border-color:rgba(0,240,255,0.2)}
    .toast.error{background:#1a0a0a;color:#ff4444;border-color:rgba(255,68,68,0.2)}
    .toast.show{display:block}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .skeleton{background:#0a0a0a;height:42px;border:1px solid #1a1a1a}
    @media(max-width:600px){.links{grid-template-columns:1fr}.header{flex-direction:column;align-items:flex-start;gap:12px}.btn-row{flex-direction:column}}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <h1>FLODON</h1>
        <p>Internal Operations</p>
      </div>
      <div class="status">
        <div class="status-dot"></div>
        System Online
      </div>
    </div>

    <div class="links">
      <a href="https://flodon.in/ops" target="_blank" class="link-card">
        <span class="link-icon">B</span>
        <div>
          <div class="link-text">Ops Portal</div>
          <div class="link-sub">flodon.in/ops</div>
        </div>
      </a>
      <a href="https://flodon.in/book-a-call" target="_blank" class="link-card">
        <span class="link-icon">C</span>
        <div>
          <div class="link-text">Booking Page</div>
          <div class="link-sub">flodon.in/book-a-call</div>
        </div>
      </a>
      <a href="/crm" class="link-card">
        <span class="link-icon">D</span>
        <div>
          <div class="link-text">Sales CRM</div>
          <div class="link-sub">Pipeline & Clients</div>
        </div>
      </a>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Email Configuration</h2>
        <span id="config-source" class="source-badge db">Loading...</span>
      </div>
      <p class="card-desc">Gmail SMTP credentials for booking confirmations and alerts.</p>
      <form id="settings-form">
        <div class="field">
          <label>Gmail Address</label>
          <input type="email" id="gmail_user" placeholder="yourname@gmail.com" />
        </div>
        <div class="field">
          <label>App Password</label>
          <input type="password" id="gmail_app_password" placeholder="xxxx xxxx xxxx xxxx" />
          <div class="hint">Generate at <a href="https://myaccount.google.com/apppasswords" target="_blank">google.com/apppasswords</a> (requires 2FA).</div>
        </div>
        <div class="field">
          <label>Sender Name</label>
          <input type="text" id="gmail_from_name" placeholder="Flodon Operations" />
        </div>
        <div class="field">
          <label>Admin Email</label>
          <input type="email" id="admin_email" placeholder="admin@gmail.com" />
          <div class="hint">Where lead alerts and weekly digests go.</div>
        </div>
        <div class="btn-row">
          <button type="submit" class="btn btn-primary" id="save-btn">
            <span id="save-text">Save Settings</span>
          </button>
          <button type="button" class="btn btn-secondary" id="test-btn" onclick="sendTestEmail()">
            Send Test
          </button>
        </div>
      </form>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    var API = window.location.origin

    async function loadSettings(){
      try{
        var r=await fetch(API+'/api/settings')
        var d=await r.json()
        if(d.success&&d.settings){
          var m={};d.settings.forEach(function(s){m[s.key]=s.value})
          document.getElementById('gmail_user').value=m.gmail_user||''
          document.getElementById('gmail_app_password').value=m.gmail_app_password||''
          document.getElementById('gmail_from_name').value=m.gmail_from_name||''
          document.getElementById('admin_email').value=m.admin_email||''
          var b=document.getElementById('config-source')
          if(m.gmail_user&&m.gmail_app_password){b.textContent='Database';b.className='source-badge db'}
          else{b.textContent='Env Fallback';b.className='source-badge env'}
        }
      }catch(e){showToast('Failed to load settings','error');document.getElementById('config-source').textContent='Offline';document.getElementById('config-source').className='source-badge env'}
    }

    document.getElementById('settings-form').addEventListener('submit',async function(e){
      e.preventDefault()
      var btn=document.getElementById('save-btn'),txt=document.getElementById('save-text')
      btn.disabled=true;txt.textContent='Saving...'
      try{
        var settings={gmail_user:document.getElementById('gmail_user').value.trim(),gmail_app_password:document.getElementById('gmail_app_password').value.trim(),gmail_from_name:document.getElementById('gmail_from_name').value.trim(),admin_email:document.getElementById('admin_email').value.trim()}
        var r=await fetch(API+'/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({settings})})
        var d=await r.json()
        if(d.success){showToast('Settings saved','success');var b=document.getElementById('config-source');b.textContent='Database';b.className='source-badge db'}
        else showToast('Save failed: '+d.error,'error')
      }catch(e){showToast('Network error','error')}
      finally{btn.disabled=false;txt.textContent='Save Settings'}
    })

    async function sendTestEmail(){
      var btn=document.getElementById('test-btn')
      btn.disabled=true;btn.textContent='Sending...'
      try{
        var to=document.getElementById('admin_email').value.trim()||document.getElementById('gmail_user').value.trim()
        var r=await fetch(API+'/api/test-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to})})
        var d=await r.json()
        if(d.success)showToast('Test sent to '+to,'success')
        else showToast('Email failed: '+d.error,'error')
      }catch(e){showToast('Network error','error')}
      finally{btn.disabled=false;btn.textContent='Send Test'}
    }

    function showToast(m,t){
      var el=document.getElementById('toast')
      el.textContent=m;el.className='toast show '+t
      setTimeout(function(){el.className='toast'},3500)
    }

    loadSettings()
  </script>
</body>
</html>`
}
