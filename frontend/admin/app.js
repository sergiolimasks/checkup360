// app.js - Controle de navegação, sidebar e estado
const App = {
  currentPage: null, user: null, chatInterval: null,

  async init() {
    // Sidebar toggle (desktop)
    document.getElementById('sidebar-toggle').addEventListener('click', function() {
      App.toggleSidebar();
    });
    // Mobile hamburger
    document.getElementById('mobile-hamburger').addEventListener('click', function() {
      App.openMobileSidebar();
    });
    // Backdrop click closes sidebar
    document.getElementById('sidebar-backdrop').addEventListener('click', function() {
      App.closeMobileSidebar();
    });
    // Restore sidebar state (desktop only)
    if (localStorage.getItem('sidebar_expanded') === 'true') {
      document.getElementById('sidebar').classList.remove('collapsed');
    }
    if (Api.token) {
      try { this.user = await Api.getMe(); this.showApp('dashboard'); }
      catch (e) { this.showLogin(); }
    } else { this.showLogin(); }
  },

  toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    var expanded = !sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebar_expanded', expanded);
    document.getElementById('sidebar-toggle').title = expanded ? 'Recolher menu' : 'Expandir menu';
  },

  openMobileSidebar() {
    document.getElementById('sidebar').classList.add('mobile-open');
    document.getElementById('sidebar-backdrop').classList.add('visible');
    document.body.style.overflow = 'hidden';
  },

  closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('mobile-open');
    document.getElementById('sidebar-backdrop').classList.remove('visible');
    document.body.style.overflow = '';
  },

  toggleSubmenu(el) {
    var sidebar = document.getElementById('sidebar');
    // If collapsed, expand first
    if (sidebar.classList.contains('collapsed')) {
      sidebar.classList.remove('collapsed');
      localStorage.setItem('sidebar_expanded', 'true');
    }
    el.classList.toggle('open');
  },

  showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-page').style.display = 'none';
    Login.init();
  },

  showApp(page) {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-page').style.display = 'flex';
    if (this.user) {
      document.getElementById('user-name').textContent = this.user.name || 'Admin';
      document.getElementById('user-role').textContent = this.getRoleLabel(this.user.role);
      var avatar = document.getElementById('user-avatar');
      avatar.textContent = (this.user.name || 'A').charAt(0).toUpperCase();
    }
    this.applyRoleVisibility();
    var role = this.user ? this.user.role : '';
    if (role === 'operador' && (page === 'dashboard' || page === 'performance' || page === 'templates' || page === 'users')) {
      page = 'crm';
    }
    if (role === 'gestor' && page === 'users') {
      page = 'crm';
    }
    this.navigate(page);
  },

  getRoleLabel(role) {
    var labels = { operador: 'Operador', gestor: 'Gestor', administrador: 'Administrador', admin: 'Administrador' };
    return labels[role] || role;
  },

  isAdmin() {
    return this.user && (this.user.role === 'administrador' || this.user.role === 'admin');
  },

  canDelete() { return this.isAdmin(); },
  canViewDashboard() { return this.user && this.user.role !== 'operador'; },
  canViewTemplates() { return this.user && this.user.role !== 'operador'; },
  canViewUsers() { return this.isAdmin(); },

  applyRoleVisibility() {
    document.querySelectorAll('.menu-item[data-page]').forEach(function(el) {
      var page = el.dataset.page;
      if (page === 'dashboard') el.style.display = App.canViewDashboard() ? '' : 'none';
      else if (page === 'performance') el.style.display = App.canViewDashboard() ? '' : 'none';
      else if (page === 'templates') el.style.display = App.canViewTemplates() ? '' : 'none';
      else if (page === 'users') el.style.display = App.canViewUsers() ? '' : 'none';
      else el.style.display = '';
    });
    // Also hide submenu items
    document.querySelectorAll('.submenu-item[data-page]').forEach(function(el) {
      var page = el.dataset.page;
      if (page === 'templates') el.style.display = App.canViewTemplates() ? '' : 'none';
    });
  },

  navigate(page, data) {
    if (this.chatInterval) { clearInterval(this.chatInterval); this.chatInterval = null; }
    this.closeMobileSidebar();
    this.currentPage = page;

    // Update active states for regular menu items
    document.querySelectorAll('.menu-item').forEach(function(el) {
      var elPage = el.dataset.page;
      var isActive = elPage === page || (page === 'lead-detail' && elPage === 'leads');
      el.classList.toggle('active', isActive);
    });

    // Update submenu items active state
    document.querySelectorAll('.submenu-item').forEach(function(el) {
      el.classList.remove('active');
    });

    // Handle submenus active state
    ['templates', 'performance'].forEach(function(menuPage) {
      if (page === menuPage) {
        var sub = data || (menuPage === 'templates' ? 'list' : 'pages');
        document.querySelectorAll('.submenu-item[data-page="' + menuPage + '"]').forEach(function(el) {
          el.classList.toggle('active', el.dataset.sub === sub);
        });
        var parentMenu = document.querySelector('.menu-item[data-page="' + menuPage + '"]');
        if (parentMenu && !parentMenu.classList.contains('open')) {
          parentMenu.classList.add('open');
        }
      }
    });

    var titles = {
      dashboard: 'Dashboard',
      crm: 'CRM Pipeline',
      leads: 'Leads',
      'lead-detail': 'Detalhes do Lead',
      templates: 'Templates WhatsApp',
      performance: 'Performance & Testes',
      users: 'Usuários'
    };
    document.getElementById('page-title').textContent = titles[page] || '';

    var content = document.getElementById('content-area');
    if (page === 'dashboard') Dashboard.render(content);
    else if (page === 'crm') CRM.render(content);
    else if (page === 'leads') Leads.render(content);
    else if (page === 'lead-detail') LeadDetail.render(content, data);
    else if (page === 'templates') Templates.render(content, data);
    else if (page === 'performance') Performance.render(content, data);
    else if (page === 'users') Users.render(content);
  },

  logout() { Api.clearToken(); this.user = null; this.showLogin(); }
};

document.addEventListener('DOMContentLoaded', function() { App.init(); });
