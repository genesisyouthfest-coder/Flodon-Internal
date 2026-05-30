// ─────────────────────────────────────────────
//  Flodon CRM — Single-Page Admin UI
// ─────────────────────────────────────────────

export function getCRMHTML(url) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flodon CRM</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #09090b;
      color: #fafaf9;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }

    .mono { font-family: 'JetBrains Mono', monospace; }

    /* ─── Layout ─── */
    .app { display: flex; min-height: 100vh; }

    .sidebar {
      width: 220px;
      flex-shrink: 0;
      background: #18181b;
      border-right: 1px solid #27272a;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0; bottom: 0;
      z-index: 100;
    }
    .sidebar-brand {
      padding: 24px 20px 20px;
      border-bottom: 1px solid #27272a;
    }
    .sidebar-brand h1 {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.04em;
      color: #fafaf9;
    }
    .sidebar-brand p {
      font-size: 11px;
      color: #71717a;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
    .sidebar-nav a {
      display: block;
      padding: 10px 20px;
      font-size: 13px;
      font-weight: 500;
      color: #71717a;
      text-decoration: none;
      border-left: 3px solid transparent;
      transition: all 0.15s;
    }
    .sidebar-nav a:hover { color: #fafaf9; background: rgba(255,255,255,0.03); }
    .sidebar-nav a.active {
      color: #fafaf9;
      border-left-color: #fafaf9;
      background: rgba(255,255,255,0.04);
    }

    .main {
      flex: 1;
      margin-left: 220px;
      padding: 32px 36px 60px;
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
    }
    .page-header h2 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .page-header p {
      font-size: 13px;
      color: #71717a;
      margin-top: 4px;
    }

    /* ─── Cards ─── */
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      transition: border-color 0.2s;
    }
    .card:hover { border-color: #3f3f46; }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: #fafaf9;
      margin-bottom: 16px;
      letter-spacing: -0.01em;
    }

    /* ─── Stat Grid ─── */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      padding: 20px;
      transition: border-color 0.2s;
    }
    .stat-card:hover { border-color: #3f3f46; }
    .stat-label { font-size: 12px; color: #71717a; font-weight: 500; margin-bottom: 8px; }
    .stat-value { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }

    /* ─── Progress Bars ─── */
    .stage-bar { margin-bottom: 14px; }
    .stage-bar-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 6px;
    }
    .stage-bar-label { color: #a1a1aa; text-transform: capitalize; }
    .stage-bar-count { color: #71717a; }
    .stage-bar-track {
      height: 8px;
      background: #27272a;
      border-radius: 4px;
      overflow: hidden;
    }
    .stage-bar-fill {
      height: 100%;
      background: #a78bfa;
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    /* ─── Forms ─── */
    .field { margin-bottom: 16px; }
    .field:last-child { margin-bottom: 0; }
    .field label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #a1a1aa;
      margin-bottom: 8px;
    }
    .field input, .field select, .field textarea {
      width: 100%;
      padding: 11px 14px;
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 8px;
      color: #fafaf9;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .field textarea { min-height: 80px; resize: vertical; }
    .field input:focus, .field select:focus, .field textarea:focus {
      border-color: #a78bfa;
      box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.15);
    }
    .field input::placeholder, .field textarea::placeholder { color: #52525b; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      align-items: center;
    }
    .filters input, .filters select {
      padding: 9px 12px;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      color: #fafaf9;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
      outline: none;
    }
    .filters input:focus, .filters select:focus { border-color: #a78bfa; }
    .filters input { min-width: 220px; }

    /* ─── Buttons ─── */
    .btn {
      padding: 10px 18px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .btn-primary { background: #fafaf9; color: #09090b; }
    .btn-primary:hover { background: #e4e4e7; transform: translateY(-1px); }
    .btn-accent { background: #a78bfa; color: #09090b; }
    .btn-accent:hover { background: #9333ea; color: #fafaf9; }
    .btn-secondary {
      background: transparent;
      color: #a1a1aa;
      border: 1px solid #27272a;
    }
    .btn-secondary:hover { border-color: #3f3f46; color: #fafaf9; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

    /* ─── Tables ─── */
    .table-wrap { overflow-x: auto; }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    table.data-table th {
      text-align: left;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 600;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #27272a;
    }
    table.data-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #27272a;
      color: #d4d4d8;
    }
    table.data-table tr { cursor: pointer; transition: background 0.15s; }
    table.data-table tr:hover td { background: rgba(255,255,255,0.02); }
    table.data-table tr.no-click { cursor: default; }
    table.data-table tr.no-click:hover td { background: transparent; }

    /* ─── Badges ─── */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: capitalize;
    }
    .badge-purple { background: rgba(167,139,250,0.15); color: #a78bfa; }
    .badge-blue { background: rgba(59,130,246,0.15); color: #60a5fa; }
    .badge-green { background: rgba(34,197,94,0.15); color: #22c55e; }
    .badge-red { background: rgba(239,68,68,0.15); color: #ef4444; }
    .badge-gray { background: rgba(113,113,122,0.15); color: #a1a1aa; }
    .badge-amber { background: rgba(245,158,11,0.15); color: #fbbf24; }

    /* ─── Kanban ─── */
    .kanban {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding-bottom: 16px;
      min-height: calc(100vh - 180px);
    }
    .kanban-col {
      min-width: 280px;
      max-width: 280px;
      flex-shrink: 0;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 160px);
    }
    .kanban-col-header {
      padding: 16px;
      border-bottom: 1px solid #27272a;
    }
    .kanban-col-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: capitalize;
      margin-bottom: 4px;
    }
    .kanban-col-meta {
      font-size: 12px;
      color: #71717a;
    }
    .kanban-cards {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .deal-card {
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 10px;
      padding: 14px;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .deal-card:hover { border-color: #a78bfa; }
    .deal-card-client { font-size: 11px; color: #71717a; margin-bottom: 4px; }
    .deal-card-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; line-height: 1.3; }
    .deal-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .deal-card-amount { font-size: 14px; font-weight: 600; color: #a78bfa; }
    .deal-card-days { font-size: 11px; color: #52525b; }

    /* ─── Activity Feed ─── */
    .activity-item {
      display: flex;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #27272a;
      font-size: 13px;
    }
    .activity-item:last-child { border-bottom: none; }
    .activity-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #a78bfa;
      margin-top: 5px;
      flex-shrink: 0;
    }
    .activity-text { color: #d4d4d8; line-height: 1.4; }
    .activity-meta { font-size: 11px; color: #52525b; margin-top: 4px; }

    /* ─── Drawer ─── */
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 200;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s;
    }
    .drawer-overlay.open { opacity: 1; pointer-events: auto; }
    .drawer {
      position: fixed;
      top: 0; right: -520px;
      width: 520px;
      max-width: 100vw;
      height: 100vh;
      background: #18181b;
      border-left: 1px solid #27272a;
      z-index: 201;
      transition: right 0.3s ease;
      display: flex;
      flex-direction: column;
    }
    .drawer.open { right: 0; }
    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #27272a;
    }
    .drawer-header h3 { font-size: 16px; font-weight: 700; }
    .drawer-close {
      background: none; border: none; color: #71717a;
      font-size: 20px; cursor: pointer; padding: 4px 8px;
    }
    .drawer-close:hover { color: #fafaf9; }
    .drawer-body { flex: 1; overflow-y: auto; padding: 24px; }
    .drawer-section { margin-bottom: 24px; }
    .drawer-section-title {
      font-size: 11px;
      font-weight: 600;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 12px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #27272a;
      font-size: 13px;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #71717a; }
    .detail-value { color: #fafaf9; text-align: right; max-width: 60%; }

    /* ─── Modal ─── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 300;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-overlay.open { display: flex; }
    .modal {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 14px;
      width: 100%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #27272a;
    }
    .modal-header h3 { font-size: 16px; font-weight: 700; }
    .modal-body { padding: 24px; }
    .modal-footer {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      padding: 16px 24px;
      border-top: 1px solid #27272a;
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

    /* ─── Skeleton ─── */
    .skeleton {
      background: linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .skeleton-stat { height: 80px; border-radius: 12px; }
    .skeleton-row { height: 44px; margin-bottom: 8px; }
    .skeleton-card { height: 120px; border-radius: 10px; margin-bottom: 10px; }

    /* ─── Searchable Dropdown ─── */
    .search-dropdown { position: relative; }
    .search-dropdown-list {
      position: absolute;
      top: 100%; left: 0; right: 0;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 50;
      display: none;
      margin-top: 4px;
    }
    .search-dropdown-list.open { display: block; }
    .search-dropdown-item {
      padding: 10px 14px;
      font-size: 13px;
      cursor: pointer;
      border-bottom: 1px solid #27272a;
    }
    .search-dropdown-item:hover { background: rgba(167,139,250,0.1); color: #a78bfa; }
    .search-dropdown-item:last-child { border-bottom: none; }

    .empty-state {
      text-align: center;
      padding: 48px 20px;
      color: #71717a;
      font-size: 14px;
    }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    @media (max-width: 1100px) {
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
      .grid-2 { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main { margin-left: 0; padding: 20px; }
      .stat-grid { grid-template-columns: 1fr; }
      .drawer { width: 100vw; right: -100vw; }
    }
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
        <a href="#calls" data-route="calls">Calls</a>
        <a href="#tasks" data-route="tasks">Tasks</a>
        <a href="#email-queue" data-route="email-queue">Email Queue</a>
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
    var DEAL_STAGES = ['lead', 'contacted', 'demo', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
    var CLIENT_STAGES = ['lead', 'contacted', 'demo', 'proposal', 'negotiation', 'won', 'lost', 'call_booked']
    var PRIORITIES = ['low', 'medium', 'high', 'urgent']
    var cachedCompanies = null
    var cachedClients = null

    // ─── Router ───
    var routes = {
      dashboard: renderDashboard,
      pipeline: renderPipeline,
      clients: renderClients,
      companies: renderCompanies,
      deals: renderDeals,
      calls: renderCalls,
      tasks: renderTasks,
      'email-queue': renderEmailQueue
    }

    function navigate() {
      var hash = (location.hash || '#dashboard').slice(1)
      if (!routes[hash]) hash = 'dashboard'
      document.querySelectorAll('.sidebar-nav a').forEach(function(a) {
        a.classList.toggle('active', a.dataset.route === hash)
      })
      closeDrawer()
      routes[hash]()
    }

    window.addEventListener('hashchange', navigate)
    navigate()

    // ─── API Helper ───
    async function api(path, opts) {
      opts = opts || {}
      var res = await fetch(API + path, {
        method: opts.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: opts.body ? JSON.stringify(opts.body) : undefined
      })
      var data = await res.json()
      if (!data.success) throw new Error(data.error || 'Request failed')
      return data
    }

    // ─── Formatters ───
    function fmtMoney(n) {
      if (n == null || isNaN(n)) return '—'
      return '₹' + Number(n).toLocaleString('en-IN')
    }
    function fmtDate(d) {
      if (!d) return '—'
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    }
    function fmtDateTime(d) {
      if (!d) return '—'
      return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
    function fmtPct(n) {
      if (n == null || isNaN(n)) return '—'
      return Number(n).toFixed(1) + '%'
    }
    function esc(s) {
      if (!s) return ''
      var d = document.createElement('div')
      d.textContent = s
      return d.innerHTML
    }
    function stageBadge(stage) {
      var cls = 'badge-gray'
      if (stage === 'closed_won' || stage === 'won') cls = 'badge-green'
      else if (stage === 'closed_lost' || stage === 'lost') cls = 'badge-red'
      else if (stage === 'negotiation' || stage === 'proposal') cls = 'badge-purple'
      else if (stage === 'demo') cls = 'badge-blue'
      return '<span class="badge ' + cls + '">' + esc(stage || '—').replace(/_/g, ' ') + '</span>'
    }
    function statusBadge(status) {
      var map = { queued: 'badge-purple', sending: 'badge-blue', sent: 'badge-green', failed: 'badge-red' }
      return '<span class="badge ' + (map[status] || 'badge-gray') + '">' + esc(status || '—') + '</span>'
    }
    function daysInStage(updatedAt) {
      if (!updatedAt) return 0
      return Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86400000)
    }
    function probBadge(p) {
      var cls = p >= 70 ? 'badge-green' : p >= 40 ? 'badge-amber' : 'badge-gray'
      return '<span class="badge ' + cls + ' mono">' + (p != null ? p : '—') + '%</span>'
    }

    // ─── UI Helpers ───
    function showToast(msg, type) {
      var t = document.getElementById('toast')
      t.textContent = msg
      t.className = 'toast show ' + (type || 'success')
      setTimeout(function() { t.className = 'toast' }, 4000)
    }

    function openDrawer(title, html) {
      document.getElementById('drawer-title').textContent = title
      document.getElementById('drawer-body').innerHTML = html
      document.getElementById('drawer-overlay').classList.add('open')
      document.getElementById('drawer').classList.add('open')
    }

    function closeDrawer() {
      document.getElementById('drawer-overlay').classList.remove('open')
      document.getElementById('drawer').classList.remove('open')
    }

    function openModal(title, bodyHtml, footerHtml) {
      document.getElementById('modal-title').textContent = title
      document.getElementById('modal-body').innerHTML = bodyHtml
      document.getElementById('modal-footer').innerHTML = footerHtml || ''
      document.getElementById('modal-overlay').classList.add('open')
    }

    function closeModal() {
      document.getElementById('modal-overlay').classList.remove('open')
    }

    function skeletonStats() {
      return '<div class="stat-grid">' + Array(4).fill('<div class="skeleton skeleton-stat"></div>').join('') + '</div>'
    }

    function skeletonTable(rows) {
      rows = rows || 6
      return Array(rows).fill('<div class="skeleton skeleton-row"></div>').join('')
    }

    function pageHeader(title, subtitle, actionHtml) {
      return '<div class="page-header"><div><h2>' + title + '</h2>' +
        (subtitle ? '<p>' + subtitle + '</p>' : '') +
        '</div>' + (actionHtml || '') + '</div>'
    }

    async function loadCompanies() {
      if (cachedCompanies) return cachedCompanies
      var res = await api('/companies')
      cachedCompanies = res.data || []
      return cachedCompanies
    }

    async function loadClientsList() {
      if (cachedClients) return cachedClients
      var res = await api('/clients?page=1&search=')
      cachedClients = res.data?.clients || res.clients || []
      return cachedClients
    }

    function companyOptions(companies, selected) {
      return '<option value="">— None —</option>' +
        companies.map(function(c) {
          return '<option value="' + c.id + '"' + (c.id === selected ? ' selected' : '') + '>' + esc(c.name) + '</option>'
        }).join('')
    }

    function clientOptions(clients, selected) {
      return '<option value="">— None —</option>' +
        clients.map(function(c) {
          var label = c.name + (c.company_name ? ' (' + c.company_name + ')' : '')
          return '<option value="' + c.id + '"' + (c.id === selected ? ' selected' : '') + '>' + esc(label) + '</option>'
        }).join('')
    }

    function searchableClientDropdown(id, inputId) {
      return '<div class="search-dropdown" id="' + id + '-wrap">' +
        '<input type="text" id="' + inputId + '" placeholder="Search clients..." autocomplete="off" />' +
        '<input type="hidden" id="' + id + '" />' +
        '<div class="search-dropdown-list" id="' + id + '-list"></div></div>'
    }

    async function initClientSearch(wrapId, inputId, hiddenId) {
      var clients = await loadClientsList()
      var input = document.getElementById(inputId)
      var hidden = document.getElementById(hiddenId)
      var list = document.getElementById(hiddenId + '-list')

      input.addEventListener('input', function() {
        var q = input.value.toLowerCase()
        var matches = clients.filter(function(c) {
          return (c.name || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.company_name || '').toLowerCase().includes(q)
        }).slice(0, 8)
        if (!q) { list.classList.remove('open'); return }
        list.innerHTML = matches.length ? matches.map(function(c) {
          return '<div class="search-dropdown-item" data-id="' + c.id + '" data-label="' + esc(c.name) + '">' +
            esc(c.name) + (c.email ? ' · ' + esc(c.email) : '') + '</div>'
        }).join('') : '<div class="search-dropdown-item" style="color:#71717a;cursor:default">No matches</div>'
        list.classList.add('open')
        list.querySelectorAll('.search-dropdown-item[data-id]').forEach(function(el) {
          el.onclick = function() {
            hidden.value = el.dataset.id
            input.value = el.dataset.label
            list.classList.remove('open')
          }
        })
      })
      input.addEventListener('blur', function() { setTimeout(function() { list.classList.remove('open') }, 200) })
    }

    // ─── Dashboard ───
    async function renderDashboard() {
      var el = document.getElementById('main-content')
      el.innerHTML = pageHeader('Dashboard', 'CRM overview and activity') + skeletonStats() +
        '<div class="grid-2"><div class="card" id="stage-card"><div class="card-title">Deals by Stage</div>' +
        skeletonTable(5) + '</div><div class="card" id="email-card"><div class="card-title">Email Queue</div>' +
        skeletonTable(3) + '</div></div>' +
        '<div class="card" id="activity-card"><div class="card-title">Recent Activity</div>' + skeletonTable(5) + '</div>'

      try {
        var res = await api('/dashboard-stats')
        var s = res.data || res

        el.innerHTML = pageHeader('Dashboard', 'CRM overview and activity') +
          '<div class="stat-grid">' +
          '<div class="stat-card"><div class="stat-label">Pipeline Value</div><div class="stat-value mono">' + fmtMoney(s.pipeline_value || s.total_pipeline_value) + '</div></div>' +
          '<div class="stat-card"><div class="stat-label">Closed Won (Month)</div><div class="stat-value mono">' + fmtMoney(s.closed_won_value || s.closed_won_month_value) + '</div><div style="font-size:12px;color:#71717a;margin-top:4px"><span class="mono">' + (s.closed_won_count || s.closed_won_month_count || 0) + '</span> deals</div></div>' +
          '<div class="stat-card"><div class="stat-label">Conversion Rate</div><div class="stat-value mono">' + fmtPct(s.conversion_rate) + '</div></div>' +
          '<div class="stat-card"><div class="stat-label">Avg Deal Size</div><div class="stat-value mono">' + fmtMoney(s.avg_deal_size) + '</div></div>' +
          '</div>' +
          '<div class="grid-2">' +
          '<div class="card"><div class="card-title">Deals by Stage</div>' + renderStageBars(s.deals_by_stage || s.stage_counts || {}) + '</div>' +
          '<div class="card"><div class="card-title">Email Queue</div>' + renderEmailSummary(s.email_queue || s.email_queue_counts || {}) + '</div>' +
          '</div>' +
          '<div class="card"><div class="card-title">Recent Activity</div>' + renderActivityFeed(s.recent_activity || []) + '</div>'
      } catch (err) {
        showToast('Failed to load dashboard: ' + err.message, 'error')
      }
    }

    function renderStageBars(stages) {
      var entries = typeof stages === 'object' && !Array.isArray(stages)
        ? Object.entries(stages) : (stages || []).map(function(s) { return [s.stage, s.count] })
      if (!entries.length) return '<div class="empty-state">No deals yet</div>'
      var max = Math.max.apply(null, entries.map(function(e) { return Number(e[1]) || 0 })) || 1
      return entries.map(function(e) {
        var pct = Math.round((Number(e[1]) || 0) / max * 100)
        return '<div class="stage-bar"><div class="stage-bar-header"><span class="stage-bar-label">' +
          esc(String(e[0]).replace(/_/g, ' ')) + '</span><span class="stage-bar-count mono">' + e[1] + '</span></div>' +
          '<div class="stage-bar-track"><div class="stage-bar-fill" style="width:' + pct + '%"></div></div></div>'
      }).join('')
    }

    function renderEmailSummary(counts) {
      var items = [
        ['Queued', counts.queued || 0, 'badge-purple'],
        ['Sending', counts.sending || 0, 'badge-blue'],
        ['Sent', counts.sent || 0, 'badge-green'],
        ['Failed', counts.failed || 0, 'badge-red']
      ]
      return items.map(function(i) {
        return '<div class="detail-row"><span class="detail-label">' + i[0] + '</span><span class="badge ' + i[2] + ' mono">' + i[1] + '</span></div>'
      }).join('')
    }

    function renderActivityFeed(items) {
      if (!items.length) return '<div class="empty-state">No recent activity</div>'
      return items.map(function(a) {
        var who = a.full_name || a.profile_name || a.actor || 'System'
        var text = a.action || a.description || a.entity_type || 'Activity'
        return '<div class="activity-item"><div class="activity-dot"></div><div><div class="activity-text">' +
          esc(text) + '</div><div class="activity-meta">' + esc(who) + ' · ' + fmtDateTime(a.created_at) + '</div></div></div>'
      }).join('')
    }

    // ─── Pipeline ───
    async function renderPipeline() {
      var el = document.getElementById('main-content')
      el.innerHTML = pageHeader('Pipeline', 'Deal kanban board',
        '<button class="btn btn-primary" onclick="openAddDealModal()">+ Add Deal</button>') +
        '<div class="kanban" id="kanban">' + Array(5).fill('<div class="kanban-col"><div class="skeleton skeleton-card"></div></div>').join('') + '</div>'

      try {
        var res = await api('/pipeline')
        var grouped = res.data || res.pipeline || {}
        var stages = Object.keys(grouped).length ? Object.keys(grouped) : DEAL_STAGES

        document.getElementById('kanban').innerHTML = stages.map(function(stage) {
          var deals = grouped[stage] || []
          var total = deals.reduce(function(s, d) { return s + (Number(d.amount_monthly) || 0) }, 0)
          return '<div class="kanban-col"><div class="kanban-col-header">' +
            '<div class="kanban-col-title">' + esc(stage.replace(/_/g, ' ')) + '</div>' +
            '<div class="kanban-col-meta"><span class="mono">' + deals.length + '</span> deals · <span class="mono">' + fmtMoney(total) + '</span></div></div>' +
            '<div class="kanban-cards">' +
            (deals.length ? deals.map(function(d) {
              return '<div class="deal-card" onclick="openDealDrawer(' + "'" + d.id + "'" + ')">' +
                '<div class="deal-card-client">' + esc(d.client_name || d.client?.name || '—') + '</div>' +
                '<div class="deal-card-title">' + esc(d.title || 'Untitled Deal') + '</div>' +
                '<div class="deal-card-footer">' +
                '<span class="deal-card-amount mono">' + fmtMoney(d.amount_monthly) + '</span>' +
                probBadge(d.probability) +
                '<span class="deal-card-days mono">' + daysInStage(d.updated_at) + 'd</span></div></div>'
            }).join('') : '<div class="empty-state" style="padding:20px">Empty</div>') +
            '</div></div>'
        }).join('')
      } catch (err) {
        showToast('Failed to load pipeline: ' + err.message, 'error')
      }
    }

    async function openDealDrawer(dealId) {
      try {
        var res = await api('/deals?')
        var deals = res.data || res.deals || []
        var deal = deals.find(function(d) { return String(d.id) === String(dealId) })
        if (!deal) {
          var pipe = await api('/pipeline')
          var grouped = pipe.data || pipe.pipeline || {}
          Object.values(grouped).forEach(function(arr) {
            arr.forEach(function(d) { if (String(d.id) === String(dealId)) deal = d })
          })
        }
        if (!deal) { showToast('Deal not found', 'error'); return }

        var offer = deal.custom_offer || {}
        var offerFields = Object.keys(offer).length
          ? Object.entries(offer).map(function(e) {
              return '<div class="field"><label>' + esc(e[0]) + '</label><input type="text" id="offer-' + esc(e[0]) + '" value="' + esc(String(e[1])) + '" /></div>'
            }).join('')
          : '<div class="field"><label>Offer Details</label><input type="text" id="offer-details" placeholder="Custom offer notes" /></div>' +
            '<div class="field"><label>Price</label><input type="number" id="offer-price" placeholder="Amount" /></div>'

        var stageOpts = DEAL_STAGES.map(function(s) {
          return '<option value="' + s + '"' + (deal.stage === s ? ' selected' : '') + '>' + s.replace(/_/g, ' ') + '</option>'
        }).join('')

        openDrawer(deal.title || 'Deal Details',
          '<div class="drawer-section"><div class="detail-row"><span class="detail-label">Client</span><span class="detail-value">' + esc(deal.client_name || '—') + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Value</span><span class="detail-value mono">' + fmtMoney(deal.amount_monthly) + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Probability</span><span class="detail-value">' + probBadge(deal.probability) + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Expected Close</span><span class="detail-value">' + fmtDate(deal.expected_close) + '</span></div></div>' +
          '<div class="drawer-section"><div class="drawer-section-title">Stage</div><div class="field"><select id="deal-stage-select">' + stageOpts + '</select></div></div>' +
          '<div class="drawer-section"><div class="drawer-section-title">Custom Offer</div>' + offerFields +
          '<button class="btn btn-accent btn-sm" style="margin-top:12px" onclick="saveDealOffer(' + "'" + deal.id + "'" + ')">Save Offer</button></div>' +
          '<div class="drawer-section"><div class="drawer-section-title">Activity</div><div id="deal-activity">' + skeletonTable(3) + '</div></div>')

        document.getElementById('deal-stage-select').onchange = async function() {
          try {
            await api('/deals/' + deal.id, { method: 'PATCH', body: { stage: this.value } })
            showToast('Stage updated')
            renderPipeline()
          } catch (err) { showToast(err.message, 'error') }
        }

        loadDealActivity(deal.id)
      } catch (err) { showToast(err.message, 'error') }
    }

    async function loadDealActivity(dealId) {
      try {
        var res = await api('/dashboard-stats')
        var items = (res.data || res).recent_activity || (res.data || res).recentActivity || []
        var filtered = items.filter(function(a) {
          return String(a.entity_id) === String(dealId) || (a.metadata && String(a.metadata.deal_id) === String(dealId))
        })
        document.getElementById('deal-activity').innerHTML = filtered.length
          ? renderActivityFeed(filtered)
          : '<div class="empty-state" style="padding:16px">No activity logged yet</div>'
      } catch (e) {
        document.getElementById('deal-activity').innerHTML = '<div class="empty-state" style="padding:16px">Could not load activity</div>'
      }
    }

    window.saveDealOffer = async function(dealId) {
      var offer = {}
      document.querySelectorAll('[id^="offer-"]').forEach(function(el) {
        offer[el.id.replace('offer-', '')] = el.value
      })
      try {
        await api('/deals/' + dealId, { method: 'PATCH', body: { custom_offer: offer } })
        showToast('Offer saved')
      } catch (err) { showToast(err.message, 'error') }
    }

    window.openAddDealModal = async function() {
      var clients = await loadClientsList()
      openModal('Add Deal',
        '<div class="field"><label>Title</label><input type="text" id="deal-title" placeholder="Deal title" /></div>' +
        '<div class="field"><label>Client</label><select id="deal-client">' + clientOptions(clients) + '</select></div>' +
        '<div class="field-row"><div class="field"><label>Value (₹/mo)</label><input type="number" id="deal-amount" placeholder="0" /></div>' +
        '<div class="field"><label>Probability %</label><input type="number" id="deal-prob" value="50" min="0" max="100" /></div></div>' +
        '<div class="field-row"><div class="field"><label>Stage</label><select id="deal-stage">' +
        DEAL_STAGES.map(function(s) { return '<option value="' + s + '">' + s.replace(/_/g, ' ') + '</option>' }).join('') +
        '</select></div><div class="field"><label>Expected Close</label><input type="date" id="deal-close" /></div></div>',
        '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="submitAddDeal()">Create Deal</button>')
    }

    window.submitAddDeal = async function() {
      try {
        await api('/deals', {
          method: 'POST',
          body: {
            title: document.getElementById('deal-title').value.trim(),
            client_id: document.getElementById('deal-client').value || null,
            amount_monthly: Number(document.getElementById('deal-amount').value) || 0,
            probability: Number(document.getElementById('deal-prob').value) || 50,
            stage: document.getElementById('deal-stage').value,
            expected_close: document.getElementById('deal-close').value || null
          }
        })
        closeModal()
        showToast('Deal created')
        renderPipeline()
      } catch (err) { showToast(err.message, 'error') }
    }

    // ─── Clients ───
    var clientFilters = { search: '', stage: '' }

    async function renderClients() {
      var el = document.getElementById('main-content')
      el.innerHTML = pageHeader('Clients', 'Manage leads and prospects',
        '<button class="btn btn-primary" onclick="openAddClientModal()">+ Add Client</button>') +
        '<div class="filters">' +
        '<input type="text" id="client-search" placeholder="Search name, email, company..." value="' + esc(clientFilters.search) + '" />' +
        '<select id="client-stage-filter"><option value="">All Stages</option>' +
        CLIENT_STAGES.map(function(s) {
          return '<option value="' + s + '"' + (clientFilters.stage === s ? ' selected' : '') + '>' + s.replace(/_/g, ' ') + '</option>'
        }).join('') + '</select></div>' +
        '<div class="card table-wrap" id="clients-table">' + skeletonTable(8) + '</div>'

      document.getElementById('client-search').oninput = debounce(function() {
        clientFilters.search = document.getElementById('client-search').value
        loadClientsTable()
      }, 300)
      document.getElementById('client-stage-filter').onchange = function() {
        clientFilters.stage = this.value
        loadClientsTable()
      }

      loadClientsTable()
    }

    async function loadClientsTable() {
      try {
        var q = '?page=1&search=' + encodeURIComponent(clientFilters.search) + '&stage=' + encodeURIComponent(clientFilters.stage)
        var res = await api('/clients' + q)
        var clients = res.data?.clients || res.clients || []

        document.getElementById('clients-table').innerHTML = clients.length
          ? '<table class="data-table"><thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Stage</th><th>Source</th><th>Created</th><th></th></tr></thead><tbody>' +
            clients.map(function(c) {
              return '<tr onclick="openClientDrawer(' + "'" + c.id + "'" + ')"><td>' + esc(c.name) + '</td><td>' + esc(c.company_name || c.brand_name || '—') +
                '</td><td>' + esc(c.email || '—') + '</td><td>' + stageBadge(c.pipeline_stage) +
                '</td><td>' + esc(c.lead_source || c.source || '—') + '</td><td class="mono">' + fmtDate(c.created_at) +
                '</td><td><button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();openClientDrawer(' + "'" + c.id + "'" + ')">View</button></td></tr>'
            }).join('') + '</tbody></table>'
          : '<div class="empty-state">No clients found</div>'
      } catch (err) {
        showToast(err.message, 'error')
      }
    }

    window.openAddClientModal = async function() {
      openModal('Add Client',
        '<div class="field-row"><div class="field"><label>Name *</label><input type="text" id="cl-name" /></div>' +
        '<div class="field"><label>Email</label><input type="email" id="cl-email" /></div></div>' +
        '<div class="field-row"><div class="field"><label>Phone</label><input type="text" id="cl-phone" /></div>' +
        '<div class="field"><label>Company</label><input type="text" id="cl-company" placeholder="Company Name" /></div></div>' +
        '<div class="field-row"><div class="field"><label>Role</label><input type="text" id="cl-role" /></div>' +
        '<div class="field"><label>Industry</label><input type="text" id="cl-industry" /></div></div>' +
        '<div class="field-row"><div class="field"><label>Service</label><input type="text" id="cl-service" /></div>' +
        '<div class="field"><label>Source</label><select id="cl-source"><option value="manual">Manual</option><option value="website">Website</option><option value="referral">Referral</option></select></div></div>' +
        '<div class="field"><label>Notes</label><textarea id="cl-notes"></textarea></div>',
        '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="submitAddClient()">Add Client</button>')
    }

    window.submitAddClient = async function() {
      var source = document.getElementById('cl-source').value
      try {
        await api('/clients', {
          method: 'POST',
          body: {
            name: document.getElementById('cl-name').value.trim(),
            email: document.getElementById('cl-email').value.trim(),
            phone: document.getElementById('cl-phone').value.trim(),
            company_name: document.getElementById('cl-company').value.trim() || null,
            role: document.getElementById('cl-role').value.trim(),
            industry: document.getElementById('cl-industry').value.trim(),
            service: document.getElementById('cl-service').value.trim(),
            source: source,
            notes: document.getElementById('cl-notes').value.trim()
          }
        })
        cachedClients = null
        closeModal()
        showToast(source === 'manual' ? 'Client added · Added to outreach queue' : 'Client added')
        loadClientsTable()
      } catch (err) { showToast(err.message, 'error') }
    }

    window.openClientDrawer = async function(clientId) {
      try {
        var q = '?page=1&search='
        var res = await api('/clients' + q)
        var clients = res.data?.clients || res.clients || []
        var client = clients.find(function(c) { return String(c.id) === String(clientId) })
        if (!client) { showToast('Client not found', 'error'); return }

        var stageOpts = CLIENT_STAGES.map(function(s) {
          return '<option value="' + s + '"' + (client.pipeline_stage === s ? ' selected' : '') + '>' + s.replace(/_/g, ' ') + '</option>'
        }).join('')
        
        var sourceOpts = ['manual', 'website', 'referral'].map(function(s) {
          return '<option value="' + s + '"' + ((client.lead_source || client.source || 'manual') === s ? ' selected' : '') + '>' + s + '</option>'
        }).join('')

        openDrawer(client.name,
          '<div class="drawer-section">' +
          '<div class="field"><label>Email</label><input type="email" id="edit-client-email" value="' + esc(client.email || '') + '" /></div>' +
          '<div class="field"><label>Phone</label><input type="text" id="edit-client-phone" value="' + esc(client.phone || '') + '" /></div>' +
          '<div class="field"><label>Company</label><input type="text" id="edit-client-company" value="' + esc(client.company_name || client.brand_name || '') + '" /></div>' +
          '<div class="field-row"><div class="field"><label>Stage</label><select id="edit-client-stage">' + stageOpts + '</select></div>' +
          '<div class="field"><label>Source</label><select id="edit-client-source">' + sourceOpts + '</select></div></div>' +
          '<div class="field"><label>Notes</label><textarea id="edit-client-notes">' + esc(client.notes || '') + '</textarea></div>' +
          '<button class="btn btn-accent btn-sm" style="margin-top:12px" onclick="saveClientDetails(' + "'" + client.id + "'" + ')">Save Changes</button>' +
          '</div>' +
          '<div class="drawer-section"><div class="drawer-section-title">Linked Deals</div><div id="client-deals">' + skeletonTable(2) + '</div></div>' +
          '<div class="drawer-section"><div class="drawer-section-title">Tasks</div><div id="client-tasks">' + skeletonTable(2) + '</div></div>' +
          '<div class="drawer-section"><div class="drawer-section-title">Calls</div><div id="client-calls">' + skeletonTable(2) + '</div></div>' +
          '<div class="drawer-section"><div class="drawer-section-title">Activity</div><div id="client-activity">' + skeletonTable(2) + '</div></div>')

        var deals = await api('/deals?client_id=' + clientId)
        document.getElementById('client-deals').innerHTML = renderMiniTable(
          (deals.data || deals.deals || []),
          ['title', 'stage', 'amount_monthly'],
          ['Title', 'Stage', 'Value'],
          function(d) { return [d.title || '—', stageBadge(d.stage), '<span class="mono">' + fmtMoney(d.amount_monthly) + '</span>'] }
        )

        var tasks = await api('/tasks?client_id=' + clientId)
        document.getElementById('client-tasks').innerHTML = renderMiniTable(
          (tasks.data || tasks.tasks || []),
          ['title', 'status', 'deadline'],
          ['Title', 'Status', 'Deadline'],
          function(t) { return [t.title || '—', statusBadge(t.status === 'done' ? 'sent' : 'queued'), fmtDate(t.deadline)] }
        )

        var calls = await api('/calls?client_id=' + clientId)
        document.getElementById('client-calls').innerHTML = renderMiniTable(
          (calls.data || calls.calls || []),
          ['prospect_name', 'status', 'scheduled_at'],
          ['Prospect', 'Status', 'Scheduled'],
          function(c) { return [c.prospect_name || c.client_name || '—', esc(c.status), fmtDateTime(c.scheduled_at)] }
        )

        var actRes = await api('/dashboard-stats')
        var activity = ((actRes.data || actRes).recent_activity || []).filter(function(a) {
          return String(a.entity_id) === String(clientId)
        })
        document.getElementById('client-activity').innerHTML = activity.length
          ? renderActivityFeed(activity)
          : '<div class="empty-state" style="padding:12px">No activity</div>'
      } catch (err) { showToast(err.message, 'error') }
    }

    window.saveClientDetails = async function(clientId) {
      try {
        await api('/clients/' + clientId, {
          method: 'PATCH',
          body: {
            email: document.getElementById('edit-client-email').value.trim() || null,
            phone: document.getElementById('edit-client-phone').value.trim() || null,
            company_name: document.getElementById('edit-client-company').value.trim() || null,
            pipeline_stage: document.getElementById('edit-client-stage').value,
            source: document.getElementById('edit-client-source').value,
            notes: document.getElementById('edit-client-notes').value.trim() || null
          }
        })
        cachedClients = null
        showToast('Client details saved')
        loadClientsTable()
      } catch (err) { showToast(err.message, 'error') }
    }

    function renderMiniTable(items, keys, headers, renderFn) {
      if (!items.length) return '<div class="empty-state" style="padding:12px">None</div>'
      return '<table class="data-table"><thead><tr>' +
        headers.map(function(h) { return '<th>' + h + '</th>' }).join('') +
        '</tr></thead><tbody>' +
        items.map(function(item) {
          var cells = renderFn ? renderFn(item) : keys.map(function(k) { return esc(String(item[k] || '—')) })
          return '<tr class="no-click">' + cells.map(function(c) { return '<td>' + c + '</td>' }).join('') + '</tr>'
        }).join('') + '</tbody></table>'
    }

    // ─── Companies ───
    async function renderCompanies() {
      var el = document.getElementById('main-content')
      el.innerHTML = pageHeader('Companies', 'Organization directory',
        '<button class="btn btn-primary" onclick="openAddCompanyModal()">+ Add Company</button>') +
        '<div class="card table-wrap" id="companies-table">' + skeletonTable(6) + '</div>'

      try {
        var res = await api('/companies')
        var companies = res.data || res.companies || []
        cachedCompanies = companies

        document.getElementById('companies-table').innerHTML = companies.length
          ? '<table class="data-table"><thead><tr><th>Name</th><th>Industry</th><th>Website</th><th>Clients</th></tr></thead><tbody>' +
            companies.map(function(c) {
              return '<tr class="no-click"><td>' + esc(c.name) + '</td><td>' + esc(c.industry || '—') +
                '</td><td>' + (c.website ? '<a href="' + esc(c.website) + '" target="_blank" style="color:#a78bfa">' + esc(c.website) + '</a>' : '—') +
                '</td><td class="mono">' + (c.client_count || 0) + '</td></tr>'
            }).join('') + '</tbody></table>'
          : '<div class="empty-state">No companies yet</div>'
      } catch (err) { showToast(err.message, 'error') }
    }

    window.openAddCompanyModal = function() {
      openModal('Add Company',
        '<div class="field"><label>Name *</label><input type="text" id="co-name" /></div>' +
        '<div class="field-row"><div class="field"><label>Industry</label><input type="text" id="co-industry" /></div>' +
        '<div class="field"><label>Website</label><input type="url" id="co-website" placeholder="https://" /></div></div>',
        '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="submitAddCompany()">Create</button>')
    }

    window.submitAddCompany = async function() {
      try {
        await api('/companies', {
          method: 'POST',
          body: {
            name: document.getElementById('co-name').value.trim(),
            industry: document.getElementById('co-industry').value.trim(),
            website: document.getElementById('co-website').value.trim()
          }
        })
        cachedCompanies = null
        closeModal()
        showToast('Company created')
        renderCompanies()
      } catch (err) { showToast(err.message, 'error') }
    }

    // ─── Deals Table ───
    var dealFilters = { stage: '', client_id: '' }

    async function renderDeals() {
      var el = document.getElementById('main-content')
      el.innerHTML = pageHeader('Deals', 'All deals across pipeline') +
        '<div class="filters"><select id="deal-stage-filter"><option value="">All Stages</option>' +
        DEAL_STAGES.map(function(s) {
          return '<option value="' + s + '">' + s.replace(/_/g, ' ') + '</option>'
        }).join('') + '</select></div>' +
        '<div class="card table-wrap" id="deals-table">' + skeletonTable(8) + '</div>'

      document.getElementById('deal-stage-filter').onchange = function() {
        dealFilters.stage = this.value
        loadDealsTable()
      }
      loadDealsTable()
    }

    async function loadDealsTable() {
      try {
        var q = '?stage=' + encodeURIComponent(dealFilters.stage) + '&client_id=' + encodeURIComponent(dealFilters.client_id)
        var res = await api('/deals' + q)
        var deals = res.data || res.deals || []

        document.getElementById('deals-table').innerHTML = deals.length
          ? '<table class="data-table"><thead><tr><th>Title</th><th>Client</th><th>Stage</th><th>Value</th><th>Probability</th><th>Expected Close</th><th>Assigned</th></tr></thead><tbody>' +
            deals.map(function(d) {
              return '<tr onclick="openDealDrawer(' + "'" + d.id + "'" + ')"><td>' + esc(d.title || '—') +
                '</td><td>' + esc(d.client_name || '—') + '</td><td>' + stageBadge(d.stage) +
                '</td><td class="mono">' + fmtMoney(d.amount_monthly) + '</td><td>' + probBadge(d.probability) +
                '</td><td class="mono">' + fmtDate(d.expected_close) + '</td><td>' + esc(d.assigned_name || d.assigned_to || '—') + '</td></tr>'
            }).join('') + '</tbody></table>'
          : '<div class="empty-state">No deals found</div>'
      } catch (err) { showToast(err.message, 'error') }
    }

    // ─── Calls ───
    async function renderCalls() {
      var el = document.getElementById('main-content')
      el.innerHTML = pageHeader('Calls', 'Scheduled and completed calls',
        '<button class="btn btn-primary" onclick="openAddCallModal()">+ Add Call</button>') +
        '<div class="card table-wrap" id="calls-table">' + skeletonTable(6) + '</div>'

      try {
        var res = await api('/calls?')
        var calls = res.data || res.calls || []

        document.getElementById('calls-table').innerHTML = calls.length
          ? '<table class="data-table"><thead><tr><th>Prospect</th><th>Company</th><th>Scheduled At</th><th>Status</th><th>Outcome</th></tr></thead><tbody>' +
            calls.map(function(c) {
              return '<tr class="no-click"><td>' + esc(c.prospect_name || c.client_name || '—') +
                '</td><td>' + esc(c.company || c.company_name || '—') + '</td><td class="mono">' + fmtDateTime(c.scheduled_at) +
                '</td><td>' + stageBadge(c.status) + '</td><td>' + esc(c.outcome || '—') + '</td></tr>'
            }).join('') + '</tbody></table>'
          : '<div class="empty-state">No calls logged</div>'
      } catch (err) { showToast(err.message, 'error') }
    }

    window.openAddCallModal = function() {
      openModal('Schedule Call',
        '<div class="field"><label>Client</label>' + searchableClientDropdown('call-client', 'call-client-search') + '</div>' +
        '<div class="field"><label>Scheduled At</label><input type="datetime-local" id="call-scheduled" /></div>' +
        '<div class="field"><label>Notes</label><textarea id="call-notes" placeholder="Call notes..."></textarea></div>',
        '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="submitAddCall()">Schedule Call</button>')
      initClientSearch('call-client', 'call-client-search', 'call-client')
    }

    window.submitAddCall = async function() {
      var clientId = document.getElementById('call-client').value
      if (!clientId) { showToast('Please select a client', 'error'); return }
      try {
        await api('/calls', {
          method: 'POST',
          body: {
            client_id: clientId,
            scheduled_at: document.getElementById('call-scheduled').value ? new Date(document.getElementById('call-scheduled').value).toISOString() : new Date().toISOString(),
            notes: document.getElementById('call-notes').value.trim()
          }
        })
        closeModal()
        showToast('Call booking email queued')
        renderCalls()
      } catch (err) { showToast(err.message, 'error') }
    }

    // ─── Tasks ───
    var taskFilter = 'open'

    async function renderTasks() {
      var el = document.getElementById('main-content')
      el.innerHTML = pageHeader('Tasks', 'Track follow-ups and action items',
        '<button class="btn btn-primary" onclick="openAddTaskModal()">+ Add Task</button>') +
        '<div class="filters"><select id="task-status-filter">' +
        '<option value="open"' + (taskFilter === 'open' ? ' selected' : '') + '>Open</option>' +
        '<option value="done"' + (taskFilter === 'done' ? ' selected' : '') + '>Done</option>' +
        '<option value=""' + (taskFilter === '' ? ' selected' : '') + '>All</option></select></div>' +
        '<div class="card table-wrap" id="tasks-table">' + skeletonTable(6) + '</div>'

      document.getElementById('task-status-filter').onchange = function() {
        taskFilter = this.value
        loadTasksTable()
      }
      loadTasksTable()
    }

    async function loadTasksTable() {
      try {
        var q = '?status=' + encodeURIComponent(taskFilter)
        var res = await api('/tasks' + q)
        var tasks = res.data || res.tasks || []

        document.getElementById('tasks-table').innerHTML = tasks.length
          ? '<table class="data-table"><thead><tr><th></th><th>Title</th><th>Client</th><th>Deal</th><th>Deadline</th><th>Priority</th><th>Assigned</th></tr></thead><tbody>' +
            tasks.map(function(t) {
              var done = t.status === 'done'
              return '<tr class="no-click"><td><input type="checkbox"' + (done ? ' checked' : '') +
                ' onchange="toggleTask(' + "'" + t.id + "'" + ', this.checked)" style="accent-color:#a78bfa;width:16px;height:16px;cursor:pointer" /></td>' +
                '<td' + (done ? ' style="text-decoration:line-through;color:#71717a"' : '') + '>' + esc(t.title || '—') + '</td>' +
                '<td>' + esc(t.client_name || '—') + '</td><td>' + esc(t.deal_title || '—') + '</td>' +
                '<td class="mono">' + fmtDate(t.deadline) + '</td><td>' + stageBadge(t.priority) +
                '</td><td>' + esc(t.assigned_name || t.assigned_to || '—') + '</td></tr>'
            }).join('') + '</tbody></table>'
          : '<div class="empty-state">No tasks</div>'
      } catch (err) { showToast(err.message, 'error') }
    }

    window.toggleTask = async function(id, done) {
      try {
        await api('/tasks/' + id, { method: 'PATCH', body: { status: done ? 'done' : 'open' } })
        showToast(done ? 'Task completed' : 'Task reopened')
        loadTasksTable()
      } catch (err) { showToast(err.message, 'error') }
    }

    window.openAddTaskModal = async function() {
      var clients = await loadClientsList()
      openModal('Add Task',
        '<div class="field"><label>Title *</label><input type="text" id="task-title" /></div>' +
        '<div class="field"><label>Description</label><textarea id="task-desc"></textarea></div>' +
        '<div class="field-row"><div class="field"><label>Client</label><select id="task-client">' + clientOptions(clients) + '</select></div>' +
        '<div class="field"><label>Deal ID</label><input type="text" id="task-deal" placeholder="Optional deal UUID" /></div></div>' +
        '<div class="field-row"><div class="field"><label>Deadline</label><input type="date" id="task-deadline" /></div>' +
        '<div class="field"><label>Priority</label><select id="task-priority">' +
        PRIORITIES.map(function(p) { return '<option value="' + p + '">' + p + '</option>' }).join('') +
        '</select></div></div>' +
        '<div class="field"><label>Assigned To</label><input type="text" id="task-assigned" placeholder="Name or profile ID" /></div>',
        '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="submitAddTask()">Create Task</button>')
    }

    window.submitAddTask = async function() {
      try {
        await api('/tasks', {
          method: 'POST',
          body: {
            title: document.getElementById('task-title').value.trim(),
            description: document.getElementById('task-desc').value.trim(),
            client_id: document.getElementById('task-client').value || null,
            deal_id: document.getElementById('task-deal').value.trim() || null,
            deadline: document.getElementById('task-deadline').value || null,
            priority: document.getElementById('task-priority').value,
            assigned_to: document.getElementById('task-assigned').value.trim() || null
          }
        })
        closeModal()
        showToast('Task created')
        loadTasksTable()
      } catch (err) { showToast(err.message, 'error') }
    }

    // ─── Email Queue ───
    async function renderEmailQueue() {
      var el = document.getElementById('main-content')
      el.innerHTML = pageHeader('Email Queue', 'Outbound email delivery status') +
        '<div class="card" id="queue-settings"><div class="card-title">Queue Delay Settings</div>' + skeletonTable(2) + '</div>' +
        '<div class="card table-wrap" id="queue-table">' + skeletonTable(6) + '</div>'

      try {
        var settings = await api('/settings')
        var s = settings.data || settings.settings || {}
        document.getElementById('queue-settings').innerHTML =
          '<div class="card-title">Queue Delay Settings</div>' +
          '<div class="field-row"><div class="field"><label>Min Delay (minutes)</label><input type="number" id="eq-min" value="' + (s.email_queue_min_delay_minutes || s.min || 5) + '" min="1" /></div>' +
          '<div class="field"><label>Max Delay (minutes)</label><input type="number" id="eq-max" value="' + (s.email_queue_max_delay_minutes || s.max || 45) + '" min="1" /></div></div>' +
          '<button class="btn btn-accent btn-sm" style="margin-top:12px" onclick="saveQueueSettings()">Save Settings</button>'

        loadEmailQueueTable()
      } catch (err) { showToast(err.message, 'error') }
    }

    async function loadEmailQueueTable() {
      try {
        var res = await api('/email-queue?page=1')
        var rows = res.data?.items || res.emails || res.queue || []

        document.getElementById('queue-table').innerHTML = rows.length
          ? '<table class="data-table"><thead><tr><th>To</th><th>Type</th><th>Status</th><th>Scheduled At</th><th>Sent At</th><th>Subject</th><th></th></tr></thead><tbody>' +
            rows.map(function(r) {
              return '<tr class="no-click"><td>' + esc(r.client_name || r.to || '—') + '</td><td>' + esc(r.type || '—') +
                '</td><td>' + statusBadge(r.status) + '</td><td class="mono">' + fmtDateTime(r.scheduled_at) +
                '</td><td class="mono">' + fmtDateTime(r.sent_at) + '</td><td>' + esc(r.subject || '—') + '</td><td>' +
                (r.status === 'failed' ? '<button class="btn btn-sm btn-secondary" onclick="retryEmail(' + "'" + r.id + "'" + ')">Retry</button>' : '') +
                '</td></tr>'
            }).join('') + '</tbody></table>'
          : '<div class="empty-state">Queue is empty</div>'
      } catch (err) { showToast(err.message, 'error') }
    }

    window.saveQueueSettings = async function() {
      try {
        await api('/settings', {
          method: 'POST',
          body: {
            email_queue_min_delay_minutes: document.getElementById('eq-min').value,
            email_queue_max_delay_minutes: document.getElementById('eq-max').value
          }
        })
        showToast('Queue settings saved')
      } catch (err) { showToast(err.message, 'error') }
    }

    window.retryEmail = async function(id) {
      try {
        await api('/email-queue/' + id + '/retry', { method: 'PATCH' })
        showToast('Email re-queued')
        loadEmailQueueTable()
      } catch (err) { showToast(err.message, 'error') }
    }

    // ─── Utils ───
    function debounce(fn, ms) {
      var timer
      return function() {
        var args = arguments
        var ctx = this
        clearTimeout(timer)
        timer = setTimeout(function() { fn.apply(ctx, args) }, ms)
      }
    }

    window.openDealDrawer = openDealDrawer
    window.closeDrawer = closeDrawer
    window.closeModal = closeModal
  </script>
</body>
</html>`
}
