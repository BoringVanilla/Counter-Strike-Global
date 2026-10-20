# syntax=docker/dockerfile:1
#
# Docker image for the CS2 Replica game site (artifacts/3d-game).
#
# The game is a 100% client-side React Three Fiber app: it never talks to
# @workspace/api-server and never touches Postgres. This image therefore
# only installs the `3d-game` workspace package and serves the static Vite
# build with nginx.
#
# Targets:
#   runtime  -> production static site (default)
#   dev      -> Vite dev server with HMR

# --------------------------------------------------------------------------- #
# deps: install only the workspace packages the game site needs
# --------------------------------------------------------------------------- #
FROM node:24-slim AS deps
WORKDIR /app

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true

RUN npm install -g pnpm@10.34.7

# Only the manifests of the packages the game needs. Keeping this in its own
# layer means editing game source does not invalidate the dependency cache.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY artifacts/3d-game/package.json    artifacts/3d-game/package.json
COPY lib/api-client-react/package.json lib/api-client-react/package.json

# The trailing "..." pulls in workspace dependencies of 3d-game as well.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile \
      --filter "@workspace/3d-game..." \
      --store-dir=/pnpm/store

# --------------------------------------------------------------------------- #
# build: produce the static site
# --------------------------------------------------------------------------- #
FROM deps AS build

# vite.config.ts hard-requires both variables.
ARG BASE_PATH=/
ARG PORT=24982
ENV BASE_PATH=$BASE_PATH \
    PORT=$PORT \
    NODE_ENV=production

COPY . .

RUN pnpm --filter @workspace/3d-game run build \
 && test -f artifacts/3d-game/dist/public/index.html

# --------------------------------------------------------------------------- #
# runtime: serve the static build with nginx
# --------------------------------------------------------------------------- #
FROM nginx:1.27-alpine AS runtime

ARG BASE_PATH=/
ENV BASE_PATH=$BASE_PATH

# nginx's entrypoint renders /etc/nginx/templates/*.template with envsubst.
COPY docker/templates/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/artifacts/3d-game/dist/public/ /usr/share/nginx/html/

# When the site is served from a sub-path, mirror the files under it so the
# SPA fallback and the hashed assets keep resolving. The copy goes through a
# temp dir: copying the html dir into itself would recurse.
RUN set -eux; \
    base="${BASE_PATH%/}"; \
    if [ -n "$base" ]; then \
      mkdir -p /tmp/site; \
      cp -a /usr/share/nginx/html/. /tmp/site/; \
      mkdir -p "/usr/share/nginx/html${base}"; \
      cp -a /tmp/site/. "/usr/share/nginx/html${base}/"; \
      rm -rf /tmp/site; \
    fi

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- "http://127.0.0.1${BASE_PATH}" >/dev/null || exit 1

# --------------------------------------------------------------------------- #
# dev: Vite dev server with hot reload
# --------------------------------------------------------------------------- #
FROM deps AS dev

ARG PORT=5173
ENV PORT=$PORT \
    BASE_PATH=/ \
    NODE_ENV=development

COPY . .

EXPOSE $PORT

CMD ["sh", "-c", "pnpm --filter @workspace/3d-game run dev"]
