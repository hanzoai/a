/*
 * a.hanzo.ai/ask.js — the Ask-AI chat bubble. Framework-free, Shadow-DOM
 * isolated, streaming. Loaded on demand by the /chat one-liner; call
 * window.HanzoAsk.mount({key, model, endpoint, title, greeting, accent, origin}).
 *
 * Streams from an OpenAI-compatible completions endpoint (default
 * api.hanzo.ai/v1/chat/completions) with the hz_ widget key as a bearer token.
 * Model output is rendered as TEXT (never innerHTML) so a reply can never inject
 * markup into the host page. The whole UI lives in a closed-ish shadow root so
 * host CSS/JS can neither style nor read it. It never throws into the host page.
 */
(function () {
  'use strict';
  if (window.HanzoAsk) return;

  function el(tag, props, kids) {
    var n = document.createElement(tag);
    if (props) for (var k in props) {
      if (k === 'style') n.setAttribute('style', props[k]);
      else if (k in n) n[k] = props[k];
      else n.setAttribute(k, props[k]);
    }
    (kids || []).forEach(function (c) { n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  function css(accent) {
    return '' +
      ':host{all:initial}' +
      '*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif}' +
      '.launch{position:fixed;right:20px;bottom:20px;width:56px;height:56px;border-radius:50%;background:' + accent + ';color:#fff;border:0;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;z-index:2147483000;transition:transform .12s ease}' +
      '.launch:hover{transform:scale(1.06)}' +
      '.launch svg{width:26px;height:26px}' +
      '.panel{position:fixed;right:20px;bottom:88px;width:380px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 120px);background:#fff;color:#0a0a0a;border:1px solid #e6e6e6;border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.24);display:none;flex-direction:column;overflow:hidden;z-index:2147483000}' +
      '.panel.open{display:flex}' +
      '.hd{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #eee;font-weight:600;font-size:15px}' +
      '.dot{width:9px;height:9px;border-radius:50%;background:' + accent + '}' +
      '.x{margin-left:auto;background:none;border:0;cursor:pointer;color:#888;font-size:20px;line-height:1;padding:2px 6px;border-radius:8px}' +
      '.x:hover{background:#f2f2f2;color:#111}' +
      '.log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}' +
      '.msg{max-width:85%;padding:10px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}' +
      '.me{align-self:flex-end;background:' + accent + ';color:#fff;border-bottom-right-radius:4px}' +
      '.ai{align-self:flex-start;background:#f4f4f5;color:#0a0a0a;border-bottom-left-radius:4px}' +
      '.ai.err{background:#fff1f0;color:#a8071a}' +
      '.cur::after{content:"▍";opacity:.5;animation:b 1s steps(2) infinite}' +
      '@keyframes b{50%{opacity:0}}' +
      '.ft{border-top:1px solid #eee}' +
      '.row{display:flex;gap:8px;padding:10px;align-items:flex-end}' +
      'textarea{flex:1;resize:none;border:1px solid #e2e2e2;border-radius:12px;padding:10px 12px;font-size:14px;max-height:120px;outline:none;color:#0a0a0a;background:#fff}' +
      'textarea:focus{border-color:' + accent + '}' +
      '.send{background:' + accent + ';color:#fff;border:0;border-radius:12px;padding:0 14px;height:40px;cursor:pointer;font-size:14px;font-weight:600}' +
      '.send:disabled{opacity:.4;cursor:default}' +
      '.pb{text-align:center;font-size:11px;color:#9b9b9b;padding:0 0 9px}' +
      '.pb a{color:#6b6b6b;text-decoration:none}' +
      '.pb a:hover{text-decoration:underline}' +
      '@media (prefers-color-scheme:dark){.panel{background:#0c0c0c;color:#f2f2f2;border-color:#242424}.hd{border-color:#1e1e1e}.ai{background:#1a1a1a;color:#f2f2f2}.ai.err{background:#2a1515;color:#ff9a8f}textarea{background:#141414;color:#f2f2f2;border-color:#2a2a2a}.x:hover{background:#1e1e1e}.ft{border-color:#1e1e1e}}';
  }

  function mount(cfg) {
    cfg = cfg || {};
    if (!cfg.key) { console.warn('[hanzo/ask] mount() called without a key.'); return; }
    if (window.__hanzoAskMounted) return; // one bubble per page
    window.__hanzoAskMounted = true;

    var accent = cfg.accent || '#000';
    var host = el('div', { 'data-hanzo-ask': '' });
    document.body.appendChild(host);
    var root = host.attachShadow({ mode: 'closed' });
    root.appendChild(el('style', { textContent: css(accent) }));

    var glyph = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    var launch = el('button', { className: 'launch', 'aria-label': 'Open ' + (cfg.title || 'Ask AI') });
    launch.innerHTML = glyph;

    var log = el('div', { className: 'log', role: 'log', 'aria-live': 'polite' });
    var ta = el('textarea', { rows: 1, placeholder: 'Ask a question…', 'aria-label': 'Message' });
    var send = el('button', { className: 'send', textContent: 'Send' });
    var closeBtn = el('button', { className: 'x', 'aria-label': 'Close', textContent: '×' });
    var panel = el('div', { className: 'panel', role: 'dialog', 'aria-label': cfg.title || 'Ask AI' }, [
      el('div', { className: 'hd' }, [el('span', { className: 'dot' }), cfg.title || 'Ask AI', closeBtn]),
      log,
      el('div', { className: 'ft' }, [
        el('div', { className: 'row' }, [ta, send]),
        el('div', { className: 'pb' }, [el('a', { href: 'https://hanzo.ai', target: '_blank', rel: 'noopener', textContent: 'Powered by Hanzo AI' })])
      ])
    ]);
    root.appendChild(launch);
    root.appendChild(panel);

    var history = [];
    var busy = false;

    function bubble(role, text) {
      var m = el('div', { className: 'msg ' + (role === 'user' ? 'me' : 'ai'), textContent: text || '' });
      log.appendChild(m); log.scrollTop = log.scrollHeight; return m;
    }
    function open(v) {
      panel.classList.toggle('open', v);
      if (v) { if (!log.childElementCount && cfg.greeting) bubble('assistant', cfg.greeting); setTimeout(function () { ta.focus(); }, 30); }
    }
    launch.addEventListener('click', function () { open(!panel.classList.contains('open')); });
    closeBtn.addEventListener('click', function () { open(false); });
    ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
      else if (e.key === 'Escape') { open(false); }
    });
    send.addEventListener('click', submit);

    function submit() {
      var text = ta.value.trim();
      if (!text || busy) return;
      ta.value = ''; ta.style.height = 'auto';
      bubble('user', text);
      history.push({ role: 'user', content: text });
      stream();
    }

    function stream() {
      busy = true; send.disabled = true;
      var out = bubble('assistant', ''); out.classList.add('cur');
      var acc = '';
      fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + cfg.key },
        body: JSON.stringify({ model: cfg.model, stream: true, messages: history })
      }).then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw { status: r.status, text: t }; });
        if (!r.body || !r.body.getReader) { // no streaming: read whole JSON
          return r.json().then(function (j) { acc = pick(j); out.textContent = acc; });
        }
        var reader = r.body.getReader(), dec = new TextDecoder(), buf = '';
        return (function pump() {
          return reader.read().then(function (res) {
            if (res.done) return;
            buf += dec.decode(res.value, { stream: true });
            var i;
            while ((i = buf.indexOf('\n\n')) !== -1) {
              var chunk = buf.slice(0, i); buf = buf.slice(i + 2);
              chunk.split('\n').forEach(function (line) {
                line = line.trim();
                if (line.indexOf('data:') !== 0) return;
                var data = line.slice(5).trim();
                if (!data || data === '[DONE]') return;
                try { var j = JSON.parse(data); var t = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content; if (t) { acc += t; out.textContent = acc; log.scrollTop = log.scrollHeight; } } catch (e) {}
              });
            }
            return pump();
          });
        })();
      }).then(function () {
        out.classList.remove('cur');
        if (acc) history.push({ role: 'assistant', content: acc });
        else { out.textContent = 'No response.'; out.classList.add('err'); }
      }).catch(function (e) {
        out.classList.remove('cur'); out.classList.add('err');
        var s = e && e.status;
        out.textContent = s === 401 || s === 403 ? 'This chat key is not authorized.' : 'Sorry — something went wrong. Please try again.';
        console.warn('[hanzo/ask] request failed', s || (e && e.message) || e);
      }).then(function () { busy = false; send.disabled = false; ta.focus(); });
    }

    function pick(j) { try { return j.choices[0].message.content || ''; } catch (e) { return ''; } }
  }

  window.HanzoAsk = { mount: mount };
})();
