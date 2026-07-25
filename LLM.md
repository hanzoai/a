# a — a.hanzo.ai drop-in widget CDN

One line of HTML drops a Hanzo widget onto any site. Tiny, framework-free,
Shadow-DOM isolated loaders that lazy-load an already-built widget and mount it.

```html
<script src="https://a.hanzo.ai/chat"      data-key="hz_..."></script>  <!-- Ask-AI chat bubble -->
<script src="https://a.hanzo.ai/analytics" data-key="pk_..."></script>  <!-- track.js + Annotate  -->
<script src="https://a.hanzo.ai/checkout"  data-key="pk_..."></script>  <!-- hosted checkout       -->
```

## Layout

- `site/` — the whole CDN (served at `/public` by `ghcr.io/hanzoai/static`):
  - `chat.js` — loader → injects `/ask.js` → mounts the Ask-AI bubble. `data-key` = **hz_** widget key.
  - `analytics.js` — loader → injects `/vendor/track.min.js` → `new HanzoTrack.Analytics().initialize({integrations:[{type:'native',token,host,product}]})` + `Annotate`. `data-key` = **pk_** ingest token.
  - `checkout.js` — loader → injects `/vendor/checkout.global.js` → `HanzoCheckout.create({apiKey})`; auto-binds `[data-hanzo-checkout]`. `data-key` = **pk_** publishable key.
  - `ask.js` — first-party, framework-free Shadow-DOM Ask-AI bubble. Streams `POST api.hanzo.ai/v1/chat/completions` (Bearer hz_ key), renders deltas as **text** (never innerHTML). "Powered by Hanzo AI".
  - `vendor/track.min.js` — `track.js@0.2.19` browser build (`window.HanzoTrack`), self-hosted.
  - `vendor/checkout.global.js` — `checkout.js@2.1.22` (`window.HanzoCheckout`), self-hosted.
  - `index.html` — snippet gallery, monochrome true-black, Copy buttons, live bubble preview.
  - `favicon.svg`, `robots.txt`.
- `Dockerfile` — `FROM ghcr.io/hanzoai/static:0.4.1` + `COPY site /public`, `/static -port 3000 -root /public`.
- `hanzo.yml` — canonical CI/CD (builds `ghcr.io/hanzoai/a`, rolls the `a` App CR at `a.hanzo.ai`).
- `.github/workflows/cicd.yml` — imports `hanzoai/ci` build.yml@v1.

## Keys — client-safe only, never a secret

| Widget    | Prefix | What it is                                   |
|-----------|--------|----------------------------------------------|
| chat      | `hz_`  | widget key — client-safe, bills owner org via WIDGET_KEY_OWNERS |
| analytics | `pk_`  | publishable, write-only ingest token         |
| checkout  | `pk_`  | publishable key (hosted checkout)            |

Every loader refuses a secret key (`hk-`/`sk-`) with a loud `console.error` and
aborts — secrets must never reach a browser. A missing key is one `console.warn`
and a clean no-op. Loaders never throw into the host page.

## URL scheme

`/chat.js`, `/analytics.js`, `/checkout.js` work on any static base (correct
`text/javascript` under `nosniff`). The clean, extensionless aliases (`/chat`,
`/analytics`, `/checkout`) need static's `.js` clean-URL fallback
(`hanzoai/static` branch `feat/js-clean-url-fallback`); bump the Dockerfile base
to the release that carries it and the aliases light up.

## Serving

`ghcr.io/hanzoai/static` sets `nosniff`, `X-Frame-Options: DENY`,
`Access-Control-Allow-Origin: *`, and a default CSP `default-src 'none'` (blocks
scripts). The gallery needs inline JS, so the `a` App CR sets `HANZO_STATIC_CSP`
(see `universe: infra/k8s/operator/crs/a.yaml`). The CDN carries no secrets.

## What functions without a funded org

The loaders and gallery are fully static and always work. To actually stream/
capture/charge you need a real client-safe key from an org: chat `hz_`
(a funded AI org), analytics `pk_` (an analytics org), checkout `pk_` (a
commerce org). Without a valid key each widget degrades gracefully.
