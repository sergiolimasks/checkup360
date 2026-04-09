// users.js - Gerenciamento de Usuários (admin only)
const Users = {
  users: [],
  editingId: null,

  async render(container) {
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    try {
      const data = await Api.getUsers();
      this.users = data.users || [];
      this.editingId = null;
      container.innerHTML = this.buildHTML();
      this.bindEvents();
    } catch (e) {
      container.innerHTML = '<div class="loading" style="color:#f87171">Erro: ' + esc(e.message) + '</div>';
    }
  },

  buildHTML() {
    var roleLabels = { operador: 'Operador', gestor: 'Gestor', administrador: 'Administrador', admin: 'Administrador' };
    var roleColors = { operador: '#94a3b8', gestor: '#fbbf24', administrador: '#22d3ee', admin: '#22d3ee' };

    var rows = this.users.map(function(u) {
      var date = new Date(u.created_at).toLocaleDateString('pt-BR');
      var lastLogin = u.last_login ? new Date(u.last_login).toLocaleString('pt-BR') : 'Nunca';
      var statusBadge = u.is_active
        ? '<span style="color:#22c55e;font-size:12px">● Ativo</span>'
        : '<span style="color:#f87171;font-size:12px">● Inativo</span>';
      var roleColor = roleColors[u.role] || '#94a3b8';
      var roleLabel = roleLabels[u.role] || u.role;
      return '<tr>' +
        '<td>' + esc(u.name) + '</td>' +
        '<td style="color:#94a3b8;font-size:13px">' + esc(u.email) + '</td>' +
        '<td><span style="color:' + roleColor + ';font-weight:600;font-size:13px">' + roleLabel + '</span></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td style="color:#64748b;font-size:13px">' + lastLogin + '</td>' +
        '<td style="color:#64748b;font-size:13px">' + date + '</td>' +
        '<td><div style="display:flex;gap:6px">' +
          '<button class="btn-use" onclick="Users.showEditModal(\'' + u.id + '\')">Editar</button>' +
          (u.is_active ? '<button class="btn-delete" onclick="Users.deactivateUser(\'' + u.id + '\',\'' + esc(u.name).replace(/'/g, "\\'") + '\')">Desativar</button>' : '<button class="btn-use" onclick="Users.reactivateUser(\'' + u.id + '\')">Reativar</button>') +
        '</div></td>' +
        '</tr>';
    }).join('');

    return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
      '<div></div>' +
      '<button class="btn-save" onclick="Users.showCreateModal()">+ Novo Usuário</button>' +
    '</div>' +
    '<div class="card"><div class="card-header"><h3>Usuários do Sistema</h3></div>' +
      '<table><thead><tr><th>Nome</th><th>Email</th><th>Nível</th><th>Status</th><th>Último Login</th><th>Criado</th><th>Ações</th></tr></thead>' +
      '<tbody id="users-tbody">' + (rows || '<tr><td colspan="7" class="chat-empty">Nenhum usuário cadastrado</td></tr>') + '</tbody></table>' +
    '</div>' +
    '<div class="card" style="margin-top:24px;padding:24px">' +
      '<h3 style="margin-bottom:16px;font-size:16px">Níveis de Acesso</h3>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px">' +
        '<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;border:1px solid rgba(148,163,184,0.15)">' +
          '<div style="font-weight:600;color:#94a3b8;margin-bottom:8px">Operador</div>' +
          '<div style="font-size:13px;color:#64748b;line-height:1.6">• CRM Pipeline<br>• Lista de Leads<br>• Chat WhatsApp<br>• <span style="color:#f87171">Sem permissão para excluir</span></div>' +
        '</div>' +
        '<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;border:1px solid rgba(251,191,36,0.15)">' +
          '<div style="font-weight:600;color:#fbbf24;margin-bottom:8px">Gestor</div>' +
          '<div style="font-size:13px;color:#64748b;line-height:1.6">• CRM Pipeline<br>• Lista de Leads<br>• Chat WhatsApp<br>• Dashboard<br>• Templates WhatsApp<br>• <span style="color:#f87171">Sem permissão para excluir</span></div>' +
        '</div>' +
        '<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;border:1px solid rgba(34,211,238,0.15)">' +
          '<div style="font-weight:600;color:#22d3ee;margin-bottom:8px">Administrador</div>' +
          '<div style="font-size:13px;color:#64748b;line-height:1.6">• Acesso total completo<br>• Gerenciamento de Usuários<br>• Dashboard<br>• Templates WhatsApp<br>• <span style="color:#22c55e">Pode excluir leads</span></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<!-- Modal Criar/Editar -->' +
    '<div id="modal-users" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:999;align-items:center;justify-content:center">' +
      '<div style="background:#1e293b;border-radius:16px;padding:32px;width:100%;max-width:460px;border:1px solid rgba(255,255,255,0.1)">' +
        '<h3 id="modal-users-title" style="margin-bottom:20px">Novo Usuário</h3>' +
        '<div id="modal-users-error" class="alert alert-error" style="display:none"></div>' +
        '<div class="form-group"><label>Nome</label><input type="text" id="modal-user-name" placeholder="Nome completo"></div>' +
        '<div class="form-group"><label>Email</label><input type="email" id="modal-user-email" placeholder="email@empresa.com"></div>' +
        '<div class="form-group"><label id="modal-user-password-label">Senha</label><input type="password" id="modal-user-password" placeholder="Senha de acesso"></div>' +
        '<div class="form-group"><label>Telefone (opcional)</label><input type="text" id="modal-user-phone" placeholder="(11) 99999-9999"></div>' +
        '<div class="form-group"><label>Nível de Acesso</label>' +
          '<select class="filter-select" id="modal-user-role" style="width:100%">' +
            '<option value="operador">Operador - CRM e Leads</option>' +
            '<option value="gestor">Gestor - CRM, Leads, Dashboard, Templates</option>' +
            '<option value="administrador">Administrador - Acesso Total</option>' +
          '</select>' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:24px">' +
          '<button class="btn-back" onclick="Users.closeModal()">Cancelar</button>' +
          '<button class="btn-save" id="modal-users-btn" onclick="Users.saveUser()">Criar Usuário</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  },

  bindEvents() {},

  showCreateModal() {
    this.editingId = null;
    document.getElementById('modal-users-title').textContent = 'Novo Usuário';
    document.getElementById('modal-users-btn').textContent = 'Criar Usuário';
    document.getElementById('modal-user-name').value = '';
    document.getElementById('modal-user-email').value = '';
    document.getElementById('modal-user-password').value = '';
    document.getElementById('modal-user-phone').value = '';
    document.getElementById('modal-user-role').value = 'operador';
    document.getElementById('modal-user-password-label').textContent = 'Senha';
    document.getElementById('modal-user-password').required = true;
    document.getElementById('modal-users-error').style.display = 'none';
    document.getElementById('modal-users').style.display = 'flex';
  },

  showEditModal(id) {
    var user = null;
    for (var i = 0; i < this.users.length; i++) {
      if (this.users[i].id === id) { user = this.users[i]; break; }
    }
    if (!user) return;
    this.editingId = id;
    document.getElementById('modal-users-title').textContent = 'Editar Usuário';
    document.getElementById('modal-users-btn').textContent = 'Salvar Alterações';
    document.getElementById('modal-user-name').value = user.name;
    document.getElementById('modal-user-email').value = user.email;
    document.getElementById('modal-user-password').value = '';
    document.getElementById('modal-user-phone').value = user.phone || '';
    document.getElementById('modal-user-role').value = (user.role === 'admin') ? 'administrador' : user.role;
    document.getElementById('modal-user-password-label').textContent = 'Nova Senha (deixe em branco para manter)';
    document.getElementById('modal-user-password').required = false;
    document.getElementById('modal-users-error').style.display = 'none';
    document.getElementById('modal-users').style.display = 'flex';
  },

  closeModal() {
    document.getElementById('modal-users').style.display = 'none';
  },

  async saveUser() {
    var nameEl = document.getElementById('modal-user-name');
    var emailEl = document.getElementById('modal-user-email');
    var passEl = document.getElementById('modal-user-password');
    var phoneEl = document.getElementById('modal-user-phone');
    var roleEl = document.getElementById('modal-user-role');
    var errEl = document.getElementById('modal-users-error');
    var btn = document.getElementById('modal-users-btn');

    var userName = nameEl ? nameEl.value.trim() : '';
    var userEmail = emailEl ? emailEl.value.trim() : '';
    var userPass = passEl ? passEl.value : '';
    var userPhone = phoneEl ? phoneEl.value.trim() : '';
    var userRole = roleEl ? roleEl.value : 'operador';


    if (!userName || !userEmail) {
      errEl.textContent = 'Nome e email são obrigatórios';
      errEl.style.display = 'block';
      return;
    }
    if (!this.editingId && !userPass) {
      errEl.textContent = 'Senha é obrigatória para novos usuários';
      errEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Salvando...';
    errEl.style.display = 'none';

    try {
      if (this.editingId) {
        var payload = { name: userName, email: userEmail, role: userRole, phone: userPhone || null };
        if (userPass) payload.password = userPass;
        await Api.updateUser(this.editingId, payload);
      } else {
        await Api.createUser({ name: userName, email: userEmail, password: userPass, role: userRole, phone: userPhone || null });
      }
      this.closeModal();
      Users.render(document.getElementById('content-area'));
    } catch (e) {
      errEl.textContent = e.message;
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = this.editingId ? 'Salvar Alterações' : 'Criar Usuário';
    }
  },

  async deactivateUser(id, name) {
    if (!confirm('Desativar o usuário "' + name + '"? Ele não poderá mais fazer login.')) return;
    try {
      await Api.deleteUser(id);
      Users.render(document.getElementById('content-area'));
    } catch (e) { alert('Erro: ' + e.message); }
  },

  async reactivateUser(id) {
    try {
      await Api.updateUser(id, { is_active: true });
      Users.render(document.getElementById('content-area'));
    } catch (e) { alert('Erro: ' + e.message); }
  }
};
