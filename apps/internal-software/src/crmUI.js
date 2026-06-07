export function getCRMHTML(url) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flodon CRM</title>
  <style>
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#000;color:#fff;min-height:100vh;-webkit-font-smoothing:antialiased;font-size:15px;line-height:1.5}
    a{color:#00f0ff;text-decoration:none}
    a:hover{text-decoration:underline}
    .app{display:flex;min-height:100vh}
    .sidebar{width:200px;flex-shrink:0;background:#0a0a0a;border-right:1px solid #1a1a1a;display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100}
    .sidebar-brand{padding:20px 16px 16px;border-bottom:1px solid #1a1a1a}
    .sidebar-brand h1{font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.02em}
    .sidebar-brand p{font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.06em;margin-top:1px}
    .sidebar-nav{flex:1;padding:8px 0;overflow-y:auto}
    .sidebar-nav a{display:block;padding:10px 16px;font-size:14px;font-weight:500;color:#666;text-decoration:none;border-left:2px solid transparent;transition:all 0.12s}
    .sidebar-nav a:hover{color:#fff;background:rgba(255,255,255,0.02)}
    .sidebar-nav a.active{color:#fff;border-left-color:#00f0ff;background:rgba(0,240,255,0.04)}
    .main{flex:1;margin-left:200px;padding:24px 28px 60px;min-height:100vh}
    .page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
    .page-header h2{font-size:22px;font-weight:700;letter-spacing:-0.02em}
    .page-header p{font-size:13px;color:#666;margin-top:2px}
    .card{background:#0a0a0a;border:1px solid #1a1a1a;padding:20px;margin-bottom:16px}
    .card-title{font-size:14px;font-weight:700;color:#fff;margin-bottom:14px}
    .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
    .stat-card{background:#0a0a0a;border:1px solid #1a1a1a;padding:18px}
    .stat-label{font-size:12px;color:#666;font-weight:500;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em}
    .stat-value{font-size:24px;font-weight:700;letter-spacing:-0.02em}
    .stage-bar{margin-bottom:10px}
    .stage-bar-header{display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px}
    .stage-bar-label{color:#888}
    .stage-bar-count{color:#555}
    .stage-bar-track{height:4px;background:#1a1a1a;overflow:hidden}
    .stage-bar-fill{height:100%;background:#00f0ff;transition:width 0.3s}
    .field{margin-bottom:14px}
    .field:last-child{margin-bottom:0}
    .field label{display:block;font-size:12px;font-weight:600;color:#888;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em}
    .field input,.field select,.field textarea{width:100%;padding:10px 12px;background:#000;border:1px solid #1a1a1a;color:#fff;font-size:14px;font-family:inherit;outline:none;transition:border-color 0.12s}
    .field textarea{min-height:70px;resize:vertical}
    .field input:focus,.field select:focus,.field textarea:focus{border-color:#00f0ff}
    .field input::placeholder,.field textarea::placeholder{color:#444}
    .field-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .filters{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
    .filters input,.filters select{padding:8px 10px;background:#0a0a0a;border:1px solid #1a1a1a;color:#fff;font-size:13px;font-family:inherit;outline:none}
    .filters input:focus,.filters select:focus{border-color:#00f0ff}
    .filters input{min-width:180px}
    .btn{padding:9px 18px;border:none;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;transition:all 0.12s;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
    .btn-primary{background:#fff;color:#000}
    .btn-primary:hover{background:#ddd}
    .btn-accent{background:#00f0ff;color:#000}
    .btn-accent:hover{background:#00ccdd}
    .btn-secondary{background:transparent;color:#888;border:1px solid #1a1a1a}
    .btn-secondary:hover{border-color:#333;color:#fff}
    .btn-sm{padding:6px 12px;font-size:12px}
    .btn-danger{background:transparent;color:#ff4444;border:1px solid rgba(255,68,68,0.2)}
    .btn-danger:hover{background:rgba(255,68,68,0.1);border-color:#ff4444}
    .btn:disabled{opacity:0.4;cursor:not-allowed}
    .table-wrap{overflow-x:auto}
    table.data-table{width:100%;border-collapse:collapse;font-size:12px}
    table.data-table th{text-align:left;padding:8px 12px;font-size:10px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #1a1a1a}
    table.data-table td{padding:10px 12px;border-bottom:1px solid #1a1a1a;color:#ccc}
    table.data-table tr{cursor:pointer;transition:background 0.1s}
    table.data-table tr:hover td{background:rgba(255,255,255,0.015)}
    table.data-table tr.no-click{cursor:default}
    table.data-table tr.no-click:hover td{background:transparent}
    .badge{display:inline-flex;align-items:center;padding:2px 7px;font-size:10px;font-weight:600;border:1px solid}
    .badge-neon{background:rgba(0,240,255,0.06);color:#00f0ff;border-color:rgba(0,240,255,0.15)}
    .badge-blue{background:rgba(59,130,246,0.06);color:#60a5fa;border-color:rgba(59,130,246,0.15)}
    .badge-green{background:rgba(34,197,94,0.06);color:#22c55e;border-color:rgba(34,197,94,0.15)}
    .badge-red{background:rgba(239,68,68,0.06);color:#ff4444;border-color:rgba(239,68,68,0.15)}
    .badge-gray{background:rgba(255,255,255,0.04);color:#888;border-color:#1a1a1a}
    .badge-amber{background:rgba(245,158,11,0.06);color:#fbbf24;border-color:rgba(245,158,11,0.15)}
    .kanban{display:flex;gap:12px;overflow-x:auto;padding-bottom:12px;min-height:calc(100vh - 160px)}
    .kanban-col{min-width:260px;max-width:260px;flex-shrink:0;background:#0a0a0a;border:1px solid #1a1a1a;display:flex;flex-direction:column;max-height:calc(100vh - 140px)}
    .kanban-col-header{padding:12px 14px;border-bottom:1px solid #1a1a1a}
    .kanban-col-title{font-size:12px;font-weight:700;text-transform:capitalize;margin-bottom:2px}
    .kanban-col-meta{font-size:11px;color:#666}
    .kanban-cards{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px}
    .deal-card{background:#000;border:1px solid #1a1a1a;padding:12px;cursor:pointer;transition:border-color 0.12s}
    .deal-card:hover{border-color:#00f0ff}
    .deal-card-client{font-size:10px;color:#666;margin-bottom:3px}
    .deal-card-title{font-size:12px;font-weight:600;margin-bottom:8px;line-height:1.3}
    .deal-card-footer{display:flex;align-items:center;justify-content:space-between;gap:6px}
    .deal-card-amount{font-size:13px;font-weight:600;color:#00f0ff}
    .deal-card-days{font-size:10px;color:#444}
    .activity-item{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #1a1a1a;font-size:12px}
    .activity-item:last-child{border-bottom:none}
    .activity-dot{width:6px;height:6px;background:#00f0ff;margin-top:5px;flex-shrink:0}
    .activity-text{color:#ccc;line-height:1.4}
    .activity-meta{font-size:10px;color:#555;margin-top:3px}
    .drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;opacity:0;pointer-events:none;transition:opacity 0.2s}
    .drawer-overlay.open{opacity:1;pointer-events:auto}
    .drawer{position:fixed;top:0;right:-480px;width:480px;max-width:100vw;height:100vh;background:#0a0a0a;border-left:1px solid #1a1a1a;z-index:201;transition:right 0.25s ease;display:flex;flex-direction:column}
    .drawer.open{right:0}
    .drawer-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #1a1a1a}
    .drawer-header h3{font-size:15px;font-weight:700}
    .drawer-close{background:none;border:none;color:#666;font-size:18px;cursor:pointer;padding:2px 6px}
    .drawer-close:hover{color:#fff}
    .drawer-body{flex:1;overflow-y:auto;padding:20px}
    .drawer-section{margin-bottom:20px}
    .drawer-section-title{font-size:10px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px}
    .detail-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1a1a1a;font-size:12px}
    .detail-row:last-child{border-bottom:none}
    .detail-label{color:#666}
    .detail-value{color:#fff;text-align:right;max-width:60%}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:300;display:none;align-items:center;justify-content:center;padding:20px}
    .modal-overlay.open{display:flex}
    .modal{background:#0a0a0a;border:1px solid #1a1a1a;width:100%;max-width:500px;max-height:90vh;overflow-y:auto}
    .modal-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #1a1a1a}
    .modal-header h3{font-size:15px;font-weight:700}
    .modal-body{padding:20px}
    .modal-footer{display:flex;gap:8px;justify-content:flex-end;padding:12px 20px;border-top:1px solid #1a1a1a}
    .toast{position:fixed;bottom:24px;right:24px;padding:10px 14px;font-size:12px;font-weight:500;display:none;z-index:1000;animation:fadeIn 0.2s ease;max-width:320px;border:1px solid}
    .toast.success{background:#0a1a0a;color:#00f0ff;border-color:rgba(0,240,255,0.2)}
    .toast.error{background:#1a0a0a;color:#ff4444;border-color:rgba(255,68,68,0.2)}
    .toast.show{display:block}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
    .skeleton{background:#0a0a0a;border:1px solid #1a1a1a}
    .skeleton-stat{height:70px}
    .skeleton-row{height:38px;margin-bottom:6px}
    .skeleton-card{height:100px;margin-bottom:8px}
    .search-dropdown{position:relative}
    .search-dropdown-list{position:absolute;top:100%;left:0;right:0;background:#0a0a0a;border:1px solid #1a1a1a;max-height:180px;overflow-y:auto;z-index:50;display:none;margin-top:2px}
    .search-dropdown-list.open{display:block}
    .search-dropdown-item{padding:8px 12px;font-size:12px;cursor:pointer;border-bottom:1px solid #1a1a1a}
    .search-dropdown-item:hover{background:rgba(0,240,255,0.06);color:#00f0ff}
    .search-dropdown-item:last-child{border-bottom:none}
    .empty-state{text-align:center;padding:40px 20px;color:#666;font-size:13px}
    .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .pill{display:inline-block;padding:2px 8px;font-size:10px;font-weight:600;border:1px solid #1a1a1a;color:#888;margin-right:4px;margin-bottom:4px}
    .pill.active{border-color:#00f0ff;color:#00f0ff;background:rgba(0,240,255,0.06)}
    .text-accent{color:#00f0ff}
    .text-muted{color:#666}
    .text-sm{font-size:12px}
    .mb-8{margin-bottom:8px}
    .mb-16{margin-bottom:16px}
    .flex{display:flex}
    .flex-between{display:flex;justify-content:space-between;align-items:center}
    .gap-8{gap:8px}
    .gap-12{gap:12px}
    .mt-8{margin-top:8px}
    .w-full{width:100%}
    .truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .progress-bar{height:6px;background:#1a1a1a;border-radius:3px;overflow:hidden;display:inline-block;vertical-align:middle}
    .progress-bar .progress-fill{height:100%;background:#00f0ff;border-radius:3px;transition:width 0.3s}
    .kb-layout{display:flex;gap:0;min-height:calc(100vh - 100px)}
    .kb-sidebar{width:200px;flex-shrink:0;border-right:1px solid #1a1a1a;padding:16px 0}
    .kb-sidebar-title{font-size:10px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.05em;padding:0 16px 10px}
    .kb-sidebar-item{display:block;width:100%;padding:7px 16px;font-size:12px;color:#666;border:none;background:none;text-align:left;cursor:pointer;font-family:inherit;border-left:2px solid transparent;transition:all 0.1s}
    .kb-sidebar-item:hover{color:#fff;background:rgba(255,255,255,0.02)}
    .kb-sidebar-item.active{color:#fff;border-left-color:#00f0ff;background:rgba(0,240,255,0.04)}
    .kb-sidebar-count{float:right;font-size:10px;color:#444;margin-top:1px}
    .kb-main{flex:1;padding:0 24px 40px;overflow-y:auto}
    .kb-type-pills{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
    .kb-pill{padding:4px 12px;font-size:11px;font-weight:500;border:1px solid #1a1a1a;background:transparent;color:#666;cursor:pointer;font-family:inherit;transition:all 0.1s}
    .kb-pill:hover{border-color:#333;color:#fff}
    .kb-pill.active{background:rgba(0,240,255,0.06);color:#00f0ff;border-color:rgba(0,240,255,0.15)}
    .kb-article-item{padding:14px 16px;border:1px solid #1a1a1a;background:#0a0a0a;margin-bottom:8px;cursor:pointer;transition:border-color 0.12s}
    .kb-article-item:hover{border-color:#00f0ff}
    .kb-article-item-title{font-size:13px;font-weight:600;margin-bottom:4px}
    .kb-article-item-meta{font-size:11px;color:#555}
    .kb-article-item-tags{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}
    .kb-content{font-size:13px;line-height:1.7;color:#ccc;white-space:pre-wrap}
    .kb-content h1,.kb-content h2,.kb-content h3{color:#fff;margin:20px 0 10px}
    .kb-content h1{font-size:18px}
    .kb-content h2{font-size:16px}
    .kb-content h3{font-size:14px}
    .kb-content p{margin-bottom:12px}
    .kb-content ul,.kb-content ol{padding-left:20px;margin-bottom:12px}
    .kb-content li{margin-bottom:4px}
    .kb-content strong{color:#fff}
    .kb-content code{background:#000;padding:1px 5px;font-size:12px;color:#00f0ff}
    .kb-content pre{background:#000;padding:12px;overflow-x:auto;margin:12px 0;border:1px solid #1a1a1a;font-size:12px;color:#ccc}
    .kb-content pre code{background:transparent;padding:0;color:inherit}
    .kb-content hr{border:none;border-top:1px solid #1a1a1a;margin:20px 0}
    .kb-content blockquote{border-left:2px solid #00f0ff;padding:4px 16px;margin:12px 0;color:#888;background:rgba(0,240,255,0.02)}
    @media(max-width:1100px){.stat-grid{grid-template-columns:repeat(2,1fr)}.grid-2{grid-template-columns:1fr}}
    @media(max-width:768px){.sidebar{display:none}.main{margin-left:0;padding:16px}.stat-grid{grid-template-columns:1fr}.drawer{width:100vw;right:-100vw}.kb-layout{flex-direction:column}.kb-sidebar{width:100%;border-right:none;border-bottom:1px solid #1a1a1a;display:flex;flex-wrap:wrap;gap:0;padding:8px}.kb-sidebar-title{display:none}.kb-sidebar-item{flex:1;min-width:80px;text-align:center;border-left:none;border-bottom:2px solid transparent;padding:6px 8px;font-size:11px}.kb-sidebar-item.active{border-left-color:transparent;border-bottom-color:#00f0ff}.kb-main{padding:16px}}
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <h1>FLODON</h1>
        <p>CRM</p>
      </div>
      <nav class="sidebar-nav" id="sidebar-nav">
        <a href="#dashboard" data-route="dashboard">Dashboard</a>
        <a href="#pipeline" data-route="pipeline">Pipeline</a>
        <a href="#clients" data-route="clients">Clients</a>
        <a href="#companies" data-route="companies">Companies</a>
        <a href="#deals" data-route="deals">Deals</a>
        <a href="#projects" data-route="projects">Projects</a>
        <a href="#calls" data-route="calls">Calls</a>
        <a href="#tasks" data-route="tasks">Tasks</a>
        <a href="#timesheet" data-route="timesheet">Timesheet</a>
        <a href="#nurture" data-route="nurture">Nurture List</a>
        <a href="#portal" data-route="portal">Portal</a>
        <a href="#email-queue" data-route="email-queue">Email Queue</a>
        <a href="#revenue" data-route="revenue">Revenue</a>
        <a href="#anomalies" data-route="anomalies">Anomalies</a>
        <a href="#kb" data-route="kb">Knowledge Base</a>
        <a href="#settings" data-route="settings">Settings</a>
      </nav>
    </aside>

    <main class="main" id="main-content"></main>
  </div>

  <div class="drawer-overlay" id="drawer-overlay" onclick="closeDrawer()"></div>
  <div class="drawer" id="drawer">
    <div class="drawer-header">
      <h3 id="drawer-title">Details</h3>
      <button class="drawer-close" onclick="closeDrawer()">&times;</button>
    </div>
    <div class="drawer-body" id="drawer-body"></div>
  </div>

  <div class="modal-overlay" id="modal-overlay" onclick="if(event.target===this)closeModal()">
    <div class="modal" id="modal">
      <div class="modal-header">
        <h3 id="modal-title">Modal</h3>
        <button class="drawer-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body" id="modal-body"></div>
      <div class="modal-footer" id="modal-footer"></div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    var API = window.location.origin + '/crm/api'
    var OS_API = window.location.origin + '/api'
    var DEAL_STAGES = ['lead', 'contacted', 'demo', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
    var CLIENT_STAGES = ['lead', 'contacted', 'demo', 'proposal', 'negotiation', 'won', 'lost', 'call_booked']
    var PRIORITIES = ['low', 'medium', 'high', 'urgent']
    var cachedCompanies = null
    var cachedClients = null

    var routes = {
      dashboard: renderDashboard,
      pipeline: renderPipeline,
      clients: renderClients,
      companies: renderCompanies,
      deals: renderDeals,
      projects: renderProjects,
      calls: renderCalls,
      tasks: renderTasks,
      timesheet: renderTimesheet,
      portal: renderPortal,
      nurture: renderNurture,
      'email-queue': renderEmailQueue,
      revenue: renderRevenue,
      anomalies: renderAnomalies,
      kb: renderKB,
      settings: renderSettings,
    }

    function route(){
      var hash = window.location.hash.slice(1) || 'dashboard'
      document.querySelectorAll('.sidebar-nav a').forEach(function(a){a.classList.remove('active')})
      var nav = document.querySelector('.sidebar-nav a[data-route="'+hash+'"]')
      if(nav) nav.classList.add('active')
      var fn = routes[hash]
      if(fn) fn()
    }

    window.addEventListener('hashchange', route)

    function esc(s){return s!=null?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''}

    function v(m,f){var r=m.value;if(f){r=parseInt(r,10);return isNaN(r)?null:r}return r||null}

    function s(m,v){m.value=v!=null?String(v):''}

    function show(id){document.getElementById(id).classList.add('open')}
    function hide(id){document.getElementById(id).classList.remove('open')}
    function toggle(id){document.getElementById(id).classList.toggle('open')}

    function openDrawer(title,html){
      document.getElementById('drawer-title').textContent=title
      document.getElementById('drawer-body').innerHTML=html
      show('drawer-overlay');show('drawer')
    }
    function closeDrawer(){hide('drawer-overlay');hide('drawer')}

    function openModal(title,bodyHtml,footerHtml){
      document.getElementById('modal-title').textContent=title
      document.getElementById('modal-body').innerHTML=bodyHtml
      document.getElementById('modal-footer').innerHTML=footerHtml||''
      show('modal-overlay')
    }
    function closeModal(){hide('modal-overlay')}

    function toast(m,t){
      var el=document.getElementById('toast')
      el.textContent=m;el.className='toast show '+(t||'success')
      setTimeout(function(){el.className='toast'},3000)
    }

    function stageBadge(stage,small){
      var colors={lead:'badge-gray',contacted:'badge-blue',demo:'badge-neon',proposal:'badge-amber',negotiation:'badge-amber',closed_won:'badge-green',closed_lost:'badge-red',won:'badge-green',lost:'badge-red',call_booked:'badge-blue',booked:'badge-blue',completed:'badge-green',cancelled:'badge-red',noshowed:'badge-red',interested:'badge-green',not_interested:'badge-red',follow_up_needed:'badge-amber',pending:'badge-gray',done:'badge-green',queued:'badge-gray',sending:'badge-blue',sent:'badge-green',failed:'badge-red'}
      return '<span class="badge '+(colors[stage]||'badge-gray')+'">'+esc(stage).replace(/_/g,' ')+'</span>'
    }

    function fmtDate(d){if(!d)return'—';try{return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}catch(e){return d}}
    function fmtINR(n){return'₹'+Number(n||0).toLocaleString('en-IN')}

    async function api(method,path,body){
      var opts={method:method,headers:{'Content-Type':'application/json'}}
      if(body&&method!=='GET')opts.body=JSON.stringify(body)
      var r=await fetch(API+path,opts)
      var d=await r.json()
      if(!d.success&&d.error)throw new Error(d.error)
      return d.data||d
    }

    function osApi(method,path,body){
      var opts={method:method,headers:{'Content-Type':'application/json'}}
      if(body&&method!=='GET')opts.body=JSON.stringify(body)
      return fetch(OS_API+path,opts).then(function(r){return r.json()}).then(function(d){if(!d.success&&d.error)throw new Error(d.error);return d.data||d})
    }

    // ─── Loader ───
    function showLoader(el,skeletonCount,type){
      var html=''
      for(var i=0;i<skeletonCount;i++){
        html+='<div class="skeleton skeleton-'+(type||'row')+'" style="margin-bottom:8px"></div>'
      }
      el.innerHTML=html
    }

    // ─── DASHBOARD ───
    function renderDashboard(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Dashboard</h2><p>Pipeline overview and key metrics</p></div></div><div class="stat-grid" id="dash-stats"></div><div class="grid-2"><div class="card" id="dash-pipeline-card"><div class="card-title">Pipeline by Stage</div><div id="dash-pipeline"></div></div><div class="card"><div class="card-title">Recent Activity</div><div id="dash-activity"></div></div></div>'
      showLoader(document.getElementById('dash-stats'),4,'stat')
      showLoader(document.getElementById('dash-pipeline'),5,'row')
      showLoader(document.getElementById('dash-activity'),4,'row')

      api('GET','/dashboard-stats').then(function(data){
        data=data||{}
        document.getElementById('dash-stats').innerHTML=
          '<div class="stat-card"><div class="stat-label">Pipeline Value</div><div class="stat-value">'+fmtINR(data.pipeline_value)+'</div></div>'+
          '<div class="stat-card"><div class="stat-label">Conversion Rate</div><div class="stat-value">'+(data.conversion_rate||'0')+'%</div></div>'+
          '<div class="stat-card"><div class="stat-label">Avg Deal Size</div><div class="stat-value">'+fmtINR(data.avg_deal_size)+'</div></div>'+
          '<div class="stat-card"><div class="stat-label">New Clients (Week)</div><div class="stat-value">'+(data.newClientsThisWeek||0)+'</div></div>'

        var stages=data.deals_by_stage||{}
        var maxCount=Math.max(1,...Object.values(stages))
        var pipeHtml=DEAL_STAGES.map(function(s){
          var c=stages[s]||0
          var p=Math.round(c/maxCount*100)
          return '<div class="stage-bar"><div class="stage-bar-header"><span class="stage-bar-label">'+s.replace(/_/g,' ')+'</span><span class="stage-bar-count">'+c+'</span></div><div class="stage-bar-track"><div class="stage-bar-fill" style="width:'+p+'%"></div></div></div>'
        }).join('')
        document.getElementById('dash-pipeline').innerHTML=pipeHtml

        var act=(data.recent_activity||data.recentActivity||[]).map(function(a){
          return '<div class="activity-item"><div class="activity-dot"></div><div><div class="activity-text">'+esc(a.metadata?.name||a.action)+' <span class="text-muted">'+esc(a.action).replace(/_/g,' ')+'</span></div><div class="activity-meta">'+fmtDate(a.created_at)+'</div></div></div>'
        }).join('')||'<div class="empty-state">No recent activity</div>'
        document.getElementById('dash-activity').innerHTML=act
      }).catch(function(e){document.getElementById('dash-stats').innerHTML='<div class="empty-state">Failed to load: '+e.message+'</div>'})
    }

    // ─── PIPELINE (Kanban) ───
    function renderPipeline(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Pipeline</h2><p>Drag deals through stages</p></div></div><div class="kanban" id="kanban">'+DEAL_STAGES.map(function(s){return '<div class="kanban-col"><div class="kanban-col-header"><div class="kanban-col-title">'+s.replace(/_/g,' ')+'</div><div class="kanban-col-meta" id="k-count-'+s+'">0</div></div><div class="kanban-cards" id="k-cards-'+s+'"><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div></div></div>'}).join('')+'</div>'
      api('GET','/pipeline').then(function(data){
        data=data||{}
        DEAL_STAGES.forEach(function(s){
          var deals=data[s]||[]
          document.getElementById('k-count-'+s).textContent=deals.length
          document.getElementById('k-cards-'+s).innerHTML=deals.map(function(d){
            var days=d.updated_at?Math.round((Date.now()-new Date(d.updated_at).getTime())/86400000):'—'
            return '<div class="deal-card" onclick="openDealDetail(\''+d.id+'\')"><div class="deal-card-client">'+esc(d.client_name||'Unknown')+'</div><div class="deal-card-title">'+esc(d.title||'Untitled')+'</div><div class="deal-card-footer"><span class="deal-card-amount">'+fmtINR(d.amount_monthly)+'</span><span class="deal-card-days">'+days+'d</span></div></div>'
          }).join('')||'<div class="empty-state">No deals</div>'
        })
      }).catch(function(e){toast(e.message,'error')})
    }

    function openDealDetail(id){
      api('GET','/deals?stage=all').then(function(deals){
        var d=Array.isArray(deals)?deals.find(function(x){return x.id===id}):null
        if(!d){toast('Deal not found','error');return}
        openDrawer(d.title||'Deal Details',
          '<div class="drawer-section"><div class="drawer-section-title">Deal Info</div>'+
          '<div class="detail-row"><span class="detail-label">Client</span><span class="detail-value">'+esc(d.client_name||'—')+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value">'+fmtINR(d.amount_monthly)+'/mo</span></div>'+
          '<div class="detail-row"><span class="detail-label">Stage</span><span class="detail-value">'+stageBadge(d.stage)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Probability</span><span class="detail-value">'+(d.probability||'—')+'%</span></div>'+
          '<div class="detail-row"><span class="detail-label">Expected Close</span><span class="detail-value">'+fmtDate(d.expected_close)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Assigned</span><span class="detail-value">'+esc(d.assigned_name||'—')+'</span></div></div>')
      }).catch(function(e){toast(e.message,'error')})
    }

    // ─── CLIENTS ───
    var clientPage=1,clientSearch='',clientStage='',clientNurture='false'

    function renderClients(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Clients</h2><p>Manage leads and clients</p></div><div class="flex gap-8"><button class="btn btn-accent btn-sm" onclick="openClientForm()">+ Add Client</button><button class="btn btn-secondary btn-sm" onclick="openNurtureForm()">+ Nurture</button></div></div>'+
        '<div class="filters">'+
        '<input type="text" id="client-search" placeholder="Search name, email, company..." oninput="clientSearch=this.value;clientPage=1;loadClients()">'+
        '<select id="client-stage-filter" onchange="clientStage=this.value;clientPage=1;loadClients()"><option value="">All stages</option>'+CLIENT_STAGES.map(function(s){return '<option value="'+s+'">'+s.replace(/_/g,' ')+'</option>'}).join('')+'</select>'+
        '<select onchange="clientNurture=this.value;clientPage=1;loadClients()"><option value="false">Main pipeline</option><option value="true">Nurture only</option><option value="">All</option></select></div>'+
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Stage</th><th>Source</th><th>Score</th><th>Created</th></tr></thead><tbody id="client-tbody"></tbody></table></div>'+
        '<div class="flex-between mt-8 text-sm text-muted" id="client-pagination"></div>'
      clientPage=1;loadClients()
    }

    function loadClients(){
      var tbody=document.getElementById('client-tbody')
      tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:32px;color:#555">Loading...</td></tr>'
      var params='?page='+clientPage+'&nurture='+clientNurture
      if(clientSearch)params+='&search='+encodeURIComponent(clientSearch)
      if(clientStage)params+='&stage='+clientStage
      api('GET','/clients'+params).then(function(d){
        d=d||{clients:[],total:0,totalPages:1}
        tbody.innerHTML=d.clients.map(function(c){
          return '<tr onclick="openClientDetail(\''+c.id+'\')"><td><strong>'+esc(c.name)+'</strong>'+(c.company_name?'<br><span class="text-muted text-sm">'+esc(c.company_name)+'</span>':'')+'</td><td class="text-muted">'+esc(c.email||'—')+'</td><td>'+stageBadge(c.pipeline_stage)+'</td><td class="text-muted">'+(c.lead_source||'manual')+'</td><td>'+(c.lead_score!=null?'<span class="text-accent">'+c.lead_score+'</span>':'—')+'</td><td class="text-muted">'+fmtDate(c.created_at)+'</td></tr>'
        }).join('')||'<tr><td colspan="6" class="empty-state">No clients found</td></tr>'
        document.getElementById('client-pagination').innerHTML='<span>'+(d.total||0)+' total</span><span>Page '+clientPage+' of '+(d.totalPages||1)+' <button class="btn btn-sm btn-secondary" onclick="if(clientPage>1){clientPage--;loadClients()}">&larr;</button> <button class="btn btn-sm btn-secondary" onclick="if(clientPage<'+(d.totalPages||1)+'){clientPage++;loadClients()}">&rarr;</button></span>'
      }).catch(function(e){tbody.innerHTML='<tr><td colspan="6" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function openClientDetail(id){
      api('GET','/clients?search='+id).then(function(d){
        var c=d.clients?d.clients[0]:null
        if(!c){toast('Client not found','error');return}
        openDrawer(esc(c.name),
          '<div class="drawer-section"><div class="drawer-section-title">Contact</div>'+
          '<div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">'+esc(c.email||'—')+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">'+esc(c.phone||'—')+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">'+esc(c.company_name||'—')+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Role</span><span class="detail-value">'+esc(c.role||'—')+'</span></div></div>'+
          '<div class="drawer-section"><div class="drawer-section-title">Pipeline</div>'+
          '<div class="detail-row"><span class="detail-label">Stage</span><span class="detail-value">'+stageBadge(c.pipeline_stage)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Source</span><span class="detail-value">'+esc(c.lead_source||'—')+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Lead Score</span><span class="detail-value">'+(c.lead_score!=null?'<span class="text-accent">'+c.lead_score+'</span>':'—')+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Churn Risk</span><span class="detail-value">'+(c.churn_risk!=null?(c.churn_risk*100).toFixed(0)+'%':'—')+'</span></div></div>'+
          '<div class="drawer-section"><div class="drawer-section-title">Notes</div><p class="text-sm text-muted">'+esc(c.notes||'No notes')+'</p></div>'+
          '<div class="flex gap-8" style="flex-wrap:wrap"><button class="btn btn-sm btn-accent" onclick="closeDrawer();editClient(\''+c.id+'\')">Edit</button><button class="btn btn-sm btn-secondary" onclick="closeDrawer();updateClientStage(\''+c.id+'\',\''+c.pipeline_stage+'\')">Move Stage</button><button class="btn btn-sm btn-secondary" onclick="scoreLead(\''+c.id+'\')">Score Lead</button><button class="btn btn-sm btn-secondary" onclick="churnRisk(\''+c.id+'\')">Churn Risk</button></div>')
      }).catch(function(e){toast(e.message,'error')})
    }

    function openClientForm(){
      openModal('New Client',
        '<div class="field"><label>Name</label><input id="cf-name" placeholder="Client name"></div>'+
        '<div class="field-row"><div class="field"><label>Email</label><input id="cf-email" type="email" placeholder="email@example.com"></div><div class="field"><label>Phone</label><input id="cf-phone" placeholder="+91..."></div></div>'+
        '<div class="field-row"><div class="field"><label>Company</label><input id="cf-company" placeholder="Company name"></div><div class="field"><label>Role</label><input id="cf-role" placeholder="Role"></div></div>'+
        '<div class="field-row"><div class="field"><label>Industry</label><input id="cf-industry" placeholder="Industry"></div><div class="field"><label>Source</label><select id="cf-source"><option value="manual">Manual</option><option value="website">Website</option><option value="referral">Referral</option></select></div></div>'+
        '<div class="field"><label>Service</label><input id="cf-service" placeholder="Service"></div>'+
        '<div class="field"><label>Notes</label><textarea id="cf-notes" placeholder="Notes..."></textarea></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveClient()">Create Client</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveClient(){
      var body={name:document.getElementById('cf-name').value.trim(),email:document.getElementById('cf-email').value.trim(),phone:document.getElementById('cf-phone').value.trim(),company_name:document.getElementById('cf-company').value.trim(),role:document.getElementById('cf-role').value.trim(),industry:document.getElementById('cf-industry').value.trim(),source:document.getElementById('cf-source').value,service:document.getElementById('cf-service').value.trim(),notes:document.getElementById('cf-notes').value.trim()}
      if(!body.name){toast('Name is required','error');return}
      api('POST','/clients',body).then(function(){toast('Client created','success');closeModal();loadClients()}).catch(function(e){toast(e.message,'error')})
    }

    function openNurtureForm(){
      openModal('Add to Nurture',
        '<div class="field"><label>Client Name</label><input id="nf-name" placeholder="Client name"></div>'+
        '<div class="field"><label>Email</label><input id="nf-email" type="email" placeholder="email@example.com"></div>'+
        '<div class="field"><label>Phone</label><input id="nf-phone" placeholder="+91..."></div>'+
        '<p class="text-sm text-muted">Nurture leads receive automated value emails.</p>',
        '<button class="btn btn-primary btn-sm" onclick="saveNurture()">Add to Nurture</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveNurture(){
      var name=document.getElementById('nf-name').value.trim()
      if(!name){toast('Name is required','error');return}
      api('POST','/clients',{name:name,email:document.getElementById('nf-email').value.trim(),phone:document.getElementById('nf-phone').value.trim(),is_nurture:true,source:'manual',pipeline_stage:'lead'}).then(function(){toast('Added to nurture','success');closeModal();loadClients()}).catch(function(e){toast(e.message,'error')})
    }

    function editClient(id){
      api('GET','/clients?search='+id).then(function(d){
        var c=d.clients?d.clients[0]:null
        if(!c)return
        openModal('Edit: '+esc(c.name),
          '<div class="field"><label>Name</label><input id="ef-name" value="'+esc(c.name)+'"></div>'+
          '<div class="field-row"><div class="field"><label>Email</label><input id="ef-email" value="'+esc(c.email||'')+'"></div><div class="field"><label>Phone</label><input id="ef-phone" value="'+esc(c.phone||'')+'"></div></div>'+
          '<div class="field-row"><div class="field"><label>Company</label><input id="ef-company" value="'+esc(c.company_name||'')+'"></div><div class="field"><label>Stage</label><select id="ef-stage">'+CLIENT_STAGES.map(function(s){return '<option value="'+s+'"'+(s===c.pipeline_stage?' selected':'')+'>'+s.replace(/_/g,' ')+'</option>'}).join('')+'</select></div></div>'+
          '<div class="field"><label>Notes</label><textarea id="ef-notes">'+esc(c.notes||'')+'</textarea></div>',
          '<button class="btn btn-primary btn-sm" onclick="saveEditClient(\''+id+'\')">Save</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
      }).catch(function(e){toast(e.message,'error')})
    }

    function saveEditClient(id){
      var body={name:document.getElementById('ef-name').value.trim(),email:document.getElementById('ef-email').value.trim(),phone:document.getElementById('ef-phone').value.trim(),company_name:document.getElementById('ef-company').value.trim(),pipeline_stage:document.getElementById('ef-stage').value,notes:document.getElementById('ef-notes').value.trim()}
      api('PATCH','/clients/'+id,body).then(function(){toast('Client updated','success');closeModal();loadClients()}).catch(function(e){toast(e.message,'error')})
    }

    function updateClientStage(id,current){
      openModal('Move Stage',
        '<div class="field"><label>New Stage</label><select id="ms-stage">'+CLIENT_STAGES.map(function(s){return '<option value="'+s+'"'+(s===current?' selected':'')+'>'+s.replace(/_/g,' ')+'</option>'}).join('')+'</select></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveClientStage(\''+id+'\')">Update</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveClientStage(id){
      api('PATCH','/clients/'+id,{pipeline_stage:document.getElementById('ms-stage').value}).then(function(){toast('Stage updated','success');closeModal();loadClients()}).catch(function(e){toast(e.message,'error')})
    }

    function scoreLead(id){
      osApi('POST','/leads/'+id+'/score').then(function(d){
        toast('Lead score: '+(d.lead_score||'calculated'),'success')
      }).catch(function(e){toast(e.message,'error')})
    }

    function churnRisk(id){
      osApi('POST','/clients/'+id+'/churn-risk').then(function(d){
        toast('Churn risk: '+((d.churn_risk||0)*100).toFixed(0)+'%','success')
      }).catch(function(e){toast(e.message,'error')})
    }

    // ─── COMPANIES ───
    function renderCompanies(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Companies</h2><p>Organization directory</p></div><button class="btn btn-accent btn-sm" onclick="openCompanyForm()">+ Add Company</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Industry</th><th>Clients</th><th>Website</th></tr></thead><tbody id="company-tbody"><tr><td colspan="4" style="text-align:center;padding:32px;color:#555">Loading...</td></tr></tbody></table></div>'
      api('GET','/companies').then(function(data){
        data=data||[]
        document.getElementById('company-tbody').innerHTML=data.map(function(c){
          return '<tr class="no-click"><td><strong>'+esc(c.name)+'</strong></td><td class="text-muted">'+esc(c.industry||'—')+'</td><td><span class="text-accent">'+c.client_count+'</span></td><td class="text-muted">'+(c.website?'<a href="'+esc(c.website)+'" target="_blank">'+esc(c.website)+'</a>':'—')+'</td></tr>'
        }).join('')||'<tr><td colspan="4" class="empty-state">No companies yet</td></tr>'
      }).catch(function(e){document.getElementById('company-tbody').innerHTML='<tr><td colspan="4" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function openCompanyForm(){
      openModal('New Company','<div class="field"><label>Company Name</label><input id="comp-name" placeholder="Company name"></div><div class="field"><label>Industry</label><input id="comp-industry" placeholder="Industry"></div><div class="field"><label>Website</label><input id="comp-website" placeholder="https://"></div>','<button class="btn btn-primary btn-sm" onclick="saveCompany()">Create</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveCompany(){
      var n=document.getElementById('comp-name').value.trim()
      if(!n){toast('Name required','error');return}
      api('POST','/companies',{name:n,industry:document.getElementById('comp-industry').value.trim(),website:document.getElementById('comp-website').value.trim()}).then(function(){toast('Company created','success');closeModal();renderCompanies()}).catch(function(e){toast(e.message,'error')})
    }

    // ─── DEALS ───
    function renderDeals(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Deals</h2><p>Track all deals</p></div><button class="btn btn-accent btn-sm" onclick="openDealForm()">+ New Deal</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Title</th><th>Client</th><th>Amount</th><th>Stage</th><th>Probability</th><th>Assigned</th><th>Updated</th></tr></thead><tbody id="deals-tbody"><tr><td colspan="7" style="text-align:center;padding:32px;color:#555">Loading...</td></tr></tbody></table></div>'
      api('GET','/deals').then(function(data){
        data=data||[]
        document.getElementById('deals-tbody').innerHTML=data.map(function(d){
          return '<tr onclick="openDealDetail(\''+d.id+'\')"><td><strong>'+esc(d.title||'Untitled')+'</strong></td><td class="text-muted">'+esc(d.client_name||'—')+'</td><td class="text-accent">'+fmtINR(d.amount_monthly)+'</td><td>'+stageBadge(d.stage)+'</td><td class="text-muted">'+(d.probability||'—')+'%</td><td class="text-muted">'+esc(d.assigned_name||'—')+'</td><td class="text-muted">'+fmtDate(d.updated_at)+'</td></tr>'
        }).join('')||'<tr><td colspan="7" class="empty-state">No deals yet</td></tr>'
      }).catch(function(e){document.getElementById('deals-tbody').innerHTML='<tr><td colspan="7" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function openDealForm(){
      openModal('New Deal',
        '<div class="field"><label>Title</label><input id="df-title" placeholder="Deal title"></div><div class="field-row"><div class="field"><label>Client</label><input id="df-client" placeholder="Client name" list="client-list"><datalist id="client-list"></datalist></div><div class="field"><label>Amount (MRR)</label><input id="df-amount" type="number" placeholder="5000"></div></div><div class="field-row"><div class="field"><label>Stage</label><select id="df-stage">'+DEAL_STAGES.map(function(s){return '<option value="'+s+'">'+s.replace(/_/g,' ')+'</option>'}).join('')+'</select></div><div class="field"><label>Probability</label><input id="df-prob" type="number" placeholder="50" min="0" max="100"></div></div><div class="field-row"><div class="field"><label>Venture</label><select id="df-venture"><option value="FLODON">FLODON</option><option value="SYNTHORY">SYNTHORY</option><option value="VYRE">VYRE</option></select></div><div class="field"><label>Expected Close</label><input id="df-close" type="date"></div></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveDeal()">Create Deal</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveDeal(){
      var body={title:document.getElementById('df-title').value.trim(),client_name:document.getElementById('df-client').value.trim(),amount_monthly:parseFloat(document.getElementById('df-amount').value)||0,stage:document.getElementById('df-stage').value,probability:parseInt(document.getElementById('df-prob').value)||50,venture:document.getElementById('df-venture').value}
      if(!body.title){toast('Title required','error');return}
      api('POST','/deals',body).then(function(){toast('Deal created','success');closeModal();renderDeals()}).catch(function(e){toast(e.message,'error')})
    }

    // ─── REVENUE INTELLIGENCE ───
    function renderRevenue(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Revenue Intelligence</h2><p>MRR, pipeline velocity, forecasts</p></div><div class="flex gap-8"><button class="btn btn-accent btn-sm" onclick="triggerForecast()">Generate Forecast</button><button class="btn btn-secondary btn-sm" onclick="triggerRescore()">Rescore All Leads</button></div></div><div class="stat-grid" id="rev-stats"></div><div class="grid-2"><div class="card"><div class="card-title">Pipeline Velocity</div><div id="rev-velocity"></div></div><div class="card"><div class="card-title">Lead Scoring</div><div id="rev-scoring"></div></div></div>'
      osApi('GET','/revenue/snapshot').then(function(d){
        d=d||{}
        document.getElementById('rev-stats').innerHTML=
          '<div class="stat-card"><div class="stat-label">Current MRR</div><div class="stat-value text-accent">'+fmtINR(d.mrr)+'</div></div>'+
          '<div class="stat-card"><div class="stat-label">Pipeline Value</div><div class="stat-value">'+fmtINR(d.pipeline_value)+'</div></div>'+
          '<div class="stat-card"><div class="stat-label">Avg Deal Size</div><div class="stat-value">'+fmtINR(d.avg_deal_size)+'</div></div>'+
          '<div class="stat-card"><div class="stat-label">Win Rate</div><div class="stat-value">'+(d.win_rate||'0')+'%</div></div>'
      }).catch(function(e){document.getElementById('rev-stats').innerHTML='<div class="empty-state">Failed: '+e.message+'</div>'})
      osApi('GET','/revenue/pipeline-velocity').then(function(d){
        d=d||{}
        document.getElementById('rev-velocity').innerHTML=
          '<div class="detail-row"><span class="detail-label">Avg Time to Close</span><span class="detail-value">'+(d.avg_time_to_close!=null?d.avg_time_to_close+' days':'—')+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Deals in Pipeline</span><span class="detail-value">'+(d.total_deals||0)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Velocity Rate</span><span class="detail-value">'+(d.velocity_rate||'0')+' deals/mo</span></div>'+
          '<div class="detail-row"><span class="detail-label">Active Stages</span><span class="detail-value">'+(d.active_stages||0)+'</span></div>'
      }).catch(function(e){document.getElementById('rev-velocity').innerHTML='<div class="empty-state">Failed: '+e.message+'</div>'})
      osApi('GET','/revenue/snapshot').then(function(d){
        var scores=d.lead_scores||{}
        document.getElementById('rev-scoring').innerHTML=
          '<div class="detail-row"><span class="detail-label">Avg Lead Score</span><span class="detail-value">'+(scores.avg_score||'—')+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Leads Scored</span><span class="detail-value">'+(scores.total_scored||0)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Max Score</span><span class="detail-value">'+(scores.max_score||'—')+'</span></div>'
      }).catch(function(e){document.getElementById('rev-scoring').innerHTML='<div class="empty-state">Error</div>'})
    }

    function triggerForecast(){
      osApi('POST','/revenue/forecast').then(function(d){
        toast('Forecast generated. Projected MRR: '+fmtINR(d.predicted_mrr||0),'success')
        renderRevenue()
      }).catch(function(e){toast(e.message,'error')})
    }

    function triggerRescore(){
      osApi('POST','/leads/rescore-all').then(function(d){
        toast('All leads rescored','success')
      }).catch(function(e){toast(e.message,'error')})
    }

    // ─── CALLS ───
    function renderCalls(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Calls</h2><p>Call log</p></div><button class="btn btn-accent btn-sm" onclick="openCallForm()">+ Log Call</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Prospect</th><th>Company</th><th>Status</th><th>Outcome</th><th>Scheduled</th></tr></thead><tbody id="calls-tbody"><tr><td colspan="5" style="text-align:center;padding:32px;color:#555">Loading...</td></tr></tbody></table></div>'
      api('GET','/calls').then(function(data){
        data=data||[]
        document.getElementById('calls-tbody').innerHTML=data.map(function(c){
          return '<tr class="no-click"><td><strong>'+esc(c.client_name||c.prospect_name||'—')+'</strong></td><td class="text-muted">'+esc(c.company_name||'—')+'</td><td>'+stageBadge(c.status)+'</td><td class="text-muted">'+esc(c.outcome?c.outcome.replace(/_/g,' '):'—')+'</td><td class="text-muted">'+fmtDate(c.scheduled_at)+'</td></tr>'
        }).join('')||'<tr><td colspan="5" class="empty-state">No calls logged</td></tr>'
      }).catch(function(e){document.getElementById('calls-tbody').innerHTML='<tr><td colspan="5" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function openCallForm(){
      openModal('Log Call',
        '<div class="field"><label>Prospect Name</label><input id="call-name" placeholder="Name"></div><div class="field-row"><div class="field"><label>Company</label><input id="call-company" placeholder="Company"></div><div class="field"><label>Status</label><select id="call-status"><option value="booked">Booked</option><option value="completed">Completed</option><option value="noshowed">No-show</option><option value="cancelled">Cancelled</option></select></div></div><div class="field-row"><div class="field"><label>Source</label><select id="call-source"><option value="manual">Manual</option><option value="cal.com">Cal.com</option><option value="linkedin">LinkedIn</option><option value="website">Website</option></select></div><div class="field"><label>Outcome</label><select id="call-outcome"><option value="">—</option><option value="interested">Interested</option><option value="not_interested">Not Interested</option><option value="follow_up_needed">Follow-up Needed</option></select></div></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveCall()">Log Call</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveCall(){
      var body={prospect_name:document.getElementById('call-name').value.trim(),company:document.getElementById('call-company').value.trim(),status:document.getElementById('call-status').value,source:document.getElementById('call-source').value,outcome:document.getElementById('call-outcome').value||null}
      if(!body.prospect_name){toast('Name required','error');return}
      api('POST','/calls',body).then(function(){toast('Call logged','success');closeModal();renderCalls()}).catch(function(e){toast(e.message,'error')})
    }

    // ─── TASKS ───
    function renderTasks(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Tasks</h2><p>Follow-ups and action items</p></div><button class="btn btn-accent btn-sm" onclick="openTaskForm()">+ New Task</button></div><div class="filters"><select onchange="renderTasks()" id="task-filter"><option value="">All tasks</option><option value="pending">Pending</option><option value="done">Done</option></select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Title</th><th>Client</th><th>Deal</th><th>Status</th><th>Deadline</th><th></th></tr></thead><tbody id="tasks-tbody"><tr><td colspan="6" style="text-align:center;padding:32px;color:#555">Loading...</td></tr></tbody></table></div>'
      loadTasks()
    }

    function loadTasks(){
      var filter=document.getElementById('task-filter').value
      var url='/tasks'+(filter?'?status='+filter:'')
      api('GET',url).then(function(data){
        data=data||[]
        document.getElementById('tasks-tbody').innerHTML=data.map(function(t){
          return '<tr class="no-click"><td>'+(t.status==='done'?'<s>':'')+'<strong>'+esc(t.title||'Untitled')+'</strong>'+(t.status==='done'?'</s>':'')+'</td><td class="text-muted">'+esc(t.client_name||'—')+'</td><td class="text-muted">'+esc(t.deal_title||'—')+'</td><td>'+stageBadge(t.status)+'</td><td class="text-muted">'+fmtDate(t.deadline)+'</td><td>'+(t.status!=='done'?'<button class="btn btn-sm btn-secondary" onclick="completeTask(\''+t.id+'\')">Done</button>':'')+'</td></tr>'
        }).join('')||'<tr><td colspan="6" class="empty-state">No tasks</td></tr>'
      }).catch(function(e){document.getElementById('tasks-tbody').innerHTML='<tr><td colspan="6" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function completeTask(id){
      api('PATCH','/tasks/'+id,{status:'done'}).then(function(){toast('Task completed','success');loadTasks()}).catch(function(e){toast(e.message,'error')})
    }

    function openTaskForm(){
      openModal('New Task','<div class="field"><label>Title</label><input id="tf-title" placeholder="Task title"></div><div class="field"><label>Client</label><input id="tf-client" placeholder="Client name"></div><div class="field"><label>Deadline</label><input id="tf-deadline" type="date"></div>','<button class="btn btn-primary btn-sm" onclick="saveTask()">Create</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveTask(){
      var body={title:document.getElementById('tf-title').value.trim(),client_name:document.getElementById('tf-client').value.trim(),deadline:document.getElementById('tf-deadline').value||null}
      if(!body.title){toast('Title required','error');return}
      api('POST','/tasks',body).then(function(){toast('Task created','success');closeModal();loadTasks()}).catch(function(e){toast(e.message,'error')})
    }

    // ─── TIMESHEET ───
    var tsPage=1, tsMember='', tsFrom='', tsTo='', tsTimerInterval=null
    function renderTimesheet(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Timesheet</h2><p>Time tracking, timers, and reports</p></div></div>'+
        '<div class="card" id="ts-timer-card"><div class="card-title">Timer <span id="ts-timer-status" class="badge badge-gray">Not running</span></div><div id="ts-timer-body"><div class="flex gap-8" style="flex-wrap:wrap"><input type="text" id="ts-timer-desc" placeholder="What are you working on?" style="flex:2;min-width:150px;padding:8px 12px;background:#000;border:1px solid #1a1a1a;color:#fff;font-size:13px;font-family:inherit;outline:none"><input type="text" id="ts-timer-member" placeholder="Your name" style="flex:1;min-width:100px;padding:8px 12px;background:#000;border:1px solid #1a1a1a;color:#fff;font-size:13px;font-family:inherit;outline:none"><button class="btn btn-accent btn-sm" onclick="startTimer()" id="ts-start-btn">Start</button><button class="btn btn-secondary btn-sm" onclick="stopTimer()" id="ts-stop-btn" style="display:none">Stop</button></div><div id="ts-timer-elapsed" class="text-sm text-muted mt-8" style="font-family:monospace;font-size:18px;color:#00f0ff"></div></div></div>'+
        '<div class="filters flex gap-8" style="flex-wrap:wrap;align-items:center"><input type="text" id="ts-filter-member" placeholder="Team member" value="'+esc(tsMember)+'" style="width:140px;padding:6px 10px;background:#000;border:1px solid #1a1a1a;color:#fff;font-size:12px;font-family:inherit;outline:none"><input type="date" id="ts-filter-from" value="'+esc(tsFrom)+'" style="padding:6px;background:#000;border:1px solid #1a1a1a;color:#fff;font-size:12px;font-family:inherit"><input type="date" id="ts-filter-to" value="'+esc(tsTo)+'" style="padding:6px;background:#000;border:1px solid #1a1a1a;color:#fff;font-size:12px;font-family:inherit"><button class="btn btn-sm btn-secondary" onclick="tsMember=document.getElementById(\'ts-filter-member\').value;tsFrom=document.getElementById(\'ts-filter-from\').value;tsTo=document.getElementById(\'ts-filter-to\').value;tsPage=1;loadTimeEntries()">Filter</button><button class="btn btn-sm btn-secondary" onclick="tsMember=\'\';tsFrom=\'\';tsTo=\'\';tsPage=1;document.getElementById(\'ts-filter-member\').value=\'\';document.getElementById(\'ts-filter-from\').value=\'\';document.getElementById(\'ts-filter-to\').value=\'\';loadTimeEntries()">Clear</button><span style="flex:1"></span><button class="btn btn-accent btn-sm" onclick="openTimeEntryForm()">+ Log Time</button></div>'+
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Team Member</th><th>Description</th><th>Project</th><th>Duration</th><th>Billable</th><th>Date</th><th></th></tr></thead><tbody id="ts-tbody"><tr><td colspan="7" style="text-align:center;padding:32px;color:#555">Loading...</td></tr></tbody></table></div>'+
        '<div class="flex-between mt-8 text-sm text-muted" id="ts-pagination"></div>'+
        '<div class="card mt-16"><div class="card-title">Report <button class="btn btn-sm btn-secondary" onclick="loadTimeReport()">Refresh</button></div><div id="ts-report"><div class="empty-state">No data</div></div></div>'
      loadTimers()
      loadTimeEntries()
      loadTimeReport()
    }

    function loadTimers(){
      osApi('GET','/time/timer/active').then(function(data){
        var timer=data||null
        if(!timer||(Array.isArray(timer)&&!timer.length)){
          document.getElementById('ts-start-btn').style.display=''
          document.getElementById('ts-stop-btn').style.display='none'
          document.getElementById('ts-timer-status').textContent='Not running'
          document.getElementById('ts-timer-status').className='badge badge-gray'
          document.getElementById('ts-timer-elapsed').innerHTML=''
          if(tsTimerInterval)clearInterval(tsTimerInterval)
          return
        }
        if(Array.isArray(timer))timer=timer[0]
        if(timer){
          document.getElementById('ts-start-btn').style.display='none'
          document.getElementById('ts-stop-btn').style.display=''
          document.getElementById('ts-timer-status').textContent=timer.status==='paused'?'Paused':'Running'
          document.getElementById('ts-timer-status').className=timer.status==='paused'?'badge badge-amber':'badge badge-green'
          document.getElementById('ts-timer-desc').value=timer.description||''
          document.getElementById('ts-timer-member').value=timer.team_member||''
          updateTimerElapsed(timer)
          if(tsTimerInterval)clearInterval(tsTimerInterval)
          tsTimerInterval=setInterval(function(){updateTimerElapsed(timer)},1000)
        }
      }).catch(function(){})
    }

    function updateTimerElapsed(timer){
      if(!timer)return
      var now=Date.now()
      var start=new Date(timer.started_at).getTime()
      var pausedTotal=(timer.total_paused_seconds||0)*1000
      var elapsed=now-start-pausedTotal
      if(timer.status==='paused'&&timer.paused_at){
        var pausedSince=now-new Date(timer.paused_at).getTime()
        elapsed-=pausedSince
      }
      elapsed=Math.max(0,elapsed)
      var h=Math.floor(elapsed/3600000)
      var m=Math.floor((elapsed%3600000)/60000)
      var s=Math.floor((elapsed%60000)/1000)
      document.getElementById('ts-timer-elapsed').innerHTML=
        timer.description?'<span class="text-muted" style="font-size:12px;font-family:sans-serif">'+esc(timer.description)+'</span><br>':''
        +String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')
    }

    function startTimer(){
      var desc=document.getElementById('ts-timer-desc').value.trim()
      var member=document.getElementById('ts-timer-member').value.trim()
      if(!member){toast('Enter your name','error');return}
      osApi('POST','/time/timer/start',{team_member:member,description:desc}).then(function(){
        toast('Timer started','success')
        loadTimers()
      }).catch(function(e){toast(e.message,'error')})
    }

    function stopTimer(){
      osApi('GET','/time/timer/active').then(function(timer){
        if(!timer||(Array.isArray(timer)&&!timer.length))return
        if(Array.isArray(timer))timer=timer[0]
        if(!timer)return
        osApi('POST','/time/timer/stop/'+timer.id).then(function(d){
          toast((d.duration_minutes||0)+' minutes logged','success')
          if(tsTimerInterval)clearInterval(tsTimerInterval)
          loadTimers()
          loadTimeEntries()
        }).catch(function(e){toast(e.message,'error')})
      }).catch(function(e){toast(e.message,'error')})
    }

    function loadTimeEntries(){
      var el=document.getElementById('ts-tbody')
      if(!el)return
      var params='?page='+tsPage+'&limit=30'
      if(tsMember)params+='&team_member='+encodeURIComponent(tsMember)
      if(tsFrom)params+='&date_from='+encodeURIComponent(tsFrom)
      if(tsTo)params+='&date_to='+encodeURIComponent(tsTo)
      api('GET','/time/entries'+params).then(function(d){
        d=d||{entries:[],total:0,totalPages:1}
        var items=d.entries||[]
        el.innerHTML=items.length?items.map(function(e){
          return '<tr class="no-click"><td><strong>'+esc(e.team_member)+'</strong></td><td class="text-muted">'+esc(e.description)+'</td><td class="text-muted">'+esc(e.projects?.name||e.project_id?.slice(0,8)||'—')+'</td><td class="text-accent">'+Math.floor(e.duration_minutes/60)+'h '+e.duration_minutes%60+'m</td><td>'+(e.billable?'<span class="badge badge-green">Yes</span>':'<span class="badge badge-gray">No</span>')+'</td><td class="text-muted">'+fmtDate(e.date)+'</td><td><button class="btn btn-sm btn-danger" onclick="deleteTimeEntry(\''+e.id+'\')">x</button></td></tr>'
        }).join(''):'<tr><td colspan="7" class="empty-state">No time entries</td></tr>'
        document.getElementById('ts-pagination').innerHTML='<span>'+(d.total||0)+' total</span><span>Page '+tsPage+' of '+(d.totalPages||1)+' <button class="btn btn-sm btn-secondary" onclick="if(tsPage>1){tsPage--;loadTimeEntries()}">&larr;</button> <button class="btn btn-sm btn-secondary" onclick="if(tsPage<'+(d.totalPages||1)+'){tsPage++;loadTimeEntries()}">&rarr;</button></span>'
      }).catch(function(e){if(el)el.innerHTML='<tr><td colspan="7" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function openTimeEntryForm(){
      openModal('Log Time',
        '<div class="field"><label>Team Member</label><input id="te-member" placeholder="Your name"></div>'+
        '<div class="field"><label>Description</label><textarea id="te-desc" placeholder="What did you work on?" style="min-height:60px"></textarea></div>'+
        '<div class="field-row"><div class="field"><label>Hours</label><input id="te-hours" type="number" step="0.5" min="0" placeholder="e.g. 2.5" style="width:80px"></div><div class="field"><label>Date</label><input id="te-date" type="date"></div></div>'+
        '<div class="field"><label>Project (optional)</label><input id="te-project" placeholder="Project name or ID"></div>'+
        '<div class="field"><label class="flex-center"><input id="te-billable" type="checkbox" checked> Billable</label></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveTimeEntry()">Log Time</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
      document.getElementById('te-date').valueAsDate=new Date()
    }

    function saveTimeEntry(){
      var h=parseFloat(document.getElementById('te-hours').value)||0
      if(h<=0){toast('Hours must be > 0','error');return}
      var body={team_member:document.getElementById('te-member').value.trim(),description:document.getElementById('te-desc').value.trim(),duration_minutes:Math.round(h*60),date:document.getElementById('te-date').value,project_id:document.getElementById('te-project').value.trim()||null,billable:document.getElementById('te-billable').checked}
      if(!body.team_member){toast('Team member required','error');return}
      if(!body.description){toast('Description required','error');return}
      api('POST','/time/entries',body).then(function(){toast('Time logged','success');closeModal();loadTimeEntries();loadTimeReport()}).catch(function(e){toast(e.message,'error')})
    }

    function deleteTimeEntry(id){
      if(!confirm('Delete this time entry?'))return
      api('DELETE','/time/entries/'+id).then(function(){toast('Entry deleted','success');loadTimeEntries();loadTimeReport()}).catch(function(e){toast(e.message,'error')})
    }

    function loadTimeReport(){
      var el=document.getElementById('ts-report')
      if(!el)return
      var params=''
      if(tsMember)params+='&team_member='+encodeURIComponent(tsMember)
      if(tsFrom)params+='&date_from='+encodeURIComponent(tsFrom)
      if(tsTo)params+='&date_to='+encodeURIComponent(tsTo)
      api('GET','/time/report'+params).then(function(r){
        r=r||{}
        el.innerHTML='<div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">'+
          '<div class="stat-card"><div class="stat-label">Total Hours</div><div class="stat-value text-accent">'+(r.total_hours||'0')+'</div></div>'+
          '<div class="stat-card"><div class="stat-label">Billable Hours</div><div class="stat-value">'+(r.billable_hours||'0')+'</div></div>'+
          '<div class="stat-card"><div class="stat-label">Billable Amount</div><div class="stat-value">'+(r.billable_amount?fmtINR(r.billable_amount):'—')+'</div></div>'+
          '<div class="stat-card"><div class="stat-label">Entries</div><div class="stat-value">'+(r.entry_count||'0')+'</div></div>'+
          '</div>'+
          (r.by_project&&r.by_project.length?'<div class="mt-8"><div class="card-title" style="font-size:11px">By Project</div>'+r.by_project.map(function(p){return '<div class="flex-between" style="padding:6px 0;border-bottom:1px solid #1a1a1a;font-size:12px"><span>'+esc(p.name)+'</span><span class="text-accent">'+p.hours+'h</span></div>'}).join('')+'</div>':'')+
          (r.by_member&&r.by_member.length?'<div class="mt-8"><div class="card-title" style="font-size:11px">By Team Member</div>'+r.by_member.map(function(m){return '<div class="flex-between" style="padding:6px 0;border-bottom:1px solid #1a1a1a;font-size:12px"><span>'+esc(m.name)+'</span><span class="text-accent">'+m.hours+'h</span></div>'}).join('')+'</div>':'')+
          (r.by_day&&r.by_day.length?'<div class="mt-8"><div class="card-title" style="font-size:11px">By Day</div>'+r.by_day.map(function(d){return '<div class="flex-between" style="padding:6px 0;border-bottom:1px solid #1a1a1a;font-size:12px"><span>'+fmtDate(d.date)+'</span><span class="text-accent">'+d.hours+'h</span></div>'}).join('')+'</div>':'')
      }).catch(function(e){el.innerHTML='<div class="empty-state">Error: '+e.message+'</div>'})
    }

    // ─── NURTURE ───
    function renderNurture(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Nurture List</h2><p>Long-term leads receiving automated emails</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Stage</th><th>Added</th></tr></thead><tbody id="nurture-tbody"><tr><td colspan="5" style="text-align:center;padding:32px;color:#555">Loading...</td></tr></tbody></table></div>'
      api('GET','/nurture-list').then(function(d){
        d=d||{clients:[]}
        document.getElementById('nurture-tbody').innerHTML=d.clients.map(function(c){
          return '<tr class="no-click"><td><strong>'+esc(c.name)+'</strong></td><td class="text-muted">'+esc(c.email||'—')+'</td><td class="text-muted">'+esc(c.phone||'—')+'</td><td>'+stageBadge(c.pipeline_stage)+'</td><td class="text-muted">'+fmtDate(c.created_at)+'</td></tr>'
        }).join('')||'<tr><td colspan="5" class="empty-state">No nurture leads</td></tr>'
      }).catch(function(e){document.getElementById('nurture-tbody').innerHTML='<tr><td colspan="5" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    // ─── ANOMALIES ───
    function renderAnomalies(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Anomaly Detection</h2><p>Unusual patterns in leads, calls, and churn</p></div><button class="btn btn-accent btn-sm" onclick="runAnomalyScan()">Run Scan</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Type</th><th>Metric</th><th>Value</th><th>Severity</th><th>Status</th><th>Detected</th><th></th></tr></thead><tbody id="anomaly-tbody"><tr><td colspan="7" style="text-align:center;padding:32px;color:#555">Loading...</td></tr></tbody></table></div>'
      loadAnomalies()
    }

    function loadAnomalies(){
      osApi('GET','/anomalies?limit=50').then(function(d){
        d=d||[]
        document.getElementById('anomaly-tbody').innerHTML=d.map(function(a){
          return '<tr class="no-click"><td><span class="badge badge-amber">'+esc(a.anomaly_type).replace(/_/g,' ')+'</span></td><td class="text-muted">'+esc(a.metric_name||'—')+'</td><td class="text-accent">'+(a.metric_value!=null?a.metric_value:'—')+'</td><td>'+stageBadge(a.severity||'info')+'</td><td>'+(a.acknowledged_at?'<span class="badge badge-green">Acknowledged</span>':'<span class="badge badge-neon">Open</span>')+'</td><td class="text-muted">'+fmtDate(a.detected_at)+'</td><td>'+(a.acknowledged_at?'':'<button class="btn btn-sm btn-secondary" onclick="ackAnomaly(\''+a.id+'\')">Ack</button>')+'</td></tr>'
        }).join('')||'<tr><td colspan="7" class="empty-state">No anomalies detected</td></tr>'
      }).catch(function(e){document.getElementById('anomaly-tbody').innerHTML='<tr><td colspan="7" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function runAnomalyScan(){
      osApi('POST','/anomalies/run').then(function(d){
        toast('Scan complete. '+(d.detected||0)+' anomaly(ies) detected','success')
        loadAnomalies()
      }).catch(function(e){toast(e.message,'error')})
    }

    function ackAnomaly(id){
      osApi('POST','/anomalies/'+id+'/acknowledge',{}).then(function(){
        toast('Anomaly acknowledged','success')
        loadAnomalies()
      }).catch(function(e){toast(e.message,'error')})
    }

    // ─── KNOWLEDGE BASE ───
    var kbTypes = [
      {value:'',label:'All'},
      {value:'playbook',label:'Playbooks'},
      {value:'sop',label:'SOPs'},
      {value:'faq',label:'FAQs'},
      {value:'value_engine_msg',label:'Value Engine'},
      {value:'msg_template',label:'Msg Templates'},
      {value:'email_template',label:'Email Templates'},
      {value:'guide',label:'Guides'},
    ]
    var kbState = {page:1, type:'', category_id:'', search:'', status:''}

    function renderKB(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Knowledge Base</h2><p>Playbooks, SOPs, FAQs, templates, and guides</p></div><div class="flex gap-8"><button class="btn btn-accent btn-sm" onclick="openKBArticleForm()">+ New Article</button><button class="btn btn-secondary btn-sm" onclick="openKBCategoryForm()">Manage Categories</button></div></div>'+
        '<div class="kb-layout"><div class="kb-sidebar" id="kb-sidebar"><div class="kb-sidebar-title">Categories</div></div><div class="kb-main"><div class="filters"><input type="text" id="kb-search" placeholder="Search knowledge base..." oninput="kbState.search=this.value;kbState.page=1;loadKBArticles()"><select id="kb-status" onchange="kbState.status=this.value;kbState.page=1;loadKBArticles()"><option value="">All status</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div><div class="kb-type-pills" id="kb-type-pills"></div><div id="kb-article-list"></div><div class="flex-between mt-8 text-sm text-muted" id="kb-pagination"></div></div></div>'
      loadKBCategories()
      kbState.page=1;loadKBArticles()
    }

    function loadKBCategories(){
      osApi('GET','/kb/categories').then(function(d){
        d=d||[]
        kbState.categories=d
        document.getElementById('kb-sidebar').innerHTML='<div class="kb-sidebar-title">Categories</div>'+
          '<button class="kb-sidebar-item'+(kbState.category_id===''?' active':'')+'" onclick="kbState.category_id=\'\';kbState.page=1;loadKBArticles();loadKBCategories()">All <span class="kb-sidebar-count">'+d.reduce(function(s,c){return s+(c.article_count||0)},0)+'</span></button>'+
          d.map(function(c){return '<button class="kb-sidebar-item'+(kbState.category_id===c.id?' active':'')+'" onclick="kbState.category_id=\''+c.id+'\';kbState.page=1;loadKBArticles();loadKBCategories()">'+esc(c.name)+' <span class="kb-sidebar-count">'+(c.article_count||0)+'</span></button>'}).join('')
      }).catch(function(){})
      var pillsHtml=kbTypes.map(function(t){return '<button class="kb-pill'+(kbState.type===t.value?' active':'')+'" onclick="kbState.type=\''+t.value+'\';kbState.page=1;loadKBArticles()">'+t.label+'</button>'}).join('')
      document.getElementById('kb-type-pills').innerHTML=pillsHtml
    }

    function loadKBArticles(){
      var list=document.getElementById('kb-article-list')
      list.innerHTML='<div class="empty-state">Loading...</div>'
      var params='?page='+kbState.page+'&limit=30'
      if(kbState.type) params+='&type='+kbState.type
      if(kbState.category_id) params+='&category_id='+kbState.category_id
      if(kbState.search) params+='&search='+encodeURIComponent(kbState.search)
      if(kbState.status) params+='&status='+kbState.status
      osApi('GET','/kb/articles'+params).then(function(d){
        d=d||{articles:[],total:0,totalPages:1}
        list.innerHTML=d.articles.length?d.articles.map(function(a){
          var catName=''
          if(kbState.categories){
            var cat=kbState.categories.find(function(c){return c.id===a.category_id})
            if(cat) catName=cat.name
          }
          return '<div class="kb-article-item" onclick="openKBArticle(\''+a.id+'\')"><div class="kb-article-item-title">'+esc(a.title)+'</div><div class="kb-article-item-meta">'+
            '<span class="badge badge-neon">'+esc(a.type).replace(/_/g,' ')+'</span>'+
            (catName?' <span class="text-muted">in '+esc(catName)+'</span>':'')+
            ' <span class="badge '+(a.status==='published'?'badge-green':a.status==='archived'?'badge-red':'badge-gray')+'">'+a.status+'</span>'+
            ' <span class="text-muted">v'+a.version+'</span>'+
            ' <span class="text-muted">'+fmtDate(a.updated_at)+'</span></div>'+
            (a.tags&&a.tags.length?'<div class="kb-article-item-tags">'+a.tags.map(function(t){return '<span class="pill">'+esc(t)+'</span>'}).join('')+'</div>':'')+
            '</div>'
        }).join(''):'<div class="empty-state">No articles found</div>'
        document.getElementById('kb-pagination').innerHTML='<span>'+(d.total||0)+' total</span><span>Page '+kbState.page+' of '+(d.totalPages||1)+' <button class="btn btn-sm btn-secondary" onclick="if(kbState.page>1){kbState.page--;loadKBArticles()}">&larr;</button> <button class="btn btn-sm btn-secondary" onclick="if(kbState.page<'+(d.totalPages||1)+'){kbState.page++;loadKBArticles()}">&rarr;</button></span>'
      }).catch(function(e){list.innerHTML='<div class="empty-state">Error: '+e.message+'</div>'})
    }

    function openKBArticle(id){
      osApi('GET','/kb/articles/'+id).then(function(a){
        if(!a){toast('Article not found','error');return}
        var catName=''
        if(a.kb_categories) catName=a.kb_categories.name||''
        openDrawer(a.title,
          '<div class="drawer-section"><div class="drawer-section-title">Info</div>'+
          '<div class="detail-row"><span class="detail-label">Type</span><span class="detail-value"><span class="badge badge-neon">'+esc(a.type).replace(/_/g,' ')+'</span></span></div>'+
          '<div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">'+(a.status==='published'?'<span class="badge badge-green">Published</span>':a.status==='archived'?'<span class="badge badge-red">Archived</span>':'<span class="badge badge-gray">Draft</span>')+'</span></div>'+
          (catName?'<div class="detail-row"><span class="detail-label">Category</span><span class="detail-value">'+esc(catName)+'</span></div>':'')+
          '<div class="detail-row"><span class="detail-label">Version</span><span class="detail-value">'+a.version+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Updated</span><span class="detail-value">'+fmtDate(a.updated_at)+'</span></div>'+
          (a.author?'<div class="detail-row"><span class="detail-label">Author</span><span class="detail-value">'+esc(a.author)+'</span></div>':'')+
          (a.tags&&a.tags.length?'<div class="detail-row"><span class="detail-label">Tags</span><span class="detail-value">'+a.tags.map(function(t){return '<span class="pill">'+esc(t)+'</span>'}).join('')+'</span></div>':'')+
          '</div>'+
          '<div class="drawer-section"><div class="drawer-section-title">Content</div><div class="kb-content">'+esc(a.content).replace(/\n/g,'<br>')+'</div></div>'+
          '<div class="flex gap-8"><button class="btn btn-sm btn-accent" onclick="closeDrawer();openKBArticleForm(\''+a.id+'\')">Edit</button>'+
          (a.status!=='published'?'<button class="btn btn-sm btn-secondary" onclick="closeDrawer();publishKBArticle(\''+a.id+'\')">Publish</button>':'')+
          '<button class="btn btn-sm btn-danger" onclick="closeDrawer();deleteKBArticle(\''+a.id+'\')">Delete</button></div>')
      }).catch(function(e){toast(e.message,'error')})
    }

    function publishKBArticle(id){
      osApi('PATCH','/kb/articles/'+id,{status:'published'}).then(function(){
        toast('Article published','success')
        loadKBArticles()
      }).catch(function(e){toast(e.message,'error')})
    }

    function openKBArticleForm(id){
      if(id){
        osApi('GET','/kb/articles/'+id).then(function(a){
          if(!a)return
          openModal('Edit: '+esc(a.title),
            '<div class="field"><label>Title</label><input id="kbf-title" value="'+esc(a.title)+'"></div>'+
            '<div class="field-row"><div class="field"><label>Type</label><select id="kbf-type">'+kbTypes.filter(function(t){return t.value}).map(function(t){return '<option value="'+t.value+'"'+(t.value===a.type?' selected':'')+'>'+t.label+'</option>'}).join('')+'</select></div><div class="field"><label>Category</label><select id="kbf-category"><option value="">None</option>'+(kbState.categories||[]).map(function(c){return '<option value="'+c.id+'"'+(c.id===a.category_id?' selected':'')+'>'+esc(c.name)+'</option>'}).join('')+'</select></div></div>'+
            '<div class="field-row"><div class="field"><label>Status</label><select id="kbf-status"><option value="draft"'+(a.status==='draft'?' selected':'')+'>Draft</option><option value="published"'+(a.status==='published'?' selected':'')+'>Published</option><option value="archived"'+(a.status==='archived'?' selected':'')+'>Archived</option></select></div><div class="field"><label>Tags (comma-sep)</label><input id="kbf-tags" value="'+esc((a.tags||[]).join(', '))+'"></div></div>'+
            '<div class="field"><label>Content (markdown)</label><textarea id="kbf-content" style="min-height:200px;font-family:monospace;font-size:12px;line-height:1.5">'+esc(a.content)+'</textarea></div>',
            '<button class="btn btn-primary btn-sm" onclick="saveKBArticle(\''+a.id+'\')">Save</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
        }).catch(function(e){toast(e.message,'error')})
      } else {
        openModal('New Article',
          '<div class="field"><label>Title</label><input id="kbf-title" placeholder="Article title"></div>'+
          '<div class="field-row"><div class="field"><label>Type</label><select id="kbf-type">'+kbTypes.filter(function(t){return t.value}).map(function(t){return '<option value="'+t.value+'">'+t.label+'</option>'}).join('')+'</select></div><div class="field"><label>Category</label><select id="kbf-category"><option value="">None</option>'+(kbState.categories||[]).map(function(c){return '<option value="'+c.id+'">'+esc(c.name)+'</option>'}).join('')+'</select></div></div>'+
          '<div class="field-row"><div class="field"><label>Status</label><select id="kbf-status"><option value="draft">Draft</option><option value="published">Published</option></select></div><div class="field"><label>Tags (comma-sep)</label><input id="kbf-tags" placeholder="tag1, tag2"></div></div>'+
          '<div class="field"><label>Content (markdown)</label><textarea id="kbf-content" style="min-height:200px;font-family:monospace;font-size:12px;line-height:1.5" placeholder="Write your content here..."></textarea></div>',
          '<button class="btn btn-primary btn-sm" onclick="saveKBArticle()">Create</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
      }
    }

    function saveKBArticle(id){
      var title=document.getElementById('kbf-title').value.trim()
      if(!title){toast('Title required','error');return}
      var body={title:title,type:document.getElementById('kbf-type').value,category_id:document.getElementById('kbf-category').value||null,status:document.getElementById('kbf-status').value,tags:document.getElementById('kbf-tags').value.split(',').map(function(s){return s.trim()}).filter(Boolean),content:document.getElementById('kbf-content').value}
      var req=id?osApi('PATCH','/kb/articles/'+id,body):osApi('POST','/kb/articles',body)
      req.then(function(){
        toast(id?'Article updated':'Article created','success')
        closeModal();loadKBArticles();loadKBCategories()
      }).catch(function(e){toast(e.message,'error')})
    }

    function deleteKBArticle(id){
      if(!confirm('Delete this article? This cannot be undone.'))return
      osApi('DELETE','/kb/articles/'+id).then(function(){
        toast('Article deleted','success')
        loadKBArticles();loadKBCategories()
      }).catch(function(e){toast(e.message,'error')})
    }

    function openKBCategoryForm(){
      openModal('Manage Categories',
        '<div class="field"><label>New Category Name</label><input id="kbc-name" placeholder="Category name"></div><div class="field"><label>Description</label><input id="kbc-desc" placeholder="Optional description"></div><div class="field"><label>Icon</label><select id="kbc-icon"><option value="file-text">Text</option><option value="target">Target</option><option value="help-circle">Help</option><option value="zap">Zap</option><option value="message-square">Message</option><option value="mail">Mail</option><option value="clipboard">Clipboard</option><option value="book-open">Book</option></select></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveKBCategory()">Add Category</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Done</button>'+
        ((kbState.categories||[]).length?'<hr style="border:none;border-top:1px solid #1a1a1a;margin:16px 0"><div class="text-sm text-muted mb-8">Existing categories</div>'+kbState.categories.map(function(c){return '<div class="flex-between" style="padding:6px 0;border-bottom:1px solid #1a1a1a;font-size:12px"><span>'+esc(c.name)+' <span class="text-muted">('+(c.article_count||0)+')</span></span><button class="btn btn-sm btn-danger" onclick="deleteKBCategory(\''+c.id+'\')">Delete</button></div>'}).join(''):''))
    }

    function saveKBCategory(){
      var name=document.getElementById('kbc-name').value.trim()
      if(!name){toast('Name required','error');return}
      osApi('POST','/kb/categories',{name:name,description:document.getElementById('kbc-desc').value.trim(),icon:document.getElementById('kbc-icon').value}).then(function(){
        toast('Category created','success')
        document.getElementById('kbc-name').value=''
        document.getElementById('kbc-desc').value=''
        loadKBCategories()
        openKBCategoryForm()
      }).catch(function(e){toast(e.message,'error')})
    }

    function deleteKBCategory(id){
      if(!confirm('Delete this category? Articles will be uncategorized.'))return
      osApi('DELETE','/kb/categories/'+id).then(function(){
        toast('Category deleted','success')
        loadKBCategories()
        openKBCategoryForm()
      }).catch(function(e){toast(e.message,'error')})
    }

    // ─── EMAIL QUEUE ───
    var eqPage=1
    function renderEmailQueue(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Email Queue</h2><p>Outbound email status</p></div></div><div class="filters"><select onchange="eqPage=1;renderEmailQueue()" id="eq-filter"><option value="">All</option><option value="queued">Queued</option><option value="sent">Sent</option><option value="failed">Failed</option></select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Type</th><th>Client</th><th>Subject</th><th>Status</th><th>Scheduled</th><th></th></tr></thead><tbody id="eq-tbody"><tr><td colspan="6" style="text-align:center;padding:32px;color:#555">Loading...</td></tr></tbody></table></div><div class="flex-between mt-8 text-sm text-muted" id="eq-pagination"></div>'
      loadEmailQueue()
    }

    function loadEmailQueue(){
      var filter=document.getElementById('eq-filter').value
      var url='/email-queue?page='+eqPage+(filter?'&status='+filter:'')
      api('GET',url).then(function(d){
        d=d||{items:[],total:0,totalPages:1}
        document.getElementById('eq-tbody').innerHTML=d.items.map(function(e){
          return '<tr class="no-click"><td class="text-muted">'+esc(e.type||'—')+'</td><td>'+esc(e.client_name||'—')+'</td><td class="text-muted truncate" style="max-width:200px">'+esc(e.subject||'—')+'</td><td>'+stageBadge(e.status)+'</td><td class="text-muted">'+fmtDate(e.scheduled_at)+'</td><td>'+(e.status==='failed'?'<button class="btn btn-sm btn-secondary" onclick="retryEmail(\''+e.id+'\')">Retry</button>':'')+'</td></tr>'
        }).join('')||'<tr><td colspan="6" class="empty-state">No emails</td></tr>'
        document.getElementById('eq-pagination').innerHTML='<span>'+(d.total||0)+' total</span><span>Page '+eqPage+' of '+(d.totalPages||1)+' <button class="btn btn-sm btn-secondary" onclick="if(eqPage>1){eqPage--;loadEmailQueue()}">&larr;</button> <button class="btn btn-sm btn-secondary" onclick="if(eqPage<'+(d.totalPages||1)+'){eqPage++;loadEmailQueue()}">&rarr;</button></span>'
      }).catch(function(e){document.getElementById('eq-tbody').innerHTML='<tr><td colspan="6" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function retryEmail(id){
      api('PATCH','/email-queue/'+id+'/retry').then(function(){toast('Retry queued','success');loadEmailQueue()}).catch(function(e){toast(e.message,'error')})
    }

    // ─── SETTINGS ───
    function renderSettings(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Settings</h2><p>API keys and integrations</p></div></div><div class="card"><div class="card-title">Email Integration Keys</div><div class="field"><label>Resend API Key</label><input id="s-resend" placeholder="re_..."></div><div class="field"><label>Gmail User</label><input id="s-gmail-user" placeholder="Gmail address"></div><div class="field"><label>Gmail App Password</label><input id="s-gmail-pass" type="password" placeholder="App password"></div><div class="field"><label>Gmail From Name</label><input id="s-gmail-name" placeholder="Flodon Operations"></div><div class="flex gap-8 mt-8"><button class="btn btn-primary btn-sm" onclick="saveSettings()">Save</button></div></div><div class="card"><div class="card-title">API Keys</div><p class="text-sm text-muted mb-16">Manage API keys for external integrations.</p><div class="flex gap-8 mb-16"><button class="btn btn-accent btn-sm" onclick="openApiKeyForm()">+ Generate Key</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Key Prefix</th><th>Permissions</th><th>Created</th><th>Status</th><th></th></tr></thead><tbody id="ak-tbody"><tr><td colspan="6" style="text-align:center;padding:24px;color:#555">Loading...</td></tr></tbody></table></div></div>'
      api('GET','/settings/keys').then(function(data){
        data=data||{}
        document.getElementById('s-resend').value=data.resend_api_key||''
        document.getElementById('s-gmail-user').value=data.gmail_user||''
        document.getElementById('s-gmail-pass').value=data.gmail_app_password||''
        document.getElementById('s-gmail-name').value=data.gmail_from_name||''
      }).catch(function(e){toast('Failed to load settings: '+e.message,'error')})
      loadApiKeys()
    }

    function saveSettings(){
      var body={resend_api_key:document.getElementById('s-resend').value.trim(),gmail_user:document.getElementById('s-gmail-user').value.trim(),gmail_app_password:document.getElementById('s-gmail-pass').value.trim(),gmail_from_name:document.getElementById('s-gmail-name').value.trim()}
      api('POST','/settings/keys',body).then(function(){toast('Settings saved','success')}).catch(function(e){toast(e.message,'error')})
    }

    function loadApiKeys(){
      osApi('GET','/api-keys').then(function(d){
        d=d||[]
        document.getElementById('ak-tbody').innerHTML=d.map(function(k){
          return '<tr class="no-click"><td><strong>'+esc(k.name)+'</strong></td><td class="text-muted"><code style="background:#000;padding:2px 6px;font-size:11px;color:#00f0ff">'+esc(k.key_prefix)+'...</code></td><td class="text-muted">'+esc(k.permissions||'all')+'</td><td class="text-muted">'+fmtDate(k.created_at)+'</td><td>'+(k.revoked_at?'<span class="badge badge-red">Revoked</span>':'<span class="badge badge-green">Active</span>')+'</td><td>'+(k.revoked_at?'':'<button class="btn btn-sm btn-danger" onclick="revokeApiKey(\''+k.id+'\')">Revoke</button>')+'</td></tr>'
        }).join('')||'<tr><td colspan="6" class="empty-state">No API keys</td></tr>'
      }).catch(function(e){document.getElementById('ak-tbody').innerHTML='<tr><td colspan="6" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function openApiKeyForm(){
      openModal('Generate API Key',
        '<div class="field"><label>Key Name</label><input id="ak-name" placeholder="e.g. Development"></div><div class="field"><label>Permissions</label><select id="ak-perms"><option value="read">Read Only</option><option value="read,write">Read & Write</option><option value="all">All</option></select></div><p class="text-sm text-muted">The key will be shown once. Copy it immediately.</p>',
        '<button class="btn btn-primary btn-sm" onclick="saveApiKey()">Generate</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveApiKey(){
      var name=document.getElementById('ak-name').value.trim()
      if(!name){toast('Name required','error');return}
      osApi('POST','/api-keys',{name:name,permissions:document.getElementById('ak-perms').value}).then(function(d){
        closeModal()
        var key=d.api_key||'[hidden]'
        openModal('API Key Generated','<p class="text-sm mb-16">Copy this key now — it will not be shown again.</p><div class="field"><label>Your API Key</label><input id="ak-result" value="'+esc(key)+'" readonly style="color:#00f0ff;font-family:monospace" onclick="this.select()"></div><p class="text-sm text-muted">Prefix: <code style="color:#00f0ff">'+esc(key).slice(0,7)+'...</code></p>','<button class="btn btn-primary btn-sm" onclick="closeModal();loadApiKeys()">Done</button>')
        loadApiKeys()
      }).catch(function(e){toast(e.message,'error')})
    }

    function revokeApiKey(id){
      if(!confirm('Revoke this API key? This cannot be undone.'))return
      osApi('DELETE','/api-keys/'+id).then(function(){
        toast('API key revoked','success')
        loadApiKeys()
      }).catch(function(e){toast(e.message,'error')})
    }

    // ─── PROJECTS ───
    var projPage=1
    function renderProjects(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Projects</h2><p>Post-sale delivery tracking</p></div><button class="btn btn-accent btn-sm" onclick="openProjectForm()">+ New Project</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Client</th><th>Status</th><th>Progress</th><th>Team</th><th>Deadline</th></tr></thead><tbody id="proj-tbody"><tr><td colspan="6" style="text-align:center;padding:32px;color:#555">Loading...</td></tr></tbody></table></div><div class="flex-between mt-8 text-sm text-muted" id="proj-pagination"></div>'
      loadProjects()
    }

    function loadProjects(){
      var el=document.getElementById('proj-tbody')
      api('GET','/projects?page='+projPage).then(function(d){
        d=d||{data:[],total:0,totalPages:1}
        var items=Array.isArray(d)?d:(d.data||[])
        var total=d.total||items.length
        var pages=d.totalPages||1
        el.innerHTML=items.map(function(p){
          var progress=p.progress_percent!=null?p.progress_percent:(p.progress||0)
          return '<tr onclick="openProjectDetail(\''+p.id+'\')"><td><strong>'+esc(p.name)+'</strong></td><td class="text-muted">'+esc(p.client_name||'—')+'</td><td>'+stageBadge(p.status)+'</td><td style="min-width:120px"><div class="progress-bar"><div class="progress-fill" style="width:'+progress+'%"></div></div><span class="text-sm text-muted">'+progress+'%</span></td><td class="text-muted">'+esc(p.team_member||'—')+'</td><td class="text-muted">'+(p.deadline?fmtDate(p.deadline):'—')+'</td></tr>'
        }).join('')||'<tr><td colspan="6" class="empty-state">No projects yet</td></tr>'
        document.getElementById('proj-pagination').innerHTML='<span>'+(total||0)+' total</span><span>Page '+projPage+' of '+(pages||1)+' <button class="btn btn-sm btn-secondary" onclick="if(projPage>1){projPage--;loadProjects()}">&larr;</button> <button class="btn btn-sm btn-secondary" onclick="if(projPage<'+(pages||1)+'){projPage++;loadProjects()}">&rarr;</button></span>'
      }).catch(function(e){el.innerHTML='<tr><td colspan="6" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function openProjectForm(id){
      if(id){
        api('GET','/projects/'+id).then(function(p){
          if(!p)return
          openModal('Edit: '+esc(p.name),
            '<div class="field"><label>Project Name</label><input id="pf-name" value="'+esc(p.name)+'"></div>'+
            '<div class="field-row"><div class="field"><label>Client Name</label><input id="pf-client" value="'+esc(p.client_name||'')+'"></div><div class="field"><label>Status</label><select id="pf-status"><option value="planning"'+(p.status==='planning'?' selected':'')+'>Planning</option><option value="in_progress"'+(p.status==='in_progress'?' selected':'')+'>In Progress</option><option value="on_hold"'+(p.status==='on_hold'?' selected':'')+'>On Hold</option><option value="completed"'+(p.status==='completed'?' selected':'')+'>Completed</option><option value="cancelled"'+(p.status==='cancelled'?' selected':'')+'>Cancelled</option></select></div></div>'+
            '<div class="field-row"><div class="field"><label>Team Member</label><input id="pf-team" value="'+esc(p.team_member||'')+'"></div><div class="field"><label>Deadline</label><input id="pf-deadline" type="date" value="'+(p.deadline?p.deadline.slice(0,10):'')+'"></div></div>'+
            '<div class="field"><label>Description</label><textarea id="pf-desc" style="min-height:80px">'+esc(p.description||'')+'</textarea></div>',
            '<button class="btn btn-primary btn-sm" onclick="saveProject(\''+id+'\')">Save</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
        }).catch(function(e){toast(e.message,'error')})
      } else {
        openModal('New Project',
          '<div class="field"><label>Project Name</label><input id="pf-name" placeholder="Project name"></div>'+
          '<div class="field-row"><div class="field"><label>Client Name</label><input id="pf-client" placeholder="Client name"></div><div class="field"><label>Status</label><select id="pf-status"><option value="planning">Planning</option><option value="in_progress">In Progress</option><option value="on_hold">On Hold</option><option value="completed">Completed</option></select></div></div>'+
          '<div class="field-row"><div class="field"><label>Team Member</label><input id="pf-team" placeholder="Team member"></div><div class="field"><label>Deadline</label><input id="pf-deadline" type="date"></div></div>'+
          '<div class="field"><label>Description</label><textarea id="pf-desc" placeholder="Project description..." style="min-height:80px"></textarea></div>',
          '<button class="btn btn-primary btn-sm" onclick="saveProject()">Create Project</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
      }
    }

    function saveProject(id){
      var body={name:document.getElementById('pf-name').value.trim(),client_name:document.getElementById('pf-client').value.trim(),status:document.getElementById('pf-status').value,team_member:document.getElementById('pf-team').value.trim(),deadline:document.getElementById('pf-deadline').value||null,description:document.getElementById('pf-desc').value.trim()}
      if(!body.name){toast('Project name required','error');return}
      var req=id?api('PATCH','/projects/'+id,body):api('POST','/projects',body)
      req.then(function(){toast(id?'Project updated':'Project created','success');closeModal();loadProjects()}).catch(function(e){toast(e.message,'error')})
    }

    function deleteProject(id){
      if(!confirm('Delete this project and all milestones?'))return
      api('DELETE','/projects/'+id).then(function(){toast('Project deleted','success');closeDrawer();loadProjects()}).catch(function(e){toast(e.message,'error')})
    }

    function openProjectDetail(id){
      api('GET','/projects/'+id).then(function(p){
        if(!p){toast('Project not found','error');return}
        api('GET','/projects/'+id+'/milestones').then(function(milestones){
          milestones=milestones||[]
          var progress=p.progress_percent!=null?p.progress_percent:(p.progress||0)
          var mileHtml=milestones.length?milestones.map(function(m){
            return '<div class="flex-between" style="padding:10px 0;border-bottom:1px solid #1a1a1a;font-size:13px"><div><strong>'+esc(m.name)+'</strong><br><span class="text-sm text-muted">'+(m.due_date?'Due: '+fmtDate(m.due_date):'')+'</span></div><div class="flex gap-8 items-center"><span class="text-sm">'+stageBadge(m.status)+'</span><button class="btn btn-sm btn-secondary text-sm" onclick="closeDrawer();editMilestone(\''+m.id+'\',\''+id+'\')">Edit</button><button class="btn btn-sm btn-danger text-sm" onclick="deleteMilestone(\''+m.id+'\',\''+id+'\')">x</button></div></div>'
          }).join(''):'<p class="text-sm text-muted">No milestones yet</p>'
          openDrawer(p.name,
            '<div class="drawer-section"><div class="drawer-section-title">Details</div>'+
            '<div class="detail-row"><span class="detail-label">Client</span><span class="detail-value">'+esc(p.client_name||'—')+'</span></div>'+
            '<div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">'+stageBadge(p.status)+'</span></div>'+
            '<div class="detail-row"><span class="detail-label">Progress</span><span class="detail-value"><div class="progress-bar" style="width:120px;display:inline-block;vertical-align:middle;margin-right:8px"><div class="progress-fill" style="width:'+progress+'%"></div></div>'+progress+'%</span></div>'+
            '<div class="detail-row"><span class="detail-label">Team</span><span class="detail-value">'+esc(p.team_member||'—')+'</span></div>'+
            '<div class="detail-row"><span class="detail-label">Deadline</span><span class="detail-value">'+(p.deadline?fmtDate(p.deadline):'—')+'</span></div>'+
            (p.description?'<div class="detail-row"><span class="detail-label">Description</span><span class="detail-value text-sm">'+esc(p.description)+'</span></div>':'')+'</div>'+
            '<div class="drawer-section"><div class="drawer-section-title">Milestones <button class="btn btn-sm btn-accent" onclick="closeDrawer();addMilestone(\''+id+'\')">+ Add</button></div>'+mileHtml+'</div>'+
            '<div class="flex gap-8"><button class="btn btn-sm btn-accent" onclick="closeDrawer();openProjectForm(\''+id+'\')">Edit</button><button class="btn btn-sm btn-danger" onclick="deleteProject(\''+id+'\')">Delete</button></div>')
        }).catch(function(e){toast(e.message,'error')})
      }).catch(function(e){toast(e.message,'error')})
    }

    function addMilestone(projectId){
      openModal('Add Milestone',
        '<div class="field"><label>Name</label><input id="mf-name" placeholder="Milestone name"></div>'+
        '<div class="field-row"><div class="field"><label>Status</label><select id="mf-status"><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></select></div><div class="field"><label>Due Date</label><input id="mf-due" type="date"></div></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveMilestone(\''+projectId+'\')">Add</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveMilestone(projectId){
      var body={name:document.getElementById('mf-name').value.trim(),status:document.getElementById('mf-status').value,due_date:document.getElementById('mf-due').value||null}
      if(!body.name){toast('Name required','error');return}
      api('POST','/projects/'+projectId+'/milestones',body).then(function(){toast('Milestone added','success');closeModal();openProjectDetail(projectId)}).catch(function(e){toast(e.message,'error')})
    }

    function editMilestone(milestoneId,projectId){
      api('PATCH','/milestones/'+milestoneId,{status:prompt('Status (pending, in_progress, completed):')||'pending'}).then(function(){toast('Milestone updated','success');openProjectDetail(projectId)}).catch(function(e){toast(e.message,'error')})
    }

    function deleteMilestone(id,projectId){
      if(!confirm('Delete this milestone?'))return
      api('DELETE','/milestones/'+id).then(function(){toast('Milestone deleted','success');openProjectDetail(projectId)}).catch(function(e){toast(e.message,'error')})
    }

    // ─── PORTAL ADMIN ───
    function renderPortal(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><div><h2>Client Portal</h2><p>Manage client access, messages, and documents</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Client</th><th>Email</th><th>Portal Access</th><th>Last Login</th><th>Messages</th><th>Documents</th></tr></thead><tbody id="portal-tbody"><tr><td colspan="6" style="text-align:center;padding:32px;color:#555">Loading...</td></tr></tbody></table></div>'
      api('GET','/portal/clients').then(function(d){
        d=d||[]
        document.getElementById('portal-tbody').innerHTML=d.map(function(c){
          return '<tr onclick="openPortalClient(\''+c.id+'\')"><td><strong>'+esc(c.name)+'</strong></td><td class="text-muted">'+esc(c.email||'—')+'</td><td>'+(c.portal_enabled?'<span class="badge badge-green">Enabled</span>':'<span class="badge badge-gray">Disabled</span>')+'</td><td class="text-muted">'+(c.last_portal_login?fmtDate(c.last_portal_login):'—')+'</td><td><span class="text-accent">'+(c.message_count||0)+'</span></td><td><span class="text-accent">'+(c.document_count||0)+'</span></td></tr>'
        }).join('')||'<tr><td colspan="6" class="empty-state">No clients with portal yet</td></tr>'
      }).catch(function(e){document.getElementById('portal-tbody').innerHTML='<tr><td colspan="6" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function openPortalClient(clientId){
      var name=arguments.length>1?arguments[1]:''
      Promise.all([
        api('GET','/portal/messages?client_id='+clientId).catch(function(){return[]}),
        api('GET','/portal/documents?client_id='+clientId).catch(function(){return[]})
      ]).then(function(results){
        var messages=results[0]||[],docs=results[1]||[]
        var msgHtml=messages.length?messages.map(function(m){
          return '<div class="flex-between" style="padding:10px 0;border-bottom:1px solid #1a1a1a;font-size:13px"><div><strong style="color:'+(m.sender_type==='client'?'#00f0ff':'#fff')+'">'+esc(m.sender_name||(m.sender_type==='client'?'Client':'Team'))+'</strong><br><span class="text-sm text-muted">'+esc(m.content)+'</span><br><span class="text-xs text-muted">'+fmtDate(m.created_at)+'</span></div></div>'
        }).join(''):'<p class="text-sm text-muted">No messages</p>'
        var docHtml=docs.length?docs.map(function(d){
          return '<div class="flex-between" style="padding:10px 0;border-bottom:1px solid #1a1a1a;font-size:13px"><div><strong>'+esc(d.title)+'</strong><br><span class="text-sm text-muted">'+(d.uploaded_by==='client'?'Uploaded by client':'Shared by team')+' &middot; '+fmtDate(d.created_at)+'</span></div>'+(d.file_url?'<a href="'+esc(d.file_url)+'" target="_blank" class="btn btn-sm btn-secondary">View</a>':'')+'</div>'
        }).join(''):'<p class="text-sm text-muted">No documents</p>'
        openDrawer(name||'Client Portal',
          '<div class="drawer-section"><div class="drawer-section-title">Messages <button class="btn btn-sm btn-accent" onclick="closeDrawer();replyToClient(\''+clientId+'\')">Reply</button></div>'+msgHtml+'</div>'+
          '<div class="drawer-section"><div class="drawer-section-title">Documents <button class="btn btn-sm btn-accent" onclick="closeDrawer();shareDocument(\''+clientId+'\')">+ Share</button></div>'+docHtml+'</div>')
      }).catch(function(e){toast(e.message,'error')})
    }

    function replyToClient(clientId){
      openModal('Reply to Client',
        '<div class="field"><label>Sender Name</label><input id="pr-name" value="Team"></div>'+
        '<div class="field"><label>Message</label><textarea id="pr-content" placeholder="Type your reply..." style="min-height:120px"></textarea></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveClientReply(\''+clientId+'\')">Send Reply</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveClientReply(clientId){
      var body={client_id:clientId,content:document.getElementById('pr-content').value.trim(),sender_name:document.getElementById('pr-name').value.trim()||'Team'}
      if(!body.content){toast('Message required','error');return}
      api('POST','/portal/reply',body).then(function(){toast('Reply sent','success');closeModal();openPortalClient(clientId)}).catch(function(e){toast(e.message,'error')})
    }

    function shareDocument(clientId){
      openModal('Share Document',
        '<div class="field"><label>Title</label><input id="sd-title" placeholder="Document title"></div>'+
        '<div class="field"><label>File URL</label><input id="sd-url" placeholder="https://..."></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveSharedDocument(\''+clientId+'\')">Share</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveSharedDocument(clientId){
      var body={client_id:clientId,title:document.getElementById('sd-title').value.trim(),file_url:document.getElementById('sd-url').value.trim()}
      if(!body.title||!body.file_url){toast('Title and URL required','error');return}
      api('POST','/portal/documents',body).then(function(){toast('Document shared','success');closeModal();openPortalClient(clientId)}).catch(function(e){toast(e.message,'error')})
    }

    // ─── Init ───
    route()
  </script>
</body>
</html>`
}
