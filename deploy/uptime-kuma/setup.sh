#!/bin/bash
set -e
echo "========================================="
echo "  SETUP: Uptime Kuma (Monitoring)"
echo "========================================="
echo ""

DEPLOY_DIR=/opt/uptime-kuma
NGINX_CONF=/etc/nginx/sites-available/status.checkup360.online

# 1. Criar diretorio
echo "[1/5] Criando diretorio $DEPLOY_DIR..."
mkdir -p $DEPLOY_DIR
cp docker-compose.yml $DEPLOY_DIR/

# 2. Subir container
echo "[2/5] Subindo Uptime Kuma..."
cd $DEPLOY_DIR
docker compose up -d

# 3. Aguardar health
echo "[3/5] Aguardando container ficar healthy..."
sleep 5
for i in $(seq 1 12); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' uptime-kuma 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    echo "  Container healthy!"
    break
  fi
  echo "  Status: $STATUS (tentativa $i/12)..."
  sleep 5
done

# 4. Configurar Nginx
echo "[4/5] Configurando Nginx..."
if [ ! -f "$NGINX_CONF" ]; then
  cp nginx-uptime-kuma.conf $NGINX_CONF
  ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  echo "  Nginx configurado!"
else
  echo "  Config Nginx ja existe, pulando..."
fi

# 5. SSL (opcional - requer DNS apontando)
echo "[5/5] SSL..."
echo "  Para ativar HTTPS, execute:"
echo "  sudo certbot --nginx -d status.checkup360.online"
echo ""

echo "========================================="
echo "  Uptime Kuma instalado!"
echo ""
echo "  Acesso local: http://localhost:3390"
echo "  Acesso SSH tunnel: ssh -L 3390:127.0.0.1:3390 root@YOUR_VPS_IP"
echo "  Acesso publico (apos DNS+SSL): https://status.checkup360.online"
echo ""
echo "  PROXIMO PASSO: Abrir http://localhost:3390 e criar usuario admin"
echo "========================================="
