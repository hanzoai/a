# a.hanzo.ai — the drop-in Hanzo widget CDN. A self-contained static bundle (the
# tiny loaders, the Ask-AI bubble, the vendored widget builds, the gallery),
# served by the canonical Hanzo static server, ghcr.io/hanzoai/static (scratch +
# Go binary, NO nginx): nosniff + security headers, Access-Control-Allow-Origin:*
# so any site can load a loader cross-origin, immutable-ish caching, GET /healthz.
# Listens on :3000; the `a` Service maps servicePort 80 -> 3000.
#
# Base 0.4.1 is the canonical, pullable static image (the one 16+ Hanzo static
# sites share). It serves /chat.js, /analytics.js, /checkout.js with the correct
# text/javascript type TODAY. The clean, extensionless one-liner (/chat) needs
# static's ".js" clean-URL fallback (hanzoai/static branch feat/js-clean-url-
# fallback): after that ships as a new static image, bump this ONE line to it and
# /chat, /analytics, /checkout light up. Nothing else changes.
#
# Built on Hanzo's own hardware (in-cluster BuildKit via hanzoai/ci), never on
# GitHub builders:
#   buildctl build --frontend=dockerfile.v0 \
#     --opt=context=https://github.com/hanzoai/a.git#<sha> \
#     --opt=filename=Dockerfile --opt=platform=linux/amd64 \
#     --output=type=image,name=ghcr.io/hanzoai/a:<tag>,push=true
FROM ghcr.io/hanzoai/static:0.4.1
COPY site /public
EXPOSE 3000
ENTRYPOINT ["/static", "-port", "3000", "-root", "/public"]
