/*
 * a.hanzo.ai/checkout — <script src=".../checkout" data-key="pk_..."></script>
 * Loads checkout.js@2.1.22 (window.HanzoCheckout), creates a client, exposes
 * window.hanzoCheckout. Auto-binds any [data-hanzo-checkout] button for a
 * zero-JS hosted checkout — card fields live on Hanzo's page, never the host DOM:
 *   <button data-hanzo-checkout data-slug="tee" data-name="Tee" data-price="29">Buy</button>
 * data-key is a publishable pk_ key — never a secret. data-price is in dollars.
 * Button opts: data-qty, data-currency, data-success, data-cancel. Script opts:
 * data-host, data-currency, data-theme, data-color. Never throws into the page.
 */
(function () {
  'use strict';
  if (window.__hanzoCheckout) return;
  var self = document.currentScript;
  if (!self) return;
  window.__hanzoCheckout = true;

  var origin = new URL(self.src, location.href).origin;
  var d = self.dataset || {};
  var key = (d.key || '').trim();

  if (!key) {
    console.warn('[hanzo/checkout] missing data-key — add data-key="pk_…" (a publishable key). Not loaded.');
    return;
  }
  if (/^(hk-|sk-|fw_)/i.test(key)) {
    console.error('[hanzo/checkout] data-key looks like a SECRET key — never expose hk-/sk-/fw_ keys in a browser. Use a publishable pk_ key. Aborted.');
    return;
  }

  var host = (d.host || 'https://api.hanzo.ai').replace(/\/+$/, '');
  var currency = d.currency || 'USD';

  var s = document.createElement('script');
  s.async = true;
  s.src = origin + '/vendor/checkout.global.js';
  s.onload = function () {
    try {
      var C = window.HanzoCheckout;
      if (!C || !C.create) { console.warn('[hanzo/checkout] checkout build loaded without HanzoCheckout.create.'); return; }
      var client = C.create({ apiKey: key, baseUrl: host, currency: currency, appearance: { theme: d.theme || 'light', primaryColor: d.color || '#000' } });
      window.hanzoCheckout = client; // custom carts: client.createSession(...).then(client.redirectToCheckout)
    } catch (e) {
      console.warn('[hanzo/checkout] init failed:', e && e.message);
    }
  };
  s.onerror = function () { console.warn('[hanzo/checkout] failed to load checkout build from ' + origin + '/vendor/checkout.global.js'); };
  (document.head || document.documentElement).appendChild(s);

  // Zero-JS drop-in: one delegated listener opens a hosted session for a tagged
  // button. Survives dynamically-added buttons; app-owned carts ignore this and
  // drive window.hanzoCheckout directly.
  document.addEventListener('click', function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest('[data-hanzo-checkout]') : null;
    if (!t) return;
    var client = window.hanzoCheckout;
    if (!client) { console.warn('[hanzo/checkout] not ready yet.'); return; }
    var b = t.dataset || {};
    var price = Number(b.price);
    if (!b.slug && !b.name) { console.warn('[hanzo/checkout] [data-hanzo-checkout] needs data-slug or data-name.'); return; }
    ev.preventDefault();
    var item = { productSlug: b.slug, id: b.slug || b.name, name: b.name || b.slug, quantity: Number(b.qty) || 1 };
    // A slug'd item is repriced server-side from the catalog — never send a client
    // data-price for it (would let a forged data-price="0.01" set the charge). The
    // client price is honored ONLY for a slug-less ad-hoc amount, where the price
    // IS the request (custom "pay this" with no catalog entry to reprice against).
    if (!b.slug && !isNaN(price)) item.unitPrice = Math.round(price * 100);
    var here = location.origin + location.pathname;
    try {
      client.createSession({
        lineItems: [item],
        currency: b.currency || currency,
        successUrl: b.success || (here + '?checkout=success'),
        cancelUrl: b.cancel || (here + '?checkout=cancel'),
        metadata: { source: location.hostname }
      }).then(function (session) { return client.redirectToCheckout(session); })
        .catch(function (e) { console.warn('[hanzo/checkout] session failed:', e && (e.status || e.message)); });
    } catch (e) { console.warn('[hanzo/checkout] session error:', e && e.message); }
  }, true);
})();
