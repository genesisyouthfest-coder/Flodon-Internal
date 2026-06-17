window.addEventListener('error', function (e) {
  var el = document.getElementById('main-content')
  if (el && !el.innerHTML.trim()) {
    el.innerHTML = '<div style="padding:24px;color:#ff4444"><h2>CRM failed to load</h2><pre style="white-space:pre-wrap;font-size:13px">' + escBoot(e.message) + '</pre></div>'
  }
})
function escBoot(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;') }

var API = window.location.origin + '/crm/api'
    var OS_API = window.location.origin + '/api'
    var PIPELINE_STAGES = ['prospect', 'contacted', 'replied', 'discovery_booked', 'discovery_completed', 'audit_proposed', 'audit_purchased', 'audit_delivered', 'implementation_proposed', 'awaiting_confirmation', 'confirmed', 'client', 'followup', 'lost']
    var CLIENT_STAGES = PIPELINE_STAGES
    var DEAL_STAGES = ['lead', 'contacted', 'demo', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
    

    var routes = {
      dashboard: renderDashboard,
      pipeline: renderPipeline,
      clients: renderClients,
      deals: renderDeals,
      expenses: renderExpenses,
      settings: renderSettings,
    }

    function route(){
      var hash = window.location.hash.slice(1) || 'dashboard'
      var match = hash.match(/^clients\/view\/(.+)$/)
      if(match){
        document.querySelectorAll('.sidebar-nav a').forEach(function(a){a.classList.remove('active')})
        var nav = document.querySelector('.sidebar-nav a[data-route="clients"]')
        if(nav) nav.classList.add('active')
        renderClientProfile(match[1])
        return
      }
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
      var colors={prospect:'badge-gray',contacted:'badge-blue',replied:'badge-neon',discovery_booked:'badge-blue',discovery_completed:'badge-amber',audit_proposed:'badge-amber',audit_purchased:'badge-green',audit_delivered:'badge-green',implementation_proposed:'badge-amber',awaiting_confirmation:'badge-amber',confirmed:'badge-green',client:'badge-green',nurture:'badge-neon',lost:'badge-red',lead:'badge-gray',contacted:'badge-blue',demo:'badge-neon',proposal:'badge-amber',negotiation:'badge-amber',closed_won:'badge-green',closed_lost:'badge-red',won:'badge-green',lost:'badge-red',call_booked:'badge-blue',booked:'badge-blue',completed:'badge-green',cancelled:'badge-red',noshowed:'badge-red',interested:'badge-green',not_interested:'badge-red',follow_up_needed:'badge-amber',pending:'badge-gray',done:'badge-green',queued:'badge-gray',sending:'badge-blue',sent:'badge-green',failed:'badge-red'}
      return '<span class="badge '+(colors[stage]||'badge-gray')+'">'+esc(stage).replace(/_/g,' ')+'</span>'
    }

    function fmtDate(d){if(!d)return'—';try{return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}catch(e){return d}}
    function fmtINR(n){return'$'+Number(n||0).toLocaleString('en-US')}
    function stageLabel(s){return esc(s||'unknown').replace(/_/g,' ')}
    function stageClass(s){return 'stage-'+String(s||'unknown').replace(/[^a-z0-9_-]/gi,'_')}
    function fmtPct(n){n=Number(n||0);return Math.round(n)+'%'}
    function sum(arr,fn){return (arr||[]).reduce(function(total,item){return total+(Number(fn(item))||0)},0)}
    function initials(name){
      var parts=String(name||'NA').trim().split(/\s+/).filter(Boolean)
      return esc(((parts[0]||'N')[0]||'N')+((parts[1]||'')[0]||'')).toUpperCase()
    }
    function settledValue(result,fallback){return result&&result.status==='fulfilled'?result.value:fallback}
    function flattenPipeline(pipeline){
      var rows=[]
      DEAL_STAGES.forEach(function(stage){
        ;(pipeline&&pipeline[stage]||[]).forEach(function(deal){rows.push(Object.assign({stage:stage},deal))})
      })
      return rows
    }
    function compactMoney(n){
      n=Number(n||0)
      if(n>=1000000)return '$'+(n/1000000).toFixed(1)+'M'
      if(n>=1000)return '$'+(n/1000).toFixed(1)+'K'
      return fmtINR(n)
    }
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

    // ─── Month picker state ───
    var selectedMonth = (function(){
      var d=new Date()
      return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')
    })()
    function renderMonthSelector(){
      var now=new Date()
      var options=''
      for(var i=5;i>=-1;i--){
        var d=new Date(now.getFullYear(),now.getMonth()-i,1)
        var y=d.getFullYear()
        var m=String(d.getMonth()+1).padStart(2,'0')
        var val=y+'-'+m
        var label=d.toLocaleDateString('en-US',{month:'long',year:'numeric'})
        options+='<option value="'+val+'"'+(val===selectedMonth?' selected':'')+'>'+label+'</option>'
      }
      return '<select id="month-picker" class="form-select" style="width:auto;display:inline-block" onchange="selectedMonth=this.value;renderDashboard()">'+options+'</select>'
    }
    function formatMonth(m){
      if(!m)return''
      var parts=m.split('-')
      var d=new Date(parseInt(parts[0]),parseInt(parts[1])-1,1)
      return d.toLocaleDateString('en-US',{month:'short',year:'numeric'})
    }

    // ─── DASHBOARD ───
    function renderDashboard(){
      var el=document.getElementById('main-content')
      el.innerHTML=
        '<div class="page-header"><h2>Dashboard</h2><div style="display:flex;align-items:center;gap:8px">'+
          '<label style="font-size:12px;color:var(--text-muted)">Month:</label>'+renderMonthSelector()+
        '</div></div>'+
        '<div class="metric-strip" id="dash-stats"></div>'+
        '<div class="grid-2"><div class="card"><div class="card-title">Revenue Overview</div><div id="dash-revenue"></div></div><div class="card"><div class="card-title">Cost Analysis</div><div id="dash-costs"></div></div></div>'+
        '<div class="grid-2"><div class="card" style="padding:0"><div class="arr-visual" id="dash-arr"><div class="empty-state">Loading...</div></div></div><div class="card"><div class="card-title">Pipeline Distribution</div><div id="dash-status-bars"></div></div></div>'+
        '<div class="grid-3"><div class="card"><div class="card-title">Sales Analytics</div><div id="dash-sales"></div></div><div class="card"><div class="card-title">Client Pipeline</div><div id="dash-client-chart"></div></div><div class="card"><div class="card-title">Client Breakdown</div><div id="dash-breakdown"></div></div></div>'+
        '<div class="card"><div class="card-title">Deal Pipeline</div><div id="dash-deal-chart"><div class="empty-state">Loading...</div></div></div>'+
        '<div class="card" style="margin-top:16px"><div class="card-title">Monthly Trend (12 months)</div><div id="dash-monthly-trend"></div></div>'
      showLoader(document.getElementById('dash-stats'),12,'stat')
      showLoader(document.getElementById('dash-revenue'),4,'row')
      showLoader(document.getElementById('dash-costs'),4,'row')
      showLoader(document.getElementById('dash-deal-chart'),4,'row')
      showLoader(document.getElementById('dash-sales'),4,'row')
      showLoader(document.getElementById('dash-client-chart'),4,'row')
      showLoader(document.getElementById('dash-breakdown'),4,'row')

      Promise.allSettled([
        api('GET','/dashboard-stats?month='+selectedMonth),
        api('GET','/pipeline'),
        api('GET','/monthly-trend'),
      ]).then(function(results){
        var data=settledValue(results[0],{})||{}
        var pipeline=settledValue(results[1],{})||{}
        var monthlyTrend=settledValue(results[2],[])||[]
        var deals=flattenPipeline(pipeline)
        var pipelineValue=data.pipeline_value?data.pipeline_value:sum(deals,function(d){return d.amount_monthly})
        var weighted=sum(deals,function(d){return (d.amount_monthly||0)*((d.probability||0)/100)})
        var avgDeal=data.avg_deal_size!=null?data.avg_deal_size:(deals.length?pipelineValue/deals.length:0)
        var wonCount=data.closed_won_count || 0

        var newWeek=data.new_clients_week||0
        var newMonth=data.new_clients_month||0
        var followup=data.followup_count||0
        var nurture=data.nurture_count||0
        var openDeals=data.open_deals_count||0
        var totalDeals=data.total_deals_count||0
        var closedLost=data.closed_lost_count||0

        // New KPIs
        var mrr=data.total_mrr||0
        var cogs=data.total_cogs||0
        var gp=data.gross_profit||0
        var gm=data.gross_margin||0
        var exp=data.total_expenses||0
        var np=data.net_profit||0
        var nm=data.net_margin||0
        var arr=data.arr||0
        var avgCogs=data.avg_cogs||0
        var churn=data.churn_rate||0

        // ── Top KPI Strip ──
        var monthLabel=formatMonth(selectedMonth)
        document.getElementById('dash-stats').innerHTML=
          '<div class="metric-card"><div class="metric-label">MRR</div><div class="metric-value">'+fmtINR(mrr)+'</div><div class="metric-sub">'+monthLabel+'</div></div>'+
          '<div class="metric-card"><div class="metric-label">ARR</div><div class="metric-value">'+fmtINR(arr)+'</div><div class="metric-sub">Annual run rate</div></div>'+
          '<div class="metric-card"><div class="metric-label">Gross Profit</div><div class="metric-value">'+fmtINR(gp)+'</div><div class="metric-sub" style="color:'+(gm>=40?'var(--green)':'var(--red)')+'">'+gm+'% margin</div></div>'+
          '<div class="metric-card"><div class="metric-label">Net Profit</div><div class="metric-value">'+fmtINR(np)+'</div><div class="metric-sub" style="color:'+(nm>=20?'var(--green)':'var(--red)')+'">'+nm+'% margin</div></div>'+
          '<div class="metric-card"><div class="metric-label">Total Clients</div><div class="metric-value">'+(data.total_clients||0)+'</div><div class="metric-sub">'+newMonth+' new in '+monthLabel+'</div></div>'+
          '<div class="metric-card"><div class="metric-label">Win Rate</div><div class="metric-value">'+(data.conversion_rate||0)+'%</div><div class="metric-sub">'+wonCount+' won</div></div>'+
          '<div class="metric-card"><div class="metric-label">Avg Deal</div><div class="metric-value">'+fmtINR(avgDeal)+'</div><div class="metric-sub">Per closed deal</div></div>'+
          '<div class="metric-card"><div class="metric-label">Churn Rate</div><div class="metric-value" style="color:'+(churn>5?'var(--red)':'var(--green)')+'">'+churn+'%</div><div class="metric-sub">'+openDeals+' active</div></div>'+
          '<div class="metric-card"><div class="metric-label">Closed Won</div><div class="metric-value">'+fmtINR(data.closed_won_value||0)+'</div><div class="metric-sub">'+wonCount+' deals</div></div>'+
          '<div class="metric-card"><div class="metric-label">Total Deals</div><div class="metric-value">'+totalDeals+'</div><div class="metric-sub">'+closedLost+' lost</div></div>'+
          '<div class="metric-card"><div class="metric-label">New Clients</div><div class="metric-value">'+newMonth+'</div><div class="metric-sub">'+monthLabel+'</div></div>'+
          '<div class="metric-card"><div class="metric-label">Follow-up</div><div class="metric-value">'+followup+'</div><div class="metric-sub">'+nurture+' nurturing</div></div>'

        // ── Revenue Overview ──
        document.getElementById('dash-revenue').innerHTML=
          '<div class="detail-row"><span class="detail-label">Monthly Recurring Revenue</span><span class="detail-value" style="font-weight:600">'+fmtINR(mrr)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Annual Run Rate (ARR)</span><span class="detail-value" style="font-weight:600">'+fmtINR(arr)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Gross Profit</span><span class="detail-value" style="color:var(--green)">'+fmtINR(gp)+' <span class="text-muted">('+gm+'%)</span></span></div>'+
          '<div class="detail-row"><span class="detail-label">Net Profit</span><span class="detail-value" style="color:var(--green)">'+fmtINR(np)+' <span class="text-muted">('+nm+'%)</span></span></div>'+
          '<div class="detail-row"><span class="detail-label">Gross Margin</span><span class="detail-value">'+gm+'%</span></div>'+
          '<div class="detail-row"><span class="detail-label">Net Margin</span><span class="detail-value">'+nm+'%</span></div>'+
          '<div class="detail-row"><span class="detail-label">Win Rate</span><span class="detail-value">'+(data.conversion_rate||0)+'%</span></div>'+
          '<div class="detail-row"><span class="detail-label">Conversion</span><span class="detail-value">'+(data.conversion_rate||0)+'%</span></div>'

        // ── Cost Analysis ──
        document.getElementById('dash-costs').innerHTML=
          '<div class="detail-row"><span class="detail-label">Cost of Goods Sold (COGS)</span><span class="detail-value" style="color:var(--red)">'+fmtINR(cogs)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Avg COGS per Deal</span><span class="detail-value">'+fmtINR(avgCogs)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Operating Expenses</span><span class="detail-value" style="color:var(--red)">'+fmtINR(exp)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Total Costs</span><span class="detail-value" style="color:var(--red)">'+fmtINR(cogs+exp)+'</span></div>'+
          '<div class="detail-row" style="border-top:1px solid var(--border);padding-top:8px;margin-top:8px"><span class="detail-label">Profitability</span><span class="detail-value" style="color:'+(np>0?'var(--green)':'var(--red)')+';font-weight:600">'+fmtINR(np)+' <span class="text-muted">('+nm+'%)</span></span></div>'+
          '<div class="detail-row"><span class="detail-label">Churn Rate</span><span class="detail-value" style="color:'+(churn>5?'var(--red)':'var(--green)')+'">'+churn+'%</span></div>'

        // ── ARV Visual ──
        document.getElementById('dash-arr').innerHTML=
          '<div class="arr-value">'+fmtINR(mrr)+'</div>'+
          '<div class="arr-sub">ARR '+fmtINR(arr)+' &middot; '+totalDeals+' deals &middot; Avg '+fmtINR(avgDeal)+'</div>'+
          '<div class="mini-bars" style="width:100%;margin-top:16px">'+DEAL_STAGES.map(function(stage){
            var stageDeals=pipeline[stage]||[]
            var amount=sum(stageDeals,function(d){return d.amount_monthly})
            var pct=mrr?Math.max(4,Math.round(amount/mrr*100)):0
            var isRecurring=stageDeals.every(function(d){return d.is_recurring})
          return '<div class="mini-bar-row"><span>'+stageLabel(stage)+'</span><div class="mini-bar-track"><div class="mini-bar-fill" style="width:'+pct+'%"></div></div><strong>'+compactMoney(amount)+'</strong>'+(isRecurring?'<span class="text-muted text-xs" style="margin-left:2px">/mo</span>':'')+'</div>'
          }).join('')+'</div>'

        // ── Pipeline Distribution ──
        var clientDist = data.pipeline_distribution || {}
        var maxClientCount=Math.max(1,...PIPELINE_STAGES.map(function(s){return clientDist[s]||0}))
        document.getElementById('dash-status-bars').innerHTML='<div class="mini-bars">'+PIPELINE_STAGES.map(function(stage){
          var count=clientDist[stage]||0
          return '<div class="mini-bar-row"><span>'+stageLabel(stage)+'</span><div class="mini-bar-track"><div class="mini-bar-fill" style="width:'+Math.max(3,Math.round(count/maxClientCount*100))+'%"></div></div><strong>'+count+'</strong></div>'
        }).join('')+'</div>'

        // ── Sales Analytics ──
        document.getElementById('dash-sales').innerHTML=
          '<div class="detail-row"><span class="detail-label">Win Rate</span><span class="detail-value" style="color:var(--accent);font-weight:600">'+(data.conversion_rate||0)+'%</span></div>'+
          '<div class="detail-row"><span class="detail-label">Avg Deal Size</span><span class="detail-value">'+fmtINR(avgDeal)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Avg COGS</span><span class="detail-value">'+fmtINR(avgCogs)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Gross Margin</span><span class="detail-value" style="color:var(--green)">'+gm+'%</span></div>'+
          '<div class="detail-row"><span class="detail-label">Closed Won</span><span class="detail-value" style="color:var(--green)">'+fmtINR(data.closed_won_value||0)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Closed Lost</span><span class="detail-value" style="color:var(--red)">'+closedLost+' deals</span></div>'+
          '<div class="detail-row"><span class="detail-label">Follow-up Needed</span><span class="detail-value">'+followup+' clients</span></div>'+
          '<div class="detail-row"><span class="detail-label">Churn Rate</span><span class="detail-value" style="color:'+(churn>5?'var(--red)':'var(--green)')+'">'+churn+'%</span></div>'

        // ── Client Pipeline ──
        document.getElementById('dash-client-chart').innerHTML='<div class="mini-bars">'+PIPELINE_STAGES.map(function(stage){
          var count=clientDist[stage]||0
          return '<div class="mini-bar-row" style="grid-template-columns:110px minmax(60px,1fr) 30px">'+
            '<span>'+stageLabel(stage)+'</span>'+
            '<div class="mini-bar-track"><div class="mini-bar-fill" style="width:'+Math.max(3,Math.round(count/maxClientCount*100))+'%"></div></div>'+
            '<strong>'+count+'</strong></div>'
        }).join('')+'</div>'+
        '<div style="margin-top:12px"><button class="btn btn-sm btn-secondary w-full" onclick="renderClients()">View All Clients</button></div>'

        // ── Client Breakdown (by Source / Industry / Service) ──
        var bySource=data.clients_by_source||{}
        var byIndustry=data.clients_by_industry||{}
        var byService=data.clients_by_service||{}
        var sourceKeys=Object.keys(bySource).sort(function(a,b){return bySource[b]-bySource[a]})
        var industryKeys=Object.keys(byIndustry).sort(function(a,b){return byIndustry[b]-byIndustry[a]})
        var serviceKeys=Object.keys(byService).sort(function(a,b){return byService[b]-byService[a]})
        document.getElementById('dash-breakdown').innerHTML=
          '<div style="margin-bottom:12px"><div class="detail-label" style="margin-bottom:4px">By Source</div>'+
          sourceKeys.map(function(k){return '<div class="detail-row" style="font-size:11px"><span class="detail-label">'+esc(k)+'</span><span class="detail-value">'+bySource[k]+'</span></div>'}).join('')+'</div>'+
          '<div style="margin-bottom:12px;border-top:1px solid var(--border);padding-top:8px"><div class="detail-label" style="margin-bottom:4px">By Industry</div>'+
          industryKeys.slice(0,5).map(function(k){return '<div class="detail-row" style="font-size:11px"><span class="detail-label">'+esc(k)+'</span><span class="detail-value">'+byIndustry[k]+'</span></div>'}).join('')+'</div>'+
          (serviceKeys.length>1?'<div style="border-top:1px solid var(--border);padding-top:8px"><div class="detail-label" style="margin-bottom:4px">By Service</div>'+
          serviceKeys.map(function(k){return '<div class="detail-row" style="font-size:11px"><span class="detail-label">'+esc(k)+'</span><span class="detail-value">'+byService[k]+'</span></div>'}).join('')+'</div>':'')

        // ── Deal Pipeline ──
        var activeStages=DEAL_STAGES.filter(function(s){return s!=='closed_won'&&s!=='closed_lost'})
        document.getElementById('dash-deal-chart').innerHTML='<div class="mini-bars">'+activeStages.map(function(stage){
          var stageDeals=pipeline[stage]||[]
          var amount=sum(stageDeals,function(d){return d.amount_monthly})
          var count=stageDeals.length
          var pct=mrr?Math.max(3,Math.round(amount/mrr*100)):0
          return '<div class="mini-bar-row" style="grid-template-columns:90px minmax(60px,1fr) 60px 40px">'+
            '<span>'+stageLabel(stage)+'</span>'+
            '<div class="mini-bar-track"><div class="mini-bar-fill" style="width:'+pct+'%"></div></div>'+
            '<strong>'+compactMoney(amount)+'</strong>'+
            '<span class="text-muted text-xs">'+count+'</span></div>'
        }).join('')+'</div>'+
        '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">'+
          '<button class="btn btn-sm btn-accent" onclick="renderDeals()">View All Deals</button>'+
          '<button class="btn btn-sm btn-secondary" onclick="openDealForm()">New Deal</button>'+
        '</div>'

        // ── Monthly Trend Chart ──
        if(monthlyTrend&&monthlyTrend.length){
          var maxMrr=Math.max(1,...monthlyTrend.map(function(t){return t.mrr}))
          var maxClients=Math.max(1,...monthlyTrend.map(function(t){return t.new_clients}))
          document.getElementById('dash-monthly-trend').innerHTML=
            '<div style="overflow-x:auto">'+
            '<table class="table" style="width:100%;font-size:12px"><thead><tr>'+
              '<th>Month</th>'+
              '<th style="text-align:right">MRR</th>'+
              '<th style="text-align:right">New Clients</th>'+
              '<th style="text-align:right">Expenses</th>'+
              '<th style="width:40%">MRR Trend</th>'+
            '</tr></thead><tbody>'+
            monthlyTrend.map(function(t){
              var barPct=Math.max(2,Math.round(t.mrr/maxMrr*100))
              var clientBar=Math.max(2,Math.round(t.new_clients/maxClients*100))
              return '<tr>'+
                '<td style="white-space:nowrap">'+formatMonth(t.month)+'</td>'+
                '<td style="text-align:right;font-weight:600">'+fmtINR(t.mrr)+'</td>'+
                '<td style="text-align:right">'+t.new_clients+' <span style="display:inline-block;width:40px;height:8px;background:var(--border);border-radius:4px;vertical-align:middle;margin-left:4px"><span style="display:block;height:100%;width:'+clientBar+'%;background:var(--accent);border-radius:4px"></span></span></td>'+
                '<td style="text-align:right">'+fmtINR(t.expenses)+'</td>'+
                '<td><div style="height:16px;background:var(--border);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+barPct+'%;background:var(--green);border-radius:4px;transition:width 0.3s"></div></div></td>'+
              '</tr>'
            }).join('')+
            '</tbody></table></div>'+
            '<div style="margin-top:8px;font-size:11px;color:var(--text-muted)">Data as of '+new Date().toLocaleString()+'</div>'
        }else{
          document.getElementById('dash-monthly-trend').innerHTML='<div class="empty-state">No trend data available</div>'
        }
      }).catch(function(e){el.innerHTML='<div class="empty-state">Failed to load dashboard: '+e.message+'</div>'})
    }

    // ─── PIPELINE (Client Kanban) ───
    function renderPipeline(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><h2>Pipeline</h2><button class="btn btn-secondary btn-sm" onclick="renderDashboard()">Dashboard</button></div>'+
        '<div class="kanban" id="kanban">'+PIPELINE_STAGES.map(function(s){return '<div class="kanban-col '+stageClass(s)+'"><div class="kanban-col-header"><div class="kanban-col-title">'+stageLabel(s)+'</div><div class="kanban-col-meta"><span id="k-count-'+s+'">0 clients</span></div></div><div class="kanban-cards" id="k-cards-'+s+'"><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div></div></div>'}).join('')+'</div>'
      api('GET','/clients?nurture=&limit=100').then(function(d){
        d=d||{clients:[]}
        var grouped={}
        PIPELINE_STAGES.forEach(function(s){grouped[s]=[]})
        ;(d.clients||[]).forEach(function(c){
          var stage=c.pipeline_stage||'prospect'
          if(grouped[stage])grouped[stage].push(c)
        })
        PIPELINE_STAGES.forEach(function(s){
          var clients=grouped[s]||[]
          document.getElementById('k-count-'+s).textContent=clients.length+' client'+(clients.length===1?'':'s')
          document.getElementById('k-cards-'+s).innerHTML=clients.map(function(c){
            return '<div class="client-card" onclick="window.location.hash=\'#clients/view/'+c.id+'\'">'+
              '<div class="client-card-title">'+esc(c.name||'Unnamed')+'</div>'+
              (c.company_name?'<div class="client-card-company">'+esc(c.company_name)+'</div>':'')+
              '<div class="client-card-actions"><button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();openMoveStage(\''+c.id+'\',\''+s+'\')">Move &rarr;</button></div>'+
            '</div>'
          }).join('')||'<div class="empty-state">No clients</div>'
        })
      }).catch(function(e){toast(e.message,'error')})
    }

    function openMoveStage(id,current){
      openModal('Move Stage',
        '<div class="field"><label>New Stage</label><select id="ms-stage">'+PIPELINE_STAGES.map(function(s){return '<option value="'+s+'"'+(s===current?' selected':'')+'>'+stageLabel(s)+'</option>'}).join('')+'</select></div>'+
        '<div class="field"><label>Notes (optional)</label><textarea id="ms-notes" placeholder="Why is this moving?"></textarea></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveClientStage(\''+id+'\')">Move</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function openDealDetail(id){
      api('GET','/deals?stage=all').then(function(deals){
        var d=Array.isArray(deals)?deals.find(function(x){return x.id===id}):null
        if(!d){toast('Deal not found','error');return}
        openDrawer(d.title||'Deal Details',
          '<div class="drawer-section"><div class="drawer-section-title">Deal Info</div>'+
          '<div class="detail-row"><span class="detail-label">Client</span><span class="detail-value">'+esc(d.client_name||'—')+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value">'+fmtINR(d.amount_monthly)+'</span></div>'+
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
      el.innerHTML='<div class="page-header"><h2>Clients</h2><div class="flex gap-8"><button class="btn btn-accent btn-sm" onclick="openClientForm()">+ Add Client</button><button class="btn btn-secondary btn-sm" onclick="openNurtureForm()">+ Nurture</button></div></div>'+
        '<div class="stage-pills" id="client-stage-pills"></div>'+
        '<div class="filters">'+
        '<input type="text" id="client-search" placeholder="Search name, email, company..." oninput="clientSearch=this.value;clientPage=1;loadClients()" style="min-width:200px">'+
        '<select onchange="clientNurture=this.value;clientPage=1;loadClients()"><option value="false">Main pipeline</option><option value="true">Nurture list</option><option value="">All</option></select></div>'+
        '<div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Stage</th><th>Source</th><th>Score</th><th>Created</th></tr></thead><tbody id="client-tbody"></tbody></table></div>'+
        '<div class="flex-between mt-8 text-sm text-muted" id="client-pagination"></div>'
      // Build stage pill filters with counts
      var pillsHtml='<button class="stage-pill'+(clientStage===''?' active':'')+'" onclick="clientStage=\'\';clientPage=1;loadClients();document.querySelectorAll(\'.stage-pill\').forEach(function(p){p.classList.remove(\'active\')});this.classList.add(\'active\')">All</button>'
      CLIENT_STAGES.forEach(function(s){
        pillsHtml+='<button class="stage-pill'+(clientStage===s?' active':'')+'" onclick="clientStage=\''+s+'\';clientPage=1;loadClients();document.querySelectorAll(\'.stage-pill\').forEach(function(p){p.classList.remove(\'active\')});this.classList.add(\'active\')" id="sp-'+s+'">'+s.replace(/_/g,' ')+' <span class="pill-count" id="spc-'+s+'">0</span></button>'
      })
      document.getElementById('client-stage-pills').innerHTML=pillsHtml
      clientPage=1;loadClients()
    }

    function loadClients(){
      var tbody=document.getElementById('client-tbody')
      if(!tbody)return
      tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:32px;color:#555">Loading...</td></tr>'
      var params='?page='+clientPage+'&nurture='+clientNurture
      if(clientSearch)params+='&search='+encodeURIComponent(clientSearch)
      if(clientStage)params+='&stage='+clientStage
      // Fetch stage distribution for pill counts
      api('GET','/dashboard-stats').then(function(stats){
        var dist=(stats&&stats.pipeline_distribution)||{}
        CLIENT_STAGES.forEach(function(s){
          var el=document.getElementById('spc-'+s)
          if(el)el.textContent=dist[s]||0
        })
      }).catch(function(){})
      api('GET','/clients'+params).then(function(d){
        d=d||{clients:[],total:0,totalPages:1}
        tbody.innerHTML=d.clients.map(function(c){
          return '<tr onclick="window.location.hash=\'#clients/view/'+c.id+'\'"><td><strong>'+esc(c.name)+'</strong>'+(c.company_name?'<br><span class="text-muted text-sm">'+esc(c.company_name)+'</span>':'')+'</td><td class="text-muted">'+esc(c.email||'—')+'</td><td>'+stageBadge(c.pipeline_stage)+'</td><td class="text-muted">'+(c.lead_source||'manual')+'</td><td>'+(c.lead_score!=null?'<span class="text-accent">'+c.lead_score+'</span>':'—')+'</td><td class="text-muted">'+fmtDate(c.created_at)+'</td></tr>'
        }).join('')||'<tr><td colspan="6" class="empty-state">No clients found</td></tr>'
        document.getElementById('client-pagination').innerHTML='<span>'+(d.total||0)+' total</span><span>Page '+clientPage+' of '+(d.totalPages||1)+' <button class="btn btn-sm btn-secondary" onclick="if(clientPage>1){clientPage--;loadClients()}">&larr;</button> <button class="btn btn-sm btn-secondary" onclick="if(clientPage<'+(d.totalPages||1)+'){clientPage++;loadClients()}">&rarr;</button></span>'
      }).catch(function(e){tbody.innerHTML='<tr><td colspan="6" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function renderPipelineData(c){
      var pd=c.pipeline_data||{}
      var stage=c.pipeline_stage
      var html=''

      if(stage==='prospect'&&pd.linkedin){
        html+='<div class="drawer-section"><div class="drawer-section-title">Prospect Info</div>'+
          (pd.linkedin?'<div class="detail-row"><span class="detail-label">LinkedIn</span><span class="detail-value"><a href="'+esc(pd.linkedin)+'" target="_blank">Profile</a></span></div>':'')+
          (pd.lead_owner?'<div class="detail-row"><span class="detail-label">Lead Owner</span><span class="detail-value">'+esc(pd.lead_owner)+'</span></div>':'')+
          '</div>'
      }

      if(stage==='contacted'||stage==='replied'){
        html+='<div class="drawer-section"><div class="drawer-section-title">Outreach</div>'+
          (pd.outreach_channel?'<div class="detail-row"><span class="detail-label">Channel</span><span class="detail-value">'+esc(pd.outreach_channel)+'</span></div>':'')+
          (pd.first_contact?'<div class="detail-row"><span class="detail-label">First Contact</span><span class="detail-value">'+fmtDate(pd.first_contact)+'</span></div>':'')+
          (pd.last_contact?'<div class="detail-row"><span class="detail-label">Last Contact</span><span class="detail-value">'+fmtDate(pd.last_contact)+'</span></div>':'')+
          (pd.follow_up_count!=null?'<div class="detail-row"><span class="detail-label">Follow-ups</span><span class="detail-value">'+pd.follow_up_count+'</span></div>':'')+
          (pd.outcome?'<div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">'+stageBadge(pd.outcome)+'</span></div>':'')+
          '</div>'
      }

      if(stage==='replied'||stage==='discovery_booked'){
        html+='<div class="drawer-section"><div class="drawer-section-title">Qualification</div>'+
          (pd.interested!=null?'<div class="detail-row"><span class="detail-label">Interested?</span><span class="detail-value">'+esc(pd.interested)+'</span></div>':'')+
          (pd.wants_call!=null?'<div class="detail-row"><span class="detail-label">Wants Call?</span><span class="detail-value">'+esc(pd.wants_call)+'</span></div>':'')+
          (pd.objections?'<div class="detail-row"><span class="detail-label">Objections</span><span class="detail-value">'+esc(pd.objections)+'</span></div>':'')+
          '</div>'
      }

      if(stage==='discovery_booked'||stage==='discovery_completed'){
        html+='<div class="drawer-section"><div class="drawer-section-title">Discovery Data</div>'+
          (pd.founder_role?'<div class="detail-row"><span class="detail-label">Founder Role</span><span class="detail-value">'+esc(pd.founder_role)+'</span></div>':'')+
          (pd.years_in_business?'<div class="detail-row"><span class="detail-label">Years in Biz</span><span class="detail-value">'+esc(pd.years_in_business)+'</span></div>':'')+
          (pd.revenue_range?'<div class="detail-row"><span class="detail-label">Revenue Range</span><span class="detail-value">'+esc(pd.revenue_range)+'</span></div>':'')+
          (pd.team_size?'<div class="detail-row"><span class="detail-label">Team Size</span><span class="detail-value">'+esc(pd.team_size)+'</span></div>':'')+
          (pd.business_model?'<div class="detail-row"><span class="detail-label">Business Model</span><span class="detail-value">'+esc(pd.business_model)+'</span></div>':'')+
          (pd.main_offer?'<div class="detail-row"><span class="detail-label">Main Offer</span><span class="detail-value">'+esc(pd.main_offer)+'</span></div>':'')+
          (pd.biggest_goal?'<div class="detail-row"><span class="detail-label">Biggest Goal</span><span class="detail-value">'+esc(pd.biggest_goal)+'</span></div>':'')+
          (pd.why_now?'<div class="detail-row"><span class="detail-label">Why Now?</span><span class="detail-value">'+esc(pd.why_now)+'</span></div>':'')+
          (pd.biggest_bottleneck?'<div class="detail-row"><span class="detail-label">Biggest Bottleneck</span><span class="detail-value">'+esc(pd.biggest_bottleneck)+'</span></div>':'')+
          (pd.biggest_challenge?'<div class="detail-row"><span class="detail-label">Biggest Challenge</span><span class="detail-value">'+esc(pd.biggest_challenge)+'</span></div>':'')+
          (pd.call_date?'<div class="detail-row"><span class="detail-label">Call Date</span><span class="detail-value">'+fmtDate(pd.call_date)+'</span></div>':'')+
          (pd.call_link?'<div class="detail-row"><span class="detail-label">Call Link</span><span class="detail-value"><a href="'+esc(pd.call_link)+'" target="_blank">Join</a></span></div>':'')+
          '</div>'
      }

      if(stage==='discovery_completed'){
        html+='<div class="drawer-section"><div class="drawer-section-title">Discovery Notes</div>'+
          (pd.founder_goals?'<div class="detail-row"><span class="detail-label">Founder Goals</span><span class="detail-value">'+esc(pd.founder_goals)+'</span></div>':'')+
          (pd.founder_frustrations?'<div class="detail-row"><span class="detail-label">Frustrations</span><span class="detail-value">'+esc(pd.founder_frustrations)+'</span></div>':'')+
          (pd.revenue_model?'<div class="detail-row"><span class="detail-label">Revenue Model</span><span class="detail-value">'+esc(pd.revenue_model)+'</span></div>':'')+
          (pd.growth_goals?'<div class="detail-row"><span class="detail-label">Growth Goals</span><span class="detail-value">'+esc(pd.growth_goals)+'</span></div>':'')+
          (pd.recording_link?'<div class="detail-row"><span class="detail-label">Recording</span><span class="detail-value"><a href="'+esc(pd.recording_link)+'" target="_blank">View</a></span></div>':'')+
          (pd.meeting_notes?'<div class="detail-row"><span class="detail-label">Meeting Notes</span><span class="detail-value">'+esc(pd.meeting_notes)+'</span></div>':'')+
          '</div>'
      }

      if(stage==='audit_proposed'||stage==='audit_purchased'){
        html+='<div class="drawer-section"><div class="drawer-section-title">Audit Proposal</div>'+
          (pd.audit_price?'<div class="detail-row"><span class="detail-label">Audit Price</span><span class="detail-value">'+fmtINR(pd.audit_price)+'</span></div>':'')+
          (pd.audit_scope?'<div class="detail-row"><span class="detail-label">Scope</span><span class="detail-value">'+esc(pd.audit_scope)+'</span></div>':'')+
          (pd.proposal_sent?'<div class="detail-row"><span class="detail-label">Proposal Sent</span><span class="detail-value">'+fmtDate(pd.proposal_sent)+'</span></div>':'')+
          '</div>'
      }

      if(stage==='audit_purchased'||stage==='audit_delivered'){
        html+='<div class="drawer-section"><div class="drawer-section-title">Audit Assets</div>'+
          (pd.audit_folder?'<div class="detail-row"><span class="detail-label">Audit Folder</span><span class="detail-value"><a href="'+esc(pd.audit_folder)+'" target="_blank">Open</a></span></div>':'')+
          (pd.audit_start?'<div class="detail-row"><span class="detail-label">Start Date</span><span class="detail-value">'+fmtDate(pd.audit_start)+'</span></div>':'')+
          (pd.audit_deadline?'<div class="detail-row"><span class="detail-label">Deadline</span><span class="detail-value">'+fmtDate(pd.audit_deadline)+'</span></div>':'')+
          '</div>'
      }

      if(stage==='audit_delivered'){
        html+='<div class="drawer-section"><div class="drawer-section-title">Audit Findings</div>'+
          (pd.bottlenecks?'<div class="detail-row"><span class="detail-label">Bottlenecks</span><span class="detail-value">'+esc(pd.bottlenecks)+'</span></div>':'')+
          (pd.risks?'<div class="detail-row"><span class="detail-label">Risks</span><span class="detail-value">'+esc(pd.risks)+'</span></div>':'')+
          (pd.opportunities?'<div class="detail-row"><span class="detail-label">Opportunities</span><span class="detail-value">'+esc(pd.opportunities)+'</span></div>':'')+
          (pd.quick_wins?'<div class="detail-row"><span class="detail-label">Quick Wins</span><span class="detail-value">'+esc(pd.quick_wins)+'</span></div>':'')+
          (pd.audit_pdf?'<div class="detail-row"><span class="detail-label">Audit PDF</span><span class="detail-value"><a href="'+esc(pd.audit_pdf)+'" target="_blank">View</a></span></div>':'')+
          '</div>'
      }

      if(stage==='implementation_proposed'||stage==='client'){
        html+='<div class="drawer-section"><div class="drawer-section-title">Implementation</div>'+
          (pd.services?'<div class="detail-row"><span class="detail-label">Services</span><span class="detail-value">'+esc(pd.services)+'</span></div>':'')+
          (pd.project_scope?'<div class="detail-row"><span class="detail-label">Scope</span><span class="detail-value">'+esc(pd.project_scope)+'</span></div>':'')+
          (pd.timeline?'<div class="detail-row"><span class="detail-label">Timeline</span><span class="detail-value">'+esc(pd.timeline)+'</span></div>':'')+
          (pd.impl_price?'<div class="detail-row"><span class="detail-label">Price</span><span class="detail-value">'+fmtINR(pd.impl_price)+'</span></div>':'')+
          '</div>'
      }

      if(stage==='client'){
        html+='<div class="drawer-section"><div class="drawer-section-title">Delivery</div>'+
          (pd.start_date?'<div class="detail-row"><span class="detail-label">Start Date</span><span class="detail-value">'+fmtDate(pd.start_date)+'</span></div>':'')+
          (pd.end_date?'<div class="detail-row"><span class="detail-label">End Date</span><span class="detail-value">'+fmtDate(pd.end_date)+'</span></div>':'')+
          (pd.deliverables?'<div class="detail-row"><span class="detail-label">Deliverables</span><span class="detail-value">'+esc(pd.deliverables)+'</span></div>':'')+
          (pd.wins?'<div class="detail-row"><span class="detail-label">Wins</span><span class="detail-value">'+esc(pd.wins)+'</span></div>':'')+
          (pd.metrics?'<div class="detail-row"><span class="detail-label">Metrics</span><span class="detail-value">'+esc(pd.metrics)+'</span></div>':'')+
          '</div>'
      }

      if(stage==='followup'){
        html+='<div class="drawer-section"><div class="drawer-section-title">Follow-up</div>'+
          (pd.reason_not_buying?'<div class="detail-row"><span class="detail-label">Reason Not Buying</span><span class="detail-value">'+esc(pd.reason_not_buying)+'</span></div>':'')+
          (pd.followup_attempt?'<div class="detail-row"><span class="detail-label">Attempt</span><span class="detail-value">'+pd.followup_attempt+'/3</span></div>':'')+
          (pd.next_followup_date?'<div class="detail-row"><span class="detail-label">Next Follow-up</span><span class="detail-value">'+fmtDate(pd.next_followup_date)+'</span></div>':'')+
          (pd.followup_notes?'<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">'+esc(pd.followup_notes)+'</span></div>':'')+
          '</div>'
      }

      if(stage==='lost'){
        html+='<div class="drawer-section"><div class="drawer-section-title">Lost</div>'+
          (pd.reason_lost?'<div class="detail-row"><span class="detail-label">Reason Lost</span><span class="detail-value">'+esc(pd.reason_lost)+'</span></div>':'')+
          (pd.competitor?'<div class="detail-row"><span class="detail-label">Competitor</span><span class="detail-value">'+esc(pd.competitor)+'</span></div>':'')+
          (pd.lost_notes?'<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">'+esc(pd.lost_notes)+'</span></div>':'')+
          '</div>'
      }

      return html
    }

    function openClientDetail(id){
      api('GET','/clients/'+id+'/full').then(function(d){
        var c=d.data||d
        if(!c){toast('Client not found','error');return}
        var q=c.qualification||{}
        var stageSpecificHtml=renderPipelineData(c)
        openDrawer(esc(c.name),
          '<div class="drawer-section"><div class="drawer-section-title">Contact</div>'+
          '<div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">'+esc(c.email||'—')+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">'+esc(c.phone||'—')+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">'+esc(c.company_name||'—')+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Role</span><span class="detail-value">'+esc(c.role||'—')+'</span></div></div>'+
          '<div class="drawer-section"><div class="drawer-section-title">Pipeline</div>'+
          '<div class="detail-row"><span class="detail-label">Stage</span><span class="detail-value">'+stageBadge(c.pipeline_stage)+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Source</span><span class="detail-value">'+esc(c.lead_source||'—')+'</span></div>'+
          (c.industry?'<div class="detail-row"><span class="detail-label">Industry</span><span class="detail-value">'+esc(c.industry)+'</span></div>':'')+
          '<div class="detail-row"><span class="detail-label">Lead Score</span><span class="detail-value">'+(c.lead_score!=null?'<span class="text-accent">'+c.lead_score+'</span>':'—')+'</span></div>'+
          '<div class="detail-row"><span class="detail-label">Churn Risk</span><span class="detail-value">'+(c.churn_risk!=null?(c.churn_risk*100).toFixed(0)+'%':'—')+'</span></div></div>'+
          (q.monthlyRevenue||q.investmentLevel?'<div class="drawer-section"><div class="drawer-section-title">Qualification</div>'+
            (q.monthlyRevenue?'<div class="detail-row"><span class="detail-label">Revenue</span><span class="detail-value">'+esc(q.monthlyRevenue)+'</span></div>':'')+
            (q.investmentLevel?'<div class="detail-row"><span class="detail-label">Investment</span><span class="detail-value">'+esc(q.investmentLevel)+'</span></div>':'')+
            (q.biggestBottleneck?'<div class="detail-row"><span class="detail-label">Bottleneck</span><span class="detail-value">'+esc(q.biggestBottleneck)+'</span></div>':'')+
            (q.goal90Days?'<div class="detail-row"><span class="detail-label">90-Day Goal</span><span class="detail-value">'+esc(q.goal90Days)+'</span></div>':'')+
            (q.plan_tier?'<div class="detail-row"><span class="detail-label">Plan</span><span class="detail-value">'+esc(q.plan_tier)+'</span></div>':'')+
          '</div>':'')+
          stageSpecificHtml+
          '<div class="drawer-section"><div class="drawer-section-title">Notes</div><p class="text-sm text-muted">'+esc(c.notes||'No notes')+'</p></div>'+
          '<div class="flex gap-8" style="flex-wrap:wrap"><button class="btn btn-sm btn-accent" onclick="closeDrawer();editClient(\''+c.id+'\')">Edit</button><button class="btn btn-sm btn-secondary" onclick="closeDrawer();openStageForm(\''+c.id+'\',\''+c.pipeline_stage+'\')">Stage Data</button><button class="btn btn-sm btn-secondary" onclick="closeDrawer();updateClientStage(\''+c.id+'\',\''+c.pipeline_stage+'\')">Move Stage</button></div>')
      }).catch(function(e){toast(e.message,'error')})
    }

    function openStageForm(id,stage){
      var formHtml=''
      if(stage==='prospect'){
        formHtml='<div class="field-row"><div class="field"><label>LinkedIn</label><input id="pd-linkedin" placeholder="https://linkedin.com/in/..."></div><div class="field"><label>Lead Owner</label><input id="pd-owner" placeholder="Team member name"></div></div>'
      } else if(stage==='contacted'){
        formHtml='<div class="field-row"><div class="field"><label>Outreach Channel</label><select id="pd-channel"><option value="email">Email</option><option value="linkedin">LinkedIn</option><option value="call">Call</option><option value="referral">Referral</option><option value="other">Other</option></select></div><div class="field"><label>Outcome</label><select id="pd-outcome"><option value="">Select...</option><option value="no_reply">No Reply</option><option value="replied">Replied</option><option value="interested">Interested</option><option value="not_interested">Not Interested</option></select></div></div>'+
          '<div class="field-row"><div class="field"><label>First Contact Date</label><input id="pd-first-contact" type="date"></div><div class="field"><label>Last Contact Date</label><input id="pd-last-contact" type="date"></div></div>'+
          '<div class="field-row"><div class="field"><label>Follow-up Count</label><input id="pd-follow-up" type="number" value="0" min="0"></div></div>'
      } else if(stage==='replied'){
        formHtml='<div class="field-row"><div class="field"><label>Interested?</label><select id="pd-interested"><option value="">Select...</option><option value="yes">Yes</option><option value="no">No</option><option value="maybe">Maybe</option></select></div><div class="field"><label>Wants Call?</label><select id="pd-wants-call"><option value="">Select...</option><option value="yes">Yes</option><option value="no">No</option></select></div></div>'+
          '<div class="field"><label>Objections</label><textarea id="pd-objections" placeholder="Any objections raised"></textarea></div>'+
          '<div class="field"><label>Notes</label><textarea id="pd-reply-notes" placeholder="Qualification notes"></textarea></div>'
      } else if(stage==='discovery_booked'){
        formHtml='<div class="field-row"><div class="field"><label>Founder Role</label><input id="pd-founder-role" placeholder="e.g. CEO"></div><div class="field"><label>Years in Business</label><input id="pd-years" type="number" placeholder="e.g. 3"></div></div>'+
          '<div class="field-row"><div class="field"><label>Revenue Range</label><select id="pd-revenue"><option value="">Select...</option><option value="0-1L">₹0 - ₹1L/mo</option><option value="1-5L">₹1L - ₹5L/mo</option><option value="5-25L">₹5L - ₹25L/mo</option><option value="25L-1Cr">₹25L - ₹1Cr/mo</option><option value="1Cr+">₹1Cr+/mo</option></select></div><div class="field"><label>Team Size</label><select id="pd-team-size"><option value="">Select...</option><option value="1">Solo</option><option value="2-5">2-5</option><option value="6-20">6-20</option><option value="21-50">21-50</option><option value="50+">50+</option></select></div></div>'+
          '<div class="field-row"><div class="field"><label>Business Model</label><select id="pd-biz-model"><option value="">Select...</option><option value="saas">SaaS</option><option value="agency">Agency</option><option value="ecommerce">E-commerce</option><option value="consulting">Consulting</option><option value="content">Content</option><option value="other">Other</option></select></div><div class="field"><label>Main Offer</label><input id="pd-main-offer" placeholder="What do they sell?"></div></div>'+
          '<div class="field"><label>Biggest Goal</label><textarea id="pd-biggest-goal" placeholder="What is their biggest goal right now?"></textarea></div>'+
          '<div class="field"><label>Why Now?</label><textarea id="pd-why-now" placeholder="Why are they looking for help now?"></textarea></div>'+
          '<div class="field-row"><div class="field"><label>Biggest Bottleneck</label><textarea id="pd-bottleneck" placeholder="Biggest bottleneck"></textarea></div><div class="field"><label>Biggest Challenge</label><textarea id="pd-challenge" placeholder="Biggest challenge"></textarea></div></div>'+
          '<div class="field-row"><div class="field"><label>Call Date</label><input id="pd-call-date" type="date"></div><div class="field"><label>Call Link</label><input id="pd-call-link" placeholder="https://meet.google.com/..."></div></div>'
      } else if(stage==='discovery_completed'){
        formHtml='<div class="field"><label>Founder Goals</label><textarea id="pd-f-goals" placeholder="What are the founder goals?"></textarea></div>'+
          '<div class="field-row"><div class="field"><label>Founder Frustrations</label><textarea id="pd-f-frustrations" placeholder="What frustrates them?"></textarea></div><div class="field"><label>Founder Bottlenecks</label><textarea id="pd-f-bottlenecks" placeholder="What bottlenecks do they face?"></textarea></div></div>'+
          '<div class="field-row"><div class="field"><label>Revenue Model</label><input id="pd-rev-model" placeholder="How do they make money?"></div><div class="field"><label>Growth Goals</label><input id="pd-growth" placeholder="Growth targets"></div></div>'+
          '<div class="field"><label>Meeting Notes</label><textarea id="pd-meeting-notes" placeholder="Notes from the discovery call" style="min-height:80px"></textarea></div>'+
          '<div class="field-row"><div class="field"><label>Recording Link</label><input id="pd-recording" placeholder="https://..."></div></div>'
      } else if(stage==='audit_proposed'){
        formHtml='<div class="field-row"><div class="field"><label>Audit Price</label><input id="pd-audit-price" type="number" placeholder="e.g. 25000"></div><div class="field"><label>Audit Scope</label><input id="pd-audit-scope" placeholder="e.g. Full operations audit"></div></div>'+
          '<div class="field"><label>Proposal Sent Date</label><input id="pd-proposal-sent" type="date"></div>'+
          '<div class="field"><label>Status</label><select id="pd-audit-status"><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></div>'
      } else if(stage==='audit_purchased'){
        formHtml='<div class="field"><label>Audit Folder (Google Drive/Notion)</label><input id="pd-audit-folder" placeholder="https://drive.google.com/..."></div>'+
          '<div class="field-row"><div class="field"><label>Audit Start Date</label><input id="pd-audit-start" type="date"></div><div class="field"><label>Audit Deadline</label><input id="pd-audit-deadline" type="date"></div></div>'
      } else if(stage==='audit_delivered'){
        formHtml='<div class="field"><label>Key Bottlenecks Found</label><textarea id="pd-bottlenecks" placeholder="Key bottlenecks identified"></textarea></div>'+
          '<div class="field-row"><div class="field"><label>Risks</label><textarea id="pd-risks" placeholder="Risks identified"></textarea></div><div class="field"><label>Opportunities</label><textarea id="pd-opportunities" placeholder="Opportunities identified"></textarea></div></div>'+
          '<div class="field"><label>Quick Wins</label><textarea id="pd-quick-wins" placeholder="Quick wins to implement"></textarea></div>'+
          '<div class="field-row"><div class="field"><label>Audit PDF Link</label><input id="pd-audit-pdf" placeholder="https://..."></div></div>'
      } else if(stage==='implementation_proposed'){
        formHtml='<div class="field"><label>Services Offered</label><textarea id="pd-services" placeholder="What services are being offered?"></textarea></div>'+
          '<div class="field-row"><div class="field"><label>Project Scope</label><input id="pd-project-scope" placeholder="Scope of work"></div><div class="field"><label>Timeline</label><input id="pd-timeline" placeholder="e.g. 3 months"></div></div>'+
          '<div class="field-row"><div class="field"><label>Price</label><input id="pd-price" type="number" placeholder="e.g. 50000"></div><div class="field"><label>Status</label><select id="pd-impl-status"><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></div></div>'
      } else if(stage==='client'){
        formHtml='<div class="field-row"><div class="field"><label>Start Date</label><input id="pd-start-date" type="date"></div><div class="field"><label>End Date</label><input id="pd-end-date" type="date"></div></div>'+
          '<div class="field"><label>Deliverables</label><textarea id="pd-deliverables" placeholder="Key deliverables"></textarea></div>'+
          '<div class="field-row"><div class="field"><label>Wins</label><textarea id="pd-wins" placeholder="Client wins / success stories"></textarea></div><div class="field"><label>Metrics</label><textarea id="pd-metrics" placeholder="Key metrics / results"></textarea></div></div>'
      } else       if(stage==='awaiting_confirmation'){
        formHtml='<div class="field-row"><div class="field"><label>Preferred Date</label><input id="pd-preferred-slot-date" type="date"></div><div class="field"><label>Preferred Start</label><input id="pd-preferred-slot-start" type="time"></div></div>'+
          '<div class="field"><label>Preferred End</label><input id="pd-preferred-slot-end" type="time"></div>'
      } else if(stage==='confirmed'){
        formHtml='<div class="field-row"><div class="field"><label>Confirmed Date</label><input id="pd-confirmed-date" type="date"></div><div class="field"><label>Confirmed Start</label><input id="pd-confirmed-start" type="time"></div></div>'+
          '<div class="field-row"><div class="field"><label>Confirmed End</label><input id="pd-confirmed-end" type="time"></div><div class="field"><label>Calendar Event Link</label><input id="pd-calendar-event" placeholder="https://calendar.google.com/..."></div></div>'
      } else if(stage==='followup'){
        formHtml='<div class="field"><label>Reason Not Buying</label><textarea id="pd-reason" placeholder="Why didn\'t they buy?"></textarea></div>'+
          '<div class="field-row"><div class="field"><label>Follow-up Attempt</label><select id="pd-attempt"><option value="1">1/3</option><option value="2">2/3</option><option value="3">3/3</option></select></div><div class="field"><label>Next Follow-up Date</label><input id="pd-follow-date" type="date"></div></div>'+
          '<div class="field"><label>Notes</label><textarea id="pd-followup-notes" placeholder="Follow-up notes"></textarea></div>'
      } else if(stage==='lost'){
        formHtml='<div class="field"><label>Reason Lost</label><textarea id="pd-reason-lost" placeholder="Why was this deal lost?"></textarea></div>'+
          '<div class="field"><label>Competitor (if any)</label><input id="pd-competitor" placeholder="Competitor name"></div>'+
          '<div class="field"><label>Notes</label><textarea id="pd-lost-notes" placeholder="Additional notes"></textarea></div>'
      } else {
        formHtml='<p class="text-sm text-muted">No additional data collection for this stage.</p>'
      }
      openModal('Stage Data: '+stageLabel(stage),
        formHtml,
        '<button class="btn btn-primary btn-sm" onclick="saveStageData(\''+id+'\')">Save Data</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveStageData(id){
      var pd={}
      var keyMap={
        'reason':'reason_not_buying',
        'attempt':'followup_attempt',
        'follow-date':'next_followup_date',
        'followup-notes':'followup_notes',
        'f-goals':'founder_goals',
        'f-frustrations':'founder_frustrations',
        'f-bottlenecks':'founder_bottlenecks',
        'bottleneck':'biggest_bottleneck',
        'challenge':'biggest_challenge',
        'rev-model':'revenue_model',
        'growth-':'growth_goals',
        'audit-folder':'audit_folder',
        'audit-start':'audit_start',
        'audit-deadline':'audit_deadline',
        'meeting-notes':'meeting_notes',
        'preferred-slot-date':'preferred_slot_date',
        'preferred-slot-start':'preferred_slot_start',
        'preferred-slot-end':'preferred_slot_end',
        'confirmed-date':'confirmed_date',
        'confirmed-start':'confirmed_start',
        'confirmed-end':'confirmed_end',
        'calendar-event':'calendar_event',
      }
      var fields=document.querySelectorAll('#modal-body [id^="pd-"]')
      fields.forEach(function(f){
        var raw=f.id.replace('pd-','')
        var key=keyMap[raw]||raw
        var val=f.type==='checkbox'?f.checked:f.value.trim()
        if(val!==''&&val!==null&&val!==false)pd[key]=val
      })
      if(Object.keys(pd).length===0){toast('No data to save','error');return}
      api('PATCH','/clients/'+id,{pipeline_data:pd}).then(function(){
        toast('Stage data saved','success')
        closeModal()
        var hash=window.location.hash
        if(hash&&hash.includes('clients/view/'))renderClientProfile(id)
        else openClientDetail(id)
      }).catch(function(e){toast(e.message,'error')})
    }

    function openClientForm(){
      openModal('New Prospect',
        '<div class="field"><label>Founder Name</label><input id="cf-name" placeholder="Founder name"></div>'+
        '<div class="field-row"><div class="field"><label>Email</label><input id="cf-email" type="email" placeholder="email@example.com"></div><div class="field"><label>Phone</label><input id="cf-phone" placeholder="+91..."></div></div>'+
        '<div class="field-row"><div class="field"><label>LinkedIn</label><input id="cf-linkedin" placeholder="https://linkedin.com/in/..."></div><div class="field"><label>Role</label><input id="cf-role" placeholder="e.g. CEO, Founder"></div></div>'+
        '<div class="field-row"><div class="field"><label>Company Name</label><input id="cf-company" placeholder="Company name"></div><div class="field"><label>Website</label><input id="cf-website" placeholder="https://company.com"></div></div>'+
        '<div class="field-row"><div class="field"><label>Industry</label><input id="cf-industry" placeholder="Industry"></div><div class="field"><label>Source</label><select id="cf-source"><option value="manual">Manual</option><option value="website">Website</option><option value="referral">Referral</option><option value="linkedin">LinkedIn</option><option value="google">Google</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="twitter">Twitter</option><option value="cold_email">Cold Email</option><option value="event">Event</option><option value="partner">Partner</option><option value="other">Other</option></select></div></div>'+
        '<div class="field"><label>Service</label><input id="cf-service" placeholder="Service"></div>'+
        '<div class="field"><label>Notes</label><textarea id="cf-notes" placeholder="Notes..."></textarea></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveClient()">Add Prospect</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveClient(){
      var body={name:document.getElementById('cf-name').value.trim(),email:document.getElementById('cf-email').value.trim(),phone:document.getElementById('cf-phone').value.trim(),company_name:document.getElementById('cf-company').value.trim(),role:document.getElementById('cf-role').value.trim(),industry:document.getElementById('cf-industry').value.trim(),source:document.getElementById('cf-source').value,service:document.getElementById('cf-service').value.trim(),notes:document.getElementById('cf-notes').value.trim(),pipeline_data:{linkedin:document.getElementById('cf-linkedin').value.trim(),website:document.getElementById('cf-website').value.trim()}}
      if(!body.name){toast('Name is required','error');return}
      // Filter empty pipeline_data
      for(var k in body.pipeline_data){if(!body.pipeline_data[k])delete body.pipeline_data[k]}
      if(Object.keys(body.pipeline_data).length===0)delete body.pipeline_data
      api('POST','/clients',body).then(function(){toast('Prospect added','success');closeModal();loadClients()}).catch(function(e){toast(e.message,'error')})
    }

    function openNurtureForm(){
      openModal('Add to Nurture',
        '<div class="field"><label>Client Name</label><input id="nf-name" placeholder="Client name"></div>'+
        '<div class="field"><label>Email</label><input id="nf-email" type="email" placeholder="email@example.com"></div>'+
        '<div class="field"><label>Phone</label><input id="nf-phone" placeholder="+91..."></div>'+
        '<div class="field"><label>Reason Not Buying</label><textarea id="nf-reason" placeholder="Why aren\'t they buying right now?"></textarea></div>'+
        '<p class="text-sm text-muted">Nurture leads receive automated value emails.</p>',
        '<button class="btn btn-primary btn-sm" onclick="saveNurture()">Add to Nurture</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveNurture(){
      var name=document.getElementById('nf-name').value.trim()
      if(!name){toast('Name is required','error');return}
      var pd={reason_not_buying:document.getElementById('nf-reason').value.trim()}
      api('POST','/clients',{name:name,email:document.getElementById('nf-email').value.trim(),phone:document.getElementById('nf-phone').value.trim(),pipeline_stage:'followup',pipeline_data:pd,source:'manual',is_nurture:true}).then(function(){toast('Added to nurture list','success');closeModal();loadClients()}).catch(function(e){toast(e.message,'error')})
    }

    function editClient(id){
      api('GET','/clients?search='+id).then(function(d){
        var c=d.clients?d.clients[0]:null
        if(!c)return
        openModal('Edit: '+esc(c.name),
          '<div class="field"><label>Name</label><input id="ef-name" value="'+esc(c.name)+'"></div>'+
          '<div class="field-row"><div class="field"><label>Email</label><input id="ef-email" value="'+esc(c.email||'')+'"></div><div class="field"><label>Phone</label><input id="ef-phone" value="'+esc(c.phone||'')+'"></div></div>'+
          '<div class="field-row"><div class="field"><label>Company</label><input id="ef-company" value="'+esc(c.company_name||'')+'"></div><div class="field"><label>Industry</label><input id="ef-industry" value="'+esc(c.industry||'')+'"></div></div>'+
          '<div class="field-row"><div class="field"><label>Stage</label><select id="ef-stage">'+PIPELINE_STAGES.map(function(s){return '<option value="'+s+'"'+(s===c.pipeline_stage?' selected':'')+'>'+stageLabel(s)+'</option>'}).join('')+'</select></div><div class="field"><label>Source</label><select id="ef-source">'+['manual','website','referral','linkedin','google','facebook','instagram','twitter','cold_email','event','partner','other'].map(function(s){return '<option value="'+s+'"'+(c.lead_source===s?' selected':'')+'>'+s.replace(/_/g,' ')+'</option>'}).join('')+'</select></div></div>'+
          '<div class="field"><label>Notes</label><textarea id="ef-notes">'+esc(c.notes||'')+'</textarea></div>',
          '<button class="btn btn-primary btn-sm" onclick="saveEditClient(\''+id+'\')">Save</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
      }).catch(function(e){toast(e.message,'error')})
    }

    function saveEditClient(id){
      var body={name:document.getElementById('ef-name').value.trim(),email:document.getElementById('ef-email').value.trim(),phone:document.getElementById('ef-phone').value.trim(),company_name:document.getElementById('ef-company').value.trim(),industry:document.getElementById('ef-industry').value.trim(),pipeline_stage:document.getElementById('ef-stage').value,notes:document.getElementById('ef-notes').value.trim()}
      var source=document.getElementById('ef-source').value
      if(source)body.source=source
      api('PATCH','/clients/'+id,body).then(function(){toast('Client updated','success');closeModal();loadClients()}).catch(function(e){toast(e.message,'error')})
    }

    function updateClientStage(id,current){
      openModal('Move Stage',
        '<div class="field"><label>New Stage</label><select id="ms-stage">'+PIPELINE_STAGES.map(function(s){return '<option value="'+s+'"'+(s===current?' selected':'')+'>'+stageLabel(s)+'</option>'}).join('')+'</select></div>'+
        '<div class="field"><label>Reason / Notes</label><textarea id="ms-notes" placeholder="Why is this moving to this stage?"></textarea></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveClientStage(\''+id+'\')">Move</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveClientStage(id){
      api('PATCH','/clients/'+id,{pipeline_stage:document.getElementById('ms-stage').value}).then(function(){
        toast('Stage updated','success');closeModal()
        var tb=document.getElementById('client-tbody')
        if(tb)loadClients()
        renderPipeline()
      }).catch(function(e){toast(e.message,'error')})
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

    // ─── DEALS ───
    function renderDeals(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><h2>Deals</h2><button class="btn btn-accent btn-sm" onclick="openDealForm()">+ New Deal</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Title</th><th>Client</th><th>Amount</th><th>Stage</th><th>Probability</th><th>Assigned</th><th>Updated</th></tr></thead><tbody id="deals-tbody"><tr><td colspan="7" style="text-align:center;padding:32px;color:#555">Loading...</td></tr></tbody></table></div>'
      api('GET','/deals').then(function(data){
        data=data||[]
        document.getElementById('deals-tbody').innerHTML=data.map(function(d){
          return '<tr onclick="openDealDetail(\''+d.id+'\')"><td><strong>'+esc(d.title||'Untitled')+'</strong></td><td class="text-muted">'+esc(d.client_name||'—')+'</td><td class="text-accent">'+fmtINR(d.amount_monthly)+'</td><td>'+stageBadge(d.stage)+'</td><td class="text-muted">'+(d.probability||'—')+'%</td><td class="text-muted">'+esc(d.assigned_name||'—')+'</td><td class="text-muted">'+fmtDate(d.updated_at)+'</td></tr>'
        }).join('')||'<tr><td colspan="7" class="empty-state">No deals yet</td></tr>'
      }).catch(function(e){document.getElementById('deals-tbody').innerHTML='<tr><td colspan="7" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function openDealForm(){
      openModal('New Closed Deal',
        '<div class="field"><label>Title</label><input id="df-title" placeholder="Deal title"></div><div class="field-row"><div class="field"><label>Client</label><input id="df-client" placeholder="Client name" list="client-list"><datalist id="client-list"></datalist></div><div class="field"><label>Amount</label><input id="df-amount" type="number" placeholder="5000"></div></div><div class="field-row"><div class="field"><label>Stage</label><select id="df-stage"><option value="closed_won">Closed Won</option><option value="closed_lost">Closed Lost</option></select></div><div class="field"><label>COGS</label><input id="df-cogs" type="number" placeholder="0" value="0"></div></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveDeal()">Create Deal</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveDeal(){
      var stage=document.getElementById('df-stage').value
      api('POST','/deals',{
        title:document.getElementById('df-title').value.trim(),
        client_name:document.getElementById('df-client').value.trim(),
        amount_monthly:parseFloat(document.getElementById('df-amount').value)||0,
        cogs_monthly:parseFloat(document.getElementById('df-cogs').value)||0,
        stage:stage,
        probability:stage==='closed_won'?100:0,
        venture:'FLODON'
      }).then(function(){toast('Deal created','success');closeModal();renderDeals()}).catch(function(e){toast(e.message,'error')})
    }

    // ─── Auto-save helpers ───
    var saveTimers = {}

    function autoSave(clientId, field, value) {
      if (saveTimers[field]) clearTimeout(saveTimers[field])
      saveTimers[field] = setTimeout(function () {
        var body = {}
        body[field] = value
        api('PATCH', '/clients/' + clientId, body)
          .then(function () { showSaveIndicator(field) })
          .catch(function (e) { toast('Save failed: ' + e.message, 'error') })
      }, 600)
    }

    function autoSavePipelineData(clientId, key, value) {
      if (saveTimers['pd-' + key]) clearTimeout(saveTimers['pd-' + key])
      saveTimers['pd-' + key] = setTimeout(function () {
        var pd = {}
        pd[key] = value
        api('PATCH', '/clients/' + clientId, { pipeline_data: pd })
          .then(function () { showSaveIndicator(key) })
          .catch(function (e) { toast('Save failed: ' + e.message, 'error') })
      }, 600)
    }

    function autoSaveQualification(clientId, key, value) {
      if (saveTimers['qf-' + key]) clearTimeout(saveTimers['qf-' + key])
      saveTimers['qf-' + key] = setTimeout(function () {
        api('GET', '/clients/' + clientId).then(function (d) {
          var c = d.data || d
          var q = Object.assign({}, c.qualification || {})
          q[key] = value
          api('PATCH', '/clients/' + clientId, { qualification: q })
            .then(function () { showSaveIndicator(key) })
            .catch(function (e) { toast('Save failed: ' + e.message, 'error') })
        }).catch(function (e) { toast('Save failed: ' + e.message, 'error') })
      }, 600)
    }

    function showSaveIndicator(field) {
      var el = document.getElementById('si-' + field)
      if (el) { el.textContent = 'Saved'; el.style.opacity = '1'; setTimeout(function () { el.style.opacity = '0' }, 2000) }
    }

    function escAttr(s) { return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;') }

    // ─── Polling for real-time updates ───
    var pollTimer = null
    var currentClientId = null

    function startPolling(id) {
      currentClientId = id
      if (pollTimer) clearInterval(pollTimer)
      pollTimer = setInterval(function () {
        if (currentClientId !== id) return
        api('GET', '/clients/' + id + '/full').then(function (d) {
          var c = d.data || d
          if (!c) return
          // Update activity section if visible
          var actEl = document.getElementById('profile-activity')
          if (actEl) {
            var activities = c.activity || []
            actEl.innerHTML = activities.length
              ? activities.map(function (a) {
                  return '<div class="detail-row" style="font-size:12px;padding:6px 0"><span class="detail-label" style="text-transform:capitalize">' + esc(a.action.replace(/_/g, ' ')) + '</span><span class="detail-value text-muted" style="font-size:11px">' + fmtDate(a.created_at) + '</span></div>'
                }).join('')
              : '<div class="text-sm text-muted" style="padding:8px 0">No activity yet</div>'
          }
          // Update calls section if visible
          var callsEl = document.getElementById('profile-calls')
          if (callsEl) {
            var calls = c.calls || []
            callsEl.innerHTML = calls.length
              ? calls.map(function (cl) {
                  return '<div class="detail-row" style="font-size:12px;padding:6px 0"><span class="detail-label">' + stageBadge(cl.status) + '</span><span class="detail-value text-muted" style="font-size:11px">' + fmtDate(cl.scheduled_at) + (cl.outcome ? ' &middot; ' + esc(cl.outcome) : '') + '</span></div>'
                }).join('')
              : '<div class="text-sm text-muted" style="padding:8px 0">No calls</div>'
          }
        }).catch(function () {})
      }, 10000)
    }

    function stopPolling() {
      currentClientId = null
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
    }

    // ─── Comprehensive Client Profile ───
    function renderClientProfile(id){
      showLoader(document.getElementById('main-content'))
      stopPolling()
      api('GET','/clients/'+id+'/full').then(function(d){
        var c=d.data||d
        if(!c){toast('Client not found','error');renderClients();return}
        var el=document.getElementById('main-content')
        var q = c.qualification || {}
        var pd = c.pipeline_data || {}
        var calls = c.calls || []
        var deals = c.deals || []
        var activity = c.activity || []
        var projects = c.projects || []

        el.innerHTML=
          // ── Header ──
          '<div class="page-header"><h2>Client Profile</h2><div class="flex gap-8" style="flex-wrap:wrap">'+
            '<button class="btn btn-accent btn-sm" onclick="editClient(\''+c.id+'\')">Edit</button>'+
            '<button class="btn btn-secondary btn-sm" onclick="openStageForm(\''+c.id+'\',\''+c.pipeline_stage+'\')">Stage Data</button>'+
            '<button class="btn btn-secondary btn-sm" onclick="updateClientStage(\''+c.id+'\',\''+c.pipeline_stage+'\')">Move Stage</button>'+
            '<button class="btn btn-secondary btn-sm" onclick="scoreLead(\''+c.id+'\')">Score</button>'+
            '<button class="btn btn-secondary btn-sm" onclick="renderClients()">&larr; Back</button>'+
          '</div></div>'+

          // ── Profile Header ──
          '<div class="client-profile-header">'+
            '<div class="client-profile-avatar">'+initials(c.name)+'</div>'+
            '<div class="client-profile-info">'+
              '<div class="client-profile-name">'+
                '<input type="text" id="ie-name" value="'+escAttr(c.name)+'" class="inline-edit-title" onblur="autoSave(\''+c.id+'\',\'name\',this.value)" style="background:transparent;border:none;color:inherit;font:inherit;width:100%;outline:none">'+
                '<span id="si-name" class="save-indicator"></span>'+
              '</div>'+
              '<div class="client-profile-company">'+
                '<span id="ie-company-display">'+esc(c.company_name||c.brand_name||'')+'</span>'+
                (c.role?'<span class="text-muted"> · <input type="text" id="ie-role" value="'+escAttr(c.role)+'" class="inline-edit" style="width:auto;min-width:80px" onblur="autoSave(\''+c.id+'\',\'role\',this.value)"><span id="si-role" class="save-indicator"></span></span>':'')+
              '</div>'+
              '<div class="client-profile-meta">'+
                stageBadge(c.pipeline_stage)+
                (c.lead_score!=null?'<span class="badge badge-accent">'+c.lead_score+'</span>':'')+
                '<span class="text-muted" style="font-size:10px">'+esc(c.source||c.lead_source||'manual')+'</span>'+
                (c.churn_risk!=null?'<span class="badge '+(c.churn_risk>0.3?'badge-red':'badge-gray')+'">'+(c.churn_risk*100).toFixed(0)+'% churn</span>':'')+
              '</div></div></div>'+

          // ── First Row: Contact + Qualification ──
          '<div class="profile-grid" style="grid-template-columns:1fr 1fr">'+
            // Contact & Company
            '<div class="card"><div class="card-title flex-between">Contact Info<span id="si-email" class="save-indicator"></span><span id="si-phone" class="save-indicator"></span><span id="si-website" class="save-indicator"></span></div>'+
              '<div class="detail-row"><span class="detail-label">Email</span><span class="detail-value"><input type="email" id="ie-email" value="'+escAttr(c.email)+'" class="inline-edit w-full" onblur="autoSave(\''+c.id+'\',\'email\',this.value)"></span></div>'+
              '<div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value"><input type="text" id="ie-phone" value="'+escAttr(c.phone)+'" class="inline-edit w-full" onblur="autoSave(\''+c.id+'\',\'phone\',this.value)"></span></div>'+
              (c.website!==undefined?'<div class="detail-row"><span class="detail-label">Website</span><span class="detail-value"><input type="url" id="ie-website" value="'+escAttr(c.website)+'" class="inline-edit w-full" onblur="autoSave(\''+c.id+'\',\'website\',this.value)"></span></div>':'')+
              '<div class="detail-row"><span class="detail-label">Company</span><span class="detail-value"><strong>'+esc(c.company_name||c.brand_name||'—')+'</strong></span></div>'+
              '<div class="detail-row"><span class="detail-label">Industry</span><span class="detail-value"><input type="text" id="ie-industry" value="'+escAttr(c.industry)+'" class="inline-edit w-full" onblur="autoSave(\''+c.id+'\',\'industry\',this.value)"><span id="si-industry" class="save-indicator"></span></span></div>'+
              '<div class="detail-row"><span class="detail-label">Service</span><span class="detail-value">'+esc(c.service||'—')+'</span></div>'+
              '<div class="detail-row"><span class="detail-label">Source</span><span class="detail-value">'+esc(c.lead_source||'manual')+'</span></div>'+
              '<div class="detail-row"><span class="detail-label">Decision Maker</span><span class="detail-value">'+(q.decisionMaker||'—')+'</span></div>'+
            '</div>'+

            // Qualification Answers
            '<div class="card"><div class="card-title flex-between">Qualification Answers <span class="text-xs text-muted">from webhook</span></div>'+
              '<div class="detail-row"><span class="detail-label">Monthly Revenue</span><span class="detail-value">'+(q.monthlyRevenue||q.revenue_range||'—')+'</span></div>'+
              '<div class="detail-row"><span class="detail-label">Investment Level</span><span class="detail-value">'+(q.investmentLevel||'—')+'</span></div>'+
              '<div class="detail-row"><span class="detail-label">Ready to Implement</span><span class="detail-value">'+(q.readyToImplement||'—')+'</span></div>'+
              '<div class="detail-row"><span class="detail-label">Current Lead Sources</span><span class="detail-value">'+(q.currentLeadSources||q.leadSources||q.lead_source||'—')+'</span></div>'+
              '<div class="detail-row"><span class="detail-label">Biggest Bottleneck</span><span class="detail-value">'+(q.biggestBottleneck||'—')+'</span></div>'+
              '<div class="detail-row"><span class="detail-label">90-Day Goal</span><span class="detail-value">'+(q.goal90Days||q.ninetyDayGoal||q.goal||'—')+'</span></div>'+
              '<div class="detail-row"><span class="detail-label">Business Description</span><span class="detail-value">'+(q.businessDescription||'—')+'</span></div>'+
              (q.plan_tier?'<div class="detail-row"><span class="detail-label">Plan</span><span class="detail-value"><span class="badge badge-green">'+esc(q.plan_tier)+'</span> '+(q.plan_name?esc(q.plan_name):'')+'</span></div>':'')+
              (q.preferred_slot?'<div class="detail-row"><span class="detail-label">Preferred Slot</span><span class="detail-value">'+(q.preferred_slot.date||'')+' '+(q.preferred_slot.startTime||'')+'</span></div>':'')+
              (c.booked_date&&c.booked_date!=='N/A'?'<div class="detail-row"><span class="detail-label">Booked Date</span><span class="detail-value">'+esc(c.booked_date)+' '+(c.booked_start?esc(c.booked_start):'')+'</span></div>':'')+
            '</div>'+
          '</div>'+

          // ── Second Row: Calls + Deals ──
          '<div class="profile-grid" style="grid-template-columns:1fr 1fr;margin-top:12px">'+
            // Calls
            '<div class="card"><div class="card-title flex-between">Call History <span class="text-xs text-muted">'+calls.length+' total</span></div><div id="profile-calls">'+
              (calls.length
                ? calls.map(function(cl){
                    return '<div class="detail-row" style="font-size:12px;padding:8px 0"><span class="detail-label">'+stageBadge(cl.status)+'</span><span class="detail-value" style="text-align:left;display:flex;flex-direction:column"><span style="font-weight:500">'+fmtDate(cl.scheduled_at)+'</span>'+(cl.outcome?'<span class="text-muted text-xs">'+esc(cl.outcome)+'</span>':'')+'</span></div>'
                  }).join('')
                : '<div class="text-sm text-muted" style="padding:8px 0">No calls recorded</div>')+
            '</div></div>'+

            // Deals
            '<div class="card"><div class="card-title flex-between">Deals <span class="text-xs text-muted">'+deals.length+' total</span></div>'+
              (deals.length
                ? deals.map(function(dl){
                    return '<div class="detail-row" style="font-size:12px;padding:8px 0"><span class="detail-label" style="flex:1">'+(dl.title?esc(dl.title):'Deal')+'</span><span class="detail-value" style="display:flex;gap:6px;align-items:center">'+stageBadge(dl.stage)+'<strong>'+fmtINR(dl.amount_monthly)+'</strong></span></div>'
                  }).join('')
                : '<div class="text-sm text-muted" style="padding:8px 0">No deals</div>')+
            '</div>'+
          '</div>'+

          // ── Third Row: Projects + Pipeline Timeline ──
          '<div class="profile-grid" style="grid-template-columns:1fr 1fr;margin-top:12px">'+
            // Projects
            '<div class="card"><div class="card-title flex-between">Projects <span class="text-xs text-muted">'+projects.length+' total</span></div>'+
              (projects.length
                ? projects.map(function(pr){
                    return '<div class="detail-row" style="font-size:12px;padding:8px 0"><span class="detail-label">'+esc(pr.name)+'</span><span class="detail-value">'+stageBadge(pr.status)+'</span></div>'
                  }).join('')
                : '<div class="text-sm text-muted" style="padding:8px 0">No projects</div>')+
            '</div>'+

            // Pipeline Timeline
            '<div class="card"><div class="card-title">Pipeline Timeline</div>'+renderPipelineTimeline(c)+'</div>'+
          '</div>'+

          // ── Activity Timeline (full width) ──
          '<div class="card" style="margin-top:12px"><div class="card-title flex-between">Activity Timeline <span class="text-xs text-muted">'+activity.length+' entries</span></div><div id="profile-activity">'+
            (activity.length
              ? activity.map(function(a){
                  return '<div class="detail-row" style="font-size:12px;padding:6px 0"><span class="detail-label" style="text-transform:capitalize">'+esc(a.action.replace(/_/g,' '))+'</span><span class="detail-value text-muted" style="font-size:11px">'+fmtDate(a.created_at)+'</span></div>'
                }).join('')
              : '<div class="text-sm text-muted" style="padding:8px 0">No activity yet</div>')+
          '</div></div>'+

          // ── Notes (full width, inline editable) ──
          '<div class="card" style="margin-top:12px"><div class="card-title flex-between">Notes <span id="si-notes" class="save-indicator"></span></div>'+
            '<textarea id="ie-notes" class="inline-textarea" onblur="autoSave(\''+c.id+'\',\'notes\',this.value)" placeholder="Add notes..." style="width:100%;min-height:60px;background:var(--bg-deep);border:1px solid var(--border);color:var(--text-secondary);font-size:13px;padding:10px 12px;border-radius:var(--radius-sm);font-family:inherit;resize:vertical">'+esc(c.notes||'')+'</textarea>'+
          '</div>'

        startPolling(id)
      }).catch(function(e){toast(e.message,'error');renderClients()})
    }

    function renderPipelineTimeline(c){
      var pd=c.pipeline_data||{}
      var currentIdx=PIPELINE_STAGES.indexOf(c.pipeline_stage)
      var html='<div class="pipeline-timeline">'
      PIPELINE_STAGES.forEach(function(stage,i){
        var cls=i<currentIdx?'past':i===currentIdx?'current':'future'
        var stageFields={
          prospect:['linkedin','lead_owner','website'],
          contacted:['outreach_channel','first_contact','last_contact','follow_up_count','outcome'],
          replied:['interested','wants_call','objections'],
          discovery_booked:['founder_role','years_in_business','revenue_range','team_size','biz_model','main_offer','biggest_goal','why_now','bottleneck','challenge','call_date','call_link'],
          discovery_completed:['f_goals','f_frustrations','f_bottlenecks','rev_model','growth_goals','meeting_notes','recording_link'],
          audit_proposed:['audit_price','audit_scope','proposal_sent_date','audit_status'],
          audit_purchased:['audit_folder','audit_start','audit_deadline'],
          audit_delivered:['bottlenecks_found','risks','opportunities','quick_wins','audit_pdf'],
          implementation_proposed:['services','project_scope','timeline','price','impl_status'],
          awaiting_confirmation:['preferred_slot_date','preferred_slot_start','preferred_slot_end'],
          confirmed:['confirmed_date','confirmed_start','confirmed_end','calendar_event'],
          client:['start_date','end_date','deliverables','wins','metrics'],
          followup:['reason_not_buying','followup_attempt','next_followup_date','followup_notes'],
          lost:['reason_lost','competitor','lost_notes']
        }
        var linkFields={linkedin:1,website:1,call_link:1,recording_link:1,audit_folder:1,audit_pdf:1,calendar_event:1}
        var priceFields={audit_price:1,price:1}
        var dateFields={first_contact:1,last_contact:1,call_date:1,proposal_sent_date:1,audit_start:1,audit_deadline:1,start_date:1,end_date:1,next_followup:1,preferred_slot_date:1,preferred_slot_start:1,preferred_slot_end:1,confirmed_date:1,confirmed_start:1,confirmed_end:1}
        var labels={
          linkedin:'LinkedIn',lead_owner:'Lead Owner',website:'Website',
          outreach_channel:'Channel',first_contact:'First Contact',last_contact:'Last Contact',
          follow_up_count:'Follow-ups',outcome:'Status',
          interested:'Interested?',wants_call:'Wants Call?',objections:'Objections',
          founder_role:'Founder Role',years_in_business:'Years',revenue_range:'Revenue',
          team_size:'Team',biz_model:'Model',main_offer:'Offer',
          biggest_goal:'Goal',why_now:'Why Now',bottleneck:'Bottleneck',
          challenge:'Challenge',call_date:'Call Date',call_link:'Call Link',
          f_goals:'Founder Goals',f_frustrations:'Frustrations',f_bottlenecks:'Bottlenecks',
          rev_model:'Revenue Model',growth_goals:'Growth Goals',
          meeting_notes:'Meeting Notes',recording_link:'Recording',
          audit_price:'Price',audit_scope:'Scope',proposal_sent_date:'Proposal Sent',
          audit_status:'Status',audit_folder:'Folder',audit_start:'Start',
          audit_deadline:'Deadline',bottlenecks_found:'Bottlenecks',risks:'Risks',
          opportunities:'Opportunities',quick_wins:'Quick Wins',audit_pdf:'PDF',
          services:'Services',project_scope:'Scope',timeline:'Timeline',
          price:'Price',impl_status:'Status',
          preferred_slot_date:'Preferred Date',preferred_slot_start:'Preferred Start',preferred_slot_end:'Preferred End',
          confirmed_date:'Confirmed Date',confirmed_start:'Confirmed Start',confirmed_end:'Confirmed End',calendar_event:'Calendar Event',
          start_date:'Start',end_date:'End',deliverables:'Deliverables',
          wins:'Wins',metrics:'Metrics',
          reason_not_buying:'Not Buying',followup_attempt:'Attempt',next_followup_date:'Next Follow-up',followup_notes:'Notes',
          reason_lost:'Reason Lost',competitor:'Competitor',lost_notes:'Notes'
        }
        var fields=stageFields[stage]||[]
        var dataHtml=''
        fields.forEach(function(f){
          var val=pd[f]
          if(val!=null&&val!==''){
            var display=val
            if(linkFields[f]){display='<a href="'+esc(val)+'" target="_blank">View</a>'}
            else if(priceFields[f]){display=fmtINR(Number(val))}
            else if(dateFields[f]){display=fmtDate(val)}
            dataHtml+='<div class="detail-row tl-field"><span class="detail-label">'+(labels[f]||f)+'</span><span class="detail-value">'+display+'</span></div>'
          }
        })
        html+='<div class="tl-stage '+(dataHtml?'has-data':'')+'">'+
          '<div class="tl-dot '+cls+'"></div>'+
          '<div class="tl-stage-header"><span class="tl-stage-name '+cls+'">'+stageLabel(stage)+'</span>'+
          (dataHtml?'':'<span class="text-xs text-muted">'+(i<currentIdx?'No data':i===currentIdx?'Current stage':'Pending')+'</span>')+
          '</div>'+
          (dataHtml?'<div class="tl-stage-data">'+dataHtml+'</div>':'')+
          '</div>'
      })
      html+='</div>'
      return html
    }

    // ─── SETTINGS ───
    function renderSettings(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><h2>Settings</h2></div><div class="card"><div class="card-title">Email Configuration</div><div id="settings-form"><div class="empty-state">Loading...</div></div></div>'
      api('GET','/settings').then(function(d){
        var s=d||{}
        document.getElementById('settings-form').innerHTML=
          '<div class="field"><label>Gmail User</label><input id="set-gmail_user" value="'+esc(s.gmail_user||'')+'" placeholder="email@gmail.com"></div>'+
          '<div class="field"><label>Gmail App Password</label><input id="set-gmail_app_password" type="password" value="'+esc(s.gmail_app_password||'')+'" placeholder="App password"></div>'+
          '<div class="field"><label>Gmail From Name</label><input id="set-gmail_from_name" value="'+esc(s.gmail_from_name||'')+'" placeholder="Your Name"></div>'+
          '<div class="field"><label>Admin Email</label><input id="set-admin_email" value="'+esc(s.admin_email||'')+'" placeholder="admin@company.com"></div>'+
          '<div class="field"><label>Resend API Key</label><input id="set-resend_api_key" type="password" value="'+esc(s.resend_api_key||'')+'" placeholder="re_..."></div>'+
          '<div style="margin-top:16px"><button class="btn btn-primary" onclick="saveSettings()">Save</button></div>'+
          '<div style="margin-top:12px;padding:12px;background:var(--surface);border-radius:var(--radius-sm);font-size:11px;color:var(--text-muted)">Alternatively, set <code>GMAIL_USER</code> and <code>GMAIL_APP_PASSWORD</code> in your .env file and restart the server.</div>'
      }).catch(function(e){document.getElementById('settings-form').innerHTML='<div class="empty-state">Error: '+e.message+'</div>'})
    }

    function saveSettings(){
      var body={}
      ;['gmail_user','gmail_app_password','gmail_from_name','admin_email','resend_api_key'].forEach(function(k){
        body[k]=document.getElementById('set-'+k).value.trim()
      })
      api('POST','/settings',body).then(function(){toast('Settings saved','success')}).catch(function(e){toast(e.message,'error')})
    }

    // ─── EXPENSES ───
    function renderExpenses(){
      var el=document.getElementById('main-content')
      el.innerHTML='<div class="page-header"><h2>Expenses</h2><button class="btn btn-accent btn-sm" onclick="openExpenseForm()">+ Add Expense</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr></thead><tbody id="expenses-tbody"><tr><td colspan="5" style="text-align:center;padding:32px;color:#555">Loading...</td></tr></tbody></table></div>'
      loadExpenses()
    }

    function loadExpenses(){
      var tbody=document.getElementById('expenses-tbody')
      if(!tbody)return
      tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:32px;color:#555">Loading...</td></tr>'
      api('GET','/expenses').then(function(data){
        data=data||[]
        tbody.innerHTML=data.map(function(e){
          return '<tr><td class="text-muted">'+fmtDate(e.date)+'</td><td><span class="badge badge-gray">'+esc(e.category)+'</span></td><td>'+esc(e.description||'—')+'</td><td class="text-red" style="font-weight:600">'+fmtINR(e.amount)+'</td><td><button class="btn btn-sm btn-secondary" onclick="deleteExpense(\''+e.id+'\')">Delete</button></td></tr>'
        }).join('')||'<tr><td colspan="5" class="empty-state">No expenses recorded</td></tr>'
      }).catch(function(e){tbody.innerHTML='<tr><td colspan="5" class="empty-state">Error: '+e.message+'</td></tr>'})
    }

    function openExpenseForm(){
      openModal('Add Expense',
        '<div class="field-row"><div class="field"><label>Amount ($)</label><input id="exp-amount" type="number" placeholder="100" step="0.01"></div><div class="field"><label>Category</label><select id="exp-category"><option value="software">Software</option><option value="marketing">Marketing</option><option value="salary">Salary</option><option value="infrastructure">Infrastructure</option><option value="travel">Travel</option><option value="office">Office</option><option value="contractor">Contractor</option><option value="other">Other</option></select></div></div>'+
        '<div class="field"><label>Description</label><input id="exp-desc" placeholder="What was this for?"></div>'+
        '<div class="field"><label>Date</label><input id="exp-date" type="date" value="'+new Date().toISOString().slice(0,10)+'"></div>',
        '<button class="btn btn-primary btn-sm" onclick="saveExpense()">Add</button><button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>')
    }

    function saveExpense(){
      var amount=parseFloat(document.getElementById('exp-amount').value)
      if(!amount||amount<=0){toast('Enter a valid amount','error');return}
      api('POST','/expenses',{
        amount:amount,
        category:document.getElementById('exp-category').value,
        description:document.getElementById('exp-desc').value.trim(),
        date:document.getElementById('exp-date').value
      }).then(function(){toast('Expense added','success');closeModal();loadExpenses()}).catch(function(e){toast(e.message,'error')})
    }

    function deleteExpense(id){
      if(!confirm('Delete this expense?'))return
      api('DELETE','/expenses/'+id).then(function(){toast('Deleted','success');loadExpenses()}).catch(function(e){toast(e.message,'error')})
    }

    // ─── Init ───
    route()
