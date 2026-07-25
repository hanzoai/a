# a.hanzo.ai

Drop a Hanzo widget onto any site. One line.

```html
<script src="https://a.hanzo.ai/chat"      data-key="hz_..."></script>
<script src="https://a.hanzo.ai/analytics" data-key="pk_..."></script>
<script src="https://a.hanzo.ai/checkout"  data-key="pk_..."></script>
```

- **chat** — a floating Ask-AI bubble that streams from `api.hanzo.ai/v1/chat/completions`. `data-key` is a client-safe **hz_** widget key.
- **analytics** — zero-config event capture + Annotate, to `api.hanzo.ai/v1/analytics`. `data-key` is a publishable **pk_** ingest token.
- **checkout** — hosted checkout; tag any button `data-hanzo-checkout`. `data-key` is a publishable **pk_** key.

Each `src` is a tiny, framework-free loader that reads its `data-*`, refuses
secret keys, lazy-loads the widget, and mounts it inside a Shadow root so it can
never break the host page. Get a key at [hanzo.id](https://hanzo.id).

Served by `ghcr.io/hanzoai/static`. See [`LLM.md`](LLM.md) for internals.
