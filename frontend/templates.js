// templates.js - Templates WhatsApp (Meta API)
const Templates = {
  metaTemplates: [],

  async render(container, subPage) {
    // subPage: 'list' (default), 'create', or undefined (show both)
    var view = subPage || 'list';
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Carregando templates...</p></div>';
    try {
      this.metaTemplates = await Api.getMetaTemplates();
      const metaHtml = this.metaTemplates.map((t, i) => this.renderMetaCard(t, i)).join('');

      if (view === 'create') {
        // Show only create form
        container.innerHTML = `
          <div style="max-width:600px">
            <div class="template-form-panel">
              <h3 style="margin-bottom:16px">Criar Template</h3>` + this._renderCreateForm() + `
            </div>
          </div>`;
        return;
      }

      if (view === 'list') {
        // Show only list
        container.innerHTML = `
          <div>
            <h3 style="color:#22d3ee;margin-bottom:16px">Templates Meta (${this.metaTemplates.length})</h3>
            <div class="template-list">${metaHtml || '<p style="color:#64748b">Nenhum template na Meta</p>'}</div>
          </div>`;
        return;
      }

      // Fallback: show both (legacy)
      container.innerHTML = `
        <div class="templates-layout">
          <div class="templates-list">
            <h3 style="color:#22d3ee;margin-bottom:16px">Templates Meta (${this.metaTemplates.length})</h3>
            ${metaHtml || '<p style="color:#64748b">Nenhum template na Meta</p>'}
          </div>
          <div class="template-form-panel">
            <h3 style="margin-bottom:16px">Criar Template</h3>
            <p style="color:#94a3b8;font-size:12px;margin-bottom:16px">O template será enviado para aprovação da Meta. Após aprovado, você poderá usá-lo para enviar mensagens.</p>
            <div class="template-form">
              <div class="form-group">
                <label>Nome</label>
                <input type="text" id="tpl-name" placeholder="Ex: boas_vindas (sem espaço, minúsculo)">
                <small style="color:#64748b">Apenas letras minúsculas, números e _ (underscore)</small>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Categoria</label>
                  <select id="tpl-category">
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utilidade</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Idioma</label>
                  <select id="tpl-lang">
                    <option value="pt_BR">Português (BR)</option>
                    <option value="en_US">English</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Cabeçalho (opcional)</label>
                <input type="text" id="tpl-header" placeholder="Texto do cabeçalho">
              </div>
              <div class="form-group">
                <label>Corpo da Mensagem</label>
                <textarea id="tpl-body" rows="4" placeholder="Olá {{1}}, sua consulta está pronta..." oninput="Templates.detectVariables()"></textarea>
                <small style="color:#64748b">Use {{1}}, {{2}} para variáveis</small>
              </div>
              <div id="tpl-variables"></div>
              <div id="tpl-preview" style="display:none"></div>
              <div class="form-group">
                <label>Rodapé (opcional)</label>
                <input type="text" id="tpl-footer" placeholder="Consulta Crédito">
              </div>
              <button class="btn-save" id="btn-create-tpl" onclick="Templates.createTemplate()" style="width:100%">Enviar para Aprovação Meta</button>
              <div id="tpl-result" style="margin-top:12px"></div>
            </div>
          </div>
        </div>`;
    } catch (e) {
      container.innerHTML = '<div class="loading" style="color:#f87171">Erro: ' + esc(e.message) + '</div>';
    }
  },

  _renderCreateForm() {
    return `<p style="color:#94a3b8;font-size:12px;margin-bottom:16px">O template será enviado para aprovação da Meta. Após aprovado, você poderá usá-lo para enviar mensagens.</p>
            <div class="template-form">
              <div class="form-group">
                <label>Nome</label>
                <input type="text" id="tpl-name" placeholder="Ex: boas_vindas (sem espaço, minúsculo)">
                <small style="color:#64748b">Apenas letras minúsculas, números e _ (underscore)</small>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Categoria</label>
                  <select id="tpl-category">
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utilidade</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Idioma</label>
                  <select id="tpl-lang">
                    <option value="pt_BR">Português (BR)</option>
                    <option value="en_US">English</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Cabeçalho (opcional)</label>
                <input type="text" id="tpl-header" placeholder="Texto do cabeçalho">
              </div>
              <div class="form-group">
                <label>Corpo da Mensagem</label>
                <textarea id="tpl-body" rows="4" placeholder="Olá {{1}}, sua consulta está pronta..." oninput="Templates.detectVariables()"></textarea>
                <small style="color:#64748b">Use {{1}}, {{2}} para variáveis</small>
              </div>
              <div id="tpl-variables"></div>
              <div id="tpl-preview" style="display:none"></div>
              <div class="form-group">
                <label>Rodapé (opcional)</label>
                <input type="text" id="tpl-footer" placeholder="Consulta Crédito">
              </div>
              <button class="btn-save" id="btn-create-tpl" onclick="Templates.createTemplate()" style="width:100%">Enviar para Aprovação Meta</button>
              <div id="tpl-result" style="margin-top:12px"></div>
            </div>`;
  },

  detectVariables() {
    const body = document.getElementById('tpl-body').value;
    const matches = body.match(/\{\{(\d+)\}\}/g) || [];
    const nums = [...new Set(matches.map(m => parseInt(m.replace(/\D/g, ''))))].sort((a,b) => a-b);
    const container = document.getElementById('tpl-variables');
    const preview = document.getElementById('tpl-preview');

    if (nums.length === 0) {
      container.innerHTML = '';
      preview.style.display = 'none';
      return;
    }

    container.innerHTML = '<div style="border:1px solid rgba(34,211,238,0.2);border-radius:8px;padding:12px;margin-bottom:4px">' +
      '<label style="color:#22d3ee;font-size:12px;font-weight:600;margin-bottom:8px;display:block">Exemplos das Variáveis (obrigatório para aprovação)</label>' +
      nums.map(n =>
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
        '<span style="color:#f59e0b;font-size:13px;font-weight:600;min-width:40px">{{' + n + '}}</span>' +
        '<input type="text" class="tpl-example-input" data-var="' + n + '" placeholder="Ex: João, R$ 100..." ' +
        'oninput="Templates.updatePreview()" style="flex:1;padding:8px 12px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#f1f5f9;font-size:13px;outline:none">' +
        '</div>'
      ).join('') +
      '</div>';

    this.updatePreview();
  },

  updatePreview() {
    const body = document.getElementById('tpl-body').value;
    const preview = document.getElementById('tpl-preview');
    const inputs = document.querySelectorAll('.tpl-example-input');
    let previewText = body;
    let allFilled = true;

    inputs.forEach(inp => {
      const n = inp.dataset.var;
      const val = inp.value.trim();
      if (!val) allFilled = false;
      previewText = previewText.replace(new RegExp('\\{\\{' + n + '\\}\\}', 'g'), val || '[{{' + n + '}}]');
    });

    if (inputs.length > 0) {
      preview.style.display = 'block';
      preview.innerHTML = '<div style="border:1px solid rgba(34,211,238,0.2);border-radius:8px;padding:12px;margin-bottom:4px">' +
        '<label style="color:#94a3b8;font-size:12px;margin-bottom:6px;display:block">Preview da mensagem:</label>' +
        '<div style="background:rgba(0,0,0,0.2);border-radius:6px;padding:10px;font-size:13px;color:#e2e8f0;white-space:pre-wrap">' + esc(previewText) + '</div>' +
        '</div>';
    }
  },

  renderMetaCard(t, index) {
    const statusColors = { APPROVED:'#22c55e', PENDING:'#f59e0b', REJECTED:'#ef4444', PAUSED:'#64748b', DISABLED:'#64748b' };
    const statusColor = statusColors[t.status] || '#94a3b8';
    const bodyComp = t.components ? t.components.find(c => c.type === 'BODY') : null;
    const headerComp = t.components ? t.components.find(c => c.type === 'HEADER') : null;
    const footerComp = t.components ? t.components.find(c => c.type === 'FOOTER') : null;
    const bodyText = bodyComp ? bodyComp.text : '';
    const headerText = headerComp ? headerComp.text || headerComp.format : '';
    const footerText = footerComp ? footerComp.text : '';

    return '<div class="template-card" style="border-left:3px solid ' + statusColor + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<strong>' + esc(t.name) + '</strong>' +
      '<span style="background:' + statusColor + ';color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">' + esc(t.status) + '</span>' +
      '</div>' +
      '<div style="font-size:11px;color:#64748b;margin-bottom:8px">' +
      esc(t.category || '') + ' · ' + esc(t.language || '') + ' · Meta ID: ' + esc(t.id || '') +
      '</div>' +
      (headerText ? '<div style="color:#22d3ee;font-size:13px;font-weight:600;margin-bottom:4px">' + esc(headerText) + '</div>' : '') +
      '<div style="font-size:13px;color:#cbd5e1;margin-bottom:4px;white-space:pre-wrap">' + esc(bodyText) + '</div>' +
      (footerText ? '<div style="font-size:11px;color:#64748b;font-style:italic">' + esc(footerText) + '</div>' : '') +
      (t.status !== 'APPROVED' ? '<button class="btn-delete" style="margin-top:8px" onclick="Templates.deleteTemplate(\'' + esc(t.name).replace(/'/g, "\\'") + '\')">Excluir</button>' : '') +
      '</div>';
  },

  async createTemplate() {
    const name = document.getElementById('tpl-name').value.trim();
    const category = document.getElementById('tpl-category').value;
    const language = document.getElementById('tpl-lang').value;
    const header = document.getElementById('tpl-header').value.trim();
    const body = document.getElementById('tpl-body').value.trim();
    const footer = document.getElementById('tpl-footer').value.trim();
    const resultDiv = document.getElementById('tpl-result');
    const btn = document.getElementById('btn-create-tpl');

    if (!name || !body) {
      resultDiv.innerHTML = '<p style="color:#f87171">Nome e corpo são obrigatórios</p>';
      return;
    }
    if (!/^[a-z0-9_]+$/.test(name)) {
      resultDiv.innerHTML = '<p style="color:#f87171">Nome deve ter apenas letras minúsculas, números e _</p>';
      return;
    }

    // Collect example values for variables
    const exampleInputs = document.querySelectorAll('.tpl-example-input');
    const bodyExamples = [];
    let missingExamples = false;
    exampleInputs.forEach(inp => {
      const val = inp.value.trim();
      if (!val) missingExamples = true;
      bodyExamples.push(val);
    });

    if (exampleInputs.length > 0 && missingExamples) {
      resultDiv.innerHTML = '<p style="color:#f87171">Preencha todos os exemplos das variáveis. A Meta exige exemplos para aprovar.</p>';
      return;
    }

    btn.disabled = true; btn.textContent = 'Enviando para Meta...';
    resultDiv.innerHTML = '';

    try {
      const res = await Api.createMetaTemplate(name, category, language, header, body, footer, bodyExamples);
      resultDiv.innerHTML = '<p style="color:#22c55e">Template enviado! Status: <strong>' + esc(res.status || 'PENDING') + '</strong>. A Meta vai analisar e aprovar.</p>';
      setTimeout(function() { App.navigate('templates', 'list'); }, 2000);
    } catch (e) {
      resultDiv.innerHTML = '<p style="color:#f87171">Erro: ' + esc(e.message) + '</p>';
    } finally {
      btn.disabled = false; btn.textContent = 'Enviar para Aprovação Meta';
    }
  },

  async deleteTemplate(name) {
    if (!confirm('Deletar template "' + name + '" da Meta?')) return;
    try {
      await Api.deleteMetaTemplate(name);
      App.navigate('templates', 'list');
    } catch (e) { alert('Erro ao deletar: ' + e.message); }
  }
};
