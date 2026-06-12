export function getPortalHTML(sessionToken) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flodon — Client Portal</title>
  <style>
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;min-height:100vh;-webkit-font-smoothing:antialiased;font-size:16px;line-height:1.6}
    a{color:#00f0ff;text-decoration:none}
    .container{max-width:840px;margin:0 auto;padding:24px 20px 80px}
    .login-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
    .login-card{background:#0a0a0a;border:1px solid #1a1a1a;padding:48px;width:100%;max-width:420px;text-align:center}
    .login-card h1{font-size:28px;font-weight:700;margin-bottom:4px;letter-spacing:-0.02em}
    .login-card p{font-size:14px;color:#666;margin-bottom:24px}
    .login-card .field input{width:100%;padding:14px 16px;background:#000;border:1px solid #1a1a1a;color:#fff;font-size:15px;font-family:inherit;outline:none;transition:border-color 0.12s}
    .login-card .field input:focus{border-color:#00f0ff}
    .login-card .success{color:#00f0ff;font-size:14px;margin-top:16px}
    .header{display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-bottom:1px solid #1a1a1a;margin-bottom:20px}
    .header-brand{font-size:20px;font-weight:700;letter-spacing:-0.02em}
    .header-nav{display:flex;gap:2px;flex-wrap:wrap}
    .header-nav a{display:block;padding:7px 12px;font-size:13px;font-weight:500;color:#666;text-decoration:none;transition:all 0.1s}
    .header-nav a:hover{color:#fff}
    .header-nav a.active{color:#fff;background:rgba(0,240,255,0.06)}
    .page-header{margin-bottom:16px}
    .page-header h2{font-size:22px;font-weight:700;letter-spacing:-0.02em}
    .page-header p{font-size:14px;color:#666;margin-top:2px}
    .card{background:#0a0a0a;border:1px solid #1a1a1a;padding:24px;margin-bottom:16px}
    .card-title{font-size:14px;font-weight:700;color:#fff;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between}
    .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
    .stat-card{background:#0a0a0a;border:1px solid #1a1a1a;padding:16px;text-align:center}
    .stat-card:hover{border-color:#222}
    .stat-label{font-size:11px;color:#666;font-weight:500;margin-bottom:3px;text-transform:uppercase;letter-spacing:0.04em}
    .stat-value{font-size:24px;font-weight:700;letter-spacing:-0.02em}
    .badge{display:inline-flex;align-items:center;padding:3px 10px;font-size:11px;font-weight:600;border:1px solid}
    .badge-neon{background:rgba(0,240,255,0.06);color:#00f0ff;border-color:rgba(0,240,255,0.15)}
    .badge-green{background:rgba(34,197,94,0.06);color:#22c55e;border-color:rgba(34,197,94,0.15)}
    .badge-red{background:rgba(239,68,68,0.06);color:#ff4444;border-color:rgba(239,68,68,0.15)}
    .badge-gray{background:rgba(255,255,255,0.04);color:#888;border-color:#1a1a1a}
    .badge-amber{background:rgba(245,158,11,0.06);color:#fbbf24;border-color:rgba(245,158,11,0.15)}
    .progress-ring{width:80px;height:80px;margin:0 auto 8px;position:relative}
    .progress-ring svg{transform:rotate(-90deg)}
    .progress-ring .bg{fill:none;stroke:#1a1a1a;stroke-width:4}
    .progress-ring .fg{fill:none;stroke:#00f0ff;stroke-width:4;stroke-linecap:round;transition:stroke-dashoffset 1s ease}
    .progress-ring .pct{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff}
    .project-card{padding:18px;border:1px solid #1a1a1a;background:#0a0a0a;margin-bottom:12px;transition:border-color 0.15s}
    .project-card:hover{border-color:#00f0ff}
    .project-card h3{font-size:16px;font-weight:600;margin-bottom:2px}
    .project-card p{font-size:14px;color:#888;margin-bottom:10px}
    .progress-track{height:6px;background:#1a1a1a;overflow:hidden;margin-bottom:6px;border-radius:3px}
    .progress-fill{height:100%;background:#00f0ff;transition:width 1s ease;border-radius:3px}
    .progress-fill.done{background:#22c55e}
    .milestone-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #1a1a1a;font-size:14px}
    .milestone-item:last-child{border-bottom:none}
    .milestone-check{width:20px;height:20px;border:2px solid #333;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;border-radius:50%;transition:all 0.2s}
    .milestone-check.done{border-color:#22c55e;background:rgba(34,197,94,0.1);color:#22c55e}
    .milestone-check.active{border-color:#00f0ff;background:rgba(0,240,255,0.1);color:#00f0ff;animation:pulse 1.5s infinite}
    .next-milestone{border-left:2px solid #00f0ff;padding-left:12px;margin-top:8px;font-size:13px;color:#888}
    .next-milestone strong{color:#00f0ff}
    .deal-card{padding:18px;border:1px solid #1a1a1a;background:#0a0a0a;margin-bottom:12px;transition:border-color 0.15s}
    .deal-card:hover{border-color:#00f0ff}
    .deal-card h3{font-size:16px;font-weight:600;margin-bottom:2px}
    .deal-card .deal-amount{font-size:20px;font-weight:700;color:#00f0ff;margin-bottom:8px}
    .stage-bar{display:flex;gap:3px;margin-bottom:8px}
    .stage-dot{flex:1;height:5px;background:#1a1a1a;transition:all 0.3s;border-radius:3px}
    .stage-dot.active{background:#00f0ff}
    .stage-dot.current{background:#00f0ff;box-shadow:0 0 10px rgba(0,240,255,0.5)}
    .stage-dot.won{background:#22c55e;box-shadow:0 0 10px rgba(34,197,94,0.3)}
    .stage-dot.lost{background:#ff4444;box-shadow:0 0 10px rgba(239,68,68,0.3)}
    .field{margin-bottom:16px}
    .field:last-child{margin-bottom:0}
    .field label{display:block;font-size:12px;font-weight:600;color:#888;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em}
    .field input,.field textarea{width:100%;padding:12px 14px;background:#000;border:1px solid #1a1a1a;color:#fff;font-size:14px;font-family:inherit;outline:none;transition:border-color 0.12s}
    .field input:focus,.field textarea:focus{border-color:#00f0ff}
    .field textarea{min-height:80px;resize:vertical}
    .btn{padding:12px 22px;border:none;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;transition:all 0.12s;display:inline-flex;align-items:center;gap:5px;border-radius:0}
    .btn-primary{background:#fff;color:#000}
    .btn-primary:hover{background:#ddd}
    .btn-accent{background:#00f0ff;color:#000}
    .btn-accent:hover{background:#00ccdd}
    .btn-secondary{background:transparent;color:#888;border:1px solid #1a1a1a}
    .btn-secondary:hover{border-color:#333;color:#fff}
    .btn-sm{padding:8px 16px;font-size:13px}
    .btn:disabled{opacity:0.4;cursor:not-allowed}
    .table-wrap{overflow-x:auto}
    table.data-table{width:100%;border-collapse:collapse;font-size:14px}
    table.data-table th{text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #1a1a1a}
    table.data-table td{padding:12px;border-bottom:1px solid #1a1a1a;color:#ccc}
    .doc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .doc-card{padding:16px;border:1px solid #1a1a1a;background:#0a0a0a;transition:border-color 0.15s}
    .doc-card:hover{border-color:#333}
    .doc-card h4{font-size:14px;font-weight:600;margin-bottom:2px}
    .doc-card p{font-size:13px;color:#666}
    .msg-item{padding:14px 0;border-bottom:1px solid #1a1a1a;animation:fadeIn 0.3s ease}
    .msg-item:last-child{border-bottom:none}
    .msg-header{font-size:12px;color:#555;margin-bottom:4px;display:flex;align-items:center;gap:8px}
    .msg-avatar{width:30px;height:30px;border-radius:50%;background:#1a1a1a;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
    .msg-avatar.team{background:rgba(0,240,255,0.08);color:#00f0ff}
    .msg-avatar.you{background:rgba(34,197,94,0.08);color:#22c55e}
    .msg-content{font-size:15px;color:#ccc;line-height:1.6;padding-left:38px}
    .activity-item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #1a1a1a;font-size:14px;animation:fadeIn 0.3s ease}
    .activity-item:last-child{border-bottom:none}
    .activity-dot{width:8px;height:8px;border-radius:50%;margin-top:4px;flex-shrink:0}
    .activity-dot.milestone{background:#22c55e}
    .activity-dot.message{background:#00f0ff}
    .activity-dot.document{background:#fbbf24}
    .activity-dot.project{background:#888}
    .empty-state{text-align:center;padding:40px 20px;color:#666;font-size:15px}
    .text-muted{color:#666}
    .text-accent{color:#00f0ff}
    .text-green{color:#22c55e}
    .text-sm{font-size:13px}
    .text-xs{font-size:12px}
    .flex{display:flex}
    .flex-between{display:flex;justify-content:space-between;align-items:center}
    .flex-center{display:flex;align-items:center;gap:8px}
    .gap-4{gap:4px}
    .gap-8{gap:8px}
    .gap-12{gap:12px}
    .mb-4{margin-bottom:4px}
    .mb-8{margin-bottom:8px}
    .mb-12{margin-bottom:12px}
    .mb-16{margin-bottom:16px}
    .mt-4{margin-top:4px}
    .mt-8{margin-top:8px}
    .mt-12{margin-top:12px}
    .w-full{width:100%}
    .toast{position:fixed;bottom:24px;right:24px;padding:12px 16px;font-size:14px;font-weight:500;display:none;z-index:1000;animation:fadeIn 0.2s ease;max-width:360px;border:1px solid}
    .toast.success{background:#0a1a0a;color:#00f0ff;border-color:rgba(0,240,255,0.2)}
    .toast.error{background:#1a0a0a;color:#ff4444;border-color:rgba(255,68,68,0.2)}
    .toast.show{display:block}
    .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .welcome{margin-bottom:20px}
    .welcome h1{font-size:26px;font-weight:700;margin-bottom:2px}
    .welcome p{color:#666;font-size:15px}
    .countdown{display:inline-flex;align-items:center;gap:4px;font-size:13px;color:#888;background:#0a0a0a;border:1px solid #1a1a1a;padding:4px 10px}
    .countdown strong{color:#00f0ff}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    .new-msg-dot{width:6px;height:6px;background:#00f0ff;border-radius:50%;display:inline-block;margin-left:4px;animation:pulse 1.5s infinite}
    .msg-input-wrap{position:sticky;bottom:0;background:#000;padding-top:12px;border-top:1px solid #1a1a1a;margin-top:12px}
    @media(max-width:640px){.stat-grid{grid-template-columns:repeat(2,1fr)}.grid-2{grid-template-columns:1fr}.doc-grid{grid-template-columns:1fr}.header{flex-direction:column;gap:10px}.header-nav{justify-content:center}}
  </style>
</head>
<body>
  <div id="app"></div>
  <div class="toast" id="toast"></div>
  <script>
    var API = window.location.origin + '/api/portal'
    var SESSION = ${sessionToken ? `'${sessionToken}'` : 'null'}
    var ROUTES = ['dashboard', 'projects', 'deals', 'documents', 'messages']

    if (SESSION) localStorage.setItem('portal_session', SESSION)
    var savedSession = SESSION || localStorage.getItem('portal_session')

    function esc(s){return s!=null?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''}
    function fmtDate(d){if(!d)return'—';try{return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}catch(e){return d}}
    function fmtDateTime(d){if(!d)return'';try{var dt=new Date(d);return dt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})+' '+dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}catch(e){return d}}
    function fmtINR(n){return'\u20b9'+Number(n||0).toLocaleString('en-IN')}
    function timeAgo(d){if(!d)return'';var now=Date.now(),then=new Date(d).getTime(),diff=Math.floor((now-then)/1000);if(diff<60)return'just now';if(diff<3600)return Math.floor(diff/60)+'m ago';if(diff<86400)return Math.floor(diff/3600)+'h ago';if(diff<604800)return Math.floor(diff/86400)+'d ago';return fmtDate(d)}

    function toast(m,t){
      var el=document.getElementById('toast')
      el.textContent=m;el.className='toast show '+(t||'success')
      setTimeout(function(){el.className='toast'},3000)
    }

    function portalApi(method,path,body){
      if(!savedSession){showLogin();return Promise.reject('Not authenticated')}
      var opts={method:method,headers:{'Content-Type':'application/json','Authorization':'Bearer '+savedSession}}
      if(body&&method!=='GET')opts.body=JSON.stringify(body)
      return fetch(API+path,opts).then(function(r){return r.json()}).then(function(d){
        if(d.error){throw new Error(d.error)}
        return d.data||d
      })
    }

    function renderApp(){
      if(!savedSession){showLogin();return}
      var hash = window.location.hash.slice(1) || 'dashboard'
      if(!ROUTES.includes(hash)) hash='dashboard'
      var el=document.getElementById('app')
      el.innerHTML='<div class="container"><div class="header"><div class="header-brand">FLODON</div><nav class="header-nav">'+
        ROUTES.map(function(r){return '<a href="#'+r+'" class="'+(hash===r?'active':'')+'">'+r.charAt(0).toUpperCase()+r.slice(1)+'</a>'}).join('')+
        '</nav></div><div id="page-content"></div></div>'

      if(hash==='dashboard') renderPortalDashboard()
      else if(hash==='projects') renderPortalProjects()
      else if(hash==='deals') renderPortalDeals()
      else if(hash==='documents') renderPortalDocuments()
      else if(hash==='messages') renderPortalMessages()
    }

    window.addEventListener('hashchange', renderApp)

    // ─── LOGIN ───
    function showLogin(){
      var el=document.getElementById('app')
      el.innerHTML='<div class="login-wrap"><div class="login-card"><h1>FLODON</h1><p>Client Portal</p><div class="field"><input type="email" id="login-email" placeholder="Enter your email address" onkeydown="if(event.key==\\'Enter\\')sendMagicLink()"></div><button class="btn btn-primary w-full" id="login-btn" onclick="sendMagicLink()">Send Magic Link</button><div id="login-status"></div></div></div>'
      var params = new URLSearchParams(window.location.search)
      if(params.get('error')){
        document.getElementById('login-status').innerHTML='<div class="success" style="color:#ff4444">'+esc(params.get('error'))+'</div>'
      }
    }

    function sendMagicLink(){
      var email=document.getElementById('login-email').value.trim()
      if(!email){toast('Enter your email','error');return}
      var btn=document.getElementById('login-btn')
      btn.disabled=true;btn.textContent='Sending...'
      fetch(API+'/auth/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})})
        .then(function(r){return r.json()})
        .then(function(d){
          if(d.error)throw new Error(d.error)
          document.getElementById('login-status').innerHTML='<div class="success">Magic link sent! Check your email.</div>'
          btn.textContent='Email Sent'
        }).catch(function(e){
          toast(e.message,'error')
          btn.disabled=false;btn.textContent='Send Magic Link'
        })
    }

    // ─── DASHBOARD ───
    var dashRefresh = null
    function renderPortalDashboard(){
      if(dashRefresh) clearInterval(dashRefresh)
      var el=document.getElementById('page-content')
      el.innerHTML=
        '<div class="welcome" id="pd-welcome"></div>'+
        '<div class="stat-grid" id="pd-stats"></div>'+
        '<div style="margin-bottom:16px;background:#0a0a0a;border:1px solid #1a1a1a;padding:16px;text-align:center" id="pd-overall"><div class="card-title" style="margin-bottom:8px">Overall Progress</div><div class="progress-ring" id="pd-ring"></div><div class="progress-track" style="max-width:400px;margin:0 auto 8px;height:6px;border-radius:3px" id="pd-track-wrap"></div><span class="text-sm text-muted" id="pd-overall-text"></span></div>'+
        '<div class="grid-2"><div class="card" id="pd-projects-card"><div class="card-title">Your Projects</div><div id="pd-projects"><div class="empty-state" style="padding:12px">Loading...</div></div></div>'+
        '<div class="card" id="pd-activity-card"><div class="card-title">What\\'s Happening</div><div id="pd-activity"><div class="empty-state" style="padding:12px">Loading...</div></div></div></div>'+
        '<div class="card" id="pd-upcoming-card"><div class="card-title">Upcoming Deadlines</div><div id="pd-upcoming"><div class="empty-state" style="padding:12px">Loading...</div></div></div>'
      loadPortalDashboard()
      dashRefresh = setInterval(loadPortalDashboard, 15000)
    }

    function loadPortalDashboard(){
      portalApi('GET','/dashboard').then(function(d){
        d=d||{}
        var wEl=document.getElementById('pd-welcome')
        var h=d.projects&&d.projects.length?Math.max(0,...d.projects.filter(function(p){return p.progress!=null}).map(function(p){return p.progress})):0
        wEl.innerHTML='<h1>Welcome back'+(d.projects&&d.projects.length?' &#x1f680;':'')+'</h1><p>'+(d.active_projects?'<span class="text-accent">'+d.active_projects+' active project'+(d.active_projects>1?'s':'')+'</span> &middot; ':'')+'Overall progress: <strong>'+(d.overall_progress||0)+'%</strong></p>'

        // Stats
        document.getElementById('pd-stats').innerHTML=
          '<div class="stat-card"><div class="stat-label">Active Projects</div><div class="stat-value text-accent">'+(d.active_projects||0)+'</div></div>'+
          '<div class="stat-card"><div class="stat-label">Active Deals</div><div class="stat-value">'+(d.active_deals||0)+'</div></div>'+
          '<div class="stat-card"><div class="stat-label">Unpaid Invoices</div><div class="stat-value">'+(d.unpaid_invoices||0)+'</div></div>'+
          '<div class="stat-card"><div class="stat-label">New Messages</div><div class="stat-value">'+(d.unread_messages||0)+'</div></div>'

        // Overall progress ring
        var op=d.overall_progress||0
        var circ=2*Math.PI*28
        var off=circ-(op/100)*circ
        document.getElementById('pd-ring').innerHTML=
          '<svg width="80" height="80"><circle class="bg" cx="40" cy="40" r="28"/><circle class="fg" cx="40" cy="40" r="28" stroke-dasharray="'+circ+'" stroke-dashoffset="'+off+'"/></svg><div class="pct">'+op+'%</div>'
        document.getElementById('pd-track-wrap').innerHTML='<div class="progress-fill'+(op>=100?' done':'')+'" style="width:'+op+'%"></div>'
        document.getElementById('pd-overall-text').textContent=(d.active_projects||0)+' active project'+(d.active_projects!==1?'s':'')+' | '+(d.total_projects||0)+' total'

        // Projects section
        var pEl=document.getElementById('pd-projects')
        var projects=d.projects||[]
        pEl.innerHTML=projects.length?projects.slice(0,3).map(function(p){
          var ms=p.milestones||[]
          var next=p.next_milestone
          var activeMs=ms.filter(function(m){return m.status==='in_progress'})
          return '<div class="project-card" style="cursor:pointer;margin-bottom:10px" onclick="window.location.hash=\\'#projects\\'"><div class="flex-between mb-4"><h3>'+esc(p.name)+'</h3><span class="badge '+(p.status==='active'?'badge-neon':p.status==='completed'?'badge-green':p.status==='on_hold'?'badge-amber':'badge-gray')+'">'+esc(p.status).replace(/_/g,' ')+'</span></div>'+
            '<div class="flex-between text-sm mb-4"><span class="text-muted">'+p.progress+'% complete</span>'+
            (next?'<span class="text-xs">Next: <strong style="color:#00f0ff">'+esc(next.name)+'</strong></span>':'')+'</div>'+
            '<div class="progress-track"><div class="progress-fill'+(p.status==='completed'?' done':'')+'" style="width:'+p.progress+'%"></div></div>'+
            (activeMs.length?'<div class="next-milestone mt-4">Currently working on: <strong>'+esc(activeMs[0].name)+'</strong></div>':'')+
            (next&&next.due_date?'<div class="next-milestone">Next due: <strong>'+fmtDate(next.due_date)+'</strong> <span class="text-xs text-muted">('+timeAgo(next.due_date)+')</span></div>':'')+
            '</div>'
        }).join(''):'<div class="empty-state" style="padding:12px">No projects yet</div>'

        // Activity feed
        var aEl=document.getElementById('pd-activity')
        var activity=d.activity||[]
        aEl.innerHTML=activity.length?activity.slice(0,8).map(function(a){
          var dotClass='project'
          if(a.type==='milestone_completed') dotClass='milestone'
          else if(a.type==='team_message') dotClass='message'
          else if(a.type==='document_shared') dotClass='document'
          return '<div class="activity-item"><div class="activity-dot '+dotClass+'"></div><div><div>'+esc(a.text)+'</div><div class="text-xs text-muted mt-4">'+timeAgo(a.date)+'</div></div></div>'
        }).join(''):'<div class="empty-state" style="padding:12px">No recent activity</div>'

        // Upcoming deadlines
        var uEl=document.getElementById('pd-upcoming')
        var upcoming=d.upcoming_milestones||[]
        uEl.innerHTML=upcoming.length?upcoming.map(function(m){
          var pName=''
          if(projects){var pp=projects.find(function(p){return p.id===m.project_id});if(pp)pName=pp.name}
          return '<div class="flex-between" style="padding:10px 0;border-bottom:1px solid #1a1a1a;font-size:13px"><div><strong>'+esc(m.name)+'</strong>'+(pName?'<span class="text-muted text-sm"> &middot; '+esc(pName)+'</span>':'')+'</div><div class="flex-center gap-8"><span class="countdown">Due: <strong>'+fmtDate(m.due_date)+'</strong></span><span class="text-xs text-muted">'+timeAgo(m.due_date)+'</span></div></div>'
        }).join(''):'<div class="empty-state" style="padding:12px">No upcoming milestones</div>'
      }).catch(function(e){})
    }

    // ─── PROJECTS ───
    function renderPortalProjects(){
      var el=document.getElementById('page-content')
      el.innerHTML='<div class="page-header"><h2>Projects</h2><p>All your ongoing projects and milestones</p></div><div id="project-list"><div class="empty-state">Loading...</div></div>'
      portalApi('GET','/projects').then(function(d){
        d=d||[]
        document.getElementById('project-list').innerHTML=d.length?d.map(function(p){
          var ms=p.milestones||[]
          var total=ms.length
          var done=ms.filter(function(m){return m.status==='completed'}).length
          var progress=p.progress!=null?p.progress:(total>0?Math.round(done/total*100):0)
          var nextMs=ms.filter(function(m){return m.status!=='completed'&&m.due_date}).sort(function(a,b){return new Date(a.due_date)-new Date(b.due_date)})
          var activeMs=ms.filter(function(m){return m.status==='in_progress'})
          return '<div class="project-card"><div class="flex-between mb-8"><div><h3>'+esc(p.name)+'</h3>'+
            (p.description?'<p class="mt-4">'+esc(p.description)+'</p>':'')+
            '</div><span class="badge '+(p.status==='active'?'badge-neon':p.status==='completed'?'badge-green':p.status==='on_hold'?'badge-amber':'badge-gray')+'">'+esc(p.status).replace(/_/g,' ')+'</span></div>'+
            '<div class="flex-between text-sm mb-4"><span class="text-muted">'+done+' / '+total+' milestones completed</span>'+
            (p.target_date?'<span class="text-muted">Target: '+fmtDate(p.target_date)+'</span>':'')+
            '</div>'+
            '<div class="progress-track"><div class="progress-fill'+(p.status==='completed'?' done':'')+'" style="width:'+progress+'%"></div></div>'+
            '<div class="flex-between text-sm mb-12"><span class="text-accent">'+progress+'% complete</span>'+
            (p.start_date?'<span class="text-muted">Started '+fmtDate(p.start_date)+'</span>':'')+
            '</div>'+
            (activeMs.length?'<div style="background:rgba(0,240,255,0.04);border-left:2px solid #00f0ff;padding:10px 14px;margin-bottom:12px;font-size:13px"><strong style="color:#00f0ff">Currently working on:</strong> '+esc(activeMs[0].name)+'</div>':'')+
            (ms.length?'<div style="border-top:1px solid #1a1a1a;padding-top:8px">'+ms.map(function(m){
              var isActive=m.status==='in_progress'
              var isDone=m.status==='completed'
              return '<div class="milestone-item"><div class="milestone-check'+(isDone?' done':'')+(isActive?' active':'')+'">'+(isDone?'\u2713':isActive?'\u25CF':'')+'</div><div style="flex:1"><strong>'+esc(m.name)+'</strong>'+(m.description?'<br><span class="text-sm text-muted">'+esc(m.description)+'</span>':'')+'</div><div class="text-right"><span class="text-xs text-muted">'+(m.due_date?fmtDate(m.due_date):'')+'</span>'+(m.completed_at?'<br><span class="text-xs text-green">Done '+timeAgo(m.completed_at)+'</span>':'')+'</div></div>'
            }).join('')+'</div>':'<div style="margin-top:8px;padding:8px;border:1px dashed #1a1a1a;font-size:13px;color:#555;text-align:center">No milestones defined yet — your team is planning the roadmap</div>')+
            (nextMs.length?'<div class="next-milestone mt-8">Next milestone: <strong>'+esc(nextMs[0].name)+'</strong> due '+fmtDate(nextMs[0].due_date)+' <span class="text-xs text-muted">('+timeAgo(nextMs[0].due_date)+')</span></div>':'')+
            '</div>'
        }).join(''):'<div class="empty-state">No projects yet. Your team will set up projects once work begins.</div>'
      }).catch(function(e){document.getElementById('project-list').innerHTML='<div class="empty-state">Error: '+e.message+'</div>'})
    }

    // ─── DEALS ───
    function renderPortalDeals(){
      var el=document.getElementById('page-content')
      el.innerHTML='<div class="page-header"><h2>Deals</h2><p>Your deal pipeline and progress</p></div><div id="deals-list"><div class="empty-state">Loading...</div></div>'
      var DEAL_STAGES = ['lead', 'contacted', 'demo', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
      portalApi('GET','/deals').then(function(d){
        d=d||[]
        document.getElementById('deals-list').innerHTML=d.length?d.map(function(dl){
          var idx=DEAL_STAGES.indexOf(dl.stage)
          var stageHtml=DEAL_STAGES.map(function(s,i){
            var cls='stage-dot'
            if(i<=idx&&dl.stage!=='closed_lost') cls+=' active'
            if(i===idx&&dl.stage!=='closed_lost') cls+=' current'
            if(dl.stage==='closed_won'&&i<=idx) cls='stage-dot won'
            if(dl.stage==='closed_lost'&&i<=idx) cls='stage-dot lost'
            return '<div class="'+cls+'" title="'+s.replace(/_/g,' ')+'"></div>'
          }).join('')
          var labels=['Lead','Contacted','Demo','Proposal','Negotiation','Won','Lost']
          return '<div class="deal-card"><div class="flex-between"><div><h3>'+esc(dl.title||'Deal')+'</h3><div class="flex-center gap-4 mt-4"><span class="badge '+(dl.stage==='closed_won'?'badge-green':dl.stage==='closed_lost'?'badge-red':'badge-neon')+'">'+esc(dl.stage).replace(/_/g,' ')+'</span><span class="text-sm text-muted">'+dl.probability+'% probability</span></div></div><div style="text-align:right"><div class="deal-amount">'+fmtINR(dl.amount_monthly)+'<span class="text-sm text-muted">/mo</span></div>'+(dl.expected_close?'<span class="text-xs text-muted">Expected by '+fmtDate(dl.expected_close)+'</span>':'')+'</div></div>'+
            '<div class="stage-bar" style="margin-top:12px">'+stageHtml+'</div>'+
            '<div class="flex-between text-sm" style="margin-top:4px"><span class="text-xs text-muted">'+labels.map(function(l,i){return'<span style="color:'+(i<=idx&&dl.stage!=='closed_lost'?'#666':'#333')+'">'+l+'</span>'}).join(' \u00B7 ')+'</span></div></div>'
        }).join(''):'<div class="empty-state">No deals yet</div>'
      }).catch(function(e){document.getElementById('deals-list').innerHTML='<div class="empty-state">Error: '+e.message+'</div>'})
    }

    // ─── DOCUMENTS ───
    function renderPortalDocuments(){
      var el=document.getElementById('page-content')
      el.innerHTML='<div class="page-header"><div class="flex-between"><div><h2>Documents</h2><p>Shared files, contracts, and resources</p></div><button class="btn btn-accent btn-sm" onclick="openDocUpload()">+ Upload</button></div></div><div class="doc-grid" id="doc-grid"><div class="empty-state">Loading...</div></div>'
      portalApi('GET','/documents').then(function(d){
        d=d||[]
        document.getElementById('doc-grid').innerHTML=d.length?d.map(function(dd){
          return '<div class="doc-card"><div class="flex-between mb-8"><h4>'+esc(dd.title)+'</h4><span class="text-xs '+(dd.uploaded_by==='team'?'text-accent':'text-green')+'">'+(dd.uploaded_by==='team'?'From Team':'Uploaded by You')+'</span></div>'+
            (dd.description?'<p>'+esc(dd.description)+'</p>':'')+
            '<div class="flex-between mt-8"><span class="text-xs text-muted">'+fmtDate(dd.created_at)+'</span>'+
            (dd.file_url?'<a href="'+esc(dd.file_url)+'" target="_blank" class="btn btn-sm btn-secondary">Open</a>':'')+'</div></div>'
        }).join(''):'<div class="empty-state">No documents shared yet</div>'
      }).catch(function(e){document.getElementById('doc-grid').innerHTML='<div class="empty-state">Error: '+e.message+'</div>'})
    }

    function openDocUpload(){
      var el=document.getElementById('page-content')
      el.innerHTML=el.innerHTML+'<div id="upload-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px"><div style="background:#0a0a0a;border:1px solid #1a1a1a;padding:24px;width:100%;max-width:420px"><h3 style="font-size:16px;font-weight:700;margin-bottom:16px">Upload Document</h3><div class="field"><label>Title</label><input id="doc-title" placeholder="Document title"></div><div class="field"><label>Description <span class="text-muted">(optional)</span></label><input id="doc-desc" placeholder="What is this document?"></div><div class="field"><label>File URL</label><input id="doc-url" placeholder="https://... (PDF, image, etc.)"></div><div class="flex gap-8"><button class="btn btn-primary btn-sm" onclick="submitDocUpload()">Upload</button><button class="btn btn-secondary btn-sm" onclick="closeDocUpload()">Cancel</button></div></div></div>'
    }

    function closeDocUpload(){
      var m=document.getElementById('upload-modal')
      if(m)m.remove()
    }

    function submitDocUpload(){
      var title=document.getElementById('doc-title').value.trim()
      var url=document.getElementById('doc-url').value.trim()
      if(!title||!url){toast('Title and URL required','error');return}
      portalApi('POST','/documents',{title:title,description:document.getElementById('doc-desc').value.trim(),file_url:url,file_type:'other'}).then(function(){
        toast('Document uploaded','success')
        closeDocUpload()
        renderPortalDocuments()
      }).catch(function(e){toast(e.message,'error')})
    }

    // ─── MESSAGES ───
    var msgRefresh = null
    function renderPortalMessages(){
      if(msgRefresh) clearInterval(msgRefresh)
      var el=document.getElementById('page-content')
      el.innerHTML='<div class="page-header"><h2>Messages</h2><p>Conversation with your team</p></div><div id="msg-list" style="max-height:60vh;overflow-y:auto"></div><div class="msg-input-wrap"><div class="flex gap-8"><input type="text" id="msg-input" placeholder="Type a message..." style="flex:1;padding:12px 14px;background:#0a0a0a;border:1px solid #1a1a1a;color:#fff;font-size:14px;font-family:inherit;outline:none;border-radius:0" onkeydown="if(event.key==\\'Enter\\')sendMsg()"><button class="btn btn-accent" onclick="sendMsg()" id="msg-send-btn">Send</button></div></div>'
      loadMessages()
      msgRefresh = setInterval(loadMessages, 8000)
    }

    function loadMessages(){
      portalApi('GET','/messages').then(function(d){
        d=d||[]
        var list=document.getElementById('msg-list')
        var wasAtBottom=list && (list.scrollHeight - list.scrollTop - list.clientHeight < 50)
        list.innerHTML=d.length?d.map(function(m){
          var isClient=m.sender==='client'
          return '<div class="msg-item '+(isClient?'msg-client':'msg-team')+'"><div class="msg-header"><div class="msg-avatar '+(isClient?'you':'team')+'">'+(isClient?'Y':'T')+'</div><strong>'+(isClient?'You':esc(m.sender_name||'Team'))+'</strong><span class="text-xs text-muted">'+timeAgo(m.created_at)+'</span></div><div class="msg-content">'+esc(m.content)+'</div></div>'
        }).join(''):'<div class="empty-state">No messages yet. Say hello to your team!</div>'
        if(wasAtBottom||d.length<=1) list.scrollTop=list.scrollHeight
      }).catch(function(e){})
    }

    function sendMsg(){
      var input=document.getElementById('msg-input')
      if(!input)return
      var msg=input.value.trim()
      if(!msg)return
      input.disabled=true
      document.getElementById('msg-send-btn').disabled=true
      portalApi('POST','/messages',{content:msg}).then(function(){
        input.value='';input.disabled=false;document.getElementById('msg-send-btn').disabled=false
        loadMessages()
        var list=document.getElementById('msg-list')
        if(list) list.scrollTop=list.scrollHeight
      }).catch(function(e){toast(e.message,'error');input.disabled=false;document.getElementById('msg-send-btn').disabled=false})
    }

    // ─── INIT ───
    if (savedSession) {
      renderApp()
    } else {
      showLogin()
    }
  </script>
</body>
</html>`
}
