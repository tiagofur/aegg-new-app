#!/bin/bash
#############################################
# VPS Setup Script for AEGG Application
# Based on ordo-todo deployment strategy
#############################################

set -e

echo "🚀 Starting VPS setup for AEGG application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Configuration
DEPLOY_USER="aegg"
DEPLOY_DIR="/opt/aegg"
BACKUP_DIR="/opt/aegg-backups"

echo -e "${YELLOW}📋 System update...${NC}"
apt-get update && apt-get upgrade -y

echo -e "${YELLOW}📦 Installing essential packages...${NC}"
apt-get install -y \
    curl \
    wget \
    git \
    ufw \
    fail2ban \
    unzip \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    net-tools

echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    usermod -aG docker $DEPLOY_USER
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

echo -e "${YELLOW}🐳 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

echo -e "${YELLOW}👤 Creating deploy user...${NC}"
if ! id "$DEPLOY_USER" &>/dev/null; then
    useradd -m -s /bin/bash $DEPLOY_USER
    usermod -aG docker $DEPLOY_USER
    echo -e "${GREEN}✅ User $DEPLOY_USER created${NC}"
else
    echo -e "${GREEN}✅ User $DEPLOY_USER already exists${NC}"
fi

echo -e "${YELLOW}🔒 Configuring Firewall (UFW)...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
echo "y" | ufw enable
echo -e "${GREEN}✅ Firewall configured${NC}"

echo -e "${YELLOW}🛡️  Configuring Fail2Ban...${NC}"
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
EOF
systemctl restart fail2ban
echo -e "${GREEN}✅ Fail2Ban configured${NC}"

echo -e "${YELLOW}📁 Creating deployment directories...${NC}"
mkdir -p $DEPLOY_DIR
mkdir -p $BACKUP_DIR
mkdir -p $DEPLOY_DIR/scripts
mkdir -p $DEPLOY_DIR/backups
chown -R $DEPLOY_USER:$DEPLOY_USER $DEPLOY_DIR
chown -R $DEPLOY_USER:$DEPLOY_USER $BACKUP_DIR
echo -e "${GREEN}✅ Directories created${NC}"

echo -e "${YELLOW}📜 Creating deploy script...${NC}"
cat > $DEPLOY_DIR/scripts/deploy.sh <<'DEPLOY_EOF'
#!/bin/bash
set -e

DEPLOY_DIR="/opt/aegg"
cd $DEPLOY_DIR

echo "📥 Pulling latest changes..."
git pull origin main

echo "🔐 Logging into GitHub Container Registry..."
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_REPOSITORY_OWNER --password-stdin

echo "📦 Pulling new Docker images..."
docker-compose -f docker-compose.prod.yml pull

echo "💾 Creating database backup..."
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $DB_USER $DB_NAME > /opt/aegg-backups/backup_$(date +%Y%m%d_%H%M%S).sql || true

echo "🔄 Restarting services..."
docker-compose -f docker-compose.prod.yml up -d

echo "🗄️  Running migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend npm run migration:run || echo "⚠️  No migrations to run"

echo "🧹 Cleaning old images..."
docker image prune -af --filter "until=72h"

echo "✅ Deployment completed!"
DEPLOY_EOF

chmod +x $DEPLOY_DIR/scripts/deploy.sh
chown $DEPLOY_USER:$DEPLOY_USER $DEPLOY_DIR/scripts/deploy.sh
echo -e "${GREEN}✅ Deploy script created${NC}"

echo -e "${YELLOW}⏰ Setting up automatic backups...${NC}"
cat > /etc/cron.d/aegg-backup <<'CRON_EOF'
# Database backup every day at 2 AM
0 2 * * * root cd /opt/aegg && docker-compose -f docker-compose.prod.yml run --rm backup > /dev/null 2>&1

# Cleanup old backups (keep last 7 days) every day at 3 AM
0 3 * * * root find /opt/aegg-backups -name "aegg_backup_*.sql.gz" -mtime +7 -delete

# Docker system cleanup every Sunday at 4 AM
0 4 * * 0 root docker system prune -af --volumes > /dev/null 2>&1
CRON_EOF
chmod 644 /etc/cron.d/aegg-backup
echo -e "${GREEN}✅ Automatic backups configured${NC}"

echo -e "${YELLOW}🔧 Enabling automatic security updates...${NC}"
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
echo -e "${GREEN}✅ Automatic security updates enabled${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ VPS Setup Completed Successfully!  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "1️⃣  Add your SSH public key to /home/$DEPLOY_USER/.ssh/authorized_keys"
echo "2️⃣  Copy docker-compose.prod.yml to $DEPLOY_DIR/"
echo "3️⃣  Create .env file in $DEPLOY_DIR/ with your secrets"
echo "4️⃣  Run: sudo -u $DEPLOY_USER -H sh -c 'cd $DEPLOY_DIR && docker-compose -f docker-compose.prod.yml up -d'"
echo ""
echo "📁 Deployment directory: $DEPLOY_DIR"
echo "👤 Deploy user: $DEPLOY_USER"
echo "💾 Backup directory: $BACKUP_DIR"
