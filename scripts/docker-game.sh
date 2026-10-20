#!/usr/bin/env bash
#
# docker-game.sh — run the CS2 Replica game site with Docker.
#
# The game (artifacts/3d-game) is a 100% client-side React Three Fiber app:
# it does not use @workspace/api-server nor Postgres. This script builds and
# serves only the game site.
#
# Usage: ./scripts/docker-game.sh <command>
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILE="docker-compose.yml"
SERVICE="game"
DEV_SERVICE="game-dev"

HOST_PORT="${GAME_PORT:-8080}"
DEV_HOST_PORT="${GAME_DEV_PORT:-5173}"
BASE_PATH="${GAME_BASE_PATH:-/}"

# --- pretty output ---------------------------------------------------------
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
    C_RESET=$'\033[0m'; C_BOLD=$'\033[1m'; C_DIM=$'\033[2m'
    C_RED=$'\033[31m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'; C_BLUE=$'\033[34m'
else
    C_RESET=""; C_BOLD=""; C_DIM=""
    C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""
fi

info()  { printf '%s==>%s %s\n' "$C_BLUE" "$C_RESET" "$*"; }
ok()    { printf '%s ok %s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn()  { printf '%s !! %s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
die()   { printf '%s xx %s %s\n' "$C_RED" "$C_RESET" "$*" >&2; exit 1; }
hint()  { printf '%s    %s%s\n' "$C_DIM" "$*" "$C_RESET"; }

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

usage() {
    cat <<EOF
${C_BOLD}CS2 Replica — Docker helper${C_RESET}

${C_BOLD}Uso:${C_RESET} ./scripts/docker-game.sh <comando>

${C_BOLD}Comandos:${C_RESET}
  ${C_BOLD}build${C_RESET}      Compila a imagem Docker do site do jogo
  ${C_BOLD}up${C_RESET}         Sobe o site do jogo (build + start)  ${C_DIM}[padrão]${C_RESET}
  ${C_BOLD}down${C_RESET}       Para e remove os containers
  ${C_BOLD}restart${C_RESET}    Recompila a imagem e reinicia o container
  ${C_BOLD}logs${C_RESET}       Mostra os logs do container ${C_DIM}(-f para seguir)${C_RESET}
  ${C_BOLD}status${C_RESET}     Mostra o estado dos containers
  ${C_BOLD}shell${C_RESET}      Abre um shell dentro do container do jogo
  ${C_BOLD}dev${C_RESET}        Sobe o Vite dev server com hot reload (porta ${DEV_HOST_PORT})
  ${C_BOLD}dev-logs${C_RESET}   Mostra os logs do dev server ${C_DIM}(-f para seguir)${C_RESET}
  ${C_BOLD}dev-down${C_RESET}   Para o dev server
  ${C_BOLD}clean${C_RESET}      Remove containers, volumes e imagens do projeto
  ${C_BOLD}help${C_RESET}       Mostra esta ajuda

${C_BOLD}Variáveis de ambiente:${C_RESET}
  GAME_PORT=${HOST_PORT}          Porta no host para o site (padrão: 8080)
  GAME_DEV_PORT=${DEV_HOST_PORT}  Porta no host para o dev server (padrão: 5173)
  GAME_BASE_PATH=${BASE_PATH}     Sub-path do site (padrão: /)

${C_BOLD}Exemplos:${C_RESET}
  ./scripts/docker-game.sh up
  GAME_PORT=3000 ./scripts/docker-game.sh up
  ./scripts/docker-game.sh dev
EOF
}

# --- preflight -------------------------------------------------------------
require_docker() {
    command -v docker >/dev/null 2>&1 || die "docker nao encontrado. Instale o Docker e tente novamente."
    docker compose version >/dev/null 2>&1 \
        || die "docker compose (v2) nao encontrado. Atualize o Docker."
    docker info >/dev/null 2>&1 \
        || die "O daemon do Docker nao esta rodando. Inicie o Docker e tente novamente."
}

# --- commands --------------------------------------------------------------
cmd_build() {
    require_docker
    info "Compilando a imagem do site do jogo..."
    compose build "$SERVICE"
    ok "Imagem pronta: cs2-replica/game:latest"
}

cmd_up() {
    require_docker
    info "Subindo o site do jogo (http://localhost:${HOST_PORT})..."
    compose up -d --build "$SERVICE"
    ok "Site do jogo no ar: ${C_BOLD}http://localhost:${HOST_PORT}${C_RESET}"
    hint "API server e banco de dados NAO sao necessarios (o jogo roda 100% no browser)."
    hint "Logs: ./scripts/docker-game.sh logs -f   |   Parar: ./scripts/docker-game.sh down"
}

cmd_down() {
    require_docker
    info "Parando o site do jogo..."
    compose down --remove-orphans
    ok "Containers removidos."
}

cmd_restart() {
    require_docker
    info "Recompilando e reiniciando..."
    compose up -d --build --force-recreate "$SERVICE"
    ok "Site do jogo no ar: ${C_BOLD}http://localhost:${HOST_PORT}${C_RESET}"
}

cmd_logs() {
    require_docker
    compose logs -f "$SERVICE"
}

cmd_status() {
    require_docker
    compose ps
    echo
    printf '%sContainer:%s cs2-replica-game   %sPorta:%s http://localhost:%s\n' \
        "$C_BOLD" "$C_RESET" "$C_BOLD" "$C_RESET" "$HOST_PORT"
}

cmd_shell() {
    require_docker
    if ! compose ps --status running --services | grep -qx "$SERVICE"; then
        die "O container do jogo nao esta rodando. Rode: ./scripts/docker-game.sh up"
    fi
    exec docker exec -it cs2-replica-game sh
}

cmd_dev() {
    require_docker
    info "Subindo o dev server do Vite (http://localhost:${DEV_HOST_PORT})..."
    compose --profile dev up --build -d "$DEV_SERVICE"
    ok "Dev server no ar: ${C_BOLD}http://localhost:${DEV_HOST_PORT}${C_RESET}"
    hint "Hot reload ativo: altere os arquivos em artifacts/3d-game/src."
    hint "Logs: ./scripts/docker-game.sh dev-logs -f   |   Parar: ./scripts/docker-game.sh dev-down"
}

cmd_dev_logs() {
    require_docker
    compose --profile dev logs -f "$DEV_SERVICE"
}

cmd_dev_down() {
    require_docker
    info "Parando o dev server..."
    compose --profile dev down --remove-orphans
    ok "Dev server parado."
}

cmd_clean() {
    require_docker
    info "Removendo containers, volumes e imagens do projeto..."
    compose --profile dev down --remove-orphans --volumes 2>/dev/null || true
    docker rm -f cs2-replica-game cs2-replica-game-dev 2>/dev/null || true
    docker image rm cs2-replica/game:latest cs2-replica/game-dev:latest 2>/dev/null || true
    ok "Limpeza concluida."
}

# --- dispatch --------------------------------------------------------------
main() {
    local cmd="${1:-up}"
    shift || true

    case "$cmd" in
        build)     cmd_build "$@" ;;
        up|start)  cmd_up "$@" ;;
        down|stop) cmd_down "$@" ;;
        restart)   cmd_restart "$@" ;;
        logs)      cmd_logs "$@" ;;
        status|ps) cmd_status "$@" ;;
        shell)     cmd_shell "$@" ;;
        dev)       cmd_dev "$@" ;;
        dev-logs)  cmd_dev_logs "$@" ;;
        dev-down)  cmd_dev_down "$@" ;;
        clean)     cmd_clean "$@" ;;
        help|-h|--help) usage ;;
        *)         usage; die "Comando desconhecido: $cmd" ;;
    esac
}

main "$@"
