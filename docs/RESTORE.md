# Backup Consulta Crédito - 2026-04-03

## Conteúdo
- **frontend/** - Todos os arquivos do admin panel (Hostinger FTP)
- **backend/backend-backup.tar.gz** - dist/, .env, package.json do Node.js API
- **database/consulta_credito_dump.sql** - Dump completo do schema consulta_credito
- **config/dotenv** - Arquivo .env do backend
- **config/api-proxy-nginx.conf** - Config do Nginx proxy

## Como Restaurar

### Frontend (Hostinger FTP)
```bash
cd frontend/
for f in *; do
  curl -T "$f" ftp://YOUR_FTP_HOST/admin/$f --user "YOUR_FTP_USER:YOUR_FTP_PASSWORD"
done
```

### Backend (VPS)
```bash
scp backend/backend-backup.tar.gz root@YOUR_VPS_IP:/tmp/
ssh root@YOUR_VPS_IP
cd /opt/consulta-credito-api
tar xzf /tmp/backend-backup.tar.gz
npm install --production
pm2 restart consulta-api
```

### Database
```bash
# Conectar no container postgres
docker exec -i $(docker ps -q -f name=postgres) psql -U postgres postgres < database/consulta_credito_dump.sql
```

### Nginx Config
```bash
scp config/api-proxy-nginx.conf root@YOUR_VPS_IP:/root/api-proxy-nginx.conf
# Recriar container nginx com a config atualizada
```

## Credenciais
> Credenciais armazenadas em local seguro (não versionadas). Consulte o .env.example para referência.
