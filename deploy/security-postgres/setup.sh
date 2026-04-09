#!/bin/bash
set -e
echo "========================================="
echo "  SETUP: Fechar PostgreSQL 5432"
echo "========================================="
echo ""

# 1. Verificar estado atual
echo "[1/4] Verificando estado atual da porta 5432..."
echo "  Conexoes externas na porta 5432:"
ss -tlnp | grep 5432 || echo "  Nenhuma"
echo ""

# 2. Verificar se Docker esta usando DOCKER-USER chain
echo "[2/4] Verificando iptables DOCKER-USER..."
iptables -L DOCKER-USER -n 2>/dev/null || echo "  Chain DOCKER-USER nao existe (normal se Docker nao criou)"
echo ""

# 3. Adicionar regras
echo "[3/4] Adicionando regras iptables..."

# Limpar regras anteriores na DOCKER-USER (exceto RETURN)
# Cuidado: so limpar as regras que NOS adicionamos
echo "  Adicionando regras para PostgreSQL (5432)..."
iptables -I DOCKER-USER 1 -p tcp --dport 5432 -s 127.0.0.1 -j ACCEPT 2>/dev/null || true
iptables -I DOCKER-USER 2 -p tcp --dport 5432 -s 172.16.0.0/12 -j ACCEPT 2>/dev/null || true
iptables -I DOCKER-USER 3 -p tcp --dport 5432 -s 10.0.0.0/8 -j ACCEPT 2>/dev/null || true
iptables -I DOCKER-USER 4 -p tcp --dport 5432 -j DROP 2>/dev/null || true

echo "  Adicionando regras para Redis (6379)..."
iptables -I DOCKER-USER 5 -p tcp --dport 6379 -s 127.0.0.1 -j ACCEPT 2>/dev/null || true
iptables -I DOCKER-USER 6 -p tcp --dport 6379 -s 172.16.0.0/12 -j ACCEPT 2>/dev/null || true
iptables -I DOCKER-USER 7 -p tcp --dport 6379 -s 10.0.0.0/8 -j ACCEPT 2>/dev/null || true
iptables -I DOCKER-USER 8 -p tcp --dport 6379 -j DROP 2>/dev/null || true

# 4. Persistir regras
echo "[4/4] Persistindo regras..."
if command -v netfilter-persistent &> /dev/null; then
  netfilter-persistent save
  echo "  Regras salvas com netfilter-persistent"
elif [ -d /etc/iptables ]; then
  iptables-save > /etc/iptables/rules.v4
  echo "  Regras salvas em /etc/iptables/rules.v4"
else
  apt-get install -y -qq iptables-persistent
  iptables-save > /etc/iptables/rules.v4
  echo "  iptables-persistent instalado e regras salvas"
fi

echo ""
echo "========================================="
echo "  PostgreSQL 5432 e Redis 6379 FECHADOS!"
echo ""
echo "  Regras atuais DOCKER-USER:"
iptables -L DOCKER-USER -n --line-numbers 2>/dev/null
echo ""
echo "  VERIFICACAO:"
echo "  - Do VPS:   psql -h 127.0.0.1 -U postgres  (deve funcionar)"
echo "  - Externo:  psql -h YOUR_VPS_IP -U postgres (deve FALHAR)"
echo ""
echo "  Para acessar remotamente, use SSH tunnel:"
echo "  ssh -L 5432:127.0.0.1:5432 root@YOUR_VPS_IP"
echo "========================================="
