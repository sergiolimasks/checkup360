// Shared utilities - Checkup360 Admin
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('pt-BR');
}

function formatDateTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('pt-BR');
}

function spinnerHtml(msg) {
  return '<div class="loading"><div class="spinner"></div>' + (msg ? '<p>' + msg + '</p>' : '') + '</div>';
}

function errorHtml(msg) {
  return '<div class="loading" style="color:#f87171">Erro: ' + esc(msg) + '</div>';
}
