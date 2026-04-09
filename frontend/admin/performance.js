// performance.js - Performance, Landing Pages & A/B Testing
const Performance = {
  period: 30,
  activeTab: 'pages',

  // Map source IDs to page info
  PAGE_MAP: {
    'lp-principal': { name: 'Principal', url: 'https://checkup360.online/' },
    'lp-cartao': { name: 'Cartao de Credito', url: 'https://checkup360.online/cartao/' },
    'lp-casa-carro': { name: 'Casa & Carro', url: 'https://checkup360.online/casa-carro/' },
    'lp-financiamento': { name: 'Financiamento', url: 'https://checkup360.online/financiamento/' },
    'lp-consultasob': { name: 'Consulta SOB', url: 'https://checkup360.online/consultasob/' },
    'lp-consultacob': { name: 'Consulta COB', url: 'https://checkup360.online/consultacob/' },
    'whatsapp': { name: 'WhatsApp Direto', url: null },
    'website': { name: 'Site (outros)', url: 'https://checkup360.online/' },
  },

  async render(container, subPage) {
    this.activeTab = subPage || 'pages';
    container.innerHTML = `
      <div class="perf-controls">
        <div class="perf-tabs">
          <button class="perf-tab ${this.activeTab==='pages'?'active':''}" onclick="Performance.switchTab('pages')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            Landing Pages
          </button>
          <button class="perf-tab ${this.activeTab==='sources'?'active':''}" onclick="Performance.switchTab('sources')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Fontes & Campanhas
          </button>
          <button class="perf-tab ${this.activeTab==='ab'?'active':''}" onclick="Performance.switchTab('ab')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
            Testes A/B
          </button>
        </div>
        <div class="period-selector">
          <button class="period-btn ${this.period===7?'active':''}" onclick="Performance.setPeriod(7)">7d</button>
          <button class="period-btn ${this.period===15?'active':''}" onclick="Performance.setPeriod(15)">15d</button>
          <button class="period-btn ${this.period===30?'active':''}" onclick="Performance.setPeriod(30)">30d</button>
          <button class="period-btn ${this.period===90?'active':''}" onclick="Performance.setPeriod(90)">90d</button>
        </div>
      </div>
      <div id="perf-content"><div class="loading"><div class="spinner"></div></div></div>`;
    if (this.activeTab === 'pages') this.loadPages();
    else if (this.activeTab === 'sources') this.loadSources();
    else this.loadABTests();
  },

  switchTab(tab) {
    this.activeTab = tab;
    App.navigate('performance', tab);
  },

  setPeriod(p) {
    this.period = p;
    this.render(document.getElementById('content-area'), this.activeTab);
  },

  // ─── LANDING PAGES ─────────────────────
  async loadPages() {
    var el = document.getElementById('perf-content');
    try {
      var data = await Api.getPageStats(this.period);
      var pages = (data && data.pages) ? data.pages : [];
      if (!pages.length) {
        el.innerHTML = '<div class="dash-card"><div class="dash-card-body"><p class="loading">Nenhum dado de landing pages para o periodo. Os dados aparecem quando leads se cadastram.</p></div></div>';
        return;
      }

      // Calculate totals
      var totals = pages.reduce(function(acc, p) {
        acc.leads += p.leads; acc.qualified += p.qualified; acc.paid += p.paid; acc.revenue += p.revenue;
        return acc;
      }, { leads: 0, qualified: 0, paid: 0, revenue: 0 });
      totals.conversion_rate = totals.leads > 0 ? (totals.paid / totals.leads * 100) : 0;

      el.innerHTML = `
        <div class="dash-grid-3" style="margin-bottom:20px">
          <div class="kpi-card"><div class="kpi-content"><span class="kpi-label">Total Leads</span><span class="kpi-value">${totals.leads}</span><span class="kpi-sub">${pages.length} pagina(s) ativa(s)</span></div></div>
          <div class="kpi-card"><div class="kpi-content"><span class="kpi-label">Vendas</span><span class="kpi-value">${totals.paid}</span><span class="kpi-sub">R$ ${Dashboard.fmt(totals.revenue)}</span></div></div>
          <div class="kpi-card"><div class="kpi-content"><span class="kpi-label">Conversao Geral</span><span class="kpi-value">${totals.conversion_rate.toFixed(1)}%</span><span class="kpi-sub">lead → venda</span></div></div>
        </div>
        <div class="dash-card">
          <div class="dash-card-header"><h3>Performance por Landing Page</h3></div>
          <div class="dash-card-body dash-card-scroll">
            <table class="perf-table">
              <thead>
                <tr>
                  <th>Pagina</th>
                  <th>URL</th>
                  <th class="num">Leads</th>
                  <th class="num">Qualif.</th>
                  <th class="num">Vendas</th>
                  <th class="num">Receita</th>
                  <th class="num">Conv. %</th>
                  <th class="num">Qualif. %</th>
                </tr>
              </thead>
              <tbody>${pages.map(function(p) {
                var info = Performance.PAGE_MAP[p.source] || { name: p.source, url: null };
                var urlDisplay = info.url
                  ? '<a href="' + esc(info.url) + '" target="_blank" class="page-url-link" title="' + esc(info.url) + '">' + esc(info.url.replace('https://checkup360.online', '').replace(/\/$/, '') || '/') + '</a>'
                  : '<span style="color:#64748b">—</span>';
                var pctOfTotal = totals.leads > 0 ? (p.leads / totals.leads * 100).toFixed(0) : 0;
                return '<tr>' +
                  '<td><div class="perf-source-cell"><strong>' + esc(info.name) + '</strong><span class="perf-medium">' + pctOfTotal + '% do total</span></div></td>' +
                  '<td>' + urlDisplay + '</td>' +
                  '<td class="num">' + p.leads + '</td>' +
                  '<td class="num">' + p.qualified + '</td>' +
                  '<td class="num"><strong>' + p.paid + '</strong></td>' +
                  '<td class="num">R$ ' + Dashboard.fmt(p.revenue) + '</td>' +
                  '<td class="num"><span class="conv-badge ' + Performance.convClass(p.conversion_rate) + '">' + p.conversion_rate.toFixed(1) + '%</span></td>' +
                  '<td class="num"><span class="conv-badge ' + Performance.convClass(p.qualified_rate) + '">' + p.qualified_rate.toFixed(1) + '%</span></td>' +
                '</tr>';
              }).join('')}</tbody>
            </table>
          </div>
        </div>
        <div id="pages-insights"></div>`;

      // Render insights if multiple pages
      if (pages.length >= 2) {
        var bestConv = pages.reduce(function(a, b) { return (b.conversion_rate > a.conversion_rate) ? b : a; });
        var bestLeads = pages.reduce(function(a, b) { return (b.leads > a.leads) ? b : a; });
        var bestConvInfo = Performance.PAGE_MAP[bestConv.source] || { name: bestConv.source };
        var bestLeadsInfo = Performance.PAGE_MAP[bestLeads.source] || { name: bestLeads.source };
        document.getElementById('pages-insights').innerHTML = '<div class="dash-grid-3" style="margin-top:16px">' +
          '<div class="insight-card insight-green"><div class="insight-icon">🏆</div><div class="insight-text"><strong>Melhor Conversao</strong><br>' + esc(bestConvInfo.name) + '<br><span class="insight-value">' + bestConv.conversion_rate.toFixed(1) + '% conv. | ' + bestConv.paid + ' vendas</span></div></div>' +
          '<div class="insight-card insight-blue"><div class="insight-icon">📊</div><div class="insight-text"><strong>Mais Leads</strong><br>' + esc(bestLeadsInfo.name) + '<br><span class="insight-value">' + bestLeads.leads + ' leads | ' + bestLeads.qualified + ' qualificados</span></div></div>' +
          '<div class="insight-card insight-purple"><div class="insight-icon">💡</div><div class="insight-text"><strong>Dica</strong><br>Use UTM params nas URLs para rastrear campanhas por pagina.<br><span class="insight-value">?utm_source=facebook&utm_campaign=...</span></div></div>' +
        '</div>';
      }
    } catch (e) {
      el.innerHTML = '<div class="dash-card"><div class="dash-card-body"><p class="loading" style="color:#f87171">Erro ao carregar landing pages: ' + esc(e.message) + '</p></div></div>';
    }
  },

  // ─── SOURCES & CAMPAIGNS ───────────────
  async loadSources() {
    var el = document.getElementById('perf-content');
    try {
      var data = await Api.getAnalyticsPerformance(this.period);
      var rows = (data && data.rows) ? data.rows : (data && data.variants) ? data.variants : [];
      if (!rows.length) {
        el.innerHTML = '<div class="dash-card"><div class="dash-card-body"><p class="loading">Nenhum dado de performance encontrado para o periodo. Os dados aparecem quando leads chegam com parametros UTM.</p></div></div>';
        return;
      }
      el.innerHTML = `
        <div class="perf-sort-row">
          <span class="perf-sort-label">Ordenar por:</span>
          <select id="perf-sort" class="filter-select" onchange="Performance.sortTable()">
            <option value="leads">Leads</option>
            <option value="qualified">Qualificados</option>
            <option value="paid">Vendas</option>
            <option value="revenue">Receita</option>
            <option value="conversion_rate">Taxa Conversao</option>
            <option value="qualified_rate">Taxa Qualificacao</option>
          </select>
        </div>
        <div class="dash-card">
          <div class="dash-card-body dash-card-scroll">
            <table class="perf-table" id="perf-table">
              <thead>
                <tr>
                  <th>Fonte / Campanha</th>
                  <th>Id do Anuncio</th>
                  <th class="num">Leads</th>
                  <th class="num">Qualif.</th>
                  <th class="num">Vendas</th>
                  <th class="num">Receita</th>
                  <th class="num">Conv. %</th>
                  <th class="num">Qualif. %</th>
                </tr>
              </thead>
              <tbody id="perf-tbody"></tbody>
            </table>
          </div>
        </div>
        <div class="perf-insights" id="perf-insights"></div>`;
      this._sourceRows = rows;
      this.sortTable();
      this.renderInsights(rows);
    } catch (e) {
      el.innerHTML = '<div class="dash-card"><div class="dash-card-body"><p class="loading" style="color:#f87171">Erro ao carregar performance: ' + esc(e.message) + '</p></div></div>';
    }
  },

  _sourceRows: [],

  sortTable() {
    var sortBy = document.getElementById('perf-sort') ? document.getElementById('perf-sort').value : 'leads';
    var rows = this._sourceRows.slice().sort(function(a, b) { return (parseFloat(b[sortBy]) || 0) - (parseFloat(a[sortBy]) || 0); });
    var tbody = document.getElementById('perf-tbody');
    if (!tbody) return;
    tbody.innerHTML = rows.map(function(r) {
      var sourceLabel = esc(r.source || 'direto');
      var campaignLabel = r.campaign && r.campaign !== '-' && r.campaign !== '(none)' ? '<div class="perf-campaign">' + esc(r.campaign) + '</div>' : '';
      var mediumBadge = r.medium && r.medium !== '-' && r.medium !== '(none)' ? '<span class="perf-medium">' + esc(r.medium) + '</span>' : '';
      return '<tr>' +
        '<td><div class="perf-source-cell">' + sourceLabel + ' ' + mediumBadge + campaignLabel + '</div></td>' +
        '<td>' + esc(r.variant_label || '-') + '</td>' +
        '<td class="num">' + (r.leads || 0) + '</td>' +
        '<td class="num">' + (r.qualified || 0) + '</td>' +
        '<td class="num"><strong>' + (r.paid || 0) + '</strong></td>' +
        '<td class="num">R$ ' + Dashboard.fmt(r.revenue || 0) + '</td>' +
        '<td class="num"><span class="conv-badge ' + Performance.convClass(r.conversion_rate) + '">' + (r.conversion_rate || 0).toFixed(1) + '%</span></td>' +
        '<td class="num"><span class="conv-badge ' + Performance.convClass(r.qualified_rate) + '">' + (r.qualified_rate || 0).toFixed(1) + '%</span></td>' +
      '</tr>';
    }).join('');
  },

  renderInsights(rows) {
    var el = document.getElementById('perf-insights');
    if (!el || rows.length < 2) { if (el) el.innerHTML = ''; return; }
    var bestConv = rows.reduce(function(a, b) { return (parseFloat(b.conversion_rate) || 0) > (parseFloat(a.conversion_rate) || 0) ? b : a; });
    var bestLeads = rows.reduce(function(a, b) { return (parseInt(b.leads) || 0) > (parseInt(a.leads) || 0) ? b : a; });
    var bestRevenue = rows.reduce(function(a, b) { return (parseFloat(b.revenue) || 0) > (parseFloat(a.revenue) || 0) ? b : a; });
    el.innerHTML = '<div class="dash-grid-3">' +
      '<div class="insight-card insight-green"><div class="insight-icon">🏆</div><div class="insight-text"><strong>Melhor Conversao</strong><br>' + esc(bestConv.source || 'direto') + (bestConv.campaign && bestConv.campaign !== '-' && bestConv.campaign !== '(none)' ? ' / ' + esc(bestConv.campaign) : '') + '<br><span class="insight-value">' + (bestConv.conversion_rate || 0).toFixed(1) + '% conv.</span></div></div>' +
      '<div class="insight-card insight-blue"><div class="insight-icon">📊</div><div class="insight-text"><strong>Mais Leads</strong><br>' + esc(bestLeads.source || 'direto') + (bestLeads.campaign && bestLeads.campaign !== '-' && bestLeads.campaign !== '(none)' ? ' / ' + esc(bestLeads.campaign) : '') + '<br><span class="insight-value">' + bestLeads.leads + ' leads</span></div></div>' +
      '<div class="insight-card insight-purple"><div class="insight-icon">💰</div><div class="insight-text"><strong>Mais Receita</strong><br>' + esc(bestRevenue.source || 'direto') + (bestRevenue.campaign && bestRevenue.campaign !== '-' && bestRevenue.campaign !== '(none)' ? ' / ' + esc(bestRevenue.campaign) : '') + '<br><span class="insight-value">R$ ' + Dashboard.fmt(bestRevenue.revenue || 0) + '</span></div></div>' +
    '</div>';
  },

  convClass(rate) {
    rate = parseFloat(rate) || 0;
    if (rate >= 10) return 'conv-high';
    if (rate >= 5) return 'conv-mid';
    return 'conv-low';
  },

  // ─── A/B TESTS ──────────────────────────
  async loadABTests() {
    var el = document.getElementById('perf-content');
    try {
      var data = await Api.getABTests();
      var tests = data.tests || data || [];
      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <p style="color:#94a3b8;font-size:13px">${tests.length} teste(s) cadastrado(s)</p>
          <button class="btn-save" onclick="Performance.showCreateTest()">+ Novo Teste A/B</button>
        </div>
        <div id="ab-list">${tests.length ? tests.map(function(t) { return Performance.renderTestCard(t); }).join('') : '<div class="dash-card"><div class="dash-card-body"><p class="loading">Nenhum teste A/B criado ainda. Crie seu primeiro teste para comparar variantes de landing page, criativos ou fontes de trafego.</p></div></div>'}</div>
        <div id="ab-modal" style="display:none"></div>`;
    } catch (e) {
      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <p style="color:#94a3b8;font-size:13px">Testes A/B</p>
          <button class="btn-save" onclick="Performance.showCreateTest()">+ Novo Teste A/B</button>
        </div>
        <div class="dash-card"><div class="dash-card-body"><p class="loading">Endpoint de testes A/B ainda nao disponivel. Crie testes quando o backend estiver pronto.</p></div></div>
        <div id="ab-modal" style="display:none"></div>`;
    }
  },

  renderTestCard(test) {
    var statusColors = { active:'#22c55e', paused:'#f59e0b', completed:'#64748b' };
    var statusLabels = { active:'Ativo', paused:'Pausado', completed:'Concluido' };
    var color = statusColors[test.status] || '#64748b';
    var variants = test.variants || [];
    var started = test.started_at ? new Date(test.started_at).toLocaleDateString('pt-BR') : '-';

    var variantsHtml = variants.map(function(v) {
      var isWinner = test.winner && test.winner === v.id;
      return '<div class="ab-variant ' + (isWinner ? 'ab-winner' : '') + '">' +
        '<div class="ab-variant-header">' +
          '<span class="ab-variant-id">' + esc(v.id) + '</span>' +
          '<span class="ab-variant-name">' + esc(v.name || '') + '</span>' +
          (isWinner ? '<span class="ab-winner-badge">Vencedor</span>' : '') +
        '</div>' +
        '<div class="ab-variant-stats">' +
          '<div class="ab-stat"><span class="ab-stat-label">Leads</span><span class="ab-stat-value">' + (v.stats ? v.stats.leads || 0 : '—') + '</span></div>' +
          '<div class="ab-stat"><span class="ab-stat-label">Qualif.</span><span class="ab-stat-value">' + (v.stats ? v.stats.qualified || 0 : '—') + '</span></div>' +
          '<div class="ab-stat"><span class="ab-stat-label">Vendas</span><span class="ab-stat-value">' + (v.stats ? v.stats.paid || 0 : '—') + '</span></div>' +
          '<div class="ab-stat"><span class="ab-stat-label">Conv.</span><span class="ab-stat-value">' + (v.stats ? (v.stats.conversion_rate || 0).toFixed(1) + '%' : '—') + '</span></div>' +
        '</div>' +
        '<div class="ab-variant-utm" title="utm_content">' + esc(v.utm_content || '-') + '</div>' +
      '</div>';
    }).join('');

    return '<div class="dash-card ab-test-card" style="margin-bottom:16px;border-left:3px solid ' + color + '">' +
      '<div class="dash-card-header">' +
        '<div><h3>' + esc(test.name) + '</h3>' + (test.description ? '<p style="color:#64748b;font-size:12px;margin-top:2px">' + esc(test.description) + '</p>' : '') + '</div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="background:' + color + '20;color:' + color + ';padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600">' + (statusLabels[test.status] || test.status) + '</span>' +
          '<span style="color:#64748b;font-size:12px">Inicio: ' + started + '</span>' +
          (test.status === 'active' ? '<button class="btn-use" onclick="Performance.updateTest(' + test.id + ',\'completed\')">Encerrar</button>' : '') +
          (test.status === 'active' ? '<button class="btn-delete" onclick="Performance.updateTest(' + test.id + ',\'paused\')">Pausar</button>' : '') +
          (test.status === 'paused' ? '<button class="btn-use" onclick="Performance.updateTest(' + test.id + ',\'active\')">Reativar</button>' : '') +
        '</div>' +
      '</div>' +
      '<div class="dash-card-body"><div class="ab-variants">' + variantsHtml + '</div></div>' +
    '</div>';
  },

  showCreateTest() {
    var modal = document.getElementById('ab-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="Performance.closeModal()"></div>
      <div class="modal-box">
        <h3 style="margin-bottom:20px">Novo Teste A/B</h3>
        <div class="form-group">
          <label>Nome do Teste</label>
          <input type="text" id="ab-name" placeholder="Ex: Headline Dor vs Aspiracao">
        </div>
        <div class="form-group">
          <label>Descricao (opcional)</label>
          <input type="text" id="ab-desc" placeholder="O que esta sendo testado">
        </div>
        <div class="form-group">
          <label>Metrica Principal</label>
          <select id="ab-metric">
            <option value="conversion_rate">Taxa de Conversao (Lead→Venda)</option>
            <option value="qualified_rate">Taxa de Qualificacao</option>
            <option value="leads">Volume de Leads</option>
          </select>
        </div>
        <div class="form-group">
          <label>Variantes</label>
          <div id="ab-variants-list">
            <div class="ab-variant-input">
              <input type="text" class="ab-var-id" placeholder="ID (ex: A)" value="A" style="width:60px">
              <input type="text" class="ab-var-name" placeholder="Nome (ex: Controle)" style="flex:1">
              <input type="text" class="ab-var-utm" placeholder="utm_content (ex: headline-dor)" style="flex:1">
            </div>
            <div class="ab-variant-input">
              <input type="text" class="ab-var-id" placeholder="ID (ex: B)" value="B" style="width:60px">
              <input type="text" class="ab-var-name" placeholder="Nome (ex: Teste)" style="flex:1">
              <input type="text" class="ab-var-utm" placeholder="utm_content (ex: headline-aspiracao)" style="flex:1">
            </div>
          </div>
          <button class="btn-back" onclick="Performance.addVariantRow()" style="margin-top:8px">+ Variante</button>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">
          <button class="btn-back" onclick="Performance.closeModal()">Cancelar</button>
          <button class="btn-save" onclick="Performance.createTest()">Criar Teste</button>
        </div>
        <div id="ab-create-result" style="margin-top:12px"></div>
      </div>`;
  },

  addVariantRow() {
    var list = document.getElementById('ab-variants-list');
    var count = list.children.length;
    var letter = String.fromCharCode(65 + count);
    var div = document.createElement('div');
    div.className = 'ab-variant-input';
    div.innerHTML = '<input type="text" class="ab-var-id" placeholder="ID" value="' + letter + '" style="width:60px"><input type="text" class="ab-var-name" placeholder="Nome" style="flex:1"><input type="text" class="ab-var-utm" placeholder="utm_content" style="flex:1"><button class="btn-delete" onclick="this.parentElement.remove()" style="padding:8px">✕</button>';
    list.appendChild(div);
  },

  async createTest() {
    var name = document.getElementById('ab-name').value.trim();
    var desc = document.getElementById('ab-desc').value.trim();
    var metric = document.getElementById('ab-metric').value;
    var resultEl = document.getElementById('ab-create-result');
    if (!name) { resultEl.innerHTML = '<p style="color:#f87171">Nome e obrigatorio</p>'; return; }
    var varRows = document.querySelectorAll('.ab-variant-input');
    var variants = [];
    var valid = true;
    varRows.forEach(function(row) {
      var id = row.querySelector('.ab-var-id').value.trim();
      var vname = row.querySelector('.ab-var-name').value.trim();
      var utm = row.querySelector('.ab-var-utm').value.trim();
      if (!id || !utm) valid = false;
      variants.push({ id:id, name:vname, utm_content:utm });
    });
    if (!valid || variants.length < 2) {
      resultEl.innerHTML = '<p style="color:#f87171">Preencha ao menos 2 variantes com ID e utm_content</p>';
      return;
    }
    try {
      await Api.createABTest({ name:name, description:desc, metric_primary:metric, variants:variants });
      this.closeModal();
      this.loadABTests();
    } catch (e) {
      resultEl.innerHTML = '<p style="color:#f87171">Erro: ' + esc(e.message) + '</p>';
    }
  },

  async updateTest(id, status) {
    try {
      await Api.updateABTest(id, { status:status });
      this.loadABTests();
    } catch (e) { alert('Erro: ' + e.message); }
  },

  closeModal() {
    var modal = document.getElementById('ab-modal');
    if (modal) modal.style.display = 'none';
  }
};
