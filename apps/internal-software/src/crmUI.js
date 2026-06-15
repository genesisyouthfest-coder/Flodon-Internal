export function getCRMHTML(url) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flodon CRM</title>
  <style>
    :root {
      --bg-deep: #000000;
      --surface: rgba(255,255,255,0.04);
      --surface-hover: rgba(255,255,255,0.07);
      --surface-active: rgba(255,255,255,0.1);
      --border: rgba(255,255,255,0.06);
      --border-light: rgba(255,255,255,0.1);
      --accent: #2563eb;
      --accent-hover: #3b82f6;
      --accent-glow: rgba(37,99,235,0.2);
      --accent-dim: rgba(37,99,235,0.1);
      --text: #ffffff;
      --text-secondary: rgba(255,255,255,0.55);
      --text-muted: rgba(255,255,255,0.3);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-full: 9999px;
      --green: #22c55e;
      --red: #ef4444;
    }
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;background:var(--bg-deep);color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-size:15px;line-height:1.5}
    a{color:var(--accent);text-decoration:none}
    a:hover{text-decoration:underline}
    ::-webkit-scrollbar{width:3px;height:3px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:var(--border);border-radius:var(--radius-full)}
    ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.12)}

    .app{display:flex;min-height:100vh}
    .sidebar{width:200px;flex-shrink:0;display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:100;background:rgba(255,255,255,0.03);-webkit-backdrop-filter:blur(40px);backdrop-filter:blur(40px);border-right:1px solid var(--border)}
    .sidebar-brand{padding:24px 18px 16px}
    .sidebar-brand h1{font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#fff}
    .sidebar-brand span{font-size:9px;color:var(--text-muted);font-weight:500;letter-spacing:0.08em}
    .sidebar-nav{flex:1;padding:4px 8px 8px;overflow-y:auto}
    .sidebar-nav a{display:flex;align-items:center;gap:10px;padding:10px 12px;font-size:14px;font-weight:500;color:var(--text-secondary);text-decoration:none;border-radius:var(--radius-sm);transition:all 0.15s cubic-bezier(0.25,0.46,0.45,0.94);position:relative}
    .sidebar-nav a:hover{color:var(--text);background:var(--surface)}
    .sidebar-nav a.active{color:#fff;background:var(--accent-dim)}
    .sidebar-nav a .nav-icon{font-size:16px;width:20px;text-align:center;flex-shrink:0;opacity:0.7}
    .sidebar-nav a.active .nav-icon{opacity:1}
    .main{flex:1;margin-left:200px;padding:32px 36px 60px;min-height:100vh;animation:contentIn 0.5s cubic-bezier(0.22,1,0.36,1)}
    .page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;gap:12px}
    .page-header h2{font-size:28px;font-weight:700;letter-spacing:-0.03em;color:var(--text)}
    .card{background:var(--surface);border-radius:var(--radius-md);padding:20px;margin-bottom:12px;transition:all 0.25s cubic-bezier(0.25,0.46,0.45,0.94)}
    .card-title{font-size:12px;font-weight:600;margin-bottom:14px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.06em}
    .btn{padding:10px 24px;border:none;border-radius:var(--radius-full);font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;transition:all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);display:inline-flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap;position:relative}
    .btn:active{transform:scale(0.97)}
    .btn-primary{background:var(--accent);color:#fff}
    .btn-primary:hover{background:var(--accent-hover);box-shadow:0 4px 20px var(--accent-glow)}
    .btn-accent{background:var(--accent);color:#fff}
    .btn-accent:hover{background:var(--accent-hover);box-shadow:0 4px 20px var(--accent-glow)}
    .btn-secondary{background:var(--surface);color:var(--text-secondary)}
    .btn-secondary:hover{background:var(--surface-hover);color:var(--text)}
    .btn-sm{padding:6px 16px;font-size:12px}
    .btn-danger{background:rgba(239,68,68,0.08);color:#ef4444}
    .btn-danger:hover{background:rgba(239,68,68,0.15);box-shadow:0 4px 20px rgba(239,68,68,0.2)}
    .btn:disabled{opacity:0.3;cursor:not-allowed;transform:none}
    .badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:var(--radius-full);font-size:11px;font-weight:500;white-space:nowrap;transition:all 0.2s ease-out}
    .badge-accent{background:var(--accent-dim);color:var(--accent)}
    .badge-blue{background:rgba(59,130,246,0.08);color:#60a5fa}
    .badge-green{background:rgba(34,197,94,0.08);color:#22c55e}
    .badge-red{background:rgba(239,68,68,0.08);color:#ef4444}
    .badge-gray{background:var(--surface);color:var(--text-muted)}
    .badge-amber{background:rgba(245,158,11,0.08);color:#fbbf24}
    .field{margin-bottom:16px}
    .field:last-child{margin-bottom:0}
    .field label{display:block;font-size:12px;font-weight:500;color:var(--text-muted);margin-bottom:6px}
    .field input,.field select,.field textarea{width:100%;padding:12px 16px;background:var(--bg-deep);border:1px solid var(--border);color:var(--text);font-size:14px;font-family:inherit;outline:none;border-radius:var(--radius-sm);transition:all 0.2s ease-out}
    .field textarea{min-height:60px;resize:vertical}
    .field input:focus,.field select:focus,.field textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
    .field input::placeholder,.field textarea::placeholder{color:var(--text-muted)}
    .field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .filters{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center}
    .filters input,.filters select{padding:6px 14px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:11px;font-family:inherit;outline:none;border-radius:var(--radius-full);transition:all 0.2s ease-out}
    .filters input:focus,.filters select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
    .filters input{min-width:180px}
    .table-wrap{overflow-x:auto;border-radius:var(--radius-md);background:var(--surface);transition:all 0.3s ease-out}
    table.data-table{width:100%;min-width:700px;border-collapse:collapse;font-size:14px}
    table.data-table th{text-align:left;padding:12px 16px;font-size:11px;font-weight:600;color:var(--text-muted);letter-spacing:0.04em;border-bottom:1px solid var(--border)}
    table.data-table td{padding:14px 16px;color:var(--text-secondary);background:transparent;transition:background 0.15s ease-out}
    table.data-table tr{cursor:pointer}
    table.data-table tr:hover td{background:var(--surface-hover)}
    table.data-table tr:last-child td{border-bottom:none}
    .avatar{width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--accent);color:#fff;font-size:9px;font-weight:600;flex-shrink:0}
    .avatar-sm{width:20px;height:20px;font-size:8px}
    .avatar-row{display:flex;align-items:center;gap:8px}
    .drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;opacity:0;pointer-events:none;transition:opacity 0.4s ease-out}
    .drawer-overlay.open{opacity:1;pointer-events:auto}
    .drawer{position:fixed;top:0;right:-500px;width:500px;max-width:100vw;height:100vh;background:rgba(255,255,255,0.04);-webkit-backdrop-filter:blur(60px);backdrop-filter:blur(60px);border-left:1px solid var(--border);z-index:201;transition:right 0.5s cubic-bezier(0.22,1,0.36,1);display:flex;flex-direction:column;box-shadow:-10px 0 60px rgba(0,0,0,0.5)}
    .drawer.open{right:0}
    .drawer-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--border)}
    .drawer-header h3{font-size:17px;font-weight:600}
    .drawer-close{background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;padding:4px 8px;line-height:1;border-radius:var(--radius-sm);transition:all 0.15s ease-out}
    .drawer-close:hover{color:var(--text);background:var(--surface)}
    .drawer-body{flex:1;overflow-y:auto;padding:24px}
    .drawer-section{margin-bottom:24px}
    .drawer-section-title{font-size:9px;font-weight:600;color:var(--text-muted);letter-spacing:0.04em;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border)}
    .detail-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:14px;transition:background 0.15s ease-out}
    .detail-row:last-child{border-bottom:none}
    .detail-label{color:var(--text-muted);flex-shrink:0}
    .detail-value{color:var(--text-secondary);text-align:right;max-width:60%}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:none;align-items:center;justify-content:center;padding:20px}
    .modal-overlay.open{display:flex}
    .modal{background:rgba(255,255,255,0.05);-webkit-backdrop-filter:blur(60px);backdrop-filter:blur(60px);border-radius:var(--radius-lg);width:100%;max-width:500px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:modalIn 0.35s cubic-bezier(0.22,1,0.36,1);border:1px solid var(--border)}
    .modal-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--border)}
    .modal-header h3{font-size:17px;font-weight:600}
    .modal-body{padding:24px}
    .modal-footer{display:flex;gap:8px;justify-content:flex-end;padding:16px 24px;border-top:1px solid var(--border)}
    .toast{position:fixed;bottom:24px;right:24px;padding:12px 20px;font-size:12px;font-weight:500;display:none;z-index:1000;animation:toastIn 0.4s cubic-bezier(0.22,1,0.36,1);max-width:360px;border-radius:var(--radius-md);box-shadow:0 8px 32px rgba(0,0,0,0.4);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}
    .toast.success{background:rgba(37,99,235,0.15);color:var(--accent)}
    .toast.error{background:rgba(239,68,68,0.15);color:#ef4444}
    .toast.show{display:block}
    @keyframes contentIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes modalIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
    @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    .skeleton{background:var(--surface);border-radius:var(--radius-sm);background:linear-gradient(90deg,var(--surface) 25%,var(--surface-hover) 50%,var(--surface) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
    .skeleton-stat{height:72px}
    .skeleton-row{height:36px}
    .skeleton-card{height:60px}
    .mini-bars{display:grid;gap:6px}
    .mini-bar-row{display:grid;grid-template-columns:80px minmax(80px,1fr) 50px;gap:10px;align-items:center;font-size:11px;color:var(--text-secondary)}
    .mini-bar-track{height:3px;background:var(--surface);border-radius:var(--radius-full);overflow:hidden}
    .mini-bar-fill{height:100%;border-radius:var(--radius-full);background:var(--accent);transition:width 0.6s cubic-bezier(0.22,1,0.36,1)}
    .kanban{display:flex;gap:10px;overflow-x:auto;padding:4px 0 12px;min-height:calc(100vh - 180px)}
    .kanban-col{min-width:230px;max-width:230px;flex-shrink:0;background:var(--surface);border-radius:var(--radius-md);display:flex;flex-direction:column;max-height:calc(100vh - 150px);overflow:hidden;transition:all 0.25s cubic-bezier(0.25,0.46,0.45,0.94)}
    .kanban-col:hover{background:rgba(255,255,255,0.05)}
    .kanban-col.stage-prospect,.kanban-col.stage-contacted,.kanban-col.stage-replied,.kanban-col.stage-discovery_booked,.kanban-col.stage-discovery_completed,.kanban-col.stage-audit_proposed,.kanban-col.stage-audit_purchased,.kanban-col.stage-audit_delivered,.kanban-col.stage-implementation_proposed,.kanban-col.stage-client,.kanban-col.stage-followup,.kanban-col.stage-lost{border-top:none}
    .kanban-col-header{padding:14px 16px 10px;flex-shrink:0}
    .kanban-col-title{font-size:13px;font-weight:600;margin-bottom:2px;color:var(--text)}
    .kanban-col-meta{font-size:11px;color:var(--text-muted)}
    .kanban-cards{flex:1;overflow-y:auto;padding:4px 8px 8px;display:flex;flex-direction:column;gap:4px}
    .kanban-cards::-webkit-scrollbar{width:2px}
    .kanban-cards::-webkit-scrollbar-thumb{background:var(--border);border-radius:var(--radius-full)}
    .client-card{background:var(--bg-deep);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;cursor:pointer;transition:all 0.2s cubic-bezier(0.25,0.46,0.45,0.94);position:relative}
    .client-card:hover{border-color:var(--accent);background:rgba(37,99,235,0.04)}
    .client-card-title{font-size:14px;font-weight:500;color:var(--text)}
    .client-card-company{font-size:12px;color:var(--text-secondary);margin-top:2px}
    .client-card-actions{position:absolute;top:6px;right:6px;opacity:0;transition:opacity 0.2s ease-out}
    .client-card:hover .client-card-actions{opacity:1}
    .empty-state{text-align:center;padding:40px 20px;color:var(--text-muted);font-size:13px}
    .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
    .text-accent{color:var(--accent)}
    .text-muted{color:var(--text-muted)}
    .text-sm{font-size:12px}
    .text-xs{font-size:10px}
    .mb-8{margin-bottom:8px}
    .mb-16{margin-bottom:16px}
    .mt-8{margin-top:8px}
    .mt-16{margin-top:16px}
    .flex{display:flex}
    .flex-center{display:flex;align-items:center}
    .flex-between{display:flex;justify-content:space-between;align-items:center}
    .gap-4{gap:4px}
    .gap-8{gap:8px}
    .gap-12{gap:12px}
    .w-full{width:100%}
    .truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;font-size:11px;color:var(--text-muted);background:var(--surface);border-radius:var(--radius-md)}
    .pipeline-timeline{position:relative;padding-left:28px}
    .pipeline-timeline::before{content:'';position:absolute;left:9px;top:8px;bottom:8px;width:1px;background:var(--border)}
    .tl-stage{position:relative;padding:0 0 20px}
    .tl-stage:last-child{padding-bottom:0}
    .tl-stage.has-data{padding-bottom:24px}
    .tl-dot{position:absolute;left:-21px;top:4px;width:10px;height:10px;border-radius:50%;background:var(--surface);border:2px solid var(--border);z-index:1;transition:all 0.3s ease-out}
    .tl-dot.past{background:var(--accent);border-color:var(--accent)}
    .tl-dot.current{background:var(--accent);border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-glow);animation:pulse-dot 2s infinite}
    .tl-dot.future{background:var(--surface);border-color:var(--border)}
    @keyframes pulse-dot{0%,100%{box-shadow:0 0 0 4px var(--accent-glow)}50%{box-shadow:0 0 0 8px var(--accent-glow)}}
    .tl-stage-header{display:flex;align-items:center;gap:8px;margin-bottom:4px}
    .tl-stage-name{font-size:12px;font-weight:500;text-transform:capitalize;transition:color 0.3s ease-out}
    .tl-stage-name.past{color:var(--text)}
    .tl-stage-name.current{color:var(--accent)}
    .tl-stage-name.future{color:var(--text-muted)}
    .tl-stage-data{padding:6px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:4px 16px}
    .tl-field{font-size:11px;display:flex;gap:4px}
    .client-profile-header{display:flex;align-items:center;gap:16px;padding:24px 0 20px;border-bottom:1px solid var(--border);margin-bottom:24px;flex-wrap:wrap}
    .client-profile-avatar{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--accent);color:#fff;font-size:16px;font-weight:600;flex-shrink:0}
    .client-profile-info{flex:1;min-width:200px}
    .client-profile-name{font-size:26px;font-weight:700;margin-bottom:4px;letter-spacing:-0.02em}
    .client-profile-company{font-size:14px;color:var(--text-secondary);margin-bottom:6px}
    .client-profile-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .profile-grid .card{margin-bottom:0;padding:16px}
    .profile-grid .detail-row{padding:6px 0}
    .metric-strip{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:28px}.metric-strip .metric-card{padding:14px}
    .metric-card{background:var(--surface);border-radius:var(--radius-md);padding:16px;min-width:0;transition:all 0.25s cubic-bezier(0.25,0.46,0.45,0.94)}
    .metric-card:hover{background:rgba(37,99,235,0.06)}
    .metric-card .metric-label{font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:500}
    .metric-card .metric-value{font-size:28px;font-weight:700;letter-spacing:-0.03em;line-height:1.1}
    .metric-card .metric-sub{font-size:9px;color:var(--text-muted);margin-top:4px}.dash-section-title{font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.04em}
    .arr-visual{min-height:160px;border-radius:var(--radius-md);background:radial-gradient(circle at 50% 30%,rgba(37,99,235,0.06),transparent 50%),var(--surface);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:28px;transition:all 0.25s cubic-bezier(0.25,0.46,0.45,0.94)}
    .arr-visual:hover{background:radial-gradient(circle at 50% 30%,rgba(37,99,235,0.1),transparent 50%),var(--surface)}
    .arr-value{font-size:38px;font-weight:700;letter-spacing:-0.03em;margin-bottom:4px}
    .arr-sub{font-size:11px;color:var(--text-muted);max-width:280px;line-height:1.5}
    .stage-pills{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;overflow-x:auto;padding-bottom:4px}
    .stage-pill{padding:5px 14px;font-size:10px;font-weight:500;border:none;background:var(--surface);color:var(--text-secondary);cursor:pointer;font-family:inherit;border-radius:var(--radius-full);transition:all 0.15s ease-out;white-space:nowrap}
    .stage-pill:hover{background:var(--surface-hover);color:var(--text)}
    .stage-pill.active{background:var(--accent);color:#fff}
    .stage-pill .pill-count{display:inline-block;margin-left:4px;padding:0 5px;font-size:8px;color:var(--text-muted);background:rgba(0,0,0,0.2);border-radius:var(--radius-full)}
    .form-select{padding:6px 14px;background:#1a1a1a;border:1px solid var(--border-light);color:#fff;font-size:12px;font-family:inherit;outline:none;border-radius:var(--radius-full);cursor:pointer;transition:all 0.2s ease-out}
    .form-select option{background:#1a1a1a;color:#fff;padding:4px 8px}
    .form-select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-glow)}
    .table{width:100%;border-collapse:collapse;font-size:14px}
    .table th{text-align:left;padding:10px 12px;font-size:11px;font-weight:600;color:var(--text-muted);letter-spacing:0.04em;border-bottom:1px solid var(--border)}
    .table td{padding:10px 12px;color:var(--text-secondary);border-bottom:1px solid var(--border);background:transparent;transition:background 0.15s ease-out}
    .table tr:hover td{background:var(--surface-hover)}
    .table tr:last-child td{border-bottom:none}
    .stage-pill.active .pill-count{background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.6)}
    @media(max-width:1400px){.metric-strip{grid-template-columns:repeat(4,1fr)}}@media(max-width:1100px){.metric-strip{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:1100px){.grid-2,.grid-3{grid-template-columns:1fr}.profile-grid{grid-template-columns:1fr}}
    @media(max-width:768px){.app{display:block}.sidebar{width:100%;position:sticky;top:0;bottom:auto;border-right:none;border-bottom:1px solid var(--border);-webkit-backdrop-filter:blur(40px);backdrop-filter:blur(40px)}.sidebar-brand{padding:14px 16px 10px}.sidebar-brand h1{font-size:18px}.sidebar-nav{display:flex;flex-wrap:nowrap;overflow-x:auto;padding:0 4px 10px}.sidebar-nav a{flex:0 0 auto;padding:8px 14px;font-size:13px;border-radius:var(--radius-full);white-space:nowrap}.sidebar-nav a.active{background:var(--accent-dim)}.main{margin-left:0;padding:20px}.page-header{margin-bottom:20px}.page-header h2{font-size:22px}.metric-strip{grid-template-columns:1fr 1fr}.field-row{grid-template-columns:1fr}.modal-overlay{align-items:flex-end;padding:10px}.modal{max-height:92vh;border-radius:var(--radius-md) var(--radius-md) 0 0}.modal-footer{justify-content:stretch;flex-wrap:wrap}.modal-footer .btn{flex:1}.drawer{width:100vw;right:-100vw}.detail-row{display:block}.detail-value{display:block;max-width:none;text-align:left;margin-top:2px}.tl-stage-data{grid-template-columns:1fr}.kanban{min-height:calc(100vh - 200px)}}
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <h1>FLODON</h1>
        <p>CRM</p>
      </div>
      <nav class="sidebar-nav" id="sidebar-nav">
        <div class="nav-group">
          <a href="#dashboard" data-route="dashboard"><span class="nav-icon">📊</span>Dashboard</a>
          <a href="#pipeline" data-route="pipeline"><span class="nav-icon">📋</span>Pipeline</a>
          <a href="#clients" data-route="clients"><span class="nav-icon">👥</span>Clients</a>
          <a href="#deals" data-route="deals"><span class="nav-icon">💰</span>Deals</a>
          <a href="#expenses" data-route="expenses"><span class="nav-icon">💸</span>Expenses</a>
        </div>
        <div style="margin-top:auto;padding:8px">
          <a href="#settings" data-route="settings" style="font-size:11px;opacity:0.5"><span class="nav-icon">⚙️</span>Settings</a>
        </div>
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

  <script src="/crm/client.js"></script>
</body>
</html>`
}
