#!/bin/bash
set -e
echo "========================================="
echo "  SETUP: Flowise (RAG / Knowledge Base)"
echo "========================================="
echo ""

DEPLOY_DIR=/opt/flowise
NGINX_CONF=/etc/nginx/sites-available/flowise.checkup360.online

# 1. Backup do PostgreSQL (REGRA: backup ANTES de qualquer alteracao)
echo "[1/6] Backup do PostgreSQL..."
docker exec postgres pg_dumpall -U postgres > /opt/backups/pre_flowise_$(date +%Y%m%d_%H%M%S).sql
echo "  Backup concluido!"

# 2. Criar database e extensao pgvector
echo "[2/6] Criando database flowise com pgvector..."
docker exec -i postgres psql -U postgres <<'SQL'
-- Criar database se nao existe
SELECT 'CREATE DATABASE flowise' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'flowise')\gexec

-- Conectar e criar extensao
\c flowise
CREATE EXTENSION IF NOT EXISTS vector;
SQL
echo "  Database flowise criado com pgvector!"

# 3. Criar diretorio e copiar compose
echo "[3/6] Criando diretorio $DEPLOY_DIR..."
mkdir -p $DEPLOY_DIR
cp docker-compose.yml $DEPLOY_DIR/

# 4. Subir container
echo "[4/6] Subindo Flowise..."
cd $DEPLOY_DIR
docker compose up -d

# 5. Aguardar health
echo "[5/6] Aguardando container ficar healthy..."
sleep 8
for i in $(seq 1 15); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' flowise 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    echo "  Container healthy!"
    break
  fi
  echo "  Status: $STATUS (tentativa $i/15)..."
  sleep 5
done

# 6. Configurar Nginx (opcional)
echo "[6/6] Configurando Nginx..."
if [ ! -f "$NGINX_CONF" ]; then
  cp nginx-flowise.conf $NGINX_CONF
  ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  echo "  Nginx configurado!"
  echo "  Para SSL: sudo certbot --nginx -d flowise.checkup360.online"
else
  echo "  Config Nginx ja existe, pulando..."
fi

echo ""
echo "========================================="
echo "  Flowise instalado!"
echo ""
echo "  Acesso local: http://localhost:3100"
echo "  Login: admin / YOUR_FLOWISE_PASSWORD"
echo ""
echo "  SSH tunnel: ssh -L 3100:127.0.0.1:3100 root@YOUR_VPS_IP"
echo "  Publico (apos DNS+SSL): https://flowise.checkup360.online"
echo ""
echo "  PROXIMOS PASSOS:"
echo "  1. Acessar o Flowise e configurar Gemini API key"
echo "  2. Criar chatflow RAG:"
echo "     - Document Loader (PDF/Text) -> Text Splitter"
echo "     - -> Gemini Embedding -> pgvector (Vector Store)"
echo "     - -> Conversational Retrieval QA -> Gemini Chat"
echo "  3. Upload dos docs dos produtos KSI"
echo "  4. Testar: perguntar sobre produtos"
echo "  5. Integrar com N8N (HTTP Request -> Flowise API)"
echo "========================================="
