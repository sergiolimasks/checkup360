// lead-detail.js — Split layout: sidebar (25%) + chat (75%)
const LeadDetail = {
  leadId: null, lead: null, metaTemplates: [],

  async render(container, leadId) {
    this.leadId = leadId;
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    try {
      const data = await Api.getLead(leadId);
      this.lead = data.lead;
      const l = this.lead;
      const created = formatDateTime(l.created_at);
      const updated = l.updated_at ? formatDateTime(l.updated_at) : '-';
      const initial = (l.name || 'L').charAt(0).toUpperCase();
      const statuses = ['registered','contacted','payment_pending','paid','consulting','completed','converted','lost'];
      const statusOpts = statuses.map(s => `<option value="${s}" ${s===l.status?'selected':''}>${s}</option>`).join('');
      const stages = ['novo','tentativa_contato','qualificado','negociando','pago','entregue','upsell','follow_up','perdido'];
      const stageOpts = stages.map(s => `<option value="${s}" ${s===l.pipeline_stage?'selected':''}>${s}</option>`).join('');
      const stageColors = {
        novo:'#22d3ee',tentativa_contato:'#818cf8',qualificado:'#a855f7',
        negociando:'#f59e0b',pago:'#22c55e',entregue:'#10b981',
        upsell:'#3b82f6',follow_up:'#f97316',perdido:'#ef4444'
      };
      const stageColor = stageColors[l.pipeline_stage] || '#64748b';

      container.innerHTML = `
        <div class="ld-layout">
          <div class="ld-sidebar">
            <button class="btn-back" onclick="App.navigate('leads')" style="width:100%;text-align:center">← Voltar para Leads</button>
            <div class="ld-profile">
              <div class="ld-avatar" style="background:linear-gradient(135deg, ${stageColor}, ${stageColor}88)">${initial}</div>
              <div class="ld-name">${esc(l.name)}</div>
              <div class="ld-phone">${esc(l.phone)}</div>
            </div>
            <div class="ld-selects">
              <div class="ld-select-group">
                <label>Status</label>
                <select id="status-change">${statusOpts}</select>
              </div>
              <div class="ld-select-group">
                <label>Pipeline</label>
                <select id="pipeline-change" style="color:${stageColor}">${stageOpts}</select>
              </div>
            </div>
            <div class="ld-info-list">
              <div class="ld-info-row"><span class="ld-info-key">CPF</span><span class="ld-info-val" style="font-family:monospace">${esc(l.cpf||'-')}</span></div>
              <div class="ld-info-row"><span class="ld-info-key">Origem</span><span class="ld-info-val">${esc(l.source||'-')}</span></div>
              <div class="ld-info-row"><span class="ld-info-key">Criado</span><span class="ld-info-val">${created}</span></div>
              <div class="ld-info-row"><span class="ld-info-key">Atualizado</span><span class="ld-info-val">${updated}</span></div>
              <div class="ld-info-row"><span class="ld-info-key">WA Opt-in</span><span class="ld-info-val">${l.wa_opted_in?'<span style="color:#22c55e">Sim</span>':'<span style="color:#64748b">Não</span>'}</span></div>
              <div class="ld-info-row"><span class="ld-info-key">Template</span><span class="ld-info-val">${l.wa_template_sent?'<span style="color:#22c55e">Enviado</span>':'<span style="color:#64748b">Não</span>'}</span></div>
              ${l.utm_source ? '<div class="ld-info-row"><span class="ld-info-key">UTM Source</span><span class="ld-info-val">' + esc(l.utm_source) + '</span></div>' : ''}
              ${l.utm_campaign ? '<div class="ld-info-row"><span class="ld-info-key">Campanha</span><span class="ld-info-val">' + esc(l.utm_campaign) + '</span></div>' : ''}
            </div>
            ${l.notes ? '<div class="ld-notes"><label>Notas</label><div class="ld-notes-text">' + esc(l.notes) + '</div></div>' : ''}
            <div class="ld-sidebar-footer">
              ${App.canDelete() ? '<button class="btn-delete" onclick="LeadDetail.deleteLead()" style="width:100%">Excluir Lead</button>' : ''}
            </div>
          </div>
          <div class="ld-chat-area">
            <div class="chat-container ld-chat-full">
              <div class="chat-header">
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="font-weight:600">Chat WhatsApp</span>
                  <span class="chat-status" id="chat-status">Conectando...</span>
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                  <div class="ld-wa-window" id="wa-window"></div>
                  <button class="btn-use" onclick="LeadDetail.showTemplateModal()" title="Enviar template (abre janela de 24h)">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Template
                  </button>
                </div>
              </div>
              <div class="chat-messages" id="chat-messages"><div class="chat-empty">Carregando...</div></div>
              <div class="chat-input-area">
                <input class="chat-input" id="chat-input" placeholder="Digite uma mensagem..." onkeydown="if(event.key==='Enter')LeadDetail.sendMsg()">
                <button class="btn-send" id="btn-send" onclick="LeadDetail.sendMsg()">Enviar</button>
              </div>
            </div>
          </div>
        </div>
        <!-- Modal Template -->
        <div id="template-modal" style="display:none">
          <div class="modal-overlay" onclick="LeadDetail.closeTemplateModal()"></div>
          <div class="modal-box">
            <h3 style="margin-bottom:16px">Enviar Template WhatsApp</h3>
            <div id="template-modal-content"><div class="loading"><div class="spinner"></div></div></div>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">
              <button class="btn-back" onclick="LeadDetail.closeTemplateModal()">Cancelar</button>
              <button class="btn-send" id="btn-send-template" onclick="LeadDetail.sendTemplate()">Enviar Template</button>
            </div>
          </div>
        </div>`;

      // Event handlers
      document.getElementById('status-change').onchange = async (e) => {
        try { await Api.updateLead(leadId, { status: e.target.value }); } catch(ex) { alert('Erro: ' + ex.message); }
      };
      document.getElementById('pipeline-change').onchange = async (e) => {
        try {
          await Api.updateLead(leadId, { pipeline_stage: e.target.value });
          var color = stageColors[e.target.value] || '#64748b';
          e.target.style.color = color;
        } catch(ex) { alert('Erro: ' + ex.message); }
      };
      this.loadMessages();
      App.chatInterval = setInterval(() => this.loadMessages(), 3000);
    } catch (e) {
      container.innerHTML = '<div class="loading" style="color:#f87171">Erro: ' + esc(e.message) + '</div>';
    }
  },

  async loadMessages() {
    const box = document.getElementById('chat-messages');
    const statusEl = document.getElementById('chat-status');
    if (!box) return;
    try {
      const data = await Api.getMessages(this.leadId);
      statusEl.textContent = 'Atualizado'; statusEl.className = 'chat-status online';
      const msgs = data.messages || [];
      if (!msgs.length) { box.innerHTML = '<div class="chat-empty">Nenhuma mensagem. Envie um template para iniciar!</div>'; return; }
      const wasAtBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 50;
      // Calculate WA window
      this.updateWAWindow(msgs);
      box.innerHTML = msgs.map(m => {
        const time = m.wa_timestamp ? new Date(m.wa_timestamp).toLocaleString('pt-BR') : new Date(m.created_at).toLocaleString('pt-BR');
        const st = m.wa_status || 'sent';
        const errInfo = m.meta_error_code ? `Erro ${m.meta_error_code}: ${esc(m.meta_error_message||'desconhecido')}` : '';
        const statusIcon = this.getStatusIcon(st, errInfo);

        // System events — centered notification
        if (m.direction === 'system' || m.message_type === 'system_event') {
          return `<div class="chat-notification"><span class="chat-notif-icon">📋</span> ${esc(m.content)}<div class="time">${time}</div></div>`;
        }

        const dir = m.direction === 'inbound' ? 'inbound' : 'outbound';

        // Template messages
        if (m.message_type === 'template') {
          return `<div class="chat-bubble ${dir} chat-bubble-template"><div class="chat-bubble-tag">📩 Template</div><div>${esc(m.content)}</div><div class="time">${time} ${statusIcon}</div></div>`;
        }

        // Interactive messages (flows, payment links)
        if (m.message_type === 'interactive') {
          var icon = m.content && m.content.indexOf('pagamento') >= 0 ? '💳' : m.content && m.content.indexOf('Flow') >= 0 ? '📋' : '🔗';
          return `<div class="chat-bubble ${dir} chat-bubble-interactive"><div class="chat-bubble-tag">${icon} Interativo</div><div>${esc(m.content)}</div><div class="time">${time} ${statusIcon}</div></div>`;
        }

        // Audio messages
        if (m.message_type === 'audio') {
          return `<div class="chat-bubble ${dir} chat-bubble-audio"><div class="chat-bubble-tag">🎤 Áudio</div><div>${esc(m.content)}</div><div class="time">${time} ${statusIcon}</div></div>`;
        }

        // Normal text
        return `<div class="chat-bubble ${dir}"><div>${esc(m.content)}</div><div class="time">${time} ${statusIcon}</div></div>`;
      }).join('');
      if (wasAtBottom) box.scrollTop = box.scrollHeight;
    } catch (e) { if (statusEl) { statusEl.textContent = 'Erro'; statusEl.className = 'chat-status'; } }
  },

  updateWAWindow(msgs) {
    var el = document.getElementById('wa-window');
    if (!el) return;
    // Find last inbound message time
    var lastInbound = null;
    for (var i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].direction === 'inbound') {
        lastInbound = new Date(msgs[i].wa_timestamp || msgs[i].created_at);
        break;
      }
    }
    if (!lastInbound) { el.innerHTML = '<span class="wa-window-closed">Sem janela WA</span>'; return; }
    var now = new Date();
    var diff = 24 * 60 * 60 * 1000 - (now - lastInbound);
    if (diff <= 0) { el.innerHTML = '<span class="wa-window-closed">Janela expirada</span>'; return; }
    var hours = Math.floor(diff / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    var pct = Math.max(0, Math.min(100, (diff / (24 * 60 * 60 * 1000)) * 100));
    var color = pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444';
    el.innerHTML = '<div class="wa-window-bar"><div class="wa-window-fill" style="width:' + pct.toFixed(0) + '%;background:' + color + '"></div></div><span class="wa-window-time" style="color:' + color + '">' + hours + 'h ' + mins + 'm</span>';
  },

  getStatusIcon(status, errInfo) {
    const icons = { sent:'✓', delivered:'✓✓', read:'<span style="color:#22d3ee">✓✓</span>', failed:'<span style="color:#f87171">✗</span>', error:'<span style="color:#f87171">⚠</span>' };
    const icon = icons[status] || icons.sent;
    const title = errInfo ? errInfo : 'Status: ' + status;
    return `<span class="msg-status" title="${esc(title)}" style="cursor:help;margin-left:4px">${icon}</span>`;
  },

  async sendMsg() {
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('btn-send');
    const text = input.value.trim();
    if (!text) return;
    btn.disabled = true; input.disabled = true;
    try {
      await Api.sendMessage(this.leadId, text);
      input.value = '';
      await this.loadMessages();
      const box = document.getElementById('chat-messages');
      if (box) box.scrollTop = box.scrollHeight;
    } catch (e) { alert('Erro ao enviar: ' + e.message); }
    btn.disabled = false; input.disabled = false; input.focus();
  },

  async showTemplateModal() {
    const modal = document.getElementById('template-modal');
    modal.style.display = 'flex';
    const content = document.getElementById('template-modal-content');
    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    try {
      this.metaTemplates = await Api.getMetaTemplates();
      if (!this.metaTemplates.length) { content.innerHTML = '<p class="chat-empty">Nenhum template encontrado na conta Meta.</p>'; return; }
      const tplOptions = this.metaTemplates.map((t, i) => `<option value="${i}">${esc(t.name)} (${esc(t.language)}) - ${esc(t.status)}</option>`).join('');
      content.innerHTML = `
        <div class="form-group"><label>Selecione o Template</label>
          <select class="filter-select" id="tpl-select" style="width:100%" onchange="LeadDetail.onTemplateSelect()">${tplOptions}</select>
        </div>
        <div id="tpl-preview" style="background:rgba(255,255,255,0.03);border-radius:8px;padding:16px;margin:12px 0"></div>
        <div id="tpl-variables"></div>`;
      this.onTemplateSelect();
    } catch (e) { content.innerHTML = '<p style="color:#f87171">Erro ao carregar templates: ' + esc(e.message) + '</p>'; }
  },

  onTemplateSelect() {
    const idx = parseInt(document.getElementById('tpl-select').value);
    const tpl = this.metaTemplates[idx];
    if (!tpl) return;
    let preview = '';
    const vars = [];
    (tpl.components || []).forEach(c => {
      if (c.type === 'HEADER') preview += '<div style="font-weight:600;color:#22d3ee;margin-bottom:4px">' + esc(c.text) + '</div>';
      if (c.type === 'BODY') {
        preview += '<div style="color:#f1f5f9">' + esc(c.text) + '</div>';
        const matches = c.text.match(/\{\{(\d+)\}\}/g);
        if (matches) matches.forEach(m => { if (!vars.includes(m)) vars.push(m); });
      }
      if (c.type === 'FOOTER') preview += '<div style="color:#64748b;font-size:12px;margin-top:4px;font-style:italic">' + esc(c.text) + '</div>';
    });
    document.getElementById('tpl-preview').innerHTML = preview || '<span class="chat-empty">Sem preview</span>';
    if (vars.length) {
      document.getElementById('tpl-variables').innerHTML = '<div style="margin-top:12px"><label style="color:#94a3b8;font-size:13px;display:block;margin-bottom:8px">Preencha as variáveis:</label>' +
        vars.map((v, i) => `<div class="form-group"><label>Variável ${v}</label><input class="search-input tpl-var-input" data-var="${v}" placeholder="Ex: ${esc(this.lead?.name || 'valor')}" value="${i===0 && this.lead ? esc(this.lead.name) : ''}"></div>`).join('') + '</div>';
    } else { document.getElementById('tpl-variables').innerHTML = ''; }
  },

  closeTemplateModal() { document.getElementById('template-modal').style.display = 'none'; },

  async sendTemplate() {
    const idx = parseInt(document.getElementById('tpl-select').value);
    const tpl = this.metaTemplates[idx];
    if (!tpl) return;
    const btn = document.getElementById('btn-send-template');
    btn.disabled = true; btn.textContent = 'Enviando...';
    const varInputs = document.querySelectorAll('.tpl-var-input');
    const variables = [];
    varInputs.forEach(inp => { variables.push(inp.value || ''); });
    try {
      await Api.sendWhatsAppTemplate(this.lead.phone, tpl.name, tpl.language, variables, this.lead.id);
      this.closeTemplateModal();
      await this.loadMessages();
      const box = document.getElementById('chat-messages');
      if (box) box.scrollTop = box.scrollHeight;
    } catch (e) { alert('Erro ao enviar template: ' + e.message); }
    btn.disabled = false; btn.textContent = 'Enviar Template';
  },

  async deleteLead() {
    if (!confirm('Excluir o lead "' + this.lead.name + '" e todas as suas mensagens? Essa ação não pode ser desfeita.')) return;
    try { await Api.deleteLead(this.lead.id); App.navigate('leads'); } catch (e) { alert('Erro ao excluir: ' + e.message); }
  }
};
