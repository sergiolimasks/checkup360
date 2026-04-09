// crm.js - Enhanced CRM Pipeline Kanban with insights
const CRM = {
  stages: [
    { id:'novo', label:'Novo', color:'#22d3ee' },
    { id:'tentativa_contato', label:'Tent. Contato', color:'#818cf8' },
    { id:'qualificado', label:'Qualificado', color:'#a855f7' },
    { id:'negociando', label:'Negociando', color:'#f59e0b' },
    { id:'pago', label:'Pago', color:'#22c55e' },
    { id:'entregue', label:'Entregue', color:'#10b981' },
    { id:'upsell', label:'Upsell', color:'#3b82f6' },
    { id:'follow_up', label:'Follow-up', color:'#f97316' },
    { id:'perdido', label:'Perdido', color:'#ef4444' }
  ],
  leads: [],
  insights: null,
  waFunnel: null,
  bottlenecks: null,
  draggedCard: null,
  draggedLeadId: null,

  async render(container) {
    container.innerHTML = `
      <div id="crm-insights" class="crm-insights"><div class="loading"><div class="spinner"></div></div></div>
      <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
        <p style="color:#94a3b8;font-size:13px" id="crm-lead-count">Carregando...</p>
        <button class="btn-back" onclick="CRM.render(document.getElementById('content-area'))">↻ Atualizar</button>
      </div>
      <div class="crm-board" id="crm-board"><div class="loading"><div class="spinner"></div></div></div>`;
    this.loadAll();
  },

  async loadAll() {
    // Load leads and insights in parallel
    var [leadsRes, funnelRes, waFunnelRes, bottlenecksRes, waMetricsRes] = await Promise.allSettled([
      Api.getAllLeads(200),
      Api.getAnalyticsFunnel(30),
      Api.getWAFunnel ? Api.getWAFunnel(30) : Promise.reject('not available'),
      Api.getCRMBottlenecks ? Api.getCRMBottlenecks(30) : Promise.reject('not available'),
      Api.getWhatsAppMetrics ? Api.getWhatsAppMetrics(30) : Promise.reject('not available')
    ]);
    this.leads = leadsRes.status === 'fulfilled' ? (leadsRes.value.leads || []) : [];
    this.insights = funnelRes.status === 'fulfilled' ? funnelRes.value : null;
    this.waFunnel = waFunnelRes.status === 'fulfilled' ? waFunnelRes.value : null;
    this.bottlenecks = bottlenecksRes.status === 'fulfilled' ? bottlenecksRes.value : null;
    var waMetrics = waMetricsRes.status === 'fulfilled' ? waMetricsRes.value : null;
    this.renderInsights(waMetrics);
    this.renderBoard();
  },

  renderInsights(waMetrics) {
    var el = document.getElementById('crm-insights');
    if (!el) return;
    // Build insights bar
    var html = '<div class="crm-insights-grid">';

    // Mini KPIs
    var firstResp = waMetrics && waMetrics.avg_first_response_minutes != null
      ? (waMetrics.avg_first_response_minutes < 60 ? Math.round(waMetrics.avg_first_response_minutes) + 'min' : (waMetrics.avg_first_response_minutes / 60).toFixed(1) + 'h')
      : '—';
    var msgsToConv = waMetrics && waMetrics.avg_messages_to_conversion != null
      ? Math.round(waMetrics.avg_messages_to_conversion) + ' msgs'
      : '—';
    var activeWindows = waMetrics ? (waMetrics.active_windows || 0) : '—';
    var stuckCount = 0;
    var worstStage = '—';
    if (this.bottlenecks && this.bottlenecks.stages) {
      this.bottlenecks.stages.forEach(function(s) {
        stuckCount += (s.stuck_count || 0);
      });
      var worst = this.bottlenecks.stages.filter(function(s) { return s.stage !== 'perdido'; }).sort(function(a, b) { return (b.drop_rate || 0) - (a.drop_rate || 0); })[0];
      if (worst) worstStage = worst.label || worst.stage;
    }

    html += '<div class="crm-kpi-strip">';
    html += this._miniKpi('⏱️', 'Tempo 1ª Resp.', firstResp, '');
    html += this._miniKpi('💬', 'Msgs p/ Venda', msgsToConv, '');
    html += this._miniKpi('🟢', 'Janelas Ativas', activeWindows, "CRM.filterBy('wa_active')");
    html += this._miniKpi('⚠️', 'Leads Parados', stuckCount, "CRM.filterBy('stuck')");
    html += this._miniKpi('🔴', 'Maior Drop-off', worstStage, '');
    html += '</div>';

    html += '</div>';
    el.innerHTML = html;
  },

  activeFilter: null,

  _miniKpi(icon, label, value, onclick) {
    var clickAttr = onclick ? ' onclick="' + onclick + '" style="cursor:pointer"' : '';
    var activeClass = onclick && this.activeFilter === onclick.replace("CRM.filterBy('","").replace("')","") ? ' crm-kpi-active' : '';
    return '<div class="crm-kpi-mini' + activeClass + '"' + clickAttr + '><span class="crm-kpi-mini-icon">' + icon + '</span><div><span class="crm-kpi-mini-label">' + label + '</span><span class="crm-kpi-mini-value">' + value + '</span></div></div>';
  },

  filterBy(type) {
    if (this.activeFilter === type) {
      this.activeFilter = null; // toggle off
    } else {
      this.activeFilter = type;
    }
    this.renderBoard();
    // Update KPI active state visually
    document.querySelectorAll('.crm-kpi-mini').forEach(function(el) { el.classList.remove('crm-kpi-active'); });
    if (this.activeFilter) {
      var kpis = document.querySelectorAll('.crm-kpi-mini[onclick]');
      kpis.forEach(function(el) {
        if (el.getAttribute('onclick').indexOf(type) >= 0) el.classList.add('crm-kpi-active');
      });
    }
  },

  renderBoard() {
    var boardEl = document.getElementById('crm-board');
    var countEl = document.getElementById('crm-lead-count');
    if (!boardEl) return;
    var now = new Date();
    // Apply filter
    var filteredLeads = this.leads;
    var filterLabel = '';
    if (this.activeFilter === 'wa_active') {
      filteredLeads = this.leads.filter(function(l) {
        if (!l.wa_last_message_at) return false;
        return (now - new Date(l.wa_last_message_at)) < 24 * 60 * 60 * 1000;
      });
      filterLabel = ' (janelas ativas)';
    } else if (this.activeFilter === 'stuck') {
      filteredLeads = this.leads.filter(function(l) {
        var updated = l.updated_at ? new Date(l.updated_at) : new Date(l.created_at);
        return (now - updated) / 3600000 > 48 && l.pipeline_stage !== 'entregue' && l.pipeline_stage !== 'perdido';
      });
      filterLabel = ' (parados >48h)';
    }
    countEl.textContent = filteredLeads.length + ' leads' + filterLabel;
    var self = this;
    var bottleneckMap = {};
    if (this.bottlenecks && this.bottlenecks.stages) {
      this.bottlenecks.stages.forEach(function(s) { bottleneckMap[s.stage] = s; });
    }

    var colsHtml = this.stages.map(function(stage) {
      var stageLeads = filteredLeads.filter(function(l) { return (l.pipeline_stage || 'novo') === stage.id; });
      var cardsHtml = stageLeads.map(function(l) { return self.renderCard(l, now); }).join('');
      var bn = bottleneckMap[stage.id];
      var healthDot = '';
      var stuckBadge = '';
      var avgTime = '';
      if (bn) {
        var hcolor = bn.health === 'green' ? '#22c55e' : bn.health === 'yellow' ? '#f59e0b' : '#ef4444';
        healthDot = '<span class="crm-health-dot" style="background:' + hcolor + '" title="' + (bn.stuck_count || 0) + ' parados"></span>';
        if (bn.stuck_count > 0) stuckBadge = '<span class="crm-stuck-badge">' + bn.stuck_count + ' parados</span>';
        if (bn.avg_hours) avgTime = '<span class="crm-avg-time">~' + (bn.avg_hours < 1 ? Math.round(bn.avg_hours * 60) + 'min' : bn.avg_hours.toFixed(1) + 'h') + '</span>';
      }
      return '<div class="crm-column">' +
        '<div class="crm-column-header" style="border-top:3px solid ' + stage.color + '">' +
          '<div class="crm-col-title">' + healthDot + '<span>' + stage.label + '</span></div>' +
          '<div class="crm-col-meta"><span class="crm-count">' + stageLeads.length + '</span>' + avgTime + stuckBadge + '</div>' +
        '</div>' +
        '<div class="crm-cards" id="crm-col-' + stage.id + '" data-stage="' + stage.id + '" ondragover="CRM.onDragOver(event)" ondragleave="CRM.onDragLeave(event)" ondrop="CRM.onDrop(event, \'' + stage.id + '\')">' +
          (cardsHtml || '<div class="crm-empty">Nenhum lead</div>') +
        '</div>' +
      '</div>';
    }).join('');
    boardEl.innerHTML = colsHtml;
  },

  renderCard(lead, now) {
    var date = new Date(lead.created_at).toLocaleDateString('pt-BR');
    var lastMsg = lead.wa_last_message_at ? new Date(lead.wa_last_message_at) : null;
    var lastMsgStr = lastMsg ? lastMsg.toLocaleDateString('pt-BR') : null;
    // Urgency: time in current stage
    var updatedAt = lead.updated_at ? new Date(lead.updated_at) : new Date(lead.created_at);
    var hoursInStage = (now - updatedAt) / 3600000;
    var urgencyClass = hoursInStage > 48 ? 'crm-card-urgent' : hoursInStage > 24 ? 'crm-card-warning' : 'crm-card-ok';
    // WA window status
    var waStatus = '';
    if (lastMsg) {
      var windowMs = 24 * 60 * 60 * 1000 - (now - lastMsg);
      if (windowMs > 0) waStatus = '<span class="crm-wa-dot active" title="Janela WA ativa"></span>';
      else waStatus = '<span class="crm-wa-dot expired" title="Janela WA expirada"></span>';
    }

    return '<div class="crm-card ' + urgencyClass + '" draggable="true" data-lead-id="' + lead.id + '" ondragstart="CRM.onDragStart(event, \'' + lead.id + '\')" ondragend="CRM.onDragEnd(event)" onclick="if(!CRM._justDropped) App.navigate(\'lead-detail\',\'' + lead.id + '\')">' +
      '<div class="crm-card-top">' +
        '<div class="crm-card-name">' + esc(lead.name) + '</div>' +
        waStatus +
      '</div>' +
      '<div class="crm-card-phone">' + esc(lead.phone) + '</div>' +
      '<div class="crm-card-meta">' +
        '<span>' + esc(lead.source) + '</span>' +
        '<span>' + date + '</span>' +
      '</div>' +
      (lastMsgStr ? '<div class="crm-card-meta"><span style="color:#22c55e">💬 ' + lastMsgStr + '</span></div>' : '') +
      '<div class="crm-card-actions">' +
        '<select class="crm-stage-select" onclick="event.stopPropagation()" onchange="CRM.moveCard(\'' + lead.id + '\',this.value)">' +
          CRM.stages.map(function(s) { return '<option value="' + s.id + '" ' + (s.id === (lead.pipeline_stage || 'novo') ? 'selected' : '') + '>' + s.label + '</option>'; }).join('') +
        '</select>' +
      '</div>' +
    '</div>';
  },

  // Drag & Drop
  onDragStart(e, leadId) {
    this.draggedLeadId = leadId;
    this.draggedCard = e.target;
    e.target.classList.add('crm-card-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);
  },
  onDragEnd(e) {
    e.target.classList.remove('crm-card-dragging');
    this.draggedCard = null;
    this.draggedLeadId = null;
    document.querySelectorAll('.crm-cards').forEach(function(col) { col.classList.remove('crm-column-drop-target'); });
  },
  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('crm-column-drop-target');
  },
  onDragLeave(e) { e.currentTarget.classList.remove('crm-column-drop-target'); },
  onDrop(e, newStage) {
    e.preventDefault();
    e.currentTarget.classList.remove('crm-column-drop-target');
    var leadId = e.dataTransfer.getData('text/plain');
    if (!leadId) return;
    this._justDropped = true;
    setTimeout(function() { CRM._justDropped = false; }, 200);
    this.moveCard(leadId, newStage);
  },
  async moveCard(leadId, newStage) {
    try {
      await Api.updateLead(leadId, { pipeline_stage: newStage });
      this.render(document.getElementById('content-area'));
    } catch (e) { alert('Erro ao mover lead: ' + e.message); }
  }
};
