// api.js - Módulo de comunicação com a API
const API_BASE = 'https://api.checkup360.online/api';

const Api = {
  token: sessionStorage.getItem('cc_token') || null,
  setToken(t) { this.token = t; sessionStorage.setItem('cc_token', t); },
  clearToken() { this.token = null; sessionStorage.removeItem('cc_token'); },

  async request(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    const res = await fetch(API_BASE + endpoint, { ...options, headers });
    if (res.status === 401) {
      const data = await res.json().catch(() => ({}));
      if (this.token && endpoint !== '/auth/login') {
        this.clearToken();
        if (typeof App !== 'undefined') App.showLogin();
      }
      throw new Error(data.error || 'Sessão expirada');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro na requisição');
    return data;
  },

  // Auth
  login(email, password) { return this.request('/auth/login', { method:'POST', body:JSON.stringify({email,password}) }); },
  getMe() { return this.request('/auth/me'); },

  // Dashboard
  getStats(period=30) { return this.request('/dashboard/stats?period='+period); },
  getChart(period=30) { return this.request('/dashboard/chart?period='+period); },
  getSources() { return this.request('/dashboard/source-breakdown'); },

  // Leads
  getLeads(page=1, limit=20, search='', status='', pipeline='') {
    let url = '/leads?page='+page+'&limit='+limit;
    if (search) url += '&search='+encodeURIComponent(search);
    if (status) url += '&status='+status;
    if (pipeline) url += '&pipeline_stage='+pipeline;
    return this.request(url);
  },
  getAllLeads(limit=200) { return this.request('/leads?limit='+limit); },
  getLead(id) { return this.request('/leads/'+id); },
  updateLead(id, data) { return this.request('/leads/'+id, { method:'PATCH', body:JSON.stringify(data) }); },
  deleteLead(id) { return this.request('/leads/'+id, { method:'DELETE' }); },

  // Conversations
  getMessages(leadId) { return this.request('/conversations/'+leadId); },
  sendMessage(leadId, content) {
    return this.request('/conversations', { method:'POST', body:JSON.stringify({ lead_id:leadId, direction:'outbound', message_type:'text', content }) });
  },

  // Payments
  getPayments(page=1) { return this.request('/payments?page='+page); },

  // Meta Templates - busca direta da API Meta via proxy
  async getMetaTemplates() {
    const res = await this.request('/meta/templates');
    return res.templates || res.data || [];
  },

  // Enviar template WhatsApp
  sendWhatsAppTemplate(phone, templateName, language, variables=[], leadId=null) {
    return this.request('/meta/send-template', {
      method:'POST',
      body:JSON.stringify({ phone, template_name:templateName, language, variables, lead_id:leadId })
    });
  },

  // Criar template na Meta
  createMetaTemplate(name, category, language, header, body, footer, bodyExamples) {
    return this.request('/meta/create-template', {
      method:'POST',
      body:JSON.stringify({ name, category, language, header, body, footer, body_examples: bodyExamples || [] })
    });
  },

  // Deletar template na Meta
  deleteMetaTemplate(name) {
    return this.request('/meta/delete-template/' + encodeURIComponent(name), { method:'DELETE' });
  },

  // Users Management
  getUsers() { return this.request('/users'); },
  createUser(data) { return this.request('/users', { method:'POST', body:JSON.stringify(data) }); },
  updateUser(id, data) { return this.request('/users/'+id, { method:'PATCH', body:JSON.stringify(data) }); },
  deleteUser(id) { return this.request('/users/'+id, { method:'DELETE' }); },

  // Analytics
  getAnalyticsOverview(period=30) { return this.request('/analytics/overview?period='+period); },
  getAnalyticsFunnel(period=30) { return this.request('/analytics/funnel?period='+period); },
  getAnalyticsChart(period=30, metric='leads') { return this.request('/analytics/chart?period='+period+'&metric='+metric); },
  getAnalyticsSources(period=30) { return this.request('/analytics/sources?period='+period); },
  getAnalyticsPerformance(period=30) { return this.request('/analytics/performance?period='+period); },
  getAnalyticsPipelineVelocity(period=30) { return this.request('/analytics/pipeline-velocity?period='+period); },

  // WhatsApp Analytics
  getWhatsAppMetrics(period=30) { return this.request('/analytics/whatsapp-metrics?period='+period); },
  getWAFunnel(period=30) { return this.request('/analytics/wa-funnel?period='+period); },
  getCRMBottlenecks(period=30) { return this.request('/analytics/crm-bottlenecks?period='+period); },

  // A/B Tests
  getABTests() { return this.request('/analytics/ab-tests'); },
  getABTest(id) { return this.request('/analytics/ab-tests/'+id); },
  createABTest(data) { return this.request('/analytics/ab-tests', { method:'POST', body:JSON.stringify(data) }); },
  updateABTest(id, data) { return this.request('/analytics/ab-tests/'+id, { method:'PATCH', body:JSON.stringify(data) }); },
};