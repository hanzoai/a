/*
 * a.hanzo.ai/analytics — <script src=".../analytics" data-key="pk_..."></script>
 * Loads track.js@0.2.19 (window.HanzoTrack), inits the `native` integration to
 * api.hanzo.ai/v1/analytics, runs Annotate(). data-key is a publishable ingest
 * token (pk_) — never a secret. Idempotent; never throws into the host page.
 * Optional: data-host, data-product, data-annotate.
 */
(function () {
  'use strict';
  if (window.__hanzoAnalytics) return;
  var self = document.currentScript;
  if (!self) return;
  window.__hanzoAnalytics = true;

  var origin = new URL(self.src, location.href).origin;
  var d = self.dataset || {};
  var key = (d.key || '').trim();

  if (!key) {
    console.warn('[hanzo/analytics] missing data-key — add data-key="pk_…" (a publishable ingest token). Not loaded.');
    return;
  }
  if (/^(hk-|sk-|fw_)/i.test(key)) {
    console.error('[hanzo/analytics] data-key looks like a SECRET key — never expose hk-/sk-/fw_ keys in a browser. Use a publishable pk_ token. Aborted.');
    return;
  }

  var opts = {
    token: key,
    host: (d.host || 'https://api.hanzo.ai').replace(/\/+$/, ''),
    product: d.product || location.hostname
  };
  var annotate = d.annotate !== 'false';

  var s = document.createElement('script');
  s.async = true;
  s.src = origin + '/vendor/track.min.js';
  s.onload = function () {
    try {
      var T = window.HanzoTrack;
      if (!T || !T.Analytics) { console.warn('[hanzo/analytics] track build loaded without HanzoTrack.Analytics.'); return; }
      var a = new T.Analytics();
      a.initialize({ integrations: [{ type: 'native', token: opts.token, host: opts.host, product: opts.product }] });
      if (annotate && T.Annotate) { try { T.Annotate(a, {}); } catch (e) {} }
      window.hanzoAnalytics = a; // stable handle for manual a.track(name, params)
    } catch (e) {
      console.warn('[hanzo/analytics] init failed:', e && e.message);
    }
  };
  s.onerror = function () { console.warn('[hanzo/analytics] failed to load analytics build from ' + origin + '/vendor/track.min.js'); };
  (document.head || document.documentElement).appendChild(s);
})();
