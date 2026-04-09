#!/bin/bash
set -e
echo "========================================="
echo "  SETUP: Fail2ban + SSH Hardening"
echo "========================================="
echo ""

# 1. Instalar fail2ban
echo "[1/4] Instalando fail2ban..."
apt-get update -qq
apt-get install -y -qq fail2ban

# 2. Copiar configs
echo "[2/4] Configurando fail2ban..."
cp jail.local /etc/fail2ban/jail.local
cp filter-portscan.conf /etc/fail2ban/filter.d/portscan.conf

# 3. Ativar e iniciar
echo "[3/4] Ativando fail2ban..."
systemctl enable fail2ban
systemctl restart fail2ban

# 4. Verificar
echo "[4/4] Verificando..."
sleep 2
fail2ban-client status
echo ""

echo "========================================="
echo "  Fail2ban instalado e ativo!"
echo ""
echo "  Jails ativos:"
fail2ban-client status | grep "Jail list"
echo ""
echo "  Comandos uteis:"
echo "    fail2ban-client status sshd     # ver bans SSH"
echo "    fail2ban-client set sshd unbanip IP  # desbanir"
echo "    tail -f /var/log/fail2ban.log   # ver log"
echo ""
echo "  ============================================"
echo "  SSH HARDENING (MANUAL - CUIDADO!):"
echo "  ============================================"
echo "  1. Gerar chave SSH no seu PC:"
echo "     ssh-keygen -t ed25519 -C \"sergio@checkup360\""
echo "     ssh-copy-id root@YOUR_VPS_IP"
echo ""
echo "  2. Testar login com chave em OUTRA sessao:"
echo "     ssh root@YOUR_VPS_IP"
echo ""
echo "  3. SO DEPOIS de confirmar que chave funciona:"
echo "     nano /etc/ssh/sshd_config"
echo "     -> PasswordAuthentication no"
echo "     -> MaxAuthTries 3"
echo "     systemctl reload sshd"
echo ""
echo "  ATENCAO: Se errar, pode perder acesso!"
echo "  Sempre testar em sessao separada antes."
echo "========================================="
