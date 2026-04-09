#!/bin/bash
# CC360 - Start Local Development Environment
# Uso: ./start-local.sh [comando]
# Comandos: up | down | db | api | rpa | rag | frontend | all | status | reset-db

set -e
CC360_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$CC360_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[CC360]${NC} $1"; }
warn() { echo -e "${YELLOW}[CC360]${NC} $1"; }
err() { echo -e "${RED}[CC360]${NC} $1"; }

# Check dependencies
check_deps() {
    for cmd in docker node npm; do
        if ! command -v $cmd &> /dev/null; then
            err "$cmd not found. Install it first."
            exit 1
        fi
    done
}

# Docker containers (PostgreSQL + Redis)
start_docker() {
    log "Starting PostgreSQL 16 + Redis 7..."
    docker compose up -d
    log "Waiting for PostgreSQL to be ready..."
    until docker exec cc360-postgres pg_isready -U postgres > /dev/null 2>&1; do
        sleep 1
    done
    log "Database ready on localhost:5433"
    log "Redis ready on localhost:6380"
}

stop_docker() {
    log "Stopping containers..."
    docker compose down
}

# Setup env files
setup_env() {
    if [ ! -f "$CC360_DIR/backend/.env" ]; then
        cp "$CC360_DIR/backend/.env.local" "$CC360_DIR/backend/.env"
        warn "Created backend/.env from .env.local — edit with real keys if needed"
    fi
    if [ ! -f "$CC360_DIR/rpa-service/.env" ]; then
        cp "$CC360_DIR/rpa-service/.env.local" "$CC360_DIR/rpa-service/.env"
        warn "Created rpa-service/.env from .env.local"
    fi
}

# Install dependencies
install_deps() {
    if [ ! -d "$CC360_DIR/backend/node_modules" ]; then
        log "Installing backend dependencies..."
        cd "$CC360_DIR/backend" && npm install
    fi
    if [ ! -d "$CC360_DIR/rpa-service/node_modules" ]; then
        log "Installing RPA dependencies..."
        cd "$CC360_DIR/rpa-service" && npm install
    fi
}

# Start API (consulta-credito-api)
start_api() {
    log "Starting consulta-credito-api on port 3001..."
    cd "$CC360_DIR/backend"
    npx tsx watch index.ts &
    echo $! > /tmp/cc360-api.pid
    log "API started (PID: $(cat /tmp/cc360-api.pid))"
}

# Start RPA
start_rpa() {
    log "Starting rpa-ksi on port 3050..."
    cd "$CC360_DIR/rpa-service"
    node index.js &
    echo $! > /tmp/cc360-rpa.pid
    log "RPA started (PID: $(cat /tmp/cc360-rpa.pid))"
}

# Start RAG
start_rag() {
    log "Starting rag-consultor on port 3200..."
    cd "$CC360_DIR/rag-service"
    node server.js &
    echo $! > /tmp/cc360-rag.pid
    log "RAG started (PID: $(cat /tmp/cc360-rag.pid))"
}

# Start frontend (simple HTTP server)
start_frontend() {
    log "Starting frontend on port 8080..."
    cd "$CC360_DIR/frontend"
    npx http-server -p 8080 -c-1 --cors &
    echo $! > /tmp/cc360-frontend.pid
    log "Frontend: http://localhost:8080"
    log "Admin:    http://localhost:8080/admin/"
    log "Landing:  http://localhost:8080/"
}

# Stop all services
stop_all() {
    for svc in api rpa rag frontend; do
        if [ -f "/tmp/cc360-$svc.pid" ]; then
            PID=$(cat /tmp/cc360-$svc.pid)
            if kill -0 $PID 2>/dev/null; then
                kill $PID
                log "Stopped $svc (PID: $PID)"
            fi
            rm -f /tmp/cc360-$svc.pid
        fi
    done
}

# Reset database
reset_db() {
    warn "Dropping and recreating database..."
    docker exec cc360-postgres psql -U postgres -c "DROP SCHEMA IF EXISTS consulta_credito CASCADE;"
    docker exec cc360-postgres psql -U postgres -f /docker-entrypoint-initdb.d/01-init.sql
    log "Database reset complete"
}

# Status
show_status() {
    echo ""
    log "=== CC360 Local Status ==="
    echo ""

    # Docker
    if docker ps --format '{{.Names}}' | grep -q cc360-postgres; then
        echo -e "  ${GREEN}●${NC} PostgreSQL  localhost:5433"
    else
        echo -e "  ${RED}●${NC} PostgreSQL  not running"
    fi

    if docker ps --format '{{.Names}}' | grep -q cc360-redis; then
        echo -e "  ${GREEN}●${NC} Redis       localhost:6380"
    else
        echo -e "  ${RED}●${NC} Redis       not running"
    fi

    # Services
    for svc in api:3001 rpa:3050 rag:3200 frontend:8080; do
        name="${svc%%:*}"
        port="${svc##*:}"
        if [ -f "/tmp/cc360-$name.pid" ] && kill -0 $(cat /tmp/cc360-$name.pid) 2>/dev/null; then
            echo -e "  ${GREEN}●${NC} $name\tlocalhost:$port"
        else
            echo -e "  ${RED}●${NC} $name\tnot running"
        fi
    done
    echo ""
}

# Main
case "${1:-all}" in
    up)        check_deps; start_docker ;;
    down)      stop_all; stop_docker ;;
    db)        start_docker ;;
    api)       setup_env; install_deps; start_api ;;
    rpa)       setup_env; install_deps; start_rpa ;;
    rag)       start_rag ;;
    frontend)  start_frontend ;;
    all)
        check_deps
        start_docker
        setup_env
        install_deps
        start_api
        start_rag
        start_frontend
        echo ""
        log "=== All services started ==="
        show_status
        warn "RPA not started by default (requires Puppeteer). Run: ./start-local.sh rpa"
        log "Press Ctrl+C to stop all services"
        wait
        ;;
    stop)      stop_all ;;
    status)    show_status ;;
    reset-db)  reset_db ;;
    *)
        echo "Usage: $0 {up|down|db|api|rpa|rag|frontend|all|stop|status|reset-db}"
        exit 1
        ;;
esac
