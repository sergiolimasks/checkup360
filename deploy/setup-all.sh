#!/bin/bash
# =========================================
# MASTER SETUP — Checkup360 Infrastructure
# =========================================
# Executa todos os setups em ordem segura.
# Rodar no VPS: bash setup-all.sh
#
# Ordem:
#   1. Fechar PostgreSQL 5432 (seguranca critica)
#   2. Fail2ban (protecao SSH)
#   3. Portainer (Docker UI)
#   4. Uptime Kuma (monitoring)
#   5. Flowise (RAG para produtos KSI)
#
# REGRA: Cada step pede confirmacao antes de executar.
# =========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

confirm() {
  echo -e "${YELLOW}$1${NC}"
  read -p "Continuar? (s/n): " choice
  case "$choice" in
    s|S|sim|y|Y|yes) return 0 ;;
    *) echo "Pulando..."; return 1 ;;
  esac
}

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  CHECKUP360 — Infrastructure Setup${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Este script vai configurar:"
echo "  1. Fechar PostgreSQL 5432 (CRITICO)"
echo "  2. Fail2ban (protecao SSH)"
echo "  3. Portainer (Docker UI)"
echo "  4. Uptime Kuma (monitoring)"
echo "  5. Flowise (RAG/Knowledge Base)"
echo ""
echo -e "${RED}IMPORTANTE: Certifique-se de que tem OUTRA sessao SSH aberta${NC}"
echo -e "${RED}como backup caso algo de errado.${NC}"
echo ""

# =========================================
# PRE-CHECK
# =========================================
echo "=== PRE-CHECK ==="
echo "  Docker: $(docker --version 2>/dev/null || echo 'NAO ENCONTRADO')"
echo "  Nginx: $(nginx -v 2>&1 || echo 'NAO ENCONTRADO')"
echo "  Disco: $(df -h / | awk 'NR==2 {print $4 " livre de " $2}')"
echo "  RAM: $(free -h | awk 'NR==2 {print $7 " disponivel de " $2}')"
echo ""

# =========================================
# BACKUP ANTES DE TUDO
# =========================================
echo "=== BACKUP PRE-SETUP ==="
mkdir -p /opt/backups
echo "  Fazendo backup do PostgreSQL..."
docker exec postgres pg_dumpall -U postgres > /opt/backups/pre_setup_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null && \
  echo -e "  ${GREEN}Backup OK!${NC}" || \
  echo -e "  ${YELLOW}AVISO: Backup falhou, mas continuando...${NC}"
echo ""

# =========================================
# 1. FECHAR POSTGRESQL
# =========================================
if confirm "[1/5] Fechar porta 5432 do PostgreSQL para acesso externo?"; then
  echo ""
  cd "$SCRIPT_DIR/security-postgres"
  bash setup.sh
  echo ""
fi

# =========================================
# 2. FAIL2BAN
# =========================================
if confirm "[2/5] Instalar e configurar Fail2ban?"; then
  echo ""
  cd "$SCRIPT_DIR/fail2ban"
  bash setup.sh
  echo ""
fi

# =========================================
# 3. PORTAINER
# =========================================
if confirm "[3/5] Instalar Portainer (Docker UI)?"; then
  echo ""
  cd "$SCRIPT_DIR/portainer"
  bash setup.sh
  echo ""
fi

# =========================================
# 4. UPTIME KUMA
# =========================================
if confirm "[4/5] Instalar Uptime Kuma (monitoring)?"; then
  echo ""
  cd "$SCRIPT_DIR/uptime-kuma"
  bash setup.sh
  echo ""
fi

# =========================================
# 5. FLOWISE
# =========================================
if confirm "[5/5] Instalar Flowise (RAG/Knowledge Base)?"; then
  echo ""
  cd "$SCRIPT_DIR/flowise"
  bash setup.sh
  echo ""
fi

# =========================================
# RESUMO FINAL
# =========================================
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  SETUP COMPLETO!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "  Novos containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "portainer|uptime-kuma|flowise" || echo "  (nenhum novo container detectado)"
echo ""
echo "  Fail2ban:"
fail2ban-client status 2>/dev/null | head -3 || echo "  (nao instalado)"
echo ""
echo "  Firewall DOCKER-USER:"
iptables -L DOCKER-USER -n 2>/dev/null | head -10 || echo "  (sem regras)"
echo ""
echo "  ============================================"
echo "  ACESSOS (via SSH tunnel):"
echo "  ============================================"
echo "  Portainer:   ssh -L 9443:127.0.0.1:9443 root@YOUR_VPS_IP"
echo "               -> https://localhost:9443"
echo ""
echo "  Uptime Kuma: ssh -L 3390:127.0.0.1:3390 root@YOUR_VPS_IP"
echo "               -> http://localhost:3390"
echo ""
echo "  Flowise:     ssh -L 3100:127.0.0.1:3100 root@YOUR_VPS_IP"
echo "               -> http://localhost:3100"
echo "               Login: admin / YOUR_FLOWISE_PASSWORD"
echo ""
echo "  PostgreSQL:  ssh -L 5432:127.0.0.1:5432 root@YOUR_VPS_IP"
echo "               -> psql -h localhost -U postgres"
echo ""
echo "  ============================================"
echo "  PROXIMOS PASSOS:"
echo "  ============================================"
echo "  1. Acessar Portainer e criar usuario admin"
echo "  2. Acessar Uptime Kuma e configurar monitors:"
echo "     - https://api.checkup360.online (HTTP)"
echo "     - https://checkup360.online (HTTP)"
echo "     - 127.0.0.1:5432 (TCP - PostgreSQL)"
echo "     - 127.0.0.1:6379 (TCP - Redis)"
echo "  3. Configurar notificacoes no Uptime Kuma (Telegram)"
echo "  4. Acessar Flowise e criar chatflow RAG"
echo "  5. Considerar SSH hardening (key-only)"
echo "========================================="
