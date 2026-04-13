/**
 * CC360 — UTM & Meta Cookie Passthrough para Checkout Externo (Greenn)
 *
 * Incluir em TODAS as LPs antes do </body>:
 * <script src="/tracking-passthrough.js"></script>
 *
 * O que faz:
 * 1. Captura UTMs, fbclid, gclid, _fbp, _fbc da URL/cookies
 * 2. Appenda em todos os links de saida (greenn, payfast, etc)
 * 3. Intercepta cliques em botoes que fazem window.location.href
 * 4. Persiste em sessionStorage pra sobreviver navegacao interna
 */
(function() {
  'use strict';

  // --- Helpers ---
  function getCookie(name) {
    var m = document.cookie.match('(^|;)\\s*' + name + '=([^;]+)');
    return m ? m[2] : null;
  }

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax;Secure';
  }

  // --- Captura de parametros ---
  var params = new URLSearchParams(window.location.search);

  // UTMs
  var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var trackingData = {};

  utmKeys.forEach(function(key) {
    var val = params.get(key);
    if (val) trackingData[key] = val;
  });

  // fbclid → gerar _fbc cookie
  var fbclid = params.get('fbclid');
  if (fbclid) {
    trackingData.fbclid = fbclid;
    var fbc = 'fb.1.' + Date.now() + '.' + fbclid;
    setCookie('_fbc', fbc, 90);
  }

  // gclid
  var gclid = params.get('gclid');
  if (gclid) trackingData.gclid = gclid;

  // _fbp — gerar se nao existir
  if (!getCookie('_fbp')) {
    var fbp = 'fb.1.' + Date.now() + '.' + (Math.floor(Math.random() * 9000000000) + 1000000000);
    setCookie('_fbp', fbp, 90);
  }

  // Pegar cookies _fbp e _fbc (podem ja existir de visita anterior)
  var fbpCookie = getCookie('_fbp');
  var fbcCookie = getCookie('_fbc');
  if (fbpCookie) trackingData.fbp = fbpCookie;
  if (fbcCookie) trackingData.fbc = fbcCookie;

  // Persistir em sessionStorage (sobrevive navegacao interna tipo /checkupfin → /direto)
  var stored = {};
  try { stored = JSON.parse(sessionStorage.getItem('_cc360_tracking') || '{}'); } catch(e) {}

  // Merge: URL params tem prioridade sobre stored
  var merged = {};
  Object.keys(stored).forEach(function(k) { if (stored[k]) merged[k] = stored[k]; });
  Object.keys(trackingData).forEach(function(k) { if (trackingData[k]) merged[k] = trackingData[k]; });

  try { sessionStorage.setItem('_cc360_tracking', JSON.stringify(merged)); } catch(e) {}

  // --- Appendar em URLs de saida ---
  function appendParams(url) {
    if (!url) return url;
    var keys = Object.keys(merged);
    if (keys.length === 0) return url;

    var separator = url.indexOf('?') === -1 ? '?' : '&';
    var qs = keys.map(function(k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(merged[k]);
    }).join('&');

    return url + separator + qs;
  }

  function isExternalCheckout(url) {
    if (!url) return false;
    return url.indexOf('greenn.com') !== -1 ||
           url.indexOf('payfast.') !== -1 ||
           url.indexOf('hotmart.com') !== -1 ||
           url.indexOf('pay.hotmart.com') !== -1;
  }

  // --- Processar links existentes no DOM ---
  function processLinks() {
    document.querySelectorAll('a[href]').forEach(function(link) {
      if (isExternalCheckout(link.href) && !link.dataset.trackingAppended) {
        link.href = appendParams(link.href);
        link.dataset.trackingAppended = '1';
      }
    });
  }

  // Processar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processLinks);
  } else {
    processLinks();
  }

  // Observer pra links adicionados dinamicamente (raro, mas seguro)
  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function(mutations) {
      var hasNewLinks = false;
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(n) {
          if (n.nodeType === 1 && (n.tagName === 'A' || n.querySelector && n.querySelector('a'))) {
            hasNewLinks = true;
          }
        });
      });
      if (hasNewLinks) processLinks();
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }

  // --- Interceptar window.location.href assignments (usado em consultasob/consultacob) ---
  // Expor funcao global pra botoes que usam JS redirect
  window._cc360CheckoutUrl = function(baseUrl) {
    return appendParams(baseUrl);
  };

  // Expor dados pra debug
  window._cc360Tracking = merged;
})();
