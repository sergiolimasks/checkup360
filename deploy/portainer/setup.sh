#!/bin/bash
set -e
echo "========================================="
echo "  SETUP: Portainer CE (Docker UI)"
echo "========================================="
echo ""

# 1. Criar volume
echo "[1/3] Criando volume..."
docker volume create portainer_data

# 2. Deploy container
echo "[2/3] Subindo Portainer..."
docker run -d \
  --name portainer \
  --restart unless-stopped \
  -p 127.0.0.1:9443:9443 \
  -p 127.0.0.1:8000:8000 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# 3. Verificar
echo "[3/3] Verificando..."
sleep 3
docker ps | grep portainer
echo ""

echo "========================================="
echo "  Portainer instalado!"
echo ""
echo "  ACESSO (via SSH tunnel):"
echo "  1. No seu PC, rodar:"
echo "     ssh -L 9443:127.0.0.1:9443 root@YOUR_VPS_IP"
echo ""
echo "  2. Abrir no browser:"
echo "     https://localhost:9443"
echo ""
echo "  3. Criar usuario admin no primeiro acesso"
echo ""
echo "  NOTA: Porta 9443 so acessivel via localhost"
echo "  (nao exposta para internet)"
echo "========================================="
