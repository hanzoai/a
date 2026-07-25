/*
 * a.hanzo.ai/chat — <script src=".../chat" data-key="hz_..."></script>
 * Loads the Ask-AI bubble (/ask.js) and mounts a floating, Shadow-DOM chat that
 * streams from api.hanzo.ai/v1/chat/completions. data-key is an hz_ WIDGET key
 * (client-safe, bills the owner org) — never a secret. Idempotent; never throws.
 * Optional: data-model (default "enso"), data-title, data-greeting, data-accent,
 * data-endpoint.
 */
(function () {
  'use strict';
  if (window.__hanzoChat) return;
  var self = document.currentScript;
  if (!self) return;
  window.__hanzoChat = true;

  var origin = new URL(self.src, location.href).origin;
  var d = self.dataset || {};
  var key = (d.key || '').trim();

  if (!key) {
    console.warn('[hanzo/chat] missing data-key — add data-key="hz_…" (a client-safe widget key). Not loaded.');
    return;
  }
  if (/^(hk-|sk-)/.test(key)) {
    console.error('[hanzo/chat] data-key looks like a SECRET key — never expose hk-/sk- keys in a browser. Use an hz_ widget key. Aborted.');
    return;
  }
  if (key.indexOf('hz_') !== 0) {
    console.warn('[hanzo/chat] data-key does not start with "hz_" — the chat bubble expects a widget key. Continuing; the server is the source of truth.');
  }

  var cfg = {
    key: key,
    origin: origin,
    model: d.model || 'enso',
    title: d.title || 'Ask AI',
    greeting: d.greeting || '',
    accent: d.accent || '#000',
    endpoint: (d.endpoint || 'https://api.hanzo.ai/v1/chat/completions').trim()
  };

  var s = document.createElement('script');
  s.async = true;
  s.src = origin + '/ask.js';
  s.onload = function () {
    try {
      if (window.HanzoAsk && window.HanzoAsk.mount) window.HanzoAsk.mount(cfg);
      else console.warn('[hanzo/chat] Ask bubble loaded without HanzoAsk.mount.');
    } catch (e) {
      console.warn('[hanzo/chat] mount failed:', e && e.message);
    }
  };
  s.onerror = function () { console.warn('[hanzo/chat] failed to load Ask bubble from ' + origin + '/ask.js'); };
  (document.head || document.documentElement).appendChild(s);
})();
