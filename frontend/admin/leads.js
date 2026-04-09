// leads.js
const Leads = {
  page: 1, search: '', statusFilter: '', waFilter: false,
  async render(container) {
    var showActions = App.canDelete();
    var colSpan = showActions ? '7' : '6';
    container.innerHTML =
      '<div class="filters-row">' +
        '<input class="search-input" id="lead-search" placeholder="Buscar por nome, CPF ou telefone..." value="' + this.search + '">' +
        '<select class="filter-select" id="lead-status-filter">' +
          '<option value="">Todos os status</option>' +
          '<option value="registered">Registrado</option><option value="contacted">Contactado</option>' +
          '<option value="payment_pending">Aguardando Pgto</option><option value="paid">Pago</option>' +
          '<option value="consulting">Consultando</option><option value="completed">Completo</option>' +
          '<option value="converted">Convertido</option><option value="lost">Perdido</option>' +
        '</select>' +
        '<button class="btn-wa-filter' + (this.waFilter ? ' active' : '') + '" id="btn-wa-filter" onclick="Leads.toggleWAFilter()" title="Filtrar leads com janela WhatsApp ativa (últimas 24h)">🟢 Janela Ativa</button>' +
      '</div>' +
      '<div class="card"><div class="card-header"><h3>Lista de Leads</h3><span id="leads-count-label" style="color:#64748b;font-size:13px"></span></div>' +
        '<table><thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>Status</th><th>Origem</th><th>Data</th>' + (showActions ? '<th>Ações</th>' : '') + '</tr></thead>' +
        '<tbody id="leads-tbody"><tr><td colspan="' + colSpan + '" class="loading"><div class="spinner"></div></td></tr></tbody></table>' +
        '<div class="pagination" id="leads-pagination"></div>' +
      '</div>';
    document.getElementById('lead-status-filter').value = this.statusFilter;
    var searchTimer;
    document.getElementById('lead-search').oninput = function(e) { clearTimeout(searchTimer); searchTimer = setTimeout(function() { Leads.search = e.target.value; Leads.page = 1; Leads.loadLeads(); }, 400); };
    document.getElementById('lead-status-filter').onchange = function(e) { Leads.statusFilter = e.target.value; Leads.page = 1; Leads.loadLeads(); };
    this.loadLeads();
  },
  toggleWAFilter() {
    this.waFilter = !this.waFilter;
    this.page = 1;
    var btn = document.getElementById('btn-wa-filter');
    if (btn) btn.classList.toggle('active', this.waFilter);
    this.loadLeads();
  },
  async loadLeads() {
    var showActions = App.canDelete();
    var colSpan = showActions ? '7' : '6';
    var tbody = document.getElementById('leads-tbody');
    var countLabel = document.getElementById('leads-count-label');
    try {
      if (this.waFilter) {
        // Load all leads and filter client-side for active WA windows
        var allData = await Api.getAllLeads(500);
        var allLeads = allData.leads || [];
        var now = new Date();
        var filtered = allLeads.filter(function(l) {
          if (l.window_expires_at) return new Date(l.window_expires_at) > now;
          return false;
        });
        // Apply search filter too
        if (this.search) {
          var q = this.search.toLowerCase();
          filtered = filtered.filter(function(l) {
            return (l.name && l.name.toLowerCase().indexOf(q) >= 0) ||
                   (l.cpf && l.cpf.indexOf(q) >= 0) ||
                   (l.phone && l.phone.indexOf(q) >= 0);
          });
        }
        // Apply status filter
        if (this.statusFilter) {
          var sf = this.statusFilter;
          filtered = filtered.filter(function(l) { return l.status === sf; });
        }
        if (countLabel) countLabel.textContent = filtered.length + ' leads com janela ativa';
        if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="' + colSpan + '" class="chat-empty">Nenhum lead com janela WA ativa</td></tr>'; document.getElementById('leads-pagination').innerHTML = ''; return; }
        tbody.innerHTML = filtered.map(function(l) {
          var date = new Date(l.created_at).toLocaleDateString('pt-BR');
          var actionCol = showActions ? '<td><button class="btn-delete" onclick="event.stopPropagation();Leads.deleteLead(\'' + l.id + '\',\'' + esc((l.name || '')).replace(/'/g, "\\'") + '\')">Excluir</button></td>' : '';
          return '<tr class="clickable" onclick="App.navigate(\'lead-detail\',\'' + l.id + '\')">' +
            '<td>' + esc(l.name) + ' <span class="crm-wa-dot active" title="Janela WA ativa" style="display:inline-block"></span></td><td style="font-family:monospace;font-size:13px">' + esc(l.cpf || '-') + '</td>' +
            '<td>' + esc(l.phone) + '</td><td><span class="badge badge-' + l.status + '">' + l.status + '</span></td>' +
            '<td style="color:#94a3b8">' + esc(l.source) + '</td><td style="color:#64748b;font-size:13px">' + date + '</td>' + actionCol + '</tr>';
        }).join('');
        document.getElementById('leads-pagination').innerHTML = '';
      } else {
        // Normal paginated load
        if (countLabel) countLabel.textContent = '';
        var data = await Api.getLeads(this.page, 20, this.search, this.statusFilter);
        if (!data.leads.length) { tbody.innerHTML = '<tr><td colspan="' + colSpan + '" class="chat-empty">Nenhum lead encontrado</td></tr>'; return; }
        tbody.innerHTML = data.leads.map(function(l) {
          var date = new Date(l.created_at).toLocaleDateString('pt-BR');
          var actionCol = showActions ? '<td><button class="btn-delete" onclick="event.stopPropagation();Leads.deleteLead(\'' + l.id + '\',\'' + esc((l.name || '')).replace(/'/g, "\\'") + '\')">Excluir</button></td>' : '';
          return '<tr class="clickable" onclick="App.navigate(\'lead-detail\',\'' + l.id + '\')">' +
            '<td>' + esc(l.name) + '</td><td style="font-family:monospace;font-size:13px">' + esc(l.cpf || '-') + '</td>' +
            '<td>' + esc(l.phone) + '</td><td><span class="badge badge-' + l.status + '">' + l.status + '</span></td>' +
            '<td style="color:#94a3b8">' + esc(l.source) + '</td><td style="color:#64748b;font-size:13px">' + date + '</td>' + actionCol + '</tr>';
          }).join('');
        // Paginação
        var pag = data.pagination;
        var pagDiv = document.getElementById('leads-pagination');
        if (pag.pages <= 1) { pagDiv.innerHTML = ''; return; }
        var pagHtml = '<button ' + (pag.page<=1?'disabled':'') + ' onclick="Leads.goPage(' + (pag.page-1) + ')">Anterior</button>';
        for (var i = 1; i <= pag.pages; i++) {
          pagHtml += '<button class="' + (i===pag.page?'active':'') + '" onclick="Leads.goPage(' + i + ')">' + i + '</button>';
        }
        pagHtml += '<button ' + (pag.page>=pag.pages?'disabled':'') + ' onclick="Leads.goPage(' + (pag.page+1) + ')">Próxima</button>';
        pagDiv.innerHTML = pagHtml;
      }
    } catch (e) { tbody.innerHTML = '<tr><td colspan="' + colSpan + '" class="loading" style="color:#f87171">Erro: ' + esc(e.message) + '</td></tr>'; }
  },
  goPage(p) { this.page = p; this.loadLeads(); },
  async deleteLead(id, name) {
    if (!confirm('Excluir o lead "' + name + '" e todas as suas mensagens? Essa ação não pode ser desfeita.')) return;
    try { await Api.deleteLead(id); this.loadLeads(); } catch (e) { alert('Erro ao excluir: ' + e.message); }
  }
};
